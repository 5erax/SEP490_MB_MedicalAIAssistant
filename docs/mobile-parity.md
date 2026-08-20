# MediMate mobile capability parity

Updated: 2026-08-20. This is a capability and workflow matrix, not a pixel-parity checklist.

## Evidence and status rules

- **Implemented**: a native Expo Router screen exists, calls the real API, and has loading/error/empty states.
- **Partial**: part of the workflow exists, but a route, state transition, contract, or production dependency is missing.
- **Missing**: no usable native workflow exists.
- **Blocked**: implementation cannot be production-correct without an upstream contract, configuration, or ownership decision.
- Route evidence: `frontend/src/router/routes.js`; endpoint evidence: `frontend/src/services/endpoints.js`, backend controllers, and production Swagger `/swagger/v1/swagger.json`.
- Mobile evidence paths are relative to the mobile repository.

The requested rulebook files `01-requirements.md` through `09-sources-and-applicability.md` were searched for in all supplied local repositories and were not present. This matrix therefore uses the master prompt, product definition, backend source, Swagger, frontend source, and production web in that order. The absent rulebook remains a traceability gap.

## Public and authentication

| Web route/capability | Native screen | API endpoints | Actor | Access | Status | Evidence / gap |
|---|---|---|---|---|---|---|
| `/` / onboarding | Root auth redirect | — | Guest | Public | Partial | `app/index.tsx`; no dedicated onboarding route although `ROUTES.PUBLIC.ONBOARDING` is declared. |
| `/login` | `app/(public)/login.tsx` | `POST /api/authentication/login`, `google` | Guest | Public | Partial | Email login is native. Google UI is configuration-gated; native OAuth client IDs are not supplied. |
| `/signup` | `app/(public)/register.tsx` | `send-register-otp`, `register`, `login` | Guest | Public | Implemented | OTP request and registration use backend DTO fields; successful registration signs in. |
| `/register-doctor` | — | `GET /api/doctor-invitations/validate`, `POST /api/doctor-invitations/register` | Invited doctor | Token link | Missing | Backend supports invitation flow; mobile route/service absent. |
| `/forgot-password` | `app/(public)/forgot-password.tsx` | `forgot-password` | Guest | Public | Implemented | Native form and real API. |
| `/change-password` | `app/(public)/change-password.tsx` | `change-password` | Guest | OTP | Implemented | Native OTP reset flow. |
| Authenticated password change | Profile security section | `update-password` | Signed-in user | JWT | Partial | Endpoint added to service; verify profile form payload against backend DTO. |
| Session refresh/logout | App API/auth providers | `refresh`, `logout` | Signed-in user | Cookie + JWT | Blocked | Client supports HTTPS HttpOnly refresh cookie and single-flight retry. Current backend origin is HTTP while cookie is `Secure`; production refresh cannot work until backend has HTTPS. |
| `/pricing` | `app/(public)/pricing.tsx` | plans, checkout | Guest/patient | Mixed | Implemented | Native plans/checkout workflow exists. |
| payment return/cancel | External PayOS return | payment status/reconcile | Patient | Signed in | Partial | Payment history/status exists; explicit deep-link return/cancel routes and verified app-link domains are absent. |
| `/support`, `/privacy`, `/medical-disclaimer` | Native public screens | — | All | Public | Implemented | `app/(public)/*`. |

## Patient workspace

