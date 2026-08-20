# Mobile Progress Log - MediMate AI User Scope

## 2026-08-20 - Important Patient Flow Completion

Branch: `codex/mobile-important-flows`

Modules: Pre-consultation, medication parity, live Swagger contract cleanup.

Completed:

- Added a native pre-consultation screen linked from Settings and directly
  from the specialty recommendation result.
- Preserved department, facility, and symptom context during the handoff.
- Added question generation with processing polling, appointment date/time,
  reminder registration, completion, checklist/question summary, and history.
- Added medication detail loading before edit and a safe reminder-disable
  action that keeps the medication record.
- Removed the unused `/api/symptom-analysis/submit-diagnosis` client endpoint;
  it is not present in the production Swagger contract on 2026-08-20.

APIs integrated:

- `POST /api/consultation-sessions/generate-questions-for-consultant-session`
- `GET /api/consultation-sessions/my-sessions`
- `GET /api/consultation-sessions/{sessionId}`
- `POST /api/consultation-sessions/{sessionId}/register-reminder`
- `GET /api/consultation-sessions/{sessionId}/summary`
- `POST /api/consultation-sessions/{sessionId}/complete`
- `GET /api/user-medications/{id}`
- `PUT /api/user-medications/{id}/reminders`

Verification:

- `tsc --noEmit`
- ESLint across the app
- Expo web static export, including `/pre-consultation`
- `git diff --check`

Remaining external setup:

- Native Google Sign-In still requires platform client IDs and provider
  configuration; it cannot be completed safely from source/Swagger alone.

## 2026-08-03 - Native Map Tile And Performance Audit

Branch: `main`

Module: Nearby Clinics / Medical Facility Map.

Goal:

- Explain why Mobile map tiles looked incomplete compared with Web.
- Keep Expo Go stable while upgrading the native MapLibre path used by custom
  dev clients and app builds.
- Improve map FPS, marker rendering, camera animation, and clustering for
  Android mid-range devices.

Files added:

- `docs/mobile-map-quality-audit.md`

Files changed:

- `src/components/map/FacilityMapViewMapLibre.tsx`
- `docs/mobile-progress.md`

API integrated:

- No API changes.

Map provider/tile findings:

- Web uses `react-map-gl/maplibre` with CARTO Positron vector style.
- Mobile Expo Go cannot load MapLibre native modules, so it correctly uses the
  SVG fallback; that fallback has no vector/raster tiles, labels, roads,
  buildings, or landmarks.
- Mobile custom dev client/native build now uses the same Web-aligned style URL
  by default and can be overridden with `EXPO_PUBLIC_MAP_STYLE_URL`.

Performance completed:

- Replaced repeated React facility markers in the native MapLibre path with
  `GeoJSONSource + Layer`.
- Enabled native clustering with cluster labels.
- Added min/max zoom, HCMC bounds, 60 FPS preference, and native camera ease
  animations.
- Cluster tap expands camera to the native cluster expansion zoom.
- Facility tap selects only the target facility and eases camera to zoom 16.

Verification:

- `npx tsc --noEmit`

Known issues:

- Expo Go will still show the fallback preview by design. Real tile quality
  requires `npx expo run:android` or an EAS/custom dev build.

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

## 2026-08-03 - Global Mobile Brand Refresh

Branch: `feature/mobile-global-brand-refresh`

Module: Existing Mobile UI brand and form cleanup.

Goal:

- Remove the old green/lime visual treatment across existing Mobile screens.
- Align Mobile color usage with the refreshed Web-style teal/ink/paper system.
- Improve existing form controls without changing business logic, APIs, validation, services, contexts, or navigation flow.

Files changed:

- `src/theme/tokens.ts`
- `src/theme/navigationTheme.ts`
- `app/(patient)/_layout.tsx`
- `app/(public)/forgot-password.tsx`
- `app/(public)/change-password.tsx`
- `src/components/auth/PremiumGate.tsx`
- `src/components/auth/RolePlaceholderScreen.tsx`
- `src/components/map/FacilityFilters.tsx`
- `src/components/profile/ProfileTabs.tsx`
- `src/components/profile/PersonalInfoSection.tsx`
- `src/components/profile/MedicalProfileSection.tsx`
- `src/components/profile/PatientProfileSetupScreen.tsx`
- `src/components/subscription/SubscriptionScreen.tsx`
- `src/components/medication/MedicationFormSheet.tsx`
- `src/components/medication/UserMedicationsScreen.tsx`

UI completed:

