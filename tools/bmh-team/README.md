# BMH Team v1.1.4

Bộ điều phối của dự án BMH trên máy Windows: **hai tài khoản ChatGPT riêng, một mục tiêu, hai phiên Codex làm song song**. Công cụ dùng các lệnh ổn định `codex login`, `codex login status` và `codex exec` của Codex CLI chính thức, tạo worktree riêng, ghép kết quả vào một nhánh cục bộ và chạy kiểm tra. BMH Team là phần mềm riêng của dự án, không phải sản phẩm do OpenAI phát hành.

**v1.1.4 giữ các nâng cấp của v1.1.3 và tự sửa một lỗi lập kế hoạch trước khi giao hai tài khoản:** nếu TK1 chọn sai định dạng lệnh node test, BMH Team yêu cầu chính TK1 lập lại danh sách kiểm tra đúng một lần, kèm đường dẫn test có thật trong repo. Tài khoản vẫn dùng nguyên model/mức suy luận đã chọn. Nếu lần sửa vẫn sai, công cụ dừng trước khi tạo worktree của TK1/TK2.

**v1.1.3 cho phép tiếp tục phần đã làm và sửa giới hạn thời gian cho nhiệm vụ dài:** hoạt động từ Codex gia hạn thời gian chờ, trong giới hạn tối đa của mỗi phiên. Khi lượt trước thất bại hoặc dừng, công cụ tìm báo cáo đã lưu và các worktree còn hợp lệ để hiện **Tiếp tục phần đã làm**. Model và mức suy luận vẫn lấy từ danh sách riêng của mỗi tài khoản; công cụ không tự hạ model. Hai phiên đăng nhập, lựa chọn và báo cáo giữ ở `%LOCALAPPDATA%\BMHTeam`.

## Tiếp tục lượt bị hết thời gian hoặc đã dừng

1. Đóng bộ điều phối cũ sau khi lượt chạy đã dừng. Giải nén **BMH-Team-Windows-v1.1.4.zip** vào thư mục mới **ngoài `D:\KBL\build-my-home`**, rồi mở **MO-BMH-TEAM.cmd**. Giữ nguyên `%LOCALAPPDATA%\BMHTeam` và các thư mục công việc cũ để dùng lại đăng nhập, model, báo cáo và code.
2. Điền repo thật **`D:\KBL\build-my-home`**. Chờ cả hai thẻ kết nối và tải danh sách model. Kiểm tra lựa chọn đã lưu; **Ultra/max được giữ khi vẫn hợp lệ**. Nếu ông chủ động đổi lựa chọn trước khi tiếp tục, lượt mới dùng chính lựa chọn vừa lưu.
3. Thẻ **Công việc trước vẫn còn** hiển thị mục tiêu đã lưu, lý do dừng, số phần việc hoàn tất và thư mục đã làm. Bấm **Tiếp tục phần đã làm**. Không cần Fetch lại hay dán mục tiêu một lần nữa. Mục tiêu khác đang gõ trong ô nhập không bị thay bằng mục tiêu cũ.

Công cụ kiểm tra báo cáo, kế hoạch và phạm vi file, repo, nhánh, đường dẫn, commit nguồn và các thay đổi hiện có trước khi dùng lại worktree. Lượt tiếp tục giữ mục tiêu và phân công cũ, dùng các thư mục đã làm để hoàn thiện phần còn thiếu; không tạo lượt mới từ `main`, không Fetch, không reset hay xóa code. Đây là tiếp tục công việc trên các file đã lưu, không phải khôi phục toàn bộ lịch sử trò chuyện ChatGPT.

Tiếp tục tự động áp dụng cho lượt bị ngắt trước bước commit/gộp. Những nhánh đã commit hoặc bắt đầu gộp được giữ để xem lại kết quả và lỗi, không tự đặt lại lịch sử Git. Với báo cáo v1.1.3, phần đã hoàn thành có nội dung khớp bản lưu được dùng lại; báo cáo v1.1.2 được tài khoản phụ trách kiểm tra từ diff hiện có trước khi hoàn thiện.

