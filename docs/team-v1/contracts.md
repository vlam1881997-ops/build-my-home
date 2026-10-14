# Hợp đồng A/B — cần chốt ở G1

Owner khi thực thi: A. B gửi yêu cầu/đồng thuận trong PROGRESS-B.md.
Trạng thái: **interface v1 đã triển khai, local integration đã kiểm tại C08; chờ B/signoff gate**. Reuse state/revision/adapter hiện có; không gọi trạng thái này là nghiệm thu công trình hoặc thương mại.

## Nguồn chung
- `project.site` / `project.plan` là nguồn hình học; nội bộ mét, CAD/kích thước mm có chuyển rõ; plan y tương ứng Three z.
- Stable room/opening/shaft/element/furniture ID, floor ID và revision. Cao độ dùng `floorLevel()`/`resolvedProjectLevels()`, không quay lại f×floorHeight.
- 24 style ID giữ nguyên. B cấp profile nhận diện/ma trận vai trò vật liệu và trạng thái compatibility; A dùng cho đề xuất/BOQ. Không sửa vật liệu riêng âm thầm.

## C01 implementation checkpoint A1 — 09/10/2026
- `defaultState().project.plan.furniture=[]` đã có; mergeState/lưu/mở lại/planSnapshot/undo/redo dùng chung array. Legacy thiếu array được merge thành rỗng, không materialize đồ sinh sẵn thành lựa chọn đã xác nhận.
- Giữ nguyên ID chứa dấu `:` của B, tombstone `removed`, pose 37°, size và materialBindings. `planFurnitureIssues(plan)` báo ID trùng, số đo/room/floor/materials sai; giữ raw row để phục hồi, không tự gán vị trí/model thay thế.
- `project.inputEvidence.records` và `projectInputRegister()` tách default/legacy (unknown) khỏi customer-entered/provided và awaiting-review. `recordProjectInput(field,evidence)` chỉ ghi confirmed cho xác nhận khai báo của khách; không tạo reviewed/chứng nhận chuyên môn. Giá trị đổi làm trạng thái stale. `BMH.set` ghi nguồn nhập trước save.
- Fixture chuẩn hóa tại `evidence/A/A1-fixture.json`; mọi tọa độ/SKU/điều kiện là test-only. Chưa có nguồn khảo sát thật, quy hoạch hay KS.
- C08 đã kiểm adapter B thật, room translation/rotation/regenerate, history/reload/native editor và tombstones trên A default state; G1 còn chờ signoff/catalog/source đầu vào. Không sửa source B.

## Nội thất từng món
A1 thêm schema/history/snapshot/migration; B2 thêm editor và adapter. Cấu trúc mục tiêu `project.plan.furniture[]`, thống nhất trước thêm dữ liệu thật:
- `id, roomId, floor, modelId`: stable, không lấy index vòng lặp làm ID.
- `pose:{x,y,z,rotationDeg}`: x/y là tâm footprint theo plan, z là cao độ chân món tương đối cốt tầng (m); góc độ theo quy ước plan chốt cùng adapter Three. Model pivot/scale có metadata riêng, không lấy bounds mesh làm kích thước pháp lý.
- `size:{width,depth,height}`: kích thước vật thật (m) ở local axes trước xoay.
- `placementStatus:'present'|'removed'`: món mẫu đã xóa được ghi nhận; regenerate/đổi style không tự khôi phục. Món khách thêm và món mẫu có `origin`/model family rõ.
- `materialBindings`: vai trò/SKU/spec/texture ID/tỷ lệ/nguồn và `costTreatment` (mua mới/có sẵn/nằm trong giá gói/chưa xác nhận).
- Khi di chuyển phòng, vị trí đồ tương ứng được dời atomically hoặc từ chối thao tác invalid; giữ lịch sử/reload/lock.
- Collision dùng footprint đã xoay, cửa/lối đi/fixture, không dùng W/D chưa xoay để chấp nhận xuyên tường.
- B2 cung cấp một adapter resolve đồ theo room/floor, `roomFurnitureLayout()` tương thích. A3 đọc adapter vẽ đúng rotation, A4 đọc ID/qty/bindings, B3 đọc cùng pose dựng GLB.
- Không tự migrate đồ đã sinh trước đây thành lựa chọn khách được xác nhận. Ghi nguồn legacy/generated; ghi nhận xóa/move/rotate trước mỗi lần sinh lại.

