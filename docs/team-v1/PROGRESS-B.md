# Tiến độ AI B — BMH commercial v1

Chỉ AI B sửa file này khi thực thi. Ngày cập nhật: 10/10/2026.
- role: B
- status: in_progress
- active_task: B3
- active_substep: B3 style switch + lot-edge finish fix verified locally; publishing codex/b-style-switch-24, 24-style visual acceptance remains pending
- target_branch: codex/b-v1-24
- actual_branch: codex/review-ab-c08 (local isolated review); remote resume codex/b-v1-24
- source_baseline: 3c7f510d516a0770e79633b64a3896035e162aff (520 remote blob bytes đã đối chiếu trong checkout mới; giữ WIP cũ nguyên)
- last_verified_commit: c9d6c3a87d8eb2da880e739c2ad0b283d484f516 (PR39 merged; CI249/250 success; Node22 462/462; public file hashes and desktop/phone photo/detailed3D passed)
- checkpoint_commit: xem git log trên nhánh chứa checkpoint; không điền SHA tự tham chiếu
- implementation_accepted: false

## Checklist
- [ ] B1 — 24 hồ sơ phong cách và danh mục vật liệu phù hợp — in_progress (hồ sơ/ma trận/runtime bridge đã có; SKU/spec/sample/ảnh chưa duyệt)
- [ ] B2 — Chỉnh nội thất từng món và lưu lựa chọn — in_progress (ready_for_integration: native A1/C01 editor/reload/37°/GLB đã kiểm; visual/provider/professional gate chưa đóng)
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

## Review A+B theo yêu cầu gộp của người dùng — 09/10/2026

- PR37 bbbd70f chứa B ce28e327 nguyên lịch sử/blobs; A ahead4/behind0 so B. 351 nguồn đã đối chiếu Git blob. Không sửa source hoặc PROGRESS-A.
- B xác nhận consumer native C01/C02/C03/C04 trên nguồn A: furniture schema/history/any-angle/reload/GLB, ten routes, BOQ phần có nguồn, finance form, design handover và supervision hook dùng thật; không nhận đây là full commercial gate.
- Node22.23.3:457/457; bản final CSS/QA chạy native commercial desktop/phone và B editor/ray pick/drag/media/10tabs, không chèn schema. Phone ban đầu lỗi summary báo giá; sửa CSS form/target44/bảng cuộn/viewport và chạy lại đạt. B harness sửa nhãn native và kiểm overflow theo viewport cố định.
- Final export:32 vectorA3/SVG,3DXFmm,10outputhashes, GLBworldbounds/inverse37°/3unequalfloors đạt. 32 trang PDF của source xuất không đổi đã render/decode và xem8montages. Binary GLB/evidence ảnh mới vẫn scratch; các JSONvalidation được commit.
- Vercel đúng project đổi nodeVersion24→22; protection/env/cloud/payment không đổi. Source sẽ gộp theo yêu cầu hiện tại, không nhận commercial100% hoặc thi công-ready. Chi tiết còn thiếu và next6workstreams: evidence/B/AB-C08-review/COMMERCIAL-READINESS.md.
- Source/progress ở checkpoint review mới lấy từ git log/PR37; last verified source A bbbd70f, patch final gắn source hashes riêng. Sau merge ghi lại main/live bằng chứng thực, không thay pending từ số tests.

### Mốc đã gộp và live — 09/10/2026
- Main42d8653 chứa A bbbd70f/B ce28e327 và reviewb79d4758. PR36/37 merged, CI246 success, VercelproductionREADY; JS/CSS publicdomain khớp bundle. Live publicresponses UI qua transportNodeHTTPSkiểmTLS desktop/phone10tab/editor37°/báogiá/vay/handover/supervision đạt; không bypass/protectionchange hay gọi paidproviders.
- B branch checkpoint này fast-forward từ ce28e327, parentmain42d8653, chỉ thêm evidence/progress. Khi làm tiếp, lấy headB/currentmain và đọc source/docs đã tích hợp; không khôi phục sourceB cũ chưa có A1.
- Nextconcrete: B3 style-specific roof/facade/interior/PBR/assets, khớp24profile và measuredfixtureA3. C01/nativeconsumer đã kiểm; C02 quote/coverage/UI, cloud/payment/quotas và professional/customervisualacceptance còn pending.
- Bằng chứng: evidence/B/AB-C08-review/PRODUCTION-VERIFICATION.json và production-ui-smoke.json. Không đánh dấu G1–G6 thương mại done.

