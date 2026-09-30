import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {pageMetadata,publicHttps} from '../server/_public_web.mjs';
import {geminiGenerate} from '../api/_gemini.mjs';
import scan from '../api/gemini-scan.mjs';
import health from '../server/_ai_health_handler.mjs';
import {extractRenderedImage,renderRequestPayload} from '../api/gemini-render.mjs';
const res=()=>({status(n){this.code=n;return this;},setHeader(){},end(s){this.body=JSON.parse(s);}});
test('product metadata does not turn missing photos into the product page URL',()=>{
 assert.equal(pageMetadata('<h1>SKU123</h1>','https://shop.example/item','SKU123').imageUrl,'');
 const p=pageMetadata('<meta property="og:image" content="/sku123.jpg"><script type="application/ld+json">{"@type":"Product","sku":"SKU123","offers":{"price":120000,"priceCurrency":"VND"}}</script><p>SKU123</p>','https://shop.example/item','SKU123');assert.equal(p.imageUrl,'https://shop.example/sku123.jpg');assert.equal(p.price,120000);assert.equal(p.text.includes('priceCurrency'),false);
 assert.equal(pageMetadata('<script type="application/ld+json">{"@type":"Product","offers":{"price":12,"priceCurrency":"USD"}}</script>','https://shop.example/item').price,0);
 for(const u of ['https://127.0.0.1/a','http://shop.example/a','https://user:pw@shop.example/a','https://localhost/a','https://shop.example:8080/a'])assert.equal(publicHttps(u),'');
});
test('shared Gemini scanner sends video processing object and PDF as document',async()=>{
 const old=globalThis.fetch,key=process.env.GEMINI_API_KEY,del=process.env.GEMINI_DELETE_UPLOADS;process.env.GEMINI_API_KEY='fixture';process.env.GEMINI_DELETE_UPLOADS='false';let input;
 globalThis.fetch=async(u,o)=>{input=JSON.parse(o.body).input;return {ok:true,text:async()=>JSON.stringify({id:'fixture-interaction',outputs:[{type:'text',text:JSON.stringify({headline:'Đọc được kích thước',drawing_dimensions:[{label:'Mặt tiền',value_m:5,evidence:'Trang 1: 5000 mm',confidence:98}]})}]})};};
 try{for(const mime of ['video/mp4','application/pdf']){const out=res();await scan({method:'POST',headers:{'x-forwarded-for':'fixture-'+mime},body:{file_name:'files/abc123',file_uri:'https://generativelanguage.googleapis.com/v1beta/files/abc123',mime_type:mime}},out);assert.equal(out.code,200);assert.equal(out.body.result.drawing_dimensions[0].value_m,5);assert.equal(out.body.interactionId,'fixture-interaction');assert.equal(input[0].type,mime==='video/mp4'?'video':'document');if(mime==='video/mp4')assert.deepEqual(input[0].processing,{type:'static',fps:1});}}
 finally{globalThis.fetch=old;if(key===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=key;if(del===undefined)delete process.env.GEMINI_DELETE_UPLOADS;else process.env.GEMINI_DELETE_UPLOADS=del;}
});
test('permission failure stops retries and health never returns the key',async()=>{
 const old=globalThis.fetch,key=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='fixture-secret';let n=0;globalThis.fetch=async()=>{n++;return {ok:false,status:403,text:async()=>JSON.stringify({error:{message:'Permission denied'}})};};
 try{await assert.rejects(geminiGenerate({parts:[{text:'test'}]}),/Permission/);assert.equal(n,1);const out=res();await health({method:'POST',headers:{'x-forwarded-for':'health-fixture'}},out);assert.equal(out.code,403);assert.equal(JSON.stringify(out.body).includes('fixture-secret'),false);}finally{globalThis.fetch=old;if(key===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=key;}
});
test('planner zoom edits the existing SVG without rendering and preserves pointer anchor',()=>{
 const source=fs.readFileSync('src/75_completion.js','utf8'),snippet=source.slice(source.indexOf('BMH.zoomPlanner='),source.indexOf('let planPan='));const attrs={viewBox:'0 0 20 10','data-base-viewbox':'0 0 20 10'},svg={getAttribute:k=>attrs[k],setAttribute:(k,v)=>attrs[k]=v};let saves=0;
 const BMH={state:{ui:{planner:{zoom:1}}},clamp:(n,a,b)=>Math.min(b,Math.max(a,n)),save:()=>saves++};vm.runInNewContext(snippet,{BMH,document:{querySelector:()=>svg},setTimeout:()=>0,clearTimeout(){}});BMH.zoomPlanner(2);assert.equal(attrs.viewBox,'5 2.5 10 5');assert.equal(BMH.state.ui.planner.zoom,2);BMH.fitPlanner();assert.equal(attrs.viewBox,'0 0 20 10');assert.equal(BMH.state.ui.planner.zoom,1);assert.equal(saves,1);
});
test('real product selection stores SKU and unit through the existing persistence container',()=>{
 const source=fs.readFileSync('src/75_completion.js','utf8'),snippet=source.slice(source.indexOf('BMH.restoreWebMaterials='),source.indexOf('BMH.searchMaterials='));const state={project:{materials:{choices:{}},dataEngine:{materialOverrides:{}}}},BMH={state,v6MatMeta:{sanitary:['x','x']},MATERIALS:{},dataEngineState:()=>state.project.dataEngine,save(){},render(){}};vm.runInNewContext(snippet,{BMH});BMH.adoptWebMaterial({id:'actual-sku',category:'sanitary',sku:'AC-959VAN',name:'INAX',price:8690000,unit:'bộ',productUrl:'https://www.inax.com.vn/products/toilet/ac-959van/'});assert.equal(state.project.materials.choices.sanitary,'actual-sku');assert.equal(state.project.dataEngine.materialOverrides['actual-sku'].unit,'bộ');assert.equal(BMH.MATERIALS.sanitary[0].price,0); // No silent conversion from per-unit to per-square-metre pricing.
});
test('render accepts current Interactions image outputs and plan reference instructions',()=>{
 assert.equal(extractRenderedImage({outputs:[{type:'image',mime_type:'image/png',data:'A'.repeat(128)}]}).mimeType,'image/png');assert.match(renderRequestPayload({image:'data:image/png;base64,'+'A'.repeat(128),project:{referenceKind:'drawing'}}).prompt,/floor plan as a layout guide/);
});
test('roof bounds follow shifted rooms and reject a rectangular roof over an L-shaped footprint',()=>{
 const s=fs.readFileSync('src/75_completion.js','utf8'),BMH={};vm.runInNewContext(s.slice(s.indexOf('BMH.sceneFootprintBounds='),s.indexOf('BMH.technicalProjection=')),{BMH});const b=BMH.sceneFootprintBounds([{x:2,y:3,w:4,h:5}]);assert.equal(b.cx,4);assert.equal(b.cy,5.5);assert.equal(b.rectangular,true);assert.equal(BMH.sceneFootprintBounds([{x:0,y:0,w:2,h:4},{x:2,y:0,w:2,h:2}]).rectangular,false);assert.equal(BMH.sceneFootprintBounds([]),null);
});
test('elevation uses actual opening offsets and section intersects actual rooms',()=>{
 const s=fs.readFileSync('src/75_completion.js','utf8'),rooms=[{id:'a',name:'Khách',x:0,y:0,w:5,h:4,floor:0},{id:'b',name:'Bếp',x:0,y:4,w:5,h:4,floor:0}],BMH={state:{project:{site:{width:5,depth:8,floors:1},plan:{openings:[{id:'d',floor:0,roomId:'a',side:'north',kind:'door',width:1,offset:.25}]}}},floorRooms:()=>rooms,projectLevels:()=>({floorHeight:3.4}),esc:String,clamp:(n,a,b)=>Math.min(b,Math.max(a,n))};vm.runInNewContext(s.slice(s.indexOf('BMH.technicalProjection=')),{BMH});const elevation=BMH.elevationSvg();assert.match(elevation,/data-opening-id="d" x="1"/);const section=BMH.sectionSvg();assert.match(section,/Khách/);assert.match(section,/Bếp/);assert.match(section,/x="4".*width="4"/);
});
test('actual Three scene mounts with framed openings, ceiling slabs and a camera facing the entrance',async()=>{
 const THREE=await import('three'),source=fs.readFileSync('src/45_studio3d.js','utf8'),bounds=fs.readFileSync('src/75_completion.js','utf8'),events={},stage={classList:{add(){}},getBoundingClientRect:()=>({width:1200,height:600}),appendChild(){}},ctx={fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},bezierCurveTo(){}},canvas={addEventListener:(k,fn)=>events[k]=fn,removeEventListener(){}};
 class Renderer{constructor(){this.domElement=canvas;this.shadowMap={};}setPixelRatio(){}setSize(){}render(){}dispose(){}}
 const BMH={state:{project:{style:'Hiện đại',site:{width:5,depth:8,floors:1},materials:{choices:{}},plan:{rooms:[{id:'a',name:'Khách',type:'living',floor:0,x:0,y:0,w:5,h:4},{id:'b',name:'Bếp',type:'kitchen',floor:0,x:0,y:4,w:5,h:4}],openings:[{id:'d',floor:0,roomId:'a',kind:'door',side:'north',width:1,offset:.5},{id:'w',floor:0,roomId:'a',kind:'window',side:'east',width:1.4,offset:.5}]}},ui:{sceneTheme:'day',sceneFocus:'all'}},$:s=>s==='#studio3dCanvas'?canvas:s==='#studio3dStage'?stage:null,clamp:(n,a,b)=>Math.min(b,Math.max(a,n)),houseStyle:()=>({form:'flat',wall:'#eeeeee',accent:'#38574e'})};
 BMH.floorRooms=f=>BMH.state.project.plan.rooms.filter(r=>r.floor===f);
 const context={BMH,window:{THREE:{...THREE,WebGLRenderer:Renderer},addEventListener(){},removeEventListener(){}},document:{createElement:()=>({getContext:()=>ctx})},devicePixelRatio:1,ResizeObserver:class{observe(){}disconnect(){}},requestAnimationFrame:()=>1,cancelAnimationFrame(){},console};vm.runInNewContext(bounds.slice(bounds.indexOf('BMH.sceneFootprintBounds='),bounds.indexOf('BMH.technicalProjection=')),context);vm.runInNewContext(source,context);await BMH.mountStudio3D();assert.ok(BMH.studio3d);assert.ok(BMH.studio3d.camera.position.z<0);let glass=0,ceilings=0;BMH.studio3d.scene.traverse(o=>{if(o.material?.isMeshPhysicalMaterial)glass++;if(o.geometry?.parameters?.height===.14&&o.position.y>3)ceilings++;});assert.ok(glass>=1);assert.equal(ceilings,2);assert.equal(typeof events.wheel,'function');BMH.disposeStudio3D();assert.equal(BMH.studio3d,null);
});
