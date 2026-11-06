-- ADDITIVE, NOT APPLIED TO PRODUCTION. Owner approval, backup and staged RLS
-- testing required. No changes to artworks, ai_results or usage_counters.
begin;
create table if not exists public.reference_generation_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false,
 attempt_limit integer not null default 0 check(attempt_limit between 0 and 100),
 attempts_reserved integer not null default 0 check(attempts_reserved>=0)
);
create table if not exists public.reference_generations (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','completed','failed','uncertain')),
 request_json jsonb not null,
 output_path text,
 output_metadata jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check ((status='completed' and output_path=user_id::text||'/'||id::text||'/generated.png' and output_metadata is not null)
     or (status<>'completed' and output_path is null and output_metadata is null))
);
create index if not exists reference_generations_owner on public.reference_generations(user_id,created_at desc);
alter table public.reference_generation_accounts enable row level security;
alter table public.reference_generations enable row level security;
revoke all on public.reference_generation_accounts,public.reference_generations from public,anon,authenticated;
grant select on public.reference_generation_accounts,public.reference_generations to authenticated;
grant all on public.reference_generation_accounts,public.reference_generations to service_role;
drop policy if exists reference_accounts_owner on public.reference_generation_accounts;
create policy reference_accounts_owner on public.reference_generation_accounts for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists reference_records_owner on public.reference_generations;
create policy reference_records_owner on public.reference_generations for select to authenticated using(user_id=(select auth.uid()));
-- Restrictive guards survive an unrelated permissive policy being added later.
drop policy if exists reference_accounts_guard on public.reference_generation_accounts;
create policy reference_accounts_guard on public.reference_generation_accounts as restrictive for all to anon,authenticated using(user_id=(select auth.uid())) with check(false);
drop policy if exists reference_records_guard on public.reference_generations;
create policy reference_records_guard on public.reference_generations as restrictive for all to anon,authenticated using(user_id=(select auth.uid())) with check(false);

create or replace function public.claim_reference_generation(p_owner uuid,p_id uuid,p_request jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare existing public.reference_generations; account public.reference_generation_accounts;
begin
 -- Serial global reservation, one unresolved call across this initial beta.
 -- No lease expiry: a timed-out provider request must never be retried blindly.
 perform pg_advisory_xact_lock(68124631);
 select * into existing from public.reference_generations where id=p_id;
 if found then
  if existing.user_id is distinct from p_owner or existing.request_json is distinct from p_request then return jsonb_build_object('status','conflict');end if;
  return jsonb_build_object('status','existing','record',to_jsonb(existing));
 end if;
 if p_owner is null or p_id is null or p_request is null or jsonb_typeof(p_request)<>'object' or p_request->>'version' is distinct from 'photo-reference/v1' or p_request->>'id' is distinct from p_id::text or p_request->>'ownerId' is distinct from p_owner::text or p_request->>'paidConsent' is distinct from 'true' then return jsonb_build_object('status','conflict');end if;
 select * into account from public.reference_generation_accounts where user_id=p_owner for update;
 if not found or not account.enabled then return jsonb_build_object('status','disabled');end if;
 if account.attempts_reserved>=account.attempt_limit then return jsonb_build_object('status','limit');end if;
 if exists(select 1 from public.reference_generations where status in ('pending','uncertain')) then return jsonb_build_object('status','busy');end if;
 insert into public.reference_generations(id,user_id,request_json) values(p_id,p_owner,p_request);
 update public.reference_generation_accounts set attempts_reserved=attempts_reserved+1 where user_id=p_owner;
 return jsonb_build_object('status','claimed');
end $$;
create or replace function public.complete_reference_generation(p_owner uuid,p_id uuid,p_metadata jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare result public.reference_generations;
begin
 if p_metadata->>'model' is distinct from 'gpt-image-2-2026-04-21' then raise exception 'Invalid model';end if;
 update public.reference_generations set status='completed',output_path=p_owner::text||'/'||p_id::text||'/generated.png',output_metadata=p_metadata,updated_at=now() where id=p_id and user_id=p_owner and status='pending' returning * into result;
 if not found then raise exception 'Reservation unavailable';end if;
 return to_jsonb(result);
end $$;
create or replace function public.mark_reference_uncertain(p_owner uuid,p_id uuid) returns void
language sql security definer set search_path=public,pg_temp as $$
 update public.reference_generations set status='uncertain',updated_at=now() where id=p_id and user_id=p_owner and status='pending';
$$;
revoke all on function public.claim_reference_generation(uuid,uuid,jsonb),public.complete_reference_generation(uuid,uuid,jsonb),public.mark_reference_uncertain(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_reference_generation(uuid,uuid,jsonb),public.complete_reference_generation(uuid,uuid,jsonb),public.mark_reference_uncertain(uuid,uuid) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('reference-studio','reference-studio',false,10485760,array['image/jpeg','image/png'])
 on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists reference_storage_guard on storage.objects;
create policy reference_storage_guard on storage.objects as restrictive for all to anon,authenticated
 using(bucket_id<>'reference-studio' or (storage.foldername(name))[1]=(select auth.uid())::text)
 with check(bucket_id<>'reference-studio' or (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists reference_source_insert on storage.objects;
create policy reference_source_insert on storage.objects for insert to authenticated with check(
 bucket_id='reference-studio' and (storage.foldername(name))[1]=(select auth.uid())::text
 and name~'^[0-9a-f-]{36}/[0-9a-f-]{36}/(source\.(jpg|png)|input\.png)$');
-- Even a future broad insert policy cannot let clients forge generated outputs.
drop policy if exists reference_storage_write_guard on storage.objects;
create policy reference_storage_write_guard on storage.objects as restrictive for insert to anon,authenticated with check(
 bucket_id<>'reference-studio' or ((storage.foldername(name))[1]=(select auth.uid())::text and name~'^[0-9a-f-]{36}/[0-9a-f-]{36}/(source\.(jpg|png)|input\.png)$'
 and exists(select 1 from public.reference_generation_accounts a where a.user_id=(select auth.uid()) and a.enabled and a.attempts_reserved<a.attempt_limit)));
drop policy if exists reference_storage_no_update on storage.objects;
create policy reference_storage_no_update on storage.objects as restrictive for update to anon,authenticated using(bucket_id<>'reference-studio') with check(bucket_id<>'reference-studio');
drop policy if exists reference_storage_no_delete on storage.objects;
create policy reference_storage_no_delete on storage.objects as restrictive for delete to anon,authenticated using(bucket_id<>'reference-studio');
drop policy if exists reference_images_read on storage.objects;
create policy reference_images_read on storage.objects for select to authenticated using(bucket_id='reference-studio' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
-- Rollback: disable Edge feature and account entitlements FIRST. Preserve these
-- records/objects for reconciliation and export. Never drop while pending or
-- uncertain. Schema removal, if later approved, must follow an account-owned
-- archive and explicit retention/deletion plan; do not reset critique counters.
