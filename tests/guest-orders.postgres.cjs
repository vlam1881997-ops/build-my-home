/* Optional SQL verification: NODE_PATH=/path/to/pglite/node_modules node tests/guest-orders.postgres.cjs.
 * Uses an isolated PostgreSQL WASM database; never contacts a production database. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
(async()=>{
 const db=new PGlite();
 try{
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to anon,authenticated,service_role;');
  const migration=fs.readFileSync(path.join(__dirname,'../sql/BMH_GUEST_SERVICE_ORDERS.sql'),'utf8');await db.exec(migration);await db.exec(migration);
  const id='bmh-11111111-1111-4111-8111-111111111111',other='bmh-22222222-2222-4222-8222-222222222222';
  const insert=(order,token,request)=>db.query(`insert into public.bmh_service_orders(id,request_id,token_hash,amount,title,partner_code,environment,order_info,design_hash,design_snapshot,project_name,customer_name,customer_phone,status) values ($1,$2,$3,120000,'Test','BMHTEST','sandbox','Test',$4,$5,'Approved','Customer','0901234567','pending')`,[order,request,token.repeat(64),'d'.repeat(64),JSON.stringify({project:{name:'Approved'}})]);
  await db.exec('set role service_role');await insert(id,'a','req1');await insert(other,'b','req2');
  const result=(order,request,amount,code,trans)=>db.query('select * from public.bmh_record_momo_result($1,$2,$3,$4,$5,$6)',[order,request,'BMHTEST',amount,code,trans]);
  await assert.rejects(()=>result(id,'wrong',120000,0,'123456'),/Order mismatch/);await assert.rejects(()=>result(id,'req1',1000,0,'123456'),/Order mismatch/);await assert.rejects(()=>result(id,'req1',120000,0,null),/Missing transaction/);
  await assert.rejects(()=>result(id,null,120000,0,'123456'),/Order mismatch/);await assert.rejects(()=>result(id,'req1',120000,null,'123456'),/Missing result/);
  assert.equal((await result(id,'req1',120000,9000,'123456')).rows[0].status,'authorized');
  const paid=(await result(id,'req1',120000,0,'123456')).rows[0];assert.equal(paid.status,'paid');assert.ok(paid.paid_at);
  const retry=(await result(id,'req1',120000,0,'123456')).rows[0];assert.equal(String(retry.paid_at),String(paid.paid_at));
  assert.equal((await result(id,'req1',120000,1006,null)).rows[0].status,'paid');await assert.rejects(()=>result(id,'req1',120000,0,'654321'),/Transaction mismatch/);
  await assert.rejects(()=>result(other,'req2',120000,0,'123456'),/unique constraint/);assert.equal((await db.query('select status from public.bmh_service_orders where id=$1',[other])).rows[0].status,'pending');
  await assert.rejects(()=>insert('bmh-33333333-3333-4333-8333-333333333333','a','req3'),/unique constraint/);
  for(const role of ['anon','authenticated']){
   await db.exec('reset role;set role '+role);await assert.rejects(()=>db.query('select * from public.bmh_service_orders'),/permission denied/);await assert.rejects(()=>result(id,'req1',120000,0,'123456'),/permission denied/);
  }
  console.log(JSON.stringify({postgresMigration:true,reapply:true,guestOwnershipUnique:true,providerTransactionUnique:true,atomicPaymentTransitions:true,noPaidDowngrade:true,anonymousDenied:true,authenticatedDenied:true,serviceRoleAllowed:true}));
 }finally{await db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
