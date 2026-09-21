# Source & Data Notes — v1.7.1

Ngày đối chiếu: 21/09/2026. Dữ liệu ngân hàng/vật liệu trong UI chỉ nhằm hỗ trợ dự tính và phải kiểm tra lại điều kiện thực tế trước khi người dùng ra quyết định.

## Ngân hàng
- Vietcombank — “Nhà Mới An Cư” (19/08/2026): giảm đến 1%/năm so với lãi vay BĐS thông thường; thời hạn tới 35 năm. UI không tự suy ra một lãi suất tuyệt đối khi nguồn không công bố.
- BIDV — “Ngôi nhà đầu tiên” (01/06/2026): từ 9,5%/năm 12 tháng; từ 10%/năm 18 tháng; từ 10,5%/năm 24 tháng với điều kiện thời gian vay tương ứng.
- Agribank — chương trình người dưới 35 tuổi mua nhà ở xã hội (01/07–31/12/2026): 6,5%/năm 5 năm đầu, 7,5%/năm 10 năm tiếp theo; chỉ áp dụng đúng đối tượng chương trình.
- Techcombank — trang vay mua BĐS có giấy chứng nhận: công bố “từ 3,99%” và kỳ cố định lên tới 24 tháng; điều kiện hồ sơ/chương trình thực tế có thể khác.
- ACB — trang vay mua nhà đất: lãi theo dư nợ thực tế, phương án trả vốn linh hoạt; UI không gán mức lãi duy nhất nếu trang sản phẩm không công bố một con số áp dụng chung.
- VietinBank/MB — UI để trạng thái cần xác minh/báo giá thực tế nếu chưa có một mức công khai đủ căn cứ.

## Vật liệu
- Jotun Jotashield Infinity: thông tin kỹ thuật trên trang Jotun Việt Nam, độ phủ 11,1 m²/L, 2 lớp; giá để theo đại lý khi không có giá công khai đáng tin.
- Dulux Ambiance 5in1 Superflexx: card ghi giá đề nghị/bao bì khi nguồn công khai tương ứng; cần kiểm tra lại SKU, màu, dung tích và đại lý tại thời điểm mua.
- Gạch/nhôm: ảnh và mức trong mockup dùng để định hình UX; card phải ghi rõ cần báo giá đại lý/SKU nếu chưa có nguồn bán hiện hành.

## Ảnh phối cảnh
- Một số ảnh phòng trong Bước 7 được tải từ Unsplash theo URL ảnh công khai để làm tham chiếu trực quan; có local fallback nếu mạng/hotlink không tải được.
- Các crop từ bộ mockup do người dùng cung cấp được dùng làm asset tham chiếu nội bộ cho bản demo.

## Thanh toán
QR ở Bước 8 là QR **demo** chứa chuỗi không có tài khoản nhận tiền. Không được thay thành QR nhận tiền thật cho tới khi có đủ: tài khoản nhận được chủ sở hữu xác nhận, order ID server-side, chữ ký/xác thực callback và webhook idempotent.
