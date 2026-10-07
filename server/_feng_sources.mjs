import {createHash} from 'node:crypto';
import {geminiEnv,geminiGenerate} from './_gemini.mjs';
import {publicPage,publicHttps,unescapeHtml} from './_public_web.mjs';

const list=v=>Array.isArray(v)?v:[];
const text=(v,max=400)=>typeof v==='string'?v.replace(/[\u0000-\u001f]/g,' ').replace(/https?:\/\/\S+/gi,'[liên kết chưa xác minh]').trim().slice(0,max):'';
const number=(v,max,integer=false)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max&&(!integer||Number.isInteger(v))?v:null;
export const FENG_DIRECTIONS=['Bắc','Đông Bắc','Đông','Đông Nam','Nam','Tây Nam','Tây','Tây Bắc'];
const areas=['house','room','bed','kitchen','altar'];
const schools=['Bát trạch','Hình thế','Huyền không','khác / chưa xác định'];
const direction=v=>FENG_DIRECTIONS.includes(v)?v:null;
const sourceUrl=v=>{const url=publicHttps(v);if(!url)return '';try{return [...new URL(url).searchParams.keys()].some(k=>/token|secret|password|api.?key/i.test(k))?'':url;}catch{return '';}};
const LIMITATIONS=['Thông tin văn hóa tham khảo; không phải kết luận khoa học hay chứng nhận kỹ thuật.','Nguồn được gắn với lời gợi ý; truy xuất web không chứng minh quy tắc hoặc bảo đảm phù hợp.','Chủ nhà tự quyết định phòng thờ, giường và bếp; nghiên cứu không thay đổi mặt bằng.','Không thay yêu cầu an toàn, thông gió, ánh sáng, kết cấu hoặc hồ sơ KTS/KS.'];

// Birth dates, names, addresses, finance, free prompts and uploaded text never cross this boundary.
export function fengResearchContext(input={}){
  const c=input&&typeof input==='object'?input:{},s=c.site||{};
  const out={school:schools.includes(c.school)?c.school:'Bát trạch',site:{frontDirection:direction(s.frontDirection),directionStatus:s.directionStatus==='customer_confirmed'?'customer_confirmed':'unconfirmed',widthM:number(s.widthM,200),depthM:number(s.depthM,500),floors:number(s.floors,20,true),dimensionsStatus:s.dimensionsStatus==='customer_confirmed'?'customer_confirmed':'unconfirmed'},members:list(c.members).slice(0,20).map(m=>({role:['owner','partner','child','relative'].includes(m?.role)?m.role:'relative',kua:[1,2,3,4,6,7,8,9].includes(m?.kua)?m.kua:null,group:['Đông tứ mệnh','Tây tứ mệnh'].includes(m?.group)?m.group:null})),rooms:list(c.rooms).slice(0,80).map((r,i)=>({id:'room-'+i,floor:number(r?.floor,19,true),type:['living','bed','kitchen','bath','worship','stairs','elevator','laundry','office','storage'].includes(r?.type)?r.type:'other',xM:number(r?.xM,500),yM:number(r?.yM,500),widthM:number(r?.widthM,200),depthM:number(r?.depthM,500),direction:direction(r?.direction),directionStatus:r?.directionStatus==='customer_confirmed'?'customer_confirmed':'unconfirmed'})),positions:list(c.positions).slice(0,60).filter(p=>['bed','stove','altar'].includes(p?.type)).map(p=>({type:p.type,floor:number(p?.floor,19,true),roomIndex:number(p?.roomIndex,79,true),xM:number(p?.xM,500),yM:number(p?.yM,500),direction:direction(p?.direction),status:p?.status==='customer_positioned'?'customer_positioned':'proposed'}))};
  if(!out.site.widthM)out.site.widthM=null;if(!out.site.depthM)out.site.depthM=null;if(!out.site.floors)out.site.floors=null;
  out.missing=[];
  if(!out.site.frontDirection||out.site.directionStatus!=='customer_confirmed')out.missing.push('confirmed_house_direction');
  if(!out.site.widthM||!out.site.depthM||out.site.dimensionsStatus!=='customer_confirmed')out.missing.push('measured_dimensions');
  if(!out.rooms.length||out.rooms.some(r=>r.floor===null||r.xM===null||r.yM===null||!r.widthM||!r.depthM))out.missing.push('measured_rooms');
  if(!out.members.length||out.members.some(m=>!m.kua||!m.group))out.missing.push('member_kua');
  for(const kind of ['bed','stove','altar'])if(!out.positions.some(p=>p.type===kind&&p.status==='customer_positioned'&&p.direction))out.missing.push('confirmed_'+kind+'_position');
  return out;
}

