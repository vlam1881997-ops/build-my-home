# Tiến độ AI A — BMH commercial v1

Chỉ AI A sửa file này khi thực thi. Ngày cập nhật: 09/10/2026.
- role: A
- status: in_progress
- active_task: A1–A6
- active_substep: C08 source tích hợp B ce28e327, BOQ/finance/handover và QA native exports đã kiểm; bàn giao để review, giữ các gate thiếu dữ liệu/config/visual ở pending
- target_branch: codex/a-v1-24
- actual_branch: codex/a-v1-24
- source_baseline: 3c7f510d516a0770e79633b64a3896035e162aff
- last_verified_commit: 137228537bef5d4ab9c82318947d019b55dd5363 (mốc source ghép trước C07/C08; kết quả C08 gắn source hashes trong evidence/A/C08, không dùng SHA này thay cho patch đang kiểm)
- checkpoint_commit: xem git log trên nhánh chứa checkpoint; không điền SHA tự tham chiếu
- implementation_accepted: false

## Checklist
- [ ] A1 — Hồ sơ đầu vào, đất và hợp đồng dữ liệu — ready_for_integration (consumer B thật, legacy/history/reload đã kiểm; chờ xác nhận contract và nguồn công trình)
- [ ] A2 — Phương án từ đất, công năng, phong cách, vốn và tư vấn phong thủy — in_progress (3 chiến lược/profile 10 vai trò, vốn có nguồn và thiếu Bắc được thể hiện; diễn giải phong thủy/khí hậu có nguồn và fixture đầy đủ còn cần review)
- [ ] A3 — Bản vẽ đo đạc và hồ sơ kỹ thuật — ready_for_integration (32 trang A3, SVG/DXF mm, GLB parity fixture chung; G3 hình 24 style và KTS/KS chưa đóng)
- [ ] A4 — BOQ đầy đủ, giá có nguồn và tối ưu ngân sách — in_progress (ứng dụng/SKU/coverage và so tương đương có API; cần dữ liệu đầy đủ và UI chọn tối ưu qua B)
- [ ] A5 — Vay ngân hàng và dòng tiền theo tháng — ready_for_integration (hai phương thức, kỳ lãi/draw/grace/phí/stress, UI nhập/lưu đã kiểm; chưa có ngân hàng phê duyệt)
- [ ] A6 — Bàn giao thiết kế, dữ liệu giám sát và tích hợp release — in_progress (10 sổ dữ liệu, gói cùng revision/SHA256 và hook B6 đã kiểm; preview/config/professional/visual gate còn pending)

## Kết quả thực và file đã đổi
- A1 đã push dc78657; B head 90dcc4e đã ghép tại 1372285, Draft PR #37. Source bốn module team-a do A sở hữu, đăng ký build và năm test B.
- C01 yêu cầu array đã normalize; consumer âm tính B qua lại đúng contract, không sửa test B. Phép xoay phòng giữ center/angle nội thất và lock; regeneration remap hoặc từ chối mất đồ. Revision gồm fixture/furniture identity, giá/vốn không đổi revision. DXF polygon và bảng kê dùng size local.
- A2 nối profile B1, so phương án với dữ liệu vốn có nguồn nhập và khoảng lùi/provisional; tư vấn Bắc/phong thủy riêng không tự đổi phòng.
- A4 ứng dụng/SKU/role, đơn vị/định mức có nguồn, VAT/nhân công/vận chuyển và costTreatment; nhóm thiếu giữ null.
- A5 mô phỏng tháng gốc đều/trả góp, kỳ lãi/giải ngân/ân hạn gốc/phí; đối chiếu domain-kit, dòng tiền giữ reserve; chưa ngân hàng duyệt.
- A6 contract WBS/log/issue/change/payment/drawdown/output/review, adapter.html dùng hook B6; bàn giao thiết kế/thi công/hoàn công riêng, tài chính chỉ export opt-in.
- C08 bổ sung transport-group conflict, phạm vi toàn hệ kết cấu/MEP theo revision, phản ứng với saved rows malformed; public BOQ chỉ xuất allowlist báo giá, giữ raw private metadata trong state.
- A3 bảng vật liệu lấy đúng toàn bộ commercialBoq; bảng nội thất có ID, góc và size local. DXF APPID/handle đã sửa, ezdxf không phải tự sửa file.
- UI A5 tab8 có stress lãi/thu nhập/giá xây do người dùng nhập; không tự đổi phương án hay điều kiện gốc. Tab9 xuất 2D; tab10 dùng supervisionAdapter.
- C08 B ce28e327 import đúng 70 blob (14 text + 56 ảnh), giữ lịch sử parent B, không tự sửa source/tiến độ B.

