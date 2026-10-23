BMH.defaultState = () => ({
  version: BMH.VERSION,
  ui: {step:1, guidedPanels:{'style-output':false,'worship-review':false},programFloor:0,proposalFloor:0, renderMode:'interactive',renderQuality:'draft',sharpResolution:1280,designView:'exterior', presentationMode:false, designDrawing:'plan', roomCamera:'overview', exteriorCamera:'front', homeMode:'design', onboardingComplete:false, onboardingStep:1, sidebarCollapsed:false, designTab:'planner', materialCategory:'floor', materialSearchLocal:false, location:{drawingLot:false}, planner:{directTool:'select',drawRoomType:'bed',selectedOpening:'',selectedFixture:'',floor:0,selected:'r1',snap:.2,zoom:1,tool:'select',mode:'technical',view:'plan',openingPage:0,stairDrawingId:'',sectionCutX:null,layout:'wide',textSize:'large',toolsOpen:false,inspectorOpen:false,legendOpen:true,showFurniture:true,showDimensions:true,showFeng:false,showBelow:false,showStructure:false,showEnvironment:false,showCirculation:false,showSectionLine:false,showClimate:false,showEnvelope:false}, architectureEngine:'existing', sceneMode:'reference', sceneTheme:'day', sceneFocus:'all', sceneExploded:false, modelLook:'materials', modelWalls:'auto', modelRoomId:'', modelLightLevel:75},
  access: {paid:false, source:'none', paidAt:null, verifiedAt:null, orderCode:null},
  project: {
    name:'Nhà của mình', source:'suggest', style:'Hiện đại', briefIdea:'',
    brief:{provider:'',model:'',notice:'',updatedAt:'',result:{},aiSuggestions:{},userRequirements:{}},
    inputEvidence:{schemaVersion:1,origin:'not-recorded',records:{}},
    sourceRefs:[],
    styleReferenceId:'',
    designEvidence:{schemaVersion:1,research:[],site:[],fengSources:[],materialSources:[],context:{}},
    constructionDesign:{schemaVersion:2,inputs:{},elements:[],reviews:[],issues:[]},
    site:{north:{azimuthDeg:null,datum:'unknown',sourceReference:'',observedAt:'',status:'unknown'},elevation:{metres:null,datum:'unknown',sourceReference:'',observedAt:'',status:'unknown'},country:'Việt Nam',province:'TP. Hồ Chí Minh',district:'Phường Thủ Dầu Một',address:'',lat:11.160,lng:106.650,geoSource:'Dữ liệu vùng',pinAddressNeedsReview:false,mapEngine:'free',mapStyle:'hybrid',mapZoom:17,mapCenter:{},showLotOverlay:true,showClimateMap:true,showContextRings:true,lotMode:'rect',lotSource:'dimensions',boundaryEvidenceId:'',lotPoints:[],useParcelGeometry:false,frontEdge:0,floorHeight:3.4,floorHeights:[],slabThickness:.14,ceilingDrop:.2,deedArea:0,deedReference:'',frontDirection:'Nam',width:5,depth:20,floors:2,road:4,soil:'Đất thịt đồng bằng',shape:'Hình chữ nhật',targetCoverage:.68,setbackFront:2,setbackRear:1,setbackSide:.2,designStrategy:'climate'},
    siteIntelligence:{key:'',status:'idle',fetchedAt:'',elevation_m:null,flood:{level:'Chưa đánh giá',score:0,note:'',waterwayDistanceKm:null,riverSignal:null},access:{level:'Chưa đánh giá',score:0,note:'',majorRoadDistanceKm:null,majorRoadName:'',majorRoadType:''},transport:{level:'Chưa đánh giá',surchargePct:0,note:''},suppliers:[],builders:[],webSuppliers:[],webBuilders:[],citations:[],sources:[],aiSummary:'',warnings:[]},
    finance:{scenario:{schemaVersion:1,confirmed:false,sourceReference:'',effectiveAt:'',months:null,method:'annuity',ratePeriods:[],draws:[],graceMonths:0,fees:null,constructionPayments:[]},cash:800000000,income:25000000,living:8000000,reserve:100000000,existingDebt:0,loan:500000000,targetBudget:0,years:15,bank:'VCB',introRate:6.9,postRate:10.9,promoMonths:12,rateMeta:{bankId:'VCB',status:'preset',verified:false,product:'',sourceDate:'',fetchedAt:'',provider:'',model:'',introRate:0,postRate:0,promoMonths:0,citations:[],note:''}},
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
    ], outdoor:[], fixtures:[], furniture:[], lockedRoomIds:[],lockedFloors:[]},
    planVariants:[],
    designStudio:{kits:[],activeKit:'',inputSignature:'',appliedSignature:''},
    planVersions:[],
    materials:{tier:'standard',climatePackage:'recommended',choices:{floor:'viglacera',paint:'dulux',door:'xingfa'},finish:{exterior:null,rooms:{}},lastDelta:0},
    aiScan:{sourceName:'',mimeType:'',scannedAt:'',model:'',provider:'',intent:'reference',appliedAt:'',result:{}},
    homeFinish:{photos:[],activePhotoId:'',preferences:{style:'Hiện đại',budget:'balanced',notes:''},analyses:{},selected:{},satisfaction:{signature:'',confirmedAt:''},geometryKey:''},
    measuredDesign:{roof:{type:'auto',pitchDeg:0,overhang:-1,ridge:'auto',surface:'auto',color:'',parapetHeight:-1},wallThickness:{exterior:.22,interior:.12}},
    costPlan:{contingencyPct:10,pricing:{},extras:{},applications:[],quotes:{},conversions:[],exclusions:[],scopeCoverage:[]},
    performance:{solarEnabled:true,rainwaterEnabled:true,coolRoof:true,smartShading:true,mode:'balanced'},
    dataEngine: BMH.defaultDataEngineState(),
    wearYear:0,
    checklist:{pipe114:false,acWire:false,pressure:false,internet:false,elcb:false,waterTank:false,drainSlope:false,grounding:false,rcbo:false,acDrain:false,kitchenHood:false,conduitReserve:false},
    dossier:{register:{schemaVersion:1,wbs:[],journal:[],inspections:[],issues:[],changes:[],payments:[],drawdowns:[],decisions:[],outputs:[],warranties:[]},startDate:'',progress:0,currentStage:'foundation',revision:'A',architect:'',contractor:'',notes:'',actualCosts:{foundation:0,structure:0,walls:0,roof:0,mep:0,finish:0,handover:0},stageProgress:{},budgetBaselines:[],activeBaselineId:'',evidence:[]}
  },
  meta:{savedAt:null,createdAt:null,localProjectId:'',cloudProjectId:'',cloudOwnerId:'',cloudRevision:null,cloudUpdatedAt:null}
});

