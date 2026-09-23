import {send,supabaseEnv,payosEnv,PRODUCT_CODE,PAYMENT_AMOUNT} from '../server/_lib.mjs';
import {geminiEnv} from '../server/_gemini.mjs';
export default async function handler(req,res){
  if(req.method==='OPTIONS')return send(res,200,{ok:true});
  if(req.method!=='GET')return send(res,405,{ok:false,error:'Method not allowed'});
  const s=supabaseEnv(),p=payosEnv(),g=geminiEnv(),openaiKey=String(process.env.OPENAI_API_KEY||'').trim(),openaiModel=String(process.env.OPENAI_MODEL||'gpt-5.6-terra').trim();
  const aiConfigured=!!(g.key||openaiKey),provider=g.key?'Gemini':openaiKey?'OpenAI':null,model=g.key?g.primary:openaiKey?openaiModel:null;
  send(res,200,{ok:true,version:'6.1.7',cloudConfigured:!!(s.url&&s.publishable),paymentConfigured:!!(s.url&&s.publishable&&s.secret&&p.clientId&&p.apiKey&&p.checksumKey),aiConfigured,aiProvider:provider,aiModel:model,geminiConfigured:!!g.key,geminiModel:g.key?g.primary:null,geminiAutoUpgrade:!!(g.key&&g.auto),geminiFallbackModel:g.key?g.fallback:null,geminiApiVersion:g.key?g.apiVersion:null,openaiFallbackConfigured:!!openaiKey,productCode:PRODUCT_CODE,amount:PAYMENT_AMOUNT,paymentProvider:'payOS'});
}
