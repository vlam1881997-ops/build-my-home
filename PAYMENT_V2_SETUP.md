# Payment V2 — phần còn cần cấu hình để khóa thương mại thật

V2.0 đã vá lỗ hổng điều hướng: Step 9 + Step 10 dùng một entitlement chung và production mặc định khóa. Tuy nhiên khóa frontend không phải là bảo mật thanh toán.

Để đưa 99.000đ vào production cần tối thiểu:

1. Nhà cung cấp/bank có API hoặc webhook giao dịch hợp lệ.
2. `orderId` duy nhất cho từng phiên thanh toán.
3. Endpoint server tạo order/QR; không hard-code bí mật trong JavaScript client.
4. Webhook server xác minh chữ ký/secret của provider.
5. Kho dữ liệu server-side lưu `orderId -> paidAt -> entitlement` (Vercel Postgres/Neon/Supabase/KV phù hợp tùy thiết kế).
6. Endpoint `GET /api/payment/status?orderId=...` chỉ trả unlocked khi bản ghi server xác nhận đã thanh toán.
7. PDF/Excel/ZIP premium phải được sinh hoặc phân phối qua endpoint có kiểm entitlement; không chỉ disable nút ở client.

Không dùng nút “Tôi đã chuyển khoản” ở production. Nút/phím DEV trong V2 chỉ chạy localhost/file để QA.
