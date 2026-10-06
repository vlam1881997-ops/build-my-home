import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {designResearchContext,designResearchPolicy,normalizeDesignResearch,publicDesignSourceUrl,createDesignResearchRunner} from '../server/_design_research.mjs';

const settings={GEMINI_DESIGN_RESEARCH_ENABLED:'true',GEMINI_SEARCH_ENABLED:'true',GEMINI_DESIGN_RESEARCH_QUOTA:'allowed'};
const env={key:'fixture-design-only',primary:'gemini-fixture-flash',auto:true,fallback:'gemini-fixture-lite'};
const profile={houseType:'new',styleId:'japandi',site:{widthM:5,depthM:20,floors:2,dimensionsStatus:'unconfirmed'},budget:{targetMinVnd:1.2e9,targetMaxVnd:1.2e9,status:'customer_target'},floorProgram:[{bedrooms:0,bathrooms:1,living:true,kitchen:true,worship:'none'},{bedrooms:2,bathrooms:0,living:false,kitchen:false,worship:'room'}],references:{imageCount:1,pdfCount:1,videoCount:0,analysis:{available:true,status:'unconfirmed',styleId:'modern',estimatedFloors:3}}};
const claimA='Hiên sâu tạo bóng râm cho mặt tiền.',claimB='Sân trong giúp lấy sáng vào phần giữa nhà.',unsupported='Chi phí xây chắc chắn là 900 triệu.';
function groundedFixture(){
  const result=JSON.stringify({options:[{title:'Hiên và lớp đệm',claims:[claimA,unsupported],url:'https://invented.example.com/house',imageUrl:'https://invented.example.com/photo.jpg',limitations:['Chưa đối chiếu chiều rộng đất.']},{title:'Sân trong',claims:[claimB],limitations:[]}]});
  return {model:env.primary,result,citations:[{url:'https://invented.example.com/ignored'}],raw:{candidates:[{groundingMetadata:{groundingChunks:[{web:{uri:'https://architecture.example.com/porch',title:'Hiên'}},{web:{uri:'https://architecture.example.com/courtyard',title:'Sân trong'}},{web:{uri:'javascript:alert(1)',title:'Unsafe'}}],groundingSupports:[{segment:{text:claimA},groundingChunkIndices:[0]},{segment:{text:claimB},groundingChunkIndices:[1]}]}}]}};
}
const makeRunner=overrides=>createDesignResearchRunner({getEnv:()=>env,getSettings:()=>settings,...overrides});
test('current Interactions model_output annotations bind sources without trusting model-written URLs',()=>{
 const f=groundedFixture(),start=f.result.indexOf(claimA);
 f.raw={steps:[{type:'model_output',content:[{type:'text',text:f.result,annotations:[{type:'url_citation',url:'https://architecture.example.com/porch',title:'Provider source',start_index:start,end_index:start+claimA.length}]}]}]};
 const result=normalizeDesignResearch(f,designResearchContext(profile),'2026-10-06T00:00:00Z');
 assert.equal(result.status,'ready');assert.equal(result.options[0].claims[0].verified,true);assert.equal(result.options[0].claims[1].verified,false);assert.equal(result.sources[0].url,'https://architecture.example.com/porch');
});

test('server context accepts only typed design facts and never file/private/free-text content',()=>{
  const input={...structuredClone(profile),name:'PRIVATE-NAME',household:{birth:1988},finance:{income:88,loan:99,bank:'PRIVATE-BANK'},prompt:'PRIVATE-PROMPT',styleId:'Japandi PRIVATE-PHONE',missing:['PRIVATE-FILE'],site:{...profile.site,address:'PRIVATE-ADDRESS',lat:11},references:{...profile.references,files:[{name:'PRIVATE-PASSPORT',text:'PRIVATE-BIRTH'}],analysis:{...profile.references.analysis,notes:'PRIVATE-ANALYSIS',estimatedWidth:12}}};
  input.floorProgram[0].extraRooms=[{type:'custom',count:1,minAreaM2:8,name:'PRIVATE-PERSON'}];
  const safe=designResearchContext(input),json=JSON.stringify(safe);
  assert.doesNotMatch(json,/PRIVATE|income|loan|birth|bank|lat|estimatedWidth/);assert.equal(safe.styleId,null);
  assert.equal(safe.site.dimensionsStatus,'unconfirmed');assert.equal(safe.references.analysis.status,'unconfirmed');assert.equal(safe.references.analysis.estimatedFloors,3);assert.equal(safe.site.floors,2);
  assert.equal(safe.floorProgram[1].bathrooms,0);assert.equal(safe.floorProgram[0].bedrooms,0);assert.ok(safe.missing.includes('measured_dimensions'));
  assert.deepEqual(designResearchContext(safe),safe);
});

