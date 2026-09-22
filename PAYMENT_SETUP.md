# Payment setup

UI Bước 8 đã hoàn chỉnh nhưng QR production đang để trạng thái chưa cấu hình.

Để mở thanh toán thật cần:

1. Chọn provider có webhook biến động thanh toán (ví dụ một provider VietQR phù hợp hợp đồng của bạn).
2. Backend tạo `orderId`, số tiền 99.000đ và nội dung chuyển khoản duy nhất.
3. Webhook xác minh chữ ký/provider, số tiền, orderId và chống replay.
4. Lưu entitlement server-side theo user/project.
5. API tải file premium kiểm entitlement trước khi trả file.

Không dùng `localStorage.paid=true` làm quyền production.
