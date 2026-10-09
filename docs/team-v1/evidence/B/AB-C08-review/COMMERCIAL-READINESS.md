# Đối chiếu bản A+B với mục tiêu thương mại — 09/10/2026

Checkpoint nguồn được review: A `bbbd70f664d4219856cad30d917747db7d5ac66f` (PR37), đã chứa toàn bộ B `ce28e32744deee28555184b027f0bbe7ebb94a7b` (PR36). GitHub compare xác nhận B là ancestor, A ahead4/behind0. 351 blob nguồn/API/server/build/test/assets chọn kiểm khớp byte với tree A trước patch CSS/QA của lượt review này. Không reset các worktree cũ.

**Kết luận: bản ghép có luồng phần mềm và đầu ra đo đạc kiểm được, chưa đạt nghiệm thu thương mại theo phạm vi 24 phong cách và hồ sơ xây nhà.** Không suy tỷ lệ hoàn thiện từ số task/test/ảnh. G1–G6 đều còn điều kiện chưa đóng; điều này không có nghĩa toàn bộ phần mềm bằng 0%.

## Phần đã có và phần thiếu

| Nhóm mục tiêu | Bằng chứng hiện tại | Điều kiện thương mại còn thiếu |
|---|---|---|
| Đầu vào/đất/gia đình/phong cách/vốn | Input evidence, đất lõm176m², 3 tầng cao3.8/3.4/3.1m, nhu cầu theo tầng, 3 chiến lược và so vốn; thiếu dữ liệu được nêu rõ | A2 diễn giải nguồn phong thủy/hướng model/khí hậu/ánh sáng và ca ràng buộc khó; quy hoạch, ranh, Bắc thật cần nguồn kiểm chứng |
| Bản vẽ2D | 32 trang vector A3/SVG, 3 DXF mm; ID/góc đồ37°/400×400×940mm/revision; xuất và audit DXF đạt | Chưa là bộ hồ sơ thi công được KTS/KS duyệt; kết cấu/móng/thép/MEP/model thang máy cần thông số và hồ sơ chuyên môn thật; chi tiết phong cách phải theo mô hình hoàn thiện |
| Nội thất2D/3D | Native array A1, chỉnh/kéo/xoay/khóa/xóa/khôi phục, reload/history, GLB đo cùng pose/ID/size | Nghiệm thu trên dự án thực, mọi món/model/material được cung cấp đúng quy cách; quyền asset/license theo từng nguồn |
| 24 phong cách/vật liệu/3D | 24 profile/240 vai trò, 48 ảnh ứng viên từ measured scene; source B được giữ nguyên | Ngoại thất nhiều mẫu còn chung hình khối; classic/neo/French gần giống, nội thất còn lặp bộ mẫu. 0/24 được đánh dấu duyệt hình cuối. Cần asset/chi tiết/PBR và mẫu SKU được xác nhận; không lấy ảnh AI thay mô hình đo đạc |
| Dự toán/tối ưu | SKU/quy cách/khối lượng/nguồn báo giá/vùng/ngày/VAT/nhân công/vận chuyển/hao hụt/costTreatment; thiếu vẫn null, chưa giả tổng công trình | Catalog đóng gói92 sản phẩm/59 SKU/0 giá số; cần báo giá thật và scopeCoverage toàn hệ. API alternatives có nhưng UI chọn/áp dụng nguồn thay thế và coverage chưa hoàn thiện |
| Vay/dòng tiền | Mô phỏng tháng annuity/gốc đều/kỳ lãi/giải ngân/ân hạn/phí/reserve/stress; đã dùng form thật | Không phải điều kiện/phê duyệt ngân hàng thật; chưa tính hợp đồng lãi ngày/trả trước/balloon/vốn hóa; khoản cần vay toàn công trình chưa biết nếu BOQ thiếu |
| Bàn giao/giám sát | Tab9 thiết kế trước tab10 thi công;10 loại đầu ra cùng revision/hash;10 sổ WBS/nhật ký/lỗi/thay đổi/thanh toán/giải ngân/quyết định/nghiệm thu/bảo hành | Cần luồng quyết định/review/tài liệu chuyên môn thực, nghiệm thu WBS và hoàn công theo dự án; bản TEST-ONLY chỉ kiểm phần mềm |
| Dịch vụ thương mại | Source cloud/private media/auth/merchant đã có; ownership/CAS/hash/RLS migration có kiểm mock | Production config09/10: cloud/payment/places/usage ledger/guest=false; SQL/cloud/media chưa áp dụng, merchant/provider chưa vận hành; tổng quota/spend/retention/backup và kiểm hai thiết bị cần hoàn tất |