- Observability: runtime logs403, CLI Vercel không có; giữ server-error scan pending. Không thử connection/bypass khác.

## B3 — Ảnh vật liệu, giá có nguồn và chi tiết 3D — 09/10/2026

- Baseline đã live main42d8653 / remoteB b04de868; giữ nguyên A1–A6 measured geometry/state/build/BOQ. Không thay dependency hoặc mở API trả phí.
- Danh mục95 sản phẩm: thêm13 minh họa SVG gốc BMH, safe category fallback; ảnh có nhãn minh họa, không nhận là ảnh đúng SKU. Showroom dùng mẫu bề mặt CC0 hiện có trong repo.
- 13 giá tham khảo có amount/unit/nguồn/region/publisher/retrievedAt09/10/2026: 6 giá web vừa đối chiếu, 7 giá bảng2025/tháng06/2026 có nhãn cũ. quotedAt/VAT/công/vận chuyển thiếu vẫn null. 82 sản phẩm chưa có giá giữ unknown. Chọn sản phẩm không tự ghi đè báo giá dự án.
- 3D measured: wall cut caps lấy đúng màu vật liệu thay cyan; len chân tường/phào theo room/wall intervals, chừa cửa/low fixtures, theo chiều cao từng tầng; texture sơn sạch hơn; rèm dùng floor level thật; chăn có bề mặt vải gấp thay khối sọc. Không đổi footprint/phòng/ô mở/kết cấu của A.
- Node22.23.3 npm test460/460 đạt. Desktop1440×1040/phone390×844: 12 nhóm minh họa decode, nguồn/đơn vị/ngày/giá cũ, chọn SKU/profile→3D→đổi style→reload, measured plan/SKU giữ, neutral caps/new details/draped textile, 10tabs/no overflow/no JS/WebGL errors. SoftwareGPU finish switch1333/1115ms trong fixture, không suy thành benchmark thiết bị khách hàng.
- B2–B6 native kiểm lại editor/drag/GLB/report/reload. Phone ghi nhận lần kiểm đầu chưa được đọc sau event; test nay chờ đúng saved report trước assertion (không force click hoặc bỏ qua lỗi). Final native desktop+phone đạt, không schema injection; result/GLB hash trong B3-material-realism.
- Evidence/provenance/nguồn: evidence/B/B3-material-realism. Không đánh dấu B1/B3/G1–G6 done. Generic texture/illustration chưa phải exact SKU hoặc duyệt hình24style; mới là nâng cấp nguồn/hiển thị/measured detail.
- Next: xác nhận production đúng commit/bundle; tiếp B3 facade/roof/room assets đặc trưng từng style + sample/SKU/licence/visual acceptance, không viết lại registry/editor/native measured source đã có.

### B3 publish blocked — checkpoint saved locally
- Tested local source commit afef9a7. 460/460 and final native desktop+phone/material stories passed.
- Two identical GitHub create_tree attempts were NOT executed: automatic approval review could not initialize Habitat thread-store session (RateLimited429). This was a review infrastructure failure, not a safety determination. No alternate transport/connection was used to bypass approval.
- RemoteB remains b04de868; main42d8653 / production remain the previous release. New SVGs/catalog/3D source have NOT reached the website. Do not claim this task is deployed.
- Resume: preserve local bmh-review-ab-c08/checkpoint and package. Re-read main/B heads, publish exactly36 scoped changed files on baseB b04de868 tree0bb22475, CAS expectedB head, open ready PR, wait CI, merge per existing user authorization, verify production commit and public bundle/UI. Do not repeat model/editor implementation or retry denied preview/runtime access.

### Publication resumed
- Service recovered on the next user turn. Same scoped create_tree operation succeeded; no bypass or alternate credentials. Source tree prepared; branch/PR/CI/production steps must still be verified separately.

