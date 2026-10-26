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

1. Trong GitHub Desktop, chọn `build-my-home`, chọn **Repository → Show in Explorer** và sao chép đường dẫn, ví dụ **`D:\KBL\build-my-home`**. Bấm **Fetch origin** ngay trước khi giao việc nếu dùng chế độ Desktop. Đây phải là repo Git thực tế, không phải thư mục Downloads hoặc thư mục chỉ giải nén ZIP.
2. Cài Node.js 22 64-bit nếu máy chưa có. Mở `MO-BMH-TEAM.cmd` ở gốc repo, hoặc `tools/bmh-team/MO-BMH-TEAM.cmd`. Giữ cửa sổ khởi chạy mở.
3. Đăng nhập lần lượt hai thẻ. Nếu hai thẻ cùng email, đăng xuất thẻ thứ hai, bấm Đăng nhập rồi mở liên kết trong hồ sơ Chrome khác hoặc cửa sổ ẩn danh. Bảng phải có **2/2 tài khoản khác nhau**.
4. Chờ từng thẻ tải danh sách model của chính tài khoản từ Codex, rồi chọn **Model giao việc** và **Mức suy luận** có trong danh sách. v1.2.0 giữ lựa chọn riêng, sửa kế hoạch node test sai một lần và thử kết nối Git push trước khi gọi hai tài khoản. Nếu lựa chọn model cũ không còn được hỗ trợ, chọn lại; **Làm mới model** tải danh sách riêng của tài khoản. Chọn đường dẫn repo, cách Fetch, mục tiêu rồi bấm **Phân việc & làm song song**. Công cụ tạo worktree, ghép kết quả, build/test và tự push `origin/main` nếu mọi cổng đều đạt.
5. Khi trạng thái **Đã lên main** xuất hiện, BMH Team đã push commit lên GitHub; nếu Vercel đang nối với `main`, Vercel sẽ tự build/deploy. Xác nhận kết quả thực tế tại Vercel. Đăng nhập hai thẻ không tự nối lịch sử của hai cửa sổ ChatGPT.

Mục tiêu đầu tiên có thể dán:

> Hoàn thiện đồng bộ phong cách và vật liệu khách đã chọn giữa bản vẽ 2D, mô hình 3D và dự toán. Giữ đủ 10 tab, ngân hàng, minh họa và dữ liệu dự án cũ. Tự chia hai phần việc với file riêng; kiểm tra chọn, đổi, lưu rồi mở lại vật liệu/phong cách. Giữ camera và renderer khi đổi vật liệu để phản hồi nhanh. Mock các API tính phí trong kiểm tra. Trả lại nhánh đã ghép cùng kết quả kiểm tra và những giới hạn thực tế.

## Dùng gói mã nguồn ở cửa sổ ChatGPT thứ hai

Gói full chứa toàn bộ file đã đưa lên repo, mã ứng dụng, model/texture/ảnh, API, hướng dẫn, test và BMH Team. Nó không chứa Git history, node_modules hay tài khoản đăng nhập trên máy. Dùng GitHub Desktop để có checkout Git khi cần chạy bộ điều phối. Hạn mức và quyền dùng Codex của từng tài khoản áp dụng riêng.

Có thể gửi gói full rồi dán yêu cầu sau vào cửa sổ thứ hai:

> Đây là dự án BMH chung tại vlam1881997-ops/build-my-home. Đọc docs/BMH-TEAM-HANDOFF.md và docs/BMH-CUSTOMER-DESIGN.md. Lấy main mới nhất bằng kết nối GitHub trước khi làm. Nhận phần việc qua kế hoạch BMH Team; chỉ sửa các file được giao và dùng nhánh/worktree riêng. Giữ cùng hình học đo đạc cho 2D/3D/dự toán, đúng phong cách/vật liệu, nhu cầu theo từng tầng và đủ 10 tab. Không sửa chồng lên phần việc của tài khoản còn lại, không gọi API tính phí để kiểm tra. Worker không push/merge/deploy; sau khi hai phần việc ghép, build/test đạt, BMH Team coordinator sẽ tự push commit đã kiểm thử lên main. Vercel có thể tự deploy theo Git integration. Báo những file đã đổi, kiểm tra đã chạy và giới hạn còn lại để điều phối ghép kết quả.

## Kiểm tra và lỗi khởi chạy