// Bibliographic fields come only from retrieved page metadata, never generated book names.
export function fengBibliography(page={}){
  const html=typeof page.html==='string'?page.html:'',meta={};
  for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){const a={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g))a[m[1].toLowerCase()]=unescapeHtml(m[2]);const k=a.name||a.property;if(k&&a.content)(meta[k.toLowerCase()]||=[]).push(a.content);}
  const books=[];const walk=node=>{if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(walk);return;}if(list(Array.isArray(node['@type'])?node['@type']:[node['@type']]).includes('Book'))books.push(node);if(node['@graph'])walk(node['@graph']);};
  for(const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))try{walk(JSON.parse(m[1]));}catch{}
  if(books.length>1)return {title:null,author:null,edition:null,publisher:null,chapter:null,page:null,isbn:null,metadataStatus:'ambiguous'};
  const book=books[0]||{},names=v=>list(Array.isArray(v)?v:[v]).map(x=>text(typeof x==='object'?x?.name:x,160)).filter(Boolean).join(' · ')||null;
  const first=k=>text(meta[k]?.[0],240)||null;
  const title=text(book.name,240)||first('citation_title');
  return {title,author:names(book.author)||names(meta.citation_author),edition:text(book.bookEdition,120)||first('citation_edition'),publisher:names(book.publisher)||first('citation_publisher'),chapter:first('citation_chapter'),page:first('citation_firstpage'),isbn:names(book.isbn),metadataStatus:title?'page_metadata':'not_found'};
}

function providerEvidence(response){
  const raw=response?.raw||{},candidate=raw.candidates?.[0]||{},metadata=candidate.groundingMetadata||raw.grounding_metadata||raw.groundingMetadata||{},output=typeof response?.result==='string'?response.result:'',sources=[],byUrl=new Map(),supports=[];
  const add=(url,title)=>{url=sourceUrl(url);if(!url)return null;if(byUrl.has(url))return byUrl.get(url);if(sources.length>=8)return null;const row={id:'feng-source-'+(sources.length+1),url,title:text(title,180)||'Nguồn web'};sources.push(row);byUrl.set(url,row.id);return row.id;};
  const ids=list(metadata.groundingChunks||metadata.grounding_chunks).map(c=>add(c?.web?.uri,c?.web?.title));
  const segment=(s,t=output)=>typeof s?.text==='string'?s.text:Number.isInteger(s?.startIndex??s?.start_index)&&Number.isInteger(s?.endIndex??s?.end_index)?t.slice(s.startIndex??s.start_index,s.endIndex??s.end_index):'';
  for(const s of list(metadata.groundingSupports||metadata.grounding_supports)){const sourceIds=list(s.groundingChunkIndices||s.grounding_chunk_indices).filter(Number.isInteger).map(i=>ids[i]).filter(Boolean),v=segment(s.segment);if(v&&sourceIds.length)supports.push({text:v,sourceIds});}
  for(const out of [...list(raw.outputs),...list(raw.steps).filter(s=>s?.type==='model_output').flatMap(s=>list(s.content))])if(out?.type==='text')for(const annotation of list(out.annotations||out.citations))if(['url_citation','urlCitation'].includes(annotation?.type)){const id=add(annotation.url,annotation.title),v=segment(annotation,out.text||output);if(id&&v)supports.push({text:v,sourceIds:[id]});}
  return {sources,supports,output};
}

export async function normalizeFengResearch(response,context,retrievedAt,{readPage=publicPage}={}){
  const {sources,supports,output}=providerEvidence(response);
  await Promise.all(sources.map(async s=>{try{const page=await readPage(s.url,{timeoutMs:4500});s.retrievedAt=retrievedAt;s.pageStatus='retrieved';s.bibliography=fengBibliography(page);}catch{s.retrievedAt=null;s.pageStatus='unavailable';s.bibliography=fengBibliography();}}));
  let parsed={};try{parsed=JSON.parse(output.replace(/^\s*```(?:json)?\s*/i,'').replace(/\s*```\s*$/,''));}catch{}
  const claims=list(parsed.claims).slice(0,12).filter(c=>c&&typeof c==='object').map((c,i)=>{
    const recommendation=text(c.recommendation,600),encoded=JSON.stringify(recommendation).slice(1,-1),linked=[...new Set(supports.filter(s=>recommendation&&(s.text.includes(recommendation)||s.text.includes(encoded))).flatMap(s=>s.sourceIds))],usable=linked.filter(id=>sources.some(s=>s.id===id&&s.pageStatus==='retrieved'));
    const area=areas.includes(c.area)?c.area:'house',positionCriterion={bed:'confirmed_bed_position',kitchen:'confirmed_stove_position',altar:'confirmed_altar_position'}[area],missing=context.missing.filter(k=>!/^confirmed_(bed|stove|altar)_position$/.test(k)||k===positionCriterion);
    return {id:'feng-claim-'+i,area,school:schools.includes(c.school)?c.school:'khác / chưa xác định',recommendation,rationale:text(c.rationale,500),sourceIds:usable,coverage:usable.length?'source-linked':'unverified',missingCriteria:missing,decision:'customer',chapter:null,page:null};
  }).filter(c=>c.recommendation);
  const linked=claims.filter(c=>c.sourceIds.length).length;
  return {status:linked?'ready':'unverified',headline:text(parsed.headline,160)||'Tham khảo phong thủy theo hồ sơ',summary:text(parsed.summary,800),retrievedAt,model:text(response?.model,120),sources,claims,coverage:{linkedClaims:linked,totalClaims:claims.length,enteredCriteria:7-context.missing.length,totalCriteria:7,basis:'cultural-reference'},missingCriteria:context.missing,limitations:LIMITATIONS,allowLocal:true};
}

