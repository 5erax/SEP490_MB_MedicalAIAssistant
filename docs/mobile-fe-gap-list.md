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

- [ ] AI Consultation / Chat
  - Mobile has the core premium chatbot.
  - Web has richer assessment and consultation-session flows.
  - Need to resync quota handling, session metadata, result states, error states, and navigation.

- [ ] Subscription / Pricing / Usage
  - Mobile has pricing and subscription basics.
  - Missing full subscription usage/quota parity with Web.
  - Need to integrate and surface `subscriptionUsageApi` behavior.

- [ ] Payment
  - Mobile has payment history and older PayOS helpers.
  - Missing Web reconcile flow.
  - API to integrate:
    - `POST /api/payments/payos/reconcile/{orderCode}`

- [ ] Medication
  - Mobile has medication CRUD basics.
  - Need to confirm and complete medication detail and reminder replacement parity.
  - APIs/flows to verify:
    - `GET /api/user-medications/{id}`
    - Replace/update reminders flow from Web.

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
3. Subscription / Usage / Payment resync
4. Medication detail and reminders parity
5. AI Consultation resync
6. Google Sign-In native configuration
