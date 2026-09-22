# Build My Home v1.7.1 — Design Polish QA

## Mục tiêu
Bản này là vòng hoàn thiện thiết kế/UX, chưa mở thêm roadmap mới. So trực tiếp 10 bước với bộ mockup đã chốt trên desktop và mobile.

## Global
- [ ] Stepper: current rõ, bước trước có ✓, text không quá nhỏ, không tràn mobile.
- [ ] Sidebar không lặp ngân sách/kích thước với footer.
- [ ] Sticky footer luôn có: Ngân sách tối đa / Dự toán hiện tại / chênh lệch / CTA bước tiếp.
- [ ] Card radius 12–16px, shadow nhẹ, không còn cảm giác “khung xám”.
- [ ] Không horizontal scroll toàn trang; chỉ bảng/tablewrap được vuốt ngang.

## Bước 1
- [ ] Hero/3 flow images sắc nét; không mờ khi màn hình 1440–1920 px.
- [ ] 3 luồng A/B/C bấm được; text đủ ngắn để quét nhanh.
- [ ] Upload ảnh/PDF và camera mobile vẫn hoạt động.

## Bước 2
- [ ] Logo VCB/BIDV/VietinBank/Agribank/Techcombank/ACB/MB hiển thị.
- [ ] Chỉ áp lãi suất khi nguồn công bố đủ rõ; không tự bịa post-rate.
- [ ] DTI, khoản trả, stress +3 điểm % cập nhật theo số nhập.
- [ ] Cảnh báo nêu rõ lãi suất tương lai có thể cao hơn dự tính.
- [ ] Nút “Tải bảng dự tính trả nợ theo tháng (Excel)” tải được.

## Bước 3
- [ ] Map hiện tile OpenStreetMap khi có mạng.
- [ ] Nút ghim vị trí chỉ geocode sau thao tác người dùng.
- [ ] Nếu Leaflet/CDN lỗi, app vẫn dùng được và hiển thị fallback thay vì trắng trang.

## Bước 4
- [ ] “Người đồng hành” thay cho “người nấu chính”.
- [ ] Có con cái + ba mẹ ở chung.
- [ ] Soil cards chọn được, compass rõ, hướng tốt nổi bật.

## Bước 5
- [ ] Giường/bếp/bàn ăn/WC/xe hoặc ký hiệu tối giản xuất hiện đúng khu phòng.
- [ ] Kéo/resize phòng vẫn chạy, số diện tích/takeoff đổi theo.
- [ ] SVG xuất cùng geometry hiện tại.
- [ ] Disclaimer “mặt bằng ý tưởng, không thay hồ sơ thi công” nhìn thấy.

## Bước 6
- [ ] Ảnh vật liệu không còn placeholder xám.
- [ ] Mỗi card có nguồn hoặc trạng thái “cần báo giá”.
- [ ] Ảnh remote lỗi thì fallback local, không vỡ card.

## Bước 7
- [ ] Chọn Ngoại thất/Phòng khách/Bếp/Phòng ngủ/WC đổi visual đúng khu.
- [ ] 2–3 AI callout nằm trên visual, không che nội dung quan trọng.
- [ ] Chuyển sang “Mô hình khối từ mặt bằng” vẫn render scene3d thật.
- [ ] Mobile/WebGL yếu vẫn fallback trong <=3 giây.

## Bước 8
- [ ] VietQR card 99.000đ nổi bật ở cột phải.
- [ ] Hiện đủ 2 quyền lợi mở khóa và luồng webhook 4 bước.
- [ ] QR hiện rõ nhãn DEMO / chưa có tài khoản nhận / không chuyển tiền.
- [ ] Không có code nào tự set paymentUnlocked=true.

## Bước 9
- [ ] Chưa có entitlement: nền bị blur + overlay ổ khóa; checkbox không thao tác được.
- [ ] Có entitlement thật trong tương lai: banner xanh mở khóa và checklist hoạt động.

## Bước 10
- [ ] Khi chưa thanh toán: PDF/Excel/ZIP premium disabled, SVG/OBJ vẫn tải được.
- [ ] Excel mở được trong Microsoft Excel/LibreOffice và ô tổng có formula.
- [ ] PDF dùng In → Save as PDF, không popup tự động trên iPhone.

## Thiết bị cần test thật
- [ ] Desktop Chrome/Edge 1366x768 và 1920x1080.
- [ ] iPhone Safari 390–430px.
- [ ] Android Chrome tầm trung.
- [ ] Facebook in-app browser.
- [ ] Zalo in-app browser.

## Tiêu chí chốt
Không lỗi Console nghiêm trọng, không 404 asset, reload giữ dữ liệu, 10 bước cùng design system, và các màn chính bám cảm giác/nhịp bố cục bộ mockup chốt.
