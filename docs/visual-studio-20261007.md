# BMH visual studio — 7 October 2026

Customers saw long introductory panels and a moodboard before reaching their measured model or editable drawing. The idea page had 28 visible form/button controls, while the main style library was easy to miss. This release puts the actual work and useful style choices first.

## Visible changes

- Desktop: forest-green navigation rail with direct access to all ten existing functions, a project header and consistent paper/white work surfaces. Phone: the same ten routes in a compact two-row navigation grid. No intake fields, validators or onboarding steps change.
- Ideas: a large, explicitly labelled inspiration photo beside the real upload/prompt/research controls; four prominent style choices and the complete existing 24-style library in a native disclosure. Profile facts, file-type shortcuts, construction mode and preliminary review remain available in named native disclosures. A project with a plan opens its 3D from the primary next action; a fresh project retains the real proposal generator. Existing customer uploads remain in the reference files and can supply the hero.
- Drawing: the current editable plan and inspector precede supplementary proposal/roof review when a plan exists. Empty plans still present the program/proposal flow first. The current drawing revision and technical settings remain available.
- 3D: the measured canvas appears before sample moodboards; download controls follow the full-width model container. All floor/room views, materials, lighting, camera and native export operations retain their real handlers. Measured geometry and source prices are unchanged.
- Materials: shorter heading, clearer tier grouping, a bounded phone category strip, and native disclosures for importing quotes and checking regional sources. Product identity, dates, units, price status and room binding still use the existing source/finish engines.
- Banking, estimates, construction and handover retain their domain screens and operations.

## Verification

The same 8×18 m, two-floor Japandi fixture was captured before and after on 1440×1040 desktop and 390×844 phone. Ideas reduced from 28 to 16 default visible controls while all twenty-four style selections stayed reachable. Supplementary controls remain openable. Actual render fallback detection is checked in addition to browser page errors; horizontal overflow is checked on all ten real routes. Style clicks/reload must preserve the measured plan.

`tests/visual-studio.browser.cjs` walks the complete visual story with provider/API writes blocked. `tests/material-selection.browser.cjs` checks showroom-to-room selection, manual finishes, scene/camera/position buffer retention and reload. `tests/customer-design.browser.cjs` uses the updated visible style disclosure and continues to cover direct edits, banking and native exports. Local relevant Node checks: 105 passed. Full repository CI remains required before merge.

The new visuals are inspiration, not the customer's measured building or professional construction approval. This change does not configure payments/cloud storage or enable a provider quota.

## Image provenance and final prompt

Project asset: `assets/styles/studio-inspiration-v1.webp`, 1536×1024, 484576 bytes. A single four-panel image was generated with the built-in image-generation tool and converted as a whole to WebP (quality 84). No external photograph, paid API key, third-party model or customer identity was used. The four quadrants correspond to modern, Japandi, Indochine and neoclassical inspiration. Other styles retain the existing catalogue assets. The illustration never replaces a live measured-model canvas or export.

Final generation prompt:

> Use case: photorealistic-natural. Asset type: a SINGLE architectural inspiration contact sheet for the Build My Home commercial web interface. Generate one beautiful ultra-crisp landscape image, ideally 3072×2048, divided into exactly four equal rectangular photos in a 2×2 grid, with perfectly aligned edges and absolutely NO borders, gutters, text, labels, watermarks or logos. Each panel is 3:2 and shows a complete detached two-storey home from a human eye-level three-quarter exterior angle with natural Vietnamese subtropical landscaping and practical balconies, credible window and door construction. Upper LEFT: refined contemporary modern Vietnamese house, concrete off-white volumes, dark slender frames and timber screening, elegant clean planes. Upper RIGHT: warm Japandi home, quiet earth plaster, oak/brown timber, soft morning light, minimalist courtyard feel. Lower LEFT: Vietnamese Indochine home, warm cream walls, dark timber shutters, restrained arches, clay pitched roof, lush frangipani/palm foliage, nostalgic but high quality. Lower RIGHT: elegant restrained neoclassical house, ivory stone/plaster, symmetrical facade, delicate pilasters/cornices, slender dark rails, NO gaudy gold or palace scale. Style: architectural magazine photography, high quality realistic materials and vegetation, inviting restrained premium design, gentle warm natural illumination, grounded calm compositions, crisp useful building details, no excessive HDR or artificial glow. Show all houses fully within their own panel, do not splice houses across edges. This is explicitly inspiration art rather than any customer's measured 3D, floorplan or construction evidence. No diagrams, no people, no signage, no lettering.
