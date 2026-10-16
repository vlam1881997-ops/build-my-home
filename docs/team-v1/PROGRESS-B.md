# Tiến độ AI B — BMH commercial v1

Chỉ AI B sửa file này khi thực thi. Ngày cập nhật: 15/10/2026.
- role: B
- status: in_progress
- active_task: B3
- active_substep: W14 B reference/revision review verified desktop+phone; draft PR54 held for A-owned parapet persistence defect
- target_branch: codex/b-v1-24
- actual_branch: remote codex/b-facade-depth; local restored checkout bmh-review-ab-c08 contains older git metadata; push only scoped files against fresh remote tree
- source_baseline: 4db7845dc95837fccc3e65ffe8c6cf223a4f63d2 (PR53 production main)
- last_verified_commit: d4b71f70630f7a97b111c4c9020ae53d871c51f2 (full CI success; local room/exterior desktop+phone; public desktop-room/phone-facade/GLB verified)
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

### W08.3a released — 13/10/2026
- PR45 merged; main428d34f00a06478a5c9ae4debafff8388e7759a2. last_verified_commit04391e64150d04c22520109ac33ee40e694f5cf4. GitHub check passed before merge.
- Vercel Git deployment dpl_CvPZfqpJwakuqQbMCqBFyA1DPSAn READY with both huiminhbach.id.vn aliases. Public app.js HTTP200,1715517bytes, SHA256674ead6aefd9efbb11a6f9410db3b9b44cf138d890843929e18e623ff70da17f exactly matches tested build. Evidence W08-export-sizes/production.json.
- W08.3a dimension-export fix complete and live. This follow-up checkpoint changes documentation only. No additional runtime changes after tested source.
- ACTIVE NEXT W08.3b: missing standalone washing-machine export geometry and broader explicit model choices (tables/cabinets/TV/sanitaryware), then style-specific visual review. Preserve source rights, actual size and front direction; do not mark generic models as manufacturer products. W01.2/A measured massing and full24 commercial acceptance remain open.

## W08.3b / B-R2 — washer export and visible front, 13/10/2026
- Resumed uploaded B package from remote B8df341b5963ff0c19f3957c2026acad3ab4825d7; prior tested source04391e64150d04c22520109ac33ee40e694f5cf4. Status ready_for_integration for washer substep; broader B-R2 remains in_progress.
- Added missing standalone washingMachine.glb from the same BMH procedural geometry. Reproducible generator tests/team-b-washer-asset.mjs and provenance assets/architect3d/bmh-washing-machine.json. Generic original BMH asset, no supplier/manufacturer/SKU claim. Half-size source matches existing Architect3D scale200 convention; source front+Z.
- Actual first screenshot exposed hidden door/control geometry inside the cabinet. Fixed src/43_scene_assets.js placement, regenerated GLB and visually checked the corrected screenshot. Measured outer envelope remains0.60w×0.85h×0.65d m. src/99_customer_design.js now includes washer front arrow; src/103_real_house.js revision16 invalidates cached imagery.
- Verification:47/47 Node22 scoped furniture/scene/washer tests including front ray visibility and measured envelope. Chromium decodes the exported GLB, edited axes0.702w×0.9435h×0.5395d and37-degree pose/ID preserved; within0.1mm test tolerance. Evidence docs/team-v1/evidence/B/W08-washer/source-bounds.json and washing-machine.png. No unrelated22-asset browser rerun or paid service calls.
- Changed files: three B source modules above; B generator/test runners; GLB/provenance and evidence. No A state/schema/build/dependencies changed. Public website still PR45 until integration/deployment is verified; do not call this source live.
- NEXT: integrate this scoped fix after CI; expand explicit licensed product choices, then B-R3 measured neo/japandi/industrial prototypes and24-style visual sets. W01.2 measured massing remains with A under W01-prototypes/A-massing-request.md. Full B-R1…B-R6 and commercial gates remain open.

### W08.3b released + W08.4 / B-R2 catalogue — 13/10/2026
- PR46 merged main ec6f9a2780386dd5edc929e47c96dd84a4cbced4; last_verified_commit e522220dcb8392deaf97f7e4543b42ea6ffb5f30. Production dpl_C5E5LqQpHdp4X4WndgtLAgZBCeKQ READY and both website aliases confirmed. Public app.js and washer GLB HTTP200 and SHA256 match tested source; evidence W08-washer/production.json. Prior final public read was stopped by usage-limit approval failure; completed on this resume without repeating unchanged model tests.
- W08.4 adds a preview to the existing add-furniture selector, with width/depth/height in mm and honest generic/library provenance. Changing selection updates only the preview, not the measured project or main renderer. No additional browser WebGL context or paid image API.
- Rendered24 catalogue WebP images from the actual existing BMH procedural models and licensed Modern chair, using neutral finishes. These are24 furniture models, NOT24 approved house styles. Model image source/dimensions recorded in assets/interior/catalogue/manifest.json; generator tests/team-b-furniture-thumbnails.browser.cjs. Procedural shapes/finishes may vary with room collection; UI explicitly describes this and directs users to the room model for selected finishes. No new manufacturer/SKU claim.
- Verification:16/16 scoped furniture tests; native Chromium desktop+phone switch all24 choices and decode images, no plan mutation, add washer, reload same saved model/dimensions, no overflow/JS/WebGL errors. Contact sheet and phone/desktop preview screenshots inspected. Evidence docs/team-v1/evidence/B/W08-catalogue.
- Changed source src/99_customer_design.js and src/customer-design.css only; B-owned assets/tests/progress. Existing source geometry and A contracts unchanged. Status ready_for_integration; publish source+evidence, merge after CI and verify exact production bundles.
- NEXT: richer explicit licensed models/product references and B-R3 room/exterior visual acceptance with A measured massing. Full B-R1…B-R6 remains in_progress. This catalogue makes choices visible; it does not complete real supplier products or certify24 styles.

