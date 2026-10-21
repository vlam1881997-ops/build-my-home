# Tiến độ AI A — BMH commercial v1

Chỉ AI A sửa file này khi thực thi. Ngày cập nhật: 21/10/2026.
- role: A
- status: in_progress
- active_task: U1-A01 / U1-A02 (gói5bản/2ChatGPT do chủ giao vai tròA ngày21/10)
- active_substep: U1-A01 baseline checkpoint98c96e2 ready; U1-A02 saved material/BOQ guard implemented and locally checked, awaiting exact Node22 CI and actual B supplier/native handoff; prepare U2-A01 independently.
- target_branch: codex/a-massing-20261013
- actual_branch: codex/a-massing-20261013
- source_baseline: 8a03c900459cb2b4df03fd11ed8846ed2c0d400b (PR75 common planning source; runtime e73e0af; production PR74 main ad575e57)
- last_verified_commit: e73e0afbc85d4596c806882d8af1d6af10f5ea75 (prior exact Node22 CI39525474492 PASS; not native evidence for later patches)
- last_native_verified_A: 43a66a9587bedf2dfb1fea756897fac840cc3edc (historical A outdoor handoff; later native acceptance must use the actual current candidate)
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

## R1/R2 — tiếp tục từ PR #47, 13/10/2026

- PR #37 đã merge (`42d8653`), không còn Draft đang làm. Main hiện đã qua PR #47 (`ddf9dfe`). Các ghi chú C08/PR37 ở trên là lịch sử, không phải trạng thái PR hiện tại.
- B `codex/b-facade-depth` đã có checkpoint `778e3fe`: rotation/model bounds/washer/catalogue PR43–47. Giữ nguyên các file B; không làm lại phần đó. W01 A-massing-request còn cần A cấp hình học.
- Tạo continuation `codex/a-massing-20261013` / `bmh-codex-a-massing` từ PR47, giữ hai worktree A cũ và generated WIP. Checkout dùng sparse cho asset/evidence chưa tải; không xem đây là gói app đầy đủ asset.
- R1: fixtures TEST-ONLY 5.4×20/3F, 14×20/2F, ranh lõm 176m²; nguồn giả lập được ghi rõ, Bắc/quy hoạch unknown, review awaiting-review. Bộ test nạp envelope/parcel gốc thay vì dùng rectangle stub.
- R2: tái hiện phòng ngủ nhà phố 3.98×12.38 m. Nguyên nhân bộ packer chia hết chiều sâu dư vào các phòng. Thêm `previewRoomDepthChange` / `applyRoomDepthChange` ở module A đang được đăng ký: khách chọn phòng, chiều sâu và cạnh giữ; xem số đo/diện tích trước–sau, kiểm cửa/lối đi/locks/nội thất, rồi commit qua editor hiện có. Không tự sửa generator hoặc tự áp dụng.
- Phần nhường ra `unassigned` / `awaiting-review`, giá null/unknown. Chưa tự khai báo loggia, ban công, sàn sân thượng hay kết cấu. Không có geometry store mới.
- 54/54 kiểm tra component đạt Node24.19.0: ba ranh thực, preview bất biến, apply đúng preview, stale/tamper/locks bị từ chối, giữ phòng/thang/ID/SKU/góc37°/tombstone, undo/redo và lưu/mở lại. Build hiện có đạt. Browser runner đã viết nhưng Chromium cũ bị truncated (ELF thiếu section headers), launch SIGSEGV; chưa chạy được desktop/mobile. Node22 chưa sẵn có trong môi trường này.
- Thử thêm real-house suite: 66/68 đạt, 2 lỗi ENOENT do asset photographic-provenance và modern-armchair-facing chưa tải trong sparse checkout. Không gọi đây là regression production hay full suite xanh.
- Codex Security `security-diff-scan`: đọc được skill nhưng reference config-preflight không đọc được và capability scan không có; chưa có báo cáo scan chính thức. Dependency không thay đổi.
- Next action: B nối hai hook vào UI xem/chọn phương án; A mở rộng phân công năng khoảng trống/stepback theo lựa chọn khách và xác minh A3/DXF/roof/BOQ cùng revision. Khôi phục runtime Node22/browser rồi chạy runner sáu ca; chưa merge/release/production.

## Checkpoint 14/10 — R2 allocation, R3 exports, R5 prepayment

