export const steps = [
  {id:1,key:'start',title:'Khởi tạo',access:'free'},
  {id:2,key:'finance',title:'Tài chính & khoản vay',access:'free'},
  {id:3,key:'location',title:'Vị trí & khí hậu',access:'free'},
  {id:4,key:'site',title:'Đất & nhu cầu gia đình',access:'free'},
  {id:5,key:'design',title:'Thiết kế từng tầng/phòng',access:'free'},
  {id:6,key:'materials',title:'Vật liệu',access:'free'},
  {id:7,key:'simulation',title:'Mô phỏng & đánh giá',access:'free'},
  {id:8,key:'estimate',title:'Dự toán & gói hồ sơ',access:'free'},
  {id:9,key:'construction',title:'Theo dõi thi công',access:'project_package'},
  {id:10,key:'handover',title:'Hồ sơ & giải ngân',access:'project_package'}
];
// Tất cả là trạng thái triển khai rõ ràng, không dùng nút demo giả kết quả AI/thanh toán.
export const capabilities = {
  financeCore:'implemented', estimateCore:'implemented', rectangleGeometry:'implemented',
  lifecycleScenarios:'implemented', templateFilter:'implemented',
  webUI:'implemented_static', database:'draft_schema', authentication:'not_integrated',
  payment:'not_integrated', aiReview:'server_adapter_requires_configuration', drawingOCR:'not_integrated',
  geometry3D:'concept_mesh', regionalPrices:'manual_source_records',
  pdfExcelExports:'csv_html_svg_obj_zip', marketplace:'deferred', nativeMobile:'deferred'
};
const downstream = {
  finance:['recommendations','financeReport','review','estimateReport','cashflow','exports'],
  location:['prices','recommendations','estimate','lifecycle','review','cashflow','exports'],
  site:['recommendations','designValidation','quantities','estimate','lifecycle','review','cashflow','exports'],
  design:['quantities','estimate','scene3D','lifecycle','review','cashflow','exports'],
  materials:['estimate','scene3D','lifecycle','review','cashflow','exports']
};
export function invalidate(project, changedSection, expectedRevision) {
  if (project.revision!==expectedRevision) throw new Error('REVISION_CONFLICT');
  if (!downstream[changedSection]) throw new Error('UNKNOWN_SECTION');
  return {...project,revision:project.revision+1,stale:[...new Set([...(project.stale??[]),...downstream[changedSection]])]};
}
// Hàm thuần phục vụ rule/test. Backend phải load entitlement thật từ DB trước khi gọi.
export function canAccessStep({stepId,projectId,userId,entitlements,paywallEnabled=true}) {
  const step=steps.find(s=>s.id===stepId);
  if(!step) return false;
  if(step.access==='free') return true;
  if(!paywallEnabled) return true;
  return entitlements.some(e=>e.projectId===projectId && e.userId===userId && e.key==='project_package' && e.status==='active');
}
