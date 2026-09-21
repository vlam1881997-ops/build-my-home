# Build My Home — giao diện tương tác v1.0

Bộ mã nguồn web tiếng Việt dựa trên 10 màn hình tham chiếu. Màu xanh olive, trắng, điểm nhấn đất nung. Dùng được trên máy tính và điện thoại. Không cần npm, API key hay máy chủ ứng dụng. Không có thư viện bên thứ ba phải tải từ CDN.

## Mở thử ngay

Giải nén, mở `dist/index.html` bằng Chrome hoặc Edge. Giao diện chính hoạt động; cài PWA/offline cần HTTPS hoặc localhost. Dữ liệu ở file:// tùy trình duyệt, nên tải JSON trước khi đóng hoặc chuyển sang website.

Nếu đã cài Python, tại thư mục dự án chạy:

```bash
python -m http.server 8080 --directory dist
```

Mở http://localhost:8080 .

## Đưa lên GitHub Pages — cách dễ nhất

1. Tạo repository GitHub, ví dụ `build-my-home`.
2. Trong repository chọn **Add file → Upload files**.
3. Mở thư mục `dist` trên máy. Kéo **toàn bộ nội dung bên trong dist** lên repository: `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, và thư mục `assets`.
4. Chọn **Commit changes**. Không tải nguyên ZIP để mong GitHub tự giải nén.
5. Vào **Settings → Pages**. Chọn **Deploy from a branch**, nhánh **main**, thư mục **/(root)**, rồi **Save**.
6. Chờ GitHub báo triển khai xong. Đường dẫn thường là `https://TEN-TAI-KHOAN.github.io/build-my-home/`.

Nếu repository riêng tư, khả năng dùng Pages phụ thuộc gói GitHub; kiểm tra tùy chọn đang có trong tài khoản. Không đưa thông tin cá nhân hoặc khóa bí mật vào repository công khai.

## Cách cho người dùng Git

Đưa nguyên cấu trúc dự án lên repository (bao gồm `.github/workflows/deploy.yml`), đặt **Settings → Pages → Source → GitHub Actions**. Workflow tải thư mục `dist` lên Pages khi push nhánh `main`. Cách này khác cách tải nội dung dist ở trên: chọn một trong hai.

## Các phần đã hoạt động

- Điều hướng đủ 10 bước; bố cục responsive.
- Nhập đất, gia đình, môi trường, hướng và phong cách.
- Nhập tiền, thu nhập, sinh hoạt, nợ, quỹ dự phòng, khoản vay.
- Lịch trả nợ: gốc đều hoặc niên kim; lãi suất ban đầu và sau kỳ đầu; xử lý lãi 0% và không vay.
- Thiết kế khối phòng từng tầng: thêm, xóa, đặt tên, sửa loại, kích thước, vị trí; kéo bằng chuột/chạm; di chuyển bằng bàn phím; hoàn tác.
- Cảnh báo phòng chồng lấn; giới hạn phòng trong ranh đất.
- Gói vật liệu và mức hoàn thiện ảnh hưởng dự toán.
- Sơ đồ nghiêng 2.5D phản ánh các phòng; phối cảnh tham khảo riêng.
- Tính quỹ bảo trì theo giả định người dùng nhập.
- Lưu tối đa 10 phương án, mở lại và so chi phí.
- Checklist, sổ chi, lưu cục bộ, tải/khôi phục JSON.
- Xuất CSV chi phí/trả nợ, SVG mặt bằng; in báo cáo bằng **Print → Save as PDF**.
- Manifest, icon, service worker hỗ trợ cài đặt/offline cơ bản ở HTTPS/localhost. Việc hiện nút cài đặt tùy trình duyệt.

## Phạm vi cần hiểu rõ

Đây là frontend tương tác để chốt giao diện và trải nghiệm, chưa phải sản phẩm dự toán xây dựng hoàn chỉnh.

- Không có đăng nhập, đồng bộ nhiều thiết bị, backend, API AI hoặc thanh toán thật.
- Không có dữ liệu giá địa phương, dữ liệu khí hậu/bản đồ trực tiếp hoặc xác nhận từ ngân hàng.
- Đơn giá là giả định để minh họa mối liên hệ giữa lựa chọn và ngân sách, không dùng thi công hoặc ra quyết định vay.
- Diện tích tính bằng tổng các hình chữ nhật phòng. Nếu chồng lấn, diện tích vẫn cộng và có cảnh báo; chưa là diện tích sàn thi công đầy đủ.
- Không tự xác định móng, cấu tạo kết cấu, điện/nước hay chứng nhận nghiệm thu.
- Chưa có cửa, cửa sổ, tường có chiều dày, tự nối phòng hoặc bộ giải mặt bằng.
- 2.5D là SVG nghiêng, không phải mô hình 3D kiến trúc. Ảnh căn nhà là tham khảo trích từ ảnh người dùng cung cấp, không tự biến đổi theo mặt bằng. Khi công bố thương mại cần xác nhận quyền sử dụng ảnh nguồn.
- Upload JPG/PNG/PDF chỉ để xem đối chiếu trong phiên; không AI đọc, không giữ ảnh trong JSON, không gửi ra máy chủ.
- Phong thủy mới ghi nhận nhu cầu; chưa tính cung mệnh, không chấm điểm.
- Quỹ bảo trì = (phần thô + hoàn thiện) × tỷ lệ/năm × số năm, không phải dự đoán hư hỏng.
- Giá trị tài chính là mô phỏng theo tháng, lãi năm chia 12; chưa tính ngày thực tế, phí, bảo hiểm, trả trước hay nhiều đợt giải ngân.
- LocalStorage không mã hóa. Chỉ nhập dữ liệu mẫu khi dùng máy công cộng. Xóa dữ liệu trình duyệt sẽ mất dự án; tải JSON để sao lưu.

## Cấu trúc mã nguồn

- `dist/index.html`: khung ứng dụng, metadata và manifest.
- `dist/styles.css`: giao diện desktop/mobile, màu, khoảng cách, chế độ in.
- `dist/app.js`: state dùng chung, 10 màn hình, mặt bằng SVG, tính toán và xuất tệp.
- `dist/assets/`: hình tham khảo và icon.
- `dist/sw.js`: cache ứng dụng phục vụ offline khi đã mở thành công.
- `DESIGN.md`: quyết định giao diện và lộ trình nâng cấp.
- `VALIDATION.json`: phạm vi kiểm tra thực tế.

Không cần build. Chỉnh file rồi reload. Khi cập nhật phiên bản offline, tăng tên CACHE trong `sw.js`. Bản này ưu tiên mạng; khi mất mạng sử dụng tài nguyên đã cache.
