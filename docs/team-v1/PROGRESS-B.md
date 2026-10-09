# Tiến độ AI B — BMH commercial v1

Chỉ AI B sửa file này khi thực thi. Ngày cập nhật: 09/10/2026.
- role: B
- status: in_progress
- active_task: B3
- active_substep: B2–B6 independent source/evidence đã lưu; next B3 style-specific refinement trên measured fixtures; C01/C04/config và deployed visual acceptance còn pending
- target_branch: codex/b-v1-24
- actual_branch: codex/b-v1-24
- source_baseline: 3c7f510d516a0770e79633b64a3896035e162aff (520 remote blob bytes đã đối chiếu trong checkout mới; giữ WIP cũ nguyên)
- last_verified_commit: 90dcc4e19a6b70075a7c34aec8f5fffb65770416 (source B2–B6: Node22 397+35 ca; desktop/phone fixture; CI238 và Vercel success; integration gate còn pending)
- checkpoint_commit: xem git log trên nhánh chứa checkpoint; không điền SHA tự tham chiếu
- implementation_accepted: false

## Checklist
- [ ] B1 — 24 hồ sơ phong cách và danh mục vật liệu phù hợp — in_progress (hồ sơ/ma trận/runtime bridge đã có; SKU/spec/sample/ảnh chưa duyệt)
- [ ] B2 — Chỉnh nội thất từng món và lưu lựa chọn — in_progress (editor/adapter/material bindings/9 tests; schema C01 chưa tích hợp)
- [ ] B3 — 3D nhà thật cho đủ 24 phong cách — in_progress
- [ ] B4 — Giao diện xuyên 10 tab và bàn giao trước thi công — in_progress
- [ ] B5 — Cloud, tài khoản, ảnh/tệp, quota và thu tiền — in_progress
- [ ] B6 — Giao diện giám sát và nghiệm thu khách hàng cuối — in_progress

## Kết quả thực và file đã đổi
- Đã chạy inventory trên fixture/source hiện có, không gọi API: 24 phong cách, 10 bộ nội thất, 9 bộ được ánh xạ, 17 profile bề mặt; catalog 92 sản phẩm, 59 SKU, 0 giá số trong catalog đóng gói.
- Bằng chứng: docs/team-v1/evidence/B/B1-style-inventory.json. Mọi mục duyệt hình/vật liệu của 24 mẫu vẫn pending.
- Đã thay behavior/UI B1: registry đủ 24 hồ sơ, 10 vai trò/hồ sơ; style defaults dùng chung collection/resolved palette/showroom.
- Giữ vật liệu, SKU, collection manual và số đo; sửa palette cache sàn không được đóng băng defaults của tường/gỗ/vải khi đổi style. Legacy chưa có marker giữ bảo toàn.
- Read-only C02 bridge mang SKU/spec/unit/priceEvidence; giá/khối lượng thiếu null, trần/vải chưa có category giữ null; không cộng trùng vai trò cùng category.
- Source đổi: src/44_house_styles.js, 86_visual_materials.js, 90_product_polish.js, 99_customer_design.js, 102_architectural_identity.js, product-polish.css. Tests/evidence B mới và B1-HANDOFF.md.

## Kiểm tra / bằng chứng
- Inventory bằng helper designClient() hiện có; kiểm tra số ID/danh mục. Helper có stub, không phải QA trình duyệt hoặc model thực.
- Node 22.23.3: build/syntax và 79/79 logic cases liên quan đạt; 11 ca B mới và 68 ca hiện có. Không thay dependency pinned.
- UI thật desktop/phone: showroom → chọn SKU/profile → 3D → đổi style → reload; giữ số đo/SKU/manual floor, tự cập nhật fabric/wall chưa authored, đủ 10 tab, không JS/WebGL errors hoặc overflow. Evidence B1-browser/result.json + PNG.
- Chưa nghiệm thu 24 ảnh ngoại thất/nội thất; không gọi API tính phí.

## Việc đang dở / blocker
- Không có kết luận commercial đạt.
- Đã có 24 hồ sơ/10 vai trò và bridge; còn catalog/sample/spec được chốt cho từng phong cách, texture SKU có quyền, nguồn giá, nhóm trần/vải và acceptance hình.
- Chờ A1 chốt schema chung cho furniture trước B2; B1 vẫn làm độc lập.

## Bước tiếp theo cụ thể
1. Đọc head/PR B mới nhất và B1-HANDOFF.md; giữ source đã viết, không làm lại inventory hoặc registry.
2. Tiếp tục metadata vật liệu/SKU/spec mẫu, category trần/vải và asset identity cho B1; không gắn nhãn supplier approved nếu chưa có nguồn.
3. Khi A1 chốt C01, làm B2 editor/adapter/history trên schema thật; trước đó phần resolver/fixture có thể chuẩn bị độc lập nhưng chưa nghiệm thu persistence.
4. Đọc PROGRESS-A trên nhánh A trước tích hợp; A ghi C02/C05, B không đổi build/state của A.

