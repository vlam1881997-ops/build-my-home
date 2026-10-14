import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('real PostgreSQL migrations enforce ownership, revision, idempotency and AI allowance',async t=>{
 const db=new PGlite(),a=randomUUID(),b=randomUUID(),id=randomUUID(),legacy=randomUUID();
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema auth to authenticated,anon;
   insert into auth.users values('${a}'),('${b}');
   create table public.bmh_projects(id uuid primary key,user_id uuid not null references auth.users(id),name text not null,version text not null default '4.9.0',state jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
   insert into public.bmh_projects(id,user_id,name,state) values('${legacy}','${a}','Thiết kế cũ','{"project":{"name":"Thiết kế cũ"}}');`);
  for(const file of ['sql/BMH_CUSTOMER_CLOUD.sql','sql/BMH_AI_USAGE.sql'])await db.exec(await readFile(file,'utf8'));
  // A second application must preserve existing records and grants.
  await db.exec(await readFile('sql/BMH_CUSTOMER_CLOUD.sql','utf8'));
  const old=(await db.query('select name,version,state,revision from public.bmh_projects where id=$1',[legacy])).rows[0];assert.equal(old.name,'Thiết kế cũ');assert.equal(old.version,'4.9.0');assert.equal(old.state.project.name,'Thiết kế cũ');assert.equal(old.revision,1);
  const user=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');};
  const save=async({request=randomUUID(),revision=null,name='Nhà A',state={project:{name:'Nhà A'}}}={})=>(await db.query('select public.bmh_save_project($1,$2,$3,$4,$5,$6::jsonb) as data',[id,request,revision,name,'6.2.0',JSON.stringify(state)])).rows[0].data;
  let first,request=randomUUID();await user(a);
  await t.test('first save and lost-acknowledgement replay use one revision',async()=>{
   first=await save({request});assert.equal(first.project.revision,1);const replay=await save({request});assert.equal(replay.replayed,true);assert.equal(replay.project.revision,1);
   assert.equal((await save({request,name:'Altered retry'})).saved,false);
  });
  await t.test('stale device cannot overwrite a newer design',async()=>{
   assert.equal((await save({revision:1,name:'Nhà A mới'})).project.revision,2);
   const stale=await save({revision:1,name:'Nhà B cũ'});assert.equal(stale.saved,false);assert.equal(stale.project.name,'Nhà A mới');
   assert.equal((await db.query('select name from public.bmh_projects where id=$1',[id])).rows[0].name,'Nhà A mới');
  });
  await t.test('direct table writes cannot bypass the save function',async()=>{
   await assert.rejects(db.exec("update public.bmh_projects set name='Bypass'"),/permission denied/);
   await assert.rejects(db.exec('delete from public.bmh_projects'),/permission denied/);
  });
  await t.test('another user cannot read, update, delete or claim this identity',async()=>{
   await user(b);assert.equal((await db.query('select * from public.bmh_projects')).rows.length,0);
   await assert.rejects(save({revision:2}),/Project not accessible/);
   assert.equal((await db.query('select public.bmh_delete_project($1,2) as data',[id])).rows[0].data.deleted,false);
  });
  await t.test('anonymous and authenticated users cannot mint AI allowance',async()=>{
   for(const role of ['authenticated','anon']){await db.exec('reset role;set role '+role);await assert.rejects(db.query('select public.bmh_ai_reserve($1,$2,$3,$4,$5)',[a,randomUUID(),'image','a'.repeat(64),99]),/permission denied/);}
  });
  await db.exec('reset role;set role service_role');
  const reserve=async(user,request,limit=2)=>(await db.query('select public.bmh_ai_reserve($1,$2,$3,$4,$5) as data',[user,request,'image','a'.repeat(64),limit])).rows[0].data;
  const settle=async(user,request,used)=>(await db.query('select public.bmh_ai_settle($1,$2,$3) as data',[user,request,used])).rows[0].data;
  const usage=async user=>(await db.query('select public.bmh_ai_usage($1,2) as data',[user])).rows[0].data;
  const r1=randomUUID(),r2=randomUUID(),r3=randomUUID();
  await t.test('pending requests count toward the limit and replay does not reserve twice',async()=>{
   assert.equal((await reserve(a,r1)).accepted,true);assert.equal((await reserve(a,r1)).code,'AI_REQUEST_REPLAY');assert.equal((await reserve(a,r2)).accepted,true);
   assert.equal((await reserve(a,r3,999)).code,'AI_LIMIT_REACHED');assert.deepEqual({...await usage(a),resetAt:undefined},{limit:2,used:0,pending:2,remaining:0,resetAt:undefined});
  });
  await t.test('failed provider calls release a reservation; successful settlement is idempotent',async()=>{
   await settle(a,r1,false);assert.equal((await usage(a)).remaining,1);assert.equal((await reserve(a,r3)).accepted,true);
   await settle(a,r2,true);await settle(a,r2,true);await settle(a,r3,true);assert.equal((await usage(a)).used,2);assert.equal((await usage(a)).pending,0);
   assert.equal((await reserve(b,randomUUID())).accepted,true);assert.equal((await usage(b)).remaining,1);
  });
  await t.test('unknown provider outcome ages into a used attempt',async()=>{
   await db.exec('reset role');await db.query("update public.bmh_ai_requests set reserved_at=now()-interval '11 minutes' where user_id=$1",[b]);await db.exec('set role service_role');
   const next=randomUUID();assert.equal((await reserve(b,next)).accepted,true);assert.equal((await usage(b)).used,1);assert.equal((await usage(b)).remaining,0);
  });
  await t.test('cloud deletion is revision checked',async()=>{
   await user(a);assert.equal((await db.query('select public.bmh_delete_project($1,1) as data',[id])).rows[0].data.deleted,false);
   assert.equal((await db.query('select public.bmh_delete_project($1,2) as data',[id])).rows[0].data.deleted,true);
   assert.equal((await save({request})).saved,false,'an old first-save retry cannot resurrect a deleted identity');
  });
 }finally{await db.close();}
});
