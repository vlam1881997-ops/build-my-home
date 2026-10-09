# Tiến độ AI A — BMH commercial v1

Chỉ AI A sửa file này khi thực thi. Ngày cập nhật: 09/10/2026.
- role: A
- status: in_progress
- active_task: A1
- active_substep: C01 schema/input evidence đã triển khai; đang tích hợp consumer B và các phép biến đổi phòng
- target_branch: codex/a-v1-24
- actual_branch: codex/a-v1-24
- source_baseline: 3c7f510d516a0770e79633b64a3896035e162aff
- last_verified_commit: 3c7f510d516a0770e79633b64a3896035e162aff (397 baseline tests Node24; release kiểm tiếp Node22)
- checkpoint_commit: xem git log trên nhánh chứa checkpoint; không điền SHA tự tham chiếu
- implementation_accepted: false

## Checklist
- [ ] A1 — Hồ sơ đầu vào, đất và hợp đồng dữ liệu — in_progress
- [ ] A2 — Phương án từ đất, công năng, phong cách, vốn và tư vấn phong thủy — not_started
- [ ] A3 — Bản vẽ đo đạc và hồ sơ kỹ thuật — not_started
- [ ] A4 — BOQ đầy đủ, giá có nguồn và tối ưu ngân sách — not_started
- [ ] A5 — Vay ngân hàng và dòng tiền theo tháng — not_started
- [ ] A6 — Bàn giao thiết kế, dữ liệu giám sát và tích hợp release — not_started

## Kết quả thực và file đã đổi
- Chưa có thực thi A1–A6 của đợt giao việc này. Code các đợt trước đã có trên main, đọc và tận dụng, không làm lại.

## Kiểm tra / bằng chứng
- Chưa chạy trong phần giao việc này; cần ghi lệnh và kết quả khi làm.

## Việc đang dở / blocker
- Không có kết luận commercial đạt.
- A1 cần chốt contract/schema và fixture với B. Phần đất/quy hoạch/KS thiếu nguồn thật phải giữ đúng trạng thái.

## Bước tiếp theo cụ thể
1. Lấy main/nhánh A mới nhất và bảo toàn WIP nếu có; tạo/tiếp tục nhánh A.
2. Đọc contracts.md, rà state/brief/site/evidence hiện có, chốt schema furniture/migration/fixture với B.
3. Thực thi A1 theo owner, kiểm dữ liệu thiếu/xác nhận và lưu/mở lại.
4. Ghi checkpoint source+tiến độ và push nhánh A.

## Giao tiếp với AI còn lại
- Yêu cầu B: gửi profile/material bridge B1 và yêu cầu schema B2 qua PROGRESS-B trên nhánh B.
- A giữ INTEGRATION/contracts/build theo phạm vi được giao.

## Checkpoint mới nhất (ghi nối tiếp, không xóa lịch sử)
- 09/10/2026: gói A đã bàn giao, chưa khởi chạy phiên AI A.

- 09/10/2026: khôi phục đúng main/A head 3c7f510; giữ nguyên worktree 08/10 và thay đổi asset chưa commit. Tạo worktree bmh-codex-a-v1-24 từ nhánh A đã tồn tại trên remote, không reset WIP cũ.
- A1 C01: thêm plan.furniture/inputEvidence; giữ authored pose/tombstone/SKU qua merge/history/disk, báo malformed rows; chuẩn hóa fixtures hiện có theo schema mới. Source: 10_state,94_architectural_design; tests: team-a-input-furniture, customer-design,design-evidence; contracts/evidence A1.
- Baseline npm test 397/397 Node24.19.0; Node22.23.3 đã có, dùng cho lượt A1 và release tiếp. Kiểm C01 source/migration trên synthetic fixture; chưa gọi integrated gate, không gọi provider tính phí.
- B head đọc: 90dcc4e19a6b70075a7c34aec8f5fffb65770416; đã đọc PROGRESS-B/B1/B2-B6/C01/C03/C04. Next: ghép B source không chỉnh file B, nối room transforms/history/revision/export/BOQ và chạy real consumer không injection.
- C05: B có năm file test mới, cần đăng ký pipeline A. C06 cloud/payment/config và 24 visual approvals còn pending theo B; không deploy main/production.

Sau mỗi substep cập nhật phần active/next, ghi log ngắn kèm commit/PR/test. Khi ready_for_integration, ghi head SHA/PR/fixtures còn thiếu; khi done ghi integrated SHA và gate.