## Giao tiếp với AI còn lại
- Yêu cầu A: xác nhận contracts.md và đăng ký module B khi được gửi; không overwrite furniture/material state.
- Đồng thuận hiện tại: scope/owner nhiệm vụ; contract implementation vẫn draft.
- C02 interface thật đã gửi trong docs/team-v1/evidence/B/B1-HANDOFF.md. Không cần đăng ký module mới; mọi source nằm trong file đã build.
- C05 A thêm test B mới vào npm test/CI; B đã chạy trực tiếp trên Node 22.

## Checkpoint mới nhất (ghi nối tiếp, không xóa lịch sử)
- 09/10/2026: nhận gói B; inventory B1 có bằng chứng, chưa nghiệm thu.
- 09/10/2026: B1 implementation đầu tiên có 24 profile/240 material rows, showroom UI, shared finish resolver và C02; Node22 logic/browser có bằng chứng. Lưu source+checkpoint trên nhánh B, mở draft PR; giữ B1 in_progress và G1 pending. B2–B6 chưa hoàn tất.

Sau mỗi substep cập nhật phần active/next, ghi log ngắn kèm commit/PR/test. Khi ready_for_integration, ghi head SHA/PR/fixtures còn thiếu; khi done ghi integrated SHA và gate.

- Checkpoint tiếp: facade cũng xét explicitRoles để cache sàn không khóa vật liệu mặt ngoài; Node22 79/79 ca đạt. Browser evidence ở checkpoint trước; sửa predicate này có ca logic + regression geometry riêng, không tuyên bố duyệt 24 hình.

- PR bàn giao: https://github.com/vlam1881997-ops/build-my-home/pull/36 (draft; B1 vẫn in_progress). Head source 3c2b259; 16 file remote khớp byte với local. Node22 npm test 397/397 đạt, 11 ca B mới chạy riêng. Vercel status success cho source 3c2b259 là deployment PR, không phải production main. CI GitHub lúc ghi đang in_progress.

## B2 checkpoint — 09/10/2026
- User yêu cầu triển khai toàn B2–B6, không dừng vì một dependency. Đang tiếp tục phần độc lập.
- B2 source: 99_customer_design, 78_design_workflow, 88_customer_studio, customer-design.css; single plan.furniture consumer, exact-angle SAT, door/fixture checks, tombstones, precision editor + 2D drag.
- 49/49 tests B2+B1+customer-design đạt; 8 B2 mới. C01 reload dùng proposed schema trong fixture, chưa gọi là production migration.
- C01 request: evidence/B/B2/C01-A-REQUEST.md. Current A remote vẫn 3c7f510; editor writes deliberately disabled without persistent default array.
- Tiếp theo B3: real 3D hit/drag + GLB IDs/size; B4 routing, B5 media, B6 evidence QA.

## B2–B6 source checkpoint — 09/10/2026
- B2: exact-angle editor/history/tombstones, 2D drag; C01 default-array fixture, A schema integration pending.
- B3: real canvas raycast/drag, per-item measured GLB scaling and stable export IDs/poses; A3 revision/DXF integration and 24 visual approvals pending.
- B4: semantic routes, once-only saved-index/deep-link migration, tab9 design handover before tab10 construction. Domain screen function names preserved.
- B5: private immutable image/PDF upload/sign/read through existing projects API; revision/ownership checks, local bytes preserved, public media readiness flag. New SQL NOT applied; no credentials/config authority in environment.
- B6: existing evidence array gains location/responsible/defect/report history and explicit user-report (never certification), upload UI; A6 attachment-free journal/WBS/signed decision adapter pending.
- Tests: Node22.23.3 full existing npm test 397/397; 31 new B1/B2/B5/B4/B6 checks pass, real browser capture being completed. No real AI/payment/provider call.
- C01/C03/C04 and operating handoffs in evidence/B/B2..B6; no new front-end module/build/dependency, media uses existing API function.
- No task marked done; no main/production claim. Next: finish desktop/phone drag/export/reload, capture 24 exterior/interior candidates, record visual failures and test final integrated tree with A.

