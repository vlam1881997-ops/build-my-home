import {send,supabaseEnv,payosEnv,PRODUCT_CODE,PAYMENT_AMOUNT} from './_lib.mjs';
export default async function handler(req,res){
  if(req.method==='OPTIONS')return send(res,200,{ok:true});
  if(req.method!=='GET')return send(res,405,{ok:false,error:'Method not allowed'});
  const s=supabaseEnv(),p=payosEnv(),aiKey=String(process.env.OPENAI_API_KEY||'').trim(),aiModel=String(process.env.OPENAI_MODEL||'gpt-6-astra').trim();
  send(res,200,{ok:true,version:'5.0.1',cloudConfigured:!!(s.url&&s.publishable),paymentConfigured:!!(s.url&&s.publishable&&s.secret&&p.clientId&&p.apiKey&&p.checksumKey),aiConfigured:!!aiKey,aiModel:aiKey?aiModel:null,productCode:PRODUCT_CODE,amount:PAYMENT_AMOUNT,paymentProvider:'payOS'});
}
