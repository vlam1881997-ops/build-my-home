import {send} from '../server/_lib.mjs';
import {geminiEnv} from '../server/_gemini.mjs';
import {guestCheckoutConfig} from '../server/_guest_checkout.mjs';
import {customerConfig} from '../server/_customer_config.mjs';

// Public capability flags only. Never return keys or server environment values.
export default function handler(req,res){
  if(req.method!=='GET')return send(res,405,{ok:false,error:'Method not allowed'});
  const gemini=geminiEnv(),openai=!!String(process.env.OPENAI_API_KEY||'').trim(),service=guestCheckoutConfig(),customer=customerConfig();
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
    // Customer cloud requires the revision-checked schema. Legacy payOS stays
    // disabled; guest MoMo has separate readiness and never locks design steps.
    cloudConfigured:customer.cloud,
    mediaConfigured:customer.cloud&&process.env.BMH_MEDIA_READY==='true',
    aiUsage:{mode:customer.quota?'account':'public',enabled:customer.quota},
    paymentConfigured:false,
    guestService:service.enabled?{enabled:true,title:service.title,amount:service.price,sandbox:service.momo.environment==='sandbox'}:{enabled:false}
  });
}
