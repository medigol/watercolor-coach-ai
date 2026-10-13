-- Run in the Supabase SQL Editor as the project administrator.
-- Safe to rerun for this schema. Review policies before applying to an existing app.
-- Run the entire script together; a failed statement leaves no partial setup.
begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);
create table if not exists public.artworks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('improve_painting', 'create_reference')),
  title text not null,
  -- Private storage object path, NOT a public image URL or expiring signed URL.
  image_url text,
  focus_area text,
  created_at timestamptz not null default now(),
  unique (id, user_id, mode),
  check (image_url is null or split_part(image_url, '/', 1) = user_id::text)
);
create table if not exists public.ai_results (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.artworks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('improve_painting', 'create_reference')),
  provider text not null default 'mock' check (provider = 'mock'),
  result_json jsonb not null check (jsonb_typeof(result_json) = 'object'),
  created_at timestamptz not null default now(),
  unique (artwork_id),
  foreign key (artwork_id, user_id, mode) references public.artworks(id, user_id, mode) on delete cascade
);
create table if not exists public.usage_counters (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  free_results_used integer not null default 0 check (free_results_used >= 0),
  free_results_limit integer not null default 3 check (free_results_limit >= 0),
  updated_at timestamptz not null default now()
);
-- Upgrade the previous mock-only schema without discarding saved results.
alter table public.ai_results drop constraint if exists ai_results_provider_check;
alter table public.ai_results add constraint ai_results_provider_check check (provider in ('mock', 'openai'));
alter table public.usage_counters add column if not exists active_request_id uuid;
alter table public.usage_counters add column if not exists active_request_expires_at timestamptz;
create index if not exists artworks_user_created_idx on public.artworks(user_id, created_at desc);
create index if not exists ai_results_user_idx on public.ai_results(user_id);