## Lỗi sửa trong lượt review

- Tái chạy Node22:457/457 đạt, build/syntax đạt. Luồng thương mại desktop của checkpoint A đạt; phone ban đầu timeout khi chạm summary báo giá19px ở cuối trang (footer/viewport có thể cản touch).
- CSS B bổ sung grid form có label/control vừa chiều ngang, target44px, bảng cuộn bên trong, chứa chiều ngang của shell trên phone. Giữ nguyên tên form/data-* và công thức A, không ép click/đổi số tiền để test qua.
- Harness B dùng native A1 schema khi có, không thêm furniturearray vào bundle tích hợp; fallback legacy vẫn ghi rõ proposed. Đối chiếu overflow với viewport cấu hình, không dùng innerWidth đã bị mở rộng để chấp nhận tràn.
- Vercel project đúng `prj_PcB996IRamEZqWrKpA5qk9T290kh`: đổi nodeVersion24.x→22.x theo repo/tests; không đổi protection, tên miền, env hoặc bật dịch vụ thiếu dữ liệu.

## Việc tiếp theo theo thứ tự ưu tiên

1. **B3 + A3 — đầu ra đúng24 phong cách.** Hoàn thiện mái/mặt đứng/ô mở/ban công/chi tiết và nội thất từng bộ với asset có license, scale/PBR và SKU nguồn. Giữ đo chung; A3 xuất đúng các chi tiết. Gate:24 bộ ngoại/nội thất được khách/KTS review trên cùng dự án/revision, kiểm GLB/SVG/DXF/BOQ và lựa chọn khách không bị preset ghi đè.
2. **A2 — đề xuất thực sự dùng mọi đầu vào.** Chốt quy ước hướng đồ/Bắc, nguồn và trường phái phong thủy, site/climate/daylight/circulation và khả thi ngân sách. Gate: đất vát/lõm, công năng theo tầng/thờ/giặt/thang máy, phòng/đồ khóa và ca thiếu nguồn/vượt vốn được xử lý; khách giữ quyền chọn.
3. **A4 + B4 — dự toán đủ phạm vi và tối ưu dùng được.** Hoàn thiện UI sourced alternatives/coverage, nhập quote thực cho hạng mục cùng SKU/đơn vị/vùng/ngày/phạm vi thuế/công/vận chuyển; toàn hệ kết cấu/MEP do chuyên môn cấp. Gate: đối chiếu dự toán công trình thật, không cộng trùng, không đổi geometry vì đổi giá, không trình partial thành total.
4. **B5 — bật dịch vụ vận hành có kiểm soát chi phí.** Cấp đúng hạ tầng/config, áp dụng SQL/RLS/private media, sandbox merchant, quota/usage ledger/retention/backup. Gate:hai tài khoản/hai thiết bị lưu mở/đồng bộ/conflict/media quyền đúng; sandbox payment/webhook/retry/entitlement đạt; biết giới hạn và chi phí thực. Plugin/skill đã cài không tự cung cấp credentials hoặc dịch vụ miễn phí.
5. **A6 + B6 — bàn giao và giám sát thực.** Nối quyết định khách, review/tài liệu chuyên môn đúng revision, WBS/issue/change-order/inspection/payment/bảo hành và hồ sơ hoàn công. Gate: sửa thiết kế làm đúng đầu ra/review stale, public export bảo vệ dữ liệu gia đình/tài chính, người có trách nhiệm duyệt và hồ sơ có nguồn.
6. **A/B + khách/KTS/KS — nghiệm thu bản bán.** Dùng công trình mẫu có nguồn, so bản vẽ/mô hình/BOQ và dùng trọn10tab trên desktop/phone, kiểm tốc độ/bảo mật/khôi phục/filexuất. Chốt tính năng được bán và quyền sử dụng asset. Người chuyên môn duyệt công trình; Codex kiểm phần mềm và đối chiếu dữ liệu, không tự cấp chứng nhận thi công.

## Giới hạn bằng chứng

Fixture tổng hợp và provider bị chặn/mock; không tạo đơn thật hay tiêu API credits. GLB binary QA ở scratch, không publish lại; hash/cách tái tạo được lưu. 48 ảnh cũ được xem để đánh giá điểm thiếu, không gọi ảnh đó là bản visual mới hay commercial approved. Protected preview của A ghi403/quyền project-team; lần này không thử bypass đường đã bị auto-review từ chối. Khi merge theo yêu cầu hiện tại, đây là **gộp nâng cấp phần mềm**, không thay dấu pending bằng done hoặc công bố sản phẩm/hồ sơ100%.
