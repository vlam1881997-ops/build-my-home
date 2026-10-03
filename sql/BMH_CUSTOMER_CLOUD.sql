-- Apply in Supabase SQL Editor, then set BMH_CLOUD_READY=true.
-- This migration can run independently of legacy payment tables.
begin;
create table if not exists public.bmh_projects (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 120),
 version text not null default '6.2.0', state jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.bmh_projects add column if not exists revision bigint not null default 1;
alter table public.bmh_projects add column if not exists last_request_id uuid;
alter table public.bmh_projects add column if not exists last_request_hash text;
create index if not exists bmh_projects_user_updated_idx on public.bmh_projects(user_id,updated_at desc);
alter table public.bmh_projects enable row level security;
drop policy if exists bmh_projects_select_own on public.bmh_projects;
create policy bmh_projects_select_own on public.bmh_projects for select to authenticated using (auth.uid()=user_id);
-- All writes go through the revision-checked functions, including old clients.
revoke all on public.bmh_projects from public,anon,authenticated;
grant select on public.bmh_projects to authenticated;
create table if not exists public.bmh_project_tombstones(
 id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,deleted_at timestamptz not null default now()
);
alter table public.bmh_project_tombstones enable row level security;
revoke all on public.bmh_project_tombstones from public,anon,authenticated;

create or replace function public.bmh_project_receipt(p public.bmh_projects) returns jsonb
language sql immutable set search_path='' as $$
 select jsonb_build_object('id',p.id,'name',p.name,'version',p.version,'revision',p.revision,'created_at',p.created_at,'updated_at',p.updated_at);
$$;
revoke all on function public.bmh_project_receipt(public.bmh_projects) from public,anon,authenticated;

create or replace function public.bmh_save_project(p_id uuid,p_request_id uuid,p_revision bigint,p_name text,p_version text,p_state jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_row public.bmh_projects; v_hash text;
begin
 if v_user is null then raise insufficient_privilege using message='Authentication required'; end if;
 if p_id is null or p_request_id is null or p_name is null or char_length(p_name) not between 1 and 120
 or p_version is null or char_length(p_version)>40 or jsonb_typeof(p_state) is distinct from 'object'
 or jsonb_typeof(p_state->'project') is distinct from 'object' or octet_length(p_state::text)>4194304
 or (p_revision is not null and (p_revision<1 or p_revision>9007199254740990)) then
  raise invalid_parameter_value using message='Invalid project payload';
 end if;
 v_hash:=encode(sha256(convert_to(jsonb_build_object('name',p_name,'version',p_version,'state',p_state)::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into v_row from public.bmh_projects where id=p_id for update;
 if found then
  if v_row.user_id<>v_user then raise insufficient_privilege using message='Project not accessible'; end if;
  if v_row.last_request_id=p_request_id and v_row.last_request_hash=v_hash then
   return jsonb_build_object('saved',true,'replayed',true,'project',public.bmh_project_receipt(v_row));
  end if;
  if p_revision is null or p_revision<>v_row.revision or v_row.last_request_id=p_request_id then
   return jsonb_build_object('saved',false,'conflict',true,'project',public.bmh_project_receipt(v_row));
  end if;
  update public.bmh_projects set name=p_name,version=p_version,state=p_state,revision=revision+1,
   last_request_id=p_request_id,last_request_hash=v_hash,updated_at=clock_timestamp() where id=p_id returning * into v_row;
 else
  if exists(select 1 from public.bmh_project_tombstones where id=p_id) then return jsonb_build_object('saved',false,'conflict',true,'project',null); end if;
  if p_revision is not null then return jsonb_build_object('saved',false,'conflict',true,'project',null); end if;
  insert into public.bmh_projects(id,user_id,name,version,state,last_request_id,last_request_hash)
   values(p_id,v_user,p_name,p_version,p_state,p_request_id,v_hash) returning * into v_row;
 end if;
 return jsonb_build_object('saved',true,'replayed',false,'project',public.bmh_project_receipt(v_row));
end;
$$;
revoke all on function public.bmh_save_project(uuid,uuid,bigint,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.bmh_save_project(uuid,uuid,bigint,text,text,jsonb) to authenticated;

create or replace function public.bmh_delete_project(p_id uuid,p_revision bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_row public.bmh_projects;
begin
 if v_user is null then raise insufficient_privilege using message='Authentication required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into v_row from public.bmh_projects where id=p_id and user_id=v_user for update;
 if not found or p_revision is null or p_revision<>v_row.revision then return jsonb_build_object('deleted',false); end if;
 insert into public.bmh_project_tombstones(id,user_id) values(p_id,v_user) on conflict do nothing;
 delete from public.bmh_projects where id=p_id and user_id=v_user;
 return jsonb_build_object('deleted',true);
end;
$$;
revoke all on function public.bmh_delete_project(uuid,bigint) from public,anon,authenticated;
grant execute on function public.bmh_delete_project(uuid,bigint) to authenticated;
commit;