-- Server-side provisioning: clients cannot create another user's profile or quotas.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, email, display_name)
  values (new.id, new.email, left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 100))
  on conflict (id) do nothing;
  insert into public.usage_counters(user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
-- Include existing Auth users if SQL is installed after account creation.
insert into public.profiles(id, email, display_name)
select id, email, left(coalesce(raw_user_meta_data ->> 'display_name', ''), 100) from auth.users
on conflict (id) do nothing;
insert into public.usage_counters(user_id) select id from public.profiles on conflict (user_id) do nothing;

alter table public.profiles enable row level security;
alter table public.artworks enable row level security;
alter table public.ai_results enable row level security;
alter table public.usage_counters enable row level security;
revoke all on public.profiles, public.artworks, public.ai_results, public.usage_counters from public, anon, authenticated;
grant select on public.profiles, public.usage_counters to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.artworks, public.ai_results to authenticated;

-- Permissive policies are OR-ed together. These restrictive guards keep an
-- older/broader project policy from granting access to another user's rows.
-- They do not grant access themselves; the operation policies below do that.
drop policy if exists watercolor_profiles_owner_guard on public.profiles;
create policy watercolor_profiles_owner_guard on public.profiles as restrictive for all to anon, authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists watercolor_artworks_owner_guard on public.artworks;
create policy watercolor_artworks_owner_guard on public.artworks as restrictive for all to anon, authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists watercolor_results_owner_guard on public.ai_results;
create policy watercolor_results_owner_guard on public.ai_results as restrictive for all to anon, authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists watercolor_usage_owner_guard on public.usage_counters;
create policy watercolor_usage_owner_guard on public.usage_counters as restrictive for all to anon, authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists profiles_read_own on public.profiles;
create policy profiles_read_own on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists artworks_own on public.artworks;
create policy artworks_own on public.artworks for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists ai_results_own on public.ai_results;
create policy ai_results_own on public.ai_results for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists usage_read_own on public.usage_counters;
create policy usage_read_own on public.usage_counters for select to authenticated using (user_id = (select auth.uid()));
-- Only server-side functions may change quotas or reserve an OpenAI request.

-- A public client cannot forge or modify a paid-model result, even if an old
-- permissive project policy allows writes. Service-role RPCs bypass these guards.
drop policy if exists watercolor_results_mock_insert_guard on public.ai_results;
create policy watercolor_results_mock_insert_guard on public.ai_results as restrictive for insert to anon, authenticated with check (provider = 'mock');
drop policy if exists watercolor_results_mock_update_guard on public.ai_results;
create policy watercolor_results_mock_update_guard on public.ai_results as restrictive for update to anon, authenticated using (provider = 'mock') with check (provider = 'mock');

-- Atomic artwork + mock-result insert. SECURITY INVOKER keeps RLS active.
-- Remove the earlier signature to avoid ambiguous PostgREST RPC overloads.
-- Optional expected-user and request IDs preserve older callers and let new
-- callers reject account changes and recover an uncertain save idempotently.
drop function if exists public.save_mock_artwork(text, text, text, text, jsonb);
drop function if exists public.save_mock_artwork(text, text, text, text, jsonb, uuid);
create or replace function public.save_mock_artwork(
  p_mode text, p_title text, p_focus_area text, p_image_path text, p_result jsonb,
  p_expected_user_id uuid default null, p_request_id uuid default null
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare saved_id uuid; existing_mode text;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if p_expected_user_id is not null and p_expected_user_id <> auth.uid() then
    raise exception 'Your account changed. Please try again.';
  end if;
  -- The same user lock is shared with server saves. A lost Edge response followed
  -- by a fallback can never duplicate, overwrite or double-charge a result.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text, 0));
  if p_request_id is not null then
    select id, mode into saved_id, existing_mode from public.artworks
    where id = p_request_id and user_id = auth.uid();
    if saved_id is not null then
      if existing_mode <> p_mode then raise exception 'Request mode mismatch'; end if;
      if not exists (select 1 from public.ai_results where artwork_id = saved_id) then
        raise exception 'Incomplete result';
      end if;
      return saved_id;
    end if;
  end if;
  insert into public.artworks(id, user_id, mode, title, image_url, focus_area)
  values (coalesce(p_request_id, gen_random_uuid()), auth.uid(), p_mode, p_title, p_image_path, p_focus_area) returning id into saved_id;
  insert into public.ai_results(artwork_id, user_id, mode, provider, result_json)
  values (saved_id, auth.uid(), p_mode, 'mock', p_result);
  return saved_id;
end;
$$;
revoke all on function public.save_mock_artwork(text, text, text, text, jsonb, uuid, uuid) from public, anon;
grant execute on function public.save_mock_artwork(text, text, text, text, jsonb, uuid, uuid) to authenticated;

create or replace function public.save_mock_feedback(
  p_mode text, p_title text, p_focus_area text, p_image_path text, p_result jsonb,
  p_expected_user_id uuid, p_request_id uuid
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare saved_id uuid; saved_provider text;
begin
  if p_request_id is null then raise exception 'Request ID required'; end if;
  saved_id := public.save_mock_artwork(p_mode, p_title, p_focus_area, p_image_path, p_result, p_expected_user_id, p_request_id);
  select provider into strict saved_provider from public.ai_results where artwork_id = saved_id;
  return jsonb_build_object('id', saved_id, 'provider', saved_provider);
end;
$$;
revoke all on function public.save_mock_feedback(text, text, text, text, jsonb, uuid, uuid) from public, anon;
grant execute on function public.save_mock_feedback(text, text, text, text, jsonb, uuid, uuid) to authenticated;

-- These functions are NOT executable by anon/authenticated. Only the Edge
-- Function's server client may call them, with a user ID verified by Auth.
create or replace function public.claim_feedback_request(p_user_id uuid, p_request_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare counter public.usage_counters%rowtype; saved_provider text;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Server access required'; end if;
  if p_user_id is null or p_request_id is null then raise exception 'Invalid request'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));
  select * into strict counter from public.usage_counters where user_id = p_user_id for update;
  select provider into saved_provider from public.ai_results where artwork_id = p_request_id and user_id = p_user_id;
  if found then return jsonb_build_object('status', 'existing', 'id', p_request_id, 'provider', saved_provider); end if;
  if exists (select 1 from public.artworks where id = p_request_id) then raise exception 'Invalid request'; end if;
  if counter.free_results_used >= least(counter.free_results_limit, 3) then return jsonb_build_object('status', 'limit'); end if;
  if counter.active_request_expires_at > now() then return jsonb_build_object('status', 'busy'); end if;
  update public.usage_counters set active_request_id = p_request_id, active_request_expires_at = now() + interval '120 seconds', updated_at = now() where user_id = p_user_id;
  return jsonb_build_object('status', 'claimed');
