# Backlog và tiêu chí nghiệm thu

Các mốc dưới đây là thứ tự phát triển, không phải lời hứa đã hoàn thành. Không mở thu phí chỉ vì đã đủ 10 màn hình.

| Mốc | Nội dung | Điều kiện kết thúc |
|---|---|---|
| M0 — bộ hiện tại | Đặc tả, code lõi, type contract, API catalog, schema nháp, tests | `npm test` và demo chạy; có bảng trạng thái thật |
| M1 — nền app | Next.js, design system theo ảnh, tài khoản, project/scenario, lưu nháp | Tạo/lưu/mở lại trên máy khác; người khác không xem được dự án |
| M2 — giá trị cơ bản | Tài chính, đất, mẫu, vật liệu, dự toán, so sánh, báo cáo cơ bản | Sửa diện tích/giá/vay cập nhật đúng mọi kết quả; nguồn giá rõ |
| M3 — thiết kế trực quan | Upload, hiệu chuẩn, editor 2D, khối lượng kiến trúc, 3D từ geometry | 2D/3D/khối lượng cùng revision; dữ liệu nhận dạng được xác nhận |
| M4 — giải thích và dài hạn | Gợi ý, review có bằng chứng, vòng đời, phong thủy tùy chọn | AI không tự đổi số; thiếu dữ liệu không có điểm giả; mô phỏng có giả định |
| M5 — hồ sơ và vận hành | PDF/XLSX/ZIP, theo dõi, checklist, phát sinh, giải ngân | Báo cáo khớp snapshot, xuất lại được; tổng phân kỳ chính xác |
| M6 — thu phí | Provider, webhook, entitlement, đối soát/hỗ trợ/hoàn tiền | Không vượt khóa; webhook lặp không cấp trùng; end-to-end thanh toán sandbox |
| M7 — mở rộng | PWA nâng cao, đối tác thật, marketplace, thêm quốc gia/app native | Có dữ liệu/nhân sự/quy trình phục vụ vùng mới |

M1–M2 là bản hữu ích đầu tiên; M1–M6 mới hướng tới trải nghiệm đầy đủ theo bộ ảnh. M3 (editor/3D) và dữ liệu giá là phần có khối lượng lớn, không nên đánh đồng với lắp 10 form.

## Danh sách việc có thể chuyển thành GitHub Issues

| ID | Công việc | Phụ thuộc | Nghiệm thu cụ thể |
|---|---|---|---|
| APP-01 | Khung responsive + 10 bước | — | 360px và desktop không che nút; keyboard hoạt động |
| AUTH-01 | Tài khoản, project memberships | — | Đoán project ID khác nhận 403/404; kiểm tra mọi API |
| DATA-01 | Project/scenario/revision/autosave | AUTH-01 | Hai tab sửa cùng revision trả 409, không mất dữ liệu |
| DATA-02 | Danh mục vùng có phiên bản | DATA-01 | Có vùng chưa hỗ trợ; không hiển thị giá giả |
| FIN-01 | Form kết nối finance core | DATA-01 | Hai phương pháp trả nợ, tháng 13 đổi lãi, 0% lãi |
| FIN-02 | Lãi giải ngân nhiều đợt và phí | FIN-01 | Lãi chỉ trên dư nợ đã nhận; tất toán đúng, phí riêng |
| SITE-01 | Đất và nhu cầu gia đình | DATA-01 | Có chưa biết; không chọn móng tự động |
| ASSET-01 | Upload private & quét PDF | AUTH-01 | File giả đuôi, quá dung lượng, trang lỗi bị xử lý rõ |
| DESIGN-01 | Template library + lọc | SITE-01, FIN-01 | Không có mẫu phù hợp thì giải thích, không tự nới constraint |
| DESIGN-02 | Calibration + editor cơ bản | ASSET-01 | Đổi tỷ lệ cập nhật diện tích; undo/redo khôi phục |
| DESIGN-03 | Tường chung/cửa/thang/mái | DESIGN-02 | Hai phòng chung tường không đếm tường hai lần |
| PRICE-01 | Catalog + nguồn giá + admin duyệt | DATA-02 | Đơn vị/VAT/vùng/ngày đầy đủ, lịch sử bất biến |
| EST-01 | BOQ + chi phí thiếu/phát sinh | DESIGN-03, PRICE-01 | Giá trống không bằng 0; dự phòng không tính đôi |
| EST-02 | So sánh phương án | EST-01 | Hai snapshot độc lập, cùng mặt bằng có thể so vật liệu |
| VIEW-01 | 3D từ geometry | DESIGN-03 | Chiều dài/phòng/cửa khớp 2D, có fallback |
| LIFE-01 | Kịch bản 10 năm | EST-01 | Sửa giả định cập nhật đường chi phí, hiện nguồn |
| AI-01 | OCR có xác nhận | ASSET-01, DESIGN-02 | File không có tỷ lệ trả needs_confirmation |
| AI-02 | Review theo evidence | EST-01, SITE-01 | Không có bằng chứng trả thiếu dữ liệu; timeout giữ số tính được |
| CULTURE-01 | Phong thủy tùy chọn | SITE-01 | Tắt thì không hỏi năm sinh; không ảnh hưởng điểm kỹ thuật |
| EXPORT-01 | Snapshot PDF/XLSX/ZIP | EST-01 | Tổng trong file = snapshot; file tải lỗi có retry |
| BUILD-01 | Task/checklist/evidence | DATA-01 | Chưa kiểm tra khác đạt; có người/ngày xác nhận |
| BUILD-02 | Change order + actual payments | BUILD-01, EST-01 | Phát sinh không ghi đè ngân sách gốc |
| PAY-01 | Provider sandbox + order | AUTH-01 | Giá từ server; không có key thì không nhận tiền |
| PAY-02 | Webhook + entitlement | PAY-01 | Sai chữ ký/số tiền không mở, lặp/concurrent không cấp trùng |
| PAY-03 | Refund/reconciliation/support | PAY-02 | Đơn trễ/thừa/thiếu có hàng đợi xử lý |
| HAND-01 | Bàn giao + giải ngân + giữ lại | BUILD-02, EXPORT-01 | Tỷ lệ tổng 100%; tải hồ sơ không tự nghiệm thu |
| OPS-01 | Backup/jobs/monitoring/limits | DATA-01 | Restore thử thành công; job lỗi quan sát được |
| QA-01 | E2E và accessibility | Các module release | Đủ test các lối vào, quyền, mobile và lỗi |

