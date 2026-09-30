// Discover models using the server key; keys never leave this module.
const catalogs=new Map();
const idOf=m=>String(m.name||'').replace(/^models\//,'');
export function rankGeminiModels(models,{kind='text',configured='',fallback='',auto=true}={}){
 const usable=models.filter(m=>/^gemini-[a-z0-9.-]+$/.test(idOf(m))&&(m.supportedGenerationMethods||[]).some(x=>['generateContent','interactions'].includes(x)));
 const ids=usable.map(idOf).filter(id=>kind==='image'?/image/.test(id):!/image|tts|audio|robotics|embedding|computer-use|deep-research|live|native-audio/.test(id));
 const version=id=>{const m=id.match(/^gemini-(\d+)(?:\.(\d+))?/);return m?Number(m[1])*100+Number(m[2]||0):0;};
 const order=[...ids].sort((a,b)=>{
   const score=id=>(/latest/.test(id)?100000:0)+(!/preview|experimental|exp-/.test(id)?10000:0)+(/flash/.test(id)?1000:0)+version(id)*2-(/lite/.test(id)?1:0);
   return score(b)-score(a)||a.localeCompare(b);
 });
 // Automatic text routing stays on the Flash family to avoid upgrading to
 // a more expensive Pro model without the owner choosing it.
 const automatic=kind==='text'?order.filter(id=>/flash/.test(id)):order;
 const pins=[configured,fallback].filter(x=>ids.includes(x));
 return [...new Set(auto?[...automatic,...pins]:[...pins])].slice(0,4);
}
export async function availableGeminiModels(key,{force=false,timeoutMs=6000}={}){
 const now=Date.now(),old=catalogs.get(key);if(!force&&old&&now-old.at<15*60*1000)return old.models;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
   let models=[],token='';
   for(let page=0;page<4;page++){
     const url=new URL('https://generativelanguage.googleapis.com/v1beta/models');url.searchParams.set('pageSize','1000');if(token)url.searchParams.set('pageToken',token);
     const r=await fetch(url,{signal:controller.signal,headers:{'x-goog-api-key':key}}),data=JSON.parse(await r.text()||'{}');
     if(!r.ok)throw Object.assign(new Error(data.error?.message||'Không đọc được danh sách model Gemini.'),{statusCode:r.status});
     models.push(...(data.models||[]));token=data.nextPageToken||'';if(!token)break;
   }
   if(catalogs.size>8)catalogs.clear();catalogs.set(key,{at:now,models});return models;
 }finally{clearTimeout(timer);}
}
export async function resolveGeminiModels(env,{kind='text',force=false}={}){
 try{
   const models=await availableGeminiModels(env.key,{force});
   const result=rankGeminiModels(models,{kind,configured:kind==='image'?String(process.env.GEMINI_IMAGE_MODEL||''):env.primary,fallback:env.fallback,auto:env.auto});
   if(result.length)return result;
   throw Object.assign(new Error('Tài khoản chưa có model Gemini phù hợp cho '+(kind==='image'?'tạo ảnh':'phân tích')+'.'),{statusCode:503});
 }catch(e){
   if([401,403,503].includes(e.statusCode))throw e;
   // Stable aliases are a network-error fallback, never guessed version IDs.
   if(kind==='image')throw Object.assign(new Error('Chưa đọc được model tạo ảnh từ Google. Thử lại sau.'),{statusCode:503});
   return [env.primary||'gemini-flash-latest',env.fallback||'gemini-flash-lite-latest'];
 }
}