| Web route/capability | Native screen | API endpoints | Actor | Access | Status | Evidence / gap |
|---|---|---|---|---|---|---|
| `/dashboard`, `/symptom` | `app/(patient)/home.tsx` | symptom suggest/submit answers/history/detail | Patient | JWT, usage quota | Implemented | Native intake, dynamic questions, results, history, retry/empty/loading. Emergency result exposes direct 115 action without premium gate. |
| `/map` | `app/(patient)/map.tsx` | facilities, departments, reviews, doctors | Guest/patient | Mixed | Implemented | Native MapLibre/list fallback, permission handling, clinical ranking context. |
| `/chat` | `app/(patient)/chat.tsx` | `POST /api/web-chatbot/message` | Patient | JWT/quota | Implemented | Native chat messages, API error and prompts. |
| `/profile` | `app/(patient)/profile.tsx` | users/me, users/{id}, patient profiles, subscription | Patient | JWT | Implemented | Personal/medical/security/subscription sections. |
| profile setup | `app/(setup)/patient-profile.tsx` | patient profiles | Patient first login | JWT | Implemented | First-login redirect and native setup. |
| `/records` and record detail | `app/(patient)/records.tsx` | lab analyze/history/detail; symptom/consultation history | Patient | JWT/quota | Partial | Native records and detail sheets exist. OCR, analytics and trend endpoints are not wired. |
| `/pre-consultation` | `app/(patient)/pre-consultation.tsx` | consultation generate/list/detail/reminder/summary/complete | Patient | JWT | Implemented | Native generation and session lifecycle. |
| `/medication`, `/my-medications` | native medication routes | user medications CRUD/reminders | Patient | JWT | Implemented | Scan preview, form validation, list/detail/reminder controls. Not medication identification or prescribing. |
| `/recovery-plan` | `app/(patient)/recovery-plan.tsx` | recovery requests/me/detail/cancel/provide info; plans/me/detail/start | Patient | JWT/premium quota | Partial | Request/list/detail/start/cancel/readiness are native. Plan feedback and patient plan cancel are absent from service/UI. |
| payment history | `app/(patient)/payment-history.tsx` | payments/me/detail/status | Patient | JWT | Implemented | Native list and detail sheet. |
| settings | `app/(patient)/settings.tsx` | session/profile links | Patient | JWT | Implemented | Native settings navigation and logout. |

## Doctor and staff recovery workflow

| Web route/capability | Native screen | API endpoints | Actor | Access | Status | Evidence / gap |
|---|---|---|---|---|---|---|
| `/app/staff` overview | `app/(doctor)/dashboard.tsx`, `app/(staff)/dashboard.tsx` | doctor queues | Doctor/Staff | Role JWT | Partial | Doctor has real recovery workspace. Staff shows an explicit authorization blocker because backend grants the workflow only to Doctor. |
| open queue | Doctor dashboard, “Hàng đợi chung” | `GET /api/doctor/recovery-plan-requests/open` | Doctor | Doctor JWT | Implemented | Real paged endpoint, loading/error/empty states and claim action. |
| my queue | Doctor dashboard, “Yêu cầu của tôi” | `GET /api/doctor/recovery-plan-requests/mine` | Doctor | Doctor JWT | Implemented | Real endpoint and refresh. |
| request detail + clinical context | Doctor detail modal | request detail, `clinical-context` | Doctor | Doctor JWT | Implemented | Clinical context is fetched only from doctor-authorized endpoint after selecting an assigned request. |
| claim/release/review/reject/request info | Doctor detail/actions | `accept`, `release`, `start-review`, `reject`, `request-more-information` | Doctor | Doctor JWT | Partial | Claim/release/start-review implemented. Reject/request-info await deployed-contract verification and native reason forms. |
| create/edit/publish plan | — | request `plan`; doctor plan and phase/nutrient/food CRUD; `publish` | Doctor | Doctor JWT | Missing | Full native structured editor is absent. |
| feedback analytics | — | doctor plan analytics/feedback | Doctor | Doctor JWT | Missing | No native chart/list. |
| realtime queue | — | `/hubs/recovery-plans` | Doctor | Doctor JWT | Missing | Backend SignalR hub exists; no mobile client/reconnect implementation. |
| Staff authority | — | unclear | Staff | Staff JWT | Blocked | Product docs label Staff as an internal operator, while recovery endpoints authorize Doctor. No backend staff-specific recovery contract or ownership boundary is documented. |

## Admin workspace

