# Tiến độ AI A — BMH commercial v1

Chỉ AI A sửa file này khi thực thi. Ngày cập nhật: 09/10/2026.
- role: A
- status: in_progress
- active_task: A1–A6
- active_substep: consumer B thật, C01 transforms/revision/DXF và A2–A6 adapters đã triển khai; đang kiểm regression, bổ sung UI nhập và kiểm xuất/browser
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
- A1 đã push dc78657; B head 90dcc4e đã ghép tại 1372285, Draft PR #37. Source bốn module team-a do A sở hữu, đăng ký build và năm test B.
- C01 yêu cầu array đã normalize; consumer âm tính B qua lại đúng contract, không sửa test B. Phép xoay phòng giữ center/angle nội thất và lock; regeneration remap hoặc từ chối mất đồ. Revision gồm fixture/furniture identity, giá/vốn không đổi revision. DXF polygon và bảng kê dùng size local.
- A2 nối profile B1, so phương án với dữ liệu vốn có nguồn nhập và khoảng lùi/provisional; tư vấn Bắc/phong thủy riêng không tự đổi phòng.
- A4 ứng dụng/SKU/role, đơn vị/định mức có nguồn, VAT/nhân công/vận chuyển và costTreatment; nhóm thiếu giữ null.
- A5 mô phỏng tháng gốc đều/trả góp, kỳ lãi/giải ngân/ân hạn gốc/phí; đối chiếu domain-kit, dòng tiền giữ reserve; chưa ngân hàng duyệt.
- A6 contract WBS/log/issue/change/payment/drawdown/output/review, adapter.html dùng hook B6; bàn giao thiết kế/thi công/hoàn công riêng, tài chính chỉ export opt-in.
- Tất cả vẫn in_progress: phải kiểm coverage, UI, xuất và gate tích hợp trước nghiệm thu.

## Kiểm tra / bằng chứng
- A1 source 53/53 Node22; consumer B + customer contract 43/43 Node22 sau adapter.
- team-a-commercial 13/13 Node22: transform/DXF/SKU/BOQ/loan parity/cashflow/persistence/privacy/signoff.
- First integrated npm test Node22: 449 checks, 447 passed, 2 revision regressions do fixture array undefined so với [] khi normalize; canonicalized fixtures||[] và kiểm lại measured-design/consumer. Chưa gọi full release xanh.

## Việc đang dở / blocker
- Không có kết luận commercial đạt.
- A1 cần chốt contract/schema và fixture với B. Phần đất/quy hoạch/KS thiếu nguồn thật phải giữ đúng trạng thái.

## Bước tiếp theo cụ thể
1. Kiểm coverage BOQ/transport/bundles và UI nhập ứng dụng/báo giá; fixtures A2 đổi vốn/đất/hướng.
2. Rerun full npm test Node22 sau sửa regression; browser desktop/mobile/save/reload.
3. PDF render từng trang, DXF parse mm/ID/37°, private exports; secret/dependency scan.
4. Đẩy checkpoint và cập nhật PR37/evidence, chuẩn bị preview cho B6; không merge main/deploy production.

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

- Checkpoint C07 WIP: A1–A6 adapters/test đã có; source chưa nghiệm thu gate. Baseline tested commit 1372285 trước patch; checkpoint mới xem git log.
