# Mobile Roadmap - MediMate AI User Scope

Source of truth: `SEP490_FE_MedicalAIAssistant` on `main`.

Audit date: 2026-08-03. This roadmap reflects the current Mobile codebase
against the current Web codebase. Admin is intentionally out of scope.

## Status Legend

- `[x]` implemented and broadly aligned with Web user behavior.
- `[~]` implemented partially or needs resync with newer Web behavior.
- `[ ]` missing from Mobile.
- `[skip]` intentionally not built because Web has no real user feature.

## Modules

- [x] App shell, providers, theme, safe area, toast foundation
- [x] Authentication: login, register, forgot password, change password, logout, session restore
- [~] Google Sign-In: service exists, native OAuth client/SDK still not configured
- [x] Patient Dashboard / Specialty Intake
- [x] Nearby Clinics / Map
- [x] Medical Facility detail and reviews
- [x] Doctor discovery/detail
- [skip] Appointment booking: Web still exposes unavailable/disabled state only
- [~] AI Consultation / Chat: basic premium chatbot exists; Web assessment/consultation-session flows need another sync pass
- [ ] Medical Records / Lab Tests: Web has `/records` with `labTestsApi`; Mobile has no route/screen/service yet
- [~] Subscription / Pricing: core plans, checkout, polling, cancel exist; PayOS reconciliation and subscription usage need sync
- [~] Payment History: list/detail exists; newer Web payment endpoints/status handling need sync
- [ ] Recovery Plan: Web now has real request/plan/quota/realtime flow; Mobile is still a static placeholder
- [~] Medication: list/create/update/delete exists; detail fetch and reminder replacement endpoint need sync with Web
- [x] Profile and first-login patient profile setup
- [x] Settings and public trust pages
- [skip] Notifications: no Web user notification module yet

## Recommended Next Branches

1. `feature/mobile-medical-records`
2. `feature/mobile-recovery-plan`
3. `feature/mobile-payment-resync`
4. `feature/mobile-medication-resync`
5. `feature/mobile-ai-consultation-resync`

## Module Completion Workflow

For each module:

1. Pull latest `main`.
2. Create a module branch.
3. Read the corresponding Web page/service/hooks first.
4. Reuse existing Mobile services/components where possible.
5. Implement only missing behavior.
6. Run lint/build/runtime checks.
7. Update `docs/mobile-progress.md` and this roadmap.
8. Commit with Conventional Commits.
9. Push, open PR, merge, then start the next module.