Nút chỉ mở khi có hai tài khoản khác nhau, model hợp lệ, repo đã nhập và bộ điều phối đang rảnh, kết nối được. Thẻ chỉ xuất hiện khi có báo cáo thất bại/dừng với kế hoạch và worktree cũ còn tồn tại. Nếu kiểm tra phát hiện nhánh, đường dẫn hoặc thay đổi không hợp lệ, công cụ báo lỗi và giữ nguyên file để xem lại. **Code chưa tự ghép vào `main` hay triển khai Vercel.** Muốn bắt đầu mục tiêu khác, dùng **Giao mục tiêu mới** ở phần nhập bên dưới; đây là lượt mới theo chế độ lấy mã nguồn đang chọn.

## Khi TK1 lập kế hoạch chọn sai node test

Bản v1.1.4 liệt kê các file test thật trong repo cho TK1 lúc lập kế hoạch. Nếu kế hoạch đầu tiên vẫn sai định dạng node test, BMH Team yêu cầu TK1 sửa kế hoạch một lần ở chế độ chỉ đọc trước khi tạo hai worktree tài khoản. Lượt sửa dùng nguyên model và mức suy luận TK1 đang chọn, không chuyển sang tài khoản hoặc nhà cung cấp khác. Nếu lượt đó vẫn sai, đọc thông báo lỗi và giao mục tiêu lại sau khi đã cập nhật hướng dẫn; nguồn Git chính và file dự án không bị sửa.

Nếu bảng báo **Không lưu được tiến độ để tiếp tục sau khi mở lại**, báo cáo chưa được lưu thành công. File và nhánh vẫn còn trên máy, nhưng không bảo đảm có thể tiếp tục tự động sau khi đóng bộ điều phối. Giữ thông tin nhánh/thư mục để xem lại phần đã làm.

Giới hạn áp dụng cho **mỗi phiên Codex**, không phải tổng thời gian của toàn bộ công việc:

| Phần việc | Mức suy luận | Tối đa mỗi phiên | Dừng khi không có hoạt động mới |
|---|---|---:|---:|
| Lập kế hoạch | Các mức khác Ultra/max | 60 phút | 30 phút |
| Lập kế hoạch | Ultra/max | 90 phút | 45 phút |
| Sửa code | Các mức khác Ultra/max | 120 phút | 30 phút |
| Sửa code | Ultra/max | 240 phút | 60 phút |

Hoạt động từ tiến trình gia hạn thời gian chờ, vẫn giữ giới hạn tối đa. Không tự đổi model/mức suy luận hay mua thêm hạn mức khi chạy lâu. Lỗi quota, quyền truy cập và lỗi thực thi khác vẫn được báo để xử lý.

## Khi màn hình báo Git thất bại, mã thoát 128

1. Dừng lượt cũ nếu đang chạy, đóng cửa sổ khởi chạy, giải nén **BMH-Team-Windows-v1.1.4.zip** vào một thư mục mới ngoài repo rồi mở **MO-BMH-TEAM.cmd**. Giữ nguyên `%LOCALAPPDATA%\BMHTeam` để dùng lại hai phiên đăng nhập và model đã chọn.
2. Trong GitHub Desktop, chọn đúng repo **`D:\KBL\build-my-home`** và bấm **Fetch origin** ngay trước khi giao việc. Nếu Desktop báo lỗi, xử lý đăng nhập/quyền truy cập theo thông báo của Desktop trước.
3. Trong BMH Team, điền **`D:\KBL\build-my-home`**, chọn **GitHub Desktop — đã Fetch origin**, giữ mục tiêu công việc rồi bấm **Phân việc & làm song song**.

