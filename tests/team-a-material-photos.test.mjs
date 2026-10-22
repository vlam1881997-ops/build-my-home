import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const catalog=JSON.parse(fs.readFileSync('assets/materials/official-catalog.json','utf8'));
const source=fs.readFileSync('src/75_completion.js','utf8');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function client(){
 const data=structuredClone(catalog),dialogs=[],focus={isConnected:true,focus(){this.restored=true;}},document={activeElement:focus,body:{appendChild(d){dialogs.push(d);}},createElement(){return {setAttribute(){},addEventListener(name,fn){this[name]=fn;},showModal(){this.open=true;},remove(){this.removed=true;}};}};
 const state={ui:{},project:{style:'Hiện đại',materials:{choices:{}},dataEngine:{materialOverrides:{}}}},B={state,MATERIALS:{floor:[],lighting:[],cabinetry:[]},v6MatMeta:{floor:['','Sàn'],lighting:['','Đèn'],cabinetry:['','Gỗ']},dataEngineState:()=>state.project.dataEngine,v6Esc:escape,v71SafeHttps:v=>{try{const u=new URL(v);return u.protocol==='https:'?u.href:'';}catch{return '';}},save(){},render(){},toast(){}};
 vm.runInNewContext(source.slice(source.indexOf('BMH.materialUnit='),source.indexOf('const completionScreen6=')),{BMH:B,BMH_CATALOG_DATA:data,document,URL});
 return {B,dialogs,focus,data};
}
test('curated references identify eleven distinct existing SKUs, with provenance and no rights or price fabrication',()=>{
 const rows=catalog.products.filter(p=>p.photoReference);assert.equal(rows.length,11);assert.equal(new Set(rows.map(p=>p.photoReference.imageUrl)).size,11);
 for(const p of rows){const r=p.photoReference;assert.equal(r.sku,p.sku);assert.equal(r.specification,p.specification||p.spec);assert.equal(r.imageUrl,p.imageUrl);assert.equal(r.status,'source-matched');assert.equal(r.checkedAt,'2026-10-22');assert.ok(['dongtamshop.com','rangdong.com.vn','ancuong.com'].includes(new URL(r.sourceUrl).hostname));assert.equal(p.photoLicense.verified,false);assert.equal(p.photoLicense.commercialUse,false);assert.ok(r.notes);assert.notEqual(p.priceEvidence.retrievedAt,'2026-10-22');}
});
test('only shipped exact identity can display a reference; project/search claims cannot self-approve',()=>{
 const {B}=client(),p=B.materialResearch.products.find(p=>p.photoReference);
 assert.ok(B.materialPhotoReference(p));
 for(const delta of [{id:'forged'},{sku:'OTHER'},{specification:'800 mm'},{category:'paint'},{productUrl:'https://example.org/other'},{imageUrl:'https://example.org/other.jpg'},{priceEvidence:{...p.priceEvidence,quantityUnit:'thùng'}}])assert.equal(B.materialPhotoReference({...p,...delta}),null,JSON.stringify(delta));
 assert.equal(B.materialPhotoReference({...p,id:'imported',photoReference:{...p.photoReference,status:'source-matched'}}),null);
 const prior=B.materialPhotoReference(p).imageUrl;p.photoReference.imageUrl='https://example.org/evil.jpg';assert.equal(B.materialPhotoReference(p).imageUrl,prior);
});
test('source photos appear and open large while proxy/export photo gate remains closed after selection and JSON roundtrip',()=>{
 const {B,dialogs,focus}=client(),p=B.materialResearch.products.find(p=>p.sku==='6060DB038');
 const html=B.webProductCard(p);assert.match(html,/data-material-reference-image/);assert.match(html,/Xem lớn/);assert.match(html,/6060DB038/);assert.doesNotMatch(html,/data-material-product-image/);
 assert.equal(B.materialProductPhotoStatus(p).displayable,false);B.adoptWebMaterial(p);const q=JSON.parse(JSON.stringify(B.state.project.dataEngine.materialOverrides[p.id]));assert.equal(q.imageUrl,null);assert.ok(B.materialPhotoReference(q.product));assert.equal(q.value,null);
 assert.equal(B.openMaterialReference(p.id),true);assert.equal(dialogs[0].open,true);assert.match(dialogs[0].innerHTML,/Đồng Tâm Shop/);assert.match(dialogs[0].innerHTML,/Không dùng tự động làm texture 3D/);dialogs[0].close();assert.equal(focus.restored,true);assert.equal(dialogs[0].removed,true);
});
test('manufacturer surfaces stay distinct from product photos, and imported labels are escaped in cards/dialogs',()=>{
 const {B,dialogs}=client(),p=B.materialResearch.products.find(p=>p.sku==='MFC - MS 430 BT');
 p.name='<img src=x onerror=evil()>';assert.equal(B.materialPhotoReference(p).kind,'surface-sample');assert.match(B.webProductCard(p),/Ảnh mẫu bề mặt từ hãng/);assert.doesNotMatch(B.webProductCard(p),/<img src=x/);B.openMaterialReference(p.id);assert.doesNotMatch(dialogs[0].innerHTML,/<img src=x/);
});
test('photo-first catalog ranking preserves filters and missing-price products',()=>{
 const {B}=client();B.materialResearch.visible=12;const html=B.materialCatalogHtml('floor');const first=html.match(/data-product-id="([^"]+)"/)[1];assert.ok(B.materialPhotoReference(B.materialResearch.products.find(p=>p.id===first)));assert.match(html,/5 mã có ảnh đối chiếu từ hãng/);
 B.materialResearch.filter='6060DB038';const filtered=B.materialCatalogHtml('floor');assert.match(filtered,/1 lựa chọn/);assert.match(filtered,/Chưa có giá/);assert.doesNotMatch(filtered,/data-product-id="source-c0ebd3534344b375"/);
});