## Kịch bản kiểm thử release bắt buộc

1. Ba nhánh ảnh mẫu / bản vẽ / chưa có gì cùng đi được đến dự toán; file chưa đọc được vẫn có lối nhập tay.
2. Nhà có dữ liệu thiếu chỉ tạo báo cáo sơ bộ có nhãn; không có BOQ thép/móng bịa.
3. Sau khi có dự toán, đổi vùng hoặc một phòng: kết quả cũ được đánh dấu; export mới chờ snapshot mới.
4. Khoản vay 0%, không vay, thu nhập bằng 0, chi phí lớn hơn thu nhập, đổi lãi và số dư cuối không âm.
5. Dòng tiền có thể thiếu ở tháng thi công dù tổng vốn đủ; UI hiện tháng thiếu, không chỉ hiện tổng cuối kỳ.
6. Quỹ khẩn cấp và dự phòng xây dựng riêng; lịch thanh toán không trả 105% do cộng thêm giữ lại.
7. Sửa localStorage/URL không mở quyền; tài khoản B không tải asset/export/order dự án A.
8. Webhook giả, sai số tiền, lặp, hai request cùng lúc, quá hạn và refund đều có kết quả xác định.
9. AI lỗi không làm mất dự án; không thay đầu vào hay giả nhận xét từ KTS thật.
10. Dự toán UI, PDF, Excel và ZIP đều từ cùng snapshot; không gọi tải bản nháp là bàn giao đã xong.
11. Không có nhà thầu thật: menu/CTA marketplace ẩn hoặc thông báo chưa triển khai, không gửi lead.
12. Đăng xuất/đăng nhập, hai tab, mạng mất giữa lưu, file hỏng, upload quá cỡ, phiên hết hạn: không mất bản sửa mà không báo.

## Các quyết định mặc định để tiếp tục mà không chặn triển khai

- Việt Nam/VND, xây mới nhà ở, web responsive trước.
- Gói theo một dự án; mức 99.000 đồng chỉ là giá thử đề xuất, chưa kích hoạt thu tiền.
- Giai đoạn thử mở tính năng theo dõi bằng server flag; không có giao dịch demo trộn với thật.
- Marketplace và app native để sau; không có partner giả.
- Phong thủy tùy chọn; nguồn/rules chờ thẩm định riêng.
- Chưa có nhà cung cấp AI/payment/map cố định: dùng interface và adapter, không cột nghiệp vụ vào một SDK.
- Giá/định mức phải có nguồn được duyệt trước khi gọi bản phát hành là công cụ dự toán thực tế.
