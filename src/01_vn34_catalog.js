/* Build My Home V5.2 — Vietnam 34-province catalogue.
 * Loaded before state normalization so every current province/city survives reload.
 * Province-level list follows the post-2025 34-unit system. Commune/ward remains free-form
 * and address geocoding supplies the precise point.
 */
BMH.VN_REGION_ORDER=[
  'Hà Nội','Cao Bằng','Tuyên Quang','Điện Biên','Lai Châu','Sơn La','Lào Cai','Thái Nguyên','Lạng Sơn','Quảng Ninh','Bắc Ninh','Phú Thọ','Hải Phòng','Hưng Yên','Ninh Bình','Thanh Hóa','Nghệ An','Hà Tĩnh','Quảng Trị','Huế','Đà Nẵng','Quảng Ngãi','Gia Lai','Khánh Hòa','Đắk Lắk','Lâm Đồng','Đồng Nai','TP. Hồ Chí Minh','Tây Ninh','Đồng Tháp','Vĩnh Long','An Giang','Cần Thơ','Cà Mau'
];

BMH.VN_ZONE_PROFILES={
  northMountain:{climate:'Miền núi phía Bắc · mùa đông mát/lạnh, mùa hè ẩm',temp:'20–25°C',humidity:'75–88%',rainfall:'1.500–2.400 mm/năm',wet:'Tháng 5–10',dry:'Tháng 11–4',wind:'Đông Bắc mùa đông · Nam/Đông Nam mùa hè',sun:'Bức xạ biến đổi theo địa hình',flood:'Trung bình',storm:'Trung bình',heat:'Trung bình',corrosion:'Thấp',labor:'350.000 – 600.000 đ/ngày',bestMonths:[2,3,4,10,11],watchMonths:[1,5,9,12],riskMonths:[6,7,8],designTips:['Đối chiếu địa hình, taluy và thoát nước trước khi chốt cao độ nền.','Tổ chức lớp bao che cân bằng nắng mùa đông và che nóng mùa hè.','Vùng dốc cần kỹ sư kiểm tra ổn định nền/mái dốc.']},
  northDelta:{climate:'Đồng bằng Bắc Bộ · cận nhiệt đới ẩm bốn mùa',temp:'23–26°C',humidity:'75–88%',rainfall:'1.500–2.000 mm/năm',wet:'Tháng 5–10',dry:'Tháng 11–4',wind:'Đông Nam mùa hè · Đông Bắc mùa đông',sun:'Nắng nóng mạnh tháng 5–8',flood:'Trung bình',storm:'Trung bình',heat:'Cao mùa hè',corrosion:'Thấp',labor:'400.000 – 650.000 đ/ngày',bestMonths:[2,3,4,10,11,12],watchMonths:[1,5,9],riskMonths:[6,7,8],designTips:['Che nắng Tây, tăng thông gió mùa hè và kiểm soát gió lạnh mùa đông.','Chống ẩm/nồm cho kho, WC và lớp hoàn thiện.','Kiểm tra thoát nước mưa lớn, cao độ nền và chống thấm.']},
  northCoast:{climate:'Ven biển Bắc Bộ · nóng ẩm, mưa bão',temp:'23–27°C',humidity:'78–88%',rainfall:'1.700–2.400 mm/năm',wet:'Tháng 5–10',dry:'Tháng 11–4',wind:'Gió mùa Đông Bắc · gió biển mùa hè',sun:'Nắng mạnh mùa hè',flood:'Trung bình - Cao',storm:'Cao',heat:'Cao mùa hè',corrosion:'Trung bình - Cao ven biển',labor:'400.000 – 650.000 đ/ngày',bestMonths:[2,3,4,11,12],watchMonths:[1,5,10],riskMonths:[6,7,8,9],designTips:['Kiểm tra tải gió, liên kết mái và cửa ngoài nhà.','Ưu tiên vật liệu/phụ kiện chống ăn mòn tại khu vực gần biển.','Bố trí thoát nước nhanh và chống thấm cho mưa lớn.']},
  northCentral:{climate:'Bắc Trung Bộ · nóng ẩm, có gió khô nóng và mưa bão',temp:'24–28°C',humidity:'75–86%',rainfall:'1.700–2.800 mm/năm',wet:'Tháng 8–11',dry:'Tháng 12–7',wind:'Đông Bắc mùa mưa · Tây Nam/gió phơn mùa nóng',sun:'Nắng nóng mạnh mùa khô',flood:'Trung bình - Cao',storm:'Cao',heat:'Cao',corrosion:'Trung bình ven biển',labor:'350.000 – 550.000 đ/ngày',bestMonths:[2,3,4,5,12],watchMonths:[1,6,7],riskMonths:[8,9,10,11],designTips:['Tăng che nắng và chống nóng mái cho mùa gió khô nóng.','Mái, cửa và thoát nước cần xét mưa bão lớn.','Khu vực thấp cần kiểm tra lịch sử ngập và cao độ nền.']},
  centralCoast:{climate:'Duyên hải miền Trung · nắng mạnh, mưa bão tập trung cuối năm',temp:'25–29°C',humidity:'76–86%',rainfall:'1.800–3.000 mm/năm',wet:'Tháng 9–12',dry:'Tháng 1–8',wind:'Gió biển · Đông Bắc mùa mưa bão',sun:'Bức xạ cao mùa khô',flood:'Trung bình - Cao',storm:'Cao',heat:'Cao',corrosion:'Cao ven biển',labor:'350.000 – 550.000 đ/ngày',bestMonths:[2,3,4,5,6,7],watchMonths:[1,8,12],riskMonths:[9,10,11],designTips:['Gia cường liên kết mái/cửa theo thiết kế kỹ sư.','Dùng phụ kiện chống ăn mòn và chi tiết kín nước tốt.','Che nắng sâu kết hợp thông gió chéo.']},
  highlands:{climate:'Cao nguyên · mùa mưa và mùa khô rõ rệt, biên độ nhiệt ngày đêm lớn',temp:'20–26°C',humidity:'70–84%',rainfall:'1.700–2.500 mm/năm',wet:'Tháng 5–10',dry:'Tháng 11–4',wind:'Gió mùa theo địa hình',sun:'Bức xạ khá cao mùa khô',flood:'Thấp - Trung bình',storm:'Thấp - Trung bình',heat:'Trung bình',corrosion:'Thấp',labor:'330.000 – 520.000 đ/ngày',bestMonths:[11,12,1,2,3,4],watchMonths:[5,10],riskMonths:[6,7,8,9],designTips:['Ưu tiên chống nóng mái nhưng vẫn giữ ấm về đêm ở cao độ lớn.','Kiểm tra thoát nước sườn dốc và xói lở.','Tận dụng thông gió tự nhiên và ánh sáng khuếch tán.']},
  southeast:{climate:'Nam Bộ · nhiệt đới gió mùa nóng ẩm',temp:'26–29°C',humidity:'72–85%',rainfall:'1.700–2.400 mm/năm',wet:'Tháng 5–11',dry:'Tháng 12–4',wind:'Tây Nam mùa mưa · Đông Bắc mùa khô',sun:'Bức xạ cao quanh năm',flood:'Trung bình',storm:'Thấp - Trung bình',heat:'Cao',corrosion:'Thấp',labor:'380.000 – 620.000 đ/ngày',bestMonths:[12,1,2,3,4],watchMonths:[5,11],riskMonths:[6,7,8,9,10],designTips:['Che nắng Tây/Tây Nam và tạo thông gió chéo.','Mái chống nóng, khoảng đệm và cây xanh giúp giảm tải điều hòa.','Khu đất thấp cần cao độ nền và thoát nước tốt.']},
  mekong:{climate:'Đồng bằng sông Cửu Long · nóng ẩm, mùa mưa dài',temp:'26–29°C',humidity:'78–88%',rainfall:'1.500–2.200 mm/năm',wet:'Tháng 5–11',dry:'Tháng 12–4',wind:'Tây Nam mùa mưa',sun:'Nắng mạnh mùa khô',flood:'Cao',storm:'Thấp - Trung bình',heat:'Cao',corrosion:'Trung bình',labor:'330.000 – 520.000 đ/ngày',bestMonths:[12,1,2,3],watchMonths:[4,5,11],riskMonths:[6,7,8,9,10],designTips:['Khảo sát nền đất và cao độ chống ngập trước khi chọn móng.','Ưu tiên vật liệu chịu ẩm, thoát nước mặt và chống thấm chân tường.','Tận dụng thông gió chéo, mái chống nóng và hiên che mưa.']}
};