### W08.4 released — 13/10/2026
- PR47 merged main ddf9dfe348263a28148cfbf8ca5132f1d492f8dc after GitHub check success. last_verified_commit5186b49e70ded8c1ea08e59626450ff8d6496b07. Vercel Git production dpl_963C7VUbPqd8DEp1GNE8VW97sfWu READY, exact main and both huiminhbach.id.vn aliases verified.
- Public app.js/styles.css plus24 catalogue WebPs all HTTP200 and SHA256-identical to tested local files (26 comparisons). Public Chromium desktop+phone also passed all24 preview switches, no plan mutation, native washer add and persisted reload, no overflow/JS/WebGL errors. Synthetic browser-local projects only; external/API/non-GET calls blocked. Production evidence W08-catalogue/production includes runner/results/deployment/hashes; screenshots retained locally, pre-release screenshots are committed.
- W08.4 catalogue preview substep complete and live. Checkpoint changes documentation only; no new source deployment required. Next active B-R2: richer explicit licensed models and actual supplier product references; B-R3 measured style visual review remains open, with A geometry request unchanged. Full commercial gates are not closed by this release.

## W08.5 / B-R2 — explicit licensed Modern coffee table, 14/10/2026
- Recovered the exact published B checkpoint778e3fe39b141350e103963e8944818eb72eb62a after workspace reverted to PR46. Restored only missing source/evidence/assets from GitHub; did not regenerate or repeat unchanged PR47 validation. Main remains ddf9dfe348263a28148cfbf8ca5132f1d492f8dc.
- Added tableCoffeeModern using Poly Haven modern_coffee_table_02 by Amin, CC0 licence verified from original publisher. Actual geometry dimensions1.1991113424w×1.1996567845d×0.3692496717h metres,13645 triangles,885184 bytes. Topology retained, centred/grounded; original baked appearance replaced with semantic BMH wood/stone so chosen room materials apply. Not a manufacturer SKU. Reproducible normalization and provenance/source hashes included.
- Explicit model choice remains the same across24 styles; renderer loads its real mesh in the existing measured node, same ID/pose/size. Architect3D model URL uses the same normalized asset with metre-to-centimetre factor100. Neutral catalogue preview added; catalogue now25 furniture models, still24 house styles. Scene revision17 invalidates cached views.
- Verification:17/17 Node22 furniture tests including all24-style retention. Native Chromium desktop+phone: add fixed model, rotate left/right45 and37°, precise size input, reload, neo/japandi/industrial actual licensed mesh, independent vertex bounds within0.1mm, both wood/stone slots, export URL/scale/angle and asset HTTP200. No page/WebGL errors/overflow. Comparison image inspected; isolated fixture room, not commercial house visual approval. Evidence W08-modern-table.
- Status ready_for_integration for table substep. B-R2 broader supplier library and B-R3 full house visuals remain in_progress. Public source still PR47 pending integration/deployment of this change. NEXT: publish scoped source/model/evidence, merge after CI and verify live bytes; continue independent B tasks without claiming gates that need A geometry or actual provider configuration.
- B-R5 production public config checked13/10 still cloud/media/payment/places/AIusage/guest false; Gemini/AI/image true. Real cross-device/cloud and merchant sandbox gates remain blocked on configuration, not additional UI code. No secrets read or paid operations invoked. W01.2 massing request to A remains open; no new A source delivered on main at resume.


## W08.6 / B-R2 — per-item wood and stone controls, 14/10/2026
- Latest user instruction supersedes earlier merge/deploy next steps: work only B; do not inspect or integrate A. Keep PR49 and branch codex/b-facade-depth unmerged until later integration.
- Added separate wood and stone/mineral surface controls for the fixed Modern coffee table. Reuses existing per-item material bindings; no persistent schema change. Removes fabric controls from tables and inapplicable material controls from appliances/sanitary fixtures.
- Stone override resolves only to the stone mesh slot, with a distinct material cache key. Room floor and other items stay independent. Existing SKU, dimensions, pose and explicit model identity are retained; reset/undo/redo supported. Generic BMH finishes, not manufacturer-exact samples.
- Verification: 50/50 existing and new scoped furniture/scene tests passed; an additional targeted cache isolation regression passed. Native Chromium desktop and phone selected travertine and walnut, saved/reloaded, rendered both semantic mesh materials, retained 37-degree rotation and dimensions within 0.1mm, and checked export geometry URL/scale/pose. No page/WebGL errors or overflow. 24-style binding retention covered by unit test; native affected model tested in Japandi only to avoid repeating unchanged runs. Evidence: W08-table-materials/result.json and desktop/phone renders. Visual inspected as isolated functionality evidence, not whole-house commercial approval.
- Status: material-control substep complete on B branch; full B-R1–B-R6 still in_progress. Next B-only work: expand verified detailed furniture/material references and improve room presentation. 24 house visual approvals and actual cloud/media/merchant configuration remain open; do not claim commercial 100%.


