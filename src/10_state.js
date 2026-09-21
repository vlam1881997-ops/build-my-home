BMH.defaultState = () => ({
  version: BMH.VERSION,
  ui: {step:1, sidebarCollapsed:false, designTab:'planner', materialCategory:'floor', planner:{floor:0,selected:'r1',snap:.2,zoom:1,mode:'technical',showFurniture:true,showDimensions:true,showFeng:true}, sceneMode:'reference', sceneTheme:'day', sceneFocus:'all'},
  access: {paid:false, source:'none', paidAt:null},
  project: {
    name:'Nhà của mình', source:'suggest', style:'Hiện đại',
    site:{country:'Việt Nam',province:'Bình Dương',district:'Thủ Dầu Một',address:'',lat:11.160,lng:106.650,width:5,depth:20,floors:2,road:4,soil:'Đất thịt đồng bằng'},
    finance:{cash:800000000,income:25000000,living:8000000,reserve:100000000,existingDebt:0,loan:500000000,years:15,bank:'VCB',introRate:6.9,postRate:10.9,promoMonths:12},
    household:{ownerBirth:1988,ownerGender:'Nam',partnerEnabled:true,partnerBirth:1990,partnerGender:'Nữ',children:[{id:'c1',name:'Con 1',birth:2012,room:'Riêng'}],relatives:[{id:'p1',name:'Ba',birth:1962,mobility:'Hạn chế nhẹ'},{id:'p2',name:'Mẹ',birth:1964,mobility:'Bình thường'}]},
    plan:{rooms:[
      {id:'r1',floor:0,name:'Phòng khách',type:'living',x:0,y:0,w:5,h:4},
      {id:'r2',floor:0,name:'Bếp + ăn',type:'kitchen',x:0,y:4,w:5,h:4},
      {id:'r3',floor:0,name:'Phòng ông bà',type:'bed',x:0,y:8,w:3.2,h:4},
      {id:'r4',floor:0,name:'WC',type:'bath',x:3.2,y:8,w:1.8,h:2},
      {id:'r5',floor:0,name:'Cầu thang',type:'stairs',x:3.2,y:10,w:1.8,h:4},
      {id:'r6',floor:1,name:'Phòng ngủ chính',type:'bed',x:0,y:0,w:5,h:4},
      {id:'r7',floor:1,name:'Phòng con',type:'bed',x:0,y:4,w:3.2,h:4},
      {id:'r8',floor:1,name:'WC tầng 2',type:'bath',x:3.2,y:4,w:1.8,h:2},
      {id:'r9',floor:1,name:'Cầu thang',type:'stairs',x:3.2,y:10,w:1.8,h:4}
    ], openings:[
      {id:'o1',floor:0,roomId:'r1',kind:'door',side:'south',offset:.5,width:.9},
      {id:'o2',floor:0,roomId:'r1',kind:'window',side:'east',offset:.35,width:1.6},
      {id:'o3',floor:0,roomId:'r3',kind:'door',side:'east',offset:.25,width:.8},
      {id:'o4',floor:1,roomId:'r6',kind:'window',side:'east',offset:.4,width:1.6}
    ]},
    materials:{tier:'standard',choices:{floor:'viglacera',paint:'dulux',door:'xingfa'},lastDelta:0},
    wearYear:0,
    checklist:{pipe114:false,acWire:false,pressure:false,internet:false,elcb:false}
  },
  meta:{savedAt:null}
});

BMH.mergeState = (base, incoming) => {
  if(!incoming || typeof incoming!=='object') return base;
  const out=structuredClone(base);
  const merge=(a,b)=>{for(const [k,v] of Object.entries(b||{})){if(v && typeof v==='object' && !Array.isArray(v) && a[k] && typeof a[k]==='object' && !Array.isArray(a[k])) merge(a[k],v); else a[k]=v;}return a;};
  return merge(out,incoming);
};
BMH.loadState = () => {
  const base=BMH.defaultState();
  try { const raw=localStorage.getItem(BMH.STORAGE_KEY); if(raw) return BMH.mergeState(base,JSON.parse(raw)); } catch(e){}
  return base;
};
BMH.state = BMH.loadState();
BMH.save = () => { BMH.state.version=BMH.VERSION; BMH.state.meta.savedAt=new Date().toISOString(); try{localStorage.setItem(BMH.STORAGE_KEY,JSON.stringify(BMH.state));}catch(e){BMH.toast('Không thể lưu cục bộ. Hãy xuất bản sao dự án.');} };
BMH.get = path => path.split('.').reduce((o,k)=>o?.[k],BMH.state);
BMH.set = (path,value,{render=true}={}) => { const keys=path.split('.'); let o=BMH.state; for(let i=0;i<keys.length-1;i++){if(!o[keys[i]]||typeof o[keys[i]]!=='object')o[keys[i]]={};o=o[keys[i]];} o[keys.at(-1)]=value; BMH.save(); if(render) BMH.render(); };
BMH.isUnlocked = () => BMH.state.access.paid===true;
