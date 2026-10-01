BMH.defaultState = () => ({
  version: BMH.VERSION,
  ui: {step:1, designView:'exterior', designDrawing:'plan', roomCamera:'inside', homeMode:'design', onboardingComplete:false, onboardingStep:1, sidebarCollapsed:false, designTab:'planner', materialCategory:'floor', materialSearchLocal:false, location:{drawingLot:false}, planner:{floor:0,selected:'r1',snap:.2,zoom:1,tool:'select',mode:'technical',view:'plan',layout:'wide',textSize:'large',toolsOpen:false,inspectorOpen:false,legendOpen:true,showFurniture:true,showDimensions:true,showFeng:false,showBelow:false,showStructure:false,showEnvironment:false,showCirculation:false,showSectionLine:false,showClimate:false,showEnvelope:false}, architectureEngine:'existing', sceneMode:'reference', sceneTheme:'day', sceneFocus:'all', sceneExploded:false},
  access: {paid:false, source:'none', paidAt:null, verifiedAt:null, orderCode:null},
  project: {
    name:'Nhà của mình', source:'suggest', style:'Hiện đại', briefIdea:'',
    brief:{provider:'',model:'',notice:'',updatedAt:'',result:{},aiSuggestions:{},userRequirements:{}},
    sourceRefs:[],
    site:{country:'Việt Nam',province:'TP. Hồ Chí Minh',district:'Phường Thủ Dầu Một',address:'',lat:11.160,lng:106.650,geoSource:'Dữ liệu vùng',pinAddressNeedsReview:false,mapEngine:'free',mapStyle:'hybrid',mapZoom:17,mapCenter:{},showLotOverlay:true,showClimateMap:true,showContextRings:true,lotMode:'rect',lotSource:'dimensions',lotPoints:[],useParcelGeometry:false,frontEdge:0,floorHeight:3.4,slabThickness:.14,ceilingDrop:.2,deedArea:0,deedReference:'',frontDirection:'Nam',width:5,depth:20,floors:2,road:4,soil:'Đất thịt đồng bằng',shape:'Hình chữ nhật',targetCoverage:.68,setbackFront:2,setbackRear:1,setbackSide:.2,designStrategy:'climate'},
    siteIntelligence:{key:'',status:'idle',fetchedAt:'',elevation_m:null,flood:{level:'Chưa đánh giá',score:0,note:'',waterwayDistanceKm:null,riverSignal:null},access:{level:'Chưa đánh giá',score:0,note:'',majorRoadDistanceKm:null,majorRoadName:'',majorRoadType:''},transport:{level:'Chưa đánh giá',surchargePct:0,note:''},suppliers:[],builders:[],webSuppliers:[],webBuilders:[],citations:[],sources:[],aiSummary:'',warnings:[]},
    finance:{cash:800000000,income:25000000,living:8000000,reserve:100000000,existingDebt:0,loan:500000000,targetBudget:0,years:15,bank:'VCB',introRate:6.9,postRate:10.9,promoMonths:12,rateMeta:{bankId:'VCB',status:'preset',verified:false,product:'',sourceDate:'',fetchedAt:'',provider:'',model:'',introRate:0,postRate:0,promoMonths:0,citations:[],note:''}},
    household:{ownerBirth:1988,ownerGender:'Nam',partnerEnabled:true,partnerBirth:1990,partnerGender:'Nữ',requestedSize:0,children:[{id:'c1',name:'Con 1',birth:2012,room:'Riêng'}],relatives:[{id:'p1',name:'Ba',birth:1962,mobility:'Hạn chế nhẹ'},{id:'p2',name:'Mẹ',birth:1964,mobility:'Bình thường'}]},
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
    ], lockedRoomIds:[],lockedFloors:[]},
    planVariants:[],
    designStudio:{kits:[],activeKit:'',inputSignature:'',appliedSignature:''},
    planVersions:[],
    materials:{tier:'standard',climatePackage:'recommended',choices:{floor:'viglacera',paint:'dulux',door:'xingfa'},finish:{exterior:null,rooms:{}},lastDelta:0},
    aiScan:{sourceName:'',mimeType:'',scannedAt:'',model:'',provider:'',intent:'reference',appliedAt:'',result:{}},
    homeFinish:{photos:[],activePhotoId:'',preferences:{style:'Hiện đại',budget:'balanced',notes:''},analyses:{},selected:{},satisfaction:{signature:'',confirmedAt:''},geometryKey:''},
    performance:{solarEnabled:true,rainwaterEnabled:true,coolRoof:true,smartShading:true,mode:'balanced'},
    dataEngine: BMH.defaultDataEngineState(),
    wearYear:0,
    checklist:{pipe114:false,acWire:false,pressure:false,internet:false,elcb:false,waterTank:false,drainSlope:false,grounding:false,rcbo:false,acDrain:false,kitchenHood:false,conduitReserve:false},
    dossier:{startDate:'',progress:0,currentStage:'foundation',revision:'A',architect:'',contractor:'',notes:'',actualCosts:{foundation:0,structure:0,walls:0,roof:0,mep:0,finish:0,handover:0},evidence:[]}
  },
  meta:{savedAt:null}
});