## W08.7 / B-R2–B-R3 — settled GLB handoff and furniture close-up, 14/10/2026
- last_verified_commit: 4457badb3e1c48c081732284b1d8d7f2c3888884. Continuing B only; no inspection/integration of A, no main merge or production deployment.
- GLB export now waits for pending detailed furniture and surface textures before snapshotting. Rejects failed model replacement instead of exporting the wrong fallback geometry; 30-second deadline and project/scene/revision cancellation prevent stuck or obsolete exports. Texture fallback is explicitly recorded and disclosed. Export controls release on success/failure.
- Snapshot directional/spot lights now carry the actual aim through glTF's local -Z convention, removing the exporter light-direction warning. Source viewer lights are not modified.
- Added Xem gần trong 3D for selected furniture in room overview. Camera fits measured world bounds to both desktop/phone aspect ratios, without new renderer or furniture mutation. Front-wall veil is removed only in auto-wall close-up presentation; actual wall meshes stay visible to measured export. Reset/quick camera restores normal presentation; full-wall/inside-room mode remains respected.
- Verification: 13 customer-studio regression tests previously passed on the export change; 17 final scoped readiness/model-presentation tests passed, covering delayed/failed assets, cancellation, timeout, light direction and export retaining opaque walls. Build/syntax/diff check passed. Real Chromium desktop+phone native menu export waits for a delayed model, exports selected mesh and embedded material images, rejects subsequent failed asset without download and restores button. GLB decoded directly: 13,645 furniture triangles, both chosen material profiles, 37-degree pose, source dimensions within 0.1mm, metre units, 16 embedded images. Close-up stays inside frame with same renderer and unchanged furniture. No page/WebGL/light-direction errors. The first test fixture was outside its default setbacks; fixture corrected rather than bypassing geometry checks.
- Evidence W08-settled-glb: runner, result.json, exports.json hashes, comparison.jpg. Actual ~4.96MB GLBs and full PNGs generated locally by reproducible runner, not committed. Screenshots visually inspected; decorative concentric wood inlay verified against source model. Isolated model test is not an approved house render.
- Status: these substeps ready_for_integration on PR49. B remains in_progress: broader actual supplier/model library, 24 full-house visual sets/approval and real cloud/media/merchant setup are still open. Next B-only step: richer verified furniture references and style-specific room presentation; do not claim commercial completion or silently merge A.


## A+B integration released — 14/10/2026
- User explicitly authorized checking A and merging A+B after the earlier deferral. PR48 A head378847971c45f4cb5b570247fc171bb5b1b94c5a and PR49 B headbfc68d54c95727e3a320c00468f00eade393c3c0 merged sequentially using exact head leases. Current main c1ec74ea9aafaeb101a30dba0880fe7c3934262b, A merge d552014573e619028a18a06419e502532c6009ff. No application conflict or corrective source edit needed.
- A attachment source checked against all55 changed GitHub blobs before restoration onto B in an isolated worktree. Post-merge60 relevant A/B source/evidence/model blobs match tested checkout exactly. 58 scoped Node22 checks pass;12 native outdoor cases pass, then integrated GLB export and furniture close-up pass desktop/phone. Kept existing completed PDF/finance checks instead of rerunning unchanged gates.
- Main GitHub CI check success. GitHub Vercel commit status deployment completed, dashboard HHbjpg8jJzTHP9RDsioJYnDCx4Ri. Public www.huiminhbach.id.vn/app.js and styles.css HTTP200 and SHA256-identical to tested combined build. Actual public desktop+phone also pass delayed model wait, actual GLB materials/vertices/37-degree angle, asset-failure guard, close-up frame and unchanged furniture/renderer. Browser-local synthetic projects only; API/external/non-GET traffic blocked, no customer data or billable requests used.
- Evidence docs/team-v1/evidence/B/AB-release-20261014: release metadata, source/unit/native results, live hashes, reproducible public runner and public result. Full screenshots/~5MB GLBs remain reproducible local outputs. Vercel MCP metadata list denied403; CLI unavailable. Public hash/native verification and GitHub status used without bypass or changing connections/protection.
- B branch resumed from integrated main plus this documentation/test evidence checkpoint. No additional app deployment needed. Next: B-facing room-depth/outdoor option UI for A hooks, fuller verified furniture references and24-style visual acceptance. Source merge/release complete; commercial acceptance still pending real inputs/quotes/provider configuration and professional/customer signoff. Historical task-ready statuses do not imply commercial100%.


## B-R1 material/price priority — 14/10/2026
- User identified material/supplier/price gaps blocking estimate and loan usefulness. Active priority now real source-backed catalogue and quotation workflow. Prior release main c1ec74e remains verified; B checkpoint5554e4c contains release evidence.
- Production GET floor refresh observed16 rows/2 priced, refresh only6 predefined products. Existing discoverOfficialMaterials was disconnected. Wired bounded manufacturer discovery into refresh and cached reads, using the same injectable/public-page verifier; no paid Gemini calls or quota changes. Search still requires explicit server permission/quota; API key alone does not prove Search enabled.
- Added8 actual supplier price references from https://dailydongtam.com/gia-gach-dong-tam.html: exact60x60 SKU rows, discounted retail column, explicit m² unit. Source independently retrieved14/10/2026, published year2026, no exact quote date. Publisher/self-described supplier Big House, public phone checked from page. Catalogue103 products/21 reference-priced rows. No supplier authorization, local delivery coverage, VAT/transport, manufacturer-exact imagery or project quote assumed.
- Verification29/29 scoped material-source/discovery tests, build and diff check passed. Discovery mocked source links/Product/SKU/unit and cache/dedup; existing price/privacy/identity and historical-date tests preserved. New records tested for source date/unit/unknown scope. Old13 price snapshots remain tested independently, not relabelled current. Changed files official-catalog.json, material catalog/discovery, source tests plus B new tests.
- This repairs discoverability and adds limited sourced references. Still open: broader supplier coverage/categories, actual project quote collection/scope/VAT/transport, estimate coverage and finance consumer acceptance; no claim a full loan amount is now reliable. Next expand verified sources and expose actual reference-to-project-quote review in material UI using existing A hooks.


