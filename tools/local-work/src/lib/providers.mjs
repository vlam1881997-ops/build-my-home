function needEnv(name){const v=process.env[name];if(!v)throw new Error("Missing environment variable: "+name);return v;}
export async function chat(agent,messages){
 const key=needEnv(agent.apiKeyEnv), model=agent.model; if(!model)throw new Error("Agent "+agent.name+" needs model in config.local.json");
 if(agent.provider==="openai"){
  const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"content-type":"application/json","authorization":"Bearer "+key},body:JSON.stringify({model,messages,temperature:0.2})});
  const j=await r.json(); if(!r.ok)throw new Error(JSON.stringify(j)); return j.choices?.[0]?.message?.content||"";
 }
 if(agent.provider==="anthropic"){
  const system=messages.filter(x=>x.role==="system").map(x=>x.content).join("\n");
  const msgs=messages.filter(x=>x.role!=="system").map(x=>({role:x.role==="assistant"?"assistant":"user",content:x.content}));
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"content-type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01"},body:JSON.stringify({model,max_tokens:7000,system,messages:msgs,temperature:0.2})});
  const j=await r.json(); if(!r.ok)throw new Error(JSON.stringify(j)); return (j.content||[]).map(x=>x.text||"").join("\n");
 }
 if(agent.provider==="google"){
  const contents=messages.filter(x=>x.role!=="system").map(x=>({role:x.role==="assistant"?"model":"user",parts:[{text:x.content}]}));
  const systemInstruction={parts:[{text:messages.filter(x=>x.role==="system").map(x=>x.content).join("\n")}]};
  const url="https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent?key="+encodeURIComponent(key);
  const r=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({contents,systemInstruction,generationConfig:{temperature:0.2}})});
  const j=await r.json(); if(!r.ok)throw new Error(JSON.stringify(j)); return j.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join("\n")||"";
 }
 throw new Error("Unsupported provider: "+agent.provider);
}
