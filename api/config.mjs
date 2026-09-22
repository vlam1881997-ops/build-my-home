import {send} from './_lib.mjs';
import {geminiEnv} from './_gemini.mjs';
export default async function handler(req,res){
  if(req.method==='OPTIONS')return send(res,200,{ok:true});
  if(req.method!=='GET')return send(res,405,{ok:false,error:'Method not allowed'});
  const g=geminiEnv(),openaiKey=String(process.env.OPENAI_API_KEY||'').trim(),openaiModel=String(process.env.OPENAI_MODEL||'gpt-5.6-terra').trim();
  const provider=g.key?'Gemini':openaiKey?'OpenAI':null,model=g.key?g.primary:openaiKey?openaiModel:null;
  send(res,200,{ok:true,version:'5.0.3',aiConfigured:!!(g.key||openaiKey),aiProvider:provider,aiModel:model,geminiConfigured:!!g.key,geminiModel:g.key?g.primary:null,geminiAutoUpgrade:!!(g.key&&g.auto),geminiFallbackModel:g.key?g.fallback:null,geminiApiVersion:g.key?g.apiVersion:null,openaiFallbackConfigured:!!openaiKey,paymentDeferred:true});
}
