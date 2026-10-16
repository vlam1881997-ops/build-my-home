# A schema handoff: measured parapet height is dropped on reload

Status: reproduced in native Chromium; source fix is NOT applied to A-owned files.

B103 exposes `project.measuredDesign.roof.parapetHeight`, uses it for actual parapet geometry, and preserves it in the saved snapshot. A10 `mergeState` only accepts keys declared in `defaultState`. The roof defaults omit this field, so opening the saved project drops the customer's 0.77 m value. B103 then reverts to its generic 0.38 m suggestion. W14 correctly invalidates the previous satisfaction signature instead of hiding this geometry change.

The native diagnostic is synthetic: saved measuredDesign.roof.parapetHeight = 0.77; reloaded property absent. Saved drawing revision 6327DE6F-741638A5-AI4-RH2; reopened 48694D25-741638A5-AI4-RH2. This is not a change requested by the customer.

## Concrete proposed patch (A-owned src/10_state.js)

Add `parapetHeight:-1` to `defaultState().project.measuredDesign.roof`, immediately after `color:''`.

Use -1 as the automatic/default sentinel: B103 already treats only finite values between 0 and 1.2 as explicit. Null would coerce to zero in B103 and incorrectly remove the default parapet, so do not use null. Do not make the entire roof object dynamic just to preserve one numeric field.

Verify saved/imported/reopened projects retain 0, 0.77 and 1.2; unspecified values still use the existing suggestion; invalid strings/nonfinite/out-of-range values never create unsafe geometry. Verify the same SVG, mesh and revision before/after reload, plus approval invalidation for actual edits.

## Other integration requests

Register `tests/team-b-reference-review.test.mjs` and the previous material-samples test in the explicit CI test list. B's source stays in its ownership scope; no build/schema edit was applied.

This single persistence fix does not close the original-reference geometry gate. The separate W13 MODERN-REFERENCE-NEXT.md still defines the measured facade handoff needed to replace provisional style decorations with the selected design's approved components.
