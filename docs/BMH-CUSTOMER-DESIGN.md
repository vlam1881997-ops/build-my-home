# Customer design intent

BMH keeps the customer's architectural style and explicit surface/product selections when applying another spatial option. The 24 styles already present in the product map to ten measured interior shape families. Room collections explicitly authored for the current style can differ; the review panel exposes that difference and lets the customer return shapes to the house style. An old collection from another style cannot override the new style. Procedural surfaces retain metre-scale mapping; exact vendor replication requires vendor texture, dimensions and a physical sample.

The brief accepts bedroom/WC counts including zero, living/kitchen/office/ground garage and worship placement for every floor. Worship can be absent, a separate room, or a measured altar in the living room. Invalid imported counts remain visible and block generation. Packing respects the actual parcel and existing lift/stair checks. Spare space is explicitly flexible circulation space, never an extra requested bedroom or bathroom.

The drawing provides one direct tool selector: select, draw room/corridor, door, window, passage, altar and erase. SVG coordinates are obtained using the inverse screen matrix, including landscape rotation. Contextual numeric fields edit the measured object. Locked rooms/floors and both sides of a shared wall prevent changes. Room movement translates owned fixtures; shrinking across a fixture rejects the edit; rotation carries the fixture footprint and backing side. Undo/redo shares the plan, measured roof/style, finish and floor-program timeline.

Fixtures are stored in `project.plan.fixtures` in metres. Provisional altar geometry appears in editable SVG, A3 plans, furniture schedules, millimetre DXF and metre GLB with fixture IDs. Passage apertures retain wall/circulation geometry without a door leaf or door purchase quantity. Customer packages include the design intent and fixtures via explicit design-only fields, excluding finance, household birth dates, account and payment data.

The worship score is BMH's disclosed cultural reference, not a construction or universal feng shui certification: room/door clearance 30, WC separation on current/upper floor 25, room use 10, solid backing 10, declared site direction and existing family reference 25. Missing orientation/family data reduces coverage. Placement remains the customer's choice.

Validation: `npm test`; `tests/customer-design.browser.cjs` on desktop and phone; existing customer-studio persistence/material/finance checks; architectural A3/GLB/PNG exports. Browser fixtures block external service writes and provider requests. Generated dist/public files are not part of the source commit. Geometry is a preliminary architectural model; structural, MEP, site survey and vendor elevator details still require their professional design inputs.


## Visible inspiration and customer-defined rooms

The style area displays the chosen architecture concept and interior reference, plus the actual four finish choices. Reference photos are labelled separately from the measured project model. Per-room surface and SKU detail remains in a disclosure.

Each floor accepts additional laundry, storage, office, gym, hobby or named custom-room requests. Every request has a stable ID, name, count and minimum plan area. The measured packing routine includes every request or rejects an infeasible program without replacing the existing plan. No-WC technical bays are labelled as technical bays rather than invented laundry rooms. Direct rectangle drawing also supports a named custom room.

Laundry uses a procedural front-loading washing-machine model, 600 × 650 × 850 mm, with the same position and bounds in the drawing, furniture schedule and 3D. It is a generic appliance rather than a supplier SKU. A visible room strip lets customers pick a floor or room; entering a room is also available for laundry and other regular rooms. Image generation remains an explicit button.

Gemini starts with `generateContent`, retains a compatible Interactions fallback, bounds reasoning independently of JSON output, limits model retries and stops when the provider reports zero quota. Image routing automatically uses Flash; an explicitly configured Pro image model is honoured. Captured AI references are resized to 1280 px before upload. Public diagnostics distinguish accepted credentials, discovered text/image models and unverified generation quota. No credentials are sent to the browser.

Focused verification: `tests/customer-design.test.mjs`, `tests/step1-ai.test.mjs`, `tests/completion.test.mjs`, `tests/home-finish.test.mjs`, and `tests/customer-experience.browser.cjs` on desktop and phone. Paid provider requests are mocked; production diagnostics only list models. Reasoning configuration follows https://ai.google.dev/gemini-api/docs/generate-content/thinking .
