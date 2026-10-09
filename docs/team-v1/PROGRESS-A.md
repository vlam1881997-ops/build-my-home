# Tiến độ AI A — BMH commercial v1

Chỉ AI A sửa file này khi thực thi. Ngày cập nhật: 09/10/2026.
- role: A
- status: not_started
- active_task: A1 (next, chưa chạy)
- active_substep: chưa bắt đầu
- target_branch: codex/a-v1-24
- actual_branch: chưa tạo tại lúc ghi; kiểm remote trước tạo hoặc tiếp tục WIP đúng vai trò
- source_baseline: 04a661e2256828eef8ed31dc7ed4b0309e20c0a5
- last_verified_commit: 04a661e2256828eef8ed31dc7ed4b0309e20c0a5 (nguồn dùng đối chiếu; chưa có implementation task được nghiệm thu)
- checkpoint_commit: xem git log trên nhánh chứa checkpoint; không điền SHA tự tham chiếu
- implementation_accepted: false

## Checklist
- [ ] A1 — Hồ sơ đầu vào, đất và hợp đồng dữ liệu — not_started
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

Sau mỗi substep cập nhật phần active/next, ghi log ngắn kèm commit/PR/test. Khi ready_for_integration, ghi head SHA/PR/fixtures còn thiếu; khi done ghi integrated SHA và gate.