**v1.2.0 tự publish sau khi kiểm tra đạt.** Cài đặt cần Git Credential Manager/Git CLI trên Windows đã đăng nhập đúng tài khoản có quyền ghi repo và main. Kết nối GitHub/Vercel trong ChatGPT không tự cung cấp credential cho tiến trình Git trên máy.

Nếu thẻ **Công việc trước vẫn còn** xuất hiện, bấm **Tiếp tục phần đã làm**. Công cụ dùng mục tiêu và phân công cũ, các worktree đã có và model ông đang chọn rõ ràng trên hai thẻ; không cần Fetch lại hoặc nhập lại mục tiêu. Nội dung khác đang gõ trong ô mục tiêu được giữ nguyên. Trước khi tiếp tục, công cụ kiểm tra báo cáo, kế hoạch/phạm vi file, repo, nhánh, đường dẫn, commit gốc và diff. Nếu dữ liệu không hợp lệ, công cụ giữ file và báo lỗi; không reset/xóa code. Thẻ chỉ hiện khi có báo cáo thất bại/dừng đã lưu cùng kế hoạch và worktree còn tồn tại. **Giao mục tiêu mới** tạo một lượt mới từ nguồn đang chọn; nút này không thay thế thao tác tiếp tục công việc cũ.

Mỗi phiên lập kế hoạch có giới hạn tối đa 60 phút và chờ hoạt động mới 30 phút; với Ultra/max là 90/45 phút. Mỗi phiên sửa code có giới hạn tối đa 120 phút và chờ hoạt động mới 30 phút; với Ultra/max là 240/60 phút. Hoạt động gia hạn thời gian chờ nhưng không vượt giới hạn tối đa. Không tự hạ model, đổi tài khoản hay gọi API tính phí. Sau khi build và toàn bộ test đạt, coordinator push fast-forward thường, không force. GitHub xác nhận quyền ghi thật ở lệnh push này. Nếu main tiến lên hoặc nhánh được bảo vệ, nhánh tích hợp được giữ để xử lý thủ công.

Tiếp tục tự động áp dụng trước bước commit/gộp. Nhánh đã commit hoặc gộp được giữ để xem lại; công cụ không tự reset lịch sử Git để chạy lại.

Bản mới giữ bộ chọn model theo quyền của từng phiên Codex. Nếu báo lựa chọn cũ không được hỗ trợ, chờ tải danh sách rồi chọn lại model và mức suy luận hợp lệ trên từng thẻ. Model có nhãn **Codex đề xuất** đến từ `isDefault` trong kết quả `model/list`; không có model mạnh nhất được bảo đảm cho mọi tài khoản.

Khi **giao mục tiêu mới**, bản mới giữ cách sửa Git: trong GitHub Desktop, chọn `D:\KBL\build-my-home`, bấm **Fetch origin**, rồi chọn **GitHub Desktop — đã Fetch origin** trong BMH Team và giao việc. Hai phiên đăng nhập và lựa chọn model giữ ở `%LOCALAPPDATA%\BMHTeam`; gói mới dùng lại dữ liệu này. Model/mức suy luận cũ không còn khả dụng phải được ông chọn lại rõ ràng trước khi giao việc hoặc tiếp tục lượt cũ.

Chế độ Desktop dừng nếu lần Fetch thiếu, quá 15 phút hoặc commit không khớp. Không tự chuyển về nguồn cũ. Màn hình hiển thị nguyên nhân, chi tiết Git đã lọc thông tin đăng nhập, hướng xử lý và đường dẫn **File nhật ký**. Nhánh/thư mục xem lại chỉ hiện sau khi worktree thật đã được tạo. Commit nguồn và thời điểm Fetch được giữ trong báo cáo của lượt chạy.

Chạy `node --test tools/bmh-team/test/*.test.mjs` để kiểm tra bộ điều phối. Kiểm tra ứng dụng theo các script trong `package.json` và kịch bản liên quan đến thay đổi. Launcher dùng Codex CLI chính thức đã ghim `0.160.0`. Hướng dẫn chi tiết nằm ở `tools/bmh-team/README.md`, gồm luồng auto-publish và cách lấy danh sách thật qua [Codex app-server](https://learn.chatgpt.com/docs/app-server).

Đăng nhập, GitHub Desktop trên Windows và chạy suy luận thật cần thực hiện trên máy của người sử dụng. Các test dùng repo Git tạm, phiên/process mô phỏng không thay thế bằng chứng hai tài khoản thật đã nhận và hoàn thành nhiệm vụ.
