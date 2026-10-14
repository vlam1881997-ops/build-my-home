# Bàn giao Build My Home cho hai cửa sổ làm việc

Repo chung: https://github.com/vlam1881997-ops/build-my-home

Web đang sử dụng: https://www.huiminhbach.id.vn/

## Mục tiêu sản phẩm

**Phạm vi bản thương mại v1 đã khóa ngày 09/10/2026:** hoàn thiện đúng 24 phong cách hiện có và vật liệu phù hợp cho từng phong cách. Đọc [BMH-COMMERCIAL-V1-SCOPE.md](BMH-COMMERCIAL-V1-SCOPE.md) trước khi nhận việc. Đây là phạm vi nghiệm thu chung cho cả hai Codex, thay thế các kế hoạch mở rộng phong cách trước đó. Giữ đầy đủ luồng khách hàng và 10 tab; chỉ mở rộng phong cách/tính năng sau khi bản này có người dùng và có yêu cầu mới. Hoàn thành phần việc hay gộp hai nhánh chưa đồng nghĩa đạt bản thương mại.

Khách nhập kích thước đất/nhà, nhu cầu theo từng tầng, phong cách, vật liệu và ngân sách. BMH phải dùng cùng dữ liệu đo đạc cho bản vẽ 2D, mô hình 3D, khối lượng và dự toán; sau đó theo dõi tiến độ công trình. Đầu ra giữ đúng phong cách và vật liệu đã chọn, có minh họa dễ hiểu và cho phép sửa cửa, cửa sổ, lối đi, phòng ngay trên bản vẽ. Khách tự thêm phòng giặt, phòng thờ hoặc phòng tùy ý theo từng tầng. Phong thủy là điểm tư vấn, không được thay đổi lựa chọn của khách âm thầm.

Giữ đầy đủ 10 tab, chọn vật liệu, ngân hàng và các dự án đã lưu. Giao diện cần đơn giản nhưng tính năng nâng cao vẫn phải tìm thấy. Ưu tiên tốc độ xem 3D/vật liệu; chỉ gọi render AI khi người dùng yêu cầu. Không biến hình minh họa thành bằng chứng kích thước hay hồ sơ kết cấu đã được kỹ sư xác nhận. Các thông tin công trình và giá chưa xác minh phải giữ đúng trạng thái của chúng.

Đọc `docs/BMH-CUSTOMER-DESIGN.md`, hướng dẫn repo và các test liên quan trước khi sửa. Không nhập mật khẩu, token hay API key vào file bàn giao, mã nguồn hoặc trò chuyện.

## Phân công thực thi 24 phong cách và tiếp tục phiên

Đọc [docs/team-v1/README.md](team-v1/README.md). AI A nhận [TASK-A.md](team-v1/TASK-A.md), AI B nhận [TASK-B.md](team-v1/TASK-B.md); mỗi vai trò có nhánh và sổ tiến độ riêng. Mở phiên mới phải đọc checkpoint trên nhánh vai trò đang làm, không lấy checkpoint cũ trên main để ghi đè WIP. File nhiệm vụ là hướng dẫn lấy repo và thực thi, không phải gói mã nguồn để chép đè.

## Làm song song bằng BMH Team

1. Trong GitHub Desktop, lấy bản mới của `build-my-home`, chọn **Repository → Show in Explorer** và sao chép đường dẫn. Đây phải là repo Git thực tế, không phải thư mục Downloads hoặc thư mục chỉ giải nén ZIP.
2. Cài Node.js 22 64-bit nếu máy chưa có. Mở `MO-BMH-TEAM.cmd` ở gốc repo, hoặc `tools/bmh-team/MO-BMH-TEAM.cmd`. Giữ cửa sổ khởi chạy mở.
3. Đăng nhập lần lượt hai thẻ. Nếu hai thẻ cùng email, đăng xuất thẻ thứ hai, bấm Đăng nhập rồi mở liên kết trong hồ sơ Chrome khác hoặc cửa sổ ẩn danh. Bảng phải có **2/2 tài khoản khác nhau**.
4. Dán đường dẫn repo, nhập một mục tiêu cụ thể và bấm **Phân việc & làm song song**. Bộ điều phối chọn hai phần việc với các file riêng, tạo worktree, ghép vào nhánh cục bộ, dựng lại nguồn và chạy kiểm tra phù hợp.
5. Khi trạng thái **Sẵn sàng xem lại** xuất hiện, dùng nhánh và thư mục được báo để xem diff. Đăng nhập hai thẻ không tự nối lịch sử của hai cửa sổ ChatGPT. Việc điều phối tự động diễn ra trong BMH Team.

Mục tiêu đầu tiên có thể dán:

> Hoàn thiện đồng bộ phong cách và vật liệu khách đã chọn giữa bản vẽ 2D, mô hình 3D và dự toán. Giữ đủ 10 tab, ngân hàng, minh họa và dữ liệu dự án cũ. Tự chia hai phần việc với file riêng; kiểm tra chọn, đổi, lưu rồi mở lại vật liệu/phong cách. Giữ camera và renderer khi đổi vật liệu để phản hồi nhanh. Mock các API tính phí trong kiểm tra. Trả lại nhánh đã ghép cùng kết quả kiểm tra và những giới hạn thực tế.

## Dùng gói mã nguồn ở cửa sổ ChatGPT thứ hai

Gói full chứa toàn bộ file đã đưa lên repo, mã ứng dụng, model/texture/ảnh, API, hướng dẫn, test và BMH Team. Nó không chứa Git history, node_modules hay tài khoản đăng nhập trên máy. Dùng GitHub Desktop để có checkout Git khi cần chạy bộ điều phối. Hạn mức và quyền dùng Codex của từng tài khoản áp dụng riêng.

Có thể gửi gói full rồi dán yêu cầu sau vào cửa sổ thứ hai:

> Đây là dự án BMH chung tại vlam1881997-ops/build-my-home. Đọc docs/BMH-TEAM-HANDOFF.md và docs/BMH-CUSTOMER-DESIGN.md. Lấy main mới nhất bằng kết nối GitHub trước khi làm. Nhận phần việc qua kế hoạch BMH Team; chỉ sửa các file được giao và dùng nhánh/worktree riêng. Giữ cùng hình học đo đạc cho 2D/3D/dự toán, đúng phong cách/vật liệu, nhu cầu theo từng tầng và đủ 10 tab. Không sửa chồng lên phần việc của tài khoản còn lại, không gọi API tính phí để kiểm tra, không tự triển khai. Báo những file đã đổi, kiểm tra đã chạy và giới hạn còn lại để điều phối ghép kết quả.

## Kiểm tra và lỗi khởi chạy

Chạy `node --test tools/bmh-team/test/*.test.mjs` để kiểm tra bộ điều phối. Kiểm tra ứng dụng theo các script trong `package.json` và kịch bản liên quan đến thay đổi. Trên Windows, launcher v1.0.1 đọc phiên bản qua Node, tự bổ sung gói thực thi Windows phù hợp khi xác định được và hiển thị lỗi thật nếu chưa chạy được. Hướng dẫn chi tiết nằm ở `tools/bmh-team/README.md`.

Đăng nhập và chạy suy luận thật cần thực hiện trên máy của người sử dụng. Các test dùng phiên/process mô phỏng không thay thế bằng chứng hai tài khoản thật đã nhận và hoàn thành nhiệm vụ.
