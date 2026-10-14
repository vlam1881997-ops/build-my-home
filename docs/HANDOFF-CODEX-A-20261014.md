# Codex A — Commercial Pilot v1

Status: **A LOCAL QA PASSED — INTEGRATION BLOCKED — NOT COMPLETE**. Updated 2026-10-08 UTC.

- Repository: `vlam1881997-ops/build-my-home`.
- Branch: `codex/a-commercial-v1-20261008`.
- Base `origin/main`: `15562c60244897ec2e7193fe88676931d4532afd`.
- Tested implementation head: `a88a5a5ad36bde017b4b28cd4a72e3fbca8558f4`.
- Implementation tree: `b3fddbc7ce2a1401c25f27af2b8a0297781a3cf2`.
- Draft PR: https://github.com/vlam1881997-ops/build-my-home/pull/30 . The subsequent handoff-only commit contains this report.
- Account: `vlam1881997-ops`, verified author email `vlam1881997@gmail.com`.
- Scope: A-owned source/tests only, plus this authorized handoff. No production deployment or merge.

## Data contract delivered

`project.site` and `project.plan` remain the only geometry store. State units are metres; CAD output is millimetres. Plan `y` maps to Three `z`. Stable room/opening/fixture/shaft IDs remain unchanged during migration.

`constructionDesign.schemaVersion = 2` retains legacy input, element, review and issue data. Structured records use `status` and `reviewState` aliases with `missing`, `provisional`, `provided`, `awaiting-review`, `reviewed`, or `stale`. Unstructured legacy entries remain stored, are counted as pending, and cannot count as approval. Generated legacy IDs are deterministic.

`BMH.constructionDesignIdentity()` excludes review bookkeeping to prevent a review invalidating its own geometry revision. Dimensions, source references and dependencies remain in the identity. `BMH.constructionReview()` returns a sanitized summary, never raw evidence documents. A record marked reviewed requires reviewer name, KTS/KS role, review document reference, valid date, and the reviewed drawing revision. This records supplied review metadata; it does not authenticate a professional credential or signature. All dossiers remain proposals.

`BMH.save()` marks documented reviews stale when the drawing revision changes. Finance and a same-SKU price edit preserve geometry revision; geometry, product SKU/specification and technical dimensions change it. Stale records retain the approved revision for audit. Review dependency handling currently invalidates conservatively against the whole drawing revision.

Required customer label: **HỒ SƠ PHƯƠNG ÁN — CHƯA DÙNG THI CÔNG**.

## Levels and export contract

- `site.floorHeights[]`: metres; a missing/null slot falls back to legacy `site.floorHeight`. No second geometry store. `siteLevels(site)` returns cumulative `levels`, `heights`, `elevations`, `roofBase`, `uniform`, `issues` and a relative/provisional datum.
- `BMH.resolvedProjectLevels()` adapts old scalar `projectLevels()` consumers. `BMH.floorLevel(f)` returns `{floor,base,height,slab,ceilingDrop,clearHeight,status,source}`. Heights are 2.4–6 m, with clear height at least 2.1 m; malformed data produces issues rather than an invented survey elevation.
- `editFloorHeight(f,height|null)` checks room locks/openings/fixtures before mutation; undo/redo/save/reload preserve per-floor levels. Roof, elevations, sections, stair rise, elevator stops and A quantities consume cumulative levels.
- Snapshot exports retain `floorHeights`, derived levels and sanitized technical review. A3 adds cover, parcel/source sheet, material schedule and missing-input/technical register alongside plans, roof, four elevations, two sections, stairs, lift and schedules. Tables round display quantities only; underlying quantities remain unrounded.
- Unequal-floor 3D package and GLB exports are blocked until B supplies `BMH.STUDIO_LEVELS_CONTRACT === 1`. This is a developer capability after verification, not a customer approval checkbox. Two-dimensional A3 remains available. The current unequal-floor renderer is NOT certified consistent.

## Cost contract

`measuredMaterialQuote(category)` requires SKU, source, valid quote date, region, expiry, compatible unit, price scope, explicit waste, labour treatment, VAT treatment/rate and transport treatment/amount. Missing inputs remain null/unknown; explicit sourced zero is allowed. Different-SKU quotes are rejected. Price-only edits preserve drawing revision; SKU/specification edits invalidate it.

