# Tiến độ AI B — BMH commercial v1

Chỉ AI B sửa file này khi thực thi. Ngày cập nhật: 12/10/2026.
- role: B
- status: in_progress
- active_task: B3
- active_substep: W08.1 rotation and measured furniture size controls; W01.2 exterior massing still pending
- target_branch: codex/b-v1-24
- actual_branch: codex/review-ab-c08 (local); remote resume codex/b-facade-depth; PR42 source is merged in main
- source_baseline: 6a323673be7c5a6d6874b5bc345d9c354f6c5f55 (PR42 integrated release; earlier work/evidence preserved)
- last_verified_commit: 6a323673be7c5a6d6874b5bc345d9c354f6c5f55 (473 Node22 tests; local 24 desktop + 3 phone proposals passed; CI/Vercel success; public hashes matched again 12/10; public UI partial, see release.json)
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


## B3 facade depth / upholstery — 11/10/2026, WIP
- Resumed existing uncommitted work after interruption; main remains PR40 d374d81. No A-owned files, build registration, dependencies, plan schema or supplier catalog changes.
- Shared sceneMaterialTexture allows exterior brick/concrete to receive the existing licensed photographed colour/normal/roughness maps. Previous exterior code bypassed this loader. Brick preview module is generic 1.1 x 1.04 m, not an exact supplier SKU.
- Found a second issue in a real browser: HTTP200 brick images could still be discarded by an 8s deadline spanning initial scene/shader construction. Requests start immediately; begin the bounded30s deadline after synchronous construction yields. Immediate raster fallback and disposed-scene guard retained. Final browser asserts actual map source for all3 brick channels.
- Existing measured front openings gain bounded bay frames; timber panels gain true-depth battens. Sofa collections gain recessed tufted textiles/rolled arms and raised channel cushions inside the same measured envelope and editable parent.
- Prior intermediate Node22 full470/470 and native5desktop/3phone checks passed, but screenshots still showed fallback brick. That run is NOT final photographic acceptance. Final tests/screens are running into evidence/B/B3-facade-depth to preserve evidence across sessions.
- Next: inspect final photographic-source assertions and screenshots, finish release tests, scoped GitHub PR/main merge and public bundle/native UI verification. No commercial100% or24style visual approval claim.

### Final local verification
- Fixed the deadline while retaining synchronous request registration/deduplication and ignoring late/disposed-scene callbacks. Existing31 texture/asset lifecycle checks pass unchanged; final full Node22 test470/470 passes.
- Native desktop3styles/phone3styles, interiors3styles, reset action, persistence and unchanged plan pass. All3 Industrial map channels identify brick_wall_001, not fallback. Actual screenshot inspected: brick joints/colour variation now visible.
- Bump measured facade drawing suffix AI3 and render revision12 so prior cached imagery cannot represent the new finish geometry. Final CI and public build must cover these cache markers.
- Local remaining quality: silhouettes are still limited by measured plan; broader facade composition and style-specific furniture remain incomplete. No24-style visual signoff.


## B3 facade-depth production verified — 11/10/2026
- PR41 source7fd62d9 merged main958cd25; CI PR/main check success and Vercel Deployment has completed. Public app.js1696807B SHA256 b61113b32bace3e913059de253adadd53e006e2a4a151afabac56793531ee798 and styles.css589466B exactly match tested build.
- Final public-byte Chromium145 / Node22.23.0 run passed: 3desktop/3phone exterior styles, 3interiors, actual brick colour/normal/roughness photographic source, native material reset, save/reload, measured plan unchanged; no JS/WebGL errors or overflow. Provider/API/non-read calls isolated; TLS verification enabled. No private runtime-log health claim.
- Previous usage-limit approval failure blocked result retrieval; this continuation restored the exact published source and reran only the missing final public validation. Local earlier patch preserved. PRODUCTION-VERIFICATION.json and production-ui-smoke.json are durable evidence on codex/b-facade-depth. No second source deployment was needed.
- Next: improve measured facade composition and the furniture library per style, then visual acceptance of each of the24 styles. The functional/texture defect is fixed; current whole-house silhouettes remain simple. No24style visual signoff, engineering approval or commercial100% claim. Preserve Task A ownership, authored materials, IDs and dimensions.

