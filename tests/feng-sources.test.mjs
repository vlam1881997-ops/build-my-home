import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import handler from '../api/ai.mjs';
import {fengResearchContext,fengBibliography,normalizeFengResearch,fengResearchPolicy,createFengResearchRunner} from '../server/_feng_sources.mjs';

const input={school:'Bát trạch',site:{frontDirection:'Đông',directionStatus:'unconfirmed',widthM:5,depthM:20,floors:2,dimensionsStatus:'unconfirmed'},members:[{role:'owner',kua:2,group:'Tây tứ mệnh'}],rooms:[{id:'PRIVATE-ROOM-NAME',floor:0,type:'living',xM:0,yM:0,widthM:5,depthM:4}],positions:[{type:'altar',floor:0,roomIndex:0,xM:2,yM:.2,direction:null,status:'proposed'}]};
const metadata='<script type="application/ld+json">'+JSON.stringify({'@type':'Book',name:'Fixture phương pháp văn hóa',author:{'@type':'Person',name:'Tác giả fixture'},publisher:{name:'NXB fixture'},bookEdition:'Ấn bản fixture'})+'</script>';
const settings={GEMINI_FENG_RESEARCH_ENABLED:'true',GEMINI_SEARCH_ENABLED:'true',GEMINI_FENG_RESEARCH_QUOTA:'free-verified'};
const env={key:'fixture-only-key',primary:'gemini-fixture-flash'};
const claim='Không đổi vị trí bàn thờ chỉ vì một gợi ý web.';
function response(url='https://source.example.com/verified'){
  return {model:'gemini-fixture-flash',result:JSON.stringify({headline:'Tham khảo fixture',summary:'Dữ liệu cần được chủ nhà xác nhận.',claims:[{area:'altar',school:'Bát trạch',recommendation:claim,rationale:'Vị trí mới là dự trù.',url:'https://invented.example.com/book',chapter:'Chương bịa',page:'99'},{area:'bed',school:'Huyền không',recommendation:'Một gợi ý không có support.',rationale:'Chưa biết hướng giường.',sourceIds:['feng-source-1']}]}),raw:{candidates:[{groundingMetadata:{groundingChunks:[{web:{uri:url,title:'Trang trong grounding'}}],groundingSupports:[{segment:{text:claim},groundingChunkIndices:[0]}]}}],privateProviderField:'PRIVATE-RAW'}};
}

test('feng context strips all personal/project/free text and records missing confirmed inputs',()=>{
  const ctx=fengResearchContext({...input,birth:1988,name:'PRIVATE-NAME',finance:{income:123,bank:'PRIVATE-BANK'},prompt:'PRIVATE-PROMPT',site:{...input.site,address:'PRIVATE-ADDRESS',lat:10,lng:106},members:[{...input.members[0],birth:1988,name:'PRIVATE-NAME'}],rooms:[{...input.rooms[0],name:'PRIVATE-NAME'}]});
  assert.doesNotMatch(JSON.stringify(ctx),/PRIVATE|birth|income|bank|address|lat|lng|1988|prompt/);
  assert.equal(ctx.rooms[0].id,'room-0');assert.equal(ctx.site.directionStatus,'unconfirmed');
  assert.ok(ctx.missing.includes('confirmed_house_direction'));assert.ok(ctx.missing.includes('measured_dimensions'));assert.ok(ctx.missing.includes('confirmed_altar_position'));
  assert.equal(ctx.positions[0].status,'proposed');
  const known=fengResearchContext({...input,site:{...input.site,directionStatus:'customer_confirmed',dimensionsStatus:'customer_confirmed'}});assert.ok(!known.missing.includes('confirmed_house_direction'));
});

test('bibliography uses retrieved Book metadata and never invents chapter/page from a page title',()=>{
  const book=fengBibliography({html:metadata});assert.equal(book.title,'Fixture phương pháp văn hóa');assert.equal(book.author,'Tác giả fixture');assert.equal(book.edition,'Ấn bản fixture');assert.equal(book.publisher,'NXB fixture');assert.equal(book.chapter,null);assert.equal(book.page,null);
  const unknown=fengBibliography({html:'<title>AI nói đây là sách</title><p>Chương 7, trang 10</p>'});assert.equal(unknown.title,null);assert.equal(unknown.chapter,null);assert.equal(unknown.page,null);
  const ambiguous=fengBibliography({html:metadata+metadata.replace('Fixture phương pháp văn hóa','Một sách khác')});assert.equal(ambiguous.title,null);assert.equal(ambiguous.metadataStatus,'ambiguous');
});

