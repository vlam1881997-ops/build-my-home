import {createHash} from 'node:crypto';
import {publicPage,pageMetadata,unescapeHtml} from './_public_web.mjs';
export const catalogSeeds={
 floor:['https://dongtam.com.vn/san-pham/bst-db-nano/','https://dongtam.com.vn/san-pham/bst-6060tamdao/'],
 paint:['https://www.jotun.com/vn-vi/decorative/products','https://dongtam.com.vn/danh-muc-san-pham/son-nuoc/'],
 roof:['https://dongtam.com.vn/danh-muc-san-pham/ngoi-mau/'],
 waterproof:['https://dongtam.com.vn/danh-muc-san-pham/san-pham-ho-tro/'],
 door:['https://eurowindow.biz/cua-vach-nhom/cua-so-nhom','https://eurowindow.biz/cua-vach-nhom/cua-di-nhom']
};
export function catalogLinks(html,url){
 const origin=new URL(url).origin,links=[];
 for(const a of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
  try{const u=new URL(unescapeHtml(a[1]),url);if(u.origin!==origin||u.href===url||u.search||u.hash)continue;
   const valid=u.hostname.includes('dongtam')?/^\/san-pham\/(?!bst-)[^/]+\/?$|^\/san-pham\/[^/]+\/[^/]+\/?$/.test(u.pathname):u.hostname.includes('jotun')?/\/products\/(?:interior|exterior)\/[^/]+\/[^/]+$|\/products-and-services\/products\/[^/]+$/.test(u.pathname):/cua-vach-nhom\/[^/]+$/.test(u.pathname);
   if(valid&&!links.includes(u.href))links.push(u.href);
  }catch{}
 }return links.slice(0,24);
}
export async function discoverOfficialMaterials(category){
 const seeds=catalogSeeds[category]||[];if(!seeds.length)return [];
 const pages=await Promise.all(seeds.map(url=>publicPage(url).catch(()=>null))),urls=[...new Set(pages.flatMap(p=>p?[...(category==='door'?[p.url]:[]),...catalogLinks(p.html,p.url)]:[]))].slice(0,24);
 const result=[];
 // Bound concurrency; avoid sending a burst of requests to manufacturers.
 for(let start=0;start<urls.length;start+=6){result.push(...await Promise.all(urls.slice(start,start+6).map(async url=>{
  try{const p=pages.find(p=>p?.url===url)||await publicPage(url),m=pageMetadata(p.html,p.url),title=m.name.replace(/\s*[|–-]\s*(?:Dongtam Group|Jotun.*|Eurowindow.*)$/i,'').trim();if(!title||!m.imageUrl)return null;
   const sku=m.sku||(/dongtam/.test(url)?title.match(/\b\d{4}[A-Z0-9-]+\b/i)?.[0]||'':'');
   return {id:'source-'+createHash('sha256').update(p.url).digest('hex').slice(0,16),category,brand:/jotun/.test(url)?'Jotun':/eurowindow/.test(url)?'Eurowindow':'Đồng Tâm',sku,name:title,spec:m.description.slice(0,180),productUrl:p.url,imageUrl:m.imageUrl,price:m.price,unit:category==='floor'?'m²':category==='roof'?'viên':category==='door'?'m²':'theo quy cách',phone:'',supplier:/jotun/.test(url)?'Jotun':/eurowindow/.test(url)?'Eurowindow':'Đồng Tâm',address:'',priceDate:'',verifiedAt:new Date().toISOString(),photoEvidence:'source-page',source:p.url,priceStatus:m.price?'public-listed':'request-quote'};
  }catch{return null;}
 })));}return result.filter(Boolean);
}
