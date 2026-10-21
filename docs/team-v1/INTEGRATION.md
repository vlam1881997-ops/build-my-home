# Tích hợp A+B — owner A

Trạng thái: source A+B đã ghép và kiểm local tại C08, chờ nghiệm thu từng gate.
Nền thực thi: main3c7f510 → A1dc78657 + B90dcc4e tại1372285 → C0719a8453 → C08 ghép thêm Bce28e327. Checkpoint cuối xem git log/PR37; không nhận SHA tự tham chiếu. Chỉ ghi trạng thái có bằng chứng.

| Gate | Mốc A | Mốc B | Trạng thái |
|---|---|---|---|
| G1 | A1 schema/fixture ready_for_integration | B1 profile bridge đã dùng thật | local consumer/migration đạt; signoff/catalog pending |
| G2 | A2 so phương án/nguồn cần review | B2 native editor/reload đạt trên A state | local logic/UI đạt; phương án/fengshui/visual review pending |
| G3 | A3 32 trang/3 DXF ready_for_integration | B3 native GLB common fixture parity đạt | số đo/revision đạt; 24 style visual/professional pending |
| G4 | A4 traceable partial BOQ/form/API alternatives | B4 10 tab consumer đạt | nguồn giá/coverage/chọn tối ưu đầy đủ pending |
| G5 | A5 schedule/cash/stress/UI ready_for_integration | B5 source ghép, config chưa sẵn | local finance đạt; SQL/cloud/merchant/provider/runtime pending |
| G6 | A6 native package/SHA10outputs/B6data | B6 actual hook đã kiểm local | protected preview403, signoff/professional/config pending |

## Quy tắc ghép
- A đọc PROGRESS-B từ head nhánh B trước mỗi lần ghép, B đọc PROGRESS-A từ nhánh A. Main có thể chậm hơn checkpoint đang làm.
- Mỗi yêu cầu chung có ID, file owner, contract version, head SHA, dependency, test và tình trạng. Không ghép WIP như gate đạt.
- State/schema/build/dependency/contracts do A ghép; B gửi module registration/adapter request và nguồn asset/license.
- Ghép từng đầu ra đủ review, giải quyết conflict đúng owner; giữ checkpoint hai bên, không squash làm mất mốc đang resume mà không ghi mapping.
- Preview tích hợp và test hai bên trước production. A6 đưa preview/hồ sơ/data giám sát cho B6; B6 phản hồi; A sửa/ghép và deploy khi gate đạt; B xác minh live.
- Không coi “có nhánh/PR/CI xanh” là đạt hình ảnh 24/24 hoặc hồ sơ thi công. Ghi gate source/UI/visual/professional/config tách rõ.

## Hàng đợi ban đầu
- C01: contract furniture/schema/migration — A owner, B consumer — draft; A1/B2 phải chốt.
- C02: profile/material/SKU/qty/price bridge — B1 cấp, A2/A4 tiêu thụ — pending.
- C03: bàn giao thiết kế/hoàn công và tab9/tab10 — A6 data/completeness, B4 UI — pending.
- C04: data WBS/nhật ký/evidence/issue/cost — A6 cấp, B5/B6 lưu/UI — pending.
- C05: module registration/build/dependency — A owner — yêu cầu ghi trong PROGRESS-B.
- C06: credential/config không có quyền thao tác — người gặp ghi blocker; không tự thêm dịch vụ tốn phí.

## C08 interface và bằng chứng hiện tại
- C01 v1: default/merge/history/disk + atomic transform/regenerate + revision/DXF dùng native B resolver. Không còn fixture injection để bật B editor trong A browser. `fixtures||[]` canonicalized, North/elevation có nguồn mới tham gia revision để giữ legacy semantics.
- C02 v1: B10-role profile dùng ở A2/BOQ; mỗi application/SKU/spec/qty/quote có scope riêng. Giá/vốn thay đổi không đổi drawingRevision, nhưng priceKey/designInputKey và output stale được kiểm độc lập.
- C03/C04 v1: tab9 design 2D package khác as-built; tab10 supervisionAdapter10collections thực, raw malformed rows chặn readiness. SHA256 theo bytes xuất, BOQ có priceKey; journal/payment/report không là chứng chỉ.
- C05: module/test registration từ C07 giữ nguyên, không thêm app dependency. C08 457/457 Node22 checks; browser cuối Node24 vì binary22 tạm thời không còn ở môi trường phục hồi (lượt22 trước và full source test22 đã có log).
- C06: protected Vercel fetch403 và automatic approval rejection khi thử connection khác: dừng đường bypass, cần quyền project/team được cập nhật. Metadata READY là build evidence, không nghiệm thu live. Security preflight reference không đọc được; official scan pending. esbuild moderate dev advisory có sẵn, chưa tự upgrade.
- Evidence A/C08 và TEST-ONLY ZIP có PDF/SVG/DXF/BOQ/revision/report; không có private finance/raw khảo sát hay binary GLB. B70blob từ ce28e327 giữ nguyên SHA, ảnh remote vẫn được giữ trong tree (checkout sparse).
- Requests cho B: đọc PR37/current contracts; xác nhận C01/C02/C03/C04, dùng common fixture cho B3/B6; thêm UI chọn sourced alternatives/scopeCoverage bằng A API/hook theo owner. Không yêu cầu B viết lại formula A.