test('only complete provider-supported claims with retrieved pages get source links; model citations are ignored',async()=>{
  const calls=[],result=await normalizeFengResearch(response(),fengResearchContext(input),'2026-10-07T01:00:00Z',{readPage:async(url,options)=>{calls.push({url,options});return {html:metadata,url};}});
  assert.equal(calls.length,1);assert.equal(calls[0].options.timeoutMs,4500);assert.equal(result.status,'ready');assert.equal(result.sources[0].bibliography.page,null);assert.equal(result.claims[0].sourceIds[0],'feng-source-1');assert.equal(result.claims[0].page,null);assert.equal(result.claims[1].sourceIds.length,0);assert.equal(result.claims[1].coverage,'unverified');assert.equal(result.claims[1].school,'Huyền không');assert.equal(result.coverage.linkedClaims,1);assert.equal(result.coverage.totalClaims,2);assert.equal(result.coverage.basis,'cultural-reference');assert.equal(result.claims[0].decision,'customer');
  assert.doesNotMatch(JSON.stringify(result),/invented|Chương bịa|PRIVATE-RAW/);
  assert.ok(result.claims[0].missingCriteria.includes('confirmed_altar_position'));assert.ok(!result.claims[0].missingCriteria.includes('confirmed_stove_position'));
});

test('unavailable source metadata stays unverified and Interactions annotations can link an actual claim',async()=>{
  const unavailable=await normalizeFengResearch(response(),fengResearchContext(input),'2026-10-07T01:00:00Z',{readPage:async()=>{throw new Error('No page');}});assert.equal(unavailable.status,'unverified');assert.equal(unavailable.sources[0].retrievedAt,null);assert.equal(unavailable.claims[0].sourceIds.length,0);
  const r=response();r.raw={outputs:[{type:'text',text:r.result,annotations:[{type:'url_citation',url:'https://source.example.com/annotation',title:'Annotation source',text:claim}]}]};
  const annotated=await normalizeFengResearch(r,fengResearchContext(input),'2026-10-07T01:00:00Z',{readPage:async()=>({html:metadata})});assert.equal(annotated.claims[0].sourceIds.length,1);assert.equal(annotated.sources[0].url,'https://source.example.com/annotation');
});

test('research requires independently verified free quota and configured text model',()=>{
  assert.equal(fengResearchPolicy(env,settings),'');
  for(const quota of ['unknown','allowed','paid'])assert.equal(fengResearchPolicy(env,{...settings,GEMINI_FENG_RESEARCH_QUOTA:quota}),'quota_not_allowed');
  assert.equal(fengResearchPolicy(env,{...settings,GEMINI_SEARCH_ENABLED:'false'}),'search_not_allowed');assert.equal(fengResearchPolicy({...env,primary:'gemini-fixture-image'},settings),'model_not_allowed');
});

test('runner dedupes exact context, caps requests and caches a quota rejection without fallback or provider details',async()=>{
  let calls=0,at=Date.parse('2026-10-07T01:00:00Z'),seen;
  const runner=createFengResearchRunner({getEnv:()=>env,getSettings:()=>settings,now:()=>at,generate:async options=>{calls++;seen=options;return response();},readPage:async()=>({html:metadata})});
  const [a,b]=await Promise.all([runner(input,{scope:'fixture'}),runner(input,{scope:'fixture'})]);assert.deepEqual(a,b);assert.equal(calls,1);assert.equal(seen.configuredOnly,true);assert.equal(seen.timeoutMs,25000);assert.equal(seen.maxOutputTokens,3000);assert.deepEqual(seen.tools,[{type:'google_search'}]);assert.doesNotMatch(JSON.stringify(seen),/PRIVATE/);
  for(const direction of ['Bắc','Nam'])await runner({...input,site:{...input.site,frontDirection:direction}},{scope:'fixture'});const capped=await runner({...input,site:{...input.site,frontDirection:'Tây'}},{scope:'fixture'});assert.equal(calls,3);assert.equal(capped.status,'call_limit');assert.equal(capped.allowLocal,true);
  let rejected=0;const quota=createFengResearchRunner({getEnv:()=>env,getSettings:()=>settings,now:()=>at,generate:async()=>{rejected++;throw Object.assign(new Error('PRIVATE-TOKEN'),{statusCode:429});}});
  const first=await quota(input,{scope:'a'}),second=await quota({...input,school:'Hình thế'},{scope:'b'});assert.equal(rejected,1);assert.equal(first.status,'quota');assert.equal(second.status,'quota_or_permission_blocked');assert.doesNotMatch(JSON.stringify(first),/PRIVATE-TOKEN/);
  at+=900001;await quota(input,{scope:'a'});assert.equal(rejected,2);
});

