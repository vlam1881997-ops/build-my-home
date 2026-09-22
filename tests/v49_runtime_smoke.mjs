import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {TextEncoder,TextDecoder} from 'node:util';

const code=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const store=new Map();
const app={innerHTML:''};
const classList={add(){},remove(){},contains(){return false;}};
const document={
  title:'',documentElement:{dataset:{},classList},
  getElementById(id){return id==='app'?app:id==='toast'?{textContent:'',classList}:null;},
  querySelector(sel){if(sel==='#app')return app;return null;},
  querySelectorAll(){return [];},
  addEventListener(){},
  createElement(tag){return {tagName:tag.toUpperCase(),style:{},dataset:{},classList,setAttribute(){},appendChild(){},click(){},remove(){}};},
  head:{appendChild(){}},body:{appendChild(){}},
};
const location={hostname:'example.com',search:'?step=8',pathname:'/',protocol:'https:',href:'https://example.com/?step=8',assign(){}};
const history={replaceState(){}};
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const navigator={clipboard:{writeText:async()=>{}},serviceWorker:{getRegistrations:async()=>[]},geolocation:{getCurrentPosition(){}}};
const context={console,document,location,history,localStorage,navigator,Intl,Date,Math,Map,Set,Promise,JSON,Object,Array,String,Number,Boolean,RegExp,Error,TypeError,TextEncoder,TextDecoder,Blob,URL,URLSearchParams,structuredClone,crypto:globalThis.crypto||await import('node:crypto').then(m=>m.webcrypto),setTimeout,clearTimeout,setInterval,clearInterval,fetch:async()=>({ok:false,status:404,json:async()=>({})}),confirm:()=>true,requestAnimationFrame:fn=>fn(),scrollTo(){},innerWidth:1440,addEventListener(){},removeEventListener(){}};
context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(code,context,{filename:'dist/app.js'});
await new Promise(r=>setTimeout(r,0));
const BMH=context.BuildMyHome;
assert.ok(BMH,'BuildMyHome global missing');
assert.equal(BMH.VERSION,'4.9.0');
BMH.navigateTo(8);
assert.match(app.innerHTML,/99\.000đ/);
assert.match(app.innerHTML,/Đăng nhập để thanh toán/);
assert.equal(BMH.isUnlocked(),false);
BMH.state.access={paid:true,source:'dev-local',paidAt:new Date().toISOString(),verifiedAt:new Date().toISOString(),orderCode:null};
assert.equal(BMH.isUnlocked(),false,'Production must reject local/dev unlock');
BMH.state.access={paid:true,source:'server-verified',paidAt:new Date().toISOString(),verifiedAt:new Date().toISOString(),orderCode:123};
assert.equal(BMH.isUnlocked(),true,'Server entitlement must unlock');
BMH.state.ui.step=9;BMH.render();assert.match(app.innerHTML,/Giám sát thi công/);
BMH.openCloud();assert.match(app.innerHTML,/BUILD MY HOME V4\.9/);assert.match(app.innerHTML,/Tạo tài khoản/);
console.log('V4.9 browser-runtime smoke (VM): PASS');
