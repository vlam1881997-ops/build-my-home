import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import {publicHttps} from './_public_web.mjs';
import {apiError} from './_lib.mjs';
import catalog from '../assets/materials/official-catalog.json' with {type:'json'};
const allowed=['dongtam.com.vn','jotun.com','eurowindow.biz','inax.com.vn','rangdong.com.vn','ancuong.com','vinhtuong.com','cadivi.vn','binhminhplastic.com.vn','ximanghatienkiengiang.vn','hoaphat.com.vn','hoasengroup.vn','sika.com','sika.scene7.com','storage.sudospaces.com'];
const cache=new Map();
export function officialImageUrl(value){const url=publicHttps(value);if(!url)return '';const u=new URL(url);return allowed.some(d=>u.hostname===d||u.hostname.endsWith('.'+d))&&!/\.svg(?:$|\?)/i.test(u.pathname)?url:'';}
const privateIP=ip=>isIP(ip)===6?/^::1$|^::ffff:|^f[cd]|^fe[89ab]/i.test(ip):/^(0|10|127|169\.254|192\.168|172\.(1[6-9]|2\d|3[01])|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7]))\./.test(ip);
export default async function materialImageHandler(req,res){
 try{
  if(req.method!=='GET')throw Object.assign(new Error('Method not allowed'),{statusCode:405});
  const url=officialImageUrl(req.query?.url||new URL(req.url,'https://buildmyhome.local').searchParams.get('url'));if(!url)throw Object.assign(new Error('Ảnh cần thuộc nguồn chính hãng được hỗ trợ.'),{statusCode:400});
  const licensed=catalog.products.some(p=>p.imageUrl===url&&p.photoLicense?.verified===true&&p.photoLicense?.commercialUse===true&&publicHttps(p.photoLicense?.sourceUrl));
  if(!licensed)throw Object.assign(new Error('Chưa xác minh quyền sử dụng thương mại của ảnh hãng. Mở trang sản phẩm để xem ảnh tại nguồn.'),{statusCode:403});
  let row=cache.get(url);
  if(!row||Date.now()-row.at>3600000){
   const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8000);try{
    let current=url;
    for(let hop=0;hop<4;hop++){
     const ips=await lookup(new URL(current).hostname,{all:true});if(!ips.length||ips.some(x=>privateIP(x.address)))throw Error('Địa chỉ nguồn không công khai.');
     const r=await fetch(current,{signal:ctl.signal,redirect:'manual',headers:{Accept:'image/jpeg,image/png,image/webp'}});
     if([301,302,303,307,308].includes(r.status)){current=officialImageUrl(new URL(r.headers.get('location')||'',current).href);if(!current)throw Error('Nguồn ảnh chuyển hướng không hợp lệ.');continue;}
     const type=(r.headers.get('content-type')||'').split(';')[0];if(!r.ok||!['image/jpeg','image/png','image/webp'].includes(type))throw Error('Nguồn chưa trả ảnh sản phẩm hợp lệ.');
     let size=0,chunks=[];for await(const chunk of r.body){size+=chunk.length;if(size>1500000)throw Error('Ảnh nguồn quá lớn.');chunks.push(Buffer.from(chunk));}
     const bytes=Buffer.concat(chunks);if(bytes.length<20)throw Error('Ảnh nguồn rỗng.');row={bytes,type,at:Date.now()};if(cache.size>=100)cache.delete(cache.keys().next().value);cache.set(url,row);break;
    }
   }finally{clearTimeout(timer);}
  }
  if(!row)throw Error('Không tải được ảnh nguồn.');res.status(200);res.setHeader('Content-Type',row.type);res.setHeader('Cache-Control','public, max-age=3600, s-maxage=3600');res.setHeader('X-Content-Type-Options','nosniff');res.end(row.bytes);
 }catch(err){apiError(res,Object.assign(err,{statusCode:err.statusCode||502}));}
}
