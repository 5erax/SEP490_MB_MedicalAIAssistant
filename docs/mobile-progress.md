# Mobile Progress Log - MediMate AI User Scope

Source of truth: `SEP490_FE_MedicalAIAssistant` on `main`.

Audit date: 2026-08-03.
Audit branch: `feature/mobile-user-audit`.
Scope: User mobile app only. Admin is not included.

## Baseline Summary

Mobile is partially mature and already contains many user modules, but it is
not yet at 95-100% parity with the current Web source of truth. Web has moved
forward in several user-facing areas, especially Medical Records/Lab Tests and
Recovery Plan.

## Completed Or Broadly Aligned

### App Foundation

- Files: `app/_layout.tsx`, `src/providers/*`, `src/theme/*`, `src/components/ui/*`.
- State/context: `AuthProvider`, `ToastProvider`, app-level providers.
- UI support: safe area, reusable text/button/card/skeleton/empty state/toast.

### Authentication

- Files: `app/(public)/login.tsx`, `register.tsx`, `forgot-password.tsx`,
  `change-password.tsx`, `src/services/authService.ts`,
  `src/services/sessionStorage.ts`.
- APIs integrated:
  - `POST /api/authentication/login`
  - `POST /api/authentication/register`
  - `POST /api/authentication/forgot-password`
  - `POST /api/authentication/change-password`
  - `POST /api/authentication/logout`
  - `GET /api/users/me`
  - `PUT /api/users/{id}`
- Notes:
  - Register includes a fallback login when the backend returns success with an empty access token.
  - Google login service exists, but native Google SDK/client IDs are not configured yet.

### Dashboard / Specialty Intake

- Files: `app/(patient)/home.tsx`, `src/components/dashboard/*`,
  `src/hooks/useSymptomIntake.ts`, `src/services/symptomAnalysisService.ts`.
- APIs integrated:
  - `POST /api/symptom-analysis/suggest-clinical-questions`
  - `POST /api/symptom-analysis/submit-clinical-question-answers`
  - `POST /api/symptom-analysis/submit-diagnosis`
  - `GET /api/symptom-analysis/my-sessions`
  - `GET /api/symptom-analysis/{sessionId}`
- UI completed: intake form, question flow, result panel, history bottom sheet,
  clinical-map handoff cache.

### Nearby Clinics / Medical Facility / Doctor

- Files: `app/(patient)/map.tsx`, `src/components/map/*`,
  `src/components/doctor/*`, `src/components/reviews/*`,
  `src/services/facilityService.ts`, `doctorService.ts`,
  `feedbackReviewService.ts`.
- APIs integrated:
  - `GET /api/medical-facilities/active`
  - `GET /api/medical-facilities/{id}`
  - `GET /api/facility-departments/active`
  - `GET /api/doctors`
  - `GET /api/doctors/active`
  - `GET /api/doctors/{id}`
  - `GET /api/feedback-reviews/facility/{facilityId}`
  - `POST /api/feedback-reviews`
  - `PUT /api/feedback-reviews/{id}`
- Notes:
  - Expo Go cannot load MapLibre native modules. The current map implementation must preserve a safe fallback for Expo Go and real MapLibre for custom native builds.

### Profile / First Login Setup

- Files: `app/(patient)/profile.tsx`, `app/(setup)/patient-profile.tsx`,
  `src/components/profile/*`, `src/hooks/useProfile.ts`,
  `src/hooks/usePatientProfileSetup.ts`, `src/services/patientProfileService.ts`,
  `src/services/patientProfileSetup.ts`.
- APIs integrated:
  - `GET /api/users/me`
  - `PUT /api/users/{id}`
  - `GET /api/patient-profiles`
  - `POST /api/patient-profiles`
  - `PUT /api/patient-profiles/{id}`
  - `GET /api/user-subscriptions/me`
- Missing sync:
  - Web also loads `/api/me/subscription-usage` in `UserProfilePage.jsx`; Mobile does not yet expose this usage/quota information.

### Subscription / Pricing

- Files: `app/(public)/pricing.tsx`, `src/components/subscription/*`,
  `src/hooks/useSubscription.ts`, `src/services/subscriptionService.ts`.
- APIs integrated:
  - `GET /api/subscription-plans/active`
  - `POST /api/user-subscriptions/checkout`
  - `GET /api/user-subscriptions/me`
  - `POST /api/user-subscriptions/{id}/cancel`
  - `GET /api/payments/me`
  - `GET /api/payments/me/{id}`
- Missing sync:
  - Web now has `PAYMENTS.PAYOS_RECONCILE(orderCode)` and richer payment status handling.

### Payment History

- Files: `app/(patient)/payment-history.tsx`, `src/components/payment/*`.
- APIs integrated:
  - `GET /api/payments/me`
  - `GET /api/payments/me/{id}`
- Missing sync:
  - Web service also includes payment list/get/byUser/admin-facing helpers; keep user scope only, but resync PayOS reconciliation.

### Medication

- Files: `app/(patient)/my-medications.tsx`, `app/(patient)/medication.tsx`,
  `src/components/medication/*`, `src/hooks/useUserMedications.ts`,
  `src/services/userMedicationService.ts`.
- APIs integrated:
  - `GET /api/user-medications`
  - `POST /api/user-medications`
  - `PUT /api/user-medications/{id}`
  - `DELETE /api/user-medications/{id}`
