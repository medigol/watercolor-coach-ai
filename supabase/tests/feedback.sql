-- Run after schema.sql in a disposable/local Supabase database as administrator.
-- Fixtures, permissive policies, quotas and results are all rolled back.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
('10000000-0000-4000-8000-000000000003','watercolor-feedback-test@example.invalid','{}'),
('10000000-0000-4000-8000-000000000004','watercolor-feedback-other@example.invalid','{}');
do $$ declare signature text; begin
  foreach signature in array array[
    'public.claim_feedback_request(uuid,uuid)',
    'public.complete_openai_feedback(uuid,uuid,text,text,text,jsonb)',
    'public.release_feedback_request(uuid,uuid)'
  ] loop
    if has_function_privilege('anon', signature, 'EXECUTE')
      or has_function_privilege('authenticated', signature, 'EXECUTE')
      or not has_function_privilege('service_role', signature, 'EXECUTE') then
      raise exception 'incorrect server RPC privileges: %', signature;
    end if;
  end loop;
end $$;
create policy watercolor_feedback_test_broad_results on public.ai_results for all to authenticated using (true) with check (true);
-- Simulate broader grants and a permissive policy from a legacy/misconfigured project.
grant update(free_results_used, free_results_limit, active_request_id), insert(user_id), delete on public.usage_counters to authenticated;
create policy watercolor_feedback_test_broad_usage on public.usage_counters for all to authenticated using (true) with check (true);
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claim.role','authenticated',true);
do $$ declare response jsonb; n integer; begin
  response := public.save_mock_feedback('improve_painting','Lake House',null,null,'{"title":"Lake House"}',auth.uid(),'20000000-0000-4000-8000-000000000010');
  if response ->> 'provider' <> 'mock' then raise exception 'mock provider failed'; end if;
  perform public.save_mock_feedback('improve_painting','duplicate',null,null,'{"title":"duplicate"}',auth.uid(),'20000000-0000-4000-8000-000000000010');
  if (select count(*) from public.artworks) <> 1 then raise exception 'duplicate fallback save'; end if;
  if (select free_results_used from public.usage_counters) <> 0 then raise exception 'mock charged quota'; end if;
  if (select result_json ->> 'title' from public.ai_results where artwork_id='20000000-0000-4000-8000-000000000010') <> 'Lake House' then
    raise exception 'duplicate mock replaced saved data';
  end if;
  update public.usage_counters set free_results_used=0, free_results_limit=100, active_request_id=null;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'legacy column grants allowed quota changes'; end if;
  delete from public.usage_counters;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'legacy policies allowed counter deletion'; end if;
  begin
    insert into public.usage_counters(user_id) values (auth.uid());
    raise exception 'legacy grants allowed quota provisioning';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_mock_feedback(null,'invalid replay',null,null,'{}',auth.uid(),'20000000-0000-4000-8000-000000000010');
    raise exception 'invalid replay mode allowed';
  exception when raise_exception then
    if sqlerrm <> 'Invalid mode' then raise; end if;
  end;
  begin
    perform public.claim_feedback_request(auth.uid(),'20000000-0000-4000-8000-000000000011');
    raise exception 'client claim allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.complete_openai_feedback(auth.uid(),'20000000-0000-4000-8000-000000000011','improve_painting',null,auth.uid()::text || '/image.png','{"title":"forged"}');
    raise exception 'client server save allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.release_feedback_request(auth.uid(),'20000000-0000-4000-8000-000000000011');
    raise exception 'client release allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.ai_results set provider='openai';
    raise exception 'provider forgery allowed';
  exception when insufficient_privilege then null; end;
  insert into public.artworks(id,user_id,mode,title) values ('20000000-0000-4000-8000-000000000019',auth.uid(),'improve_painting','forged');
  begin
    insert into public.ai_results(artwork_id,user_id,mode,provider,result_json) values ('20000000-0000-4000-8000-000000000019',auth.uid(),'improve_painting','openai','{}');
    raise exception 'direct OpenAI result insert allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
