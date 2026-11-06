-- Proposed STAGING-only follow-up. Not applied to any hosted project.
-- Preserve records, reservations, critique quotas and private source objects.
begin;
alter table public.reference_generations add column if not exists dispatch_phase text not null default 'dispatched';
alter table public.reference_generations add column if not exists dispatched_at timestamptz;
-- A pre-gate request might already have reached the provider: quarantine it.
update public.reference_generations set dispatched_at=created_at where dispatch_phase='dispatched' and dispatched_at is null;
alter table public.reference_generations alter column dispatch_phase set default 'reserved';
alter table public.reference_generations add column if not exists provider_request_id text;
alter table public.reference_generations add column if not exists provider_http_status integer;
alter table public.reference_generations add column if not exists provider_usage jsonb;
alter table public.reference_generations drop constraint if exists reference_dispatch_integrity;
alter table public.reference_generations add constraint reference_dispatch_integrity check(
 (dispatch_phase='reserved' and dispatched_at is null) or (dispatch_phase='dispatched' and dispatched_at is not null));

-- WITH CHECK does not protect DELETE. Keep reservations and allowances safe
-- even if an unrelated permissive policy/table grant is introduced later.
drop policy if exists reference_records_no_delete on public.reference_generations;
create policy reference_records_no_delete on public.reference_generations as restrictive for delete to anon,authenticated using(false);
drop policy if exists reference_accounts_no_delete on public.reference_generation_accounts;
create policy reference_accounts_no_delete on public.reference_generation_accounts as restrictive for delete to anon,authenticated using(false);