`measuredBoqSchedule()` / `measuredBoqSummary()` separate sourced known amounts from planning allowances. Missing structure/MEP quantities are never calculated from guessed dimensions. A supplied technical `providedQuantity:{value,unit,sourceReference}` is accepted only with supplied evidence; stale review is exposed. `knownSubtotal + explicit contingency = totalKnown`; `completeTotal` stays null while any scope is unpriced. Known quoted transport is excluded from the allowance transport percentage to avoid adding it twice. Included VAT is not represented as zero total tax: `embeddedVatAmount` is unknown while `additionalTaxAmount` is zero.

Customer export includes `boq-co-nguon.csv`, quantity CSV and cost JSON; XLS separates sourced rows from planning allowances. CSV guards formula-like user strings. Alternative-price comparison explicitly retains the same SKU/specification, region, validity, labour, transport and tax scope.

## Validation and reproducible artifacts

| Gate | Result and evidence |
| --- | --- |
| Full regression | `npm test`: 390 passed, 0 failed; Node 24.19.0. Repository requests Node 22.x; coordinator repeat required. |
| Editor desktop/phone | `customer-design.browser.cjs`: add/edit/delete, off-centre openings, locks, inverse-CTM gestures, history, persistence and uniform-floor actual 3D passed. Renderer test checks IDs across grouped facade meshes and two door jambs plus lintel. |
| Measured design/cost desktop/phone | `measured-design.browser.cjs`: geometry, quantities, quote metadata, frozen budget baseline, stage progress and customer package passed. |
| Evidence desktop/phone | `design-evidence.browser.cjs`: source form, invalid boundary atomic rejection, save/open/reload/import, review invalidation and privacy passed. |
| Dossier desktop/phone | `architectural-dossier.browser.cjs` with `BMH_PDF_CHECK=1`: passed, including native PDF downloads. |
| A3 PDF | Four PDFs: 23 desktop + 23 phone + 23 rectangular fixture + 29 commercial fixture = 98 pages. All rendered through Poppler and visually reviewed; A3 420 × 297 mm, searchable Vietnamese, proposal notice on every page, no NaN/undefined. |
| SVG/CAD | Commercial site SVG dimensions 9000/10000/1000/12000/8000/22000 mm. Three DXFs parsed/audited with ezdxf, no errors, `$INSUNITS=4`, all six vertices exactly match metre-to-mm conversion and CAD Y sign convention. Every model entity contains the same revision in BMH XDATA. LibreCAD is unavailable; no GUI-open claim. |
| BOQ/privacy | Synthetic known subtotal 156,211,839 VND; explicit 10% contingency 15,621,184; total known 171,833,023; six unpriced rows, complete total null. All sheets/CSV/cost JSON use `C6F13BAA-741638A5-AI1-RH1`. Raw-document/private-finance sentinels absent from customer package. |
| Source hygiene | `git diff --check` passed; scoped secret patterns found no matches. No B/coordinator files, manifests, dist, environment files or assets committed. No new dependencies. |

The repeatable commercial fixture lives in `tests/architectural-dossier.browser.cjs` (`commercialFixture`): six-vertex concave LOCAL_METRES site, heights 3.8/3.4/3.1 m, cumulative bases 0/3.8/7.2 m, door offset .137, U stairs, one shaft through three floors, custom laundry, worship moved from floor 2 to 3 with undo/redo, explicitly synthetic supplied column/beam and two sourced synthetic SKUs. Synthetic professional names, quotes and dimensions are TEST-ONLY, not real evidence.

Run `npm test` completely BEFORE browser suites so they load the current built source. Each suite serves existing dist; it does not build. Example environment: `NODE_PATH="$CODEX_PRIMARY_RUNTIME_NODE_MODULES" BMH_CHROMIUM_EXECUTABLE=/workspace/scratch/459d174423c7/qa-browser/chromium BMH_BROWSER_OUTPUT=<output> BMH_PDF_CHECK=1 node tests/architectural-dossier.browser.cjs`. Existing Chromium 153.0.8010.0 was reused. Browser tests block third-party/provider writes; service-worker blocking warnings are intentional isolation.

