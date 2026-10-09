# Hợp đồng A/B — cần chốt ở G1

Owner khi thực thi: A. B gửi yêu cầu/đồng thuận trong PROGRESS-B.md.
Trạng thái: **draft cho triển khai**, chưa phải schema đã code. Reuse state/revision/adapter hiện có; migration phải được kiểm trước khi coi chốt.

## Nguồn chung
- `project.site` / `project.plan` là nguồn hình học; nội bộ mét, CAD/kích thước mm có chuyển rõ; plan y tương ứng Three z.
- Stable room/opening/shaft/element/furniture ID, floor ID và revision. Cao độ dùng `floorLevel()`/`resolvedProjectLevels()`, không quay lại f×floorHeight.
- 24 style ID giữ nguyên. B cấp profile nhận diện/ma trận vai trò vật liệu và trạng thái compatibility; A dùng cho đề xuất/BOQ. Không sửa vật liệu riêng âm thầm.

## C01 implementation checkpoint A1 — 09/10/2026
- `defaultState().project.plan.furniture=[]` đã có; mergeState/lưu/mở lại/planSnapshot/undo/redo dùng chung array. Legacy thiếu array được merge thành rỗng, không materialize đồ sinh sẵn thành lựa chọn đã xác nhận.
- Giữ nguyên ID chứa dấu `:` của B, tombstone `removed`, pose 37°, size và materialBindings. `planFurnitureIssues(plan)` báo ID trùng, số đo/room/floor/materials sai; giữ raw row để phục hồi, không tự gán vị trí/model thay thế.
- `project.inputEvidence.records` và `projectInputRegister()` tách default/legacy (unknown) khỏi customer-entered/provided và awaiting-review. `recordProjectInput(field,evidence)` chỉ ghi confirmed cho xác nhận khai báo của khách; không tạo reviewed/chứng nhận chuyên môn. Giá trị đổi làm trạng thái stale. `BMH.set` ghi nguồn nhập trước save.
- Fixture chuẩn hóa tại `evidence/A/A1-fixture.json`; mọi tọa độ/SKU/điều kiện là test-only. Chưa có nguồn khảo sát thật, quy hoạch hay KS.
- Chưa đóng G1/C01 toàn bộ: cần kiểm adapter B thật, room translation/rotation/regenerate và native drag; triển khai tiếp trên nhánh A, không sửa source B.

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
