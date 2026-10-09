# Codex B · nghiệm thu tích hợp với Codex A (2026-10-08)

## Phạm vi

- Nhánh B: `codex/b-commercial-v1-20261008` (PR #29). B giữ phần giao diện, bề mặt vật liệu và các bộ xem 3D.
- Bản kiểm tra cục bộ ghép các tệp A thay đổi từ bàn giao vào cây B; không thay đổi hai nhánh PR và không chứa dữ liệu khách hàng thật.
- Hợp đồng cao độ: `resolvedProjectLevels()` / `floorLevel(f)` của A cấp chiều cao và cốt sàn; Studio Three.js và adapter Architect3D của B tiêu thụ dữ liệu này. `STUDIO_LEVELS_CONTRACT=1` cho phép bộ xuất của A chỉ khi mã B đã được tải.

## Kết quả đã chạy

| Kiểm tra | Kết quả |
| --- | --- |
| `npm test` riêng B và bản ghép A+B | 29/29 tệp kiểm thử đều đạt ở mỗi cây |
| Studio desktop/điện thoại, chọn phòng, đổi chế độ, lưu và tải PNG | Luồng trình duyệt cục bộ đạt; PNG 1280×878 và 1179×1280 px |
| Mẫu A+B ba tầng 3,8 / 3,4 / 3,1 m | Cốt sàn 0 / 3,8 / 7,2 m; mái ở 10,44 m theo cấu hình mẫu; không lỗi hình học |
| GLB tải thật | 802 meshes; mặt sàn trong accessor có cao độ 0 / 3,8 / 7,2 m, sàn dày 0,14 m; đơn vị mét và cùng mã revision |
| Hồ sơ khách hàng ZIP | 40 tệp gồm bản vẽ, PDF, CAD, PNG và JSON chứa ba cao độ; cùng revision |
| Trình duyệt | Không lỗi JavaScript; mẫu thử chặn dịch vụ bên ngoài, API ghi dữ liệu và thao tác trả phí |

Ảnh và tệp xuất nêu trên được kiểm tra trong phiên cục bộ, không đưa vào Git vì là dữ liệu sinh từ mẫu thử. Mẫu hình khối tối giản chỉ xác nhận kích thước và đường xuất; chất lượng thẩm mỹ của một phương án nhà thực tế cần duyệt bằng dự án khách hàng cụ thể.

## Trước khi phát hành

1. Gộp hai PR bằng quy trình tích hợp đã thống nhất; chạy lại `npm test` và ca trình duyệt trên commit tích hợp cuối cùng.
2. Mở bản preview Vercel đã cấp quyền trên desktop/điện thoại và kiểm tra cùng thao tác, cả ảnh PNG, GLB và ZIP tải thật. Phiên này chỉ nghiệm thu localhost vì preview bảo vệ truy cập tự động.
3. Kiểm tra bản vẽ, phương án kết cấu và dự toán bởi KTS/KS và nhà cung cấp trước khi chào bán như hồ sơ thi công. Bản hiện tại là hồ sơ phương án sơ bộ.
