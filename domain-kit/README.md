> Cập nhật v1.2: UI ở `../dist/` nay dùng `src/home.mjs` qua bundle `core.js`. Nội dung dưới đây là mô tả bộ lõi v0.1 ban đầu; đọc `../README.md` để biết trạng thái mới.

# Build My Home — Đặc tả để triển khai trên GitHub

Phiên bản 0.1.0 • Tài liệu tiếng Việt • Lõi nghiệp vụ JavaScript chạy bằng Node.js.

**Sản phẩm hướng tới:** giúp chủ nhà đi từ điều kiện tài chính và khu đất đến phương án nhà, dự toán có căn cứ, kế hoạch trả nợ, theo dõi thi công và hồ sơ bàn giao. Giữ hành trình 10 bước và ngôn ngữ giao diện xanh olive / đất nung từ 10 ảnh tham chiếu.

**Bộ này là đặc tả triển khai + code lõi có kiểm thử, chưa phải web/app hoàn chỉnh.** Không có giao diện Next.js chạy sẵn, đăng nhập, máy chủ API, AI thật, 3D tương tác, giá thị trường, cổng thanh toán hay xuất PDF/Excel. Các phần đó được mô tả thành hợp đồng dữ liệu, API, backlog và tiêu chí nghiệm thu. Không có QR nhận tiền, tài khoản ngân hàng hay khóa API thật.

## Đọc theo thứ tự

1. [Tính năng và quyết định sản phẩm](docs/01-product.md) — nên xây gì, hoạt động thế nào, những điểm sai/thiếu trong mockup.
2. [Kiến trúc và hợp đồng dữ liệu](docs/02-architecture.md) — frontend/backend, AI, quyền truy cập, snapshot và cập nhật liên thông.
3. [API dự kiến](contracts/api.json) và [mô hình TypeScript](contracts/domain.ts).
4. [Backlog và nghiệm thu](docs/03-delivery.md) — thứ tự triển khai, điều kiện hoàn thành từng phần.
5. [Nguồn và giả định](docs/04-evidence.md).

## Chạy code hiện có

Cài Node.js 22 trở lên, mở thư mục này trong VS Code rồi chạy:

```bash
npm test
npm run demo
```

Không cần `npm install`: code hiện tại chỉ dùng thư viện chuẩn của Node.js.
`npm run demo` chạy ví dụ nghiệp vụ trong terminal, không khởi động website.

| Tệp code | Đã thực hiện |
|---|---|
| `src/finance.mjs` | Trả góp niên kim / gốc đều, nhiều kỳ lãi suất, 0% lãi, tỷ lệ nợ và dòng tiền theo tháng |
| `src/estimate.mjs` | Khối lượng được xác nhận × giá đúng đơn vị, hao hụt, thuế từng dòng, dự phòng, phân kỳ thanh toán |
| `src/design.mjs` | Hiệu chuẩn tỷ lệ, diện tích phòng chữ nhật, kiểm tra chồng lấn/vượt biên, lọc mẫu sơ bộ |
| `src/lifecycle.mjs` | Chi phí sử dụng và sửa chữa theo kịch bản 10 năm, giá trị hiện tại |
| `src/workflow.mjs` | 10 bước, đánh dấu kết quả cũ, kiểm tra revision và quy tắc quyền xem |
| `database/schema.sql` | Bản thiết kế PostgreSQL cho dữ liệu cốt lõi; chưa chạy migration thực tế |
| `contracts/` | Kiểu dữ liệu và danh mục API để giao việc phát triển |

## Đưa lên GitHub

Tạo repository rỗng trên tài khoản của ông, giải nén bộ này, mở terminal trong thư mục `build-my-home`:

```bash
git init
git add .
git commit -m "Add Build My Home product specification and domain core"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/build-my-home.git
git push -u origin main
```

Thay `YOUR_ACCOUNT` bằng tài khoản thật. Chưa tạo repository hay push thay ông.
GitHub lưu mã nguồn; để web có đăng nhập, dữ liệu, AI và thanh toán cần host chạy backend, PostgreSQL, nơi lưu tệp và worker. GitHub Pages đơn thuần không cung cấp các dịch vụ đó.

## Phạm vi tiếp theo đã được chia

Web responsive trước, PWA sau khi có trải nghiệm web ổn định; app native để sau. Hướng triển khai đề xuất: Next.js + TypeScript, PostgreSQL, object storage riêng tư, worker xử lý file/export/AI. Chọn và khóa phiên bản thư viện ở lúc khởi tạo ứng dụng; bộ lõi hiện tại không kéo dependency chưa kiểm chứng.

Các khoản tiền và số liệu trong demo chỉ là **dữ liệu minh họa**, không phải báo giá hay đề nghị vay. Đặc tả không đưa ra kết luận móng, tiêu chuẩn MEP hoặc kết quả phong thủy cho công trình thật.