Evidence archive `BMH-Codex-A-QA-20261008.zip` contains four PDFs, commercial SVG/DXF/CSV/JSON exports, test-only fixture snapshot, acceptance report, PDF/DXF audit, logs and SHA-256 manifest. The committed browser fixture reproduces these outputs; transient absolute QA paths are not a deployment requirement.

## Blocking integration requests — coordinator / Codex B

1. **P1, B:** migrate unequal-floor 3D consumers in `45_studio3d`, `46_architectural_render`, `98_model_presentation`, `103_real_house` and review legacy helper `78_design_workflow`. Use `floorLevel(f).base + f*explode`, `.height`, `.clearHeight` and `resolvedProjectLevels().roofBase`, instead of `f*floorHeight`. Verify all room/opening/shaft IDs, slab voids, fixtures, roof and facades against the commercial fixture; only then expose `STUDIO_LEVELS_CONTRACT=1`. A has not edited these files.
2. **P1, coordinator:** provide an integrated A+B SHA after A merges first; repeat full/desktop/mobile/export parity tests on that SHA. No integrated build was supplied, so these local branch results do not claim integration acceptance.
3. **Blocked preview access:** GitHub reports Vercel success for the earlier A commit, but the connected Vercel account returns project/deployment not found and 403 `forbidden` when fetching this branch preview. Authorize project `build_my_home_full_v1.2_github` (`prj_PcB996IRamEZqWrKpA5qk9T290kh`) in team `vlam1881997-9266` (`team_vDX7I7zG36VBbi7444e5CCiw`) to complete preview testing. No protection settings or production deployment were changed.
4. **Blocked security gate:** Codex Security is not connected; requested scanner has NOT run. Scoped pattern scanning is only supplementary. Connect/run the required scanner before release.
5. **Coordinator dependency gate:** existing `npm audit` reports one moderate esbuild advisory GHSA-67mh-4wv8-2f99, zero high/critical. Current build uses `buildSync` and a separate HTTP dev server, not esbuild's serve API. Assess/update esbuild in coordinator-owned manifests and repeat audit. A did not change dependencies. Repeat tests on declared Node 22.x.

P2/known limits: review invalidation is conservative against the whole drawing revision; persisted reviewer metadata does not authenticate a license/signature. Cost comparisons rely on explicitly matching commercial terms. All generated geometry is a proposal based on entered data. No foundation/rebar/beam/column/MEP engineering calculations were added.

## Professional-input checklist

- Measured coordinates/dimensions and cadastral or survey evidence; surveyed elevation datum and North.
- Sourced planning limits/setbacks; a map pin is not a legal boundary.
- Geotechnical survey, design loads and structural system supplied by the engineer.
- Lift manufacturer/model documentation including cabin, shaft, pit and headroom.
- MEP design and approved quantities; supplier SKU/specification/quote region/date/expiry/VAT/labour/transport.
- Named KTS/KS reviewer, referenced review document/date and exact approved drawing revision.

Missing real inputs remain `unknown`, `provisional` or `awaiting-review`. No genuine professional project inputs were supplied. No production release, merge or COMPLETE claim is authorized by these local results.

## Changed-file manifest

- `src/10_state.js`
- `src/30_planner.js`
- `src/35_dossier.js`
- `src/40_exports.js`
- `src/75_completion.js`
- `src/76_architecture.js`
- `src/79_stair_design.js`
- `src/87_elevator_design.js`
- `src/92_measured_design.js`
- `src/93_measured_cost.js`
- `src/94_architectural_design.js`
- `src/95_architectural_documents.js`
- `src/99_customer_design.js`
- `tests/architectural-dossier.browser.cjs`
- `tests/architectural-dossier.test.mjs`
- `tests/completion.test.mjs`
- `tests/customer-design.browser.cjs`
- `tests/customer-design.test.mjs`
- `tests/design-evidence.browser.cjs`
- `tests/design-evidence.test.mjs`
- `tests/measured-design.browser.cjs`
- `tests/measured-design.test.mjs`
- `docs/HANDOFF-CODEX-A-20261014.md`