- Missing sync:
  - Web has `GET /api/user-medications/{id}`.
  - Web has `PUT /api/user-medications/{id}/reminders`.
- UI:
  - Medication list/form exists.
  - Medication image scan is intentionally a local preview/disclaimer, matching Web's non-OCR behavior.

### Settings / Trust Pages

- Files: `app/(patient)/settings.tsx`,
  `app/(public)/support.tsx`, `privacy.tsx`, `medical-disclaimer.tsx`,
  `src/components/settings/*`, `src/components/legal/*`.
- APIs: none.
- Status: aligned with Web static trust surfaces, adapted for mobile.

## Missing Or Not Yet In Parity

### Medical Records / Lab Tests

Status: missing.

Web source:

- `src/pages/MedicalRecordPage.jsx`
- `src/services/labTestService.js`
- `src/services/cloudinaryUploadService.js`

Mobile gaps:

- No `app/(patient)/records.tsx` route.
- No `src/services/labTestService.ts`.
- No lab upload UI.
- No lab analysis result UI.
- No lab session history/detail UI.

APIs to integrate:

- `POST /api/lab-tests/analyze`
- `GET /api/lab-tests/my-sessions`
- `GET /api/lab-tests/{sessionId}`

Recommended branch: `feature/mobile-medical-records`.

### Recovery Plan

Status: missing current Web behavior.

Web source:

- `src/pages/RecoveryPlanPage.jsx`
- `src/services/recoveryPlanService.js`
- `src/services/subscriptionUsageService.js`
- `src/services/recoveryPlanRealtime.js`

Mobile current state:

- `src/components/recovery/RecoveryPlanScreen.tsx` is still a static "not available" placeholder.

Mobile gaps:

- No quota card from `/api/me/subscription-usage`.
- No create request form.
- No request list/detail.
- No cancel request.
- No provide-more-information flow.
- No plan list/detail.
- No start plan action.
- No realtime SignalR subscription.

APIs to integrate:

- `GET /api/me/subscription-usage`
- `POST /api/recovery-plan-requests`
- `GET /api/recovery-plan-requests/me`
- `GET /api/recovery-plan-requests/{id}`
- `POST /api/recovery-plan-requests/{id}/cancel`
- `POST /api/recovery-plan-requests/{id}/provide-more-information`
- `GET /api/recovery-plans/me`
- `GET /api/recovery-plans/{id}`
- `POST /api/recovery-plans/{id}/start`

Recommended branch: `feature/mobile-recovery-plan`.

### AI Consultation / Assessment Resync

Status: partial.

Mobile has premium free-form chat through `/api/web-chatbot/message`, but Web
contains additional assessment and consultation-session routes/services. This
needs a focused read before declaring parity.

Recommended branch: `feature/mobile-ai-consultation-resync`.

## Intentionally Not Built

### Appointment

Web still does not provide a real booking flow. Mobile should keep the
unavailable state and must not invent appointment booking business logic.

### Notifications

Web has no real user notification module. Mobile should not invent a native
notification feature until Web defines the business flow/API.

## Next Steps

1. Build `feature/mobile-medical-records`.
2. Build `feature/mobile-recovery-plan`.
3. Resync payment/subscription.
4. Resync medication reminders/detail.
5. Resync AI consultation/assessment.

## Verification For This Audit

- Code inventory read from both repositories.
- Mobile/Web routes, services, hooks, and user modules compared.
- Docs updated:
  - `docs/mobile-progress.md`
  - `docs/mobile-roadmap.md`

## 2026-08-03 - Auth Brand Refactor

Branch: `feature/mobile-auth-brand-refactor`

Module: Authentication UI refresh.

Goal:

- Bring Mobile auth visuals closer to the current Web design language.
- Remove oversized lime/green selected states from the register screen.
- Keep Mobile UX native and keep all authentication business logic unchanged.

Files added:

- `docs/mobile-fe-gap-list.md`

Files changed:

- `src/components/ui/Button.tsx`
- `src/components/ui/TextField.tsx`
- `app/(public)/login.tsx`
- `app/(public)/register.tsx`
- `docs/mobile-progress.md`

UI completed:

- Primary button style now uses the Web teal/info treatment with white text.
- Text fields use the Web focus color and softer focused background.
- Login hero chips and eyebrow no longer rely on lime as the dominant color.
- Register gender segmented control now uses teal selected state with white text.
- Register checkbox selected state now uses teal instead of lime.
- Auth loading states now use white spinner/text on primary buttons.
- Auth card and hero radius tightened from oversized mobile cards to the Web refresh rhythm.

API integrated:

- No API changes. Existing auth APIs remain unchanged:
  - `POST /api/authentication/login`
  - `POST /api/authentication/register`

Hooks/services/context/navigation:

- No hook, service, context, or navigation changes.

Verification:

- `npm run lint`

Known issues:

- Runtime emulator visual QA still needs a manual pass on Login and Register.
- This pass only refactors Auth surfaces and shared controls. Other green/lime-heavy areas will be handled module by module.

Todo:

- Open Login and Register on emulator.
- Verify disabled/loading button states.
- Verify gender selected state no longer shows lime/green.
- Continue next feature module from roadmap: `feature/mobile-medical-records`.
