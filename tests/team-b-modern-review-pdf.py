"""Append review evidence to the unmodified native BMH A3 PDF.

No SVG conversion or drawing regeneration. Usage: script images_dir native.pdf output.pdf
"""
import json,sys,pathlib,hashlib
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A3,landscape
from reportlab.lib.colors import HexColor
from pypdf import PdfReader,PdfWriter

root,native,output=map(pathlib.Path,sys.argv[1:4])
revision='7BADC039-741638A5-AI4-RH3'
for name,file in [('Regular','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name,'/usr/share/fonts/truetype/dejavu/'+file))
W,H=landscape(A3);green=HexColor('#244a3b');ink=HexColor('#24302b');muted=HexColor('#58675e');amber=HexColor('#915224')
appendix=output.with_suffix('.appendix.pdf');c=canvas.Canvas(str(appendix),pagesize=(W,H))
c.setTitle('BMH Hiện đại V01 — bản rà soát hình ảnh và hồ sơ')
def label(x,y,s,size=11,bold=False,color=ink):
    c.setFont('Bold' if bold else 'Regular',size);c.setFillColor(color);c.drawString(x,y,s)
def para(x,y,text,width,size=11,color=ink):
    words=text.split();line=''
    for word in words:
        candidate=(line+' '+word).strip()
        if pdfmetrics.stringWidth(candidate,'Regular',size)>width and line:
            label(x,y,line,size,color=color);y-=size*1.55;line=word
        else:line=candidate
    if line:label(x,y,line,size,color=color);y-=size*1.55
    return y
def header(title,number):
    c.setFillColor(HexColor('#f6f7f3'));c.rect(0,0,W,H,fill=1,stroke=0)
    label(38,H-43,'BUILD MY HOME  /  HIỆN ĐẠI V01',11,True,green)
    label(38,H-82,title,26,True)
    label(38,H-108,'BẢN RÀ SOÁT — CHƯA PHÊ DUYỆT THI CÔNG',12,True,amber)
    c.setStrokeColor(HexColor('#d3dbd4'));c.line(38,43,W-38,43)
    label(38,25,revision+'  ·  Giả định kiểm chứng, không phải khảo sát thực địa',8,color=muted)
    label(W-170,25,'Rà soát / '+str(number),8,color=muted)
header('Kết quả đối chiếu hình ảnh và hồ sơ',1)
y=H-158
label(38,y,'KẾT LUẬN: CHƯA ĐẠT NGHIỆM THU TRỌN BỘ',18,True,amber);y-=38
sections=[
 ('Đã kiểm tra',[
  'Một phương án duy nhất: đất 5 × 20 m, 2 tầng cao 3,4 m; 11 không gian. Kích thước và chương trình này là kịch bản kiểm chứng, chưa được khảo sát hoặc chủ nhà phê duyệt.',
  'Cầu thang cùng trục giữa hai tầng; mô hình báo 19 cổ bậc, cao bậc 178,947 mm, mặt bậc 275,556 mm. Đây là kiểm tra sơ bộ của mô hình, chưa xác nhận khoảng thông đầu, kết cấu hoặc PCCC.',
  'Nhập dự án và xuất PDF thật trên website giữ cùng mã thiết kế. 28 tờ A3 gốc được giữ nguyên ở phần sau; đã xem ảnh dựng của toàn bộ các trang.',
  'Hai texture bị cắt dữ liệu đã được phục hồi từ nguồn CC0 và triển khai qua PR #64. Tải lại từ tên miền thật cho đúng hash và giải mã đầy đủ; toàn bộ 30 PNG đã kiểm tra raster.'
 ]),
 ('Chưa duyệt — phải giải quyết trước khi bàn giao hoàn chỉnh',[
  'Ngoại thất còn cần chốt bố cục theo concept. Sân thượng 3,58 × 1,89 m đang thiếu quy cách lan can, thoát nước, chống thấm và xác nhận sàn chịu lực; hình hiện tại không được coi là phương án an toàn đã hoàn thiện.',
  'Bề mặt và đồ nội thất là mẫu chung, chưa phải hình học/ảnh đúng mã sản phẩm của hãng. Chưa chốt SKU, quy cách, báo giá và nhà cung cấp cho toàn bộ căn nhà.',
  'Trang bàn giao của mẫu đang báo 12 mục thiết kế chờ, 6 đầu vào thi công chờ và 46 dòng BOQ thiếu. Không coi tổng giá mô phỏng là dự toán xây dựng hoặc hồ sơ vay được xác nhận.',
  'Ranh đất, khoảng lùi 2/1/0 m và gia đình là dữ liệu giả định. Cần khảo sát, quy hoạch và hồ sơ kết cấu/MEP do người có chuyên môn xác nhận.'
 ])]
for title,items in sections:
    label(38,y,title,14,True,green);y-=27
    for n,item in enumerate(items,1):
        label(42,y,str(n)+'.',11,True);y=para(64,y,item,W-116,11)-10
    y-=5
label(38,75,'Phạm vi tiếp tục: hoàn thiện đúng căn này; không mở thêm phong cách hoặc thay thế bằng ảnh AI.',11,True,green)
c.showPage()
views=[('exterior','Ngoại thất / toàn nhà','Giữ cả sân thượng chưa có thông số lan can trong ảnh để không che giấu phần còn thiếu.'),
 ('living','Nội thất / phòng khách','Bề mặt bê tông xám, sơn trắng ấm, gỗ óc chó và linen là các mẫu chung đang gắn trong mô hình.'),
 ('bed','Nội thất / phòng ngủ','Vị trí, kích thước và hướng nội thất lấy từ layout đã lưu. Chưa chốt đồ nội thất đúng mã hãng.'),
 ('kitchen','Nội thất / bếp và ăn','Ảnh từ phòng bếp của cùng mặt bằng. Cần đối chiếu thiết bị, kích thước tủ và cấu tạo MEP trước thi công.'),
 ('bath','Nội thất / phòng vệ sinh','Thiết bị là mô hình chung. Chưa xác nhận SKU, cao độ đấu nối, độ dốc và chi tiết chống thấm.')]
for n,(view,title,note) in enumerate(views,2):
    header(title,n)
    image=root/(view+'.png');c.drawImage(str(image),38,80,width=805,height=H-225,preserveAspectRatio=True,anchor='c',mask='auto')
    x=880;y=H-155;label(x,y,'CÙNG MỘT MÔ HÌNH',12,True,green);y-=32
    y=para(x,y,'Đất 5 × 20 m\n2 tầng · cốt tầng 3,4 m\nPhong cách: Hiện đại',W-x-38,12)-20
    y=para(x,y,note,W-x-38,12)-25
    y=para(x,y,'Ảnh được dựng bằng Blender/Cycles từ hình học xuất trực tiếp từ scene sản phẩm. Không dùng AI để vẽ thêm phòng, cửa hoặc vật liệu ngoài mô hình.',W-x-38,10,muted)-20
    y=para(x,y,'Ánh sáng là phục vụ trình bày. Bộ chuyển dựng ngoại tuyến có xử lý độ ưu tiên bề mặt 0,01 mm cho lớp sơn và giảm tương phản ảnh vữa theo renderer gốc. Không thay đổi hình học lưu trong dự án.',W-x-38,9,muted)
    c.showPage()
c.save()
original=PdfReader(str(native));assert len(original.pages)==28
assert all(revision in (p.extract_text() or '') for p in original.pages)
w=PdfWriter();w.append(str(appendix));w.append(str(native));w.add_metadata({'/Title':'BMH Hiện đại V01 — hình ảnh và hồ sơ đang rà soát','/Subject':'Chưa phê duyệt thi công; '+revision})
with open(output,'wb') as f:w.write(f)
final=PdfReader(str(output));assert len(final.pages)==34
assert all(abs(float(p.mediabox.width)-W)<2 and abs(float(p.mediabox.height)-H)<2 for p in final.pages)
print(json.dumps({'file':str(output),'pages':len(final.pages),'revision':revision,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'status':'not-approved'}))
