-- Apply after BMH_CUSTOMER_CLOUD.sql, then set BMH_AI_QUOTA_READY=true.
-- One HTTP request that reaches a successful provider response is one attempt.
-- Provider/model fallback stays inside that attempt. No pricing or paid flags here.
begin;
create table if not exists public.bmh_ai_days(
 user_id uuid not null references auth.users(id) on delete cascade,day date not null,
 allowance integer not null check(allowance between 0 and 10000),
 used integer not null default 0 check(used>=0),pending integer not null default 0 check(pending>=0),
 primary key(user_id,day)
);
create table if not exists public.bmh_ai_requests(
 user_id uuid not null references auth.users(id) on delete cascade,request_id uuid not null,
 day date not null,feature text not null,payload_hash text not null,
 status text not null check(status in ('reserved','used','failed')),
 reserved_at timestamptz not null default clock_timestamp(),settled_at timestamptz,
 primary key(user_id,request_id),foreign key(user_id,day) references public.bmh_ai_days(user_id,day)
);
create index if not exists bmh_ai_pending_idx on public.bmh_ai_requests(user_id,reserved_at) where status='reserved';
alter table public.bmh_ai_days enable row level security;
alter table public.bmh_ai_requests enable row level security;
revoke all on public.bmh_ai_days,public.bmh_ai_requests from public,anon,authenticated;
grant select,insert,update,delete on public.bmh_ai_days,public.bmh_ai_requests to service_role;

create or replace function public.bmh_ai_usage(p_user uuid,p_limit integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_day date:=(clock_timestamp() at time zone 'UTC')::date; v_row public.bmh_ai_days;
begin
 if p_user is null or p_limit is null or p_limit not between 0 and 10000 then raise invalid_parameter_value; end if;
 select * into v_row from public.bmh_ai_days where user_id=p_user and day=v_day;
 return jsonb_build_object('limit',coalesce(v_row.allowance,p_limit),'used',coalesce(v_row.used,0),'pending',coalesce(v_row.pending,0),
  'remaining',greatest(0,coalesce(v_row.allowance,p_limit)-coalesce(v_row.used,0)-coalesce(v_row.pending,0)),
  'resetAt',(v_day+1)::timestamp at time zone 'UTC');
end;
$$;
create or replace function public.bmh_ai_reserve(p_user uuid,p_request uuid,p_feature text,p_hash text,p_limit integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_day date:=(clock_timestamp() at time zone 'UTC')::date; v_row public.bmh_ai_days; v_old public.bmh_ai_requests; v_expired record;
begin
 if p_user is null or p_request is null or p_feature is null or char_length(p_feature) not between 1 and 60
 or p_hash is null or p_hash !~ '^[0-9a-f]{64}$' or p_limit is null or p_limit not between 0 and 10000 then raise invalid_parameter_value; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,1));
 -- Unknown outcomes count as used; a client cannot evade the limit by disconnecting.
 for v_expired in update public.bmh_ai_requests set status='used',settled_at=clock_timestamp()
  where user_id=p_user and status='reserved' and reserved_at<clock_timestamp()-interval '10 minutes' returning day loop
  update public.bmh_ai_days set pending=pending-1,used=used+1 where user_id=p_user and day=v_expired.day;
 end loop;
 select * into v_old from public.bmh_ai_requests where user_id=p_user and request_id=p_request;
 if found then return jsonb_build_object('accepted',false,'code','AI_REQUEST_REPLAY'); end if;
 insert into public.bmh_ai_days(user_id,day,allowance) values(p_user,v_day,p_limit) on conflict do nothing;
 select * into v_row from public.bmh_ai_days where user_id=p_user and day=v_day for update;
 if v_row.used+v_row.pending>=v_row.allowance then return jsonb_build_object('accepted',false,'code','AI_LIMIT_REACHED'); end if;
 insert into public.bmh_ai_requests(user_id,request_id,day,feature,payload_hash,status) values(p_user,p_request,v_day,p_feature,p_hash,'reserved');
 update public.bmh_ai_days set pending=pending+1 where user_id=p_user and day=v_day;
 return jsonb_build_object('accepted',true);
end;
$$;
create or replace function public.bmh_ai_settle(p_user uuid,p_request uuid,p_used boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_row public.bmh_ai_requests;
begin
 if p_user is null or p_request is null or p_used is null then raise invalid_parameter_value; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,1));
 select * into v_row from public.bmh_ai_requests where user_id=p_user and request_id=p_request for update;
 if not found then return jsonb_build_object('settled',false); end if;
 if v_row.status<>'reserved' then return jsonb_build_object('settled',true,'replayed',true); end if;
 update public.bmh_ai_requests set status=case when p_used then 'used' else 'failed' end,settled_at=clock_timestamp() where user_id=p_user and request_id=p_request;
 update public.bmh_ai_days set pending=pending-1,used=used+case when p_used then 1 else 0 end where user_id=p_user and day=v_row.day;
 return jsonb_build_object('settled',true);
end;
$$;
revoke all on function public.bmh_ai_usage(uuid,integer) from public,anon,authenticated;
revoke all on function public.bmh_ai_reserve(uuid,uuid,text,text,integer) from public,anon,authenticated;
revoke all on function public.bmh_ai_settle(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.bmh_ai_usage(uuid,integer) to service_role;
grant execute on function public.bmh_ai_reserve(uuid,uuid,text,text,integer) to service_role;
grant execute on function public.bmh_ai_settle(uuid,uuid,boolean) to service_role;
commit;
