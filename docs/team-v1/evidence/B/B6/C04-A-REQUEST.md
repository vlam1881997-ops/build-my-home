# C04 supervision UI handoff

B6 evidence UI now reads the existing project.dossier.evidence[] and attaches report metadata: floor (nullable), roomId, reportType (photo/inspection-note/defect/correction), reportStatus (open/reported-resolved), responsible, note, observedAt, designRevision, source:user-report, engineeringAccepted:false. Keeps a capped 20-entry reportHistory per evidence. Existing bytes/ZIP and B5 private transfer stay connected. Empty journal does not fabricate progress.

No secondary WBS store. A6 needs to supply BMH.supervisionAdapter.html() (or agreed methods/list/append/resolve) for attachment-free logs, work-package IDs, signed inspection decisions, change orders and drawdown links. Not yet received. UI distinguishes user-reported resolution from technical acceptance; no approved/certified action generated from checkboxes.

Final G6 remains pending A6 integrated preview and professional/config/product-owner acceptance. B can test isolated fixture UI now; mock services are not proof of production cross-device/payment.