## Vật liệu / BOQ / ngân sách
- Selection ID, SKU, quy cách, vai trò, unit, quy đổi có điều kiện, source/date/region/expiry và trạng thái preview generic/exact tách rõ.
- B1 catalog/profile → A4 BOQ; mỗi dòng truy được element/room/furniture và nguồn qty. Đổi màu/texture không tự tạo giá; thiếu giá/quantity giữ null.
- Price key và drawing revision theo semantics hiện có. Chỉ sửa giá cùng SKU không tự sửa geometry; SKU/spec/pose khác invalidate các đầu ra/review liên quan.
- A2 xét ngân sách từ đầu; A5 chỉ gọi tổng có phạm vi rõ, nguồn vốn/reserve và điều kiện ngân hàng.
- B UI không thay công thức nguồn A; A không ghi đè lựa chọn B để phù hợp preset.

## Bàn giao / giám sát
- Trạng thái riêng: hồ sơ phương án; đủ bàn giao thiết kế; đủ đầu vào/phạm vi review thi công; đang thi công; hoàn công. Download sơ bộ vẫn được khi thiếu, với notice đúng.
- A6 định nghĩa sổ đầu ra/revision/decision, WBS, log/evidence reference, issue/change-order, nghiệm thu và cost/drawdown links.
- B4 đặt bàn giao trước thi công; B6 dùng API/adapter data A6, B5 lưu/sync ảnh/tệp và quyền theo dự án.
- `reviewed`/checkbox/payment không tự là chứng nhận KTS/KS hay phép xây dựng. Người/tài liệu/revision cần nguồn, khi đổi input phải xét stale.

## Tích hợp và fixture
- A giữ build/dependency/register module; B giao danh sách source/assets/license và API mới; các module mới đặt tên `team-a-...`/`team-b-...` theo owner.
- Fixture chung: ranh có nguồn test-only, đất chữ nhật và vát/lõm được hỗ trợ; 3 tầng 3.8/3.4/3.1 m, cửa lệch, U stair/shaft, phòng giặt/custom và thờ khác tầng, món xoay 37°. Thử budget/quotes/loan riêng không gọi provider tính phí.
- Kiểm tra tọa độ/ID/rotation/đơn vị/revision giữa bản vẽ/GLB/BOQ/hồ sơ; dữ liệu test không thành nguồn công trình thật.
- Contract thay đổi: A ghi version/điểm khác/consumer ảnh hưởng trong INTEGRATION; B xác nhận bằng checkpoint mình. Mốc interface có thể bàn giao sớm để phía kia làm tiếp, nhưng gate chỉ đạt khi đầu ra thật khớp.

## C07 A-owned integrated adapters (09/10, WIP)
- Final adapters registered after 104_style_reference; actual B consumer 90dcc4e, no source B edits. C01 requires normalized furniture array, reports malformed rows and refuses unsafe transforms.
- DXF footprints retain ID/angle/local size. Drawing revision includes furniture/fixtures, excludes quote-only fields and finance; input comparison key separately tracks funding.
- `commercialBoq`, `setBoqApplication`, `setSourcedQuote`, `applicationQuantity`, `compareSourcedAlternatives`: explicit role/application, sourced conversion and costTreatment; unknown total retained.
- `simulateLoanTerms`, `setFinanceScenario`, `constructionCashflow`, `financeScenarioSummary`, `scopedFundingNeed`: integer VND monthly convention, explicit fee scope; no daily interest/bank approval.
- `supervisionAdapter.{list,append,resolve,html}`, `handoverStatus`, `designHandoverManifest`; same-revision review requires professional evidence. `privateFinancePackageFiles({includeFinance:true})` is explicit opt-in; default customer package excludes finance.
- Consumer G1–G6 acceptance, BOQ coverage and native browser/export checks remain pending.

