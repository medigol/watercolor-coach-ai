-- Run after schema.sql in a disposable/local Supabase database or the SQL Editor.
-- These checks roll back all fixture rows, policies, and temporary grants.
-- They use two synthetic accounts and simulate older permissive project policies.
begin;
do $$ begin
  if not exists(select 1 from storage.buckets where id = 'artworks' and not public
    and file_size_limit = 10485760
    and allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']) then
    raise exception 'private bucket configuration failed';
  end if;
  if exists(select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in ('profiles', 'artworks', 'ai_results', 'usage_counters')
    and not c.relrowsecurity) then raise exception 'user table RLS disabled'; end if;
  if (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'save_mock_artwork') <> 1 then
    raise exception 'ambiguous save RPC overloads';
  end if;
end $$;
-- Restrictive owner guards must survive permissive policies. All test changes
-- are transactional; do not remove an existing project's policies to run this.
create policy watercolor_test_broad_profiles on public.profiles for all to anon, authenticated using (true) with check (true);
create policy watercolor_test_broad_artworks on public.artworks for all to anon, authenticated using (true) with check (true);
create policy watercolor_test_broad_results on public.ai_results for all to anon, authenticated using (true) with check (true);
create policy watercolor_test_broad_usage on public.usage_counters for all to anon, authenticated using (true) with check (true);
create policy watercolor_test_broad_storage on storage.objects for all to anon, authenticated using (true) with check (true);
grant select on public.profiles, public.artworks, public.ai_results, public.usage_counters, storage.objects to anon;
insert into storage.buckets(id, name, public) values ('watercolor-rls-other-bucket', 'watercolor-rls-other-bucket', false);
insert into auth.users(id, email, raw_user_meta_data) values
('10000000-0000-4000-8000-000000000001', 'watercolor-rls-a@example.invalid', jsonb_build_object('display_name', repeat('a', 150))),
('10000000-0000-4000-8000-000000000002', 'watercolor-rls-b@example.invalid', '{}');
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
do $$ declare saved uuid; n integer; begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'profile isolation failed'; end if;
  if (select count(*) from public.usage_counters) <> 1 then raise exception 'counter provisioning failed'; end if;
  if (select char_length(display_name) from public.profiles) <> 100 then raise exception 'profile metadata limit failed'; end if;
  if not exists(select 1 from public.usage_counters where free_results_used = 0 and free_results_limit = 3) then
    raise exception 'counter defaults failed';
  end if;
  saved := public.save_mock_artwork('improve_painting', 'Lake House', 'Composition', null, '{"title":"Lake House"}', auth.uid());
  if (select count(*) from public.ai_results where artwork_id = saved) <> 1 then raise exception 'atomic save failed'; end if;
  begin
    insert into public.artworks(user_id,mode,title) values ('10000000-0000-4000-8000-000000000002','improve_painting','forbidden');
    raise exception 'cross-user artwork insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set email = 'changed@example.invalid';
    raise exception 'client profile email changes allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.profiles(id) values (auth.uid());
    raise exception 'client profile provisioning allowed';
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
    perform public.save_mock_artwork('improve_painting','changed account',null,null,'{}',
      '10000000-0000-4000-8000-000000000002');
    raise exception 'save with mismatched expected user allowed';
  exception when raise_exception then
    if sqlerrm <> 'Your account changed. Please try again.' then raise; end if;
  end;
  if (select count(*) from public.artworks) <> n then raise exception 'changed account save left an orphan artwork'; end if;
  begin
    perform public.save_mock_artwork('improve_painting','rollback',null,null,'[]');
    raise exception 'invalid result accepted';
  exception when check_violation then null; end;
  if (select count(*) from public.artworks) <> n then raise exception 'failed save left an orphan artwork'; end if;
  begin
    perform public.save_mock_artwork('improve_painting','foreign image',null,
      '10000000-0000-4000-8000-000000000002/check.png','{}');
    raise exception 'another user image path accepted';
  exception when check_violation then null; end;
  begin
    perform public.save_mock_artwork('improve_painting','signed URL',null,
      'https://example.invalid/storage/v1/object/sign/artworks/check.png?token=placeholder','{}');
    raise exception 'signed image URL accepted';
  exception when check_violation then null; end;
  if (select count(*) from public.artworks) <> n then raise exception 'invalid image path left an orphan artwork'; end if;
  perform set_config('test.artwork_id', saved::text, true);
  insert into public.artworks(user_id,mode,title) values (auth.uid(),'create_reference','unattached') returning id into saved;
  perform set_config('test.unattached_id', saved::text, true);
  insert into storage.objects(bucket_id,name) values ('artworks','10000000-0000-4000-8000-000000000001/check.png');
  insert into storage.objects(bucket_id,name) values ('watercolor-rls-other-bucket','shared/check.png');
  if not exists(select 1 from storage.objects where bucket_id = 'watercolor-rls-other-bucket') then
    raise exception 'artworks guard changed another bucket policy';
  end if;
  begin
    insert into storage.objects(bucket_id,name) values ('artworks','10000000-0000-4000-8000-000000000002/forbidden.png');
    raise exception 'cross-user storage upload allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects(bucket_id,name) values ('artworks','check.png');
    raise exception 'image outside user folder allowed';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
do $$ declare changed integer; begin
  if exists(select 1 from public.artworks) then raise exception 'cross-user artwork read allowed'; end if;
  if exists(select 1 from public.ai_results) then raise exception 'cross-user result read allowed'; end if;
  if exists(select 1 from storage.objects where bucket_id='artworks') then raise exception 'cross-user image read allowed'; end if;
  update public.profiles set display_name = 'forbidden' where id = '10000000-0000-4000-8000-000000000001';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'cross-user profile update allowed'; end if;
  update public.artworks set title = 'forbidden' where id = current_setting('test.artwork_id')::uuid;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'cross-user artwork update allowed'; end if;
  delete from public.artworks where id = current_setting('test.artwork_id')::uuid;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'cross-user artwork delete allowed'; end if;
  update public.ai_results set result_json = '{}' where artwork_id = current_setting('test.artwork_id')::uuid;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'cross-user result update allowed'; end if;
  delete from public.ai_results where artwork_id = current_setting('test.artwork_id')::uuid;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'cross-user result delete allowed'; end if;
  delete from storage.objects where bucket_id = 'artworks';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'cross-user image delete allowed'; end if;
  begin
    insert into public.ai_results(artwork_id,user_id,mode,result_json)
    values (current_setting('test.unattached_id')::uuid, auth.uid(), 'create_reference', '{}');
    raise exception 'cross-user result attachment allowed';
  exception when foreign_key_violation then null; end;
  perform public.save_mock_artwork('create_reference','Coastal Town',null,null,'{"title":"Coastal Town"}');
  if (select count(*) from public.artworks) <> 1 then raise exception 'second account save failed'; end if;
end $$;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  begin
    perform public.save_mock_artwork('improve_painting','missing session',null,null,'{}');
    raise exception 'authenticated role without session saved';
  exception when raise_exception then
    if sqlerrm <> 'Sign in required' then raise; end if;
  end;
  if exists(select 1 from public.artworks) then raise exception 'missing session artwork read allowed'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
  if exists(select 1 from public.profiles) or exists(select 1 from public.artworks)
    or exists(select 1 from public.ai_results) or exists(select 1 from public.usage_counters) then
    raise exception 'anonymous user data read allowed';
  end if;
  if exists(select 1 from storage.objects where bucket_id = 'artworks') then raise exception 'anonymous image read allowed'; end if;
  begin
    perform public.save_mock_artwork('improve_painting','anonymous',null,null,'{}');
    raise exception 'anonymous save allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