## B2–B6 real-browser fixes and checkpoint — 09/10/2026
- B2: editor hiện khôi phục món đã xóa; chọn gỗ/vải riêng mỗi món giữ SKU/spec/unit, xuất snapshot có allowlist. Mesh/parametric bounds chuẩn hóa về số đo local; model và GLB giữ góc 37°/stable furniture ID. GLB bakes rotation into vertices; QA kiểm vertex bounds sau inverse rotation, không suy từ AABB.
- B3: raycaster bỏ outline, invisible/presentation/clipped mesh; kéo canvas dùng floor plane và không thay camera. Camera menu tự đóng sau chọn để không che mô hình trên phone.
- B4: bank-directory HTTP lỗi trước đây tạo fetch/render vòng lặp tại tab8. Đã thêm cooldown 10 phút/fallback vector; browser kiểm đúng một request lỗi rồi chuyển tiếp được tab9/10, hai regression cases có mock.
- B5/B6: base A normalizer bỏ report/private-media fields trên reload. B cung cấp allowlisted extension wrapper + khôi phục snapshot local đã chọn bằng stable ID; không sửa A10. Reports không bao giờ thành certified từ imported checkbox. Media local dùng project namespace, migration legacy claim theo IDB transaction, copy dự án sao chép cache có scope rõ. Hai project cùng ID tệp không đọc/ghi đè bytes mới của nhau; ảnh tham chiếu cũng tách scope.
- Final source checks: official Node22.23.3 npm test 397/397; 35 ca B mới qua. Real Chromium153 desktop+phone: edit37°, 2D drag desktop, real 3D selection both, 3D drag desktop/camera stable, measured GLB vertex test, delete/restore/lock, 10 tabs, file/report upload, reload, local media isolation, không pageerror/overflow. Evidence dùng C01 default-array test injection được ghi rõ; KHÔNG phải A1 integrated production gate.
- Live /api/config production read-only: AI/Gemini/image true, cloud/payment/places/AIusage/guest false. Vercel metadata-only inspection: chỉ GEMINI_API_KEY cho production/preview, không có Supabase/MoMo readiness config; project setting Node24.x khác declared Node22.x. Không đọc/decrypt secrets, không tạo đơn/chi tiền. C06 cloud SQL/provider/merchant setup và runtime alignment phải được chốt trước release.
- A branch read lại: codex/a-v1-24 vẫn 3c7f510d516a0770e79633b64a3896035e162aff. Không tự gọi C01/C03/C04 đã tích hợp. Gửi A: default plan.furniture schema/migration/history; furniture trong drawingRevision/DXF/BOQ; design/asbuilt semantics/WBS adapter; đăng ký 35 B tests vào CI.
- Next: hoàn tất/chọn ảnh 24 styles, lưu evidence+source trên PR36, kiểm CI/preview đúng commit. Pending exact SKU samples/licences/prices, A measured geometry/revision/BOQ/WBS and real cloud/payment; không merge main hoặc gọi 100% commercial.

- 24-style capture hoàn tất48PNG: ngoại thất + phòng khách từng style, giữ measured rooms/openings8×18m/twofloors/3.8m+3.4m. Contact sheets được xem trực tiếp; hình khối exterior kit còn đơn giản và các nhóm classic/neo/French, pitched-roof styles khá giống; interior chỉ có thư viện generic hiện hữu. G3 visual acceptance chưa đạt, không gọi đủ24ảnh là hoàn thiện phong cách. Cần A3 measured fixtures phù hợp style + B3 refinement/sample assets và người duyệt.
- Handoff tập trung: evidence/B/B2-B6-HANDOFF.md; validation/source hashes/result trong evidence/B/B2-B6-browser. Phiên sau đọc đây để tiếp tục đúng việc, không làm lại editor hoặc registry.

- Resume: lượt tải76file trước bị ngắt khi chưa cập nhật ref; remoteB vẫn f8b497d8db6d53ca8f884b906bead50ec8dfd074. Source/evidence local còn đủ. Lưu code/checkpoint trước, chia nhỏ lượt tải bằng chứng; không báo lượt chưa xong là đã push.

## Published resume checkpoint
- Source90dcc4e đã push; GitHub CI238 completed/success, Vercel success. Evidence59file đã push tại cd0eb8ae3b67021613d1c80169b1294ea5b604d2; hash Git blob của toàn bộ ảnh được đối chiếu. Lượt upload bị ngắt không mất blob; đã tham chiếu lại đúng hash và cập nhật branch thành công.
- B5 hardening tiếp: yêu cầu evidence/sourceRef đã lưu trong project trước POST bytes; nội dung tệp đã đồng bộ immutable (đổi bản gốc thì thêm tệp mới). Timestamp uploadedAt giữ qua normalize. Hai ca backend mới; UI không hiển thị mã C01/A6 cho khách nữa.
- Raw GLB3.5MB chưa được lưu lên GitHub; glb-validation.json ghi SHA256/nodeID/pose/size và cách tái tạo từ browser test. Không nói binary đã publish. Image59file đã publish đầy đủ, không cần tải lại.
- Still pending: A C01/schema/history/revision/DXF/BOQ and C03/C04 signed work records; Node runtime alignment; Supabase/cloud/media migrations and merchant credentials/provider tests; style-specific visual refinement/review, exact SKU/licence/prices. No main/production change.

- Latest targeted changes: official Node22.23.3 full397/397 +37 B checks passed (434 total). Previewcd0eb8a is READY but curl follows to Vercel login page; HTTP200 was NOT treated as app success. Authenticated Vercel fetch connector failed; no protection settings changed, deployed interactive acceptance pending. Previous desktop/phone isolated fixture evidence retained; latest changes limited to backend guard/timestamp/UI wording.

- Resume next: không tải lại59ảnh/checkpointcd0eb8a. Đọc B2-B6-HANDOFF.md và24contact sheets; tiếp tục B3 mặt đứng/nội thất đặc trưng còn quá giống, phối hợp A3 measured fixtures. Preview protected access denied403 by Vercel connection; CLI fallback unavailable, không đổi protection.
