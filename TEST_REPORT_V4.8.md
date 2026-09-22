# V4.8 Test Report

Build date: 2026-09-22

## Passed
- `npm test`: build completed and combined runtime passed `node --check`.
- Every source `.js` and build `.cjs` file passed Node syntax check.
- `npm run build:vercel` produced a clean `public/` output.
- VM runtime smoke rendered Steps 3, 6 and 8 without the app runtime-error screen.
- Real Data Engine panel appears in Step 3 and Step 6; estimate source/snapshot controls appear in Step 8.
- CSV supplier quote import changed shell/finish unit rates and the Viglacera material override.
- Estimate snapshot stored source/date/total after quote import.
- Final `dist/index.html`, `dist/app.js`, `dist/styles.css` and assets exist.

## External API note
The build container could not resolve external DNS during direct curl testing. The Open-Meteo endpoints and parameters were therefore checked against the current API documentation, while the app retains explicit live/fallback states so a network failure does not break the project workflow.
