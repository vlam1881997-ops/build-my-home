import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import finishHandler,{normalizeHomeFinish,homeFinishRequest} from '../server/_home_finish_handler.mjs';
import render,{renderRequestPayload} from '../api/gemini-render.mjs';
import {imageRequestBody} from '../server/_image_request.mjs';

const image='data:image/jpeg;base64,'+'A'.repeat(128);
const brief=()=>({summary:'Hoàn thiện nhà đang xây',observations:['Tường thô'],keep:['Giữ cột và cửa'],questions:['Xác nhận mặt bằng'],variants:['A','B','C'].map(id=>({id,name:'Phương án '+id,style:'Hiện đại',description:'Sơn sáng, gỗ ấm',palette:{wall:{name:'Kem',hex:'#eee2d2'},accent:{name:'Gỗ',hex:'#98765a'},floor:{name:'Đá',hex:'#c8bbaa'}},exterior:['Sơn tường'],interior:['Tủ gỗ'],lighting:'Ánh sáng ấm',budgetNote:'Cần báo giá sản phẩm',materials:[{category:'paint',description:'Sơn ngoài trời'}]}))});
const response=()=>({status(n){this.code=n;return this;},setHeader(){return this;},end(s){this.body=JSON.parse(s);}});
function client(){
  const project={site:{width:5,depth:20,floors:2,floorHeight:3.4},style:'Hiện đại',plan:{rooms:[{id:'living',name:'Khách',type:'living',floor:0,x:0,y:0,w:5,h:4}],openings:[]},materials:{choices:{paint:'dulux'},finish:{exterior:null,rooms:{}}},homeFinish:{photos:[{id:'photo-1',name:'Nhà thô.jpg',target:'interior',roomId:'living'}],activePhotoId:'photo-1',preferences:{style:'Hiện đại',budget:'balanced',notes:''},analyses:{},selected:{},satisfaction:{}}};
  const BMH={state:{project,ui:{step:1,onboardingComplete:true},access:{paid:false}},esc:x=>String(x).replaceAll('<','&lt;'),HOUSE_STYLES:[],screen1:()=>'',screen7:()=>'',v6SetupScreen:()=>'',SCREENS:[],save(){},render(){},toast(){},navigateTo(n){this.state.ui.step=n},$:()=>null};
  const context={BMH,window:{},document:{addEventListener(){}},queueMicrotask(){},AbortController,setTimeout,clearTimeout,structuredClone,console};vm.runInNewContext(fs.readFileSync('src/80_home_finish.js','utf8'),context);
  const s=BMH.finishState();s.analyses['photo-1']={signature:BMH.finishAnalysisKey(),result:brief(),renderKeys:[]};s.selected['photo-1']='A';BMH.finishRuntime.images.set('finish-photo:photo-1',image);return BMH;
}