## C08 implementation v1 — 09/10/2026
- Consumer B ce28e327, import byte-for-byte. C07 câu pending browser/coverage là lịch sử: local C08 đã có457 Node22 checks và native desktop/mobile/export/GLB parity, gate acceptance vẫn pending.
- `site.north`:{azimuthDeg,datum:'true-north',sourceReference,observedAt,status}; angle0..360 là azimuth hướng ra phía front(-planY), chiều kim đồng hồ từ Bắc thật. Ngày phải tồn tại và không tương lai. Không lấy compass/map pin làm ranh pháp lý/Bắc đã đo; dữ liệu không nguồn không dùng để kết luận.
- `costPlan.scopeCoverage[]`:{roleId:'structure'|'mep',confirmed:true,sourceReference,revision,elementIds[]}; cần tất cả element cung cấp của discipline cùng revision. Đây là phạm vi khai báo có nguồn, không chứng minh hệ thiết kế đủ an toàn. Chưa đủ giữ COVERAGE-* unknown.
- `setSourcedQuote(id,quote)`: raw saved metadata giữ trong state; public costedApplication/manifest chỉ xuất allowlist thương mại. Shared transport group phải có cùng mode/amount/VATbasis; conflict làm các dòng unknown thay vì tính chuyến đầu tùy tiện.
- `compareSourcedAlternatives(application,candidates)`: candidate SKU/spec/quoteId, product và equivalence.confirmed/sourceReference. Saving chỉ có khi đầy đủ giá và cùng spec hoặc tương đương đã khai có nguồn + B compatibility.recommended. Không tự áp dụng thay vật liệu/binding/phòng.
- `simulateFinanceStress({rateIncreasePct,incomeChangePct,constructionIncreasePct},finance?)`: % lãi là điểm phần trăm/năm, mức đổi thu nhập -100..100%, giá xây0..100%. Các mức do người dùng nhập; không đổi scenario gốc/design. Lịch tháng giả định nominal annual/12, draws đầu tháng, grace chỉ gốc và lãi trả hàng tháng; daily interest/balloon/capitalization/prepayment chưa hỗ trợ.
- `prepareDesignHandover({includeFinance:false})`: native vectorPDF/SVG/DXF/CSV/JSON cùng revision, SHA25610output-types theo bytes file. Bảng A3 vật liệu đọc commercialBoq đầy đủ; bảng đồ có stable ID/rotation/localdims. Gói mặc định không có vốn/thu nhập/năm sinh/raw khảo sát. `includeFinance:true` là opt-in riêng.
- `outputs[].priceKey` chỉ BOQ để stale theo giá độc lập hình học; hash thay không xóa output lịch sử. Reviewer/tài liệu/revision phải có metadata nguồn; documented-acceptance vẫn certified:false.
- Fixture176m²/3floors3.8/3.4/3.1/chair37°/offcentre door/liftshaft dùng đúng geometry không fixture injection; chỉ test-only. Không có hồ sơ kết cấu/MEP/KTS/KS thật hay giá ngân hàng được kiểm chứng.

## R2 room-depth proposal hook — 2026-10-13 (Draft)

`previewRoomDepthChange({roomId, depth, anchor})` reads the current plan in metres. Supported scope: shrink one bedroom along plan Y, keeping `front` or `rear`. Depth >=2.95m is the existing packer's implementation limit, not a building-code assertion. It does not mutate state/history. Success includes sourceRevision/sourcePlanKey, detached final plan, before/after room dimensions/areas, and released rectangle (`use: unassigned`, `reviewStatus: awaiting-review`). Cost is unknown/null. Generated furniture/fixtures translate with the room exactly once; IDs/poses/angles/SKUs/tombstones are shown in the detached preview. Reject invalid layout/openings/access/locks or furniture collisions.

`applyRoomDepthChange(preview)` requires the same current revision and exact source plan (including locks), rebuilds and compares the candidate, then uses `commitDirectPlan`. No request mutates room type, count, style, shafts, stairs or other rooms. Existing undo/redo/persistence apply. B should render the detached preview through the existing plan consumer, display measured changes and the unknown released-space status, and call apply only after an explicit customer action. Keep preview ephemeral, not in a new saved geometry field. Do not describe released space as a usable terrace/loggia: slab, railing, drainage, roof and professional review remain unresolved. Tests currently establish component behavior, not native/visual acceptance.

## R2/R5 extension — 2026-10-14 (Draft)

`previewRoomDepthChange` accepts `releasedUse: unassigned | office | laundry | storage`; omitted retains the original unassigned behavior. A new enclosed room uses stable `<bedroomId>-released` and `<id>-access`; a collided ID rejects. `changes` explicitly lists reassigned outside window and added room/door. Only a corridor with sufficient overlap permits direct access. The operation keeps source bedrooms/core, adds no outdoor or engineering geometry. `compareRoomDepthOptions(request)` returns four feasible/rejected options and the existing provisional assessment; B must display changes and request explicit apply. New variants are ephemeral until accepted through the existing plan commit, then normal room/opening persistence applies; no migration schema is added.

Finance `prepayments: [{month, amount, feeAmount, sourceReference}]` and `prepaymentMode: reduce-payment`: pay extra principal after the scheduled monthly payment, then recast remaining principal over the original remaining tenor. Source is required for each event. Fee is a supplied integer VND amount; omitted fee yields partial/unknown totals. A zero fee is explicit. Excess principal rejects rather than truncating the customer request. Rows add `scheduledPrincipal`, `prepaymentPrincipal`, `prepaymentFee`; existing `principalPaid`, `fee`, `totalPayment` include the extra values once. Rate-reset/draw/grace conventions remain as documented. No shortened tenor or daily interest support claimed. Existing A form accepts `month=amount:feeAmount`.
