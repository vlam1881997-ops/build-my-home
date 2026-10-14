# Handoff Codex A — TASK A, checkpoint C08

Nội dung thực cập nhật **09/10/2026**. Tên tệp giữ mốc bàn giao14/10 theo yêu cầu, không xác nhận đã làm việc hoặc nghiệm thu ở ngày tương lai.

Repo `vlam1881997-ops/build-my-home`, nhánh `codex/a-v1-24`, [Draft PR37](https://github.com/vlam1881997-ops/build-my-home/pull/37). C07 parent19a8453; B parentce28e327. Lấy SHA checkpoint thực từ nhánh/git log. Worktree `bmh-codex-a-v1-24`; worktree WIP08/10 cũ vẫn được giữ. Không reset WIP, không làm lại schema/editor đã kiểm.

## Bản nguồn bàn giao

A đã nối state/evidence/furniture với native B editor/resolver; atomic room transforms và regeneration giữ pose37°, local size, lock, tombstone, history và reload. Revision bao gồm geometry/fixture/furniture/SKU, giá và tài chính dùng key riêng. North/elevation default không được nhận là đã đo.

A2 dùng profile10vai trò của24style, so3chiến lược từ nhu cầu theo tầng/đất/vốn; khoảng lùi/Bắc/khí hậu không nguồn vẫn provisional/unknown. Tư vấn riêng không tự di chuyển thờ/giường/bếp. Phân tích quy tắc phong thủy có trường phái và nguồn, điều kiện khí hậu/ánh sáng và bộ fixture khó còn cần tiếp tục review, không nhận engine hiện tại là hoàn chỉnh phần này.

A3 có mặt bằng/mái/4mặt đứng/2mặt cắt/cầu thang/thang máy/bảng cửa/diện tích/vật liệu/đồ; A3 native vectorPDF/SVG, DXFmm với XDATA stable ID/góc/size. Bảng A3 vật liệu dùng toàn bộ commercialBoq thay bảng legacy. Không tự tính tiết diện/thép/móng/MEP.

A4 applications/SKU/spec/quantity reference và quotes có đơn vị/vùng/ngày/hạn/phạm vi/VAT/nhân công/vận chuyển/hao hụt. Thiếu giữ null. CostTreatment và sharedtransport kiểm chồng phạm vi/giá gói/chuyến chung; scopeCoverage cần danh sách element của toàn discipline cùng revision. Public quotes xuất allowlist, raw metadata riêng vẫn giữ trong state. So equivalent có API + B compatibility, không tự thay lựa chọn.

A5 annuity/equalprincipal, rate periods/draws/grace principal/fees, monthly construction cash, reserve và stress do khách nhập. UI tab8 nhập/lưu/reload. Giả định nominalannual/12, giải ngân đầu tháng; chưa hỗ trợ dailydaycount/balloon/capitalization/prepayment. Không ngân hàng duyệt. BOQ toàn công trình thiếu thì khoản cần vay toàn công trình vẫn unknown.

A6 supervisionAdapter10collections (WBS/journal/inspection/issues/changes/payments/drawdowns/decisions/outputs/warranties), validate nguồn/revision/references và malformed records; native B6 hook dùng thật. Design handover, construction inputs và asbuilt tách riêng. Documented professional metadata không tự thành chứng nhận. Gói mặc định không có tài chính cá nhân; opt-in riêng.10output-types có SHA256 đúng bytes; BOQ stale theo priceKey độc lập geometry.

## Bằng chứng đã kiểm

- `C08/source-hashes.json`: SHA256 các source/test/build inputs kiểm local; không dùng SHA parent thay cho patch đang kiểm.
- Node22.23.3: **457/457 checks**, không fail/skip. Build/syntax đạt. Unit/reconciliation có originaldomain formulas và negative tests; các ca Node22 trước được giữ log. Binary22 không còn trong môi trường phục hồi; lần tái xuất sạch cuối dùng Node24.19.0.
- Native editor regression desktop/phone: phòng/cửa/window/passage/fixture, lock/undo/redo/drag/inverseCTM; B10tabs migration; samegeometry GLB/PDF đạt trên B90source trước ce smallguard/timestamp/UIwording.
- Final native commercial browser với Bce và A patch: desktop1440×1000/phone390×844, edit37°/delete/reload/restore, budget comparisons, quoteform, loan/grace/draw/fee/stress/reload, B6journal, preliminarypackage/privacy/GLB. Không provider/AI/payment writes; network ngoài local bị mock.
- `C08/export-validation.json`: 32trang vectorA3 420×297mm, chữ tìm được, 32SVG cùng revision; render/decode từng trang;10hashoutput-types khớp file. Manual layout review/render comparison ghi riêng trong VALIDATION.md.
- `C08/dxf-validation.json`:3DXF INSUNITS4, parcel176m² đúng6đỉnh, closed furniture footprints/góc37°/local400×400×940mm,0auditerrors/0auditfixes. Chỉ parse bằng ezdxf; chưa đo lại thủ công LibreCAD trong môi trường này.
- `C08/common-glb-validation.json`: native BGLB được GLTFLoader parse,8meshes của chair, vertexbounds so actualscene và inverse37° khớp localdims; levels3.8/3.4/3.1, opening và shaftIDs. BinaryGLB12MB chỉ ở scratch, **chưa publish**; tái tạo bằng browser test. Không ảnh AI làm bằng chứng số đo.
- Gói `BMH-TASK-A-TEST-ONLY-20261009.zip` là fixture tổng hợp để review phần mềm, gồm public2Dpackage/BOQ/revision/QA; không khảo sát/giá/ngân hàng công trình thật, không dùng thi công. Giá chair124200VND chỉ ca kiểm thử, tổng công trình null.

## B và biên ownership

Bce28e327 được import nguyên70blob (14text/56ảnh) từ nhánh B. Không tự chỉnh B UI/3D/cloud/backend/progress; giữ parent/hashes. 24style ảnh là candidates, B đã ghi hình khối/style còn cần refine và người duyệt. Không coi48PNG hay457tests là commercial done.

A sở hữu các `src/team-a-*`, `tests/team-a-*`, evidence/A, state/measurements/exports và sổ tích hợp. Hook data/form A là consumer theo hợp đồng, không đổi B source/CSS. B cần review C01/C02/C03/C04 và UI chọn alternatives/scopeCoverage bằng A API, cùng common fixture cho B3/B6.

## Còn thiếu và bước tiếp

1. A2: hoàn thiện/kiểm diễn giải có nguồn theo trường phái, các ràng buộc site/climate/daylight/family; không tự dời công năng. A4: nối UI nhiều sourced alternatives/scopeCoverage với B, nhập dữ liệu nguồn toàn hệ. Không giả price/SKU/equivalence.
2. Công trình thật: cần ranh/khảo sát/cao độ/Bắc/quy hoạch có nguồn; địa chất/tải/hệ kết cấu/MEP từ KS; liftmodel hãng; quotesSKU/unit/vùng/ngày/VAT/nhân công/vận chuyển và bankterms. Giữ unknown/awaiting-review tới khi được cung cấp.
3. Vercel protectedpreview: C07dpl_C9k7P9sdtEX4aqemY86XnqAcssGa metadataREADY, brancha-v1-24/SHA19a8453, targetnull. Fetch403 thiếu quyền project/team. Automatic approval review **từ chối** thử connection khác để tạo temporarybypass khi chưa có thay đổi quyền được xác nhận. Không thử workaround/browser/CLI/protection change. Cần cập nhật quyền Vercelconnection rồi kiểm preview trực tiếp đúng SHA mới. Metadata READY chưa là kiểm app live.
4. [Codex Security security-diff-scan SKILL.md](skill://Plugin_1e648473be9c8191a91ac3947151af55/security-diff-scan/SKILL.md) yêu cầu: “Run the `security_diff_scan` preflight from `../../references/config-preflight.md` before reviewing files or creating a goal.” Reference/capability chưa khả dụng nên **scan chính thức còn pending**. `C08/security-independent-check.json` chỉ kiểm các mẫu token/private-key, không thay scan này. npm audit còn1moderate esbuild dev advisory GHSA-67mh-4wv8-2f99 có sẵn; không app esbuildserve sử dụng, không tự upgrade dependency.
5. C06/B5: SQLcloud/media/provider/payment/merchant và declaredNode22 vs VercelNode24 cần chủ quyền cấu hình/điều phối chốt; không gọi dịch vụ chưa bật là hoạt động. B6 và KTS/KS/customer signoff phải có bằng chứng thực cùng revision; G1–G6 còn pending phần này.

Không merge main hoặc deploy production trong checkpoint. Tiếp tục đọc TASK-A/PROGRESS-A/INTEGRATION/contracts và branch head trước sửa; khi có quyền preview hoặc nguồn professional thì kiểm phần tương ứng, không chạy lại toàn bộ test nếu source không đổi và không phát sinh nghi ngờ mới.

## Bổ sung thực tế 14/10 — PR48, chỉ phần A

Baseline kiểm `8dbff47`; bằng chứng `R3-R5-native-20261014/`. 148 A checks Node22 +6 native massing +2 A5 form đạt; 102 trang PDF vector A3 cùng revision SVG/DXF/BOQ, render toàn bộ. Chưa nghiệm thu loggia/sân thượng hoặc Security chính thức. Chỉ bàn giao phần A; rà B và ghép A+B được chủ sản phẩm hoãn ngày14/10. Không merge/deploy, không đánh dấu toàn bộ hoàn thành.