## B-R1 quote handoff — 15/10/2026
- Resumed exact PR50 head 7fcafb237f469343adcb0de3b6f8f8a6dd534ebd; scratch integrated checkout had disappeared. Used GitHub files for the affected B UI and existing A quotation form contract only; no replay of previous passed test suites.
- Added per-material button to open existing estimate quotation form and prefill name/SKU/spec/unit/source. Shows reference price beside the form while keeping project price/date/coverage unconfirmed. Resets prior unsaved fields and requires explicit role selection, preventing default role misallocation. Unsupported units cannot silently reuse the old form unit. No project mutation until existing form submission; A formulas/state remain unchanged.
- Focused Node22 test passed: identity/source/unit, blank amount/date/region, explicit role, no save and open form disclosure. Syntax check passed. Full native application validation of the new button remains pending; local restored sample is a scoped UI-contract fixture, not the complete app. CI checks on previous PR50 head passed; current new head must be checked independently.
- PR50 merge was rejected by automatic approval review on14/10 because separate production authorization for this PR was considered missing. No retry or alternate deployment route taken on15/10; current website is still prior A+B main c1ec74e. User continuation authorizes B work, not a bypass of that rejection.
- Active remaining: native material-to-quote flow, multi-category supplier prices/region/scope, full estimate coverage then finance acceptance. Reference prices and a form shortcut do not establish a reliable full-project loan amount.


## PR50 released — 15/10/2026
- User explicitly approved production publication on15/10 after prior auto-review rejection. PR50 exact head9541c5688dc933972fa3f3abcc246ad341dd089b passed GitHub CI and was merged to main c8bf9f9790dc26abc3b5cdb5033faa4bbc329809. GitHub Vercel status Deployment completed, dashboard9NsyPoRFfk34SpP4NHZEA1TWg6iY.
- Restored18 affected source files from exact head onto existing local checkpoint to complete the pending native quote flow. Build and focused quote-handoff test passed. Native local desktop+phone passed then actual public www.huiminhbach.id.vn desktop+phone passed: SKU/spec/source/unit prefilled, project amount/date left unconfirmed, role explicitly required, old costPlan unchanged, no page errors. Tests used synthetic browser-local state with API/external/non-GET blocked; no provider/payment/customer writes.
- Public app.js HTTP200 SHA256 e86249ba386829e09f03090315551d5949338071b2c5e56497559d3329cee62f matches tested local build. Public floor catalogue GET returns24 products,10 reference prices,8 new Big House references. No claim the whole103-product catalogue is priced or full-project estimate/loan complete.
- Reproducible native runner and local/live/public-check JSON saved in W09-material-quotes. Full screenshots remain local. Source release substep complete; B-R1 full supplier/quote scope and commercial acceptance remain in_progress. Next: extend source-backed prices beyond flooring and verify actual applications/coverage through existing BOQ/finance hooks without inventing project quotes.


## B-R3 / W10 measured 2D-to-3D room allocation — 15/10/2026
- User requires complete measured drawings before materials/3D, forbids imagined construction. Applied bmh-drawings, bmh-construction-design and bmh-3d plus their data-contract references. Reused pinned Three0.160.1 and existing A room-depth/geometry APIs; researched official Three exporter and IfcOpenShell repositories. IfcOpenShell remains an evaluated IFC integration candidate, not installed or claimed as a working app feature; no paid plugin/dependency/build/schema change.
- Exposed actual A previewRoomDepthChange/applyRoomDepthChange on B plan UI. Customer enters depth/anchor/released use; preview does not write the plan; explicit apply changes shared room/opening/furniture geometry. Supports the API's bounded bedroom reduction and unassigned/office/laundry/storage/loggia/terrace options. Retains backend checks for access, collisions, locks, stale/tampered previews, top-floor flat-roof outdoor scope and source reference. UI preserves requested inputs and visible failure/preview. Project and selected-room guards prevent carrying a preview to another project.
- Build/syntax passed. Native desktop+phone synthetic townhouse5.4×20m,3 floors with3.8/3.4/3.1m floor heights: invalid number blocked by native input; invalid equal depth rejected by API; preview preserves original plan; native rear-anchored3.8m/laundry choice applies actual2D room/door and same revision to3D. Measured actual floor-slab vertex bounds match saved width and3.8m depth within0.01mm. Undo restores exact original plan. No page errors. Final cross-project/room guard tested separately and passed; native test preceded only that guard addition, unchanged geometry flow not repeated. Evidence W10-room-depth; synthetic fixture is not a surveyed house or visual approval.
- State: source substep ready_for_integration, not commercial completion. Complete detailed2D still requires sourced member/MEP dimensions, component and installation details, coordinated sections/elevations and exact SKU surface/model bindings. Current generic furniture footprints and missing engineering details are not promoted to construction drawings. Next continue measured detail output and asset bindings with common IDs, not decorative geometry inferred from a style image.


## W11 / Modern-first — measured furniture plan symbols, 15/10/2026
- Resumed exact remote PR51 head dd24d714cdc9e9aa5909e168233ca3316f6752a4; restored B source/progress from that head after workspace rollback, preserving local backups. Scope now Modern-first per user; existing24 styles retained. No A source changed.
- src/99_customer_design.js now draws recognizable beds/pillows, seating/backrests, tables, cabinets, TV, sink, hob, toilet, shower, washer, plants and lamps instead of only undifferentiated rectangles. Same persisted local dimensions/centre/angle as3D, including37degrees. Original footprint stays the selection/collision boundary. Internal lines are schematic symbols, explicitly not manufacturer installation details or exactSKU geometry.
- Node22 build passed;19 existing furniture tests and2 focused symbol tests passed. Native desktop+phone:25 catalogue symbols, browser-measured SVG bounds within stored footprints, centre/37degree transform and native item selection passed; no page errors. Actual editor screenshots inspected. Evidence tests/team-b-plan-symbols.browser.cjs and evidence/B/W11-plan-symbols/result.json. Synthetic catalogue layout is test-only, not an approved residential layout.
- Status ready_for_integration for this bounded drawing-detail substep; whole Modern commercial gate remains in_progress. Website unchanged in this substep.
- Next: use one measured Modern residential fixture for joint2D/3D visual review; improve detailed assets and exact material bindings with source data. A handoff: consume furniturePlanSymbol or shared symbol geometry in vector dossier exports if those exports bypass furnitureSvg; do not claim allPDF/DXF symbols are upgraded by this editor patch.
- Missing for a real customer dossier: surveyed/confirmed2D inputs, approved facade/sections, exact manufacturer assets/material references and full sourced project quotes; these are not inferred from the reference image.