test('API feng path ignores full project getters and returns local capability when quota has not been approved',async()=>{
  const prior=process.env.GEMINI_FENG_RESEARCH_ENABLED;process.env.GEMINI_FENG_RESEARCH_ENABLED='false';
  const project=Object.defineProperty({},'finance',{get(){throw new Error('Full project must not be read');}});let code,payload;
  try{await handler({method:'POST',headers:{'x-forwarded-for':'127.0.0.217'},body:{action:'fengshui',fengContext:input,project,prompt:'PRIVATE-PROMPT'}},{status(n){code=n;return this;},setHeader(){return this;},end(raw){payload=JSON.parse(raw);}});assert.equal(code,200);assert.equal(payload.provider,'feng-research');assert.equal(payload.result.allowLocal,true);assert.equal(payload.result.sources.length,0);assert.doesNotMatch(JSON.stringify(payload),/PRIVATE/);}finally{if(prior===undefined)delete process.env.GEMINI_FENG_RESEARCH_ENABLED;else process.env.GEMINI_FENG_RESEARCH_ENABLED=prior;}
});

function client(){
  const listeners=[],ctx={BMH:{state:{project:{site:{frontDirection:'Đông',width:5,depth:20,floors:2},plan:{rooms:[{id:'r',floor:0,type:'living',x:0,y:0,w:5,h:4}],fixtures:[]},designEvidence:{site:[],fengSources:[]}},ui:{}},v6:{feng:{}},uid:(prefix)=>prefix+'-'+Math.random(),save(){},render(){},fengIdentity:()=>({kua:2,group:'Tây tứ mệnh'}),v6Household:()=>[{kind:'owner',birth:1988,name:'PRIVATE-NAME',gender:'Nam'}]},structuredClone,JSON,Date,Math,Number,String,Map,Set,URL,AbortController,setTimeout,clearTimeout,document:{addEventListener:(kind,fn)=>listeners.push({kind,fn})}};
  vm.createContext(ctx);const ai=fs.readFileSync('src/18_ai_copilot.js','utf8');vm.runInContext(ai.slice(ai.indexOf('BMH.fengResearchContext='),ai.indexOf('// A separate allowlist')),ctx);const ui=fs.readFileSync('src/70_v60_product_ui.js','utf8');vm.runInContext(ui.slice(ui.indexOf('BMH.v6FengKey='),ui.indexOf('BMH.v6FengFamily=')),ctx);return ctx.BMH;
}

test('saved responses of the same context never attach earlier claims to newer source URLs on reload',()=>{
  const B=client(),key=B.v6FengKey(),before=JSON.stringify(B.state.project.plan),base={status:'ready',retrievedAt:'2026-10-07T01:00:00Z',headline:'Fixture',coverage:{linkedClaims:1,totalClaims:1},claims:[{id:'claim',sourceIds:['feng-source-1'],recommendation:'Old claim'}],sources:[{id:'feng-source-1',url:'https://source.example.com/old',title:'Old',pageStatus:'retrieved',retrievedAt:'2026-10-07T01:00:00Z',bibliography:{title:null}}]};
  B.v6SaveFengResult(base,key);const second=structuredClone(base);second.sources[0].url='https://source.example.com/new';second.claims[0].recommendation='New claim';B.v6SaveFengResult(second,key);
  assert.equal(B.state.project.designEvidence.fengSources.filter(r=>r.kind==='feng-research-response'&&r.verifiedState!=='stale').length,1);
  const restored=client();restored.state.project=JSON.parse(JSON.stringify(B.state.project));const found=restored.v6FengRestoreResult();assert.equal(found.sources[0].url,'https://source.example.com/new');assert.equal(found.claims[0].recommendation,'New claim');assert.equal(JSON.stringify(B.state.project.plan),before);assert.doesNotMatch(B.v6FengKey(),/PRIVATE|birth|1988/);
  restored.state.project.site.frontDirection='Tây';assert.equal(restored.v6FengRestoreResult(),null);
});

test('client dedupes research and sends only fengContext without a full project or prompt',async()=>{
  const B=client(),requests=[];B.aiFetch=async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return {ok:true,json:async()=>({ok:true,result:{allowLocal:true}})};};await Promise.all([B.fengResearchCall(),B.fengResearchCall()]);assert.equal(requests.length,1);assert.deepEqual(Object.keys(requests[0].body).sort(),['action','fengContext']);assert.doesNotMatch(JSON.stringify(requests),/PRIVATE|birth|1988/);
});

test('client requires a matching dimensions record and isolates transient results between projects',()=>{
  const B=client();B.v6Esc=v=>String(v??'');
  B.state.project.designEvidence.site.push({kind:'dimensions',verifiedState:'provided',value:{width:5,depth:20}});
  assert.equal(B.fengResearchContext().site.dimensionsStatus,'customer_confirmed');B.state.project.site.width=6;assert.equal(B.fengResearchContext().site.dimensionsStatus,'unconfirmed');
  const old=B.state.project;B.v6.feng={project:old,key:B.v6FengKey(),result:{headline:'OLD-PROJECT-RESULT',sources:[],claims:[]}};
  B.state.project=structuredClone(old);assert.doesNotMatch(B.v6FengResult(),/OLD-PROJECT-RESULT/);
});
