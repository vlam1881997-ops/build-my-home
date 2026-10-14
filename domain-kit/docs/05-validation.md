# Kết quả kiểm tra bộ bàn giao

- Node.js v24.19.0.
- `npm test`: 27/27 bài kiểm tra đạt, 0 lỗi.
- `npm run demo`: chạy thành công với dữ liệu giả định.
- Phạm vi đã kiểm tra: tính vay theo tháng, đổi lãi, gốc đều/niên kim, 0% lãi, dữ liệu bất hợp lệ, dòng tiền, dự toán, tỷ lệ phân kỳ, hình học phòng chữ nhật, mô phỏng chi phí vòng đời, revision và quy tắc entitlement thuần.
- Ví dụ vay 500 triệu/180 tháng, niên kim, 6,9% cho 12 tháng đầu và 10,9% sau đó: tháng đầu 4.466.234 đồng; tháng 13 là 5.585.285 đồng theo mô hình này. Đây là ví dụ tính toán, không phải báo giá ngân hàng. Số khác ảnh minh họa vì code tính từ giả định cụ thể.
- Đã phân tích cú pháp JSON cho package và API catalog.
- Chưa kiểm tra: app web/mobile, TypeScript compile trong ứng dụng, PostgreSQL migration thực tế, payment provider, AI provider, upload/export pipeline, 2D editor hoặc 3D renderer. Các dịch vụ này chưa triển khai trong bộ.
- Không có repository từ xa hoặc website được tạo/publish trong lần bàn giao này.
