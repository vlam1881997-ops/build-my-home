# v1.2 — thay đổi so với v1.1

- Thay bộ dự toán và trả nợ frontend bằng adapter engine chung; CI so byte bundle với source.
- Tính diện tích hợp trên từng tầng; phân đoạn tường dùng chung; hỗ trợ cao/dày tường, cửa đi/cửa sổ, trừ diện tích cửa. Hình học chưa đúng có nhãn draft thay vì báo đã hợp lệ.
- Giải ngân khoản vay theo tháng, phí giải ngân, giữ lại bảo hành và dòng tiền toàn kỳ. Không cộng hạn mức vay vào tiền mặt đầu kỳ rồi cộng lại khi nhận.
- Nhập/sửa/export/import báo giá có nguồn, ngày, đơn vị, vùng, thuế và hao hụt. Nguồn nhập chưa được hệ thống xác minh.
- Snapshot cùng engine version được dùng cho UI, CSV, HTML/PDF, SVG và OBJ. ZIP hồ sơ tạo trong trình duyệt bằng UTF-8/CRC32.
- Hình khối 3D thực với tọa độ XYZ, tường có lỗ cửa, xoay/zoom/chọn tầng và OBJ. Chưa có ảnh phối cảnh hoàn thiện.
- Kết nối AI server-only qua Responses API; kiểm tra output, evidenceIds và snapshot. Có luồng JSON khi dùng web tĩnh. Chưa gọi live provider trong môi trường bàn giao.
- Giữ 10 bước, thao tác phòng, checklist, sổ chi, lưu phương án, backup JSON. Bản lưu cũ không bị xóa; phương án cũ được tính lại bằng engine mới có nhãn.
- Cache offline tăng phiên bản v12 và bổ sung các script mới.

Không thêm thông tin nhà thầu giả, QR thu tiền hoặc đánh giá chuyên gia giả. Các hợp đồng API/database giai đoạn đầu vẫn nằm trong domain-kit để phát triển sau.

## Vercel deployment hotfix

- Thêm `vercel.json` để Vercel build từ gốc repository nhưng xuất bản đúng thư mục `dist/`.
- Khắc phục tình trạng deployment báo Ready nhưng `/app.js` và `/styles.css` trả 404 khiến trang trắng.
- Thêm `VERCEL_DEPLOY.md` với cấu hình import/redeploy và checklist HTTP 200.
- Không thay đổi UI, công thức tính, 10 bước nghiệp vụ hay dữ liệu mẫu.
