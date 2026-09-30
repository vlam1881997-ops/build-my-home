import {send,apiError} from './_lib.mjs';
import {officialMaterials} from './_material_catalog.mjs';
export const maxDuration=30;
export default async function handler(req,res){try{if(req.method!=='GET')return send(res,405,{ok:false,error:'Method not allowed'});const url=new URL(req.url||'/', 'https://buildmyhome.local');send(res,200,{ok:true,...await officialMaterials(url.searchParams.get('category')||'floor')});}catch(e){apiError(res,e);}}