### B3 released — 09/10/2026
- Source f5c3201 published; PR38 merged main03c0b9f. CI247/248 completed/success; GitHub Vercel status for main reports Deployment has completed.
- Public app.js1684874B/styles.css587899B/catalog/floor.svg HTTPS200 exactly match tested bytes/SHA256. Native public-response UI desktop1440×1000/phone390×844 passed: all10routes, actual37deg editor, illustrations/dated prices, material cut mode neutral23caps and bounded finish meshes, quote/bank/handover/supervision, zero pageerrors. Test providers isolated, NodeHTTPS verifiesTLS; no protection/TLS bypass.
- Evidence: B3-material-realism/PRODUCTION-VERIFICATION.json + production-ui-smoke.json. Private Vercel deployment list403 this turn; CLI unavailable; not retried or replaced with identity probes. No private deployment metadata/runtime-log clean claim.
- Test correction: first production smoke expected cut caps while default auto-wall mode used no clipping planes. Explicit material/cut wall view then passed23neutralcaps on both devices; no source change was necessary.
- Current upgrade delivered. Whole B3/24styles/price coverage/exactSKU/professional/provider gates stay pending. Continue from integrated source, not B-only legacy checkout; next style-specific facade/roof/interior assets and supplier evidence.

## B3 photographic checkpoint — 10/10/2026
- Tiếp tục đúng phản hồi của khách: ảnh vật liệu thật và nhà 3D còn đơn giản. 9 ảnh bề mặt gốc CC0 (không phải ảnh SKU), 12 kênh PBR mới cho da/bê tông/gạch/terrazzo, một ghế GLB 8.916 tam giác/243KB với slot gỗ/vải theo lựa chọn. Nguồn, MD5 gốc và SHA256 đầu ra trong photographic-provenance.json; Powered by Poly Haven. Không gọi API lúc khách sử dụng.
- Showroom có thư viện ảnh thật, phóng to, phân biệt ảnh bề mặt với ảnh hãng. Preview sản phẩm đã chọn dùng swatch bề mặt 3D, không còn hình SVG nhóm trong preview. Ảnh SKU thiếu giấy phép vẫn dẫn sang nguồn hãng, không tự nhận đã có ảnh chính xác cả95sản phẩm.
- 3D giữ một furniture node/ID/pose/kích thước; mesh chi tiết chỉ thay các collection phù hợp (warm-oak, nordic-light, mid-century, loft-leather, urban-stone, coastal), chọn gỗ/vải dùng chung pipeline và đổi tại chỗ. Cảnh đã hủy không nhận model đến muộn. HDRI cho cả góc phòng; giảm ambient phẳng, tăng tương phản nắng/fill; fallback kỹ thuật và raster vẫn sẵn có.
- Chromium153 Node22.23.3: native desktop+phone showroom/styles/persistence10tabs pass, đổi finish106/119ms. Fixture 3style Japandi/Industrial/Modern: ảnh thật decode, HDRI, imported chair, same measured plan; đổi da trên mesh nhập giữ scene/camera/pose. Không page/WebGL error. Actual screenshots đã xem; nội thất rõ hơn nhưng mặt đứng vẫn đơn giản, 0/24 visual acceptance remains. Không gọi commercial100%.
- Tests B thêm trong real-house.test.mjs (đã thuộc ownership B) kiểm SHA/license/size và GLB đo đúng kích thước/góc37°/late disposal. No build/dependency/A-source changes. npm test kết quả ghi validation.json khi hoàn tất.
- Next: publish scoped source/assets + checkpoint; CI/merge then verify actual public bundles. Tiếp theo cần bộ mặt đứng/mái và nội thất khác cho từng style, ảnh/mẫu đúng SKU có quyền, chưa đủ24 duyệt hình. Cloud/payment/professional gates giữ pending.

## B3 release verified — 10/10/2026
- Source remote 3fb70276caadd0482faed2bb861a88bbeb9d509c, PR39 merged main c9d6c3a87d8eb2da880e739c2ad0b283d484f516. CI249/250 success, Vercel success. Prior quota review failure interrupted blob upload only; resumed through the same approved connector after user's continuation. All40 source/evidence assets now on GitHub.
- Public www.huiminhbach.id.vn: app.js/styles.css/modern-armchair.glb/photographic-provenance.json SHA256 exactly match checked local build. Chromium153 desktop1440×1000 and phone390×844 display actual photos, imported chair and HDRI, 10tabs, no overflow or JS/WebGL error. Fresh anonymous fixtures; external/API services isolated. TLS validated through Node transport, no protection bypass. PRODUCTION-VERIFICATION.json and PUBLISH-STATUS.json record proof.
- Remaining: source photos do not establish supplier-SKU equivalence; 24-style facade/roof/interior visual acceptance, cloud/payment/professional gates remain pending. Next B3 work is architectural composition and detailed assets appropriate to each style, using approved measured geometry. Do not redo furniture editor, photos pipeline or task-A schema.