BMH.VN34_CENTERS={
  'Hà Nội':[21.0285,105.8542,'northDelta'],'Cao Bằng':[22.6666,106.2639,'northMountain'],'Tuyên Quang':[21.8236,105.2142,'northMountain'],'Điện Biên':[21.3860,103.0230,'northMountain'],'Lai Châu':[22.3862,103.4703,'northMountain'],'Sơn La':[21.3256,103.9188,'northMountain'],'Lào Cai':[22.4809,103.9755,'northMountain'],'Thái Nguyên':[21.5942,105.8482,'northMountain'],'Lạng Sơn':[21.8537,106.7610,'northMountain'],'Quảng Ninh':[20.9517,107.0806,'northCoast'],'Bắc Ninh':[21.1861,106.0763,'northDelta'],'Phú Thọ':[21.3227,105.4017,'northDelta'],'Hải Phòng':[20.8449,106.6881,'northCoast'],'Hưng Yên':[20.6464,106.0511,'northDelta'],'Ninh Bình':[20.2506,105.9745,'northDelta'],'Thanh Hóa':[19.8067,105.7852,'northCentral'],'Nghệ An':[18.6796,105.6813,'northCentral'],'Hà Tĩnh':[18.3428,105.9057,'northCentral'],'Quảng Trị':[16.8163,107.1003,'northCentral'],'Huế':[16.4637,107.5909,'centralCoast'],'Đà Nẵng':[16.0544,108.2022,'centralCoast'],'Quảng Ngãi':[15.1205,108.7923,'centralCoast'],'Gia Lai':[13.9833,108.0000,'highlands'],'Khánh Hòa':[12.2388,109.1967,'centralCoast'],'Đắk Lắk':[12.6667,108.0500,'highlands'],'Lâm Đồng':[11.9404,108.4583,'highlands'],'Đồng Nai':[10.9574,106.8426,'southeast'],'TP. Hồ Chí Minh':[10.7769,106.7009,'southeast'],'Tây Ninh':[11.3130,106.0963,'southeast'],'Đồng Tháp':[10.4550,105.6340,'mekong'],'Vĩnh Long':[10.2537,105.9722,'mekong'],'An Giang':[10.3759,105.4185,'mekong'],'Cần Thơ':[10.0452,105.7469,'mekong'],'Cà Mau':[9.1769,105.1524,'mekong']
};

