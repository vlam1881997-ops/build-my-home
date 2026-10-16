import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {materialUnit,materialPriceEvidence,normalizeMaterialProduct,materialFromVerifiedPage,productPageMatchesSku,officialMaterials} from '../server/_material_catalog.mjs';
import {researchMaterials} from '../server/_material_search.mjs';
import materialImage from '../server/_material_image.mjs';
const product=()=>({id:'tile-a',category:'floor',brand:'Fixture',sku:'TILE-600',name:'Gạch mẫu',spec:'600 × 600 mm',unit:'m²',productUrl:'https://manufacturer.example/tile-a',price:null,verifiedAt:'2026-10-01',priceEvidence:{amountVnd:null,priceType:'unknown',quantityUnit:'m²',sourceUrl:'https://manufacturer.example/tile-a',quotedAt:null,retrievedAt:'2026-10-01',includesVat:null,includesLabour:null,includesTransport:null,validUntil:null}});
function client(){
 const state={project:{style:'Japandi',site:{floors:1},plan:{rooms:[{id:'a',name:'Khách',type:'living',floor:0},{id:'b',name:'Ngủ',type:'bed',floor:0}],openings:[]},materials:{choices:{},finish:{rooms:{},exterior:null}},dataEngine:{materialOverrides:{}},designEvidence:{materialSources:[]}},ui:{sceneFocus:'room:a',roomCamera:'inside'}},B={state,MATERIALS:{floor:[]},v6MatMeta:{floor:['▥','Sàn'],paint:['S','Sơn'],cabinetry:['G','Gỗ']},HOUSE_STYLES:[],SCREENS:[],dataEngineState:()=>state.project.dataEngine,v6Esc:String,esc:String,v71SafeHttps:v=>{try{return new URL(v).protocol==='https:'?new URL(v).href:'';}catch{return '';}},save(){},render(){},toast(){},houseStyle:()=>({id:'japandi',wall:'#f2eee8'}),screen7:()=>'',finishPalette:id=>state.project.materials.finish.rooms[id]||state.project.materials.finish.exterior,decorateStudioScene(){},mountStudio3D:async()=>{},$:()=>null};
 const context={BMH:B,document:{addEventListener(){}},setTimeout,clearTimeout,AbortController,fetch:()=>{throw Error('Unmocked network');}},completion=fs.readFileSync('src/75_completion.js','utf8');vm.runInNewContext(completion.slice(completion.indexOf('BMH.materialUnit='),completion.indexOf('const completionScreen6=')),context);vm.runInNewContext(fs.readFileSync('src/85_interior_collections.js','utf8'),context);vm.runInNewContext(fs.readFileSync('src/86_visual_materials.js','utf8'),context);return {B,state,context};
}
const json=v=>JSON.parse(JSON.stringify(v));
test('missing catalog prices remain null; date retrieved is independent of quote date and zero must be explicit',()=>{
 const p=materialPriceEvidence({...product(),price:0});assert.equal(p.amountVnd,null);assert.equal(p.quotedAt,null);assert.equal(p.retrievedAt,'2026-10-01');for(const field of ['includesVat','includesLabour','includesTransport','validUntil','locationScope'])assert.equal(p[field],null);
 assert.equal(materialPriceEvidence({...product(),priceEvidence:{...product().priceEvidence,amountVnd:0,priceType:'verified-zero'}}).amountVnd,0);assert.equal(materialUnit('m2'),'m²');assert.equal(materialUnit('thùng'),'thùng');assert.notEqual(materialUnit('thùng'),materialUnit('m²'));
});
test('expired source retains amount for review but is labelled expired; malformed amounts never become zero',()=>{
 for(const amountVnd of [null,'',0,-1,Infinity,'220000'])assert.equal(materialPriceEvidence({...product(),priceEvidence:{amountVnd}}).amountVnd,null);
 const p=materialPriceEvidence({...product(),priceEvidence:{amountVnd:220000,quantityUnit:'thùng',validUntil:'2026-01-01',quotedAt:'2025-12-20',includesVat:false}},Date.parse('2026-10-07'));assert.equal(p.priceType,'expired');assert.equal(p.amountVnd,220000);assert.equal(p.quantityUnit,'thùng');assert.equal(p.includesVat,false);assert.equal(p.includesLabour,null);
});
test('page price requires exact structured SKU, VND and an explicit unit; a visible number is not a quote',()=>{
 const source=(sku='TILE-600',currency='VND',unit='MTK',price=220000)=>'<p>'+sku+' mã sản phẩm, 220000 lượt xem</p><script type="application/ld+json">'+JSON.stringify({'@type':'Product',sku,offers:{price,priceCurrency:currency,priceSpecification:unit?{unitCode:unit}:undefined}})+'</script>';
 for(const [sku,currency,unit] of [['TILE-600X','VND','MTK'],['TILE-600','USD','MTK'],['TILE-600','VND',null]])assert.equal(materialFromVerifiedPage(product(),{url:product().productUrl,html:source(sku,currency,unit)},'2026-10-07T10:00:00Z').price,null);
 const p=materialFromVerifiedPage(product(),{url:product().productUrl,html:source()},'2026-10-07T10:00:00Z');assert.equal(p.price,220000);assert.equal(p.unit,'m²');assert.equal(p.priceEvidence.quotedAt,null);assert.equal(p.priceEvidence.retrievedAt,'2026-10-07T10:00:00Z');assert.equal(p.priceEvidence.includesTransport,null);assert.equal(p.photoLicense.verified,false);
 assert.equal(materialFromVerifiedPage(product(),{url:product().productUrl,html:source('TILE-600','VND','MTK',0)}).priceEvidence.priceType,'verified-zero');
});
test('SKU matching rejects substring codes but accepts exact visible or JSON-LD model',()=>{
 assert.equal(productPageMatchesSku('<p>TILE-600X</p>','TILE-600'),false);assert.equal(productPageMatchesSku('<p>Mã: TILE-600 / 600 mm</p>','TILE-600'),true);assert.equal(productPageMatchesSku('<p>SKU khác</p>','TILE-600'),false);assert.equal(productPageMatchesSku('<script type="application/ld+json">{"@type":"Product","sku":"TILE-600"}</script>','TILE-600'),true);
});
test('manufacturer outage preserves all sourced catalog groups without inventing quotes',async()=>{
 const snapshots=new Map();for(const c of ['floor','cement','steel','waterproof','paint','mep','door','sanitary','roof','insulation','lighting','cabinetry']){const d=await officialMaterials(c);assert.ok(d.products.length>=4,c);for(const p of d.products){assert.equal(p.price,p.priceEvidence.amountVnd);if(p.price!==null){assert.ok(p.price>0);assert.equal(p.priceEvidence.priceType,'reference');assert.ok(p.priceEvidence.sourceUrl);assert.ok(p.priceEvidence.retrievedAt);assert.equal(p.priceEvidence.quotedAt,null);}assert.equal(p.photoLicense.commercialUse,false);}snapshots.set(c,JSON.stringify(d.products));}
 const d=await officialMaterials('floor',{refresh:true,fetchPage:async()=>{throw Error('offline');}});assert.ok(d.products.length>=4);assert.equal(JSON.stringify(d.products),snapshots.get('floor'));
});
test('source normalization sanitizes bad URLs and does not use priceDate as retrieval date',()=>{
 const p=normalizeMaterialProduct({...product(),productUrl:'http://bad.example',source:'https://127.0.0.1/',priceEvidence:{amountVnd:120000,sourceUrl:'https://user:secret@bad.example/',quotedAt:'2026-05-04'}});assert.equal(p.priceEvidence.sourceUrl,null);assert.equal(p.priceEvidence.quotedAt,'2026-05-04');assert.equal(p.priceEvidence.retrievedAt,'2026-10-01');
});
test('choosing web price never creates a project quote and unknown supplier image is not embedded',()=>{
 const {B,state}=client(),x={...product(),price:220000,priceEvidence:{...product().priceEvidence,amountVnd:220000,priceType:'reference'},imageUrl:'https://manufacturer.example/a.jpg'};assert.equal(B.adoptWebMaterial(x),true);const q=state.project.dataEngine.materialOverrides[x.id];assert.equal(q.value,null);assert.equal(q.date,'');assert.equal(q.source,'');assert.equal(q.imageUrl,null);assert.equal(q.product.price,220000);assert.equal(state.project.materials.choices.floor,x.id);const card=B.webProductCard(x);assert.match(card,/220\.000/);assert.match(card,/Chưa công bố/);assert.match(card,/Chưa rõ/);assert.match(card,/data-material-illustration/);assert.doesNotMatch(card,/data-material-product-image/);assert.doesNotMatch(card,/src="https:\/\/manufacturer.example\/a.jpg/);assert.match(card,/sản phẩm & ảnh tại nguồn/i);
});
test('a verified existing project quote survives only exact product SKU, specification and unit',()=>{
 const {B,state}=client(),x=product();B.adoptWebMaterial(x);const q=state.project.dataEngine.materialOverrides[x.id];Object.assign(q,{value:150000,source:'Nhà cung cấp thử',date:'2026-10-02',unit:'m2',priceEvidence:{...q.priceEvidence,amountVnd:150000,priceType:'project-quote'}});B.adoptWebMaterial({...x,verifiedAt:'2026-10-07'});assert.equal(state.project.dataEngine.materialOverrides[x.id].value,150000);assert.equal(state.project.dataEngine.materialOverrides[x.id].priceEvidence.priceType,'project-quote');
 B.adoptWebMaterial({...x,unit:'thùng',priceEvidence:{...x.priceEvidence,quantityUnit:'thùng'}});const updated=state.project.dataEngine.materialOverrides[x.id];assert.equal(updated.value,null);assert.equal(updated.previousQuotes.length,1);assert.equal(updated.previousQuotes[0].value,150000);assert.equal(updated.previousQuotes[0].unit,'m2');assert.ok(state.project.designEvidence.materialSources.some(e=>e.verifiedState==='stale'));
});
test('legacy quote without canonical identity and same-SKU changed specification are retained as history, not reused',()=>{
 for(const prior of [null,{...product(),spec:'800 × 800 mm'}]){const {B,state}=client(),x=product();state.project.dataEngine.materialOverrides[x.id]={value:800000,sku:x.sku,source:'Báo giá khách nhập',date:'2026-10-01',unit:'m²',...(prior?{product:prior}:{})};B.adoptWebMaterial(x);const q=state.project.dataEngine.materialOverrides[x.id];assert.equal(q.value,null);assert.equal(q.previousQuotes[0].value,800000);}
});
test('price evidence scopes include specification/unit; same SKU changes invalidate old source records',()=>{
 const {B,state}=client(),x=product();B.adoptWebMaterial(x);B.adoptWebMaterial({...x,spec:'800 × 800 mm'});assert.equal(state.project.designEvidence.materialSources[0].verifiedState,'stale');const row=state.project.designEvidence.materialSources.at(-1);assert.equal(row.scope.sku,x.sku);assert.equal(row.scope.specification,'800 × 800 mm');assert.equal(row.scope.quantityUnit,'m²');assert.equal(row.value.amountVnd,null);
});
test('default catalog application protects manually selected room and preserves measured plan and choices',()=>{
 const {B,state}=client(),x=product();B.adoptWebMaterial(x);B.applyVisualMaterial('floor','white-marble','b');const plan=JSON.stringify(state.project.plan);assert.equal(B.applyCatalogMaterial('floor','ivory-tile'),true);assert.equal(B.finishPalette('a').visualMaterials.floor,'ivory-tile');assert.equal(B.finishPalette('b').visualMaterials.floor,'white-marble');assert.equal(B.finishPalette('b').catalogMaterials.floor,undefined);assert.equal(JSON.stringify(state.project.plan),plan);assert.equal(state.project.materials.choices.floor,x.id);assert.equal(B.finishPalette('a').catalogMaterials.floor.exactness,'generic');
});
test('room target changes only that room, while explicit all can replace existing manual finish',()=>{
 const {B}=client();B.adoptWebMaterial(product());B.applyVisualMaterial('floor','walnut-floor','a');B.applyVisualMaterial('floor','white-marble','b');assert.equal(B.applyCatalogMaterial('floor','grey-concrete',{roomId:'b',scope:'room'}),true);assert.equal(B.finishPalette('a').visualMaterials.floor,'walnut-floor');assert.equal(B.finishPalette('b').visualMaterials.floor,'grey-concrete');assert.equal(B.applyCatalogMaterial('floor','ivory-tile',{scope:'all'}),true);assert.equal(B.finishPalette('a').visualMaterials.floor,'ivory-tile');assert.equal(B.finishPalette('b').visualMaterials.floor,'ivory-tile');assert.equal(B.applyCatalogMaterial('floor','ivory-tile',{roomId:'missing'}),false);
});
test('binding verifies identity, slot, exact metre scale and active profile; incomplete legacy binding is stale',()=>{
 const {B}=client(),x=product(),b=B.createCatalogMaterialBinding(x,'ivory-tile',{roomId:'a'});assert.equal(B.catalogBindingStatus('floor',b,x).valid,true);for(const change of [{sku:'TILE-800'},{specification:'800 mm'},{quantityUnit:'thùng'},{surfaceSlot:'wall'},{visualProfileId:'oak-floor'},{realWorldScale:[60,60]},{textureAssetId:'pretend-vendor-texture'}])assert.equal(B.catalogBindingStatus('floor',{...b,...change},x).valid,false);assert.equal(B.catalogBindingStatus('floor',{id:x.id,profileId:'ivory-tile'},x).status,'stale');assert.equal(B.catalogBindingStatus('floor',b,x,{visualMaterials:{floor:'white-marble'}}).valid,false);
});
test('stale same-ID SKU/spec/unit returns current-style fallback without mutating saved bindings; persists through reload',()=>{
 for(const changed of [{sku:'TILE-800'},{spec:'800 × 800 mm'},{unit:'thùng',priceEvidence:{...product().priceEvidence,quantityUnit:'thùng'}}]){const {B,state}=client();B.adoptWebMaterial(product());B.applyCatalogMaterial('floor','ivory-tile',{scope:'all'});Object.assign(state.project.dataEngine.materialOverrides['tile-a'].product,changed);const saved=JSON.stringify(state.project.materials.finish),p=B.finishPalette('a');assert.equal(p.materialBindingStatuses.floor.status,'stale');assert.equal(p.catalogMaterials.floor,undefined);assert.equal(p.visualMaterials.floor,'oak-floor');assert.equal(JSON.stringify(state.project.materials.finish),saved);state.project.materials.finish=json(state.project.materials.finish);assert.equal(B.finishPalette('a').visualMaterials.floor,'oak-floor');}
});
test('manual surface choice clears supplier association even if same profile is reapplied, leaving other room intact',()=>{
 const {B}=client();B.adoptWebMaterial(product());B.applyCatalogMaterial('floor','ivory-tile',{scope:'all'});B.applyVisualMaterial('floor','ivory-tile','b');assert.equal(B.finishPalette('b').catalogMaterials.floor,undefined);assert.equal(B.finishPalette('a').catalogMaterials.floor.productId,'tile-a');B.applyVisualMaterial('floor','white-marble','b');assert.equal(B.finishPalette('b').visualMaterials.floor,'white-marble');
});
test('future unassigned room inherits valid global binding, but a manually authored role never inherits supplier association',()=>{
 const {B,state}=client();B.adoptWebMaterial(product());B.applyCatalogMaterial('floor','ivory-tile',{scope:'all'});state.project.plan.rooms.push({id:'future',type:'bed',floor:0});assert.equal(B.finishPalette('future').catalogMaterials.floor.productId,'tile-a');B.applyVisualMaterial('floor','oak-floor','future');assert.equal(B.finishPalette('future').catalogMaterials.floor,undefined);assert.equal(B.finishPalette('future').visualMaterials.floor,'oak-floor');
});
test('collection update retains manual attribution and explicitly replaces surface associations without changing supplier selection',()=>{
 const {B,state}=client();B.adoptWebMaterial(product());B.applyCatalogMaterial('floor','ivory-tile',{scope:'all'});B.applyInteriorCollection('soft-curves','b');assert.equal(state.project.materials.finish.interior.authored.b,'manual');assert.equal(B.finishPalette('b').catalogMaterials.floor,undefined);assert.equal(state.project.materials.choices.floor,'tile-a');assert.equal(B.finishPalette('a').catalogMaterials.floor.productId,'tile-a');
});
test('unlicensed manufacturer proxy rejects before any network or DNS access',async()=>{
 const out={code:null,status(n){this.code=n;return this;},setHeader(){},end(body){this.body=JSON.parse(body);}};await materialImage({method:'GET',url:'/api/material-image?url='+encodeURIComponent('https://dongtam.com.vn/wp-content/uploads/test.jpg')},out);assert.equal(out.code,403);assert.match(out.body.error,/quyền sử dụng thương mại/);
});
test('material Search policy denies unapproved quota without calling provider or fetching products',async()=>{
 let calls=0;const d=await researchMaterials({query:'Fixture'},{env:{key:'fixture',primary:'gemini-fixture'},settings:{GEMINI_SEARCH_ENABLED:'true',GEMINI_MATERIAL_SEARCH_QUOTA:'unknown'},generate:async()=>{calls++;},fetchPage:async()=>{calls++;}});assert.equal(calls,0);assert.equal(d.status,'not_allowed');assert.equal(d.products.length,0);
});
test('material Search deduplicates calls and discards AI-written prices; only exact sourced SKU and unit survive',async()=>{
 let calls=0,pages=0;const opts={env:{key:'fixture-search-dedup',primary:'gemini-fixture'},settings:{GEMINI_SEARCH_ENABLED:'true',GEMINI_MATERIAL_SEARCH_QUOTA:'allowed'},generate:async o=>{calls++;assert.equal(o.configuredOnly,true);assert.equal(o.timeoutMs,25000);return {model:'gemini-fixture',citations:[{url:'https://manufacturer.example/tile-a'}],result:{products:[{...product(),price:1,priceDate:'2026-10-07',phone:'',address:''},{...product(),sku:'TILE-600X'}]}};},fetchPage:async()=>{pages++;return {url:'https://manufacturer.example/tile-a',html:'<p>TILE-600</p><script type="application/ld+json">{"@type":"Product","sku":"TILE-600","offers":{"price":220000,"priceCurrency":"VND","priceSpecification":{"unitCode":"MTK"}}}</script>'};}};
 const [a,b]=await Promise.all([researchMaterials({query:'Fixture exact'},opts),researchMaterials({query:'Fixture exact'},opts)]);assert.equal(calls,1);assert.equal(pages,2);assert.equal(a.products.length,1);assert.equal(a.products[0].price,220000);assert.equal(a.products[0].priceEvidence.quotedAt,null);assert.equal(a.products[0].priceEvidence.quantityUnit,'m²');assert.equal(a.products[0].photoLicense.verified,false);assert.deepEqual(a.products,b.products);
});

test('same-ID adoption updates product card and registered specification while clearing a now-inapplicable quote',()=>{
 const {B,state}=client();B.adoptWebMaterial(product());B.adoptWebMaterial({...product(),spec:'800 × 800 mm',sku:'TILE-800'});assert.equal(B.materialResearch.products.find(x=>x.id==='tile-a').sku,'TILE-800');assert.equal(B.MATERIALS.floor.find(x=>x.id==='tile-a').sub,'800 × 800 mm');assert.match(B.webProductCard(B.materialResearch.products.find(x=>x.id==='tile-a')),/TILE-800/);assert.equal(state.project.dataEngine.materialOverrides['tile-a'].value,null);
});
test('quota rejection blocks subsequent different queries on the same provider account without retry',async()=>{
 let calls=0;const options={env:{key:'fixture-quota-stop',primary:'gemini-fixture'},settings:{GEMINI_SEARCH_ENABLED:'true',GEMINI_MATERIAL_SEARCH_QUOTA:'allowed'},generate:async()=>{calls++;throw Object.assign(Error('quota fixture'),{statusCode:429});}};await assert.rejects(researchMaterials({query:'quota first'},options),/quota fixture/);const next=await researchMaterials({query:'quota second'},options);assert.equal(next.status,'quota_or_permission_blocked');assert.equal(calls,1);
});

test('legacy colour and surface controls clear supplier bindings and protect manual room intent',()=>{
 const {B,state}=client();B.adoptWebMaterial(product());B.applyCatalogMaterial('floor','ivory-tile',{scope:'all'});const plan=JSON.stringify(state.project.plan);assert.equal(B.applyFinishColor('floor','#123456','b'),true);assert.equal(B.finishPalette('b').floor,'#123456');assert.equal(B.finishPalette('b').catalogMaterials.floor,undefined);assert.equal(B.finishPalette('a').catalogMaterials.floor.productId,'tile-a');assert.equal(B.applyFinishSurface('stone','b'),true);assert.equal(B.finishPalette('b').visualMaterials.floor,'sand-travertine');assert.equal(B.finishPalette('b').catalogMaterials.floor,undefined);assert.equal(JSON.stringify(state.project.plan),plan);assert.equal(state.project.materials.choices.floor,'tile-a');
});
test('returning a surface to style follows the current collection on read without reviving a supplier binding',()=>{
 const {B,state}=client();B.adoptWebMaterial(product());B.applyCatalogMaterial('floor','ivory-tile',{scope:'all'});B.applyFinishSurface('auto','b');assert.equal(B.finishPalette('b').surface,'auto');assert.equal(B.finishPalette('b').visualMaterials.floor,'oak-floor');state.project.style='Hiện đại';B.houseStyle=()=>({id:'modern',wall:'#eee'});B.interiorCollection=id=>B.INTERIOR_COLLECTIONS.find(c=>c.id==='urban-stone');const p=B.finishPalette('b');assert.equal(p.visualMaterials.floor,'grey-concrete');assert.equal(p.surface,'auto');assert.equal(p.catalogMaterials.floor,undefined);assert.equal(state.project.materials.choices.floor,'tile-a');
});

// Price observation and date are separate: an old published period never
// becomes a current quote just because the page was fetched again today.
test('dated reference prices retain supplier identity, units and historic periods without creating a quote',()=>{
 const catalog=JSON.parse(fs.readFileSync('assets/materials/official-catalog.json')),priced=catalog.products.filter(x=>x.price!==null&&x.priceEvidence.retrievedAt==='2026-10-09');assert.equal(priced.length,13);
 const {B,state}=client(),at=Date.parse('2026-10-09T12:00:00Z');let stale=0,checked=0;
 for(const x of priced){const p=materialPriceEvidence(x,at);assert.equal(p.sourceType,'supplier');assert.ok(p.publisher);assert.equal(p.quotedAt,null);assert.equal(p.retrievedAt,'2026-10-09');assert.equal(p.amountVnd,x.price);assert.ok(p.quantityUnit);for(const key of ['includesVat','includesLabour','includesTransport'])assert.equal(p[key],null);const status=B.materialPriceFreshness(p,at);if(status==='stale')stale++;else if(status==='checked')checked++;}
 assert.equal(stale,7);assert.equal(checked,6);
 const historic=priced.find(x=>x.priceEvidence.publishedPeriod==='2025'),fresh={...historic.priceEvidence,retrievedAt:'2026-10-09'};assert.equal(B.materialPriceFreshness(fresh,at),'stale');
 B.adoptWebMaterial({...priced[0],category:'floor'});assert.equal(state.project.dataEngine.materialOverrides[priced[0].id].value,null);
});
test('every bundled product has a local generic illustration, and untrusted category cannot escape the asset directory',()=>{
 const {B}=client(),catalog=JSON.parse(fs.readFileSync('assets/materials/official-catalog.json'));for(const p of catalog.products){const file=B.materialIllustration(p);assert.ok(fs.existsSync(file));assert.match(fs.readFileSync(file,'utf8'),/^<svg/);assert.ok(B.webProductCard(p).includes('data-material-illustration'));}
 assert.equal(B.materialIllustration({category:'../../private'}),'assets/materials/illustrations/wall.svg');
});
test('catalogue cards reuse the measured customer sample for the same SKU and never another product or project',()=>{
 const {B,state,context}=client();context.structuredClone=structuredClone;vm.runInNewContext(fs.readFileSync('src/44_house_styles.js','utf8'),context);vm.runInNewContext(fs.readFileSync('src/90_product_polish.js','utf8'),context);
 const p=product();B.adoptWebMaterial(p);B.applyCatalogMaterial('floor','ivory-tile',{roomId:'a',scope:'room'});
 const binding=state.project.materials.finish.rooms.a.catalogMaterials.floor;
 binding.sample={mediaId:'material-sample-fixture-123',productId:p.id,sku:p.sku,specification:binding.specification,realWorldScale:[.6,.6],rotationDeg:37,sourceReference:'Synthetic sample test'};
 const originalProject=state.project;B.materialSampleForBinding=b=>state.project===originalProject&&b===binding?{image:{src:'data:image/jpeg;base64,TEST'}}:null;
 let html=B.webProductCard(p);assert.match(html,/data-material-customer-sample/);assert.match(html,/600 × 600 mm/);assert.doesNotMatch(html,/data-material-illustration/);
 assert.doesNotMatch(B.webProductCard({...p,id:'other'}),/data-material-customer-sample/);
 assert.doesNotMatch(B.webProductCard({...p,sku:'OTHER'}),/data-material-customer-sample/);
 state.ui.sceneFocus='room:b';assert.match(B.webProductCard(p),/data-material-customer-sample/);
 state.project={...originalProject,materials:{choices:{},finish:{rooms:{},exterior:null}}};assert.doesNotMatch(B.webProductCard(p),/data-material-customer-sample/);
});