test('each complete conclusion gets its own grounding evidence; invented URLs/images are discarded',()=>{
  const date='2026-10-05T04:00:00.000Z',r=normalizeDesignResearch(groundedFixture(),designResearchContext(profile),date);
  assert.equal(r.status,'ready');assert.equal(r.searchedAt,date);assert.equal(r.options.length,2);
  assert.deepEqual(r.options[0].claims[0].sourceIds,['source-1']);assert.deepEqual(r.options[1].claims[0].sourceIds,['source-2']);
  assert.equal(r.options[0].claims[1].verified,false);assert.deepEqual(r.options[0].claims[1].sourceIds,[]);
  assert.equal(r.sources.length,2);assert.doesNotMatch(JSON.stringify(r),/invented|imageUrl|"raw"/);
  assert.ok(r.options.every(o=>o.fitReasons.some(s=>s.includes('5 × 20'))&&o.missingCriteria.includes('file_analysis_verification')));
  assert.ok(r.limitations.some(s=>s.includes('không phải ngày xuất bản')));assert.ok(r.limitations.some(s=>s.includes('quyền')));
});

test('metadata without supports and partial support never verifies a full conclusion',()=>{
  const f=groundedFixture();f.raw.candidates[0].groundingMetadata.groundingSupports=[{segment:{text:claimA.slice(0,10)},groundingChunkIndices:[0]}];
  const r=normalizeDesignResearch(f,designResearchContext(profile),'2026-10-05T00:00:00Z');assert.equal(r.status,'unverified');assert.ok(r.options.every(o=>o.claims.every(c=>!c.verified)));assert.match(r.notice,/Chưa có nguồn xác minh/);
  delete f.raw;f.citations=[{url:'https://invented.example.com/self-written'}];assert.deepEqual(normalizeDesignResearch(f,designResearchContext(profile),'2026-10-05T00:00:00Z').sources,[]);
});

test('grounding offsets and Interactions provider annotations bind evidence without model citation indices',()=>{
  const f=groundedFixture(),start=f.result.indexOf(claimA);f.raw.candidates[0].groundingMetadata.groundingSupports=[{segment:{startIndex:start,endIndex:start+claimA.length},groundingChunkIndices:[0]}];
  assert.equal(normalizeDesignResearch(f,designResearchContext(profile),'2026-10-05T00:00:00Z').options[0].claims[0].verified,true);
  f.raw={outputs:[{type:'text',text:f.result,annotations:[{type:'url_citation',url:'https://architecture.example.com/porch',title:'Provider citation',start_index:start,end_index:start+claimA.length}]}]};
  const r=normalizeDesignResearch(f,designResearchContext(profile),'2026-10-05T00:00:00Z');assert.equal(r.options[0].claims[0].verified,true);assert.equal(r.options[1].claims[0].verified,false);
});

test('source URLs reject credentials, unsafe protocols, local hosts and key query parameters',()=>{
  for(const url of ['javascript:alert(1)','data:text/html,a','http://architecture.example.com','https://name:pass@architecture.example.com','https://localhost/a','https://127.0.0.1/a','https://192.168.1.2/a','https://host.local/a','https://architecture.example.com:8080','https://architecture.example.com/?key=secret'])assert.equal(publicDesignSourceUrl(url),'',url);
  assert.equal(publicDesignSourceUrl('https://architecture.example.com/a?project=5'),'https://architecture.example.com/a?project=5');
});

test('search requires configuration, permission and quota permission independently of a model list',async()=>{
  let calls=0;const generate=async()=>{calls++;return groundedFixture();};
  for(const [e,s,status] of [[{...env,key:''},settings,'missing_configuration'],[env,{...settings,GEMINI_SEARCH_ENABLED:'false'},'search_not_allowed'],[env,{...settings,GEMINI_DESIGN_RESEARCH_QUOTA:'unknown'},'quota_not_allowed'],[{...env,primary:'gemini-image-model'},settings,'model_not_allowed']]){
    assert.equal(designResearchPolicy(e,s),status);const r=await createDesignResearchRunner({generate,getEnv:()=>e,getSettings:()=>s})(profile);assert.equal(r.status,status);assert.equal(r.allowLibrary,true);
  }
  assert.equal(calls,0);
});