## B3 — 24-style measured facade / roof upgrade (11/10/2026)
- User explicitly requested continuing all 24 existing styles, from materials to detailed 3D, after comparing the inspiration villa with the narrow measured house.
- Source baseline remains main 958cd2588cf79335ad7d6a301ab1e2ed9285c96e; remote role branch codex/b-facade-depth proof head bbbf1df4d049b2e1796bfb6a74e4757a49d38ffc. Preserve prior evidence/source.
- Pitched roof fallback now clips shared roof planes to occupied upper-floor cells and slab holes; concave/notched footprints no longer silently omit the roof. Same sceneRoofSpec feeds 3D, elevations and measured roof area. Effective overhang is zero on compound footprints and reported separately; roof drainage/structure remains provisional. No new geometry store.
- All 24 styles have explicit frame/base palettes and suggested opening proportions; richer measured classical pilasters/crown/coursing. Existing customer materials/room/furniture/locks remain authoritative.
- Explicit facade proposal previews window dimensions before applying through commitDirectPlan; style selection alone never changes openings. Upper-floor suggested sills remain >=0.90 m; this is not a certified guard design.
- Material matrix now includes generic roof/facade/joinery/ceiling previews, and visible model swatches include roof/exterior/frame. No invented SKU, price or supplier approval. Inspiration photo retained; project dimensions moved away from its caption so it is not presented as a measured design.
- Source: src/44_house_styles.js, 45_studio3d.js, 101_visual_studio.js, 102_architectural_identity.js, 103_real_house.js; tests/real-house.test.mjs, team-b-style-identity.browser.cjs. All B-owned, no A schema/build/dependencies changed.
- Tests: Node22 full 473/473 passed; actual raster screenshots for all 24 exterior styles, 3 interiors and 3 phone exteriors passed before proposal UI addition. Evidence B/B3-style-24. Final native apply/undo/redo/reload run ongoing in B/B3-style-proposals.
- Visual acceptance remains pending: narrow townhouse cannot duplicate a wide villa photo; balcony/terrace/major massing must be authored in measured plan. No claim of commercial completion or 24 professional approvals.
- Next: finish native proposal run, inspect contact sheet, publish scoped PR and verify CI/live source. Then continue detailed interior assets and architectural composition against measured customer references.

- Final native proposal evidence: 24/24 desktop styles + 3/3 phone styles, actual roof meshes and photographed brick PBR, no JS/WebGL errors/overflow. Neo apply/undo/redo/save/reload passed; rooms/furniture retained. Result and contact sheet in B/B3-style-proposals. Visual acceptance remains pending; this releases the functional upgrade, not a 100% commercial claim.

- PR42 merged main 6a323673be7c5a6d6874b5bc345d9c354f6c5f55. Main CI check success, Vercel deployment success. Public app.js and styles.css HTTP200 and exact local SHA256 match; browser verification running with isolated test projects and blocked external/API writes.

## PR42 release checkpoint — 12/10/2026
- Main remains 6a323673; both public bundles HTTP200 and exact local SHA256 match on resume. Deployment is complete.
- Public browser run completed exterior checks/captures for Japandi, Industrial, Scandi and Neo (Neo includes apply/undo/redo/save/reload). Usage-limit auto-review stopped result retrieval; no final public result.json and no public phone evidence. Record partial, never full pass. Local complete desktop/phone evidence remains in main.
- No need to repeat all 473 tests or all 24 renders for this unchanged source. Runtime application source untouched in this resume.
- Next implementation: B3 massing/facade composition against customer references, appropriate measured roof/terrace/balcony plans and broader interior asset diversity. The current 24-style contact sheet is a functional comparison, not 24 aesthetic approvals; B3/commercial acceptance remain in_progress.

