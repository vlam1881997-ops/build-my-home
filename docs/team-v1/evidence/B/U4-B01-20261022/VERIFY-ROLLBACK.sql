begin;
insert into auth.users(id,email) values
('bb220001-0000-4000-8000-000000000001','bmh-rollback-a@example.invalid'),
('bb220001-0000-4000-8000-000000000002','bmh-rollback-b@example.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub','bb220001-0000-4000-8000-000000000001',true);
do $test$
declare receipt jsonb;
begin
 receipt:=public.bmh_save_project('bb220001-0000-4000-8000-000000000003','bb220001-0000-4000-8000-000000000004',null,'Rollback verification','6.2.0','{"project":{"name":"Rollback verification"}}'::jsonb);
 if receipt->>'saved'<>'true' or receipt#>>'{project,revision}'<>'1' then raise exception 'Initial save failed'; end if;
 receipt:=public.bmh_save_project('bb220001-0000-4000-8000-000000000003','bb220001-0000-4000-8000-000000000004',null,'Rollback verification','6.2.0','{"project":{"name":"Rollback verification"}}'::jsonb);
 if receipt->>'replayed'<>'true' then raise exception 'Idempotent replay failed'; end if;
 receipt:=public.bmh_save_project('bb220001-0000-4000-8000-000000000003','bb220001-0000-4000-8000-000000000005',null,'Stale write','6.2.0','{"project":{}}'::jsonb);
 if receipt->>'conflict'<>'true' then raise exception 'Stale write accepted'; end if;
 if (select count(*) from public.bmh_projects)<>1 then raise exception 'Owner read failed'; end if;
end $test$;
select set_config('request.jwt.claim.sub','bb220001-0000-4000-8000-000000000002',true);
do $test$
begin
 if (select count(*) from public.bmh_projects)<>0 then raise exception 'Foreign project exposed'; end if;
 begin
 perform public.bmh_save_project('bb220001-0000-4000-8000-000000000003','bb220001-0000-4000-8000-000000000006',1,'Foreign write','6.2.0','{"project":{}}'::jsonb);
 raise exception 'Foreign write accepted';
 exception when insufficient_privilege then null;
 end;
 if public.bmh_delete_project('bb220001-0000-4000-8000-000000000003',1)->>'deleted'<>'false' then raise exception 'Foreign delete accepted'; end if;
end $test$;
select 'PASS: owner save/read, idempotent replay, stale conflict, foreign read/write/delete denied; all fixture records rolled back' as verification;
rollback;
