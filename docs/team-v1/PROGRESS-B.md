# Tiến độ AI B — BMH commercial v1

Chỉ AI B sửa file này khi thực thi. Ngày cập nhật: 09/10/2026.
- role: B
- status: in_progress
- active_task: B1
- active_substep: inventory hoàn tất; còn nhận diện và ma trận vật liệu
- target_branch: codex/b-v1-24
- actual_branch: chưa tạo tại lúc ghi; kiểm remote trước tạo hoặc tiếp tục WIP đúng vai trò
- source_baseline: 04a661e2256828eef8ed31dc7ed4b0309e20c0a5
- last_verified_commit: 04a661e2256828eef8ed31dc7ed4b0309e20c0a5 (nguồn dùng đối chiếu; chưa có implementation task được nghiệm thu)
- checkpoint_commit: xem git log trên nhánh chứa checkpoint; không điền SHA tự tham chiếu
- implementation_accepted: false

## Checklist
- [ ] B1 — 24 hồ sơ phong cách và danh mục vật liệu phù hợp — in_progress (inventory only)
- [ ] B2 — Chỉnh nội thất từng món và lưu lựa chọn — not_started
- [ ] B3 — 3D nhà thật cho đủ 24 phong cách — not_started
- [ ] B4 — Giao diện xuyên 10 tab và bàn giao trước thi công — not_started
- [ ] B5 — Cloud, tài khoản, ảnh/tệp, quota và thu tiền — not_started
- [ ] B6 — Giao diện giám sát và nghiệm thu khách hàng cuối — not_started

## Kết quả thực và file đã đổi
- Đã chạy inventory trên fixture/source hiện có, không gọi API: 24 phong cách, 10 bộ nội thất, 9 bộ được ánh xạ, 17 profile bề mặt; catalog 92 sản phẩm, 59 SKU, 0 giá số trong catalog đóng gói.
- Bằng chứng: docs/team-v1/evidence/B/B1-style-inventory.json. Mọi mục duyệt hình/vật liệu của 24 mẫu vẫn pending.
- Chưa thay behavior/UI/render; inventory không phải hoàn thành B1.

## Kiểm tra / bằng chứng
- Inventory bằng helper designClient() hiện có; kiểm tra số ID/danh mục. Helper có stub, không phải QA trình duyệt hoặc model thực.
- Chưa chạy kiểm tra implementation/24 ảnh style trong nhiệm vụ này.

## Việc đang dở / blocker
- Không có kết luận commercial đạt.
- Thiếu 24 hồ sơ nhận diện/vai trò vật liệu và bridge SKU/texture/BOQ.
- Chờ A1 chốt schema chung cho furniture trước B2; B1 vẫn làm độc lập.

## Bước tiếp theo cụ thể
1. Lấy main/nhánh B mới nhất và bảo toàn WIP nếu có; tạo/tiếp tục nhánh B.
2. Chốt ma trận vai trò/nhận diện cho 24 style ID; khảo sát catalog/asset tương ứng, ghi thiếu SKU/texture/giá và nguồn.
3. Giao interface profile/material cho A2/A4; hoàn thiện lựa chọn vật liệu theo style trong file B và kiểm tra phần ảnh hưởng.
4. Ghi checkpoint source+tiến độ và push nhánh B.

## Giao tiếp với AI còn lại
- Yêu cầu A: xác nhận contracts.md và đăng ký module B khi được gửi; không overwrite furniture/material state.
- Đồng thuận hiện tại: scope/owner nhiệm vụ; contract implementation vẫn draft.

## Checkpoint mới nhất (ghi nối tiếp, không xóa lịch sử)
- 09/10/2026: nhận gói B; inventory B1 có bằng chứng, chưa nghiệm thu.

Sau mỗi substep cập nhật phần active/next, ghi log ngắn kèm commit/PR/test. Khi ready_for_integration, ghi head SHA/PR/fixtures còn thiếu; khi done ghi integrated SHA và gate.