for(const name of BMH.VN_REGION_ORDER){
  if(BMH.REGIONS[name])continue;
  const [lat,lng,zone]=BMH.VN34_CENTERS[name],z=BMH.VN_ZONE_PROFILES[zone];
  BMH.REGIONS[name]={lat,lng,zoom:10,defaultDistrict:'Trung tâm tỉnh/thành',adminNote:'Đơn vị cấp tỉnh theo hệ 34 tỉnh/thành. Phường/xã và địa chỉ cụ thể được xác định bằng ô tìm địa chỉ hoặc ghim bản đồ.',...structuredClone(z),districts:[['Trung tâm tỉnh/thành',lat,lng,{}]]};
}
BMH.regionOptions=()=>BMH.VN_REGION_ORDER.map(x=>[x,x]);

/* More homeowner-facing bank choices. These are simulation presets, not live quoted rates. */
const bankAdd=[
  {id:'VTB',name:'VietinBank',img:'assets/banks/vtb.jpg',intro:6.8,post:10.6,months:12},
  {id:'VPB',name:'VPBank',img:'',intro:7.2,post:11.4,months:12},
  {id:'TPB',name:'TPBank',img:'',intro:7.1,post:11.2,months:12},
  {id:'HDB',name:'HDBank',img:'',intro:7.3,post:11.1,months:12},
  {id:'VIB',name:'VIB',img:'',intro:7.4,post:11.3,months:12},
  {id:'SHB',name:'SHB',img:'',intro:7.0,post:11.0,months:12},
  {id:'MSB',name:'MSB',img:'',intro:7.4,post:11.5,months:12},
  {id:'OCB',name:'OCB',img:'',intro:7.3,post:11.4,months:12},
  {id:'STB',name:'Sacombank',img:'',intro:7.5,post:11.6,months:12}
].map(x=>({...x,note:'Kịch bản mô phỏng để tính DTI; không phải lãi suất niêm yết hiện hành. Hãy thay bằng báo giá tín dụng thực tế.'}));
for(const b of bankAdd)if(!BMH.BANKS.some(x=>x.id===b.id))BMH.BANKS.push(b);

