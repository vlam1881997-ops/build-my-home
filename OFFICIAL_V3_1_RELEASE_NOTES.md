# Build My Home Official V3.1

## Trọng tâm nâng cấp

- Sửa đồng bộ tỉnh/quận/tọa độ ở Bước 3; đổi lớp bản đồ sang CDN ổn định hơn và có fallback.
- Sửa lỗi chữ khổng lồ đè mặt bằng ở Bước 5; mở rộng workspace, thêm tool rail, toggle nội thất/kích thước, làm rõ cửa/cửa sổ và bản vẽ.
- Viết lại mô hình isometric ở Bước 7 để tự căn giữa/phóng theo floor hoặc room đang chọn; vật liệu Bước 6 phản ánh vào mô hình.
- Tăng mức biến đổi thị giác Năm 3/5/10.
- Dọn hero trùng chữ bằng crop hình nền và chỉ giữ một lớp quote.
- Giữ một runtime app.js/styles.css sau build, không tạo file patch mới.

## Lưu ý

Mặt bằng là kiến trúc sơ bộ, không thay hồ sơ thi công. Thanh toán production vẫn cần webhook/entitlement phía server.
