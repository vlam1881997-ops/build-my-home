# BMH Team v1.0.1

Bộ điều phối của dự án BMH trên máy Windows: **hai tài khoản ChatGPT riêng, một mục tiêu, hai phiên Codex làm song song**. Công cụ dùng các lệnh ổn định `codex login`, `codex login status` và `codex exec` của Codex CLI chính thức, tạo worktree riêng, ghép kết quả vào một nhánh cục bộ và chạy kiểm tra. BMH Team là phần mềm riêng của dự án, không phải sản phẩm do OpenAI phát hành.

## Khởi chạy trong 4 bước

1. **Chuẩn bị repo.** Trong GitHub Desktop, mở `vlam1881997-ops/build-my-home`, lấy bản mới và chọn **Repository → Show in Explorer**. Sao chép đường dẫn thư mục. Giữ nguyên các thay đổi đang làm; công cụ sẽ báo nếu repo chưa đủ điều kiện.
2. **Mở bộ điều phối.** Cài [Node.js 22 trở lên](https://nodejs.org), giải nén đầy đủ BMH Team và bấm đúp **MO-BMH-TEAM.cmd**. Trên trang vừa mở, dán đường dẫn thư mục BMH vào ô dự án. Nếu dùng PowerShell, mở tại thư mục chứa `start.ps1` rồi chạy:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1 -RepoPath "C:\Users\Tên ông\Documents\GitHub\build-my-home"
   ```

   Chính sách này chỉ áp dụng cho phiên PowerShell vừa mở. Launcher nhận Git từ GitHub Desktop và kiểm tra Codex CLI đúng phiên bản `0.158.0`. Nếu cần, nó cài gói chính thức `@openai/codex@0.158.0` cùng các thành phần phù hợp với Windows vào `%LOCALAPPDATA%\BMHTeam\runtime\codex-0.158.0`. Máy cần Node.js 64-bit (`x64` hoặc `arm64`).
3. **Đăng nhập lần lượt hai tài khoản.** Trên bảng vừa mở, bấm **Đăng nhập** ở thẻ thứ nhất, mở liên kết OpenAI và hoàn tất đăng nhập. Khi thẻ báo đã kết nối, làm tiếp thẻ thứ hai. Mở liên kết của tài khoản thứ hai trong hồ sơ Chrome khác hoặc cửa sổ ẩn danh để không chọn nhầm tài khoản thứ nhất. Không nhập mật khẩu hay API key vào BMH Team. Giữ cửa sổ PowerShell mở.
4. **Giao một mục tiêu.** Kiểm tra thư mục BMH, nhập việc cần hoàn thiện và bấm **Phân việc & làm song song**. Bộ điều phối chia nhiệm vụ, chạy hai phiên, ghép code và kiểm tra. Khi sẵn sàng, mở thư mục/nhánh được báo, xem diff và kết quả. **Main và Vercel hiện tại chưa đổi**; chỉ triển khai sau khi ông chủ động ghép nhánh qua quy trình GitHub của dự án.

## Phạm vi thực tế

Bản v1.0.1 sửa bước khởi chạy trên Windows: kiểm tra phiên bản bằng Node để cảnh báo từ CLI không làm PowerShell 5.1 dừng nhầm, yêu cầu npm cài thành phần tùy chọn và tự bổ sung đúng gói Windows còn thiếu khi xác định được. Chỉ báo sẵn sàng khi Codex thực thi thành công và trả đúng phiên bản. Nếu còn lỗi, cửa sổ hiển thị nguyên nhân đã lọc thông tin đăng nhập và lưu kết quả kiểm tra ở `%LOCALAPPDATA%\BMHTeam\runtime\last-cli-check.json`. Giải nén đầy đủ bản mới, gồm `runtime.mjs`, rồi mở lại `MO-BMH-TEAM.cmd`.

- Hai phiên dùng quyền Codex và hạn mức của từng tài khoản có gói đủ điều kiện. Không cần API key; công cụ không né hạn mức, không tự đổi tài khoản khi hết quota và không tự mua lượt dùng.
- Tài khoản được đăng nhập bằng cơ chế chính thức của Codex CLI. Dữ liệu đăng nhập giữ ở thư mục Codex riêng trên máy; token không được gửi xuống giao diện web. Dashboard chỉ lắng nghe loopback.
- Trên Windows, hai phiên dùng sandbox `unelevated` được Codex hỗ trợ để chạy không cần quyền quản trị. Khả năng cách ly hệ thống và mạng của chế độ này yếu hơn sandbox `elevated`. Nếu máy chặn môi trường thực thi, công cụ báo lỗi để xử lý; nó không tự chuyển sang quyền truy cập toàn máy.
- Công cụ điều phối việc sửa code cục bộ. Nó không tự đăng nhập GitHub/Vercel, không push, không tạo PR, không merge main và không triển khai production.
- Nút **Dừng công việc** yêu cầu dừng các phiên đang chạy. Các thay đổi đã tạo được giữ lại để xem lại; không có thao tác xóa repo đang làm.
- Hai lịch sử trò chuyện ChatGPT không được nối vào nhau. Ông giao việc ở BMH Team; hai phiên Codex nhận phần việc từ bộ điều phối trên máy.
- Đăng nhập tài khoản thật và suy luận Codex sử dụng hạn mức chưa được kiểm chứng từ đầu đến cuối trên máy Windows của ông. Kiểm tra tự động dùng tiến trình/đầu ra mô phỏng; trạng thái kết nối trong ứng dụng được xác nhận từ CLI khi ông đăng nhập thực tế.

Tài liệu OpenAI về [các lệnh ổn định](https://learn.chatgpt.com/docs/developer-commands), [chế độ thực thi không tương tác](https://learn.chatgpt.com/docs/non-interactive-mode) và [sandbox Windows](https://learn.chatgpt.com/docs/windows/windows-sandbox).

Chạy kiểm tra công cụ từ thư mục gốc của gói/repo:

```sh
node --test tools/bmh-team/test/*.test.mjs
```

Nếu đang đứng trong thư mục `tools/bmh-team`, chạy `node --test test/*.test.mjs`.
