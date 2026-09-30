import {publicPage,pageMetadata} from './_public_web.mjs';
const rows=[
 ['floor','Đồng Tâm','6060TAMDAO006','Gạch granite Tam Đảo','60 × 60 cm · vân đá xám','m²','https://dongtam.com.vn/san-pham/bst-6060tamdao/6060tamdao006/'],
 ['floor','Đồng Tâm','6060DONGVAN001','Gạch Đồng Văn','60 × 60 cm · porcelain trắng','m²','https://dongtam.com.vn/san-pham/bst-dong-van/6060dongvan001/'],
 ['floor','Đồng Tâm','6060PHARAON001','Gạch Pharaon','60 × 60 cm · porcelain','m²','https://dongtam.com.vn/san-pham/bst-pharaon/6060pharaon001/'],
 ['floor','Đồng Tâm','6060MOMENT010','Gạch Moment','60 × 60 cm','m²','https://dongtam.com.vn/san-pham/bst-moment/6060moment010/'],
 ['sanitary','INAX','AC-959VAN','Bồn cầu một khối','380 × 760 × 636 mm','bộ','https://www.inax.com.vn/products/toilet/ac-959van/'],
 ['sanitary','INAX','AL-2216V','Chậu rửa âm bàn','Kiểm tra kích thước lắp đặt tại trang sản phẩm','bộ','https://www.inax.com.vn/vi/products/basin/chau-rua-am-ban-al-2216v/'],
 ['sanitary','INAX','L-2216V','Chậu rửa âm bàn','Chậu sứ âm bàn','bộ','https://www.inax.com.vn/products/basin/l-2216v/'],
 ['sanitary','INAX','BF-1858V','Bồn tắm','Bồn tắm acrylic','bộ','https://www.inax.com.vn/products/bathtub/bf-1858v/'],
 ['sanitary','INAX','BF-1760V','Bồn tắm','Kiểm tra bản vẽ lắp đặt tại trang nguồn','bộ','https://www.inax.com.vn/products/bathtub/bf-1760v/'],
 ['lighting','Rạng Đông','A60','LED bulb cảm biến 9W','9 W · cảm biến chuyển động','bóng','https://rangdong.com.vn/den-led-bulb-cam-bien-9w-pr2109.html'],
 ['lighting','Rạng Đông','A60N1','LED bulb tròn 9W 12VDC','9 W · 12 VDC','bóng','https://rangdong.com.vn/bong-den-led-bulb-tron-9-w-12-vdc-pr2099.html']
];
const cache=new Map();
export async function officialMaterials(category='floor'){
 const key=String(category),old=cache.get(key);if(old&&Date.now()-old.at<6*3600000)return old.data;
 const products=await Promise.all(rows.filter(x=>x[0]===key).map(async([category,brand,sku,name,spec,unit,productUrl])=>{
  const base={id:'official-'+sku.toLowerCase(),category,brand,sku,name,spec,unit,productUrl,supplier:brand,address:'',phone:'',price:0,priceDate:'',imageUrl:'',verifiedAt:'',photoEvidence:'missing'};
  try{const p=await publicPage(productUrl),m=pageMetadata(p.html,p.url,sku);if(!m.text.toLowerCase().includes(sku.toLowerCase()))return null;return {...base,productUrl:p.url,imageUrl:m.imageUrl,price:m.price,phone:brand==='INAX'&&m.text.replace(/\D/g,'').includes('18006633')?'1800 6633':'',verifiedAt:new Date().toISOString(),photoEvidence:m.imageUrl?'source-page':'missing'};}catch{return {...base,sourceStatus:'unavailable'};}
 }));
 const data={products:products.filter(Boolean),summary:'Danh mục chính hãng theo mã hàng. Giá chưa công bố hoặc trang chưa truy cập được sẽ hiển thị Liên hệ báo giá; tìm trên web để mở rộng hãng và đại lý.'};cache.set(key,{at:Date.now(),data});return data;
}
