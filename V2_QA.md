# Build My Home V2.0 — QA checklist trước khi chốt UI

## P0 — Không được phát hành nếu fail
- [ ] Chưa thanh toán: click Step 9 bị chặn.
- [ ] Chưa thanh toán: click Step 10 bị chặn.
- [ ] Chưa thanh toán: PDF/Excel/ZIP premium không chạy.
- [ ] Production không xuất hiện nút DEV và `Ctrl+Shift+U` không mở khóa.
- [ ] Bước 8 hiển thị dự toán + paywall trong màn đầu ở desktop 1440×900 (không có banner 3D đè).
- [ ] Banner phối cảnh/callout AI không xuất hiện ở Bước 2–6, 8–10.
- [ ] Ngày/Đêm chỉ nằm trong phần mô hình 3D Bước 7.

## P1 — Planner & hộ gia đình
- [ ] Thêm 0,1,2,3,4,5 con không làm vỡ layout desktop/mobile.
- [ ] Thêm ba/mẹ/người thân và thay mobility cập nhật tổng người.
- [ ] Snap 0,1/0,2/0,5 m hoạt động khi kéo và resize.
- [ ] Phòng chồng nhau không được commit; có cảnh báo đỏ.
- [ ] Phòng vượt ranh bị cảnh báo.
- [ ] Cầu thang tầng 1/tầng 2 lệch có cảnh báo.
- [ ] WC tầng trên không xếp gần vùng ướt dưới có cảnh báo.
- [ ] Phòng ngủ thiếu mặt thoáng có cảnh báo.
- [ ] Nhu cầu phòng ngủ từ hộ gia đình thiếu thì validator hiển thị cảnh báo.
- [ ] Cửa đi thể hiện cánh/cung mở; cửa sổ nằm đúng tường.

## P1 — Tài chính & vật liệu
- [ ] Chọn ngân hàng có dữ liệu nguồn làm rate/promo/post-rate cập nhật.
- [ ] Ngân hàng thiếu mức đủ căn cứ không tự bịa lãi suất.
- [ ] Người dùng sửa tay lãi suất sau auto-fill được.
- [ ] Stress +2/+3/+5 hiển thị khoản trả/tháng.
- [ ] Đổi Tiêu chuẩn → Cao cấp hiển thị delta ngay.
- [ ] Đổi vật liệu hiển thị delta ngay và tổng dự toán đồng bộ sticky footer.

## P1 — 3D
- [ ] Chọn Ngoại thất/Khách/Bếp/Ngủ/WC hiện đúng phối cảnh tham khảo.
- [ ] Chuyển sang “Mô hình khối từ mặt bằng” render geometry dự án.
- [ ] Ngày/Đêm chỉ đổi canvas 3D.
- [ ] Timeline 0/3/5/10 thay đổi wear overlay và chi phí bảo trì dự kiến.
- [ ] Thiết bị yếu/WebGL lỗi vẫn fallback trong thời gian quy định.

## P2 — Navigation/mobile
- [ ] Sidebar collapse/expand không mất state.
- [ ] Bước 5 khi sidebar thu gọn có thêm diện tích làm việc.
- [ ] Header chỉ hiện location của Bước 3, không có địa phương mâu thuẫn.
- [ ] iPhone Safari: bảng 8/9 vuốt ngang; input không auto zoom.
- [ ] Facebook/Zalo in-app browser: CTA và upload vẫn bấm được.
- [ ] Camera upload Bước 5 mở camera sau trên Android/iOS khi trình duyệt hỗ trợ.
- [ ] Reload/pull-to-refresh giữ dữ liệu đã nhập.

## Bước 8–10 / payment thật
- [ ] QR production dùng đúng tài khoản/ngân hàng/nội dung order.
- [ ] Webhook xác minh chữ ký/provider ở server.
- [ ] Entitlement được lưu server-side, không lấy localStorage làm nguồn tin cậy.
- [ ] Sau webhook hợp lệ, Step 9/10 mở và banner “Thanh toán thành công” xuất hiện.
- [ ] PDF/Excel/ZIP premium được backend kiểm quyền trước khi trả file.

## Lưu ý phạm vi kỹ thuật
Planner V2 là thiết kế sơ bộ phục vụ lập phương án và dự toán. Trước xây dựng vẫn cần hồ sơ kiến trúc/kết cấu/MEP/PCCC theo quy định và người có chuyên môn chịu trách nhiệm.
