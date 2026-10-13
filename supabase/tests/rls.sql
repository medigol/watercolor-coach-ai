-- Run after schema.sql in a disposable/local Supabase database or the SQL Editor.
-- These checks roll back all fixture rows. They use two synthetic accounts.
begin;
insert into auth.users(id, email, raw_user_meta_data) values
('10000000-0000-4000-8000-000000000001', 'watercolor-rls-a@example.invalid', '{}'),
('10000000-0000-4000-8000-000000000002', 'watercolor-rls-b@example.invalid', '{}');
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
do $$ declare saved uuid; n integer; begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'profile isolation failed'; end if;
  if (select count(*) from public.usage_counters) <> 1 then raise exception 'counter provisioning failed'; end if;
  saved := public.save_mock_artwork('improve_painting', 'Lake House', 'Composition', null, '{"title":"Lake House"}');
  if (select count(*) from public.ai_results where artwork_id = saved) <> 1 then raise exception 'atomic save failed'; end if;
  begin
    insert into public.artworks(user_id,mode,title) values ('10000000-0000-4000-8000-000000000002','improve_painting','forbidden');
    raise exception 'cross-user artwork insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.artworks set user_id='10000000-0000-4000-8000-000000000002' where id=saved;
    raise exception 'ownership transfer allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.usage_counters set free_results_limit=100;
    raise exception 'client quota changes allowed';
  exception when insufficient_privilege then null; end;
  select count(*) into n from public.artworks;
  begin
    perform public.save_mock_artwork('improve_painting','rollback',null,null,'[]');
    raise exception 'invalid result accepted';
  exception when check_violation then null; end;
  if (select count(*) from public.artworks) <> n then raise exception 'failed save left an orphan artwork'; end if;
  perform set_config('test.artwork_id', saved::text, true);
  insert into public.artworks(user_id,mode,title) values (auth.uid(),'create_reference','unattached') returning id into saved;
  perform set_config('test.unattached_id', saved::text, true);
  insert into storage.objects(bucket_id,name) values ('artworks','10000000-0000-4000-8000-000000000001/check.png');
  begin
    insert into storage.objects(bucket_id,name) values ('artworks','10000000-0000-4000-8000-000000000002/forbidden.png');
    raise exception 'cross-user storage upload allowed';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
do $$ begin
  if exists(select 1 from public.artworks) then raise exception 'cross-user artwork read allowed'; end if;
  if exists(select 1 from public.ai_results) then raise exception 'cross-user result read allowed'; end if;
  if exists(select 1 from storage.objects where bucket_id='artworks') then raise exception 'cross-user image read allowed'; end if;
  begin
    insert into public.ai_results(artwork_id,user_id,mode,result_json)
    values (current_setting('test.unattached_id')::uuid, auth.uid(), 'create_reference', '{}');
    raise exception 'cross-user result attachment allowed';
  exception when foreign_key_violation then null; end;
  perform public.save_mock_artwork('create_reference','Coastal Town',null,null,'{"title":"Coastal Town"}');
  if (select count(*) from public.artworks) <> 1 then raise exception 'second account save failed'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform public.save_mock_artwork('improve_painting','anonymous',null,null,'{}');
    raise exception 'anonymous save allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
