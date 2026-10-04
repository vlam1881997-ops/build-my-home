# Bàn giao Build My Home cho hai cửa sổ làm việc

Repo chung: https://github.com/vlam1881997-ops/build-my-home

Web đang sử dụng: https://www.huiminhbach.id.vn/

## Mục tiêu sản phẩm

Khách nhập kích thước đất/nhà, nhu cầu theo từng tầng, phong cách, vật liệu và ngân sách. BMH phải dùng cùng dữ liệu đo đạc cho bản vẽ 2D, mô hình 3D, khối lượng và dự toán; sau đó theo dõi tiến độ công trình. Đầu ra giữ đúng phong cách và vật liệu đã chọn, có minh họa dễ hiểu và cho phép sửa cửa, cửa sổ, lối đi, phòng ngay trên bản vẽ. Khách tự thêm phòng giặt, phòng thờ hoặc phòng tùy ý theo từng tầng. Phong thủy là điểm tư vấn, không được thay đổi lựa chọn của khách âm thầm.

Giữ đầy đủ 10 tab, chọn vật liệu, ngân hàng và các dự án đã lưu. Giao diện cần đơn giản nhưng tính năng nâng cao vẫn phải tìm thấy. Ưu tiên tốc độ xem 3D/vật liệu; chỉ gọi render AI khi người dùng yêu cầu. Không biến hình minh họa thành bằng chứng kích thước hay hồ sơ kết cấu đã được kỹ sư xác nhận. Các thông tin công trình và giá chưa xác minh phải giữ đúng trạng thái của chúng.

Đọc `docs/BMH-CUSTOMER-DESIGN.md`, hướng dẫn repo và các test liên quan trước khi sửa. Không nhập mật khẩu, token hay API key vào file bàn giao, mã nguồn hoặc trò chuyện.

## Làm song song bằng BMH Team

1. Trong GitHub Desktop, chọn `build-my-home`, chọn **Repository → Show in Explorer** và sao chép đường dẫn, ví dụ **`D:\KBL\build-my-home`**. Bấm **Fetch origin** ngay trước khi giao việc nếu dùng chế độ Desktop. Đây phải là repo Git thực tế, không phải thư mục Downloads hoặc thư mục chỉ giải nén ZIP.
2. Cài Node.js 22 64-bit nếu máy chưa có. Mở `MO-BMH-TEAM.cmd` ở gốc repo, hoặc `tools/bmh-team/MO-BMH-TEAM.cmd`. Giữ cửa sổ khởi chạy mở.
3. Đăng nhập lần lượt hai thẻ. Nếu hai thẻ cùng email, đăng xuất thẻ thứ hai, bấm Đăng nhập rồi mở liên kết trong hồ sơ Chrome khác hoặc cửa sổ ẩn danh. Bảng phải có **2/2 tài khoản khác nhau**.
4. Chờ từng thẻ tải danh sách model của chính tài khoản từ Codex, rồi chọn **Model giao việc** và **Mức suy luận** có trong danh sách. Bản v1.1.3 không áp đặt cùng một danh sách cho cả hai tài khoản. Nếu lựa chọn cũ chưa được hỗ trợ, chọn lại; **Làm mới model** tải lại riêng cho thẻ đó. Lựa chọn tự lưu và được giữ cố định cho nhiệm vụ. Nút giao việc chỉ mở khi cả hai thẻ có lựa chọn hợp lệ. Dán đường dẫn repo, chọn **Lấy mã nguồn mới**, nhập một mục tiêu cụ thể rồi bấm **Phân việc & làm song song**. Với **GitHub Desktop — đã Fetch origin**, công cụ chỉ nhận `FETCH_HEAD` khớp `origin/main`, Fetch trong 15 phút. Với **Git tự lấy bản mới**, công cụ Fetch trước khi làm. Bộ điều phối chọn hai phần việc với các file riêng, tạo worktree, ghép vào nhánh cục bộ, dựng lại nguồn và chạy kiểm tra phù hợp.
5. Khi trạng thái **Sẵn sàng xem lại** xuất hiện, dùng nhánh và thư mục được báo để xem diff. Đăng nhập hai thẻ không tự nối lịch sử của hai cửa sổ ChatGPT. Việc điều phối tự động diễn ra trong BMH Team.

Mục tiêu đầu tiên có thể dán:

> Hoàn thiện đồng bộ phong cách và vật liệu khách đã chọn giữa bản vẽ 2D, mô hình 3D và dự toán. Giữ đủ 10 tab, ngân hàng, minh họa và dữ liệu dự án cũ. Tự chia hai phần việc với file riêng; kiểm tra chọn, đổi, lưu rồi mở lại vật liệu/phong cách. Giữ camera và renderer khi đổi vật liệu để phản hồi nhanh. Mock các API tính phí trong kiểm tra. Trả lại nhánh đã ghép cùng kết quả kiểm tra và những giới hạn thực tế.

## Dùng gói mã nguồn ở cửa sổ ChatGPT thứ hai

Gói full chứa toàn bộ file đã đưa lên repo, mã ứng dụng, model/texture/ảnh, API, hướng dẫn, test và BMH Team. Nó không chứa Git history, node_modules hay tài khoản đăng nhập trên máy. Dùng GitHub Desktop để có checkout Git khi cần chạy bộ điều phối. Hạn mức và quyền dùng Codex của từng tài khoản áp dụng riêng.

Có thể gửi gói full rồi dán yêu cầu sau vào cửa sổ thứ hai:

> Đây là dự án BMH chung tại vlam1881997-ops/build-my-home. Đọc docs/BMH-TEAM-HANDOFF.md và docs/BMH-CUSTOMER-DESIGN.md. Lấy main mới nhất bằng kết nối GitHub trước khi làm. Nhận phần việc qua kế hoạch BMH Team; chỉ sửa các file được giao và dùng nhánh/worktree riêng. Giữ cùng hình học đo đạc cho 2D/3D/dự toán, đúng phong cách/vật liệu, nhu cầu theo từng tầng và đủ 10 tab. Không sửa chồng lên phần việc của tài khoản còn lại, không gọi API tính phí để kiểm tra, không tự triển khai. Báo những file đã đổi, kiểm tra đã chạy và giới hạn còn lại để điều phối ghép kết quả.

## Kiểm tra và lỗi khởi chạy

**v1.1.3 sửa việc dừng các nhiệm vụ dài và thêm tiếp tục từ các file đã làm.** Khi lượt cũ đã dừng, đóng bộ điều phối, giải nén **BMH-Team-Windows-v1.1.3.zip** vào thư mục mới ngoài `D:\KBL\build-my-home`, rồi mở **MO-BMH-TEAM.cmd**. Giữ `%LOCALAPPDATA%\BMHTeam` và các thư mục công việc cũ. Điền đúng repo, chờ hai thẻ kết nối và kiểm tra model đã lưu; không phải tự giảm Ultra/max.

Nếu thẻ **Công việc trước vẫn còn** xuất hiện, bấm **Tiếp tục phần đã làm**. Công cụ dùng mục tiêu và phân công cũ, các worktree đã có và model ông đang chọn rõ ràng trên hai thẻ; không cần Fetch lại hoặc nhập lại mục tiêu. Nội dung khác đang gõ trong ô mục tiêu được giữ nguyên. Trước khi tiếp tục, công cụ kiểm tra báo cáo, kế hoạch/phạm vi file, repo, nhánh, đường dẫn, commit gốc và diff. Nếu dữ liệu không hợp lệ, công cụ giữ file và báo lỗi; không reset/xóa code. Thẻ chỉ hiện khi có báo cáo thất bại/dừng đã lưu cùng kế hoạch và worktree còn tồn tại. **Giao mục tiêu mới** tạo một lượt mới từ nguồn đang chọn; nút này không thay thế thao tác tiếp tục công việc cũ.

Mỗi phiên lập kế hoạch có giới hạn tối đa 60 phút và chờ hoạt động mới 30 phút; với Ultra/max là 90/45 phút. Mỗi phiên sửa code có giới hạn tối đa 120 phút và chờ hoạt động mới 30 phút; với Ultra/max là 240/60 phút. Hoạt động gia hạn thời gian chờ nhưng không vượt giới hạn tối đa. Không tự hạ model, đổi tài khoản hay gọi API tính phí. Báo cáo và code trong các nhánh cục bộ chưa tự ghép `main` hay triển khai Vercel.

Tiếp tục tự động áp dụng trước bước commit/gộp. Nhánh đã commit hoặc gộp được giữ để xem lại; công cụ không tự reset lịch sử Git để chạy lại.

Bản mới giữ bộ chọn model theo quyền của từng phiên Codex. Nếu báo lựa chọn cũ không được hỗ trợ, chờ tải danh sách rồi chọn lại model và mức suy luận hợp lệ trên từng thẻ. Model có nhãn **Codex đề xuất** đến từ `isDefault` trong kết quả `model/list`; không có model mạnh nhất được bảo đảm cho mọi tài khoản.

Khi **giao mục tiêu mới**, bản mới giữ cách sửa Git: trong GitHub Desktop, chọn `D:\KBL\build-my-home`, bấm **Fetch origin**, rồi chọn **GitHub Desktop — đã Fetch origin** trong BMH Team và giao việc. Hai phiên đăng nhập và lựa chọn model giữ ở `%LOCALAPPDATA%\BMHTeam`; gói mới dùng lại dữ liệu này. Model/mức suy luận cũ không còn khả dụng phải được ông chọn lại rõ ràng trước khi giao việc hoặc tiếp tục lượt cũ.

Chế độ Desktop dừng nếu lần Fetch thiếu, quá 15 phút hoặc commit không khớp. Không tự chuyển về nguồn cũ. Màn hình hiển thị nguyên nhân, chi tiết Git đã lọc thông tin đăng nhập, hướng xử lý và đường dẫn **File nhật ký**. Nhánh/thư mục xem lại chỉ hiện sau khi worktree thật đã được tạo. Commit nguồn và thời điểm Fetch được giữ trong báo cáo của lượt chạy.

Chạy `node --test tools/bmh-team/test/*.test.mjs` để kiểm tra bộ điều phối. Kiểm tra ứng dụng theo các script trong `package.json` và kịch bản liên quan đến thay đổi. Launcher vẫn kiểm tra CLI qua Node và tự bổ sung gói thực thi Windows phù hợp khi xác định được. Launcher v1.1.3 dùng CLI chính thức đã ghim `0.160.0`. Hướng dẫn chi tiết nằm ở `tools/bmh-team/README.md`, gồm cách lấy danh sách thật qua [Codex app-server](https://learn.chatgpt.com/docs/app-server).

Đăng nhập, GitHub Desktop trên Windows và chạy suy luận thật cần thực hiện trên máy của người sử dụng. Các test dùng repo Git tạm, phiên/process mô phỏng không thay thế bằng chứng hai tài khoản thật đã nhận và hoàn thành nhiệm vụ.