-- The absolute free cap stays three, even if a server-side configuration is higher.
update public.usage_counters set free_results_limit=99 where user_id='10000000-0000-4000-8000-000000000003';
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
do $$ declare response jsonb; u uuid := '10000000-0000-4000-8000-000000000003'; r uuid; begin
  -- No reservation or failed completion may consume a result.
  r := '20000000-0000-4000-8000-000000000011';
  response := public.claim_feedback_request(u,r);
  if response ->> 'status' <> 'claimed' then raise exception 'claim failed'; end if;
  if (select free_results_used from public.usage_counters where user_id=u) <> 0 then raise exception 'claim charged quota'; end if;
  response := public.claim_feedback_request(u,r);
  if response ->> 'status' <> 'busy' then raise exception 'duplicate active claim allowed another model call'; end if;
  response := public.claim_feedback_request(u,'20000000-0000-4000-8000-000000000012');
  if response ->> 'status' <> 'busy' then raise exception 'concurrent model calls allowed'; end if;
  begin
    perform public.complete_openai_feedback(u,r,'wrong_mode',null,u::text || '/image.png','{"title":"test"}');
    raise exception 'invalid mode accepted';
  exception when check_violation then null; end;
  if exists(select 1 from public.artworks where id=r)
    or (select free_results_used from public.usage_counters where user_id=u) <> 0
    or (select active_request_id from public.usage_counters where user_id=u) is distinct from r then
    raise exception 'failed completion did not roll back result/quota/reservation';
  end if;
  perform public.release_feedback_request(u,'20000000-0000-4000-8000-000000000012');
  if (select active_request_id from public.usage_counters where user_id=u) is distinct from r then
    raise exception 'stale release cleared another request reservation';
  end if;
  perform public.release_feedback_request(u,r);
  if (select active_request_id from public.usage_counters where user_id=u) is not null
    or (select free_results_used from public.usage_counters where user_id=u) <> 0 then
    raise exception 'release failed or charged quota';
  end if;
  -- Three successful commits, each retry returning the same result.
  for i in 1..3 loop
    r := ('20000000-0000-4000-8000-' || lpad((20+i)::text,12,'0'))::uuid;
    response := public.claim_feedback_request(u,r);
    if response ->> 'status' <> 'claimed' then raise exception 'reservation failed'; end if;
    response := public.complete_openai_feedback(u,r,'improve_painting','Composition',u::text || '/image.png','{"title":"Real feedback"}');
    if response ->> 'provider' <> 'openai' then raise exception 'real provider failed'; end if;
    if (select free_results_used from public.usage_counters where user_id=u) <> i then raise exception 'successful result did not increment exactly once'; end if;
    response := public.complete_openai_feedback(u,r,'improve_painting',null,u::text || '/image.png','{"title":"duplicate"}');
    if response ->> 'provider' <> 'openai'
      or (select free_results_used from public.usage_counters where user_id=u) <> i
      or (select result_json ->> 'title' from public.ai_results where artwork_id=r) <> 'Real feedback' then
      raise exception 'saved retry charged quota or changed saved data';
    end if;
  end loop;
  response := public.claim_feedback_request(u,'20000000-0000-4000-8000-000000000030');
  if response ->> 'status' <> 'limit' then raise exception 'fourth OpenAI request allowed'; end if;
  response := public.claim_feedback_request(u,'20000000-0000-4000-8000-000000000021');
  if response ->> 'status' <> 'existing' or response ->> 'provider' <> 'openai' then raise exception 'saved OpenAI retry blocked by quota'; end if;
  response := public.claim_feedback_request(u,'20000000-0000-4000-8000-000000000010');
  if response ->> 'status' <> 'existing' or response ->> 'provider' <> 'mock' then raise exception 'saved mock retry blocked by quota'; end if;
  if (select free_results_used from public.usage_counters where user_id=u) <> 3
    or (select active_request_id from public.usage_counters where user_id=u) is not null then
    raise exception 'limit or existing replay changed quota/reservation';
  end if;
end $$;
reset role;
do $$ begin
 if (select free_results_used from public.usage_counters where user_id='10000000-0000-4000-8000-000000000003') <> 3 then raise exception 'quota count incorrect'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