## Kiểm tra / bằng chứng
- A1 source 53/53 Node22; consumer B + customer contract 43/43 Node22 sau adapter.
- team-a-commercial 13/13 Node22: transform/DXF/SKU/BOQ/loan parity/cashflow/persistence/privacy/signoff.
- Lượt 449 checks trước có 2 lỗi revision fixtures undefined/[]; đã sửa canonicalization và chạy lại toàn bộ: **457/457 đạt, 0 fail/skip**, Node22.23.3 trên source C08 (log và source hashes trong evidence/A/C08).
- Browser native editor desktop/phone: thêm/sửa/xóa phòng, cửa/window/passage/fixture; undo/lock/inverse CTM; migration 10 tab và A3 PDF/GLB đạt. Lượt này trước import B ce nhỏ (backend timestamp/media guard/UI wording).
- Browser thương mại trên bản cuối B ce: desktop 1440×1000 và phone 390×844; sửa37°/xóa/reload/restore, BOQ124200 VND test-only, loan/grace/draw/fee/stress/reload, nhật ký B6, gói native/privacy/GLB đạt. Lượt Node22 trước đã đạt; lượt tái xuất sạch sau phục hồi môi trường dùng Node24.19.0, không đánh đồng runtime.
- Export QA: render/decode từng trang; A3 vector có chữ tìm kiếm và cùng revision, 32 SVG, 10 loại output có SHA256 khớp file. DXF3 tầng $INSUNITS=4, ranh176m², furniture37°/local400×400×940mm, audit0errors/0fixes. Bản kiểm và giới hạn xem evidence/A/C08.
- GLB native B được parse bằng GLTFLoader, đối chiếu vertex bounds + inverse37°, cùng revision/cao tầng3.8/3.4/3.1m/cửa lệch/shaft. Chỉ lưu validation/hash/cách tái tạo; binary GLB12MB chưa publish.
- Kiểm mẫu token/private-key độc lập không có hit; không gọi đây là Codex Security scan. npm audit còn1 moderate dev esbuild có sẵn; không tự nâng dependency.

## Việc đang dở / blocker
- Không có kết luận commercial đạt.
- B cần đọc C08/contracts và xác nhận consumer C01/C02/C03/C04 trên preview đúng SHA. A3 package/fixture đã sẵn sàng cho B3/B6.
- Chưa có đất/địa chính/Bắc/quy hoạch/địa chất/tải/hệ kết cấu/MEP/model lift/giá ngân hàng thật: giữ unknown/provisional/awaiting-review; TEST-ONLY không dùng thi công.
- A2 diễn giải tư vấn phong thủy theo trường phái/nguồn, kiểm khí hậu/thông gió và nhiều ràng buộc khó chưa nghiệm thu. Không dùng điểm mặc định để chứng minh hợp yêu cầu.
- A4 UI chọn nhiều alternatives và nhập scopeCoverage cần phối hợp hook B; báo giá/KS đủ phạm vi chưa được cung cấp. Không gọi totalKnown là tổng công trình.
- Vercel metadata C07 READY, preview target null; fetch bảo vệ403 thiếu quyền project/team. Automatic approval review từ chối thử connection khác để temporary bypass; không retry/browser-bypass hay đổi protection. Cấp lại quyền kết nối trước kiểm live.
- Codex Security preflight bị chặn bởi reference/config capability chưa khả dụng; scan chính thức chưa hoàn tất. esbuild moderate dev advisory cần Codex điều phối xem xét.
- C06 Node production24 khác declared22; cloud SQL/provider/payment/merchant/config và 24 visual approvals còn pending theo B. Không deploy production.

## Bước tiếp theo cụ thể
1. Đọc checkpoint C08 ở PR37/evidence/A/C08 và handoff, giữ source hiện tại; không làm lại schema/editor đã kiểm.
2. B xác nhận hợp đồng/fixture và tiếp tục 24 visual refinement; A bổ sung A2 diễn giải có nguồn và A4 consumer chọn tối ưu/scopeCoverage qua hook theo owner.
3. Khi Vercel connection có quyền, kiểm desktop/mobile trực tiếp trên SHA checkpoint; metadata READY chưa phải app acceptance. Khi Security preflight khả dụng, chạy scan chính thức rồi xử lý theo quyền điều phối.
4. Thu đầu vào/quotes/professional review thực và đóng từng G1–G6 bằng chứng. Không merge main/production trong checkpoint này.

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
- Checkpoint C08 WIP: sửa coverage/privacy/material-PDF/APPID/stress; 457 Node22 checks và native desktop/mobile/export/GLB proof đã có. Hồ sơ TEST-ONLY và HANDOFF-CODEX-A-20261014.md ghi nội dung thực ngày09/10, không nhận nghiệm thu tương lai. Source+progress+evidence nằm trên nhánh A/PR37; gate chưa đóng.
