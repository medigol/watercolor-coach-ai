-- Run after schema.sql in a disposable/local Supabase database as administrator.
-- Fixtures, permissive policies, quotas and results are all rolled back.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
('10000000-0000-4000-8000-000000000003','watercolor-feedback-test@example.invalid','{}');
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
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
do $$ declare response jsonb; u uuid := '10000000-0000-4000-8000-000000000003'; r uuid; begin
  -- No reservation or failed completion may consume a result.
  r := '20000000-0000-4000-8000-000000000011';
  response := public.claim_feedback_request(u,r);
  if response ->> 'status' <> 'claimed' then raise exception 'claim failed'; end if;
  response := public.claim_feedback_request(u,'20000000-0000-4000-8000-000000000012');
  if response ->> 'status' <> 'busy' then raise exception 'concurrent model calls allowed'; end if;
  begin
    perform public.complete_openai_feedback(u,r,'wrong_mode',null,u::text || '/image.png','{"title":"test"}');
    raise exception 'invalid mode accepted';
  exception when check_violation then null; end;
  perform public.release_feedback_request(u,r);
  -- Three successful commits, each retry returning the same result.
  for i in 1..3 loop
    r := ('20000000-0000-4000-8000-' || lpad((20+i)::text,12,'0'))::uuid;
    response := public.claim_feedback_request(u,r);
    if response ->> 'status' <> 'claimed' then raise exception 'reservation failed'; end if;
    response := public.complete_openai_feedback(u,r,'improve_painting','Composition',u::text || '/image.png','{"title":"Real feedback"}');
    if response ->> 'provider' <> 'openai' then raise exception 'real provider failed'; end if;
    perform public.complete_openai_feedback(u,r,'improve_painting',null,u::text || '/image.png','{"title":"duplicate"}');
  end loop;
  response := public.claim_feedback_request(u,'20000000-0000-4000-8000-000000000030');
  if response ->> 'status' <> 'limit' then raise exception 'fourth OpenAI request allowed'; end if;
  response := public.claim_feedback_request(u,'20000000-0000-4000-8000-000000000021');
  if response ->> 'status' <> 'existing' then raise exception 'saved retry blocked by quota'; end if;
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
  update public.usage_counters set free_results_used=0;
  get diagnostics n = row_count;
  if n <> 0 or (select free_results_used from public.usage_counters) <> 3 then raise exception 'client reset paid quota'; end if;
  update public.ai_results set provider='mock',result_json='{}' where provider='openai';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'real result modified by client'; end if;
end $$;
reset role;
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