do $$ declare response jsonb; n integer; begin
  response := public.save_mock_feedback('improve_painting','fallback',null,null,'{"title":"fallback"}',auth.uid(),'20000000-0000-4000-8000-000000000021');
  if response ->> 'provider' <> 'openai' then raise exception 'fallback overwrote real result'; end if;
  response := public.save_mock_feedback('create_reference','limit fallback',null,null,'{"title":"limit fallback"}',auth.uid(),'20000000-0000-4000-8000-000000000030');
  if response ->> 'provider' <> 'mock' then raise exception 'limit fallback provider incorrect'; end if;
  perform public.save_mock_feedback('create_reference','duplicate fallback',null,null,'{}',auth.uid(),'20000000-0000-4000-8000-000000000030');
  -- Opening old saved results is a read; it cannot consume a fresh result.
  perform result_json from public.ai_results where artwork_id in
    ('20000000-0000-4000-8000-000000000010','20000000-0000-4000-8000-000000000021','20000000-0000-4000-8000-000000000030');
  if (select free_results_used from public.usage_counters) <> 3 then raise exception 'mock fallback/reopening charged quota'; end if;
  update public.usage_counters set free_results_used=0;
  get diagnostics n = row_count;
  if n <> 0 or (select free_results_used from public.usage_counters) <> 3 then raise exception 'client reset paid quota'; end if;
  update public.ai_results set provider='mock',result_json='{}' where provider='openai';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'real result modified by client'; end if;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
do $$ begin
  if exists(select 1 from public.ai_results) then raise exception 'other account read saved results'; end if;
  begin
    perform public.save_mock_feedback('improve_painting','foreign retry',null,null,'{}',auth.uid(),'20000000-0000-4000-8000-000000000021');
    raise exception 'request ID belonging to another account reused';
  exception when unique_violation then null; end;
  if (select free_results_used from public.usage_counters) <> 0 or exists(select 1 from public.artworks) then
    raise exception 'foreign request collision charged quota or saved data';
  end if;
end $$;
reset role;
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
do $$ begin
  begin
    perform public.claim_feedback_request('10000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000021');
    raise exception 'server claim returned another account result';
  exception when raise_exception then
    if sqlerrm <> 'Invalid request' then raise; end if;
  end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
-- A crash must not permanently lock an account or consume quota.
update public.usage_counters set free_results_used=0, active_request_id='20000000-0000-4000-8000-000000000050', active_request_expires_at=now() - interval '1 second' where user_id='10000000-0000-4000-8000-000000000003';
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
do $$ declare response jsonb; begin
 begin
  perform public.complete_openai_feedback('10000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000050','improve_painting',null,'10000000-0000-4000-8000-000000000003/image.png','{"title":"Expired"}');
  raise exception 'expired completion allowed';
 exception when raise_exception then
  if sqlerrm <> 'Request expired' then raise; end if;
 end;
 response := public.claim_feedback_request('10000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000051');
 if response ->> 'status' <> 'claimed' then raise exception 'expired reservation not recoverable'; end if;
 perform public.release_feedback_request('10000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000051');
end $$;
reset role;
-- Simulate mock winning after a lost/slow Edge response; completion must return
-- that mock and must not charge quota. Also test an expired reservation.
update public.usage_counters set free_results_used=0 where user_id='10000000-0000-4000-8000-000000000003';
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
select public.claim_feedback_request('10000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000040');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select public.save_mock_feedback('create_reference','Coastal Town',null,null,'{"title":"Coastal Town"}',auth.uid(),'20000000-0000-4000-8000-000000000040');
reset role;
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
do $$ declare response jsonb; begin
 response := public.complete_openai_feedback('10000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000040','create_reference',null,'10000000-0000-4000-8000-000000000003/image.png','{"title":"Late model response"}');
 if response ->> 'provider' <> 'mock' then raise exception 'late response overwrote fallback'; end if;
 perform public.release_feedback_request('10000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000040');
end $$;
reset role;
do $$ begin
 if (select free_results_used from public.usage_counters where user_id='10000000-0000-4000-8000-000000000003') <> 0 then raise exception 'late response charged quota'; end if;
end $$;
rollback;
