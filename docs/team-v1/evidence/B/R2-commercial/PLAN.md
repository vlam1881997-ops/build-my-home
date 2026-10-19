# Bản nâng cấp2 · căn Modern · kế hoạch tiếp tục

Nền bản1: PR72/main a7ce3e83 đã chốt phát hành có bảo lưu. Phạm vi bản2 đã nhắc lại trong cuộc trò chuyện: chạy luồng khách từ đầu vào đến lưu/bàn giao; giữ10tab và một dự án Modern.

| Phần | Việc phải kiểm | Trạng thái tại checkpoint này |
|---|---|---|
| R2.1 | Đầu vào và lưu/mở lại giữ nhu cầu, phòng, vật liệu, báo giá, vốn | Dùng nền hiện có; kiểm xuyên suốt cùng R2.2 |
| R2.2 | Vật liệu/khối lượng/giá có nguồn → tổng quan dự toán → vốn và CSV | Đã sửa sai nguồn tổng quan;28test local đạt; chờ CI/preview |
| R2.3 | Hồ sơ bàn giao dùng đúng revision/priceKey và phần thiếu rõ | Cần kiểm gói thực sau ca báo giá |
| R2.4 | Tài khoản/cloud/media/quota/thu tiền theo cấu hình thật | Chỉ kết luận sau đọc capability flags và có kiểm tra provider hợp lệ |
| R2.5 | Modern xuyên10tab, desktop/phone, lưu/khôi phục, lỗi mạng | Kiểm phần thay đổi; không phát lại kiểm tra R1 đã đạt nếu không liên quan |
| R2.6 | GitHub/Vercel đúng nguồn đã kiểm và xác minh tên miền | Chờ bản nguồn R2.2 |

B tiếp tục đúng file/UI/cloud được giao; BOQ/finance/geometry dùng API hiện có của A. Không đổi công thức hoặc dựng kho dữ liệu song song. Dữ liệu/giá chưa có giữ unknown; dữ liệu test ghi nhãn, không thành báo giá thật.

Ba bảo lưu R1-GPU/R1-OUTDOOR/R1-VISUAL giữ nguyên, không đổi thành đạt khi bước sang bản2. Toàn bộ trạng thái thương mại vẫn cần bằng chứng cho từng phần.