test('deduplicated and cached requests keep the actual search time and bound calls',async()=>{
  let calls=0,clock=Date.parse('2026-10-05T04:00:00Z'),captured;const run=makeRunner({now:()=>clock,generate:async opts=>{calls++;captured=opts;return groundedFixture();}});
  const [a,b]=await Promise.all([run(profile,{scope:'one'}),run(profile,{scope:'one'})]);assert.deepEqual(a,b);assert.equal(calls,1);
  clock+=10000;const cached=await run(profile,{scope:'one'});assert.equal(cached.searchedAt,'2026-10-05T04:00:00.000Z');assert.equal(calls,1);
  assert.equal(captured.configuredOnly,true);assert.equal(captured.timeoutMs,25000);assert.deepEqual(captured.tools,[{type:'google_search'}]);assert.doesNotMatch(JSON.stringify(captured),/fixture-design-only|income|birth|loan/);
  for(let i=0;i<6;i++)await run({...profile,site:{...profile.site,widthM:i+10}},{scope:'one'});assert.equal(calls,3);
  assert.equal((await run({...profile,styleId:'modern'},{scope:'one'})).status,'call_limit');
  for(let i=0;i<8;i++)await run({...profile,site:{...profile.site,widthM:i+40}},{scope:'scope-'+i});assert.equal(calls,6);
});

test('quota and permission denials stop subsequent profiles without changing account/model',async()=>{
  for(const code of [429,401,403]){
    let calls=0;const localEnv={...env},run=createDesignResearchRunner({getEnv:()=>localEnv,getSettings:()=>settings,generate:async opts=>{calls++;assert.equal(opts.configuredOnly,true);throw Object.assign(new Error('PRIVATE-KEY must not escape'),{statusCode:code});}});
    const first=await run(profile),second=await run({...profile,styleId:'modern'});assert.equal(first.status,code===429?'quota':'denied');assert.equal(second.status,'quota_or_permission_blocked');assert.equal(calls,1);assert.deepEqual(localEnv,env);assert.doesNotMatch(JSON.stringify(first),/PRIVATE-KEY/);
  }
});

test('one customer daily-quota denial does not block another customer using the same server model',async()=>{
  let calls=0;const run=makeRunner({generate:async()=>{calls++;if(calls===1)throw Object.assign(new Error('Customer limit'),{statusCode:429,code:'AI_LIMIT_REACHED'});return groundedFixture();}});
  assert.equal((await run(profile,{scope:'customer-one'})).status,'quota');assert.equal((await run({...profile,styleId:'modern'},{scope:'customer-one'})).status,'quota_or_permission_blocked');
  assert.equal((await run(profile,{scope:'customer-two'})).status,'ready');assert.equal(calls,2);
});

function browserFixture(storage=new Map()){
  const B={VERSION:'fixture',STORAGE_KEY:'bmh-fixture',defaultDataEngineState:()=>({}),uid:()=> 'fixture-id',regionPoint:()=>({lat:11,lng:106}),clamp:(v,a,b)=>Math.min(b,Math.max(a,v)),esc:v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),money:v=>String(v)+' đ',num:String,render:()=>{},toast:()=>{},$:()=>null};
  B.v6Esc=B.esc;B.v6PanelTitle=(_,title,copy)=>'<h2>'+B.esc(title)+'</h2><p>'+B.esc(copy)+'</p>';
  const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},document={addEventListener:()=>{},querySelector:()=>null};
  const ctx=vm.createContext({BMH:B,document,window:{},localStorage,structuredClone,URL,AbortController,setTimeout,clearTimeout,console});
  B.defaultDataEngineState=()=>({cost:{},quote:{},status:{},snapshots:[],costSources:{},materialOverrides:{}});
  B.REGIONS={'TP. Hồ Chí Minh':{districts:['Phường Thủ Dầu Một']}};
  for(const path of ['src/10_state.js','src/18_ai_copilot.js','src/44_house_styles.js'])vm.runInContext(fs.readFileSync(path,'utf8'),ctx);
  B.v6={ideaExpanded:false};const product=fs.readFileSync('src/70_v60_product_ui.js','utf8');vm.runInContext(product.slice(product.indexOf('// Capture BMH'),product.indexOf('BMH.screen1=()=>{')),ctx);
  const completion=fs.readFileSync('src/75_completion.js','utf8');vm.runInContext(completion.slice(0,completion.indexOf('// Change the SVG')),ctx);
  return {B,storage,ctx};
}
function customerProfile(B){
  const p=B.state.project;p.finance.targetBudget=1.2e9;p.style='Japandi';p.sourceRefs=[{id:'source-existing',kind:'image',name:'PRIVATE-CUSTOMER.jpg',type:'image/jpeg',size:1024,status:'Đã nhận tệp'}];p.aiScan={scannedAt:'2026-10-04T00:00:00Z',result:{building:{style:'Hiện đại',estimated_floors:3,estimated_width:99},spoken_facts:['PRIVATE-BIRTH']}};p.designStudio={program:{floors:[{bedrooms:0,bathrooms:1,living:true,kitchen:true,worship:'none',extraRooms:[{type:'custom',name:'PRIVATE-CUSTOM-ROOM',count:1,minArea:8}]},{bedrooms:2,bathrooms:0,worship:'room'}]}};
  return p;
}