| Web route/capability | Native screen | API endpoints | Actor | Access | Status | Evidence / gap |
|---|---|---|---|---|---|---|
| overview | `app/(admin)/dashboard.tsx` | users/doctors/facilities lists | Admin | Admin JWT | Partial | Native overview loads real protected resources independently and exposes partial failures. |
| users | Admin overview | users list/detail/update/delete/restore | Admin | Admin JWT | Partial | Real list/count/preview implemented; edit/delete/restore forms still absent. |
| doctors + invitations | Admin overview | doctors CRUD/status; admin doctor invitations list/create/revoke | Admin | Admin JWT | Partial | Real doctor list/count/preview; CRUD and invitation flow absent. |
| AI configurations | — | ai-configs CRUD/status | Admin | Admin JWT | Missing | Backend `AIConfigsController`. |
| plans/quotas/subscriptions | — | subscription plans, plan quotas, user subscriptions | Admin | Admin JWT | Missing | Backend controllers and Swagger. |
| departments/facility departments | — | medical departments, department questions, facility departments | Admin | Admin JWT | Missing | Backend controllers. |
| ICD chapters | — | ICD CRUD/status | Admin | Admin JWT | Missing | Backend `IcdChaptersController`. |
| clinical questions/checklists | — | clinical questions, department questions, checklist items | Admin | Admin JWT | Missing | Backend supports single and bulk operations. |
| lab indicators | — | indicators, aliases, reference ranges, advice CRUD/bulk | Admin | Admin JWT | Missing | Complex nested native editor absent. |
| facilities | Admin overview | facilities CRUD/status | Admin | Admin JWT | Partial | Real list/count/preview; CRUD/status forms absent. |
| patient profiles | — | patient profile list/detail/update | Admin | Admin JWT | Missing | Access purpose/audit policy is not specified; do not expose broad PHI until authorized use is documented. |

## Cross-cutting production readiness

| Capability | Status | Evidence / blocker |
|---|---|---|
| Native-only UI | Implemented | React Native components and Expo Router; no WebView/React DOM in mobile screens. |
| Role routing | Partial | Role guards exist; Doctor/Staff/Admin destinations are placeholders. |
| Token storage | Implemented on native | Access token is in SecureStore/Keychain/Keystore; non-sensitive display metadata only is in AsyncStorage. Web preview is memory-only. |
| HTTPS enforcement | Partial | Preview/production config and runtime reject HTTP. Supplied backend has no HTTPS origin, so live production API remains blocked. |
| Error normalization | Partial | API envelope and Axios errors normalized; field-level backend validation mapping is not universal. |
| Clinical safety | Partial | Disclaimer and emergency CTA exist; red-flag copy is driven by backend `isEmergencySuggested`, not a local diagnostic model. Safety QA and clinical sign-off are outstanding. |
| Privacy logging | Partial | No intentional PHI logging found in current mobile source; automated log/redaction tests and formal retention policy are absent. |
| Accessibility | Partial | Core buttons/fields have native semantics; complete screen-reader, contrast and dynamic-type audit not yet run. |
| Tests | Partial | Jest/jest-expo and React Native Testing Library configured. Auth normalization and ungated emergency 115 UI have passing unit/component tests; integration and Maestro E2E remain absent. |
| Android/iOS builds | Blocked/Not verified | Native build requires platform credentials/toolchains and an HTTPS API configuration. |

## Production blockers

1. Provide an HTTPS API origin. The current `http://52.77.210.243` cannot support the backend's `Secure` refresh cookie and is rejected by preview/production mobile config.
2. Supply Android/iOS Google OAuth client configuration if Google sign-in is a launch requirement.
3. Define Staff permissions and endpoints; do not reuse Doctor authorization by assumption.
4. Define purpose-limited Admin access and audit requirements for patient health records.
5. Restore or supply the nine referenced rulebook files for requirements traceability.
6. Verify the deployed Swagger includes `request-more-information`; backend source and deployed contract may differ.
