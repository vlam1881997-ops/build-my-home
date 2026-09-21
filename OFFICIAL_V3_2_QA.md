# V3.2 QA Checklist

## Automated
- `npm test`
- `npm run build:vercel`
- `node --check dist/app.js`

## Bước 5
- Chuyển tầng không làm mất lựa chọn phòng.
- Kéo / resize vẫn snap theo 0.1 / 0.2 / 0.5m.
- Không cho phòng chồng nhau hoặc vượt ranh.
- Tường bao đậm hơn tường ngăn.
- Cửa/cửa sổ hiển thị mã D/W và chỉnh được cạnh đặt + chiều rộng.
- Dimension chain không đè lên tên phòng.
- Fullscreen mở đúng drafting sheet.

## Bước 7
- Toàn nhà / từng tầng / từng phòng đều tự fit viewport.
- Màu sàn/sơn/cửa thay đổi theo Bước 6.
- Chế độ ngày/đêm không xuất hiện ngoài Bước 7.
- Timeline 3/5/10 năm vẫn hoạt động.

## Regression
- Bước 8 chưa thanh toán không thể đi sang Bước 9/10.
- Public chỉ chứa `app.js` và `styles.css` cho runtime local.