- Retargeted legacy `lime`/`limeDark` tokens to teal to prevent old green UI from resurfacing.
- Changed `mint` and success backgrounds from green tint to teal tint.
- Updated patient tab active color and navigation notification accent to teal.
- Refreshed forgot-password and change-password forms to match the new Auth surfaces.
- Converted selected chips, tabs, blood type controls, gender controls, subscription cycle buttons, and map filters to teal with white text.
- Reworked profile setup and profile edit controls with softer segmented containers, smaller radii, and lighter borders.
- Modernized medication floating action button with teal shadow and white icon.
- Reduced dashed/form control borders where they felt too heavy for mobile.

API integrated:

- No API changes.

Hooks/services/context/navigation:

- No hook, service, context, or flow changes.
- Navigation theme colors changed visually only.

Verification:

- `npm run lint`
- `rg "colors\\.(lime|limeDark)|#c4e995|#6a9540|#AAED63|#7EC832|#EEF8DC|#dcfce7|#D1FAE5|green" app src -n`

Known issues:

- Emulator visual QA is still required screen by screen.
- Some screens still need deeper UX redesign beyond color/form controls. This branch removes the old green system and improves existing controls without rewriting modules.

Todo:

- Manual emulator pass for Login/Register/Forgot/Change Password.
- Manual emulator pass for Profile Setup, Profile, Map filters, Subscription, and Medication forms.
- Continue deeper page-level redesign module by module.

## 2026-08-03 - Direct Main UI Polish Pass

Branch: `main`

Module: Existing Mobile UI surface polish.

Goal:

- Continue UI cleanup directly on `main` with visible small commits instead of PR squash commits.
- Reduce heavy desktop-style borders and block shadows on Mobile.
- Keep the refreshed FE-aligned teal/ink/paper color system.

Files changed:

- `src/components/ui/Card.tsx`
- `app/(public)/login.tsx`
- `app/(public)/register.tsx`
- `app/(public)/forgot-password.tsx`
- `app/(public)/change-password.tsx`
- `src/components/dashboard/AnswerButtons.tsx`
- `src/components/dashboard/SpecialtyIntakeScreen.tsx`
- `src/components/chat/ChatScreen.tsx`
- `src/components/map/FacilityListItem.tsx`
- `src/components/map/FacilityDetailSheet.tsx`
- `src/components/doctor/DoctorDetailSheet.tsx`
- `src/components/reviews/ReviewForm.tsx`

UI completed:

- Softened shared `Card` hard surfaces for Mobile by replacing block shadow with softer elevation.
- Polished public auth form containers and hero borders.
- Refined dashboard answer controls and loading surfaces.
- Refined chat composer input styling.
- Polished map facility cards, facility detail panels, doctor detail info list, and review image picker.

API integrated:

- No API changes.

Hooks/services/context/navigation:

- No logic or flow changes.

Verification:

- `npm run lint`

Known issues:

- Visual QA on emulator is still needed for final spacing and contrast validation.

## 2026-08-03 - Medical Records / Lab Tests

Branch: `feature/mobile-medical-records`

Module: New feature, first item from the parity audit's Recommended Build Order.

Goal:

- Close the Medical Records / Lab Tests gap identified in `docs/mobile-fe-gap-list.md`.
- Build it as a genuine mobile product screen, not a port of Web's desktop two-column layout.

Files added:

- `app/(patient)/records.tsx`
- `src/components/records/{RecordsScreen,ResultCard,SessionCard,SessionDetailSheet,UploadRecordSheet,index}.tsx`
- `src/hooks/useMedicalRecords.ts`
- `src/services/labTestService.ts`
- `src/types/labTest.ts`
- `src/utils/labTestPresentation.ts`

Files changed:

- `src/api/endpoints.ts` (LAB_TESTS block)
- `src/services/cloudinaryUploadService.ts` (uploadMedicalDocumentToCloudinary, validateMedicalDocument)
- `src/hooks/index.ts`
- `app/(patient)/_layout.tsx` (hide records from the tab bar)
- `src/components/settings/SettingsScreen.tsx` (new "Tính năng" section, links to Records)
- `app.json` (expo-document-picker plugin)
- `package.json` / `package-lock.json` (expo-document-picker)

UI completed:

- History-first screen: status filter chips, session list, FAB to start a new analysis.
- Upload sheet: read-only patient info (name/gender/date of birth from profile), test-date picker, image-or-PDF document picker, phase-aware submit button ("Đang tải tài liệu..." / "Đang gửi phân tích...").
- Session detail sheet: status banners (processing/failed/empty), result cards with an expandable advice accordion, expandable raw OCR text, fixed medical-disclaimer footer.

API integrated:

- `POST /api/lab-tests/analyze`
- `GET /api/lab-tests/my-sessions`
- `GET /api/lab-tests/{sessionId}`

Hooks/services/context/navigation:

