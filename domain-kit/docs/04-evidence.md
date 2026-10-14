# Nguồn và giới hạn

## Đầu vào đã đọc

- Toàn bộ file `Văn bản đã dán (1)(6).txt` người dùng gửi.
- 10 ảnh `1.png` đến `10.png`, tương ứng 10 bước của Build My Home.
- Ưu tiên quyết định người dùng trong văn bản: công cụ thực tế, hữu ích trước thương mại, chưa có đối tác nhà thầu. Các lời khẳng định trong hội thoại cũ như “đạt chuẩn 100%” không được xem là kết quả nghiệm thu.

## Tài liệu chính thức đã đối chiếu

- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers): khả năng tổ chức API trong App Router. Đây là lựa chọn kiến trúc, chưa có app Next.js được build trong bộ này.
- [payOS — kiểm tra signature](https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/): chữ ký dùng xác minh dữ liệu nhận về. Bộ này mô tả yêu cầu xác minh; chưa tích hợp provider hay sao chép code webhook để nhận tiền thật.
- [CFPB — định nghĩa DTI](https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio-en-1791/): ví dụ định nghĩa tổng khoản trả nợ tháng chia thu nhập trước khấu trừ; các lender có giới hạn khác nhau. Dùng để tránh gọi tỷ lệ trên thu nhập ròng là cùng chỉ số. Không xem đây là quy định cho ngân hàng Việt Nam.

## Không đưa vào như dữ kiện xác thực

Không xác nhận giá vật tư/lãi suất ngân hàng hiện hành, dữ liệu địa chất từng vùng, tiêu chuẩn xây dựng địa phương, kích cỡ ống/dây hoặc áp lực thử, tuổi thọ vật liệu, giá bán gói hồ sơ, tỷ lệ giữ bảo hành hay hiệu quả phong thủy. Các phần này trong ảnh/văn bản là ý tưởng hoặc ví dụ cần thay bằng dữ liệu/quy tắc có nguồn phù hợp trước khi phát hành.

Không có tài khoản ngân hàng, tên khách hàng, review nhà thầu hoặc chuyên gia trong ví dụ code. Dữ liệu demo là giả lập được ghi nhãn.