BMH.DYNAMIC_STATE_PATHS=new Set(['project.materials.choices','project.materials.finish','project.designStudio','project.homeFinish','project.site.mapCenter','project.aiScan.result','project.dataEngine.materialOverrides','project.dataEngine.costSources','project.brief.result','project.brief.aiSuggestions','project.brief.userRequirements','project.siteIntelligence']);
BMH.mergeState = (base, incoming) => {
  const isPlain=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
  if(!isPlain(incoming)) return structuredClone(base);
  const out=structuredClone(base);
  const merge=(a,b,path='')=>{
    if(!isPlain(a)||!isPlain(b))return a;
    for(const [k,v] of Object.entries(b)){
      if(!(k in a))continue;
      const next=path?path+'.'+k:k,current=a[k];
      if(BMH.DYNAMIC_STATE_PATHS.has(next)){if(isPlain(v))a[k]=structuredClone(v);continue;}
      if(Array.isArray(current)){if(Array.isArray(v))a[k]=structuredClone(v);continue;}
      if(isPlain(current)){if(isPlain(v))merge(current,v,next);continue;}
      if(v===null||typeof v==='object'||typeof v==='undefined')continue;
      a[k]=v;
    }
    return a;
  };
  return merge(out,incoming);
};
BMH.loadState = () => {
  const base=BMH.defaultState(), keys=[BMH.STORAGE_KEY,...(BMH.LEGACY_STORAGE_KEYS||[])];
  for(const key of keys){
    try{
      const raw=localStorage.getItem(key);if(!raw)continue;
      const parsed=JSON.parse(raw);const merged=BMH.mergeState(base,parsed);
      if(!Object.prototype.hasOwnProperty.call(parsed?.project?.site||{},'pinAddressNeedsReview'))merged.project.site.pinAddressNeedsReview=!/^(Địa chỉ ·|Dữ liệu vùng)/.test(merged.project.site.geoSource||'Dữ liệu vùng');
      if(key!==BMH.STORAGE_KEY){try{localStorage.setItem(BMH.STORAGE_KEY,JSON.stringify(merged));}catch(_){}}
      return merged;
    }catch(e){try{localStorage.removeItem(key);}catch(_){}}
  }
  return base;
};
BMH.state = BMH.loadState();
BMH.normalizeState = () => {
  const base=BMH.defaultState();
  if(!BMH.state||typeof BMH.state!=='object')BMH.state=base;
  if(!BMH.state.ui||typeof BMH.state.ui!=='object')BMH.state.ui=structuredClone(base.ui);
  if(!BMH.state.ui.planner||typeof BMH.state.ui.planner!=='object')BMH.state.ui.planner=structuredClone(base.ui.planner);
  if(!BMH.state.ui.location||typeof BMH.state.ui.location!=='object')BMH.state.ui.location=structuredClone(base.ui.location);
  if(typeof BMH.state.ui.onboardingComplete!=='boolean')BMH.state.ui.onboardingComplete=false;
  BMH.state.ui.onboardingStep=BMH.clamp(Number(BMH.state.ui.onboardingStep)||1,1,3);
  if(!BMH.state.project||typeof BMH.state.project!=='object')BMH.state.project=structuredClone(base.project);
  if(typeof BMH.state.project.briefIdea!=='string')BMH.state.project.briefIdea='';
  if(!BMH.state.project.brief||typeof BMH.state.project.brief!=='object')BMH.state.project.brief=structuredClone(base.project.brief);
  else {const b=BMH.state.project.brief,d=base.project.brief;for(const [k,v] of Object.entries(d))if(!(k in b))b[k]=structuredClone(v);if(!b.result||typeof b.result!=='object'||Array.isArray(b.result))b.result={};if(!b.aiSuggestions||typeof b.aiSuggestions!=='object'||Array.isArray(b.aiSuggestions))b.aiSuggestions={};if(!b.userRequirements||typeof b.userRequirements!=='object'||Array.isArray(b.userRequirements))b.userRequirements={};b.provider=String(b.provider||'').slice(0,40);b.model=String(b.model||'').slice(0,120);b.notice=String(b.notice||'').slice(0,500);b.updatedAt=String(b.updatedAt||'').slice(0,40);}
  if(!Array.isArray(BMH.state.project.sourceRefs))BMH.state.project.sourceRefs=[];
  BMH.state.project.sourceRefs=BMH.state.project.sourceRefs.filter(x=>x&&typeof x==='object').slice(0,6).map(x=>({id:String(x.id||BMH.uid('src')),kind:['image','video','pdf','file'].includes(x.kind)?x.kind:'file',name:String(x.name||'Tài liệu').slice(0,180),type:String(x.type||'').slice(0,120),size:Math.max(0,Number(x.size)||0),status:String(x.status||'Đã lưu tham chiếu').slice(0,120)}));
  if(!BMH.state.project.site||typeof BMH.state.project.site!=='object')BMH.state.project.site=structuredClone(base.project.site);
  if(!BMH.state.project.siteIntelligence||typeof BMH.state.project.siteIntelligence!=='object'||Array.isArray(BMH.state.project.siteIntelligence))BMH.state.project.siteIntelligence=structuredClone(base.project.siteIntelligence);
  else{
    const si=BMH.state.project.siteIntelligence,di=base.project.siteIntelligence;
    for(const [k,v] of Object.entries(di))if(!(k in si))si[k]=structuredClone(v);
    si.key=String(si.key||'').slice(0,120);si.status=String(si.status||'idle').slice(0,24);si.fetchedAt=String(si.fetchedAt||'').slice(0,40);
    for(const k of ['suppliers','builders','webSuppliers','webBuilders','citations','sources','warnings'])if(!Array.isArray(si[k]))si[k]=[];
    si.suppliers=si.suppliers.slice(0,12);si.builders=si.builders.slice(0,10);si.webSuppliers=si.webSuppliers.slice(0,8);si.webBuilders=si.webBuilders.slice(0,8);si.citations=si.citations.slice(0,10);si.sources=si.sources.slice(0,8);si.warnings=si.warnings.slice(0,8);
    si.aiSummary=String(si.aiSummary||'').slice(0,1200);
  }
  if(!BMH.state.project.finance||typeof BMH.state.project.finance!=='object')BMH.state.project.finance=structuredClone(base.project.finance);
  BMH.state.project.finance.targetBudget=Math.max(0,Number(BMH.state.project.finance.targetBudget)||0);
  if(!BMH.state.project.finance.rateMeta||typeof BMH.state.project.finance.rateMeta!=='object'||Array.isArray(BMH.state.project.finance.rateMeta))BMH.state.project.finance.rateMeta=structuredClone(base.project.finance.rateMeta);
  else{
    const m=BMH.state.project.finance.rateMeta,d=base.project.finance.rateMeta;
    for(const [k,v] of Object.entries(d))if(!(k in m))m[k]=structuredClone(v);
    m.bankId=String(m.bankId||'').slice(0,24);m.status=String(m.status||'preset').slice(0,24);m.verified=m.verified===true;
    m.product=String(m.product||'').slice(0,180);m.sourceDate=String(m.sourceDate||'').slice(0,40);m.fetchedAt=String(m.fetchedAt||'').slice(0,40);
    m.provider=String(m.provider||'').slice(0,40);m.model=String(m.model||'').slice(0,120);m.note=String(m.note||'').slice(0,400);
    m.introRate=Math.max(0,Math.min(30,Number(m.introRate)||0));m.postRate=Math.max(0,Math.min(30,Number(m.postRate)||0));m.promoMonths=Math.max(0,Math.min(120,Number(m.promoMonths)||0));
    if(!Array.isArray(m.citations))m.citations=[];m.citations=m.citations.slice(0,8).map(x=>({title:String(x?.title||'Nguồn').slice(0,180),url:String(x?.url||'').slice(0,600)}));
  }
  if(!BMH.state.project.household||typeof BMH.state.project.household!=='object')BMH.state.project.household=structuredClone(base.project.household);
  if(!BMH.state.project.plan||typeof BMH.state.project.plan!=='object')BMH.state.project.plan=structuredClone(base.project.plan);
  if(!Array.isArray(BMH.state.project.plan.rooms))BMH.state.project.plan.rooms=structuredClone(base.project.plan.rooms);
  if(!Array.isArray(BMH.state.project.plan.openings))BMH.state.project.plan.openings=structuredClone(base.project.plan.openings);
  if(!Array.isArray(BMH.state.project.plan.lockedRoomIds))BMH.state.project.plan.lockedRoomIds=[];
  BMH.state.project.plan.lockedRoomIds=BMH.state.project.plan.lockedRoomIds.filter(id=>BMH.state.project.plan.rooms.some(r=>r.id===id));
  if(!Array.isArray(BMH.state.project.plan.lockedFloors))BMH.state.project.plan.lockedFloors=[];
  BMH.state.project.plan.lockedFloors=BMH.state.project.plan.lockedFloors.filter(f=>Number.isInteger(f)&&f>=0&&f<Number(BMH.state.project.site?.floors));
  if(!Array.isArray(BMH.state.project.planVariants))BMH.state.project.planVariants=[];
  if(!Array.isArray(BMH.state.project.planVersions))BMH.state.project.planVersions=[];
  BMH.state.project.planVariants=BMH.state.project.planVariants.slice(0,3);
  BMH.state.project.planVersions=BMH.state.project.planVersions.slice(0,6);
  if(!BMH.state.project.materials||typeof BMH.state.project.materials!=='object')BMH.state.project.materials=structuredClone(base.project.materials);
  if(!BMH.state.project.aiScan||typeof BMH.state.project.aiScan!=='object')BMH.state.project.aiScan=structuredClone(base.project.aiScan);
  else {const a=BMH.state.project.aiScan,b=base.project.aiScan;for(const [k,v] of Object.entries(b))if(!(k in a))a[k]=structuredClone(v);if(!a.result||typeof a.result!=='object'||Array.isArray(a.result))a.result={};if(!['reference','my_home'].includes(a.intent))a.intent='reference';}
  const materialCategories=new Set(['floor','cement','steel','waterproof','paint','mep','door','sanitary','roof','insulation','lighting','cabinetry']);
  BMH.state.project.materials.choices={...base.project.materials.choices,...Object.fromEntries(Object.entries(BMH.state.project.materials.choices||{}).filter(([k,v])=>materialCategories.has(k)&&typeof v==='string'&&v.length<=120))};
  if(!['basic','recommended','robust'].includes(BMH.state.project.materials.climatePackage))BMH.state.project.materials.climatePackage='recommended';
  if(!BMH.state.project.performance||typeof BMH.state.project.performance!=='object')BMH.state.project.performance=structuredClone(base.project.performance);
  if(!BMH.state.project.checklist||typeof BMH.state.project.checklist!=='object')BMH.state.project.checklist=structuredClone(base.project.checklist);
  else for(const [k,v] of Object.entries(base.project.checklist))if(typeof BMH.state.project.checklist[k]!=='boolean')BMH.state.project.checklist[k]=v;
  if(!BMH.state.project.dossier||typeof BMH.state.project.dossier!=='object')BMH.state.project.dossier=structuredClone(base.project.dossier);
  else {const d=BMH.state.project.dossier;for(const [k,v] of Object.entries(base.project.dossier))if(!(k in d))d[k]=structuredClone(v);d.progress=BMH.clamp(Number(d.progress)||0,0,100);if(!['foundation','structure','walls','roof','mep','finish','handover'].includes(d.currentStage))d.currentStage='foundation';if(!/^\d{4}-\d{2}-\d{2}$/.test(String(d.startDate||'')))d.startDate='';d.revision=String(d.revision||'A').slice(0,12);if(!d.actualCosts||typeof d.actualCosts!=='object'||Array.isArray(d.actualCosts))d.actualCosts={};for(const k of Object.keys(base.project.dossier.actualCosts))d.actualCosts[k]=Math.max(0,Number(d.actualCosts[k])||0);if(!Array.isArray(d.evidence))d.evidence=[];d.evidence=d.evidence.slice(0,30).filter(x=>x&&typeof x==='object').map(x=>({id:String(x.id||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80),stage:Object.keys(base.project.dossier.actualCosts).includes(x.stage)?x.stage:'foundation',name:String(x.name||'Tệp hiện trường').slice(0,180),type:String(x.type||'').slice(0,80),size:Math.max(0,Number(x.size)||0),addedAt:String(x.addedAt||'').slice(0,40)})).filter(x=>x.id);}
  if(!BMH.state.project.dataEngine||typeof BMH.state.project.dataEngine!=='object')BMH.state.project.dataEngine=BMH.defaultDataEngineState();
  else {const d=BMH.state.project.dataEngine,b=BMH.defaultDataEngineState();if(!d.cost||typeof d.cost!=='object')d.cost=structuredClone(b.cost);for(const [k,v] of Object.entries(b.cost))if(!Number.isFinite(Number(d.cost[k])))d.cost[k]=v;if(!d.quote||typeof d.quote!=='object')d.quote=structuredClone(b.quote);if(!d.costSources||typeof d.costSources!=='object'||Array.isArray(d.costSources))d.costSources={};if(!d.materialOverrides||typeof d.materialOverrides!=='object'||Array.isArray(d.materialOverrides))d.materialOverrides={};if(!d.status||typeof d.status!=='object')d.status=structuredClone(b.status);if(!Array.isArray(d.snapshots))d.snapshots=[];d.snapshots=d.snapshots.slice(0,12);if(!['regional','baseline'].includes(d.pricingMode))d.pricingMode='regional';}
  const perf=BMH.state.project.performance;
  for(const k of ['solarEnabled','rainwaterEnabled','coolRoof','smartShading'])if(typeof perf[k]!=='boolean')perf[k]=base.project.performance[k];
  if(!['economy','balanced','comfort'].includes(perf.mode))perf.mode='balanced';
  if(!BMH.state.access||typeof BMH.state.access!=='object')BMH.state.access=structuredClone(base.access);
  for(const k of ['paidAt','verifiedAt','orderCode'])if(!(k in BMH.state.access))BMH.state.access[k]=base.access[k];
  const s=BMH.state.project.site;
  const alias=BMH.REGION_ALIASES?.[s.province];
  if(alias&&alias.province!==s.province){s.district=alias.districts?.[s.district]||s.district;s.province=alias.province;}
  else if(alias?.districts?.[s.district])s.district=alias.districts[s.district];
  const r=BMH.REGIONS[s.province]||BMH.REGIONS['TP. Hồ Chí Minh'];
  const h=BMH.state.project.household||{};
  if(!Array.isArray(h.children))h.children=[];
  if(!Array.isArray(h.relatives))h.relatives=[];
  h.ownerBirth=Number(h.ownerBirth)||1988; h.partnerBirth=Number(h.partnerBirth)||1990;
  h.ownerGender=['Nam','Nữ'].includes(h.ownerGender)?h.ownerGender:'Nam';
  h.partnerGender=['Nam','Nữ'].includes(h.partnerGender)?h.partnerGender:'Nữ';
  if(typeof h.partnerEnabled!=='boolean')h.partnerEnabled=true;
  h.requestedSize=BMH.clamp(Number(h.requestedSize)||0,0,20);
  if(!s.shape)s.shape='Hình chữ nhật';
  if(!s.geoSource)s.geoSource='Dữ liệu vùng';
  if(typeof s.pinAddressNeedsReview!=='boolean')s.pinAddressNeedsReview=!/^(Địa chỉ ·|Dữ liệu vùng)/.test(s.geoSource);
  if(!['free','google'].includes(s.mapEngine))s.mapEngine='free';
  if(!['roadmap','satellite','hybrid','terrain'].includes(s.mapStyle))s.mapStyle='hybrid';
  s.mapZoom=BMH.clamp(Number(s.mapZoom)||17,3,22);
  if(typeof s.showLotOverlay!=='boolean')s.showLotOverlay=true;
  if(typeof s.showClimateMap!=='boolean')s.showClimateMap=true;
  if(typeof s.showContextRings!=='boolean')s.showContextRings=true;
  if(!['rect','custom'].includes(s.lotMode))s.lotMode='rect';
  s.useParcelGeometry=s.useParcelGeometry===true;s.frontEdge=Math.max(0,Math.floor(Number(s.frontEdge)||0));
  s.floorHeight=BMH.clamp(Number(s.floorHeight)||3.4,2.4,6);s.slabThickness=BMH.clamp(Number(s.slabThickness)||.14,.08,.5);s.ceilingDrop=BMH.clamp(Number(s.ceilingDrop)||0,0,1);if(s.floorHeight-s.slabThickness-s.ceilingDrop<2.1)s.ceilingDrop=Math.max(0,s.floorHeight-s.slabThickness-2.1);
  BMH.state.ui.architectureEngine='existing'; // Migrate saved experimental viewers to the supported renderer.
  if(!Array.isArray(s.lotPoints))s.lotPoints=[];
  s.lotPoints=s.lotPoints.filter(p=>p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))).slice(0,256).map(p=>({lat:Number(p.lat),lng:Number(p.lng)}));
  if(!['dimensions','drawn','geojson-user'].includes(s.lotSource))s.lotSource=s.lotMode==='custom'?'drawn':'dimensions';
  s.deedArea=BMH.clamp(Number(s.deedArea)||0,0,100000);
  s.deedReference=String(s.deedReference||'').slice(0,160);
  s.targetCoverage=BMH.clamp(Number(s.targetCoverage)||.68,.45,.90);
  s.setbackFront=BMH.clamp(Number(s.setbackFront)||0,0,Math.max(0,Number(s.depth)||20)*.45);
  s.setbackRear=BMH.clamp(Number(s.setbackRear)||0,0,Math.max(0,Number(s.depth)||20)*.35);
  s.setbackSide=BMH.clamp(Number(s.setbackSide)||0,0,Math.max(0,Number(s.width)||5)*.25);
  if(!['climate','balanced','budget'].includes(s.designStrategy))s.designStrategy='climate';
  if(!['Bắc','Đông Bắc','Đông','Đông Nam','Nam','Tây Nam','Tây','Tây Bắc'].includes(s.frontDirection))s.frontDirection='Nam';
  const valid=(r.districts||[]).some(d=>d[0]===s.district);
  if(!valid){const pt=BMH.regionPoint(s.province,r.defaultDistrict);if(!s.district)s.district=pt.district;if(!Number.isFinite(Number(s.lat))||!Number.isFinite(Number(s.lng))){s.lat=pt.lat;s.lng=pt.lng;}}
  const ui=BMH.state.ui.planner;
  if(!ui.selected || !BMH.state.project.plan.rooms.some(x=>x.id===ui.selected))ui.selected=BMH.state.project.plan.rooms[0]?.id||null;
  if(!['select','door','window'].includes(ui.tool))ui.tool='select';
  if(!['plan','elevation','section'].includes(ui.view))ui.view='plan';
  if(!['wide','compact'].includes(ui.layout))ui.layout='wide';
  if(!['normal','large'].includes(ui.textSize))ui.textSize='large';
  if(typeof ui.showBelow!=='boolean')ui.showBelow=false;
  if(typeof ui.showStructure!=='boolean')ui.showStructure=true;
  if(typeof ui.showEnvironment!=='boolean')ui.showEnvironment=true;
  if(typeof ui.showCirculation!=='boolean')ui.showCirculation=true;
  if(typeof ui.showSectionLine!=='boolean')ui.showSectionLine=true;
  if(typeof ui.showClimate!=='boolean')ui.showClimate=true;
  if(typeof ui.showEnvelope!=='boolean')ui.showEnvelope=true;
  if(typeof BMH.state.ui.location.drawingLot!=='boolean')BMH.state.ui.location.drawingLot=false;
  ui.zoom=BMH.clamp(Number(ui.zoom)||1,.75,2.5);
  if(typeof BMH.state.ui.sceneExploded!=='boolean')BMH.state.ui.sceneExploded=false;
};
BMH.normalizeState();
BMH.syncHouseholdSize=()=>{
  const h=BMH.state.project.household;
  const actual=1+(h.partnerEnabled!==false?1:0)+(h.children?.length||0)+(h.relatives?.length||0);
  const requested=Math.max(0,Number(h.requestedSize)||0);
  h.requestedSize=Math.max(actual,requested);
  return h.requestedSize;
};
BMH.save = () => { BMH.state.version=BMH.VERSION; BMH.state.meta.savedAt=new Date().toISOString(); try{localStorage.setItem(BMH.STORAGE_KEY,JSON.stringify(BMH.state));}catch(e){BMH.toast('Không thể lưu cục bộ. Hãy xuất bản sao dự án.');} };
BMH.get = path => path.split('.').reduce((o,k)=>o?.[k],BMH.state);
BMH.set = (path,value,{render=true}={}) => { const keys=path.split('.'); let o=BMH.state; for(let i=0;i<keys.length-1;i++){if(!o[keys[i]]||typeof o[keys[i]]!=='object')o[keys[i]]={};o=o[keys[i]];} o[keys.at(-1)]=value; BMH.save(); if(render) BMH.render(); };
BMH.isUnlocked = () => BMH.DEFER_PAYMENT===true || (BMH.state.access.paid===true && (BMH.state.access.source==='server-verified' || (BMH.DEV && String(BMH.state.access.source||'').startsWith('dev'))));