## Log tích hợp
- 09/10/2026 C08 ownership: A xác nhận `tests/team-a-commercial.browser.cjs`, `tests/team-a-export-qa.py` và `docs/team-v1/evidence/A/*` (gói TEST-ONLY, QA và HANDOFF) thuộc A. Chỉ kiểm xuất/source và dữ liệu, không sửa UI/3D của B. Import checkpoint B ce28e327 nguyên blob/ảnh và giữ B làm parent; không tự chỉnh PROGRESS-B.
- 09/10/2026 C07 ownership: A xác nhận các module mới `src/team-a-project-contract.js`, `src/team-a-boq.js`, `src/team-a-finance.js`, `src/team-a-handover.js` và `tests/team-a-*.test.mjs` thuộc A. Chỉ mở rộng engine/hook hiện có; đăng ký sau 104_style_reference; không sửa source/CSS/3D B. B head 90dcc4e đã ghép tại 1372285, Draft PR #37. Gate vẫn pending tới khi có bằng chứng tích hợp.
- 09/10/2026: phân công mới được tạo; B1 inventory only, A chưa được khởi chạy qua phân công này.

- 09/10/2026 A1: đọc main/A 3c7f510 và B 90dcc4e; C01 default array, migration/history/disk và input-evidence triển khai phía A. B consumer thật đã bàn giao trong PR36. Room transformations/regeneration/native drag và integrated persistence còn đang kiểm, G1 chưa đóng.
- C02: chấp nhận tên/signatures read-only styleSpecification/styleMaterialMatrix/styleMaterialCompatibility/styleMaterialSchedule của B1 để A2/A4 tiêu thụ; quantity/price thiếu vẫn null, category selection không đồng nghĩa mọi role đã áp dụng.
- C05: A sẽ đăng ký năm team-b tests hiện có cùng team-a tests, không thêm dependency. C06 production/config/visual/professional review vẫn pending; không tự nâng cờ readiness.

## 2026-10-13 — A continuation after PR47

PR37 is merged; current verified main baseline is ddf9dfe348263a28148cfbf8ca5132f1d492f8dc (PR47). A continues in codex/a-massing-20261013, worktree bmh-codex-a-massing, preserving old worktrees. Default branch names in the original manifest are historical; file ownership is unchanged. B active progress read at 778e3fe on codex/b-facade-depth.

Scoped R1/R2 patch: A-owned team-a-project-contract.js, tests/fixtures/design-client.mjs, new tests/team-a-massing* and evidence/A/R1-R2, plus A progress/contracts/integration. No B file, build/dependency/server/Vercel or style catalogue changes. The preview/apply hook is ready for B UI wiring; acceptance pending native desktop/mobile, Node22, changed-fixture exports, professional geometry use and Codex Security. No production action. See R1-R2 README for complete validation limits.

## 2026-10-14 — PR48 continued, no B changes

R2 allocation variants and R5 sourced prepayments implemented in existing A modules, with shared fixture/export test helpers under A prefixes. Node22 restored/checksummed:62 targeted tests/build pass;102SVG/8DXF quantities/revision verification complete. No dependency/build/server/Vercel mutation. B should consume option `changes`, `assessment`, detached `plan`, and explicit apply; normal project plan carries accepted new rooms/openings.

Auto-review rejected replacement Chromium download after current binary was diagnosed truncated; native/PDF remain blocked awaiting explicit user permission. Do not retry an alternate connection/browser route. Keep PR48 Draft until the recorded integration/export/security gates are satisfied. Evidence: A/R2-R5-20261014.


## 21/10/2026 — five-upgrade plan, A baseline handoff U1-A01
- Explicit latest owner assignment: this conversation executes A; B source/progress stays owned by the other ChatGPT. Plan source8a03c90/runtimee73e0af is106commits ahead of A3788479 with0unmerged A commits. Continue existing A branch with that common source; do not revive PR48 old runtime or reset WIP.
- Shared Modern fixture remains evidence/B/Modern-5x20-V01/project.json and tests/team-b-modern-reference.mjs. Same project data,11rooms/27resolved furniture, current revision7BADC039-9AD609B4-AI4-RH3. Historical output revision label differs; current exports must use current revision. No new geometry/state store.
- A U1-A01 evidence/HANDOFF: evidence/A/U1-A01-20261021. Basic snapshot/source/API baseline ready_for_integration; local Node24 only, no native/GPU/professional/commercial gate closure. Prior runtime exact Node22 CI39525474492 remains inherited source evidence.
- B handoff needed for U1-A02: actual category/role/productId/SKU/spec/unit/roomId or exterior scope/visualProfile/image-kind/source/rights/scale/rotation/status/checkpoint. Unknown photos/prices remain unknown. A may fix reproduced consumer contracts using synthetic records without accepting real supplier assets.
- Production remains PR74 ad575e57. A is sole main/promote/rollback writer; B preview acceptance precedes production and live verification follows it. Existing publication authorization persists; actual evidence gates still required.
