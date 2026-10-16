# Hiện đại: từ lựa chọn ban đầu tới cùng bản vẽ và mô hình

Trạng thái sau W13: đường hình học đo được và ảnh mẫu vật liệu đã có kiểm chứng. **Chưa nghiệm thu khớp ảnh thiết kế tham chiếu.** Không dùng một ảnh render đẹp để thay bằng chứng này.

## Điểm đã tìm thấy

- `styleReferenceId` ở module104 hiện định hướng ảnh Gemini; nó không định nghĩa hình học nhà trong `project.plan`.
- `designStudio` có bộ phương án và mặt bằng đã áp dụng. Chi tiết mặt đứng B102 vẫn chủ yếu được suy từ quy tắc phong cách chung, nhiều cấu kiện còn là gợi ý/provisional.
- Vì vậy, giữ styleId Hiện đại và đặt đúng texture chưa đủ để khẳng định khớp một mẫu nhà cụ thể.
- W13 cho phép gắn ảnh mẫu bề mặt có nguồn với SKU/spec/khổ lặp/góc vân cho từng phòng hoặc ngoại thất. Đây là ảnh màu khách cung cấp, chưa là bộ PBR hay model được hãng xác nhận.

## Handoff cần từ A, B không sửa nguồn A

1. Một fixture Hiện đại xuyên suốt có số đo được gắn với phương án đã chọn; giữ sourceRef/styleReference/activeKit/revision rõ ràng. Fixture phải ghi test-only nếu chưa có hồ sơ khách được xác nhận.
2. Mặt bằng từng tầng, mặt đứng và mặt cắt cùng revision. Nhu cầu phòng, khoảng lùi, mái, sân/loggia và chiều cao phải là lựa chọn có thể xem trước/áp dụng, không tự tạo trong renderer.
3. Cấu kiện nhận diện mặt đứng được duyệt có stableID, vị trí/kích thước tính bằng mét, vật liệu và nguồn: khung, ô mở, mảng ốp, lam, mái đua/che nắng. B sử dụng đúng geometry này trong3D; phần thiếu không tự điền từ ảnh.
4. Bản ghi đối chiếu đặc điểm tham chiếu với cấu kiện2D: được đáp ứng, khách điều chỉnh theo đất/ngân sách, hoặc chưa xác minh. Không ép căn3tầng thành ảnh2tầng khi đầu vào khác nhau.
5. BOQ/application tiếp tục dùng productId của từng bề mặt/phòng, không mặc định rằng mọi phòng dùng SKU vừa được chọn trong showroom. W13 giữ binding cũ khi khách đang chọn SKU khác cho phòng khác; đổi metadata chính SKU đó vẫn làm binding stale.
6. Đăng ký `tests/team-b-material-samples.test.mjs` vào danh sách CI explicit của package khi A cập nhật cấu hình test. B không sửa package/build thuộc A.

## Việc B tiếp tục sau handoff

- Nối cấu kiện mặt đứng đã duyệt vào drawing/mesh/GLB cùngID, không nhân đôi dữ liệu hình học.
- Hoàn thiện asset ảnh/PBR/GLB cho các sản phẩm thực sự dùng trong căn mẫu; kiểm nguồn/quyền dùng/kích thước/hướng trước khi nhận là đúng mẫu hãng.
- Đối chiếu ảnh tham chiếu, bản vẽ và6góc thực từ mô hình. Giữ vật liệu, nội thất khách đã chọn; mọi thay đổi là phương án được khách chấp nhận.
- Nghiệm thu bằng số đo và ảnh của cùng revision; không đóng gate bằng số lượng style hoặc unit tests.

Không cần đọc lại toàn repo hay chạy lại kiểm tra không liên quan. Bắt đầu từ PROGRESS-B và các adapter/fixture được bàn giao.
