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
 const rows=catalog.products.filter(p=>p.photoReference?.checkedAt==='2026-10-22');assert.equal(rows.length,11);assert.equal(new Set(rows.map(p=>p.photoReference.imageUrl)).size,11);
 for(const p of rows){const r=p.photoReference;assert.equal(r.sku,p.sku);assert.equal(r.specification,p.specification||p.spec);assert.equal(r.imageUrl,p.imageUrl);assert.equal(r.status,'source-matched');assert.equal(r.checkedAt,'2026-10-22');assert.ok(['dongtamshop.com','rangdong.com.vn','ancuong.com'].includes(new URL(r.sourceUrl).hostname));assert.equal(p.photoLicense.verified,false);assert.equal(p.photoLicense.commercialUse,false);assert.ok(r.notes);assert.notEqual(p.priceEvidence.retrievedAt,'2026-10-22');}
});
test('only shipped exact identity can display a reference; project/search claims cannot self-approve',()=>{
 const {B}=client(),p=B.materialResearch.products.find(p=>p.sku==='6060DB038');
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
 const {B}=client();B.materialResearch.visible=12;const html=B.materialCatalogHtml('floor');const first=html.match(/data-product-id="([^"]+)"/)[1];assert.ok(B.materialPhotoReference(B.materialResearch.products.find(p=>p.id===first)));assert.match(html,new RegExp(catalog.products.filter(p=>p.category==='floor'&&p.photoReference).length+' lựa chọn có ảnh đối chiếu từ nguồn'));
 B.materialResearch.filter='6060DB038';const filtered=B.materialCatalogHtml('floor');assert.match(filtered,/1 lựa chọn/);assert.match(filtered,/Chưa có giá/);assert.doesNotMatch(filtered,/data-product-id="source-c0ebd3534344b375"/);
});

test('all twelve shipped material groups have a pinned manufacturer image reference without granting texture rights',()=>{
 const {B}=client(),groups=[...new Set(catalog.products.map(p=>p.category))];assert.equal(groups.length,12);
 for(const category of groups){const rows=B.materialResearch.products.filter(p=>p.category===category&&B.materialPhotoReference(p));assert.ok(rows.length>0,category);for(const p of rows){const ref=B.materialPhotoReference(p);assert.equal(ref.imageUrl,p.imageUrl);assert.equal(ref.specification,p.specification||p.spec);assert.equal(p.photoLicense.verified,false);assert.equal(p.photoLicense.commercialUse,false);assert.equal(B.materialProductPhotoStatus(p).displayable,false);}}
});

test('product range pictures state their limits and zoom uses the product name when no SKU is selected',()=>{
 const {B,dialogs}=client(),p=B.materialResearch.products.find(p=>p.category==='paint'&&p.photoReference?.kind==='product-range');
 assert.equal(p.sku,'');const html=B.webProductCard(p);assert.match(html,/Ảnh dòng sản phẩm từ hãng/);assert.match(html,/Cần chốt mã, màu và quy cách/);assert.match(html,/xem nguồn/);assert.doesNotMatch(html,/data-material-illustration/);
 assert.equal(B.openMaterialReference(p.id),true);assert.match(dialogs[0].innerHTML,new RegExp('<h2>'+escape(p.name)+'</h2>'));assert.match(dialogs[0].innerHTML,/chưa xác nhận quyền tái sử dụng/);
 assert.equal(B.materialPhotoReference({...p,imageUrl:'https://example.org/changed.jpg'}),null);
});

test('source-picture filter composes with brand, search and price filters without changing the project',()=>{
 const {B}=client(),before=JSON.stringify(B.state.project);B.materialResearch.photoOnly=true;
 let html=B.materialCatalogHtml('floor');assert.match(html,/data-material-photo checked/);assert.match(html,new RegExp(catalog.products.filter(p=>p.category==='floor'&&p.photoReference).length+' lựa chọn'));assert.doesNotMatch(html,/data-material-illustration/);
 B.materialResearch.filter='6060DB038';html=B.materialCatalogHtml('floor');assert.match(html,/1 lựa chọn/);assert.match(html,/6060DB038/);
 B.materialResearch.priceFilter='known';assert.match(B.materialCatalogHtml('floor'),/Không có sản phẩm khớp/);
 B.materialResearch.filter='';B.materialResearch.priceFilter='';B.materialResearch.brand='Hãng không tồn tại';assert.match(B.materialCatalogHtml('steel'),/Ảnh dòng sản phẩm từ hãng/);
 assert.equal(JSON.stringify(B.state.project),before);
});

test('new INAX SKU retains its own manufacturer price and conflicting dimensions without changing the older SKU',()=>{
 const {B}=client(),p=B.materialResearch.products.find(p=>p.sku==='AC-959VAN-2'),old=B.materialResearch.products.find(p=>p.sku==='AC-959VAN');
 assert.notEqual(p.id,old.id);assert.equal(p.priceEvidence.amountVnd,8690000);assert.equal(p.priceEvidence.sourceType,'manufacturer');assert.equal(p.priceEvidence.quotedAt,null);assert.match(p.specification,/636 mm/);assert.match(p.specification,/629 mm/);assert.notEqual(old.priceEvidence.amountVnd,p.priceEvidence.amountVnd);
 B.v6MatMeta.sanitary=['','Thiết bị vệ sinh'];B.MATERIALS.sanitary=[];assert.equal(B.adoptWebMaterial(p),true);const saved=JSON.parse(JSON.stringify(B.state.project));assert.equal(saved.materials.choices.sanitary,p.id);assert.equal(saved.dataEngine.materialOverrides[p.id].value,null);assert.equal(saved.dataEngine.materialOverrides[p.id].product.price,8690000);assert.equal(saved.dataEngine.materialOverrides[p.id].imageUrl,null);
 const priced=B.materialResearch.products.filter(p=>p.photoReference?.checkedAt==='2026-10-25'&&p.priceEvidence.amountVnd!==null&&p.id!=='official-ac-959van-2');for(const row of priced)assert.notEqual(row.priceEvidence.retrievedAt,'2026-10-25','photo review cannot refresh price date');
});
