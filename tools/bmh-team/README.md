# BMH Team v1.1.1

Bộ điều phối của dự án BMH trên máy Windows: **hai tài khoản ChatGPT riêng, một mục tiêu, hai phiên Codex làm song song**. Công cụ dùng các lệnh ổn định `codex login`, `codex login status` và `codex exec` của Codex CLI chính thức, tạo worktree riêng, ghép kết quả vào một nhánh cục bộ và chạy kiểm tra. BMH Team là phần mềm riêng của dự án, không phải sản phẩm do OpenAI phát hành.

**v1.1.1 sửa bước lấy nguồn Git:** có lựa chọn dùng lần **Fetch origin** vừa thực hiện trong GitHub Desktop, hiển thị nguyên nhân Git thất bại cùng đường dẫn nhật ký, và chỉ hiện thư mục xem lại khi worktree đã được tạo. Hai phiên đăng nhập và lựa chọn model hiện có được giữ trong `%LOCALAPPDATA%\BMHTeam`.

## Khi màn hình báo Git thất bại, mã thoát 128

1. Dừng lượt cũ nếu đang chạy, đóng cửa sổ khởi chạy, giải nén **BMH-Team-Windows-v1.1.1.zip** vào một thư mục mới rồi mở **MO-BMH-TEAM.cmd**. Giữ nguyên `%LOCALAPPDATA%\BMHTeam` để dùng lại hai phiên đăng nhập và model đã chọn.
2. Trong GitHub Desktop, chọn đúng repo **`D:\KBL\build-my-home`** và bấm **Fetch origin** ngay trước khi giao việc. Nếu Desktop báo lỗi, xử lý đăng nhập/quyền truy cập theo thông báo của Desktop trước.
3. Trong BMH Team, điền **`D:\KBL\build-my-home`**, chọn **GitHub Desktop — đã Fetch origin**, giữ mục tiêu công việc rồi bấm **Phân việc & làm song song**.

Chế độ Desktop chỉ nhận `FETCH_HEAD` có commit khớp `origin/main` và thời điểm Fetch trong **15 phút**. Lần Fetch thiếu, cũ hoặc không khớp sẽ dừng để ông Fetch lại. Công cụ không tự dùng nguồn cache cũ khi lấy bản mới thất bại. Lỗi Git trong bước chuẩn bị xảy ra trước khi giao việc cho model; màn hình báo nguyên nhân và **File nhật ký**, thay vì đưa ra thư mục xem lại chưa tồn tại.

## Khởi chạy trong 4 bước

