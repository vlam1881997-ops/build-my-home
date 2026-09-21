# Build My Home Official V3.4

V3.4 tiếp tục nâng hai vùng lõi của sản phẩm mà không tạo file patch runtime mới: **Bước 5 – phối hợp mặt bằng nhiều tầng** và **Bước 7 – đánh giá vi khí hậu/3D liên kết dữ liệu**.

## Bước 5 – Phối hợp kiến trúc nhiều tầng

- Thêm lớp **Tầng dưới (ghost overlay)** để khi làm tầng 2+ có thể đối chiếu vị trí cầu thang, khu ướt và hình khối tầng dưới.
- Thêm **cột gợi ý sơ bộ** tại các nút góc/tường quan trọng. Đây chỉ là lớp phối hợp phương án, không phải thiết kế kết cấu.
- Thêm kiểm tra **cầu thang lệch tầng** và **WC/khu ướt lệch trục đứng**.
- Có nút **Căn cầu thang theo tầng dưới** và **Căn WC theo tầng dưới** khi hình học cho phép.
- Bổ sung lớp **Vi khí hậu** ngay trên mặt bằng: mỗi phòng hiển thị điểm Ánh sáng và Thông gió.
- Inspector của phòng có hai thanh đánh giá: **Ánh sáng tự nhiên** và **Thông gió tự nhiên**.
- Validator bổ sung cảnh báo không gian thiếu ánh sáng/ô mở và phối hợp tầng chưa tốt.
- Phím tắt mới ở Bước 5: `D` đặt cửa, `W` đặt cửa sổ, `F` Fit, `Esc` thoát công cụ, `Ctrl+Z`/`Ctrl+Shift+Z` undo/redo.

## Bước 7 – 3D & đánh giá dữ liệu

- Điểm Khí hậu trong đánh giá tổng thể giờ tính thêm **điểm ánh sáng và thông gió** từ chính mặt bằng Bước 5.
- Thêm khối tóm tắt **Ánh sáng / Thông gió / Phối hợp tầng** ngay dưới viewport.
- 3D Cutaway hiển thị thêm **cột gợi ý** và **kim Bắc** để đọc không gian rõ hơn.
- Vẫn giữ nguyên nguyên tắc: geometry lấy từ Bước 5, vật liệu lấy từ Bước 6.

## Kiến trúc runtime

- Một state controller.
- Một navigation controller.
- Một planner pointer controller.
- Production build vẫn chỉ có `app.js` và `styles.css`.
- Không có `v34.js`, `v34.css`, `patch.js` hoặc hậu kỳ DOM.

## Ranh giới chuyên môn

Cột gợi ý, điểm ánh sáng/thông gió và phối hợp khu ướt là **hỗ trợ phương án sơ bộ**, không thay thế tính toán kết cấu, MEP, chiếu sáng, thông gió hoặc hồ sơ thi công được người có chuyên môn kiểm tra.
