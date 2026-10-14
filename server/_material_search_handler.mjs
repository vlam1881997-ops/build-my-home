import {send,jsonBody,apiError} from './_lib.mjs';
import {geminiRateLimit} from './_gemini.mjs';
import {researchMaterials} from './_material_search.mjs';
export const maxDuration=120;
export default async function handler(req,res){try{if(req.method!=='POST')return send(res,405,{ok:false,error:'Method not allowed'});geminiRateLimit(req,{bucket:'material-search',max:8});const data=await researchMaterials(await jsonBody(req));send(res,200,{ok:true,...data});}catch(err){apiError(res,err);}}