- `useMedicalRecords()`: profile load, upload-then-analyze submission (caches the Cloudinary upload by file identity so resubmitting the same file skips re-uploading), paginated/filterable history, session detail with 3s polling while `status === "processing"`.
- Route access matches Web exactly: `"auth"`, not `"premium"` — Web's own route comment marks this as a temporary downgrade for product testing; do not upgrade to PremiumGate ahead of Web.
- No entry point in the bottom tab bar (Web excludes this from its own mobile nav too) — linked from Settings instead, since Web's only entry point is a persistent sidebar item with no dashboard-card or bottom-nav equivalent on Web to mirror.

Verification:

- `npx tsc --noEmit`
- `npx expo lint`
- `npx expo export --platform web`
- Browser preview: `/records` and `/settings` correctly redirect to Login via `AuthGate` when unauthenticated, no console errors.

Known issues:

- Full authenticated upload → analyze → poll → detail flow needs a real device/Expo Go — `expo-secure-store` has no web implementation, so session persistence can't be exercised in browser-based testing against this backend (same limitation noted in every prior module).

## 2026-08-03 - Recovery Plan Rebuild

Branch: `feature/mobile-recovery-plan-rebuild`

Module: Rebuild, second item from the parity audit's Recommended Build Order.

Goal:

- Web's Recovery Plan moved from a static "not available" placeholder (what Module 10 originally ported) to a real feature: subscription usage quota, recovery plan requests, recovery plans, SignalR realtime.
- Rebuild the mobile module to match, as a native single-screen redesign rather than a port of Web's desktop split-panel layout.

Files added:

- `src/components/recovery/{CreateRequestSheet,PlanCard,PlanDetailSheet,QuotaCard,RequestCard,RequestDetailSheet}.tsx`
- `src/hooks/useRecoveryPlan.ts`
- `src/services/{recoveryPlanService,subscriptionUsageService}.ts`
- `src/types/recoveryPlan.ts`
- `src/utils/recoveryPlanPresentation.ts`

Files changed:

- `src/api/endpoints.ts` (SUBSCRIPTION_USAGE, RECOVERY_PLAN_REQUESTS, RECOVERY_PLANS)
- `src/components/recovery/RecoveryPlanScreen.tsx` (full rewrite, was the static placeholder)
- `src/components/recovery/index.ts`
- `src/hooks/index.ts`

UI completed:

- Quota card: remaining/limit progress bar, cycle dates, exhausted banner, subscription-needed CTA to Pricing.
- Primary "Yêu cầu kế hoạch mới" CTA, disabled when quota is exhausted/unavailable — same gating logic as Web.
- Requests list (paginated) + detail sheet: cancel (cancellable statuses match Web), provide-more-information form (replaces the note, not a chat thread).
- Plans list (paginated) + detail sheet: phase → nutrient-target → food-source hierarchy as an expandable accordion per phase, start-plan action when `readyToStart`.
- Pull-to-refresh + manual reload after every user action, in place of Web's SignalR realtime sync.

API integrated:

- `GET /api/me/subscription-usage`
- `POST /api/recovery-plan-requests` (with `Idempotency-Key` header)
- `GET /api/recovery-plan-requests/me`
- `GET /api/recovery-plan-requests/{id}`
- `POST /api/recovery-plan-requests/{id}/cancel`
- `POST /api/recovery-plan-requests/{id}/provide-more-information`
- `GET /api/recovery-plans/me`
- `GET /api/recovery-plans/{id}`
- `POST /api/recovery-plans/{id}/start`

Hooks/services/context/navigation:

- `useRecoveryPlan()`: independently loaded quota/requests/plans sections, create-request submission with idempotency-key retry safety, cancel, provide-more-information, start-plan, `reloadAll()`.
- No route/navigation changes — `/(patient)/recovery-plan` already existed from Module 10 and already pointed at `RecoveryPlanScreen`.

Verification:

- `npx tsc --noEmit`
- `npx expo lint`
- `npx expo export --platform web`
- Browser preview: `/recovery-plan` correctly redirects to Login via `AuthGate` when unauthenticated, no console errors.

Known issues:

- **Deliberate scope cut: SignalR realtime.** Web's `recoveryPlanRealtime.js` silently auto-refetches on `RecoveryPlanRequestChanged`/`RecoveryPlanChanged` hub events (no toast, just a connection-status line + debounced refetch) — a background enhancement, not core functionality; the page works fully without it. This pass ships pull-to-refresh + `reloadAll()` after every user action instead of taking on a native SignalR dependency. Follow-up if a real device confirms this experience feels stale.
- Full authenticated quota/request/plan flow needs a real device/Expo Go — same `expo-secure-store` web-testing limitation noted in every prior module.
