-- Apply through the database administrator before setting
-- BMH_GUEST_ORDERS_READY=true. No anonymous browser access is granted.
begin;
create table if not exists public.bmh_service_orders (
 id text primary key check (id ~ '^bmh-[a-f0-9-]{36}$'),
 request_id text not null unique,
 token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
 amount bigint not null check (amount between 1000 and 50000000),
 title text not null,partner_code text not null,
 environment text not null check (environment in ('sandbox','production')),
 order_info text not null,design_hash text not null,design_snapshot jsonb not null,
 project_name text not null,customer_name text not null,customer_phone text not null,
 status text not null check (status in ('creating','pending','unpaid','authorized','paid')),
 pay_url text,trans_id text unique,paid_at timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.bmh_service_orders enable row level security;
revoke all on public.bmh_service_orders from anon,authenticated;
grant select,insert,update on public.bmh_service_orders to service_role;

create or replace function public.bmh_record_momo_result(
 p_order_id text,p_request_id text,p_partner_code text,p_amount bigint,
 p_result_code integer,p_trans_id text
) returns setof public.bmh_service_orders
language plpgsql security definer set search_path=pg_catalog,public as $$
declare current_order public.bmh_service_orders;
begin
 select * into current_order from public.bmh_service_orders where id=p_order_id for update;
 if not found or current_order.request_id is distinct from p_request_id or current_order.partner_code is distinct from p_partner_code or current_order.amount is distinct from p_amount then raise exception 'Order mismatch';end if;
 if p_result_code is null then raise exception 'Missing result';end if;
 if current_order.status='paid' then
  if p_result_code=0 and current_order.trans_id is distinct from p_trans_id then raise exception 'Transaction mismatch';end if;
  return next current_order;return;
 end if;
 if p_result_code=0 and (p_trans_id is null or p_trans_id!~'^[1-9][0-9]{0,22}$') then raise exception 'Missing transaction';end if;
 update public.bmh_service_orders set
  status=case when p_result_code=0 then 'paid' when p_result_code=9000 then 'authorized' else 'unpaid' end,
  trans_id=case when p_result_code=0 then p_trans_id else null end,
  paid_at=case when p_result_code=0 then now() else null end,updated_at=now()
 where id=p_order_id returning * into current_order;
 return next current_order;
end;$$;
revoke all on function public.bmh_record_momo_result(text,text,text,bigint,integer,text) from public,anon,authenticated;
grant execute on function public.bmh_record_momo_result(text,text,text,bigint,integer,text) to service_role;
commit;