export function fengResearchPolicy(env=geminiEnv(),settings=process.env){
  if(!env.key)return 'missing_configuration';
  if(settings.GEMINI_FENG_RESEARCH_ENABLED!=='true'||settings.GEMINI_SEARCH_ENABLED!=='true')return 'search_not_allowed';
  if(settings.GEMINI_FENG_RESEARCH_QUOTA!=='free-verified')return 'quota_not_allowed';
  if(!/^gemini-[a-z0-9.-]+$/.test(env.primary)||/image|audio|tts|embedding|live|deep-research/.test(env.primary))return 'model_not_allowed';
  return '';
}
export function createFengResearchRunner({generate=geminiGenerate,getEnv=geminiEnv,getSettings=()=>process.env,readPage=publicPage,now=Date.now,timeoutMs=25000}={}){
  const cache=new Map(),buckets=new Map(),blocked=new Map(),windowMs=600000,ttl=900000;
  const fallback=(status,context)=>({status,headline:'Tham khảo cục bộ vẫn sử dụng được',notice:status==='quota'||status==='quota_not_allowed'||status==='quota_or_permission_blocked'?'Nghiên cứu web chưa có hạn mức miễn phí được xác nhận hoặc đã chạm quota.':status==='call_limit'?'Đã đủ lượt nghiên cứu trong khoảng thời gian này.':'Nghiên cứu web chưa sẵn sàng; tiếp tục xem phương pháp cục bộ.',summary:'Không có nguồn mới được xác minh; nghiên cứu không thay đổi bố trí.',retrievedAt:null,sources:[],claims:[],coverage:{linkedClaims:0,totalClaims:0,enteredCriteria:7-context.missing.length,totalCriteria:7,basis:'cultural-reference'},missingCriteria:context.missing,limitations:LIMITATIONS,allowLocal:true});
  return async(input,{scope='public'}={})=>{
    const context=fengResearchContext(input),env=getEnv(),policy=fengResearchPolicy(env,getSettings()),at=now();if(policy)return fallback(policy,context);
    const account=createHash('sha256').update(env.key+'|'+env.primary).digest('hex'),caller=account+'|'+String(scope).slice(0,160),key=createHash('sha256').update(caller+'|'+JSON.stringify(context)).digest('hex');
    for(const [k,row] of cache)if(!row.pending&&row.until<=at)cache.delete(k);for(const [k,row] of buckets)if(at-row.start>=windowMs)buckets.delete(k);for(const [k,until] of blocked)if(until<=at)blocked.delete(k);
    if(blocked.get(account)>at||blocked.get(caller)>at)return fallback('quota_or_permission_blocked',context);
    const prior=cache.get(key);if(prior)return prior.promise;
    for(const [id,max] of [[account,6],[caller,3]])if((buckets.get(id)?.count||0)>=max)return fallback('call_limit',context);
    if(cache.size>=80||buckets.size>=160)return fallback('call_limit',context);
    for(const id of [account,caller]){const row=buckets.get(id)||{start:at,count:0};row.count++;buckets.set(id,row);}
    const row={pending:true,until:at+ttl,promise:null};row.promise=(async()=>{try{
      const response=await generate({parts:[{text:'Nghiên cứu nguồn công khai về phong thủy truyền thống. Trả JSON {"headline":"","summary":"","claims":[{"area":"house|room|bed|kitchen|altar","school":"Bát trạch|Hình thế|Huyền không|khác / chưa xác định","recommendation":"Một câu đầy đủ để Search gắn nguồn","rationale":"Lý do và dữ liệu còn thiếu"}]}. Không viết URL, số nguồn, tên sách, tác giả, chương hoặc trang nếu không có nguồn thực. Không suy hướng chính xác từ hướng chưa xác nhận hoặc vị trí mới đề xuất. Không xác nhận sự đúng đắn khoa học. Không thay đổi vị trí phòng thờ hoặc mặt bằng. Hồ sơ được phép: '+JSON.stringify(context)}],systemInstruction:'BMH nghiên cứu văn hóa có nguồn. Tách các trường phái và giới hạn. Gia chủ tự lựa chọn; an toàn, công năng, pháp lý và kỹ thuật đứng trước gợi ý. Không bổ sung dữ liệu cá nhân.',tools:[{type:'google_search'}],configuredOnly:true,timeoutMs:Math.min(25000,Math.max(1500,timeoutMs)),maxOutputTokens:3000,thinkingLevel:'low'});
      return await normalizeFengResearch(response,context,new Date(now()).toISOString(),{readPage});
    }catch(err){const code=Number(err?.statusCode),status=code===429?'quota':[401,403].includes(code)?'denied':code===504?'timeout':'unavailable';if(status==='quota'||status==='denied')blocked.set(String(err?.code||'').startsWith('AI_')?caller:account,now()+ttl);row.until=now()+60000;return fallback(status,context);}finally{row.pending=false;}})();cache.set(key,row);return row.promise;
  };
}
export const runFengResearch=createFengResearchRunner();
