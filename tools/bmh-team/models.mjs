import {readFile,writeFile,rename,rm,mkdir} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import path from 'node:path';

// A catalog belongs to one signed-in Codex account and client. Documentation
// model names are not proof that this account can run that model.
export const DEFAULT_MODEL_SETTINGS=Object.freeze({model:null,reasoningEffort:null});
export const emptyModelCatalog=()=>({status:'idle',options:[],updatedAt:null,error:null});
const safeModel=/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,95}$/;
const safeEffort=/^[a-z][a-z0-9_]{0,31}$/;
const effortNames={none:'None',minimal:'Minimal',low:'Low',medium:'Medium',high:'High',xhigh:'Extra High',max:'Max',ultra:'Ultra'};

export function validateModelSettings(value,{allowUnselected=false}={}) {
  if(!value || typeof value!=='object' || Array.isArray(value))throw Error('Chọn model và mức suy luận hợp lệ.');
  if(allowUnselected && value.model===null && value.reasoningEffort===null)return {...DEFAULT_MODEL_SETTINGS};
  if(typeof value.model!=='string' || !safeModel.test(value.model))throw Error('Model không hợp lệ. Chọn từ danh sách Codex của thẻ này.');
  if(typeof value.reasoningEffort!=='string' || !safeEffort.test(value.reasoningEffort))throw Error('Mức suy luận không hợp lệ.');
  return {model:value.model,reasoningEffort:value.reasoningEffort};
}

export function normalizeModelOptions(data) {
  if(!Array.isArray(data) || data.length>200)throw Error('Danh sách model Codex không hợp lệ.');
  const result=[];const seen=new Set();
  for(const entry of data) {
    if(entry?.hidden===true)continue;
    const id=entry?.model ?? entry?.id;
    if(typeof id!=='string' || !safeModel.test(id) || seen.has(id))throw Error('Codex trả model không hợp lệ hoặc trùng lặp.');
    if(!Array.isArray(entry.supportedReasoningEfforts) || entry.supportedReasoningEfforts.length>16)throw Error('Codex chưa trả mức suy luận của model.');
    const efforts=[];const effortIds=new Set();
    for(const option of entry.supportedReasoningEfforts) {
      const effort=option?.reasoningEffort;
      if(typeof effort!=='string' || !safeEffort.test(effort) || effortIds.has(effort))throw Error('Codex trả mức suy luận không hợp lệ.');
      effortIds.add(effort);efforts.push({id:effort,label:effortNames[effort] || effort});
    }
    if(!efforts.length || !effortIds.has(entry.defaultReasoningEffort))throw Error('Codex chưa trả lựa chọn suy luận mặc định hợp lệ.');
    const label=typeof entry.displayName==='string'?entry.displayName.replace(/[\u0000-\u001f\u007f]/g,'').slice(0,150):id;
    seen.add(id);result.push({id,label:label || id,efforts,defaultReasoningEffort:entry.defaultReasoningEffort,isDefault:entry.isDefault===true});
  }
  if(!result.length)throw Error('Codex chưa trả model có thể chọn cho tài khoản này.');
  return result;
}

export function validateCatalogSettings(value,catalog) {
  const selected=validateModelSettings(value);
  if(catalog?.status!=='ready')throw Error(catalog?.error || 'Chưa lấy được danh sách model Codex. Bấm Làm mới model trên thẻ tài khoản.');
  const model=catalog.options?.find(option=>option.id===selected.model);
  if(!model)throw Error(`Model đã lưu (${selected.model}) không có trong danh sách Codex của tài khoản này. Chọn lại model trên đúng thẻ.`);
  if(!model.efforts.some(option=>option.id===selected.reasoningEffort))throw Error(`Model ${selected.model} không hỗ trợ mức suy luận ${selected.reasoningEffort} trong danh sách Codex. Chọn lại mức suy luận.`);
  return selected;
}
export function modelSettingsWarning(value,catalog) {
  if(!value?.model || !value?.reasoningEffort)return 'Chọn model và mức suy luận từ danh sách Codex trên thẻ này trước khi giao việc.';
  try {validateCatalogSettings(value,catalog);return null;}catch(error){return error.message;}
}
export const defaultTeamSettings=()=>Object.fromEntries(['one','two'].map(id=>[id,{...DEFAULT_MODEL_SETTINGS}]));

export async function loadModelSettings(stateRoot) {
  try {
    const text=await readFile(path.join(stateRoot,'model-settings.json'),'utf8');
    if(text.length>4096)throw Error('Settings file is too large.');
    const data=JSON.parse(text);
    if(data.version!==1)throw Error('Unsupported settings version.');
    return {settings:Object.fromEntries(['one','two'].map(id=>[id,validateModelSettings(data.workers?.[id],{allowUnselected:true})])),warning:null};
  } catch(error) {
    if(error.code==='ENOENT')return {settings:defaultTeamSettings(),warning:null};
    // Preserve stored choices; compatibility is checked against a freshly read
    // account catalog before work starts, never replaced automatically.
    return {settings:defaultTeamSettings(),warning:'Không đọc được cấu hình model đã lưu. Chọn lại model trên hai thẻ trước khi giao việc.'};
  }
}

export async function saveModelSettings(stateRoot,settings) {
  const workers=Object.fromEntries(['one','two'].map(id=>[id,validateModelSettings(settings[id],{allowUnselected:true})]));
  await mkdir(stateRoot,{recursive:true,mode:0o700});
  const target=path.join(stateRoot,'model-settings.json');
  const temporary=target+'.'+randomBytes(8).toString('hex')+'.tmp';
  try {
    await writeFile(temporary,JSON.stringify({version:1,workers},null,2)+'\n',{mode:0o600,flag:'wx'});
    await rename(temporary,target);
  } finally {await rm(temporary,{force:true}).catch(()=>{});}
}