- Base giữ PR48 `833fef7`, main PR47 và B `778e3fe` chưa đổi khi đọc 14/10. Giữ cùng nhánh A, không sửa B.
- Preview có 4 lựa chọn: chưa phân công năng / làm việc / giặt / kho. Cửa riêng tiếp giáp corridor, chuyển cửa sổ ngoài có danh sách thay đổi; không tự dời phòng theo style. So phương án có assessment/giá provisional, giá nguồn thiếu giữ null.
- 62/62 kiểm tra Node22.23.0 đạt; build/syntax đạt. Trả trước cuối tháng có nguồn và phí riêng, recast giảm khoản trả/giữ kỳ hạn; thiếu phí không thành0. Đã nối form A5 hiện có, không chạm UI B.
- Xuất102SVG A3 +8DXF trên3fixture; ezdxf0errors/0fixes, số đo ranh/phòngmm và revisionBOQ khớp. RenderSVG và xem contact sheets/chi tiết; chưa có nativePDF mới.
- Môi trường Node22 khôi phục được. Chromium cũ bịtruncated; auto-review từ chối tải browserthay thế với lý doquy tắc dùngbrowsercó sẵn. Không tìmđường vòng. Cầnchủsảnphẩm cho phép thay QA browserhỏng trước khi chạy native/PDF.
- next_action: sau khi được phép khôi phục browser, chạy native6ca vàexportPDF; B nối `compareRoomDepthOptions` / `applyRoomDepthChange`. A tiếp tục hợp đồng không gian ngoài trời/mái/railing theo mộtnguồngeometry, không mô tả việc chia phòng kín là loggia hoàn tất.
- blocked_inputs: quyền thay browserhỏng, capabilityCodexSecurity, consumerUI/3D B, hồ sơ/quotes/chuyênmôn thực. Không mark COMPLETE, không merge/deploy.

## Checkpoint 14/10 — A-only native/PDF, phạm vi mới của chủ sản phẩm

- Chủ sản phẩm đã cho phép thay Chromium QA hỏng. SHA512 package được xác minh; Chromium133 chạy được. Blocker browser cũ đã được giải quyết, không còn cần xin phép lại.
- 148/148 kiểm tra A trên Node22.23.0; native desktop/phone6ca massing và2ca A5 form đều đạt. A5 trả trước tháng3 có phí, giảm khoản tháng4 đúng phép tính độc lập; lưu/reload, malformed fee atomic, revision ổn định.
- 102 trang PDF native pdf-lib (34/33/35) được render toàn bộ; A3/searchable revision/vector đã kiểm. Revision khớp bộ SVG/DXF/BOQ đã xuất, không dữ liệu thật/không signoff.
- Test tái lập mới: team-a-finance.browser.cjs và team-a-massing-pdf.browser.cjs. Không sửa source production, package/build hoặc file B. Không dùng lượt commercial browser bị ngắt làm bằng chứng hoàn tất.
- Chỉ làm A từ checkpoint này. Hoãn rà nhiệm vụ B và ghép A+B theo chỉ đạo 14/10; chưa merge/deploy. Các yêu cầu consumer B ở checkpoint trước được giữ làm lịch sử.
- next_action_A: hoàn thiện hình học/nguồn/review không gian ngoài trời A2, không đổi nhãn phần dư thành loggia; tiếp tục BOQ/phạm vi thiếu và bàn giao A. Giá, Bắc, quy hoạch, kết cấu/MEP không có nguồn giữ unknown/awaiting-review.
- Remaining gates riêng: semantics ngoài trời chưa xong; Security preflight/capability chưa có; hồ sơ thực chưa cung cấp. Không tuyên bố toàn TASK A đã hoàn thành.

### A3 revision guard — 14/10

- Source `96_vector_pdf.js`: kiểm trước toàn bộ tờ A3 cùng revision và đúng đơn vị m/mm; từ chối revision thiếu/unknown/khác nhau trước khi nạp font/PDF. Chụp chuỗi SVG trước async để caller không thay trang giữa lúc xuất.
- 3/3 kiểm tra chống trộn revision/khổ/đơn vị đạt Node22. Xuất lại native 3PDF/102trang đạt sau sửa; parser độc lập kiểm PDF/SVG/8DXF/BOQ/quantities cùng revision. Bằng chứng combined-export-validation.json và pdf-revision-tests.log.
- Chỉ sửa file A, không rà hoặc sửa công việc B. Giữ PR48 Draft; phần không gian ngoài trời A2 chưa được đánh dấu hoàn tất.

## A-only handoff — 14/10, outdoor contract verified