/* Expanded material library. New categories use generic technical cards until supplier imagery is connected. */
Object.assign(BMH.MATERIALS,{
  cement:[
    {id:'cement-pcb40',name:'Xi măng PCB40 tiêu chuẩn',sub:'Móng · cột · dầm · sàn · xây tô',img:'',premium:0,price:'Cần báo giá theo khu vực'},
    {id:'cement-lowheat',name:'Xi măng / cấp phối giảm nhiệt',sub:'Ưu tiên khối bê tông lớn, cần kỹ sư xác nhận',img:'',premium:12000000,price:'Cần báo giá thực tế'},
    {id:'concrete-ready',name:'Bê tông thương phẩm',sub:'Chọn mác theo hồ sơ kết cấu',img:'',premium:18000000,price:'Theo mác & cự ly trạm'}
  ],
  steel:[
    {id:'steel-cb400',name:'Thép CB400-V',sub:'Cốt thép phổ biến cho nhà ở',img:'',premium:0,price:'Theo kg / báo giá ngày'},
    {id:'steel-certified',name:'Thép có chứng chỉ lô hàng',sub:'Ưu tiên nguồn gốc & kiểm tra cơ lý',img:'',premium:10000000,price:'Theo kg / chứng chỉ'},
    {id:'steel-corrosion',name:'Gói bảo vệ cốt thép vùng ăn mòn',sub:'Lớp bảo vệ bê tông + kiểm soát vật liệu',img:'',premium:22000000,price:'Theo thiết kế kết cấu'}
  ],
  waterproof:[
    {id:'wp-cementitious',name:'Chống thấm gốc xi măng polymer',sub:'WC · ban công · sân thượng',img:'',premium:0,price:'Theo m² / quy trình'},
    {id:'wp-membrane',name:'Màng chống thấm đàn hồi',sub:'Mái · khe tiếp giáp · khu vực mưa nhiều',img:'',premium:18000000,price:'Theo m²'},
    {id:'wp-system',name:'Hệ chống thấm 3 lớp + test nước',sub:'Vật liệu + bo góc + thử kín nước',img:'',premium:32000000,price:'Theo hồ sơ & diện tích'}
  ],
  mep:[
    {id:'mep-standard',name:'MEP tiêu chuẩn nhà ở',sub:'Điện · cấp thoát nước · mạng · điều hòa chờ',img:'',premium:0,price:'Theo BOQ'},
    {id:'mep-safety',name:'Gói điện an toàn nâng cấp',sub:'RCBO/ELCB · tiếp địa · chống sét lan truyền',img:'',premium:26000000,price:'Theo tủ điện & số mạch'},
    {id:'mep-smart',name:'MEP sẵn sàng smart-home',sub:'Ống chờ · mạng · cảm biến · dự phòng tải',img:'',premium:42000000,price:'Theo số điểm'}
  ],
  sanitary:[
    {id:'sanitary-value',name:'Thiết bị vệ sinh bền – dễ thay thế',sub:'Ưu tiên linh kiện phổ biến',img:'',premium:0,price:'Theo bộ WC'},
    {id:'sanitary-comfort',name:'Gói tiện nghi gia đình',sub:'Sen nhiệt độ · lavabo lớn · phụ kiện đồng bộ',img:'',premium:22000000,price:'Theo số WC'},
    {id:'sanitary-access',name:'Gói WC người lớn tuổi',sub:'Tay vịn · chống trượt · cao độ sử dụng thuận tiện',img:'',premium:16000000,price:'Theo WC'}
  ],
  roof:[
    {id:'roof-cool',name:'Mái chống nóng cơ bản',sub:'Cách nhiệt + thông gió mái',img:'',premium:0,price:'Theo m² mái'},
    {id:'roof-pu',name:'Mái / lớp PU cách nhiệt',sub:'Giảm bức xạ và tải điều hòa',img:'',premium:18000000,price:'Theo m²'},
    {id:'roof-green',name:'Mái xanh / sân thượng có lớp bảo vệ',sub:'Cần kiểm tra tải trọng & chống thấm',img:'',premium:48000000,price:'Theo cấu tạo'}
  ],
  insulation:[
    {id:'ins-xps',name:'XPS cách nhiệt',sub:'Mái · tường nóng · sàn mái',img:'',premium:0,price:'Theo chiều dày'},
    {id:'ins-rockwool',name:'Bông khoáng',sub:'Cách nhiệt + hỗ trợ cách âm',img:'',premium:14000000,price:'Theo kg/m³ & chiều dày'},
    {id:'ins-pir',name:'PIR/PUR hiệu suất cao',sub:'Không gian cần giảm chiều dày lớp cách nhiệt',img:'',premium:26000000,price:'Theo m²'}
  ],
  lighting:[
    {id:'light-led',name:'LED hiệu suất cao',sub:'3000K–4000K theo không gian',img:'',premium:0,price:'Theo số điểm'},
    {id:'light-layered',name:'Chiếu sáng nhiều lớp',sub:'Ambient · task · accent',img:'',premium:18000000,price:'Theo thiết kế nội thất'},
    {id:'light-sensor',name:'Điều khiển cảm biến / daylight',sub:'Giảm điện ở hành lang, WC, sân',img:'',premium:24000000,price:'Theo vùng điều khiển'}
  ],
  cabinetry:[
    {id:'cab-mdfmr',name:'MDF chống ẩm hoàn thiện laminate',sub:'Tủ bếp · tủ áo · lưu trữ',img:'',premium:0,price:'Theo md / m²'},
    {id:'cab-plywood',name:'Plywood phủ laminate',sub:'Độ ổn định tốt ở khu vực dùng nhiều',img:'',premium:26000000,price:'Theo module'},
    {id:'cab-premium',name:'Acrylic / veneer nâng cấp',sub:'Ưu tiên thẩm mỹ khu vực chính',img:'',premium:48000000,price:'Theo module'}
  ]
});
BMH.MATERIAL_CATEGORY_META=[
 ['floor','▥','Gạch & sàn'],['cement','▰','Xi măng & bê tông'],['steel','◇','Thép xây dựng'],['waterproof','☂','Chống thấm'],['paint','▧','Sơn hoàn thiện'],['mep','⚙','Điện nước MEP'],['door','▤','Cửa & cửa sổ'],['sanitary','◫','Thiết bị vệ sinh'],['roof','⌂','Mái & chống nóng'],['insulation','≋','Cách nhiệt / cách âm'],['lighting','☀','Chiếu sáng'],['cabinetry','▣','Tủ & nội thất cố định']
];
