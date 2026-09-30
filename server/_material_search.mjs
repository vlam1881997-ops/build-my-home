import {geminiGenerate} from './_gemini.mjs';
import {createHash} from 'node:crypto';
import {publicHttps,publicPage,pageMetadata} from './_public_web.mjs';
const cache=new Map();
const SCHEMA={type:'object',properties:{products:{type:'array',maxItems:12,items:{type:'object',properties:{name:{type:'string'},brand:{type:'string'},sku:{type:'string'},category:{type:'string'},spec:{type:'string'},productUrl:{type:'string'},supplier:{type:'string'},address:{type:'string'},phone:{type:'string'},price:{type:'number'},unit:{type:'string'},priceDate:{type:'string'}},required:['name','brand','sku','category','spec','productUrl','supplier','address','phone','price','unit','priceDate']}},summary:{type:'string'}},required:['products','summary']};
export async function researchMaterials({query='',category='floor',province='',district=''}={}){
  const q=String(query).trim().slice(0,140),cat=String(category).slice(0,30),loc=[district,province].map(x=>String(x||'').slice(0,100)).filter(Boolean).join(', '),key=[q,cat,loc].join('|');
  const saved=cache.get(key);if(saved&&Date.now()-saved.at<6*3600000)return {...saved.data,cached:true};
  const prompt=`Tìm tối đa 10 sản phẩm vật liệu xây dựng thực tế tại Việt Nam cho nhóm ${cat}, yêu cầu: ${q||'đa dạng mức giá và kiểu dáng'}, địa bàn ưu tiên ${loc||'toàn quốc'}. Dùng Google Search. Mỗi sản phẩm phải có mã SKU hoặc model cụ thể, tên, thương hiệu, quy cách, URL trang bán đúng mã hoặc trang chính hãng. Tìm nhà cung cấp, địa chỉ, số điện thoại công khai và giá VND/đơn vị trên CHÍNH trang nguồn nếu có. Ưu tiên nhà sản xuất và đại lý có sản phẩm rõ ràng. Không trả trang danh mục/blog thay cho sản phẩm. Không bịa ảnh, giá, ngày báo giá, số điện thoại. Nếu không có số/giá/ngày ghi rõ thì dùng chuỗi rỗng hoặc giá 0. Giá ngày nào ghi ngày đó; không dùng ngày hôm nay để giả ngày báo giá. category giữ ${cat}. Chỉ trả sản phẩm có bằng chứng web trích dẫn.`;
  const g=await geminiGenerate({parts:[{text:prompt}],schema:SCHEMA,tools:[{type:'google_search'}],timeoutMs:65000,maxOutputTokens:3600});
  const domains=new Set(g.citations.flatMap(x=>{try{return [new URL(x.url).hostname.replace(/^www\./,'')];}catch{return [];}}));
  const candidates=(g.result.products||[]).filter(x=>x.sku&&publicHttps(x.productUrl)).slice(0,10);
  const products=await Promise.all(candidates.map(async x=>{
    try{
      const page=await publicPage(x.productUrl),m=pageMetadata(page.html,page.url,x.sku),plain=m.text.toLowerCase();
      if(!plain.includes(x.sku.toLowerCase()))return null;
      const digits=s=>String(s).replace(/\D/g,''),phone=digits(x.phone),phoneSeen=phone.length>=8&&digits(m.text).includes(phone);
      const price=Math.max(0,Number(x.price)||0),priceSeen=price>0&&[String(price),price.toLocaleString('vi-VN'),price.toLocaleString('en-US')].some(v=>m.text.includes(v));
      const date=/^\d{4}-\d{2}-\d{2}$/.test(x.priceDate)&&m.text.includes(x.priceDate)?x.priceDate:'';
      return {...x,id:'web-'+createHash('sha256').update(page.url).digest('hex').slice(0,20),productUrl:page.url,imageUrl:m.imageUrl,address:x.address&&plain.includes(x.address.toLowerCase())?x.address:'',phone:phoneSeen?x.phone:'',price:priceSeen?price:m.price,priceDate:date,verifiedAt:new Date().toISOString(),photoEvidence:m.imageUrl?'source-page':'missing',source:page.url,priceStatus:priceSeen||m.price?'public-listed':'request-quote'};
    }catch{return null;}
  }));
  const data={products:products.filter(Boolean),citations:[...g.citations,...products.filter(Boolean).map(p=>({url:p.productUrl,title:p.name}))],summary:g.result.summary||'',model:g.model,checkedAt:new Date().toISOString()};
  if(!data.products.length)data.summary='Chưa xác minh được trang sản phẩm khớp mã trong lần tìm này. Thử tên hãng hoặc mã hàng cụ thể hơn.';
  cache.set(key,{at:Date.now(),data});return data;
}
