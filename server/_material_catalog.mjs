import catalog from '../assets/materials/official-catalog.json' with {type:'json'};
import {publicPage,pageMetadata} from './_public_web.mjs';
const cache=new Map();
export async function officialMaterials(category='floor',{refresh=false}={}){
 const key=String(category),base=catalog.products.filter(p=>p.category===key),old=cache.get(key);
 if(!refresh)return {products:old?.products||base,summary:'Danh mục có sẵn từ nguồn chính hãng. Giá và quy cách được chốt trong báo giá của nhà cung cấp.'};
 if(old&&Date.now()-old.at<3600000)return {products:old.products,summary:old.summary};
 const updates=new Map(),targets=[...base].sort((a,b)=>Number(!!a.imageUrl)-Number(!!b.imageUrl)).slice(0,6),normalize=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
 const pending=Promise.allSettled(targets.map(async product=>{
  try{const page=await publicPage(product.productUrl,{timeoutMs:4500}),meta=pageMetadata(page.html,page.url,product.sku||'');if(product.sku&&!normalize(meta.text).includes(normalize(product.sku)))return;
   updates.set(product.id,{...product,productUrl:page.url,imageUrl:meta.imageUrl||product.imageUrl,photoEvidence:meta.imageUrl?'source-page':product.photoEvidence,verifiedAt:new Date().toISOString(),price:meta.price||0,priceStatus:meta.price?'public-listed':'request-quote'});
  }catch{} // Keep the curated record if a manufacturer is temporarily unavailable.
 }));
 let timer;await Promise.race([pending,new Promise(resolve=>{timer=setTimeout(resolve,5500);})]);clearTimeout(timer);
 const products=base.map(p=>updates.get(p.id)||p),summary='Đã đối chiếu '+updates.size+'/'+targets.length+' trang nguồn. '+products.length+' lựa chọn vẫn có sẵn; giá và quy cách xác nhận với hãng trước khi đặt.';
 cache.set(key,{at:Date.now(),products,summary});return {products,summary};
}