test('client allowlist and dedicated HTTP body omit finance, birth dates and private file text',async()=>{
  const {B}=browserFixture(),p=customerProfile(B);let body;
  B.aiFetch=async(_,opts)=>{body=JSON.parse(opts.body);return {ok:true,json:async()=>({ok:true,result:{status:'unverified'}})};};
  await B.designResearchCall();assert.deepEqual(Object.keys(body),['action','researchContext']);assert.equal(body.action,'design-research');assert.doesNotMatch(JSON.stringify(body),/PRIVATE|ownerBirth|income|cash|loan|bank|spoken_facts|estimated_width/);
  assert.equal(body.researchContext.site.widthM,5);assert.equal(body.researchContext.site.floors,2);assert.equal(body.researchContext.references.analysis.estimatedFloors,3);assert.equal(body.researchContext.floorProgram[0].bedrooms,0);assert.equal(body.researchContext.floorProgram[1].bathrooms,0);
  p.finance.targetBudget=0;assert.equal(B.designResearchContext().budget.targetMaxVnd,null);
  B.state.ui.homeMode='finish';p.homeFinish={photos:[{id:'photo',name:'PRIVATE-PHOTO'}],analyses:{photo:{result:{summary:'PRIVATE-DETAIL'}}},geometryKey:'matched'};B.finishGeometryKey=()=> 'matched';B.state.ui.onboardingComplete=true;
  assert.equal(B.designResearchContext().houseType,'shell');assert.equal(B.designResearchContext().site.dimensionsStatus,'customer_confirmed');assert.doesNotMatch(JSON.stringify(B.designResearchContext()),/PRIVATE/);
});

test('all 24 library references remain selectable without config; actual save/load preserves project and uploads',()=>{
  const {B,storage}=browserFixture(),p=customerProfile(B),before=structuredClone(p);assert.equal(B.v6DesignLibrary().length,24);
  assert.equal(B.v6SelectDesignReference('library-tropical'),true);const picked=p.brief.userRequirements.designReference;assert.equal(picked.title,'Nhiệt đới');assert.equal(picked.origin,'library');
  for(const key of ['site','plan','finance','household','style','materials','sourceRefs','aiScan','designStudio'])assert.equal(JSON.stringify(p[key]),JSON.stringify(before[key]),key);
  assert.equal(B.v6SelectDesignReference('missing-id'),false);
  const reloaded=browserFixture(storage).B;assert.equal(reloaded.state.project.brief.userRequirements.designReference.id,'library-tropical');assert.deepEqual(structuredClone(reloaded.state.project.sourceRefs),structuredClone(p.sourceRefs));assert.equal(reloaded.state.project.style,'Japandi');
  B.applyExplicitRequirements('nhà 2 tầng cho 5 người',{save:false});assert.equal(p.brief.userRequirements.designReference.id,'library-tropical');
  B.v6DesignResearch.result={status:'quota',options:[],sources:[],notice:'Search quota'};B.v6DesignResearch.key=B.designResearchProfileKey();assert.equal(B.v6DesignOptions().length,24);assert.equal(B.v6SelectDesignReference('library-modern'),true);
});

test('client deduplicates in-flight research and rejects replies after a profile, file or project change',async()=>{
  for(const change of [(B,p)=>p.site.width=7,(B,p)=>p.sourceRefs.push({id:'new',kind:'pdf',name:'NEW'}),(B,p)=>B.state.project=structuredClone(p)]){
    const {B}=browserFixture(),p=customerProfile(B);let resolve,calls=0;
    B.designResearchCall=()=>{calls++;return new Promise(r=>resolve=r);};const a=B.v6RunDesignResearch(),b=B.v6RunDesignResearch();assert.equal(a,b);assert.equal(calls,1);
    assert.equal(B.v6SelectDesignReference('library-modern'),true);change(B,p);resolve(normalizeDesignResearch(groundedFixture(),designResearchContext(profile),'2026-10-05T00:00:00Z'));await a;
    assert.equal(B.v6DesignResearch.result,null);assert.equal(B.v6DesignResearch.loading,false);assert.equal(B.v6DesignOptions().filter(o=>o.origin==='research').length,0);
  }
});

