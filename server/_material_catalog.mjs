import {discoverOfficialMaterials} from './_material_discovery.mjs';
import catalog from '../assets/materials/official-catalog.json' with {type:'json'};
import {publicHttps,publicPage,pageMetadata} from './_public_web.mjs';
const cache=new Map(),inflight=new Map();
const iso=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}(?:T[^\s]+)?$/.test(v)&&Number.isFinite(Date.parse(v))?v:null;
export const materialUnit=v=>{const u=typeof v==='string'?v.trim():'';return ({m2:'m²',M2:'m²',MTK:'m²',LTR:'lít',KGM:'kg',C62:'cái',EA:'cái'})[u]||u||null;};
const amount=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
const flag=v=>typeof v==='boolean'?v:null;
export function materialPriceEvidence(product={},now=Date.now()){
 const e=product.priceEvidence&&typeof product.priceEvidence==='object'?product.priceEvidence:{},provided=Object.hasOwn(e,'amountVnd'),legacy=amount(product.price),candidate=provided?amount(e.amountVnd):legacy>0?legacy:null,value=candidate===0&&!['verified-zero','project-quote'].includes(e.priceType)?null:candidate,unit=materialUnit(e.quantityUnit??product.unit),source=publicHttps(e.sourceUrl||product.source||product.productUrl)||null,validUntil=iso(e.validUntil),expired=validUntil&&Date.parse(validUntil.length===10?validUntil+'T23:59:59.999Z':validUntil)<now;
 return {productId:String(product.id||e.productId||''),sku:typeof product.sku==='string'&&product.sku?product.sku:e.sku||null,specification:product.specification||product.spec||e.specification||null,quantityUnit:unit,amountVnd:value,priceType:expired?'expired':value===null?'unknown':['reference','project-quote','verified-zero','unverified'].includes(e.priceType)?e.priceType:legacy>0?'unverified':'reference',sourceUrl:source,quotedAt:iso(Object.hasOwn(e,'quotedAt')?e.quotedAt:product.priceDate),retrievedAt:iso(Object.hasOwn(e,'retrievedAt')?e.retrievedAt:product.verifiedAt),locationScope:e.locationScope||product.locationScope||null,includesVat:flag(e.includesVat),includesLabour:flag(e.includesLabour),includesTransport:flag(e.includesTransport),validUntil,publisher:typeof e.publisher==='string'?e.publisher.slice(0,160):null,sourceType:e.sourceType==='supplier'?'supplier':'manufacturer',publishedPeriod:/^\d{4}(?:-\d{2})?$/.test(e.publishedPeriod||'')?e.publishedPeriod:null,notes:typeof e.notes==='string'?e.notes.slice(0,600):null};
}
export function normalizeMaterialProduct(product,now=Date.now()){
 const priceEvidence=materialPriceEvidence(product,now);return {...product,price:priceEvidence.amountVnd,unit:priceEvidence.quantityUnit,priceDate:priceEvidence.quotedAt,priceEvidence,priceStatus:priceEvidence.priceType,photoLicense:product.photoLicense||{commercialUse:false,verified:false,sourceUrl:null}};
}
const skuKey=v=>String(v||'').trim().toUpperCase().replace(/\s+/g,'');
export function productPageMatchesSku(html,sku){
 if(!skuKey(sku))return false;const esc=String(sku).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),text=pageMetadata(html,'https://source.example/').text;return new RegExp('(^|[^A-Za-z0-9_-])'+esc+'(?=$|[^A-Za-z0-9_-])','i').test(text)||structuredProducts(html).some(p=>skuKey(p.sku)===skuKey(sku));
}
function structuredProducts(html){
 const rows=[],walk=x=>{if(!x||typeof x!=='object')return;if(Array.isArray(x))return x.forEach(walk);if((Array.isArray(x['@type'])?x['@type']:[x['@type']]).includes('Product'))rows.push(x);if(x['@graph'])walk(x['@graph']);};
 for(const m of String(html).matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))try{walk(JSON.parse(m[1]));}catch{}return rows;
}
export function materialFromVerifiedPage(product,page,retrievedAt=new Date().toISOString()){
 const meta=pageMetadata(page.html,page.url,product.sku||''),p=structuredProducts(page.html).find(x=>product.sku&&skuKey(x.sku)===skuKey(product.sku)),offer=(Array.isArray(p?.offers)?p.offers:p?.offers?[p.offers]:[]).find(x=>x.priceCurrency==='VND'),ps=offer?.priceSpecification,unit=materialUnit(ps?.referenceQuantity?.unitCode||ps?.referenceQuantity?.unitText||ps?.unitCode||ps?.unitText||offer?.unitCode||offer?.unitText||p?.unitCode||p?.unitText),rawPrice=offer?.price??ps?.price,value=rawPrice!==undefined&&rawPrice!==null&&rawPrice!==''&&unit?amount(Number(rawPrice)):null;
 const evidence={productId:product.id,sku:product.sku||null,specification:product.specification||product.spec||null,quantityUnit:unit||materialUnit(product.unit),amountVnd:value,priceType:value===null?'unknown':value===0?'verified-zero':'reference',sourceUrl:publicHttps(page.url)||null,quotedAt:iso(offer?.validFrom||ps?.validFrom),retrievedAt,locationScope:product.locationScope||null,includesVat:flag(ps?.valueAddedTaxIncluded),includesLabour:null,includesTransport:null,validUntil:iso(offer?.priceValidUntil||ps?.validThrough)};
 // A page refresh is not permission to reuse a different image or product source.
 const imageUrl=meta.imageUrl||product.imageUrl,sameImage=!!publicHttps(imageUrl)&&publicHttps(imageUrl)===publicHttps(product.imageUrl)&&!!publicHttps(page.url)&&publicHttps(page.url)===publicHttps(product.productUrl),photoLicense=sameImage?product.photoLicense:{commercialUse:false,verified:false,sourceUrl:null};
 return normalizeMaterialProduct({...product,productUrl:page.url,imageUrl,photoLicense,photoEvidence:meta.imageUrl?'source-page':product.photoEvidence,verifiedAt:retrievedAt,priceEvidence:evidence});
}
export async function officialMaterials(category='floor',{refresh=false,fetchPage=publicPage,discover=discoverOfficialMaterials}={}){
 const key=String(category),base=catalog.products.filter(p=>p.category===key).map(p=>normalizeMaterialProduct(p)),old=cache.get(key);
 if(!refresh)return {products:old?.products||base,summary:'Danh mục có nguồn chính hãng. Giá thiếu giữ chưa có giá; đơn vị và báo giá công trình cần xác nhận riêng.'};
 if(old&&Date.now()-old.at<3600000)return {products:old.products,summary:old.summary,cached:true};if(inflight.has(key))return inflight.get(key);
 const task=(async()=>{const targets=base.filter(p=>p.sku).slice(0,6),updates=new Map();await Promise.allSettled(targets.map(async product=>{try{const page=await fetchPage(product.productUrl,{timeoutMs:4500});if(!productPageMatchesSku(page.html,product.sku))return;updates.set(product.id,materialFromVerifiedPage(product,page));}catch{}}));const products=base.map(p=>updates.get(p.id)||p),seen=new Set(products.map(p=>p.productUrl+'|'+skuKey(p.sku)));const found=await discover(key,{fetchPage}).catch(()=>[]);let added=0;for(const p of found){const identity=p.productUrl+'|'+skuKey(p.sku);if(!seen.has(identity)){products.push(normalizeMaterialProduct(p));seen.add(identity);added++;}}const summary='Đã đối chiếu '+updates.size+'/'+targets.length+' trang khớp mã và tìm thêm '+added+' sản phẩm từ hãng. '+products.length+' lựa chọn có nguồn; giá web là tham khảo, chưa phải báo giá công trình.';if(cache.size>=24)cache.delete(cache.keys().next().value);cache.set(key,{at:Date.now(),products,summary});return {products,summary};})();inflight.set(key,task);try{return await task;}finally{inflight.delete(key);}
}
