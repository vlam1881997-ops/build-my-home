import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
const blocked=ip=>ip==='::1'||/^::ffff:/i.test(ip)||/^f[cd]|^fe[89ab]/i.test(ip)||/^(0|10|127|169\.254|192\.168|172\.(1[6-9]|2\d|3[01])|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7]))\./.test(ip);
export function publicHttps(value){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443'||isIP(u.hostname)||!u.hostname.includes('.')||/localhost|\.local$|\.internal$/i.test(u.hostname))return '';return u.href;}catch{return '';}}
export async function publicPage(url,{timeoutMs=6500}={}){
  let current=publicHttps(url);if(!current)throw new Error('Trang nguồn cần HTTPS công khai.');
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeoutMs);
  try{
    for(let hop=0;hop<4;hop++){
      const ips=await lookup(new URL(current).hostname,{all:true});if(!ips.length||ips.some(x=>blocked(x.address)))throw new Error('Nguồn không phải website công khai.');
      const res=await fetch(current,{signal:ctl.signal,redirect:'manual',headers:{'User-Agent':'BuildMyHome/6.3 (public product metadata; contact via project site)','Accept':'text/html'}});
      if([301,302,303,307,308].includes(res.status)){current=publicHttps(new URL(res.headers.get('location')||'',current).href);if(!current)throw new Error('Chuyển hướng nguồn không hợp lệ.');continue;}
      if(!res.ok)throw new Error('Trang nguồn HTTP '+res.status);
      if(!/text\/html|application\/xhtml/i.test(res.headers.get('content-type')||''))throw new Error('Nguồn không phải trang sản phẩm HTML.');
      let html='',size=0;for await(const chunk of res.body){size+=chunk.length;if(size>2_000_000)break;html+=Buffer.from(chunk).toString('utf8');}
      return {url:current,html};
    }
    throw new Error('Trang nguồn chuyển hướng quá nhiều lần.');
  }finally{clearTimeout(timer);}
}
export const unescapeHtml=s=>String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));
export const visibleText=html=>unescapeHtml(String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' '));
export function pageMetadata(html,url,sku=''){
  const meta={};for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){const a={};for(const match of tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g))a[match[1].toLowerCase()]=unescapeHtml(match[2]);const name=a.property||a.name;if(name&&a.content)meta[name]=a.content;}
  const products=[];const walk=x=>{if(!x||typeof x!=='object')return;if(Array.isArray(x)){x.forEach(walk);return;}if(String(x['@type']).includes('Product'))products.push(x);if(x['@graph'])walk(x['@graph']);};
  for(const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))try{walk(JSON.parse(match[1]));}catch{}
  const p=products.find(x=>String(x.sku||x.name||'').toLowerCase().includes(sku.toLowerCase()))||products[0]||{},image=Array.isArray(p.image)?p.image[0]:typeof p.image==='object'?p.image?.url:p.image;
  let img=image||meta['og:image']||'';
  // A product-specific inline image is preferred over generic site branding.
  if(sku||!img||/logo|productholder|default|favicon/i.test(img)){
    const matching=(html.match(/<img\b[^>]*>/gi)||[]).find(tag=>sku&&tag.toLowerCase().includes(sku.toLowerCase())&&!/logo|drawing|ban-ve|bản vẽ/i.test(tag));
    const m=matching?.match(/(?:data-src|src)=["']([^"']+)["']/i);if(m)img=unescapeHtml(m[1]);
  }
  try{img=img?publicHttps(new URL(img,url).href):'';}catch{img='';}
  if(/logo|productholder|default|favicon/i.test(img))img='';
  const offer=Array.isArray(p.offers)?p.offers[0]:p.offers||{},price=offer.priceCurrency==='VND'?Number(offer.price):0;
  return {name:unescapeHtml(p.name||meta['og:title']||''),description:unescapeHtml(p.description||meta.description||''),imageUrl:img,sku:String(p.sku||sku),price:Number.isFinite(price)&&price>0?price:0,priceValidUntil:String(offer.priceValidUntil||''),text:visibleText(html)};
}
