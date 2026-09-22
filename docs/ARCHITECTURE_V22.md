# V2.2 Architecture

## 1. State

Một state duy nhất gồm ba vùng:

- `ui`: bước hiện tại, trạng thái sidebar, planner, scene.
- `access`: entitlement trả phí.
- `project`: tài chính, vị trí, gia đình, mặt bằng, vật liệu, checklist.

Mọi thay đổi đi qua state này và lưu vào `localStorage` với key `bmh-v22-refactored`.

## 2. Navigation

Tất cả Stepper, Sidebar và Footer đều gọi `BMH.navigateTo(step)`.

Quy tắc paywall nằm duy nhất tại đây:

- bước 1–8: truy cập được.
- bước 9–10 + `paid=false`: ép về Bước 8.
- bước 9–10 + `paid=true`: truy cập được.

## 3. Planner

Planner không còn nhiều script cùng bind drag.

Một pointer controller xử lý:

- chọn phòng
- kéo phòng
- resize phòng
- snap 0,1 / 0,2 / 0,5m
- collision / ranh đất

SVG được render theo layer theo thứ tự: grid -> phong thủy -> ranh đất -> phòng/tường -> nội thất -> openings -> dimension -> ruler/title block.

## 4. Build

`src/00_boot.js` -> constants/helpers

`src/10_state.js` -> state/persistence

`src/20_calc.js` -> finance/estimate/fengshui

`src/30_planner.js` -> planner model/render

`src/40_exports.js` -> CSV/SVG/ZIP exports

`src/50_screens.js` -> 10 màn hình

`src/60_app.js` -> layout/controllers/events

Build script nối source theo dependency order vào một IIFE và xuất duy nhất `app.js`.
