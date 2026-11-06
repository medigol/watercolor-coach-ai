-- READ ONLY. Generate a bound copy with reference-staging-preflight.cjs.
-- Placeholders deliberately fail until the owner supplies staging identifiers.
begin read only;
select jsonb_build_object(
 'schema','reference-staging-database/v1',
 'observedAt',clock_timestamp(),
 'stagingProjectRef','__STAGING_REF__',
 'testOwnerId','__TEST_OWNER__',
 'operationsVersion',public.reference_operations_version(),
 'testUserExists',exists(select 1 from auth.users where id='__TEST_OWNER__'::uuid and coalesce(is_anonymous,false)=false),
 'bucket',(select jsonb_build_object('private',not public,'byteLimit',file_size_limit,'mimeTypes',allowed_mime_types) from storage.buckets where id='reference-studio'),
 'account',(select jsonb_build_object('enabled',enabled,'limit',attempt_limit,'reserved',attempts_reserved) from public.reference_generation_accounts where user_id='__TEST_OWNER__'::uuid),
 'otherEnabledAccounts',(select count(*) from public.reference_generation_accounts where enabled and user_id<>'__TEST_OWNER__'::uuid),
 'enabledAccounts',(select count(*) from public.reference_generation_accounts where enabled),
 'nonzeroAllowances',(select count(*) from public.reference_generation_accounts where attempt_limit<>0 or attempts_reserved<>0),
 'unresolved',(select count(*) from public.reference_generations where status in ('pending','uncertain')),
 'rlsEnabled',not exists(select 1 from pg_class where oid in ('public.reference_generation_accounts'::regclass,'public.reference_generations'::regclass,'public.reference_generation_reconciliations'::regclass,'storage.objects'::regclass) and not relrowsecurity),
 'serviceOnlyRPCs',(select count(*)=8 and bool_and(not has_function_privilege('anon',p.oid,'EXECUTE') and not has_function_privilege('authenticated',p.oid,'EXECUTE') and has_function_privilege('service_role',p.oid,'EXECUTE')) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('claim_reference_generation','complete_reference_generation','mark_reference_uncertain','begin_reference_dispatch','note_reference_provider_receipt','reconcile_reference_generation','reference_operations_version','valid_reference_output')),
 'clientTablesReadOnly',not exists(select 1 from (values('reference_generations'),('reference_generation_accounts'),('reference_generation_reconciliations')) t(name) cross join (values('anon'),('authenticated')) r(name) cross join (values('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE')) g(name) where has_table_privilege(r.name,'public.'||t.name,g.name)),
 'auditPrivate',not has_table_privilege('anon','public.reference_generation_reconciliations','SELECT') and not has_table_privilege('authenticated','public.reference_generation_reconciliations','SELECT'),
 'definitionHashes',jsonb_build_object(
   'functions',(select jsonb_object_agg(p.proname,md5(pg_get_functiondef(p.oid))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('claim_reference_generation','complete_reference_generation','mark_reference_uncertain','begin_reference_dispatch','note_reference_provider_receipt','reconcile_reference_generation','reference_operations_version','valid_reference_output')),
   'policies',(select jsonb_object_agg(schemaname||'.'||tablename||'.'||policyname,md5(jsonb_build_array(permissive,roles,cmd,qual,with_check)::text)) from pg_policies where (schemaname='public' and tablename in ('reference_generation_accounts','reference_generations','reference_generation_reconciliations')) or (schemaname='storage' and tablename='objects' and policyname like 'reference_%')),
   'constraints',(select jsonb_object_agg(conname,md5(pg_get_constraintdef(oid))) from pg_constraint where conrelid='public.reference_generations'::regclass and contype='c')
 )
);
rollback;