## W01.1 — 12/10/2026
- Mục tiêu: neo/japandi/industrial trên nhà phố 5.4 × 20 m/3 tầng và đất rộng 14 × 20 m/2 tầng. Dựng ngoại thất/phòng khách/phòng ngủ từ plan thật, lưu revision/số đo/palette cùng ảnh.
- File dự kiến: tests/team-b-prototypes.browser.cjs; evidence/B/W01-prototypes/*; source B liên quan khi tìm được lỗi có căn cứ.
- Tiêu chí: không tự đổi plan khi chuyển style/view; mái có geometry thật; vật liệu đúng style; ảnh đủ để đánh giá hình khối. Fixture thử nghiệm, không phải phương án thi công đã được duyệt.

### W01.1 checkpoint — source and evidence
- Source: src/43_scene_assets.js checks five sightlines to measured bed before choosing an eye-height camera; retains fallback and all furniture geometry. src/103_real_house.js render revision 14 invalidates old cached views.
- New B tests: team-b-prototypes.browser.cjs (repeatable fixture/style/view/device filters); team-b-prototype-camera.test.mjs (frustum, ray obstruction, four furniture rotations, unchanged objects).
- Verification: 32/32 Node22 camera/scene tests; baseline 6 desktop cases × exterior/living/bed; changed camera 6 desktop bedrooms; Neo townhouse phone bedroom, no JS/WebGL error or overflow. Evidence: docs/team-v1/evidence/B/W01-prototypes/validation.json and four contact sheets. No unrelated full-suite rerun.
- Visual finding: wardrobe obstruction corrected. Exterior massing remains box-like; W01 and commercial acceptance remain in_progress. Neo roof does exist (townhouse rise 1.559 m), street view obscures most of its slope.
- Counterpart request: A-massing-request.md records oversized bedroom (3.98 × 12.38 m in test fixture), proposals for floor setbacks/loggia and coherent room allocation through the shared plan and explicit acceptance/history. No source A changed.
- Next W01.2: coordinate measured massing alternatives for the three prototypes; keep room/opening/furniture IDs and locks, then recapture changed exterior views. Refine room assets separately where independent; do not repeat the baseline or claim six-box sheet is visual approval.
- Publishing: scoped branch codex/b-facade-depth, parent 00ed96a43a54c27a7a666fdef706625fd07a7d83; new checkpoint SHA from branch log. No production deployment for this WIP.

## W08.1 — ưu tiên theo yêu cầu khách 12/10/2026
- Thêm xoay trái/phải theo bước 15/45/90 độ, giữ nhập góc bất kỳ; đánh dấu hướng dùng theo mặt trước của mesh trên bản vẽ. Xoay qua editFurniture dùng chung ID/pose/history/lock/collision/save.
- Cho nhập rộng/sâu/cao từ sản phẩm đã chọn; kiểm footprint và cao thông thủy trước lưu. Giữ modelId, SKU và vật liệu riêng. Model 3D vẫn là generic, không tự nhận đúng mẫu hãng.
- Source: src/99_customer_design.js, src/customer-design.css. Tests: tests/team-b-furniture.test.mjs; tests/team-b-rotation.browser.cjs.
- Unit: 17/17 Node22 gồm schema A hiện có, history/lock/collision/kích thước và giữ cùng món/góc/kích thước qua 24 style. Browser desktop/phone: thao tác native trên bàn, ghế, tủ TV, TV, bồn cầu; trái/phải45°, nhập37°, sửa kích thước ghế, khóa, reload và đo node 3D đạt.
- Còn thiếu: ảnh/mã mẫu/model hãng có quyền sử dụng và liên kết chính xác SKU cho bộ nội thất; kiểm mẫu thực của 24 bộ chưa đạt. Chưa thêm tài sản hãng không có bằng chứng. W01 khối nhà vẫn pending; yêu cầu A trong W01-prototypes/A-massing-request.md.
- Bước tiếp theo: kiểm và nâng mẫu nội thất có dữ liệu model/nguồn rõ, liên kết lựa chọn mẫu với asset ổn định qua đổi phong cách; giữ checkpoint W01.2. Không đóng thương mại hoặc triển khai WIP chỉ vì kiểm tra xanh.

## PR43 production + W08.2 checkpoint — 12/10/2026
- PR43 merged: main dcc288e82c614e970cd06b9ad36776dce6a55a3b; last_verified_commit 29ff12d398cc08a6290ad42642155a1b0e3cf584. Vercel production dpl_4MVoHraujC7JLDzHYkxWkvVnUqzt READY and aliases huiminhbach.id.vn/www.huiminhbach.id.vn confirmed. This supersedes earlier WIP/no-deployment notes for W01.1 and W08.1.
- PR43 verification: Node22 477/477 full-suite tests before merge; public app.js/styles.css matched tested hashes; isolated desktop/phone native rotation, dimensions, lock, persistence and real 3D node measurements passed. Evidence W08-rotation/production. No customer/API writes.
- W08.2: added explicit loungeChairModern choice using existing CC0 Poly Haven Modern Arm Chair geometry, retained across all 24 styles. Normalized its real geometry to front -Z, centre X/Z, floor Y=0; kept original asset and provenance. Measured default 0.8203444183 × 0.9865616858 × 1.0228520567 m (width/depth/height). This is a library model, not a certified supplier SKU.
- Native dimension inputs accept measured decimal precision without step mismatch. Measured render and Architect3D export share the normalized GLB; export resolves relative to the existing architect asset base and uses measured metre-to-centimetre scale. Pose, IDs, material bindings, history, locks and collision checks remain shared. Scene cache revision 15.
- Changed source: src/43_scene_assets.js, 78_design_workflow.js, 99_customer_design.js, 103_real_house.js; assets/interior/models/modern-armchair-facing.glb and photographic-provenance.json. No A schema, build or dependency changes.
- Verification: Node22 build/syntax and 93/93 scoped tests (furniture, real house, scene assets, A furniture contract, customer design). Native browser desktop/phone: add selected model, rotate left/right45°, enter37°, reload, switch neo/japandi/industrial, verify actual licensed mesh, back direction, size, export scale/path, asset HTTP200, no JS/WebGL errors or overflow. 24-style unit test confirms fixed model retention. Evidence W08-fixed-model.
- Publishing: scoped branch codex/b-facade-depth, parent 29ff12d398cc08a6290ad42642155a1b0e3cf584. Identify this checkpoint SHA from branch history. W08.2 ready_for_integration; production still PR43 until deployment verified.
- Next: verify W08.2 production after merge, then broaden explicit licensed furniture assets with source dimensions and stable orientation. Missing supplier/SKU matches for tables/cabinets/TV/sanitaryware remain open. W01.2 measured massing still awaits A request in W01-prototypes/A-massing-request.md. 24 complete visual sets and commercial acceptance remain in_progress, not approved by these tests.

### W08.2 released — 12/10/2026
- PR44 merged, main c4e8ecb5a02eb1d6a73e8500750b3388d0eaa1df. last_verified_commit: 83df798105db3ae32d0ab543eadf127bd45fd381. GitHub check success on both source and main.
- Vercel production dpl_DbkUNBKkS1jZjMGf9XGbrUxtBmcd READY; exact main SHA and both huiminhbach.id.vn aliases confirmed. Triggered explicitly after Git integration did not create a deployment. Public app.js, styles.css and normalized GLB HTTP200 and SHA256-identical to tested local build.
- Public desktop AND phone: native explicit-model addition, left/right rotation,37° pose, precise dimension form, reload and three style changes passed; actual detailed mesh facing/size and export path/scale checked. No JS/WebGL errors or horizontal overflow. Only synthetic browser-local projects; external/API/non-GET blocked. Evidence W08-fixed-model/production (release, hashes, results and runner; screenshots retained locally).
- W08.2 completed for this explicit library chair and orientation/export fix. All source changes are live. This docs-only checkpoint records release evidence on B branch; no new runtime changes after the verified release.
- ACTIVE NEXT: W08.3 broader explicit furniture library (tables, cabinets, TV, sanitaryware) with legitimate assets, actual source bounds, facing and stable model IDs; do not substitute a generic mesh for a verified supplier model. W01.2 measured exterior massing remains open with A. Full 24-style visual/commercial acceptance remains in_progress.

## W08.3a — 13/10/2026: preserve edited dimensions in furniture export
- Restored this unfinished change after workspace recovery; source and new evidence are checkpointed together on B branch. Base remote6ad9e3b32d2c2270ef0a91104be4a57b16eb556c. Prior verified production source83df798105db3ae32d0ab543eadf127bd45fd381, main c4e8ecb5a02eb1d6a73e8500750b3388d0eaa1df.
- src/99_customer_design.js derives per-axis Architect3D export scale from saved dimensions instead of constant200. Existing22 GLBs are half catalog size, explicitly decoded and measured; normalized Modern chair retains factor100. IDs, pose, arbitrary angle and shared records unchanged. No UI/schema/dependency changes.
- Verification:45/45 Node22 furniture/customer-design tests; Chromium decoded22 vendored GLBs including Draco and checked all exported axes after independent dimension edits, within0.1mm of saved size, with37-degree orientation and unchanged identity. Evidence W08-export-sizes/source-bounds.json; runner tests/team-b-export-sizes.browser.cjs. Browser rerun was necessary because recovered workspace lacked prior source/evidence; no unrelated suites repeated.
- Status ready_for_integration. Next: merge after CI, deploy exact main and verify live source. Then broader explicit furniture library with licensed assets, dimensions, orientation and manufacturer-data provenance.
- Remaining: washingMachine is parametric and still lacks a standalone Architect3D GLB; excluded from22-asset pass. Full24-style visual acceptance, supplier-model matching and W01.2 measured exterior massing remain in_progress. This is a dimension export fix, not commercial signoff.