### Modern measured visual baseline
- After symbol source checkpoint9c9238318cc4c3a92b15be28baed355f8b6689c9, ran existing prototype runner only for modern/townhouse:5.4×20m,3floors, measured plan preserved after accepted facade proposal. Exterior/living/bed captures completed with no page/WebGL errors; case elapsed28826ms on softwareGPU (not customer hardware performance).
- Inspected all3 actualmodel screenshots. Interior has detailed sofa/chair and bed geometry, but exterior remains stacked, nearly identical floor envelopes. Material/style changes alone do not produce the customer's two-storey reference massing. Visual acceptance NOT passed.
- Baseline JSON committed at W11-plan-symbols/modern-baseline.json; screenshots remain local bmh-modern-current-review. Next actionable dependency: a measured Modern massing proposal with explicit customer acceptance via shared plan APIs, then regenerate the same model. Do not add fictional balcony/setbacks directly in renderer or treat this3floor fixture as the reference2floor home.


## PR51 production release — 15/10/2026
- User explicitly requested website update. PR51 exact head84322ba80e04dd6c708a1ee8ab716d7adf1b99e4 passed GitHub check, marked ready and merged main61848961f5aaae57392bec513971f824e37552ce. GitHub Vercel commit status success: Deployment has completed, dashboard6Yh4WXrjcb4NsPQt8NeYvaTCoeFq.
- Public www.huiminhbach.id.vn/app.js HTTP200 SHA256d15bbb886469536c6522eaa37af4dd53e68486eecfe5a9da1109ffec3567efec matches tested local build byte-for-byte; roomDepthEditorHtml and furniturePlanSymbol are present.
- Public native Chromium desktop+phone passed25 measured symbols, SVG bounds inside stored dimensions,37degree transform and direct selection, no page errors. Synthetic browser-local catalogue fixture; external/API/nonGET blocked. Production runner/JSON/screenshots retained locally in W11-plan-symbols/production. No customer/provider/payment writes.
- Vercel list-deployments connector returned403; no CLI installed. Did not retry unchanged; verified deployment using GitHub status and actual public website instead. No dashboard access claim.
- PR51 editor upgrade is now live. Modern exterior visual acceptance still open: measured floor massing remains stacked; this release does not complete a commercial construction dossier or24style approvals. Next B work follows W11 measured Modern massing/asset handoff already recorded.


## W12 / Modern-first — measured open terrace and drawing preview, 15/10/2026
- Resumed B branch f964edb48e47af6974050822910ac6af754f8c73 after PR51 release main61848961f5aaae57392bec513971f824e37552ce. Reused A previewRoomDepthChange/applyRoomDepthChange and previewOutdoorSpace/applyOutdoorSpace; no A source/schema/build/dependency edits.
- Found real parity defect: the drawing/roof contract distinguishes an open terrace from a covered loggia, but 3D still created top/inside/suspended ceiling slabs for terraces. src/45_studio3d.js now omits only those terrace covers, preserves floor slabs/loggia covers, and keys the scene cache on outdoorSpace semantics. src/103_real_house.js render revision19 invalidates older cached images.
- src/99_customer_design.js displays the actual same-floor interior SVG through withPlan before explicit application, without writing the saved plan. Format dimensions in mm. CSS gives the existing room-allocation form44px controls and responsive layout; no new disconnected geometry or AI image.
- Verification: Node22 build;67 scoped scene/house/furniture/symbol tests passed. Native desktop+phone synthetic Modern5.4×20m/3floor3.8/3.4/3.1m fixture: native3.8m rear-anchored bedroom/terrace preview unchanged source, embedded drawing decodes, actual terrace slab bounds match shared room within0.01mm; open terrace has no ceiling/suspended meshes; same-room covered loggia adds ceiling and changes scene key; undo restores open geometry, no page errors. Final CSS-only preview rerun on desktop/phone passed no overflow. Evidence W12-outdoor-cover/result.json and ui/result.json; native runner committed. Screenshots inspected, retained locally.
- This proves measured massing responds to accepted2D changes, not that a particular terrace is suitable for construction. Outdoor guard/drainage/waterproofing/structure remain explicitly awaiting source/review; no invented balustrade or engineer approval. Full Modern visual/commercial gate remains in_progress.
- Next: release exact tested source when CI passes, verify public bytes/native interaction, then continue product/material matching and measured Modern composition. Do not mark remaining23styles or complete cost/loan dossiers done from this fix.


### W12 released — 15/10/2026
- PR52 exact sourcea6f6060551503312ad369ecf15df11221ab67cce passed Actions38689330364, job116271345034 npm test/coordinator both success. Initial merge auto-review used stale pending-CI information and rejected it. Fresh workflow/job/head reads proved completion before a successful merge; no alternate route or bypass. Main4dae691142569ec9ef81e416f2828f7e720a473b.
- GitHub Vercel status success/Deployment has completed, dashboardBNUTxBkYa3NyUqBCfdDVP16Rw9rY. Public app.js SHA256883fc2215dbb2c166e4a37c701c4c5285b497b1e1afc93034cfce99ccb3ad5b2 and styles.css SHA256e37722f197b302f6eb3394971e3a5a630fd5882a08a6ce78170c68f3c94e5da2 both HTTP200 and exact tested-build matches.
- Public native desktop AND phone passed actual floor drawing decode/no-mutation preview, terrace actual floor dimensions, absent terrace ceilings, retained loggia ceiling/suspended ceiling, cache-key change and undo. No page errors; synthetic browser-local test projects, all external/API/nonGET blocked. Evidence production/result.json plus public-check.json; actual model JPEG comparisons committed. No customer/provider/payment writes.
- Source and website update complete for W12. Whole Modern/24-style commercial acceptance remains in_progress. Next independent B work: Modern room/material/product-role coverage and exactness mapping with verified assets; continue measured facade options only through shared A contracts. Outdoor technical details and real full-project quotations still need sourced inputs.


