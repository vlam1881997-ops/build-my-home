# V3.3 QA Checklist

## Planner

- [x] Chỉ một pointerdown / pointermove / pointerup controller.
- [x] Smart-wall edge editing có đồng bộ phòng kề cạnh.
- [x] Click trực tiếp lên tường để đặt cửa/cửa sổ.
- [x] Chặn ô mở trùng nhau hoặc vượt tường.
- [x] Offset cửa/cửa sổ chỉnh được bằng inspector.
- [x] Undo / Redo có giới hạn lịch sử.
- [x] Zoom / Fit hoạt động qua cùng state controller.
- [x] Esc thoát tool placement.
- [x] Validator có kiểm tra door/window/minimum room width cơ bản.

## 3D / Review

- [x] Điểm review tính từ state hiện tại thay vì hard-code.
- [x] Cutaway vẫn nhận geometry Bước 5 + vật liệu Bước 6.
- [x] Có chế độ tách tầng/ghép tầng.

## Runtime

- [x] `npm test` pass.
- [x] `npm run build:vercel` pass.
- [x] `public/` chỉ có một local JS bundle và một local CSS bundle.
- [x] Không có legacy patch files.