test('finishing analysis requires three distinct variants and safe colors',()=>{
  assert.equal(normalizeHomeFinish(brief()).variants.length,3);
  const b=brief();b.variants[0].palette.wall.hex='url(javascript:alert(1))';assert.throws(()=>normalizeHomeFinish(b),/Bảng màu/);
  const duplicate=brief();duplicate.variants[1].id='A';assert.throws(()=>normalizeHomeFinish(duplicate),/hợp lệ/);
  assert.throws(()=>normalizeHomeFinish({variants:[]}),/ba phương án/);
});
test('photo requests are bounded and keep structural preservation in both analysis and render',async()=>{
  for(const value of ['https://example.org/photo.jpg','data:image/svg+xml;base64,'+'A'.repeat(128)])assert.throws(()=>homeFinishRequest({image:value}),/ảnh/);
  await assert.rejects(imageRequestBody({body:{image:'X'.repeat(1_900_000)}}),e=>e.statusCode===413);
  const p=homeFinishRequest({image,target:'interior',preferences:{notes:'x'.repeat(3000)}});assert.match(p.prompt,/Không suy đoán không gian khuất/);assert.ok(p.prompt.length<3000);
  const r=renderRequestPayload({mode:'home-finish',image,target:'interior',variant:brief().variants[0]});assert.match(r.prompt,/exact original viewpoint/);assert.match(r.prompt,/Do not replace this building/);assert.match(r.prompt,/#eee2d2/);
});
test('photo preview APIs work before payment and keep the key on the server',async()=>{
  const oldFetch=globalThis.fetch,oldKey=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='home-finish-test-key';const calls=[];
  globalThis.fetch=async(url,options)=>{if(!options?.body)return {ok:true,text:async()=>JSON.stringify({models:[{name:'models/gemini-99-flash',supportedGenerationMethods:['generateContent']},{name:'models/gemini-99-flash-image',supportedGenerationMethods:['generateContent']}]})};const body=JSON.parse(options.body);calls.push(body);return {ok:true,status:200,json:async()=>({outputs:[{type:'image',mime_type:'image/png',data:'B'.repeat(128)}]}),text:async()=>JSON.stringify({outputs:[{type:'text',text:JSON.stringify(brief())}]})};};
  try{const out=response();await finishHandler({method:'POST',headers:{'x-forwarded-for':'finish-fixture'},body:{image,target:'exterior'}},out);assert.equal(out.code,200);assert.equal(out.body.result.variants.length,3);assert.equal(JSON.stringify(out.body).includes(process.env.GEMINI_API_KEY),false);assert.equal(calls[0].input[0].type,'image');
    const rendered=response();await render({method:'POST',headers:{'x-forwarded-for':'finish-image-fixture'},body:{mode:'home-finish',image,target:'interior',variant:brief().variants[0]}},rendered);assert.equal(rendered.code,200);assert.equal(rendered.body.mimeType,'image/png');assert.equal(calls.at(-1).response_format.aspect_ratio,undefined);
  }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;}
});
test('late image responses cannot replace a newer photo design',async()=>{
  const b=client(),rt=b.finishRuntime;let resolve;const waiting=new Promise(r=>resolve=r);b.finishFetch=()=>waiting;b.finishMedia=async()=>{throw new Error('Must not persist stale media')};
  const job=b.finishGenerate();b.finishState().preferences.notes='Đổi thành sơn xanh';resolve({image:'B'.repeat(128),mimeType:'image/png'});await job;assert.equal(rt.images.size,1);assert.equal(rt.busy,'');
});
test('cancelled analyses cannot change the current design',async()=>{
  const b=client();let resolve;b.finishFetch=()=>new Promise(r=>resolve=r);const before=b.finishState().analyses['photo-1'],job=b.finishAnalyze();b.finishCancel();resolve({result:brief()});await job;assert.equal(b.finishState().analyses['photo-1'],before);assert.equal(b.finishRuntime.busy,'');
});
test('changing the photo while storage loads cannot send a stale AI request',async()=>{
  for(const operation of ['finishAnalyze','finishGenerate']){
    const b=client();b.finishRuntime.images.clear();let resolve;b.finishMedia=()=>new Promise(r=>resolve=r);let calls=0;b.finishFetch=async()=>{calls++;};
    const job=b[operation]();assert.ok(b.finishRuntime.busy);b.finishCancel();resolve(image);await job;assert.equal(calls,0);assert.equal(b.finishRuntime.busy,'');
  }
});
test('a generated preview remains viewable when device storage is full',async()=>{
  const b=client();b.finishFetch=async()=>({image:'B'.repeat(128),mimeType:'image/png'});b.finishMedia=async()=>{throw new Error('QuotaExceededError');};await b.finishGenerate();
  assert.ok(b.finishRuntime.images.get(b.finishRenderKey(b.finishVariant())));assert.match(b.finishRuntime.notice,/hết chỗ lưu/);assert.equal(b.finishRuntime.error,'');
});
test('photo finishing never modifies plan geometry and applies colors only to the linked room',()=>{
  const b=client(),s=b.finishState(),plan=JSON.stringify(b.state.project.plan);assert.equal(b.finishApply(),false);s.geometryKey=b.finishGeometryKey();assert.equal(b.finishApply(),true);assert.equal(JSON.stringify(b.state.project.plan),plan);assert.equal(b.state.ui.sceneFocus,'room:living');assert.equal(b.state.project.materials.finish.rooms.living.wall,'#eee2d2');assert.equal(b.state.project.materials.finish.exterior,null);
});
test('satisfaction follows the exact image and design and never grants payment rights',()=>{
  const b=client();b.finishAccept();assert.equal(b.finishSatisfied(),false);const v=b.finishVariant();b.finishRuntime.images.set(b.finishRenderKey(v),image);b.finishAccept();assert.equal(b.finishSatisfied(),true);assert.equal(b.state.access.paid,false);
  b.state.project.plan.rooms[0].w=4.9;assert.equal(b.finishSatisfied(),false);
});
test('each source photo and edited palette has a separate generated image',()=>{
  const b=client(),key=b.finishRenderKey(b.finishVariant());b.finishVariant().palette.wall.hex='#123456';assert.notEqual(b.finishRenderKey(b.finishVariant()),key);const s=b.finishState();s.photos.push({id:'photo-2',target:'interior',roomId:'living'});s.activePhotoId='photo-2';s.analyses['photo-2']={signature:b.finishAnalysisKey(),result:brief()};s.selected['photo-2']='A';assert.notEqual(b.finishRenderKey(b.finishVariant()),key);
});
test('3D palettes and render signatures include the selected finishing scheme',()=>{
  const b=client(),s=b.finishState();s.geometryKey=b.finishGeometryKey();b.finishApply();b.state.project.materials.tier='standard';b.houseStyle=()=>null;
  vm.runInNewContext(fs.readFileSync('src/45_studio3d.js','utf8'),{BMH:b,document:{addEventListener(){}},window:{},console});assert.equal(b.scenePalette().wall,0xeee2d2);const before=b.cinematicSignature();b.state.project.materials.finish.rooms.living.wall='#123456';assert.notEqual(b.cinematicSignature(),before);assert.equal(b.scenePalette().wall,0x123456);
});
test('project reload keeps finishing metadata, selected palettes and the home mode',()=>{
  const b=client(),source=fs.readFileSync('src/10_state.js','utf8');b.VERSION='test';b.defaultDataEngineState=()=>({});vm.runInNewContext(source.slice(0,source.indexOf('BMH.loadState =')),{BMH:b,structuredClone});const incoming={ui:{homeMode:'finish'},project:{homeFinish:b.state.project.homeFinish,materials:{finish:{exterior:{wall:'#123456'},rooms:{living:{wall:'#abcdef'}}}}}};const loaded=b.mergeState(b.defaultState(),incoming);assert.equal(loaded.ui.homeMode,'finish');assert.equal(loaded.project.homeFinish.photos[0].id,'photo-1');assert.equal(loaded.project.materials.finish.rooms.living.wall,'#abcdef');assert.equal(JSON.stringify(loaded.project.homeFinish).includes('data:image'),false);
});