end;
$$;
create or replace function public.complete_openai_feedback(
  p_user_id uuid, p_request_id uuid, p_mode text, p_focus_area text, p_image_path text, p_result jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare counter public.usage_counters%rowtype; saved_provider text; saved_mode text;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Server access required'; end if;
  if p_user_id is null or p_request_id is null then raise exception 'Invalid request'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));
  select * into strict counter from public.usage_counters where user_id = p_user_id for update;
  select provider, mode into saved_provider, saved_mode from public.ai_results where artwork_id = p_request_id and user_id = p_user_id;
  if found then
    if saved_mode <> p_mode then raise exception 'Request mode mismatch'; end if;
    return jsonb_build_object('id', p_request_id, 'provider', saved_provider);
  end if;
  if counter.active_request_id is distinct from p_request_id or counter.active_request_expires_at <= now() or counter.active_request_expires_at is null then raise exception 'Request expired'; end if;
  if counter.free_results_used >= least(counter.free_results_limit, 3) then raise exception 'Usage limit reached'; end if;
  if p_image_path is null or split_part(p_image_path, '/', 1) <> p_user_id::text or jsonb_typeof(p_result) is distinct from 'object' or nullif(p_result ->> 'title', '') is null then raise exception 'Invalid result'; end if;
  insert into public.artworks(id, user_id, mode, title, image_url, focus_area)
  values (p_request_id, p_user_id, p_mode, p_result ->> 'title', p_image_path, p_focus_area);
  insert into public.ai_results(artwork_id, user_id, mode, provider, result_json)
  values (p_request_id, p_user_id, p_mode, 'openai', p_result);
  update public.usage_counters set free_results_used = free_results_used + 1, active_request_id = null, active_request_expires_at = null, updated_at = now() where user_id = p_user_id;
  return jsonb_build_object('id', p_request_id, 'provider', 'openai');
end;
$$;
create or replace function public.release_feedback_request(p_user_id uuid, p_request_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Server access required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));
  update public.usage_counters set active_request_id = null, active_request_expires_at = null, updated_at = now() where user_id = p_user_id and active_request_id = p_request_id;
end;
$$;
revoke all on function public.claim_feedback_request(uuid, uuid), public.complete_openai_feedback(uuid, uuid, text, text, text, jsonb), public.release_feedback_request(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_feedback_request(uuid, uuid), public.complete_openai_feedback(uuid, uuid, text, text, text, jsonb), public.release_feedback_request(uuid, uuid) to service_role;

-- Enforce private access on this app bucket, including on reruns.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('artworks', 'artworks', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
-- Storage is shared across buckets. Restrict this bucket even if an existing
-- project policy permits broad reads/writes, without changing other buckets.
drop policy if exists watercolor_images_owner_guard on storage.objects;
create policy watercolor_images_owner_guard on storage.objects as restrictive for all to anon, authenticated
using (bucket_id <> 'artworks' or (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id <> 'artworks' or (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists watercolor_images_upload_own on storage.objects;
create policy watercolor_images_upload_own on storage.objects for insert to authenticated
with check (bucket_id = 'artworks' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists watercolor_images_read_own on storage.objects;
create policy watercolor_images_read_own on storage.objects for select to authenticated
using (bucket_id = 'artworks' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists watercolor_images_delete_own on storage.objects;
create policy watercolor_images_delete_own on storage.objects for delete to authenticated
using (bucket_id = 'artworks' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- No storage UPDATE policy is added: objects use new names rather than overwrite.

commit;