## B3 style identity / inherited finishes — 10/10/2026
- User screenshots show narrow 3-storey house and distant cutaway; complaint: most selected styles look the same. This checkpoint addresses visible switching, not the generated target photograph.
- Source baseline main c9d6c3a; 5 edited B source files match main blobs before the patch. Local worktree codex/review-ab-c08; new review branch codex/b-style-switch-24. Original B role branch and unfinished scope preserved.
- Fixed discarded exterior finish skins at exact lot edges: millimetre skins sit within the measured wall and use depth bias. Industrial/Brutalist/Barn cladding applies to full solid wall bands, not glass or door voids; front joints/reveals/pilasters/cornices remain bounded and shared with elevations. Explicit exterior paint remains authoritative.
- Whole-house collection colours now carry styleRoles; later floor/wall/fabric edits and per-room manual collections remain explicit. Existing unmarked project colours are conserved. One disclosed action can restore generic style suggestions, keeping SKU bindings and manual room mixes. No silent migration or invented vendor match.
- Selecting a style exits an old presentation-image mode, invalidates stale presentation cache and shows actual style/roof in the stage. An explicitly selected roof is retained and explained. No plan regeneration, extra rooms or invented windows.
- Node22.23.0 npm test:467/467 pass. Native headless Chromium145:24 desktop exterior style selections on one 5x20m /3-floor fixture, 3 phone styles, actual pixel differences, independent interior finishes and reload. Final reset UI additionally verified with 3 desktop/3 phone samples. No JS/WebGL errors or phone overflow.
- Desktop measured pixel changes in the model region: Japandi↔Industrial28.9%; Japandi↔Scandi23.5%. This verifies changed raster output, not aesthetic approval. Capturing assets/shaders/PNG on software GPU takes roughly6–10s in this harness; not a universal customer latency promise.
- Evidence: evidence/B/B3-style-switch/{24-styles-result.json,controls-result.json,validation.log,PNG views}. Current plan/cumulative levels/openings/furniture/SKU choices remain unchanged in checked transitions. Billable/external API and non-read network calls isolated.
- Next: publish exact scoped sources; require CI and Vercel success and verify actual public bundle and style controls. Then continue real facade composition, larger detailed furniture library and per-style visual acceptance. Still0/24 styles professionally/customer visually approved; generated target image is illustrative, not model output. No commercial100% claim.

## B3 style-switch release verified — 10/10/2026
- Source ff32f14572631efd53c6514d40529fe82e6bc409; PR40 merged main d374d81dbf9b5ec60ea55b20f2a157429049f18e. PR/main GitHub check success; Vercel production reports Deployment has completed (H4Z8kUntk2kAjPqwpY3FPb7whN8k).
- Public www.huiminhbach.id.vn app.js 1694277 bytes / styles.css 589466 bytes match exact local build SHA256. Actual public-response WebGL controls pass 3 desktop + 3 phone styles, 3 interior styles, suggested-material button, save/reload and unchanged measured plan; no JS/WebGL errors or phone overflow. Anonymous fixture, APIs/external/non-read services isolated, TLS verified in Node transport. No private runtime-log health claim.
- Evidence: B3-style-switch/PRODUCTION-VERIFICATION.json, production-ui-smoke.json and public-style-smoke.cjs. Publication proof checkpoint stays on codex/b-style-switch-24 after merged source. Native model comparison is real output, not AI illustration.
- Next unfinished B3: measured facade composition and a broader detailed interior asset library per style, followed by customer/architect visual acceptance. Functional switching is fixed; style visual acceptance remains 0/24 and commercial readiness is not complete. Preserve Task A ownership and existing supplier/manual material choices.
