import {send,apiError} from '../server/_lib.mjs';

const TTL=24*60*60*1000;
const cache=globalThis.__BMH_VIETQR_BANKS__||(globalThis.__BMH_VIETQR_BANKS__={at:0,data:[]});

export default async function handler(req,res){
  try{
    if(req.method==='OPTIONS')return send(res,200,{ok:true});
    if(req.method!=='GET')return send(res,405,{ok:false,error:'Method not allowed'});
    const now=Date.now();
    if(cache.data.length&&now-cache.at<TTL)return send(res,200,{ok:true,cached:true,updatedAt:new Date(cache.at).toISOString(),data:cache.data});
    const r=await fetch('https://api.vietqr.io/v2/banks',{headers:{'Accept':'application/json','User-Agent':'BuildMyHome/1.0'}});
    let body={};try{body=await r.json();}catch{}
    if(!r.ok||!Array.isArray(body?.data))throw Object.assign(new Error('Không tải được danh mục logo ngân hàng.'),{statusCode:502});
    const data=body.data.slice(0,120).map(x=>({
      id:Number(x.id)||0,name:String(x.name||'').slice(0,180),code:String(x.code||'').slice(0,32),
      shortName:String(x.shortName||x.short_name||'').slice(0,80),bin:String(x.bin||'').slice(0,16),
      logo:/^https:\/\//i.test(String(x.logo||''))?String(x.logo).slice(0,500):''
    })).filter(x=>x.logo);
    cache.at=now;cache.data=data;
    return send(res,200,{ok:true,cached:false,updatedAt:new Date(now).toISOString(),data});
  }catch(err){apiError(res,err);}
}