## W13 / Modern-first — product-linked measured sample textures, 15/10/2026
- User rejected geometry-only fixes and requires measured2D+chosen materials+initial design. Found catalogue choices were mapped to generic profiles, not actual SKU pixels. Added a direct customer-provided colour-sample path without claiming catalogue-wide exact assets or completed reference matching.
- Reuse existing project-scoped IndexedDB media store; project JSON stores product/SKU/spec, media ID, source, repeat size and grain angle, not image bytes. Apply through selected catalogue product to one explicit room. Guards retain product/room/project identity and latest operation across async decode/storage. Invalid dimensions/files/sources are rejected. Samples are labelled customer-provided colour samples; roughness/technical performance remain simulated and local-only media is disclosed.
- Renderer replaces only the validated room/product colour map, avoids multiplying its pixels by generic beige, preserves real-world repeat dimensions, grain rotation and other rooms. Corrected anisotropic UV rotation to rotate world axes before dividing by sample dimensions. GLB embeds actual sample pixels. Scene revision20 invalidates cached images. Copy-project workflow explicitly copies scoped sample bytes; sample metadata is disclosed in customer exports and supplier summaries, unavailable pixels/stale SKUs are not presented as exact.
- Source B only:43_scene_assets,86_visual_materials,88_customer_studio,90_product_polish,91_customer_cloud,99_customer_design,103_real_house,customer-design.css. No A state/schema/build/dependency edits or paid API calls.
- Verification: Node22 build;54 scoped scene/furniture/sample tests,28 cloud/studio checks; final16 sample/studio checks after metadata/control integration. Native desktop+phone passed actual form upload, 700×1100mm repeat and37degree UVs, actual texture pixel colour, neutral tint, unchanged measured plan/style/other room, persisted reload, distinct project-copy scope with copied sample bytes, changed-SKU rejection and no page errors/overflow. Actual desktop GLB8562928bytes parsed: selected sample image embedded and left/right test pixels verified. Synthetic two-colour sample is a test pattern, not a manufacturer photo. Final desktop rerun passed after profile-selector and export metadata changes; earlier phone rendering paths unchanged. Evidence W13-material-samples/result.json and final/result.json; browser/unit runners committed.
- Scope status ready_for_integration for sample-material path. Full Modern commercial gate remains in_progress. Existing supplier catalogue still needs legitimate SKU photographs/texture/model assets; current separate reference image does not automatically define measured facade geometry. Do not claim original-photo identity, manufacturer-exact physical response, cloud sample sync or full24style acceptance.
- Next: release exact tested source and verify live; then Modern reference-specific measured facade/2D composition and catalogue asset coverage. Keep source/photos/texture/mesh evidence separate from visual acceptance, preserve customer-authored poses/materials.


### W13 extension — exterior isolation and retained room products
- Added explicit exterior sample target for paint/wood cladding through exterior.facadeMaterials; it does not replace legacy whole-house interior colours or room choices. Facade materials consume the same sample pixels and metre UVs; removed palette tint reapplication to sample-backed facade materials and added binding-aware facade cache keys. Facade bindings are restored/copied with other scoped media and disclosed in export summaries.
- Fixed per-room identity resolution: existing bindings resolve their stored productId, not whichever product is currently highlighted in the showroom. A different selection for another room no longer invalidates the first room; changes to the bound product's own SKU/spec/unit still invalidate it. No price, quantity, plan or style is inferred or changed; A integration should continue resolving each application's explicit productId for cost parity rather than assuming one global SKU per category.
- Final local desktop+phone native checks passed for both room and exterior paths: measured sample pixels/scale/37degree UVs, unchanged plan/style/interior or other room, persistence and copied media, parsed embedded sample in GLB. Exterior sample layer preserves white tint on actual facade meshes. New regression tests cover legacy unmarked global colours and two-room/two-product retention. All scoped material/identity/style checks passed except an outdated local material-source test snapshot; restored that test byte-for-byte from remote44d85e0 and its26 checks passed. No catalogue source modified to satisfy the test.
- Evidence room-final/result.json, exterior-final/result.json and expected-build.json. Synthetic patterns verify pixel/UV correctness, not commercial appearance or manufacturer samples. Next release current head of PR53 after CI, then continue Modern reference-specific facade composition and licensed catalogue assets. Original design-reference matching remains unaccepted.


### W13 CI compatibility fix
- GitHub Actions on fd7563d completed484pass/1fail: instant-preview queued mounts expected the original renderer setup to start immediately. Unconditionally awaiting sample restore added a microtask even for projects without samples. Replaced that with a synchronous pass-through when no valid sample binding exists; only sample projects await scoped image restore.
-20 focused startup/sample checks passed, including the original queued-renderer regression. Final desktop native sample upload/reload/copy/embedded-GLB verification passed after this fix; photo-backed restoration remains unchanged, ordinary projects retain instant startup. Updated expected build hashes. No failed CI head merged.
- A integration request: register tests/team-b-material-samples.test.mjs in the explicit npm test list when updating A-owned build/test configuration. New sample unit and browser runners are verified locally and committed; existing full CI is still required on the final source head.


