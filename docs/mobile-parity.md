# MediMate mobile parity and traceability

Updated: 2026-08-20. Functional parity and production readiness are evaluated separately. Backend implementation and deployed Swagger are the API authority; `docs/rules/` is the governance authority.

## Functional parity

| Domain / feature | Status | Rule IDs | Risk | Implementation evidence | Test evidence | Remaining blocker |
|---|---|---|---|---|---|---|
| Patient core | PASS | REQ-001..009, REQ-050..053 | P1 | `app/(patient)` and Patient components/services | Static checks and component tests | None |
| Symptom emergency | PASS | REQ-010..014, BR-033 | P0 | `ResultPanel.tsx`: direct `tel:115`, no entitlement gate | `result-panel-test.tsx` | Clinical release sign-off |
| Medication | PASS | REQ-020..024, BR-010..014 | P0/P1 | Medication routes/components/services; scan is preview-only | Static checks, resolver tests | Clinical release sign-off |
| Lab upload/analyze/history/OCR/trends | PASS | REQ-030..031, BR-020..024 | P0 | `useMedicalRecords`, `LabTrendsPanel`, `SessionDetailSheet`, `ResultCard` | `lab-result-test.tsx` | Secure production upload and clinical sign-off |
| Patient recovery | PASS | REQ-032..034, BR-025 | P0 | Request lifecycle plus published plan detail/start/cancel/feedback | Static checks | Clinical release sign-off |
| Doctor recovery/editor | PASS | REQ-032..034, BR-025, REQ-043 | P0 | queue/context/actions; hierarchical plan/phase/nutrient/food CRUD; publish; analytics | Doctor unit/component suites | Object/purpose authorization and clinical sign-off |
| Staff | BLOCKED | REQ-043, BR-004 | P0 | Guarded Vietnamese unavailable state; no Doctor/Admin API probing | Role resolver tests | Backend Staff contract absent |
| Admin overview/catalog | PASS | REQ-043, BR-004 | P1 | Protected overview; 12 catalog lists/search/detail; department CRUD | Admin component suite | None for this scope |
| Admin mutation parity | PARTIAL | REQ-043, BR-004, POL-004 | P1/P0 | Department CRUD; AI config intentionally read-only | Representative CRUD tests | Entity-specific mutation editors/actions remain internal work |
| Auth | PASS | REQ-040..042, CON-020..021 | P0 | OTP, SecureStore, single-flight refresh/one retry, logout, expiry, config gate | Auth/JWT tests | HTTPS and native OAuth affect readiness only |
| Payment | PASS | REQ-040..042, BR-030..032 | P1 | Plans, checkout browser, history/detail, reconcile, refresh/cancel | Payment resolver tests | Verified return links affect readiness only |
| Map | PASS | REQ-050..053 | P1 | MapLibre and accessible list fallback | Static/export checks | Device QA |

## Important release gates

| Gate | Rule IDs | Evidence | State |
|---|---|---|---|
| Emergency ungated | REQ-010..014 | ResultPanel + component test | Code PASS; clinical approval pending |
| Lab provenance/no invented range | REQ-030..031 | OCR source copy, per-session ranges, missing-range test | Code PASS; clinical approval pending |
| Recovery publish server-authoritative | REQ-034, BR-025 | Confirmation, disabled mutation, refetch, no Patient draft | Code PASS; owner approval pending |
| Token/session safety | REQ-040..042 | SecureStore and refresh guard | Code PASS; HTTPS externally blocked |
| Object/PHI authorization | REQ-043..044, BR-004 | Role guards; no Admin Patient profiles; assigned Doctor context | Owner review BLOCKED |
| Accessibility semantics | REQ-050..053, STD-A11Y | Headings, labels/state, shared 44px controls, non-color status | Code audit PASS; physical screen-reader QA pending |