1. **Chuẩn bị repo.** Trong GitHub Desktop, mở `vlam1881997-ops/build-my-home`, chọn **Repository → Show in Explorer** và sao chép đường dẫn thư mục, ví dụ `D:\KBL\build-my-home`. Bấm **Fetch origin** ngay trước khi bắt đầu nếu dùng chế độ Desktop. Giữ nguyên các thay đổi đang làm; công cụ sẽ báo nếu repo chưa đủ điều kiện.
2. **Mở bộ điều phối.** Cài [Node.js 22 trở lên](https://nodejs.org), giải nén đầy đủ BMH Team và bấm đúp **MO-BMH-TEAM.cmd**. Trên trang vừa mở, dán đường dẫn thư mục BMH vào ô dự án. Nếu dùng PowerShell, mở tại thư mục chứa `start.ps1` rồi chạy:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1 -RepoPath "C:\Users\Tên ông\Documents\GitHub\build-my-home"
   ```

   Chính sách này chỉ áp dụng cho phiên PowerShell vừa mở. Launcher nhận Git từ GitHub Desktop và kiểm tra Codex CLI đúng phiên bản `0.158.0`. Nếu cần, nó cài gói chính thức `@openai/codex@0.158.0` cùng các thành phần phù hợp với Windows vào `%LOCALAPPDATA%\BMHTeam\runtime\codex-0.158.0`. Máy cần Node.js 64-bit (`x64` hoặc `arm64`).
3. **Đăng nhập lần lượt hai tài khoản.** Trên bảng vừa mở, bấm **Đăng nhập** ở thẻ thứ nhất, mở liên kết OpenAI và hoàn tất đăng nhập. Khi thẻ báo đã kết nối, làm tiếp thẻ thứ hai. Mở liên kết của tài khoản thứ hai trong hồ sơ Chrome khác hoặc cửa sổ ẩn danh để không chọn nhầm tài khoản thứ nhất. Không nhập mật khẩu hay API key vào BMH Team. Giữ cửa sổ PowerShell mở.
4. **Chọn model và giao một mục tiêu.** Mỗi thẻ có **Model giao việc** và **Mức suy luận**, tự lưu ngay khi đổi. Kiểm tra thư mục BMH và bộ chọn **Lấy mã nguồn mới**, nhập việc cần hoàn thiện rồi bấm **Phân việc & làm song song**. Bộ điều phối chia nhiệm vụ, chạy hai phiên, ghép code và kiểm tra. Khi sẵn sàng, mở thư mục/nhánh được báo, xem diff và kết quả. **Main và Vercel hiện tại chưa đổi**; chỉ triển khai sau khi ông chủ động ghép nhánh qua quy trình GitHub của dự án.

## Chọn cách lấy mã nguồn

- **Git tự lấy bản mới:** BMH Team thực hiện Fetch `origin/main` trước khi tạo worktree. Nếu Git trả lỗi, lượt chạy dừng và hiển thị nguyên nhân để xử lý.
- **GitHub Desktop — đã Fetch origin:** BMH Team kiểm tra nguồn vừa Fetch trong đúng repo, gồm commit `FETCH_HEAD` khớp `origin/main` và thời điểm Fetch trong 15 phút. Chọn repo `D:\KBL\build-my-home` trong Desktop và bấm **Fetch origin** ngay trước khi giao việc.
- Khi launcher nhận Git từ đường dẫn cài đặt GitHub Desktop, giao diện chọn sẵn chế độ Desktop. Lựa chọn của ông được giữ khi bảng cập nhật tiến độ. Client cũ không gửi lựa chọn vẫn dùng Fetch trực tiếp.
- Bảng tiến độ giữ commit nguồn và thời điểm Fetch của lượt chạy. Bộ chọn bị khóa khi đang chạy hoặc đang lưu model. Không có chuyển chế độ tự động sau khi lỗi.

## Chọn model khi giao việc

- Chọn sẵn **GPT-6.1 Sol + High** cho cả hai thẻ. Chọn **GPT-6 Astra** cho việc khó nhất, hoặc **GPT-6 Sol** nếu phù hợp quyền tài khoản. Có thể đặt hai thẻ khác nhau.
- Mức suy luận: **High**, **Extra High** hoặc **Medium**. Mức cao thường tốn thêm thời gian và hạn mức. Danh sách là lựa chọn cấu hình, không phải kiểm tra quyền dùng model của tài khoản.
- Mỗi lần chạy truyền rõ `--model` và `-c model_reasoning_effort` vào lệnh `codex exec`. Tài khoản 1 lập kế hoạch bằng model đã chọn trên thẻ 1; hai phần việc sau đó dùng model tương ứng. Cấu hình trong repo không hạ lựa chọn này xuống model khác.
- Bảng tiến độ, nhật ký và báo cáo giữ model đã giao cho từng phần việc. Trong khi nhiệm vụ đang chạy, bộ chọn bị khóa; đổi sau khi kết thúc để áp dụng cho lượt tiếp theo.
- Lựa chọn được lưu ở `%LOCALAPPDATA%\BMHTeam\model-settings.json`; hai phiên đăng nhập vẫn nằm trong thư mục riêng hiện có. Mở gói nâng cấp ở thư mục mới để dùng lại đăng nhập. Không chép gói lên repo đang làm nếu muốn tránh thay đổi chưa commit.
- Khi tài khoản/CLI chưa hỗ trợ model, mức suy luận hoặc đã hết quota, nhiệm vụ dừng và báo lỗi. Không tự chuyển xuống model khác, tài khoản khác hay API tính phí.

Để nâng cấp từ v1.0.1 hoặc v1.1.0: dừng nhiệm vụ đang chạy nếu có, đóng cửa sổ khởi chạy cũ, giải nén **BMH-Team-Windows-v1.1.1.zip** sang thư mục mới rồi mở **MO-BMH-TEAM.cmd** bên trong. Trong bảng mới, chọn thư mục repo Git thật, ví dụ `D:\KBL\build-my-home`; không chọn thư mục giải nén gói công cụ. Hai phiên đăng nhập và cấu hình model ở `%LOCALAPPDATA%\BMHTeam` được dùng lại.

Nguồn chính thức: [chọn model](https://learn.chatgpt.com/docs/models) và [cấu hình theo lần chạy](https://learn.chatgpt.com/docs/developer-settings). Các test dùng tiến trình mô phỏng, không gọi suy luận tính hạn mức và không xác nhận mọi tài khoản đã có quyền vào từng model.

## Phạm vi thực tế

Bản v1.0.1 sửa bước khởi chạy trên Windows: kiểm tra phiên bản bằng Node để cảnh báo từ CLI không làm PowerShell 5.1 dừng nhầm, yêu cầu npm cài thành phần tùy chọn và tự bổ sung đúng gói Windows còn thiếu khi xác định được. Chỉ báo sẵn sàng khi Codex thực thi thành công và trả đúng phiên bản. Nếu còn lỗi, cửa sổ hiển thị nguyên nhân đã lọc thông tin đăng nhập và lưu kết quả kiểm tra ở `%LOCALAPPDATA%\BMHTeam\runtime\last-cli-check.json`. Giải nén đầy đủ bản mới, gồm `runtime.mjs`, rồi mở lại `MO-BMH-TEAM.cmd`.

- Hai phiên dùng quyền Codex và hạn mức của từng tài khoản có gói đủ điều kiện. Không cần API key; công cụ không né hạn mức, không tự đổi tài khoản khi hết quota và không tự mua lượt dùng.
- Tài khoản được đăng nhập bằng cơ chế chính thức của Codex CLI. Dữ liệu đăng nhập giữ ở thư mục Codex riêng trên máy; token không được gửi xuống giao diện web. Dashboard chỉ lắng nghe loopback.
- Trên Windows, hai phiên dùng sandbox `unelevated` được Codex hỗ trợ để chạy không cần quyền quản trị. Khả năng cách ly hệ thống và mạng của chế độ này yếu hơn sandbox `elevated`. Nếu máy chặn môi trường thực thi, công cụ báo lỗi để xử lý; nó không tự chuyển sang quyền truy cập toàn máy.
- Công cụ điều phối việc sửa code cục bộ. Nó không tự đăng nhập GitHub/Vercel, không push, không tạo PR, không merge main và không triển khai production.
- Nút **Dừng công việc** yêu cầu dừng các phiên đang chạy. Các thay đổi đã tạo được giữ lại để xem lại; không có thao tác xóa repo đang làm.
- Hai lịch sử trò chuyện ChatGPT không được nối vào nhau. Ông giao việc ở BMH Team; hai phiên Codex nhận phần việc từ bộ điều phối trên máy.
- Đăng nhập tài khoản thật, GitHub Desktop trên Windows và suy luận Codex sử dụng hạn mức chưa được kiểm chứng từ đầu đến cuối trên máy của ông. Kiểm tra tự động dùng repo Git tạm và tiến trình/đầu ra mô phỏng; trạng thái kết nối trong ứng dụng được xác nhận từ CLI khi ông đăng nhập thực tế.

Tài liệu OpenAI về [các lệnh ổn định](https://learn.chatgpt.com/docs/developer-commands), [chế độ thực thi không tương tác](https://learn.chatgpt.com/docs/non-interactive-mode) và [sandbox Windows](https://learn.chatgpt.com/docs/windows/windows-sandbox).

Chạy kiểm tra công cụ từ thư mục gốc của repo:

```sh
node --test tools/bmh-team/test/*.test.mjs
```

Trong thư mục `tools/bmh-team` hoặc thư mục gói Windows đã giải nén, chạy `node --test test/*.test.mjs`.
