# Build My Home Official V3.2

## Trọng tâm bản nâng cấp
V3.2 không mở rộng thêm nhiều module mới. Bản này tập trung nâng cấp hai phần còn yếu nhất của V3.1: **Bước 5 - mặt bằng kiến trúc** và **Bước 7 - mô hình 3D phương án**.

### Bước 5 - Architectural Drafting Upgrade
- Render tường theo lớp riêng thay vì dùng viền của từng hình chữ nhật phòng.
- Tách tường bao và tường ngăn với độ đậm khác nhau.
- Dimension chain tổng thể và theo các nhịp hình học trên mặt bằng.
- Trục kiến trúc, ký hiệu Bắc, thước tỷ lệ, mã bản vẽ.
- Cửa/cửa sổ có mã D1/W1... và có thể chỉnh hướng + chiều rộng trong inspector.
- Nội thất ký hiệu gọn hơn; tên phòng hiển thị kiểu bản vẽ thay vì card nổi.
- Workspace lớn hơn; toolbar và inspector gọn hơn; danh sách lỗi mặt bằng hiển thị nhiều cảnh báo cùng lúc.
- Bổ sung cảnh báo phòng ngủ thiếu cửa sổ/ô thoáng.

### Bước 7 - Cutaway 3D Upgrade
- Mô hình SVG isometric được chuyển sang kiểu cutaway để nhìn rõ công năng bên trong.
- Sàn, tường, đồ nội thất và ô mở lấy từ dữ liệu Bước 5.
- Màu vật liệu lấy từ lựa chọn Bước 6.
- Cửa đi/cửa sổ được thể hiện trên các mặt tường nhìn thấy.
- Tự fit mô hình theo toàn nhà / tầng / phòng đang chọn.

### Kiến trúc runtime
- Giữ nguyên nguyên tắc 1 bundle JS + 1 bundle CSS.
- Không bổ sung file patch runtime mới.
- Paywall và navigation controller giữ nguyên một nguồn trạng thái.