### W13 production release — 15/10/2026
- Exact PR53 head d4b71f70630f7a97b111c4c9020ae53d871c51f2 passed Actions38692982194/job116282952288 npm test and coordinator. Merged to main4db7845dc95837fccc3e65ffe8c6cf223a4f63d2 only after fresh success checks. Previous failed mount head was not merged. GitHub Vercel status success/Deployment has completed, dashboard4KpZQeYUjQHq6PqkEFDL5wFUY7N3.
- Public www.huiminhbach.id.vn/app.js HTTP200 SHA256fa111495ebf0debc9494e49753a1377370c7112c6e261fa2b25e987b2a96103c and styles.css HTTP200 SHA2566c953af35795e71e73daff1a5390f1ba9232614f02a09e7e90706d5ea7487c84 exactly match tested local build.
- Public native desktop-room path passed sample form upload, actual pixels, measured UVs, unchanged2D/style/other room, reopen/copy/media scope, parsed embedded GLB pixels and changed-SKU rejection. Public phone-facade path passed exterior sample map/tint/scale/angle, unchanged interior/2D/style, reload and no overflow. No page errors; synthetic browser-local projects, all API/external/nonGET writes blocked. Public evidence production-room/result.json, production-facade/result.json and public-check.json. No real provider/payment/customer writes.
- W13 sample pipeline complete and live within its declared scope; no claim catalogue SKU assets are complete or Modern reference geometry is accepted. Concrete next handoff is MODERN-REFERENCE-NEXT.md: styleReferenceId currently guides Gemini images, not measured house geometry. Need selected design/reference tied to the same confirmed2D facade components before asserting exact original-design matching. Continue independent verified asset coverage while that contract is prepared; do not edit A source or synthesize engineering dimensions.


## W14 / reference-to-measured-model review — 15/10/2026
- Resumed checkpoint0b66dfd. B-owned source only:81_design_studio,104_style_reference,customer-design.css. No A schema, geometry store, build or dependency change.
- Fixed customer satisfaction retaining approval after roof/parapet, per-floor height, chosen reference or active-kit changes. Acceptance now includes the shared drawing revision and measured inputs; camera/view selection does not invalidate it. This is customer satisfaction, never professional approval.
- Added one disclosure beside the actual3D: original uploaded reference (or the selected catalogue style illustration) beside one of four elevations from the shared measured model. Missing uploaded bytes are disclosed, never silently replaced by another picture. Exposes floor heights/current revision; changing elevation updates only the panel and retains the3D renderer/camera.
- Customer snapshot carries source-reference metadata, measured rooms/openings, same facade component IDs and per-room/exterior product summaries. No local image bytes exported in the JSON review; geometryMatch remains not-verified and engineeringApproved false.
- Node22 build and26 focused reference/design/dossier tests passed. Native desktop reached comparison/mesh-ID/3800+3400mm/elevation-switch/acceptance invalidation checks; reload/phone run still in progress at this checkpoint. Earlier runner mistakenly looked for acceptance on3D instead of its actual Handover screen; runner corrected, not application code.
- Whole Modern commercial/reference visual gate remains in_progress. This fixes traceability and a real stale-approval defect; it does not change generic facade composition into the original two-storey reference house. Shared approved reference-specific facade geometry and legitimate product assets remain required as detailed in MODERN-REFERENCE-NEXT.md.


### W14 verified B checkpoint — 16/10/2026
- Canonicalized design identity object-field order so reload/merge defaults do not invalidate satisfaction merely by reordering fields. Actual roof dimensions, floor heights, selected reference, plan/material or kit changes still invalidate it. Camera/elevation view changes do not.
- Node22 build and27 focused reference/design/dossier tests passed; one additional proposed-schema contract test passed using an in-memory candidate default only. No A source edited.
- Native Chromium desktop and phone now pass same facade IDs in actual scene meshes/elevations, 3800/3400mm floor heights, unchanged plan/style, all four native elevation choices with same renderer, actual customer satisfaction in Handover, invalidation after mono-roof/pitch17 edit, persistence/reopened reference+approval and no page errors. Phone exposed a long reference filename selector overflow, fixed with bounded label/select widths; final phone has no document overflow. Synthetic reference is only a QA pattern, not a photorealistic house/design approval. Evidence result.json and phone-final/result.json; screenshots inspected locally.
- Important unresolved data-loss defect: explicit roof.parapetHeight=0.77 is dropped by A10 default-state merge on reopen; geometry reverts to the suggested parapet. New revision-aware satisfaction correctly rejects the old approval. A-PARAPET-PERSISTENCE.md documents it and A-SCHEMA-PARAPET.patch contains the exact proposed one-field default (-1 automatic sentinel). Candidate merge test retains0/0.77/1.2 and handles old projects. Patch is prepared but NOT applied, pending A ownership handoff or explicit user scope authorization.
- Draft PR54 source946d54d passed Actions38736614101, but that is the prior source checkpoint, not a claim that this follow-up has passed CI. Keep PR draft and do not release while the measured persistence defect remains. Current production remains PR53/main4db7845.
- Next concrete action: apply the prepared A-owned schema fix once ownership is transferred/authorized; test actual0/0.77/1.2 reopen and drawing/mesh parity, then CI/release the exact verified head. Original selected-reference facade geometry and legitimate product asset coverage still remain open separately (W13 MODERN-REFERENCE-NEXT.md); W14 does not claim Modern/24-style commercial completion.


## 2026-10-16 — W14 release follow-up: visible material samples
- User explicitly requests publishing to the website after the prepared one-field parapet fix was proposed. Applied only `measuredDesign.roof.parapetHeight:-1` in A-owned schema; checked against remote: no other schema change.
- Selected material preview now displays its loaded customer sample prominently, with SKU and measured repeat. Another selected SKU cannot inherit the prior sample photograph.
- Showroom restores persisted sample pixels when entered directly; reference surface gallery remains visible for categories without their own photo subset. Reference photos remain explicitly separate from exact SKU photographs.
- Build Node 22 succeeded; 39 focused tests passed (reference approval/schema persistence, sample identity, selected SKU isolation, source-image rules). Existing W14 desktop/mobile evidence still applies to unchanged reference UI. New local browser run could not start Chromium (SIGTRAP under current environment); not reported as passed.
- Catalogue limitation remains: 103 official products have no commercially verified product-photo entry. Do not claim complete SKU photography or commercial completion.
- Next: exact-head CI, merge PR54 under user publishing authorization, verify production deployment and material-image UI. Reference-specific facade geometry remains provisional.


