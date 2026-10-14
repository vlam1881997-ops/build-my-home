# Build My Home Official V3.3

V3.3 tập trung tiếp tục nâng cấp hai vùng có giá trị sản phẩm cao nhất: **Bước 5 – mặt bằng kiến trúc CAD-lite** và **Bước 7 – đánh giá/3D liên kết dữ liệu dự án**. Không tạo thêm file patch runtime; production vẫn build về một `app.js` và một `styles.css`.

## Bước 5 – CAD-lite interaction

- Thêm **Smart Wall Resize**: chọn phòng và kéo trực tiếp 4 cạnh tường. Khi cạnh đó là tường chung, các phòng kề cạnh được resize đồng bộ thay vì tạo khe hở/chồng phòng.
- Thêm công cụ **Đặt cửa đi / cửa sổ trực tiếp lên tường**: chọn công cụ rồi click đúng vị trí cạnh tường cần đặt.
- Cửa/cửa sổ lưu chính xác `side`, `offset`, `width`; inspector có thanh kéo vị trí dọc tường.
- Chặn ô mở vượt chiều dài tường hoặc đè lên ô mở khác.
- Thêm **Undo / Redo** cho thao tác planner và phím tắt `Ctrl+Z`, `Ctrl+Shift+Z`.
- Thêm zoom `75%–250%`, Fit và hiển thị phần trăm zoom.
- `Esc` thoát nhanh công cụ đặt cửa/cửa sổ.
- Validator bổ sung: phòng không có cửa đi, phòng ngủ thiếu cửa sổ, WC thiếu ô thoáng, phòng ngủ quá hẹp, WC quá hẹp.

## Bước 7 – 3D & đánh giá

- Điểm đánh giá không còn cố định 84/100; được tính từ ngân sách, lỗi mặt bằng, khí hậu, vật liệu, phong thủy tham khảo và độ bền.
- Vòng điểm tổng thể thay đổi theo dữ liệu thật của project.
- Phần nhận xét hiển thị lỗi thiết kế nổi bật do validator phát hiện.
- 3D Cutaway thêm chế độ **Tách tầng / Ghép tầng** để dễ xem công năng nhiều tầng.
- Geometry vẫn lấy từ Bước 5 và màu vật liệu lấy từ Bước 6.

## Kiến trúc runtime

- Một state controller.
- Một navigation controller.
- Một pointer controller cho planner.
- Một bundle JavaScript và một stylesheet trong `public/`.
- Không có `v33.js`, `v33.css`, `patch.js` hoặc script hậu kỳ.

## Ranh giới

Planner là **mặt bằng kiến trúc sơ bộ/CAD-lite**, chưa thay thế hồ sơ thiết kế thi công do kiến trúc sư/kỹ sư kiểm tra và chịu trách nhiệm.
