# Modern export readback — 21/10/2026

Source runtime: 817367bbbd90caef2703b879bc300ecb7ff65812, PR76. Existing shared modernReference only; no second house. Revision 7BADC039-9AD609B4-AI4-RH3.

28 architectural SVG sheets parse as XML and pass the existing PDF preflight (A3 viewBox, revision, model m/dimensions mm). Two DXFs open in ezdxf with units4/mm, zero audit errors and zero automatic fixes. Both PLOT boundaries measure5000×20000mm. SHA256 and per-file register are attached.

CairoSVG2.9.1 was installed only in scratch for inspection, without changing application dependencies. All28 sheets rendered. Original contact sheets were inspected; local Arial rendering omitted Vietnamese glyphs. A DejaVu Sans substitution in inspection derivatives restored accents on material page21 and the second contact sheet. Original SVG bytes were preserved. This is a renderer limitation observation, not a browser typography pass or a source font fix. Full-resolution/native review remains required.

PDF was not generated: the production exporter requires browser DOM, font loading and computed SVG styles. Current native browser/provider gate is unresolved; no alternate renderer PDF is substituted as evidence. Actual ZIP, supplier photo pixels, GLB/GPU parity, account/cloud/payment and professional review are not covered. The fixture still has45 unpriced BOQ rows and no complete sourced total; it is not a customer-approved house.

Reproduce on the pinned source using tests/team-b-modern-reference.mjs to a scratch directory. Use modernReference().B.architecturalSheets() to write each sheet.svg; load96_vector_pdf.js for architecturalPdfPreflight only. Read DXFs with ezdxf.readfile/audit and measure PLOT vertices. Native architecturalPdfBytes and full handover are the next export gate once browser access is available. Generated inspection images and fixture outputs are not committed.
