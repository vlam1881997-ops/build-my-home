import {readFile,writeFile,rename,rm,mkdir} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import path from 'node:path';

// Curated choices, not a claim that every signed-in account can access them.
// A denied model fails the job; it is never replaced with a cheaper model.
export const MODEL_OPTIONS=Object.freeze([
  Object.freeze({id:'gpt-6.1-sol',label:'GPT-6.1 Sol · Khuyên dùng'}),
  Object.freeze({id:'gpt-6-astra',label:'GPT-6 Astra · Mạnh nhất'}),
  Object.freeze({id:'gpt-6-sol',label:'GPT-6 Sol'})
]);
export const REASONING_OPTIONS=Object.freeze([
  Object.freeze({id:'high',label:'High · Kỹ'}),
  Object.freeze({id:'xhigh',label:'Extra High · Kỹ hơn'}),
  Object.freeze({id:'medium',label:'Medium · Nhanh hơn'})
]);
export const DEFAULT_MODEL_SETTINGS=Object.freeze({model:'gpt-6.1-sol',reasoningEffort:'high'});

export function validateModelSettings(value) {
  if(!value || typeof value!=='object' || Array.isArray(value))throw Error('Chọn model và mức suy luận hợp lệ.');
  if(!MODEL_OPTIONS.some(option=>option.id===value.model))throw Error('Model không nằm trong danh sách BMH Team.');
  if(!REASONING_OPTIONS.some(option=>option.id===value.reasoningEffort))throw Error('Mức suy luận không hợp lệ.');
  return {model:value.model,reasoningEffort:value.reasoningEffort};
}
export const defaultTeamSettings=()=>Object.fromEntries(['one','two'].map(id=>[id,{...DEFAULT_MODEL_SETTINGS}]));

export async function loadModelSettings(stateRoot) {
  try {
    const text=await readFile(path.join(stateRoot,'model-settings.json'),'utf8');
    if(text.length>4096)throw Error('Settings file is too large.');
    const data=JSON.parse(text);
    if(data.version!==1)throw Error('Unsupported settings version.');
    return {settings:Object.fromEntries(['one','two'].map(id=>[id,validateModelSettings(data.workers?.[id])])),warning:null};
  } catch(error) {
    if(error.code==='ENOENT')return {settings:defaultTeamSettings(),warning:null};
    // Preserve the broken file and block starting a job until the user saves
    // a visible choice. Never silently substitute a model for saved settings.
    return {settings:defaultTeamSettings(),warning:'Không đọc được cấu hình model đã lưu. Chọn lại model trên hai thẻ trước khi giao việc.'};
  }
}

export async function saveModelSettings(stateRoot,settings) {
  const workers=Object.fromEntries(['one','two'].map(id=>[id,validateModelSettings(settings[id])]));
  await mkdir(stateRoot,{recursive:true,mode:0o700});
  const target=path.join(stateRoot,'model-settings.json');
  const temporary=target+'.'+randomBytes(8).toString('hex')+'.tmp';
  try {
    await writeFile(temporary,JSON.stringify({version:1,workers},null,2)+'\n',{mode:0o600,flag:'wx'});
    await rename(temporary,target);
  } finally {await rm(temporary,{force:true}).catch(()=>{});}
}