Chế độ Desktop chỉ nhận `FETCH_HEAD` có commit khớp `origin/main` và thời điểm Fetch trong **15 phút**. Lần Fetch thiếu, cũ hoặc không khớp sẽ dừng để ông Fetch lại. Công cụ không tự dùng nguồn cache cũ khi lấy bản mới thất bại. Lỗi Git trong bước chuẩn bị xảy ra trước khi giao việc cho model; màn hình báo nguyên nhân và **File nhật ký**, thay vì đưa ra thư mục xem lại chưa tồn tại.

## Khởi chạy trong 4 bước

1. **Chuẩn bị repo.** Trong GitHub Desktop, mở `vlam1881997-ops/build-my-home`, chọn **Repository → Show in Explorer** và sao chép đường dẫn thư mục, ví dụ `D:\KBL\build-my-home`. Bấm **Fetch origin** ngay trước khi bắt đầu nếu dùng chế độ Desktop. Giữ nguyên các thay đổi đang làm; công cụ sẽ báo nếu repo chưa đủ điều kiện.
2. **Mở bộ điều phối.** Cài [Node.js 22 trở lên](https://nodejs.org), giải nén đầy đủ BMH Team và bấm đúp **MO-BMH-TEAM.cmd**. Trên trang vừa mở, dán đường dẫn thư mục BMH vào ô dự án. Nếu dùng PowerShell, mở tại thư mục chứa `start.ps1` rồi chạy:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1 -RepoPath "C:\Users\Tên ông\Documents\GitHub\build-my-home"
   ```

   Chính sách này chỉ áp dụng cho phiên PowerShell vừa mở. Launcher nhận Git từ GitHub Desktop và kiểm tra Codex CLI đúng phiên bản `0.160.0`. Nếu cần, nó cài gói chính thức `@openai/codex@0.160.0` cùng các thành phần phù hợp với Windows vào `%LOCALAPPDATA%\BMHTeam\runtime\codex-0.160.0`. Máy cần Node.js 64-bit (`x64` hoặc `arm64`).
3. **Đăng nhập lần lượt hai tài khoản.** Trên bảng vừa mở, bấm **Đăng nhập** ở thẻ thứ nhất, mở liên kết OpenAI và hoàn tất đăng nhập. Khi thẻ báo đã kết nối, làm tiếp thẻ thứ hai. Mở liên kết của tài khoản thứ hai trong hồ sơ Chrome khác hoặc cửa sổ ẩn danh để không chọn nhầm tài khoản thứ nhất. Không nhập mật khẩu hay API key vào BMH Team. Giữ cửa sổ PowerShell mở.
4. **Chọn model và giao một mục tiêu.** Sau khi đăng nhập, mỗi thẻ tự tải danh sách model của chính phiên Codex. Chọn **Model giao việc** và **Mức suy luận** trong danh sách, tự lưu ngay khi đổi. Nếu lựa chọn cũ báo không được hỗ trợ, chọn lại trên từng thẻ; có thể bấm **Làm mới model** để tải lại. Nút giao việc chỉ mở khi cả hai lựa chọn hợp lệ. Kiểm tra thư mục BMH và bộ chọn **Lấy mã nguồn mới**, nhập việc cần hoàn thiện rồi bấm **Phân việc & làm song song**. Bộ điều phối chia nhiệm vụ, chạy hai phiên, ghép code và kiểm tra. Khi sẵn sàng, mở thư mục/nhánh được báo, xem diff và kết quả. **Main và Vercel hiện tại chưa đổi**; chỉ triển khai sau khi ông chủ động ghép nhánh qua quy trình GitHub của dự án.

## Chọn cách lấy mã nguồn

- **Git tự lấy bản mới:** BMH Team thực hiện Fetch `origin/main` trước khi tạo worktree. Nếu Git trả lỗi, lượt chạy dừng và hiển thị nguyên nhân để xử lý.
- **GitHub Desktop — đã Fetch origin:** BMH Team kiểm tra nguồn vừa Fetch trong đúng repo, gồm commit `FETCH_HEAD` khớp `origin/main` và thời điểm Fetch trong 15 phút. Chọn repo `D:\KBL\build-my-home` trong Desktop và bấm **Fetch origin** ngay trước khi giao việc.
- Khi launcher nhận Git từ đường dẫn cài đặt GitHub Desktop, giao diện chọn sẵn chế độ Desktop. Lựa chọn của ông được giữ khi bảng cập nhật tiến độ. Client cũ không gửi lựa chọn vẫn dùng Fetch trực tiếp.
- Bảng tiến độ giữ commit nguồn và thời điểm Fetch của lượt chạy. Bộ chọn bị khóa khi đang chạy hoặc đang lưu model. Không có chuyển chế độ tự động sau khi lỗi.

## Chọn model khi giao việc

- Mỗi tài khoản dùng danh sách riêng do `codex app-server` trả về qua `model/list`, gồm tên model, mức suy luận được hỗ trợ và giá trị mặc định. Danh sách tự tải khi mở bộ điều phối và sau khi đăng nhập; **Làm mới model** tải lại cho riêng thẻ đó. Model có nhãn **Codex đề xuất** là mục `isDefault` trong kết quả, không phải cam kết chất lượng hay quyền suy luận luôn sẵn có.
- Không dùng danh sách model cố định chung cho hai thẻ. `gpt-6.1-sol` được chọn ở bản cũ có thể không được phiên ChatGPT/Codex hiện tại hỗ trợ. Khi model hoặc mức suy luận đã lưu không nằm trong danh sách của tài khoản, bộ chọn hiện chỗ trống và cảnh báo, giữ nguyên dữ liệu đã lưu cho đến khi ông chọn lại. Không tự hạ model, đổi tài khoản hoặc gọi API tính phí.
- **Mức suy luận** chỉ hiện các mức model đang chọn hỗ trợ. Khi ông đổi model, công cụ giữ mức hiện có nếu model mới hỗ trợ; nếu không, nó chọn và hiển thị mức mặc định model mới trả về, rồi lưu chính xác cả hai giá trị. Mức cao có thể chạy lâu hơn và dùng thêm hạn mức.
- Cả hai danh sách phải tải thành công và cả hai lựa chọn phải hợp lệ trước khi giao việc. Nếu danh sách tải lỗi, đọc cảnh báo tại thẻ và bấm **Làm mới model**. Danh sách khả dụng không thay thế kiểm tra hạn mức: lỗi quyền truy cập hoặc quota khi suy luận vẫn sẽ dừng nhiệm vụ và báo lỗi.
- Mỗi lần chạy truyền rõ `--model` và `-c model_reasoning_effort` vào `codex exec`. Tài khoản 1 lập kế hoạch bằng lựa chọn trên thẻ 1; hai phần việc dùng lựa chọn tương ứng. Model được chụp lại trong báo cáo của nhiệm vụ và bị khóa khi đang chạy.
- Lựa chọn được lưu ở `%LOCALAPPDATA%\BMHTeam\model-settings.json`; hai phiên đăng nhập vẫn nằm trong các thư mục riêng. Nâng cấp bằng cách dừng nhiệm vụ nếu có, đóng bộ điều phối cũ, giải nén **BMH-Team-Windows-v1.1.4.zip** vào thư mục mới **ngoài repo dự án**, rồi mở **MO-BMH-TEAM.cmd**. Chọn repo Git thật như `D:\KBL\build-my-home`, không chọn thư mục giải nén công cụ. Phiên đăng nhập được dùng lại; kiểm tra model hợp lệ trước khi giao việc hoặc tiếp tục lượt cũ.

Nguồn chính thức: [Codex app-server và `model/list`](https://learn.chatgpt.com/docs/app-server), [chọn model](https://learn.chatgpt.com/docs/models) và [cấu hình theo lần chạy](https://learn.chatgpt.com/docs/developer-settings). Các test dùng tiến trình/đầu ra mô phỏng; kết quả không xác nhận suy luận thật trên hai tài khoản của người sử dụng.

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
