# Build My Home V2.0 — Release Notes

## Mục tiêu của V2

V2.0 là vòng **Design & Planner Stabilization**: vá các lỗ hổng điều hướng/paywall, làm mô hình hộ gia đình động, nâng planner 2D gần với logic kiến trúc sơ bộ hơn, làm rõ dữ liệu tài chính/vật liệu, khôi phục mô phỏng hao mòn và dọn giao diện để bám bộ mockup đã chốt.

## Những thay đổi chính

### 1. Paywall dùng một trạng thái chung cho Bước 9 và Bước 10
- Stepper Bước 9 và Bước 10 cùng hiển thị trạng thái khóa khi chưa có entitlement.
- Click trực tiếp Bước 9 hoặc Bước 10 khi chưa mở khóa sẽ đưa về Bước 8 và hiển thị hộp thoại thanh toán.
- Các thao tác premium ở Bước 9/10 (checklist Excel, dự toán Excel, ZIP/print premium) kiểm tra cùng entitlement.
- Phím `Ctrl + Shift + U` và nút DEV chỉ hoạt động ở `localhost`, `127.0.0.1` hoặc `file:`; không bật trên production.
- Production mặc định **fail-closed**: localStorage không được coi là xác nhận ngân hàng thật.

> Giới hạn bảo mật: đây mới là lớp khóa frontend. Để paywall thương mại không thể bị bypass bằng DevTools, PDF/Excel/ZIP premium phải được sinh/phục vụ ở backend sau khi webhook thanh toán ghi entitlement vào kho dữ liệu server-side.

### 2. Banner 3D và Ngày/Đêm được đặt đúng phạm vi
- Phối cảnh + callout AI chỉ nằm ở Bước 7.
- Bước 2–6 và Bước 8–10 dùng header làm việc gọn, không còn banner 3D chiếm không gian.
- Ngày/Đêm chỉ tác động canvas 3D ở Bước 7, không biến thành dark mode toàn website.

### 3. Hộ gia đình động
- Gia chủ + người đồng hành tùy chọn.
- Thêm/xóa tối đa 8 hồ sơ con trong UI V2; mỗi con có năm sinh, giới tính tùy chọn và nhu cầu phòng riêng/chung.
- Thêm/xóa tối đa 6 ba/mẹ/người thân; có trạng thái khả năng đi lại.
- `people`, `elder`, `kids` được đồng bộ tự động.
- Snapshot core đưa thành viên hộ gia đình vào fingerprint để thay đổi gia đình làm đổi snapshot.

### 4. Planner kiến trúc sơ bộ V2
- Grid snapping 0,1 m / 0,2 m / 0,5 m.
- Kéo/resize theo lưới, không cho commit trạng thái chồng phòng.
- Cảnh báo collision, vượt ranh, cầu thang các tầng lệch, khu ướt tầng trên không có khu ướt bên dưới, phòng ngủ thiếu mặt thoáng và thiếu số phòng ngủ so với nhu cầu hộ gia đình.
- Hỗ trợ gara mẫu và ký hiệu nội thất tối giản.
- Cửa đi hiển thị cánh + cung mở 90°; cửa sổ vẫn nằm trên đoạn tường.
- Lớp gợi ý phong thủy có thể bật/tắt trên planner; chỉ là gợi ý văn hóa, không thay yêu cầu công năng/an toàn.

> V2 vẫn là **mặt bằng kiến trúc sơ bộ/concept planner**, chưa phải bản vẽ xin phép hay hồ sơ thi công có chữ ký kiến trúc sư/kỹ sư. Chưa có kết cấu, MEP, PCCC, trục cột/BIM đầy đủ.

### 5. Tài chính & ngân hàng
- Chọn thẻ ngân hàng sẽ tự điền mức công khai đã có nguồn trong bộ dữ liệu V1.7.1 khi nguồn đủ căn cứ; nếu không đủ dữ liệu thì giữ kịch bản người dùng.
- Người dùng vẫn được sửa tay theo đề nghị tín dụng thực tế.
- Bổ sung stress test +2 / +3 / +5 điểm phần trăm cho lãi suất sau ưu đãi.
- Không sử dụng các con số Gemini nêu nhưng chưa được xác minh như một “mức hiện hành”.

### 6. Vật liệu và chênh lệch chi phí
- Khi đổi gói hoặc vật liệu, V2 tính tổng trước/sau bằng cùng snapshot engine.
- Hiển thị ngay `+/-` chênh lệch chi phí ở Bước 6 và sticky footer.
- Giá thủ công có nguồn không bị tự nhân hệ số gói; giá chưa xác minh vẫn được gắn cảnh báo.

### 7. 3D & hao mòn 10 năm
- Khôi phục timeline `Hiện tại → Năm 3 → Năm 5 → Năm 10`.
- Phối cảnh tham khảo thay đổi lớp hiển thị hao mòn theo mốc thời gian và đưa ra chi phí bảo trì dự kiến theo giả định người dùng.
- Vẫn tách rõ **phối cảnh tham khảo** và **mô hình khối lấy từ mặt bằng**.

### 8. Bước 8 above-the-fold & tiện ích thanh toán
- Header gọn để bảng dự toán + paywall nằm cao hơn trên màn hình.
- Có nút sao chép số tài khoản và nội dung chuyển khoản khi dữ liệu được cấu hình.
- QR hiện tại vẫn là DEMO nếu chưa có tài khoản nhận tiền/webhook thật; không giả giao dịch.

### 9. Navigation & mobile
- Sidebar có nút thu gọn thành icon rail.
- Header chỉ hiển thị một địa phương lấy từ `state.location` của Bước 3.
- Giữ toàn bộ Mobile Resilience: bảng vuốt ngang, autosave, camera upload, safe-area, iOS share/download, 3D fallback.

### 10. Sửa lỗi bổ sung
- Checklist Bước 9 trước đây đảo `key/label`, khiến tiến độ checkbox có thể tính sai; V2 sửa lại mapping.
- Bản đồ OpenStreetMap có cảnh báo fallback khi tile lỗi liên tiếp.
- Step 1 ưu tiên ảnh facade có độ phân giải/chi tiết tốt hơn trong bộ asset hiện có.

## Kiểm thử tự động

- `npm test`: **69/69 PASS**.
- Build dùng cùng core bundle và merge checks.
- Visual QA trên browser/điện thoại thật vẫn cần thực hiện sau deploy; automated tests không thay thế QA hình ảnh/chạm/scroll trên thiết bị thực.
