# BMH materials, recovery and cost improvements

## Customer behaviour

All ten project functions remain visible. The material showroom keeps supplier selection, SKU and entered quote data. After selecting a floor, paint or cabinetry product, a compact panel offers a generic surface profile and **Áp dụng & xem 3D**. The customer can compare other products in a disclosure without losing the primary selection. Creating measured rooms is required before applying a preview.

The preview changes actual room finishes, with a visible product/SKU reference. Generic wood, paint and tile textures approximate the selected product; they do not claim to reproduce the manufacturer's exact sample. Bindings disappear when the selected product or current surface profile no longer matches. Client design snapshots and printable material tables include only allowlisted supplier/profile fields.

Floor, wall, wood and upholstery selectors can update the current measured scene without recreating its renderer or geometry. Material colour, roughness, normal scale and metre-based UVs update together. Room isolation and wall clipping planes are preserved. A changed building, furniture collection, project or unsupported imported model falls back to the existing full scene rebuild. Retired material sets are released while scene-owned textures remain available. First compilation of a different shader can still take longer than subsequent changes.

The finance KPIs use two readable columns. Opening the bank tab or choosing a bank no longer starts AI research. The existing **Cập nhật** action explicitly requests source verification. Presets and manual interest rates continue to support loan simulations; they remain unverified until suitable source evidence is returned. Loan exports and repayment calculations are unchanged.

## Reliable device storage

The anonymous project database migrates from schema 1 to 2 while preserving designs and summaries. An active-project record is written with each design save and when opening another design. Startup can recover the selected project from this database when the quick localStorage copy is stale or absent. The selected design is restored even when a newer copy exists.

If localStorage reaches its quota, saving continues through IndexedDB. If the project write also fails, the header/footer expose the error on phones and the full JSON backup remains available. These are device saves; moving to another device still requires a backup/import or configured cloud storage. No paid entitlement can be restored from a local snapshot.

## Verification

`npm test` runs 202 checks, including real Three material changes, geometry retention, another room's unchanged material, clipping planes, bounded caches and stale supplier bindings.

`tests/customer-studio.browser.cjs` uses real desktop and 390 px phone controls for all ten routes, showroom selection and preview, explicit bank research, a 60-month repayment export, measured elevators, camera/renderer preservation, PNG/GLB and customer ZIP content. It also migrates a schema-1 project, simulates localStorage quota and missing quick cache, opens an older selected design, checks JSON backup content, and exposes a failed IndexedDB write on phone. `BMH_BROWSER_RECOVERY_ONLY=1` runs the affected recovery story alone.

Every context blocks third-party requests and unmocked API/write requests before navigation. Explicit page fixtures simulate bank and AI responses, avoiding provider charges, real orders and fixture-coordinate disclosure. The same harness supports the production domain via `BMH_BROWSER_URL`.

## Costs and launch configuration

The release adds no npm dependency or hosted service. Interactive 3D, quick PNG, measured drawings, GLB and JSON backup use the existing local engines. Existing BMH drawing, image, 3D, interface, graphics and quality skills cover the work; the 3D/quality guidance now includes finish performance, storage recovery and isolated browser checks. No additional plugin connection or subscription is required for these features.

Free plugin access does not make its downstream service or model usage free. Keep AI generation and source research explicit, measure provider usage, and define a durable customer allowance before selling AI work. Do not activate a trial or paid integration merely to obtain another tool.

Commercial hosting eligibility also matters: [Vercel's Hobby documentation](https://vercel.com/docs/plans/hobby) limits that free plan to personal, non-commercial use. The account's actual plan must be verified before selling through the deployment; this release does not change billing or the hosting plan.

Cross-device identity/storage, real merchant setup, service pricing/deliverables, customer usage accounting and business terms remain launch configuration. Check live capability flags and actual fulfilment before advertising paid checkout. Preliminary architectural output still requires the relevant professional and manufacturer reviews for construction or elevator installation.