BMH.DYNAMIC_STATE_PATHS=new Set(['ui.guidedPanels','project.designEvidence','project.constructionDesign','project.materials.choices','project.materials.finish','project.designStudio','project.homeFinish','project.site.mapCenter','project.aiScan.result','project.dataEngine.materialOverrides','project.dataEngine.costSources','project.brief.result','project.brief.aiSuggestions','project.brief.userRequirements','project.siteIntelligence','project.costPlan.pricing','project.costPlan.extras','project.dossier.stageProgress']);
BMH.DYNAMIC_STATE_PATHS.add('project.inputEvidence.records');
BMH.DYNAMIC_STATE_PATHS.add('project.costPlan.quotes');
BMH.DYNAMIC_STATE_PATHS.add('project.finance.scenario');
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
// New designs start from the customer's site, not the legacy demonstration plan.
// Keep defaultState as the migration baseline so saved designs retain their data.
BMH.newProjectState = () => {
  const state=BMH.defaultState();
  for(const key of ['rooms','openings','outdoor','fixtures','furniture','lockedRoomIds','lockedFloors'])state.project.plan[key]=[];
  Object.assign(state.ui.planner,{selected:'',selectedOpening:'',selectedFixture:'',directTool:'room'});
  return state;
};
BMH.loadState = () => {
  BMH.localStateLoaded=false;
  const base=BMH.defaultState(), keys=[BMH.STORAGE_KEY,...(BMH.LEGACY_STORAGE_KEYS||[])];
  for(const key of keys){
    try{
      const raw=localStorage.getItem(key);if(!raw)continue;
      const parsed=JSON.parse(raw);const merged=BMH.mergeState(base,parsed);
      if(!Object.prototype.hasOwnProperty.call(parsed?.project?.site||{},'pinAddressNeedsReview'))merged.project.site.pinAddressNeedsReview=!/^(Địa chỉ ·|Dữ liệu vùng)/.test(merged.project.site.geoSource||'Dữ liệu vùng');
      if(key!==BMH.STORAGE_KEY){try{localStorage.setItem(BMH.STORAGE_KEY,JSON.stringify(merged));}catch(_){}}
      BMH.localStateLoaded=true;return merged;
    }catch(e){try{localStorage.removeItem(key);}catch(_){}}
  }
  return BMH.newProjectState();
};
BMH.state = BMH.loadState();
// Defaults and legacy values remain usable; they are not confirmed evidence.
BMH.INPUT_FIELDS=Object.freeze(['source','style','briefIdea','site.width','site.depth','site.floors','site.frontDirection','site.lat','site.lng','site.lotPoints','site.north','site.elevation','site.setbackFront','site.setbackRear','site.setbackSide','household','finance.cash','finance.income','finance.living','finance.reserve','finance.existingDebt','finance.loan','finance.targetBudget','finance.scenario','costPlan.contingencyPct']);
BMH.projectInputValue=(field,p=BMH.state.project)=>field.split('.').reduce((v,k)=>v?.[k],p);
BMH.recordProjectInput=(field,evidence={}, {save=true}={})=>{
  field=String(field).replace(/^project\./,'');
  if(!BMH.INPUT_FIELDS.some(k=>field===k||field.startsWith(k+'.')))return false;
  const p=BMH.state.project,register=p.inputEvidence||={schemaVersion:1,origin:'not-recorded',records:{}};
  register.records||={};
  const value=BMH.evidenceValue(BMH.projectInputValue(field)),sourceType=['customer-entered','surveyed','map-estimate','official-document'].includes(evidence.sourceType)?evidence.sourceType:'customer-entered';
  register.records[field]={value,sourceType,sourceReference:String(evidence.sourceReference||'').slice(0,200),sourceUrl:BMH.evidenceUrl(evidence.sourceUrl),recordedAt:new Date().toISOString(),effectiveAt:String(evidence.effectiveAt||'').slice(0,40),status:evidence.status==='awaiting-review'?'awaiting-review':'provided',confirmed:evidence.confirmed===true&&sourceType==='customer-entered'};
  if(save)BMH.save();return register.records[field];
};
BMH.projectInputRegister=(p=BMH.state.project)=>BMH.INPUT_FIELDS.map(field=>{
  const record=p.inputEvidence?.records?.[field],value=BMH.projectInputValue(field,p),same=record&&JSON.stringify(record.value)===JSON.stringify(value),missing=value===null||value===undefined||value===''||Array.isArray(value)&&!value.length;
  return {field,value:BMH.evidenceValue(value),status:missing?'unknown':record?(same?record.status:'stale'):'unknown',sourceType:record?.sourceType||'unconfirmed-default-or-legacy',confirmed:!!(same&&record.confirmed),sourceReference:record?.sourceReference||null,sourceUrl:record?.sourceUrl||null};
});
BMH.planFurnitureIssues=(plan=BMH.state.project.plan)=>{
  const issues=[],seen=new Set(),rows=plan?.furniture;
  if(!Array.isArray(rows))return [{code:'furniture-array',text:'Nội thất chưa có danh sách hợp lệ.'}];
  for(const item of rows){
    const id=item?.id,r=plan.rooms?.find(r=>r.id===item?.roomId),removed=item?.placementStatus==='removed';
    const add=(code,text)=>issues.push({id:typeof id==='string'?id:null,code,text});
    if(typeof id!=='string'||!id||id.length>200||seen.has(id))add('furniture-id','ID nội thất thiếu hoặc trùng; giữ dữ liệu để đối chiếu.');seen.add(id);
    if(!['present','removed'].includes(item?.placementStatus))add('furniture-status','Trạng thái nội thất không hợp lệ.');
    if(!removed&&(!r||!Number.isInteger(item?.floor)||item.floor!==r.floor))add('furniture-room','Phòng / tầng của nội thất không khớp.');
    if(typeof item?.modelId!=='string'||!item.modelId)add('furniture-model','Thiếu model nội thất.');
    const dimensions=[item?.pose?.x,item?.pose?.y,item?.pose?.z,item?.pose?.rotationDeg,item?.size?.width,item?.size?.depth,item?.size?.height];
    if(!dimensions.every(Number.isFinite)||item?.pose?.z<0||![item?.size?.width,item?.size?.depth,item?.size?.height].every(n=>n>0))add('furniture-dimensions','Vị trí / góc / kích thước nội thất không hợp lệ.');
    if(!Array.isArray(item?.materialBindings)||item.materialBindings.some(m=>!m||typeof m!=='object'||Array.isArray(m)))add('furniture-materials','Danh sách vật liệu nội thất không hợp lệ.');
  }
  return issues;
};
// Evidence is stored with the project; it is never a legal or engineering approval.
BMH.evidenceHash=value=>{const text=JSON.stringify(value);let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);return (hash>>>0).toString(16);};
BMH.evidenceUrl=value=>{try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password&&!Array.from(u.searchParams.keys()).some(k=>/token|secret|password|api.?key/i.test(k))?u.href:null;}catch{return null;}};
BMH.evidenceValue=value=>{
  if(value===null||typeof value==='boolean'||typeof value==='string'||typeof value==='number'&&Number.isFinite(value))return value;
  if(Array.isArray(value))return value.map(BMH.evidenceValue);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!['__proto__','constructor','prototype'].includes(k)&&!/api.?key|access.?token|password|secret/i.test(k)).map(([k,v])=>[k,BMH.evidenceValue(v)]));
  return null;
};
BMH.TECHNICAL_STATES=Object.freeze(['missing','provisional','provided','awaiting-review','reviewed','stale']);
BMH.technicalSourceProvided=row=>{
  const text=v=>typeof v==='string'&&v.trim().length>0;
  return text(row?.sourceReference)||text(row?.reference)||text(row?.reportReference)||!!BMH.evidenceUrl(row?.sourceUrl)||text(row?.source)||text(row?.source?.reference)||text(row?.source?.documentId)||!!BMH.evidenceUrl(row?.source?.url);
};
BMH.technicalReviewEvidence=row=>{
  const reviewer=row?.reviewer||row?.reviewedBy,name=typeof reviewer==='string'?reviewer:reviewer?.name,role=reviewer?.role||row?.reviewerRole;
  const reference=row?.reportReference||row?.reviewEvidence?.reference||row?.reviewEvidence?.documentId;
  const date=row?.reviewedAt||row?.reviewEvidence?.reviewedAt;
  const day=typeof date==='string'&&date.match(/^(\d{4}-\d{2}-\d{2})(?:T|$)/),calendar=day&&new Date(day[1]+'T00:00:00Z');
  const validDate=calendar&&Number.isFinite(calendar.getTime())&&calendar.toISOString().slice(0,10)===day[1]&&Number.isFinite(Date.parse(date));
  return !!(typeof name==='string'&&name.trim()&&['architect','engineer','KTS','KS'].includes(role)&&typeof reference==='string'&&reference.trim()&&validDate&&typeof row?.reviewedRevision==='string'&&row.reviewedRevision);
};
BMH.technicalRecordState=(row,kind='element')=>{
  const requested=row?.reviewState??row?.status;
  if(requested==='reviewed')return BMH.technicalReviewEvidence(row)?'reviewed':'awaiting-review';
  if(requested==='provided'&&!BMH.technicalSourceProvided(row))return 'provisional';
  if(BMH.TECHNICAL_STATES.includes(requested))return requested;
  if(kind==='review')return 'awaiting-review';
  if(!row||row.value==null&&!row.dimensions&&!row.footprint)return 'missing';
  return BMH.technicalSourceProvided(row)?'provided':'provisional';
};
BMH.normalizeConstructionDesign=project=>{
  const plain=v=>v&&typeof v==='object'&&!Array.isArray(v),technical=plain(project.constructionDesign)?BMH.evidenceValue(project.constructionDesign):{};
  const record=(row,kind,i)=>{
    const out=BMH.evidenceValue(row),declared=out.reviewState??out.status;
    out.id=typeof out.id==='string'&&out.id?out.id:'legacy-technical-'+kind+'-'+i;
    out.reviewState=BMH.technicalRecordState(out,kind);out.status=out.reviewState;
    if(declared&&declared!==out.reviewState)out.declaredReviewState=declared;
    out.dependencies=Array.isArray(out.dependencies)?out.dependencies:[];
    out.reviewedRevision=typeof out.reviewedRevision==='string'&&out.reviewedRevision?out.reviewedRevision:null;
    return out;
  };
  project.constructionDesign={...technical,schemaVersion:2,
    inputs:plain(technical.inputs)?Object.fromEntries(Object.entries(technical.inputs).map(([key,row])=>[key,plain(row)?record(row,'input',key):row])):{},
    elements:(Array.isArray(technical.elements)?technical.elements:[]).map((row,i)=>plain(row)?record(row,'element',i):row),
    reviews:(Array.isArray(technical.reviews)?technical.reviews:[]).map((row,i)=>plain(row)?record(row,'review',i):row),
    issues:Array.isArray(technical.issues)?technical.issues:[]};
};
// Approval metadata never changes the geometry it approves. Preserve real
// dimensions, units, sources and dependencies, excluding review bookkeeping.
BMH.constructionDesignIdentity=(project=BMH.state.project)=>{
  const reviewKeys=new Set(['status','reviewState','declaredReviewState','reviewer','reviewedBy','reviewerRole','reviewedAt','reviewedRevision','reviewEvidence','staleReason']);
  const clean=value=>Array.isArray(value)?value.map(clean):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>!reviewKeys.has(key)).map(([key,v])=>[key,clean(v)])):value;
  return clean({inputs:project.constructionDesign?.inputs||{},elements:project.constructionDesign?.elements||[]});
};
BMH.constructionReviewRecords=()=>{
  const c=BMH.state.project.constructionDesign||{},plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
  return [...Object.entries(c.inputs||{}).filter(([,row])=>plain(row)).map(([key,row])=>({kind:'input',key,row})),...(c.elements||[]).filter(plain).map((row,key)=>({kind:'element',key,row})),...(c.reviews||[]).filter(plain).map((row,key)=>({kind:'review',key,row}))];
};
BMH.syncConstructionReviews=()=>{
  if(typeof BMH.drawingRevision!=='function')return;
  const revision=BMH.drawingRevision();
  for(const {kind,row} of BMH.constructionReviewRecords()){
    const declared=row.reviewState??row.status;let status=BMH.technicalRecordState(row,kind);
    if(status==='reviewed'&&row.reviewedRevision!==revision){status='stale';row.staleReason='Hình học, vật liệu hoặc dữ liệu kỹ thuật đã thay đổi sau lần rà soát.';}
    if(declared&&declared!==status&&status!=='stale')row.declaredReviewState=declared;
    row.reviewState=status;row.status=status;
  }
};
BMH.constructionReview=()=>{
  const revision=BMH.drawingRevision?.()||null;
  const records=BMH.constructionReviewRecords().map(({kind,key,row})=>{
    let status=BMH.technicalRecordState(row,kind);
    if(status==='reviewed'&&row.reviewedRevision!==revision)status='stale';
    return {id:row.id||'legacy-technical-'+kind+'-'+key,kind,discipline:row.discipline||null,status,sourceProvided:BMH.technicalSourceProvided(row),reviewedRevision:row.reviewedRevision||null,dependencies:row.dependencies||[]};
  });
  const c=BMH.state.project.constructionDesign||{},plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
  const unparsed=[...Object.values(c.inputs||{}),...(c.elements||[]),...(c.reviews||[])].filter(row=>!plain(row)).length;
  return {schemaVersion:2,revision,records,reviewed:records.filter(r=>r.status==='reviewed').length,stale:records.filter(r=>r.status==='stale').length,pending:records.filter(r=>r.status!=='reviewed').length+unparsed,unparsed,proposalOnly:true};
};
BMH.normalizeDesignEvidence=project=>{
  const plain=v=>v&&typeof v==='object'&&!Array.isArray(v),prior=plain(project.designEvidence)?project.designEvidence:{};
  project.designEvidence={...prior,schemaVersion:1,context:plain(prior.context)?prior.context:{}};
  for(const group of ['research','site','fengSources','materialSources'])project.designEvidence[group]=(Array.isArray(prior[group])?prior[group]:[]).filter(plain).map((row,i)=>{
    const out=BMH.evidenceValue(row);
    for(const key of ['sourceTitle','publisher','retrievedAt','effectiveAt','unit','notes'])if(typeof out[key]!=='string')out[key]=null;
    out.id=typeof out.id==='string'&&out.id?out.id:'legacy-'+group+'-'+i;
    out.kind=typeof out.kind==='string'?out.kind:group;
    out.sourceUrl=BMH.evidenceUrl(out.sourceUrl);
    out.scope=plain(out.scope)?out.scope:{};
    out.sourceType=typeof out.sourceType==='string'?out.sourceType:'customer';
    out.verifiedState=['unverified','provided','cited','reviewed','stale'].includes(out.verifiedState)?out.verifiedState:'unverified';
    out.value=out.value??null;return out;
  });
  BMH.normalizeConstructionDesign(project);
};
BMH.siteLocationKey=(s=BMH.state.project.site)=>BMH.evidenceHash([s.lat,s.lng,s.country,s.province,s.district,s.address]);
BMH.siteBoundaryKey=(p=BMH.state.project)=>{
  const s=p.site,e=p.designEvidence?.site?.find(e=>e.id===s.boundaryEvidenceId);
  return BMH.evidenceHash([s.lotMode,s.lotSource,s.lotPoints,s.boundaryEvidenceId,s.deedReference,e?.sourceUrl,e?.effectiveAt,e?.value]);
};
BMH.siteGeometryKey=(p=BMH.state.project)=>{const s=p.site;return BMH.evidenceHash([BMH.siteBoundaryKey(p),s.width,s.depth,s.frontEdge,s.frontDirection,s.useParcelGeometry,s.setbackFront,s.setbackRear,s.setbackSide,s.floorHeight,s.slabThickness,s.ceilingDrop]);};
BMH.siteEvidenceContextKey=(p=BMH.state.project)=>BMH.evidenceHash([BMH.siteLocationKey(p.site),BMH.siteGeometryKey(p),p.designEvidence?.site?.filter(e=>['boundary','planning','setbacks'].includes(e.kind)).map(e=>[e.id,e.sourceUrl,e.effectiveAt,e.value])]);
BMH.siteEvidenceScope=()=>({locationKey:BMH.siteLocationKey(),boundaryKey:BMH.siteBoundaryKey(),geometryKey:BMH.siteGeometryKey(),lat:BMH.state.project.site.lat,lng:BMH.state.project.site.lng});
BMH.syncSiteEvidence=()=>{
  const p=BMH.state.project,e=p.designEvidence;if(!e)return;
  const locationKey=BMH.siteLocationKey(),boundaryKey=BMH.siteBoundaryKey(),geometryKey=BMH.siteGeometryKey(),contextKey=BMH.siteEvidenceContextKey();
  for(const row of e.site){
    const scope=row.scope||{},locationChanged=scope.locationKey&&scope.locationKey!==locationKey,boundaryChanged=['planning','setbacks','supplier'].includes(row.kind)&&scope.boundaryKey&&scope.boundaryKey!==boundaryKey,geometryChanged=['planning','setbacks'].includes(row.kind)&&scope.geometryKey&&scope.geometryKey!==geometryKey;
    if(locationChanged||boundaryChanged||geometryChanged){row.verifiedState='stale';row.staleReason=locationChanged?'Vị trí/địa chỉ đã thay đổi.':boundaryChanged?'Ranh hoặc hồ sơ gốc đã thay đổi.':'Kích thước, hướng hoặc khoảng lùi đã thay đổi.';}
  }
  const si=p.siteIntelligence;
  if(si?.status==='ready'&&((si.siteScopeKey&&si.siteScopeKey!==contextKey)||(e.context?.locationKey&&e.context.locationKey!==locationKey)||(e.context?.contextKey&&e.context.contextKey!==contextKey))){p.siteIntelligence={...BMH.defaultState().project.siteIntelligence,status:'stale',warnings:['Vị trí, ranh hoặc nguồn khu đất đã thay đổi. Cần tra lại nhà cung cấp và dữ liệu vùng.']};}
  e.context={locationKey,boundaryKey,geometryKey,contextKey};
};
// Price amounts do not change a design; a changed SKU, specification or unit does.
BMH.selectedMaterialIdentity=category=>{
 const p=BMH.state.project,id=p.materials.choices[category],q=p.dataEngine?.materialOverrides?.[id],x=q?.product;
 return {productId:id||'',sku:x?.sku??q?.sku??null,specification:x?.specification??x?.spec??q?.specification??null,quantityUnit:x?.priceEvidence?.quantityUnit??x?.unit??q?.unit??null};
};
BMH.materialSelectionIdentity=()=>Object.keys(BMH.state.project.materials.choices).sort().map(category=>({category,...BMH.selectedMaterialIdentity(category)}));
BMH.normalizeMaterialMetadata=project=>{
 const plain=v=>v&&typeof v==='object'&&!Array.isArray(v),m=project.materials;
 if(!plain(m.finish))m.finish={exterior:null,rooms:{}};
 if(!plain(m.finish.rooms))m.finish.rooms={};
 m.finish.rooms=Object.fromEntries(Object.entries(m.finish.rooms).filter(([,v])=>plain(v)).map(([k,v])=>[k,BMH.evidenceValue(v)]));
 m.finish.exterior=plain(m.finish.exterior)?BMH.evidenceValue(m.finish.exterior):null;
 const sanitize=e=>{
  const out=BMH.evidenceValue(e);out.amountVnd=typeof out.amountVnd==='number'&&Number.isFinite(out.amountVnd)&&out.amountVnd>=0?out.amountVnd:null;
  out.sourceUrl=BMH.evidenceUrl(out.sourceUrl);
  for(const k of ['quotedAt','retrievedAt','validUntil'])out[k]=typeof out[k]==='string'&&out[k]?out[k]:null;
  for(const k of ['includesVat','includesLabour','includesTransport'])out[k]=typeof out[k]==='boolean'?out[k]:null;
  return out;
 };
 for(const q of Object.values(project.dataEngine.materialOverrides)){
  if(!plain(q))continue;
  if(plain(q.priceEvidence))q.priceEvidence=sanitize(q.priceEvidence);
  if(plain(q.product?.priceEvidence))q.product.priceEvidence=sanitize(q.product.priceEvidence);
 }
};
BMH.normalizeState = () => {
  const base=BMH.defaultState();
  if(!BMH.state||typeof BMH.state!=='object')BMH.state=base;
  if(!BMH.state.meta||typeof BMH.state.meta!=='object'||Array.isArray(BMH.state.meta))BMH.state.meta=structuredClone(base.meta);
  BMH.state.meta.localProjectId=/^[a-zA-Z0-9_-]{1,120}$/.test(BMH.state.meta.localProjectId||'')?String(BMH.state.meta.localProjectId):'';
  for(const key of ['cloudProjectId','cloudOwnerId'])BMH.state.meta[key]=/^[0-9a-f-]{36}$/i.test(BMH.state.meta[key]||'')?String(BMH.state.meta[key]):'';
  BMH.state.meta.cloudRevision=Number.isSafeInteger(BMH.state.meta.cloudRevision)&&BMH.state.meta.cloudRevision>0?BMH.state.meta.cloudRevision:null;
  for(const key of ['createdAt','savedAt','cloudUpdatedAt']){const value=BMH.state.meta[key];BMH.state.meta[key]=typeof value==='string'&&Number.isFinite(Date.parse(value))?new Date(value).toISOString():null;}
  if(!BMH.state.ui||typeof BMH.state.ui!=='object')BMH.state.ui=structuredClone(base.ui);
  if(!BMH.state.ui.planner||typeof BMH.state.ui.planner!=='object')BMH.state.ui.planner=structuredClone(base.ui.planner);
  if(!BMH.state.ui.location||typeof BMH.state.ui.location!=='object')BMH.state.ui.location=structuredClone(base.ui.location);
  if(typeof BMH.state.ui.onboardingComplete!=='boolean')BMH.state.ui.onboardingComplete=false;
  BMH.state.ui.onboardingStep=BMH.clamp(Number(BMH.state.ui.onboardingStep)||1,1,3);
  if(!BMH.state.project||typeof BMH.state.project!=='object')BMH.state.project=structuredClone(base.project);
  if(typeof BMH.state.project.briefIdea!=='string')BMH.state.project.briefIdea='';
  if(!BMH.state.project.brief||typeof BMH.state.project.brief!=='object')BMH.state.project.brief=structuredClone(base.project.brief);
  else {const b=BMH.state.project.brief,d=base.project.brief;for(const [k,v] of Object.entries(d))if(!(k in b))b[k]=structuredClone(v);if(!b.result||typeof b.result!=='object'||Array.isArray(b.result))b.result={};if(!b.aiSuggestions||typeof b.aiSuggestions!=='object'||Array.isArray(b.aiSuggestions))b.aiSuggestions={};if(!b.userRequirements||typeof b.userRequirements!=='object'||Array.isArray(b.userRequirements))b.userRequirements={};b.provider=String(b.provider||'').slice(0,40);b.model=String(b.model||'').slice(0,120);b.notice=String(b.notice||'').slice(0,500);b.updatedAt=String(b.updatedAt||'').slice(0,40);}
  if(!BMH.state.project.inputEvidence||typeof BMH.state.project.inputEvidence!=='object'||Array.isArray(BMH.state.project.inputEvidence))BMH.state.project.inputEvidence=structuredClone(base.project.inputEvidence);
  const inputEvidence=BMH.state.project.inputEvidence;inputEvidence.schemaVersion=1;
  if(!inputEvidence.records||typeof inputEvidence.records!=='object'||Array.isArray(inputEvidence.records))inputEvidence.records={};
  inputEvidence.records=Object.fromEntries(Object.entries(inputEvidence.records).filter(([field,r])=>r&&typeof r==='object'&&!Array.isArray(r)&&BMH.INPUT_FIELDS.some(k=>field===k||field.startsWith(k+'.'))).map(([field,r])=>[field,{value:BMH.evidenceValue(r.value),sourceType:['customer-entered','surveyed','map-estimate','official-document'].includes(r.sourceType)?r.sourceType:'customer-entered',sourceReference:String(r.sourceReference||'').slice(0,200),sourceUrl:BMH.evidenceUrl(r.sourceUrl),recordedAt:String(r.recordedAt||'').slice(0,40),effectiveAt:String(r.effectiveAt||'').slice(0,40),status:r.status==='awaiting-review'?'awaiting-review':'provided',confirmed:r.confirmed===true&&r.sourceType==='customer-entered'}]));
  inputEvidence.origin=BMH.localStateLoaded&&inputEvidence.origin==='not-recorded'?'legacy-unconfirmed':inputEvidence.origin;
  if(!Array.isArray(BMH.state.project.sourceRefs))BMH.state.project.sourceRefs=[];
  BMH.state.project.sourceRefs=BMH.state.project.sourceRefs.filter(x=>x&&typeof x==='object').slice(0,6).map(x=>({id:String(x.id||BMH.uid('src')),kind:['image','video','pdf','file'].includes(x.kind)?x.kind:'file',name:String(x.name||'Tài liệu').slice(0,180),type:String(x.type||'').slice(0,120),size:Math.max(0,Number(x.size)||0),status:String(x.status||'Đã lưu tham chiếu').slice(0,120)}));
  if(!BMH.state.project.sourceRefs.some(x=>x.kind==='image'&&x.id===BMH.state.project.styleReferenceId))BMH.state.project.styleReferenceId='';
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
  if(!Array.isArray(BMH.state.project.plan.fixtures))BMH.state.project.plan.fixtures=[];
  // Invalid imports stay recoverable; planFurnitureIssues exposes their errors.
  if(!('furniture' in BMH.state.project.plan))BMH.state.project.plan.furniture=[];
  if(!Array.isArray(BMH.state.project.plan.lockedRoomIds))BMH.state.project.plan.lockedRoomIds=[];
  BMH.state.project.plan.lockedRoomIds=BMH.state.project.plan.lockedRoomIds.filter(id=>BMH.state.project.plan.rooms.some(r=>r.id===id));
  if(!Array.isArray(BMH.state.project.plan.lockedFloors))BMH.state.project.plan.lockedFloors=[];
  BMH.state.project.plan.lockedFloors=BMH.state.project.plan.lockedFloors.filter(f=>Number.isInteger(f)&&f>=0&&f<Number(BMH.state.project.site?.floors));
  if(!Array.isArray(BMH.state.project.planVariants))BMH.state.project.planVariants=[];
  if(!Array.isArray(BMH.state.project.planVersions))BMH.state.project.planVersions=[];
  BMH.state.project.planVariants=BMH.state.project.planVariants.slice(0,3);
  BMH.state.project.planVersions=BMH.state.project.planVersions.slice(0,6);
  if(!BMH.state.project.materials||typeof BMH.state.project.materials!=='object'||Array.isArray(BMH.state.project.materials))BMH.state.project.materials=structuredClone(base.project.materials);
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
  if(!['dimensions','drawn','geojson-user','survey-local'].includes(s.lotSource))s.lotSource=s.lotMode==='custom'?'drawn':'dimensions';
  s.boundaryEvidenceId=String(s.boundaryEvidenceId||'');
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
  if(!['plan','elevation','section','openings','stairs','roof','architecture','interior','back','left','right','section-b'].includes(ui.view))ui.view='plan';
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
  if(!['auto','cut','full'].includes(BMH.state.ui.modelWalls))BMH.state.ui.modelWalls='auto';
  BMH.normalizeMaterialMetadata(BMH.state.project);BMH.normalizeDesignEvidence(BMH.state.project);BMH.syncSiteEvidence();
};
BMH.normalizeState();
BMH.syncHouseholdSize=()=>{
  const h=BMH.state.project.household;
  const actual=1+(h.partnerEnabled!==false?1:0)+(h.children?.length||0)+(h.relatives?.length||0);
  const requested=Math.max(0,Number(h.requestedSize)||0);
  h.requestedSize=Math.max(actual,requested);
  return h.requestedSize;
};
BMH.save = () => { BMH.syncSiteEvidence();BMH.syncConstructionReviews();BMH.state.version=BMH.VERSION; BMH.state.meta.savedAt=new Date().toISOString(); try{localStorage.setItem(BMH.STORAGE_KEY,JSON.stringify(BMH.state));BMH.localSaveFailed=false;}catch(e){if(!BMH.localSaveFailed)BMH.toast(BMH.projects?.db?'Lưu nhanh bị giới hạn. Đang lưu vào kho dự án trên thiết bị.':'Trình duyệt hạn chế lưu nhanh. Mở Dự án để tải bản sao.');BMH.localSaveFailed=true;} };
BMH.get = path => path.split('.').reduce((o,k)=>o?.[k],BMH.state);
BMH.set = (path,value,{render=true}={}) => { const keys=path.split('.'); let o=BMH.state; for(let i=0;i<keys.length-1;i++){if(!o[keys[i]]||typeof o[keys[i]]!=='object')o[keys[i]]={};o=o[keys[i]];} o[keys.at(-1)]=value; if(path.startsWith('project.'))BMH.recordProjectInput(path,{sourceType:'customer-entered'},{save:false}); BMH.save(); if(render) BMH.render(); };
BMH.isUnlocked = () => BMH.DEFER_PAYMENT===true || (BMH.state.access.paid===true && (BMH.state.access.source==='server-verified' || (BMH.DEV && String(BMH.state.access.source||'').startsWith('dev'))));