- Active branch `codex/a-massing-20261013`, PR48; last_verified_commit `43a66a9587bedf2dfb1fea756897fac840cc3edc`. Current checkpoint identity comes from git log; exact tested patch hashes are in `evidence/A/outdoor-final-20261014/source-hashes.json`.
- A2/A3/A4/A6 outdoor source contract is ready_for_integration in the documented scope: top-floor loggia/terrace, flat roof without overhang, explicit customer selection. Open-edge walls/roof/ceiling/slab, A3 detail, DXF millimetres, BOQ missing scope and technical review share one plan/revision. Legacy balcony geometry stays unchanged until explicitly declared.
- Verification: 160/160 Node22 A tests; 12/12 native desktop/phone cases; six native vector PDF dossiers /208 A3 pages, corresponding SVGs,16 DXFs with independent units/revision/geometry checks. Evidence and reproduction: `evidence/A/outdoor-final-20261014/README.md`. Earlier statements that outdoor support is absent are superseded by this bounded implementation.
- Source only in A-owned modules/tests; package.json, build script, server, Vercel and B source untouched. No dependency added. Generated dist/node_modules remain outside the commit.
- Security: pattern scan/manual scoped diff review performed; official Codex Security remains pending missing required preflight capability. Existing npm moderate dev esbuild advisory remains; no high/critical reported.
- User explicitly deferred B review and A+B integration. Do not inspect B or claim integrated done/G1–G6 closure. A option-picker consumer, final2D–3D/live preview acceptance belong to later integration. Independent A implementation and test handoff in this continuation are complete within the stated scope.
- next_action: use this A contract/fixtures when the user resumes integration; collect measured site/professional/quote/bank inputs for a real project. No fabricated sources or review. No main merge/deploy.


## U1-A01 — explicit A assignment and shared baseline (21/10/2026 Asia/Saigon)
- Owner now explicitly assigns this conversation to A under the five-upgrade/two-ChatGPT plan. Older14/10 instructions to defer B interface review/integration are historical; latest plan permits necessary read-only consumer review and sequential A integration, not editing B source/progress. Preserve all accepted work.
- Remote inspection: A codex/a-massing-20261013 at3788479 is fully contained in common PR75 source8a03c90,106commits ahead/0behind; no unmerged A commits. Continue this A branch from common source using a separate recovered snapshot bmh-a-five-upgrades. Existing B workspace/branch/progress untouched; no actual git clone claimed for this API-recovered snapshot.
- Reused existing Modern5x20fixture/project byte-verified from Git. Same project object,11rooms/2floors/27resolved furniture, source choices UNCONFIRMED, no confirmed inputs. Current derived revision7BADC039-9AD609B4-AI4-RH3 differs from historical B output label7BADC039-741638A5-AI4-RH3; preserve design and use current revision on new outputs.
- Evidence: evidence/A/U1-A01-20261021/baseline.json, source-hashes.json, snapshot-review.json, HANDOFF-B.md.33loaded source/fixture/build inputs verified by Gitblob/SHA256; read-only inspection preserved project. Basic checker0errors/0warnings; enginegeometry/stairs0issues/circulation0unreachable. Local Node24.19.0, no browser/GPU/professional acceptance. Reuse prior Node22 runtime CI39525474492 only within its scope.
- Existing17API contracts available; no schema/engine/UI rewrite. BOQ45unpriced and completeTotal:null. U1-A02 real data dependency is B's actual Modern SKU/spec/unit/role/room/image-source/rights manifest; contracts may be exercised with explicit TEST-ONLY records, never called supplier acceptance.
- Changed only A progress/integration and new A-owned baseline evidence. No app source, dependencies, paid calls, B files or production changes in this checkpoint. Docs/evidence-only validation performed; no repeat of historical160A or native/PDF checks.
- Next: inspect material binding→BOQ traceability, reproduce any consumer defect before fixing A source; prepare U2-A01 from the existing fixture while B supplies actual imagery/native evidence. Preview403/service/professional inputs remain open, not a reason to stop independent A work.


## U1-A02 — saved material to BOQ reconciliation (21/10/2026)
- U1-A01 baseline persisted at98c96e225775dedac50d78257c9ce8b4046b6ec9; no B/main change. Actual Modern supplier/photo manifest not yet seen on common8a03c90; developed explicit TEST-ONLY consumer regressions independently, not supplier acceptance.
- Reproduced3defects: old quote remains priced after room SKU replacement; whole-house application prices mixed scoped SKUs; invalid specification/foreign-room binding remains priced. A-owned team-a-boq now reads existing B scoped bindings/status to keep conflicted row amount:null/missing before transport allocation. Merely browsing category, another room, wetarea versus dryfloor and facade versus interior remain distinct.
- No new persisted fields, rates, UI or engine. Standalone alternative costedApplication comparisons stay proposals without silently applying candidate. Unbound/manual and roles not mapped by current B binding mechanism keep existing explicit-application behavior; full commercial category coverage is not claimed.
-5new registered regressions pass locally, plus52/53 across affected A-commercial/B-workflow; sole failure was missing readonly B46file in sparse recovery. Exact8a03c90 B46source restored and only that case rerun1/1PASS. Node24.19.0; syntax PASS; exact Node22 remote CI pending for the subsequent source checkpoint.
- Source/evidence: src/team-a-boq.js, tests/team-a-commercial.test.mjs, evidence/A/U1-A02-20261021/HANDOFF-B.md and source-hashes.json, plus A progress/integration. No B file/progress, dependency/build/schema/service/production mutation.
- Next: exact CI; U1-A03 package consumer checks when B supplies actual sample/asset handoff; independent U2-A01 input audit/preparation. Actual imagery/native/GPU/service/professional gates remain open.