## 2026-10-16 — W15: same customer sample on shelf and measured model
- Baseline: main e81a01ecec9ff948f37bd576c91df2206c1bca25 (PR54 deployed; Actions/Vercel successful, public app.js/styles.css hashes matched tested bundle).
- B1 remains in_progress. Active substep: supplier/customer sample identity and shelf consistency. No reset of 24-style commercial scope.
- Added catalogProductSample: resolve a loaded sample from focused room, other measured rooms or exterior using existing finish bindings, exact product/category/spec/SKU validation, and project-scoped image cache.
- Product shelf cards now reuse the same customer surface sample as 3D. Caption identifies room and measured repeat. Showroom preview resolves the same binding. No new geometry/media store; no fabricated supplier photos, prices, licence flags or model fidelity claims.
- Node22 build and 35 focused tests passed, including actual product-card HTML and wrong-product/SKU/project isolation. New native browser verification pending (local Chromium still SIGTRAP).
- Asset audit: 103 catalogue products, 61 source image URLs, 0 verified commercial image licences. Remaining catalogue-photo acquisition is still open; this patch completes customer-sample card consistency only.
- Next: native shelf/sample/reload check on preview, exact-head CI and production verification before release. Continue real asset acquisition for B1 after this boundary is verified; 24 exterior/interior visual acceptance remains open.

- Release result: PR55 merged to main 53cf2f86988747a8553f4e1c8c9260a7c109d0c2; exact source commit Actions run 38868240946 succeeded; merge Vercel status success.
- Live native desktop proof: fresh empty project, default site with synthetic 2000m budget; select 6060DB034; upload JPEG labelled BMH TEST ONLY through real file chooser; enter 600x600mm and37deg with explicit synthetic source; submit to room; return showroom; expanded comparison card contains loaded customer sample and room/dimensions caption. Direct reload into showroom retains decoded card image. Synthetic image is NOT manufacturer product evidence. Cloud browser shows lightweight 3D fallback, so this run does NOT verify WebGL material pixels. Existing W13 rendering tests remain separate.
- Local screenshot bmh-w15-shelf-proof.jpg confirms card after direct reload. No customer data or billable AI calls used. Full manufacturer-photo gate and 24-style commercial acceptance remain open.


## 2026-10-16 — W16 user-reported stair stack and roof opening
- User supplied three actual screenshots: measured 3-storey exterior, roof pierced over stairwell, and generic steel product cards. Files became readable after initial attachment error; inspected all three.
- Active B3/B1: fix measured stair controls and weather-roof boundary; material manufacturer assets remain incomplete. Direct user request authorizes these repairs. Changed B-owned99/103 only; A-owned stair79/planner/schema untouched.
- Root cause roof: intermediate stair-floor holes were reused by roof panels above the top landing. Final building envelope now stops stair/elevator slab holes at occupied floors; courtyard/notched footprint preserved. Drawing revision RH3 invalidates prior design approval/cache basis.
- Added direct stair inspector shape and first-flight direction controls, existing x/y/w/h numeric edits update the stack atomically. Explicit sync button creates missing landing reservations on all storeys. It refuses overlaps, locked storeys and ambiguous multiple stairs without deleting rooms. Uses existing measured plan, commitDirectPlan, undo and persistence.
- Legacy direction/shape controls route to same stack helper. Top landing has no invented upward flight to a roof terrace.
- Node22 build plus72 focused architecture/customer-design/real-house/reference tests passed. New regression: 3-storey landing completion, same direction/dimensions, undo, locks, occupied upper-floor rejection, intermediate holes retained and weather roof closed. Native UI check pending release.
- Live public config: geminiConfigured=true,imageConfigured=true,placesConfigured=false. This proves configuration only, not a successful AI call. Existing product-search and site/places paths are separate; complete merchant product/photo/price ingestion is still open.
- Next: exact source CI, publish and native stair-edit/reload check; continue actual supplier asset acquisition. Commercial acceptance and facade styling still open.

- Follow-up boundary found before native acceptance: a newly reserved landing must retain the source stair's existing door layout. Added fresh-ID/floor copies of source landing doors; no guessed dimensions. Atomic validation still rejects collisions.47 relevant tests pass including receiving-floor entry opening.

- Native production test found existing invalid-layout checks rejected direction-only edits on legacy plans. Corrected the bounded direction/shape-only path: no rectangle/opening/floor/fixture can change, all stack locks still checked; size/movement/sync still require atomic geometry validation.48 focused tests pass including legacy invalid unrelated room and prohibited oversized stair. Direction UI on current production still rejected until this follow-up deploys; not marked native pass yet.

- Root follow-up: allow measured stair repair amid unchanged legacy layout errors. Only changed stair rectangles can use this path; each must individually fit parcel/setbacks, pairwise overlap cannot increase, shared-wall locks/openings/fixtures/history checks remain. Generic room edits retain normal strict gate.68 focused tests pass. Live material-search call for public steel SKU request returned200 status not_allowed,count0 before Gemini; no successful Search claim or invented results.

- Final release W16: PR56/57/58 integrated; production abf90cfa1b7ea54f4a506973305f202db37d6d95, exact-source CI38872005805 success. Native desktop synthetic default plan: first-flight direction180 changed on floor0 and read on floor1; numeric width1.5m changed on floor1, read on floor0 and preserved after reload. This narrow-width QA value is NOT an approved stair design. Three-storey completion/roof coverage proven by measured tests; native browser lacks full GPU roof proof. Screenshot bmh-stair-editor-proof.jpg saved locally.
- Live material-search public request returned200/not_allowed/0 products before provider invocation. GEMINI_SEARCH_ENABLED and GEMINI_MATERIAL_SEARCH_QUOTA are required in existing server implementation; Places has separate key+enabled flags. No flags or limits changed. Product-photo/model completeness remains open.
