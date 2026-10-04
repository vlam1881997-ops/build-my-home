# BMH Team

Bảng điều phối trên máy Windows: **hai tài khoản ChatGPT riêng, một mục tiêu, hai phiên Codex làm song song**. Công cụ tạo worktree riêng, ghép kết quả vào một nhánh cục bộ và chạy kiểm tra. Nó không nối hai lịch sử chat hay làm tài khoản thứ hai xuất hiện trong cuộc trò chuyện ChatGPT hiện tại.

## Khởi chạy trong 4 bước

1. **Chuẩn bị repo.** Trong GitHub Desktop, mở `vlam1881997-ops/build-my-home`, lấy bản mới và chọn **Repository → Show in Explorer**. Sao chép đường dẫn thư mục. Giữ nguyên các thay đổi đang làm; công cụ sẽ báo nếu repo chưa đủ điều kiện.
2. **Mở bộ điều phối.** Cài [Node.js 22](https://nodejs.org), giải nén đầy đủ BMH Team và bấm đúp **MO-BMH-TEAM.cmd**. Trên trang vừa mở, dán đường dẫn thư mục BMH vào ô dự án. Nếu dùng PowerShell, có thể chạy:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1 -RepoPath "C:\Users\Tên ông\Documents\GitHub\build-my-home"
   ```

   Chính sách này chỉ áp dụng cho phiên PowerShell vừa mở. Launcher nhận Git từ GitHub Desktop; nếu thiếu Codex CLI, launcher cài gói chính thức `@openai/codex@0.158.0` đã dùng để kiểm tra giao thức của công cụ này. Không có script cài đặt tải về rồi tự thực thi.
3. **Đăng nhập hai tài khoản.** Trên bảng vừa mở, bấm **Đăng nhập** ở từng thẻ rồi mở liên kết OpenAI. Mở liên kết của tài khoản thứ hai trong hồ sơ Chrome khác hoặc cửa sổ ẩn danh để không chọn nhầm tài khoản thứ nhất. Nếu đăng nhập trình duyệt lỗi, dùng **Thử đăng nhập bằng mã**. Không nhập mật khẩu hay API key vào BMH Team. Giữ cửa sổ PowerShell mở.
4. **Giao một mục tiêu.** Kiểm tra thư mục BMH, nhập việc cần hoàn thiện và bấm **Phân việc & làm song song**. Bộ điều phối chia nhiệm vụ, chạy hai phiên, ghép code và kiểm tra. Khi sẵn sàng, mở thư mục/nhánh được báo, xem diff và kết quả. **Main và Vercel hiện tại chưa đổi**; chỉ triển khai sau khi ông chủ động ghép nhánh qua quy trình GitHub của dự án.

## Phạm vi thực tế

- Hai phiên dùng quyền Codex và hạn mức của từng tài khoản có gói đủ điều kiện. Không cần API key; công cụ không né hạn mức, không tự đổi tài khoản khi hết quota và không tự mua lượt dùng.
- Tài khoản được đăng nhập bằng cơ chế chính thức của Codex CLI. Dữ liệu đăng nhập giữ ở thư mục Codex riêng trên máy; token không được gửi xuống giao diện web. Dashboard chỉ lắng nghe loopback.
- Công cụ điều phối việc sửa code cục bộ. Nó không tự đăng nhập GitHub/Vercel, không push, không tạo PR, không merge main và không triển khai production.
- Nút **Dừng công việc** yêu cầu dừng các phiên đang chạy. Các thay đổi đã tạo được giữ lại để xem lại; không có thao tác xóa repo đang làm.
- Đăng nhập tài khoản thật và suy luận Codex sử dụng hạn mức **chưa được kiểm chứng từ đầu đến cuối** trong môi trường xây dựng công cụ này. Bộ kiểm tra dùng tiến trình/đầu ra mô phỏng; lần đăng nhập đầu trên máy ông mới xác nhận tài khoản và môi trường thực tế.
- Codex app-server là giao thức thử nghiệm theo tài liệu OpenAI. Bản này là công cụ phát triển chạy riêng trên máy, không phải thành phần phục vụ khách hàng của BMH. Nguồn chính thức: https://learn.chatgpt.com/docs/app-server , https://learn.chatgpt.com/docs/auth , https://learn.chatgpt.com/docs/config-file/environment-variables .

Chạy kiểm tra công cụ từ thư mục gốc của gói/repo:

```sh
node --test tools/bmh-team/test/*.test.mjs
```

Nếu đang đứng trong thư mục `tools/bmh-team`, chạy `node --test test/*.test.mjs`.
