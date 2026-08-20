# Mobile vs Web User Gap List

Source of truth: `SEP490_FE_MedicalAIAssistant`

This file tracks the USER features that Mobile still needs to reach functional parity with Web. Admin scope is intentionally excluded.

## Missing Completely

- [x] Medical Records / Lab Tests — done, PR #26.
  - Native history-first screen (filter chips + session list + FAB), upload
    and detail each in a full-screen sheet.
  - `labTestService.ts`, `useMedicalRecords.ts`, upload-to-Cloudinary +
    analyze flow, 3s polling while a session is "processing".
  - Linked from Settings ("Tính năng" section) since Web has no mobile-nav
    or dashboard entry point to mirror.
  - APIs integrated:
    - `POST /api/lab-tests/analyze`
    - `GET /api/lab-tests/my-sessions`
    - `GET /api/lab-tests/{sessionId}`

- [x] Recovery Plan — done, PR #27.
  - Real quota, request (create/list/detail/cancel/provide-more-info), and
    plan (list/detail/start) flows, native single-screen redesign with
    sheets for create/request-detail/plan-detail.
  - [skip] Realtime/SignalR sync — deliberate scope cut, background
    enhancement on Web (silent auto-refetch, no toast); pull-to-refresh +
    reloadAll() after every action cover the same need. Follow-up if
    needed later.
  - APIs integrated:
    - `GET /api/me/subscription-usage`
    - `POST /api/recovery-plan-requests`
    - `GET /api/recovery-plan-requests/me`
    - `GET /api/recovery-plan-requests/{id}`
    - `POST /api/recovery-plan-requests/{id}/cancel`
    - `POST /api/recovery-plan-requests/{id}/provide-more-information`
    - `GET /api/recovery-plans/me`
    - `GET /api/recovery-plans/{id}`
    - `POST /api/recovery-plans/{id}/start`

## Partial / Needs Resync

- [x] AI Consultation / Chat — consultation-session parity completed on 2026-08-20.
  - Core premium chatbot remains unchanged.
  - Added the authenticated pre-consultation journey: select a department,
    carry symptom/facility context from specialty intake, choose an expected
    appointment time, generate doctor questions, register a reminder, complete
    the session, and view checklist/question summaries and history.
  - APIs integrated:
    - `POST /api/consultation-sessions/generate-questions-for-consultant-session`
    - `GET /api/consultation-sessions/my-sessions`
    - `GET /api/consultation-sessions/{sessionId}`
    - `POST /api/consultation-sessions/{sessionId}/register-reminder`
    - `GET /api/consultation-sessions/{sessionId}/summary`
    - `POST /api/consultation-sessions/{sessionId}/complete`

- [x] Subscription / Pricing / Usage — done, PR #28.
  - Profile's "Gói dịch vụ" tab now shows per-feature quota cards from
    `GET /api/me/subscription-usage` (best-effort, doesn't block the tab).
  - Recovery Plan already had its own single-quota progress-bar view from
    PR #27.

- [x] Payment — done, PR #28.
  - `POST /api/payments/payos-reconcile/{orderCode}` (note: actual path is
    hyphenated single segment `payos-reconcile`, not `payos/reconcile` as
    originally listed here — corrected after reading Web's endpoints.js).
  - Checkout polling now reconciles alongside the cheap local payment poll
    (first tick + every 4th tick), matching Web's cadence.
  - Manual "Kiểm tra với PayOS" button on pending PayOS rows in Payment
    History — the one piece of Web's reconcile UI mobile can fully own,
    since the auto-reconcile payment-result/return page was never built
    (PayOS can't deep-link into the app without backend config).

- [x] Medication detail and reminder replacement — completed on 2026-08-20.
  - Edit now loads the owned medication detail before opening the form.
  - Active reminders can be disabled without deleting the medication.
  - APIs integrated:
    - `GET /api/user-medications/{id}`
    - `PUT /api/user-medications/{id}/reminders`

- [ ] Google Sign-In
  - Mobile has partial auth service support.
  - Native SDK/client IDs and mobile runtime configuration still need verification.

## Skipped For Parity

- [skip] Appointment Booking
  - Web does not currently provide a real USER booking flow.

- [skip] Notifications
  - Web does not currently provide a clear USER notification module.

## Recommended Build Order

1. ~~Medical Records / Lab Tests~~ — done, PR #26.
2. ~~Recovery Plan~~ — done, PR #27 (realtime sync deliberately skipped).
3. ~~Subscription / Usage / Payment resync~~ — done, PR #28.
4. ~~Medication detail and reminders parity~~ — done.
5. ~~AI Consultation resync~~ — consultation-session journey done.
6. Google Sign-In native configuration
