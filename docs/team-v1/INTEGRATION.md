# Tích hợp A+B — owner A

Trạng thái: kế hoạch đã giao; implementation mới chưa tích hợp.
Nền: 04a661e2256828eef8ed31dc7ed4b0309e20c0a5 . Chỉ ghi trạng thái có bằng chứng.

| Gate | Mốc A | Mốc B | Trạng thái |
|---|---|---|---|
| G1 | A1 schema/fixture | B1 profile/material bridge | pending |
| G2 | A2 phương án | B2 chỉnh đồ/lưu | pending |
| G3 | A3 bản vẽ | B3 24 mẫu 3D | pending |
| G4 | A4 BOQ | B4 luồng UI | pending |
| G5 | A5 vay/dòng tiền | B5 cloud/thu tiền | pending |
| G6 | A6 hồ sơ/preview | B6 nghiệm thu khách hàng | pending |

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

## Log tích hợp
- 09/10/2026: phân công mới được tạo; B1 inventory only, A chưa được khởi chạy qua phân công này.