test('network failure preserves the library; cached success and research selection never apply an AI brief',async()=>{
  const {B}=browserFixture(),p=customerProfile(B),before=structuredClone(p);let calls=0;
  B.designResearchCall=async()=>{calls++;throw new Error('Fixture network failure');};await B.v6RunDesignResearch();assert.match(B.v6DesignResearch.error,/network/);assert.equal(B.v6DesignLibrary().length,24);
  B.designResearchCall=async()=>{calls++;return {...normalizeDesignResearch(groundedFixture(),designResearchContext(profile),'2026-10-05T00:00:00Z'),brief:{style:'WRONG',budget_vnd:99}};};await B.v6RunDesignResearch();await B.v6RunDesignResearch();assert.equal(calls,2);
  assert.equal(B.v6SelectDesignReference('research-0'),true);for(const key of ['site','plan','finance','household','style','materials','sourceRefs','aiScan','designStudio'])assert.equal(JSON.stringify(p[key]),JSON.stringify(before[key]),key);
  assert.equal(p.brief.userRequirements.designReference.searchedAt,'2026-10-05T00:00:00Z');assert.equal(p.brief.userRequirements.designReference.claims[0].verified,true);
});

test('client retries a configuration fallback, caps network attempts and stops on quota across profiles',async()=>{
  const {B}=browserFixture();customerProfile(B);let calls=0;
  B.designResearchCall=async()=>{calls++;return {status:'missing_configuration',allowLibrary:true,options:[],sources:[],searchedAt:null};};
  await B.v6RunDesignResearch();await B.v6RunDesignResearch();assert.equal(calls,2);
  B.designResearchCall=async()=>{calls++;throw new Error('Fixture offline');};await B.v6RunDesignResearch();await B.v6RunDesignResearch();assert.equal(calls,3);assert.equal(B.v6DesignOptions().length,24);
  const other=browserFixture().B;customerProfile(other);calls=0;other.designResearchCall=async()=>{calls++;return {status:'quota',allowLibrary:true,options:[],sources:[],searchedAt:null};};await other.v6RunDesignResearch();other.state.project.site.width=8;await other.v6RunDesignResearch();assert.equal(calls,1);assert.equal(other.v6SelectDesignReference('library-japandi'),true);
});

test('rendered evidence escapes HTML and validates source links; reference illustrations use existing vectors',()=>{
  const {B}=browserFixture();customerProfile(B);
  const html=B.v6DesignEvidenceHtml({searchedAt:'bad date',claims:[{text:'<img src=x onerror=alert(1)>',sourceIds:['bad','good']}],sources:[{id:'bad',url:'javascript:alert(1)',title:'Bad'},{id:'good',url:'https://architecture.example.com/a',title:'<script>bad</script>'}],fitReasons:['<b>why</b>'],limitations:['<iframe>'],missingCriteria:['measured_dimensions']});
  assert.doesNotMatch(html,/<img|<script|<iframe|href="javascript/);assert.match(html,/&lt;img/);assert.match(html,/rel="noopener noreferrer"/);assert.match(html,/không phải ngày xuất bản/);
  const panel=B.v6DesignResearchHtml();assert.match(panel,/<svg/);assert.doesNotMatch(panel,/<img|https:\/\/.+\.jpg/);assert.match(panel,/data-s1-reference/);assert.match(panel,/Lý do, nguồn &amp; giới hạn|Lý do, nguồn & giới hạn/);assert.equal((B.v6DesignResearchActionHtml().match(/<button/g)||[]).length,1);
});

test('the finishing view can mount the same Tab 1 reference panel without modifying the finishing handlers',()=>{
  const {B,ctx}=browserFixture();customerProfile(B);B.state.ui.homeMode='finish';let mounted;
  const host={querySelector:()=>mounted?{}:null,append:s=>mounted=s.innerHTML};ctx.document.querySelector=selector=>selector==='.finish-studio'?host:null;ctx.document.createElement=()=>({innerHTML:''});
  B.v6MountShellResearch();assert.match(mounted,/data-s1-research/);assert.match(mounted,/Nhà thô/);const first=mounted;B.v6MountShellResearch();assert.equal(mounted,first);
});
