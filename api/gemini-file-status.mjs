import {send,jsonBody,apiError} from '../server/_lib.mjs';
import {geminiFileInfo} from '../server/_gemini.mjs';
export default async function handler(req,res){
  try{
    if(req.method==='OPTIONS')return send(res,200,{ok:true});
    if(req.method!=='POST')return send(res,405,{ok:false,error:'Method not allowed'});
    const body=await jsonBody(req),file=await geminiFileInfo(String(body.name||''));
    return send(res,200,{ok:true,file});
  }catch(err){apiError(res,err);}
}
