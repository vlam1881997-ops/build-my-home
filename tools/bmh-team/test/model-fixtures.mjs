import {normalizeModelOptions} from '../models.mjs';
// Account/client models are fixtures, never a claim about real availability.
export const fixtureRows=()=>['gpt-6.1-sol','gpt-6-astra','gpt-6-sol'].map((model,index)=>({
  id:model,model,displayName:model,hidden:false,isDefault:index===0,
  defaultReasoningEffort:'medium',supportedReasoningEfforts:['medium','high','xhigh'].map(reasoningEffort=>({reasoningEffort,description:'Fixture effort'}))
}));
export const fixtureCatalog=()=>({status:'ready',options:normalizeModelOptions(fixtureRows()),updatedAt:new Date().toISOString(),error:null});
export const fixtureSettings=()=>({one:{model:'gpt-6.1-sol',reasoningEffort:'high'},two:{model:'gpt-6.1-sol',reasoningEffort:'high'}});
