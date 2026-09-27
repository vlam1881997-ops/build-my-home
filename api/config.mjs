import {send,supabaseEnv,payosEnv} from '../server/_lib.mjs';
import {geminiEnv} from '../server/_gemini.mjs';

// Public capability flags only. Never return keys or server environment values.
export default function handler(req,res){
  if(req.method!=='GET')return send(res,405,{ok:false,error:'Method not allowed'});
  const gemini=geminiEnv(),openai=!!String(process.env.OPENAI_API_KEY||'').trim();
  const supabase=supabaseEnv(),payos=payosEnv();
  send(res,200,{
    ok:true,
    aiConfigured:!!gemini.key||openai,
    geminiConfigured:!!gemini.key,
    aiProvider:gemini.key?'Gemini':openai?'OpenAI':'Chưa cấu hình',
    aiModel:gemini.key?gemini.primary:openai?String(process.env.OPENAI_MODEL||'gpt-5.6-terra'):'',
    cloudConfigured:!!(supabase.url&&supabase.publishable&&supabase.secret),
    paymentConfigured:!!(payos.clientId&&payos.apiKey&&payos.checksumKey)
  });
}
