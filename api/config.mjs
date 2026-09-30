import {send} from '../server/_lib.mjs';
import {geminiEnv} from '../server/_gemini.mjs';

// Public capability flags only. Never return keys or server environment values.
export default function handler(req,res){
  if(req.method!=='GET')return send(res,405,{ok:false,error:'Method not allowed'});
  const gemini=geminiEnv(),openai=!!String(process.env.OPENAI_API_KEY||'').trim();
  send(res,200,{
    ok:true,
    aiConfigured:!!gemini.key||openai,
    geminiConfigured:!!gemini.key,
    mediaScanConfigured:!!gemini.key,
    imageConfigured:!!gemini.key&&process.env.GEMINI_IMAGE_ENABLED!=='false',
    placesConfigured:!!String(process.env.BMH_GOOGLE_PLACES_API_KEY||'').trim(),
    aiProvider:gemini.key?'Gemini':openai?'OpenAI':'Chưa cấu hình',
    aiAutoModel:gemini.auto,
    aiModel:gemini.key?(gemini.auto?'Flash tự chọn từ Google':gemini.primary):openai?String(process.env.OPENAI_MODEL||'gpt-5.6-terra'):'',
    // Account and payment routes are not deployed in this build. Do not claim
    // those capabilities merely because credentials happen to be configured.
    cloudConfigured:false,
    paymentConfigured:false
  });
}