create or replace function public.valid_reference_output(p_request jsonb,p_metadata jsonb) returns boolean
language plpgsql immutable set search_path=public,pg_temp as $$
declare w integer;h integer;ow integer;oh integer;s double precision; k text;
begin
 if p_request is null or p_metadata is null or jsonb_typeof(p_metadata)<>'object' then return false;end if;
 if (select count(*) from jsonb_object_keys(p_metadata))<>5 or p_metadata->>'model' is distinct from 'gpt-image-2-2026-04-21'
 or coalesce(p_metadata->>'sha256','')!~'^[a-f0-9]{64}$' then return false;end if;
 foreach k in array array['width','height','bytes'] loop
  if jsonb_typeof(p_metadata->k) is distinct from 'number' or coalesce(p_metadata->>k,'')!~'^[0-9]+$' then return false;end if;
 end loop;
 if jsonb_typeof(p_request#>'{input,width}') is distinct from 'number' or jsonb_typeof(p_request#>'{input,height}') is distinct from 'number' then return false;end if;
 w:=(p_request#>>'{input,width}')::integer;h:=(p_request#>>'{input,height}')::integer;
 if w<16 or h<16 or w>1536 or h>1536 or w::double precision/h<1.0/3 or w::double precision/h>3 then return false;end if;
 s:=least(sqrt(1048576.0/(w::double precision*h)),1536.0/greatest(w,h));
 -- Math.round for positive numbers, including .5 ties (not banker rounding).
 ow:=floor(w*s/16+.5)::integer*16;oh:=floor(h*s/16+.5)::integer*16;
 return (p_metadata->>'width')::integer=ow and (p_metadata->>'height')::integer=oh
 and (p_metadata->>'bytes')::bigint between 32 and 10485760;
exception when others then return false;
end $$;
revoke all on function public.valid_reference_output(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.valid_reference_output(jsonb,jsonb) to service_role;
alter table public.reference_generations drop constraint if exists reference_output_integrity;
alter table public.reference_generations add constraint reference_output_integrity check(
 case when status='completed' then output_path is not null
 and output_path=user_id::text||'/'||id::text||'/generated.png'
 and public.valid_reference_output(request_json,output_metadata)
 else output_path is null and output_metadata is null end);

create or replace function public.begin_reference_dispatch(p_owner uuid,p_id uuid,p_request jsonb) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare affected integer;
begin
 perform pg_advisory_xact_lock(68124631);
 update public.reference_generations r set dispatch_phase='dispatched',dispatched_at=clock_timestamp(),updated_at=clock_timestamp()
 where r.id=p_id and r.user_id=p_owner and r.request_json=p_request and r.status='pending' and r.dispatch_phase='reserved'
 and exists(select 1 from public.reference_generation_accounts a where a.user_id=p_owner and a.enabled);
 get diagnostics affected=row_count;return affected=1;
end $$;

create or replace function public.complete_reference_generation(p_owner uuid,p_id uuid,p_metadata jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.reference_generations;
begin
 perform pg_advisory_xact_lock(68124631);
 select * into r from public.reference_generations where id=p_id and user_id=p_owner for update;
 if not found or not public.valid_reference_output(r.request_json,p_metadata) then raise exception 'Invalid reference completion';end if;
 if r.status='completed' and r.output_metadata=p_metadata then return to_jsonb(r);end if;
 if r.status<>'pending' or r.dispatch_phase<>'dispatched' then raise exception 'Reservation unavailable';end if;
 if not exists(select 1 from storage.objects where bucket_id='reference-studio' and name=p_owner::text||'/'||p_id::text||'/generated.png') then raise exception 'Output object missing';end if;
 update public.reference_generations set status='completed',output_path=p_owner::text||'/'||p_id::text||'/generated.png',output_metadata=p_metadata,updated_at=clock_timestamp()
 where id=p_id and user_id=p_owner returning * into r;
 return to_jsonb(r);
end $$;

create or replace function public.note_reference_provider_receipt(p_owner uuid,p_id uuid,p_request_id text,p_http_status integer,p_usage jsonb) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare k text;v jsonb;
begin
 if p_http_status is null or p_http_status<100 or p_http_status>599 or
 (p_request_id is not null and p_request_id!~'^[A-Za-z0-9_-]{1,200}$') then raise exception 'Invalid receipt';end if;
 if p_usage is not null then
  if jsonb_typeof(p_usage)<>'object' then raise exception 'Invalid usage';end if;
  for k,v in select * from jsonb_each(p_usage) loop
   if k not in ('imageInputTokens','textInputTokens','outputTokens','totalTokens') or jsonb_typeof(v)<>'number'
   or v::text!~'^[0-9]+$' or v::text::numeric>1000000000 then raise exception 'Invalid usage';end if;
  end loop;
 end if;
 update public.reference_generations set provider_request_id=coalesce(p_request_id,provider_request_id),provider_http_status=p_http_status,provider_usage=coalesce(p_usage,provider_usage),updated_at=clock_timestamp()
 where id=p_id and user_id=p_owner and dispatch_phase='dispatched' and status in ('pending','uncertain');
end $$;

create table if not exists public.reference_generation_reconciliations(
 operation_id uuid primary key, generation_id uuid not null references public.reference_generations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,resolution text not null check(resolution in ('completed','failed','uncertain')),
 previous_status text not null,previous_dispatch_phase text not null,previous_updated_at timestamptz not null,
 operator_name text not null,evidence_note text not null,workers_drained boolean not null,provider_terminal boolean not null,
 output_metadata jsonb,created_at timestamptz not null default now()
);
alter table public.reference_generation_reconciliations enable row level security;
revoke all on public.reference_generation_reconciliations from public,anon,authenticated;
grant all on public.reference_generation_reconciliations to service_role;

create or replace function public.reconcile_reference_generation(
 p_owner uuid,p_id uuid,p_operation_id uuid,p_expected_status text,p_expected_phase text,p_expected_updated_at timestamptz,
 p_resolution text,p_operator text,p_evidence text,p_workers_drained boolean,p_provider_terminal boolean,p_metadata jsonb
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.reference_generations;a public.reference_generation_reconciliations;
begin
 perform pg_advisory_xact_lock(68124631);
 if p_owner is null or p_id is null or p_operation_id is null or p_resolution is null or p_resolution not in ('completed','failed','uncertain')
 or p_operator is null or length(trim(p_operator)) not between 1 and 120 or p_evidence is null or length(trim(p_evidence)) not between 12 and 500
 or p_evidence~*'(https?://|Bearer |sk-|sb_secret_)' then raise exception 'Invalid reconciliation evidence';end if;
 select * into a from public.reference_generation_reconciliations where operation_id=p_operation_id;
 if found then
  if a.user_id is distinct from p_owner or a.generation_id is distinct from p_id or a.resolution is distinct from p_resolution or a.output_metadata is distinct from p_metadata then raise exception 'Operation conflict';end if;
  select * into r from public.reference_generations where id=p_id and user_id=p_owner;return to_jsonb(r);
 end if;
 select * into r from public.reference_generations where id=p_id and user_id=p_owner for update;
 if not found or r.status not in ('pending','uncertain') or r.status is distinct from p_expected_status
 or r.dispatch_phase is distinct from p_expected_phase or r.updated_at is distinct from p_expected_updated_at then raise exception 'Stale or unavailable reservation';end if;
 -- Age/timeout alone never proves upstream completion. Operator attestations
 -- refer to independently checked worker and provider evidence, not a TTL.
 if p_resolution<>'uncertain' and p_workers_drained is distinct from true then raise exception 'Workers not drained';end if;
 if p_resolution<>'uncertain' and r.dispatch_phase='dispatched' and p_provider_terminal is distinct from true then raise exception 'Provider disposition unresolved';end if;
 if p_resolution='completed' then
  if r.dispatch_phase<>'dispatched' or not public.valid_reference_output(r.request_json,p_metadata) then raise exception 'Invalid recovered output';end if;
  if not exists(select 1 from storage.objects where bucket_id='reference-studio' and name=p_owner::text||'/'||p_id::text||'/generated.png') then raise exception 'Recovered output object missing';end if;
 elsif p_metadata is not null then raise exception 'Unexpected output metadata';end if;
 insert into public.reference_generation_reconciliations(operation_id,generation_id,user_id,resolution,previous_status,previous_dispatch_phase,previous_updated_at,operator_name,evidence_note,workers_drained,provider_terminal,output_metadata)
 values(p_operation_id,p_id,p_owner,p_resolution,r.status,r.dispatch_phase,r.updated_at,trim(p_operator),trim(p_evidence),coalesce(p_workers_drained,false),coalesce(p_provider_terminal,false),p_metadata);
 update public.reference_generations set status=p_resolution,
 output_path=case when p_resolution='completed' then p_owner::text||'/'||p_id::text||'/generated.png' else null end,
 output_metadata=p_metadata,updated_at=clock_timestamp() where id=p_id and user_id=p_owner returning * into r;
 return to_jsonb(r);
end $$;
revoke all on function public.begin_reference_dispatch(uuid,uuid,jsonb),public.note_reference_provider_receipt(uuid,uuid,text,integer,jsonb),public.reconcile_reference_generation(uuid,uuid,uuid,text,text,timestamptz,text,text,text,boolean,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.begin_reference_dispatch(uuid,uuid,jsonb),public.note_reference_provider_receipt(uuid,uuid,text,integer,jsonb),public.reconcile_reference_generation(uuid,uuid,uuid,text,text,timestamptz,text,text,text,boolean,boolean,jsonb) to service_role;
create or replace function public.reference_operations_version() returns text language sql immutable as $$select 'reference-operations/v1'::text$$;
revoke all on function public.reference_operations_version() from public,anon,authenticated;
grant execute on function public.reference_operations_version() to service_role;
-- complete_reference_generation retains its previously revoked client grants.
commit;
-- Rollback is operational: disable the feature/accounts and drain workers.
-- Preserve the dispatch gate, rows, counters, objects and reconciliation audit.
-- Do not roll back to a worker that can bypass this gate. No automatic refunds.
