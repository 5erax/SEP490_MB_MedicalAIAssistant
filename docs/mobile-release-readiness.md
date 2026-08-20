# MediMate mobile release readiness

Updated: 2026-08-20. No command is marked PASS unless it was executed in this workspace.

## Functional parity

| Domain | State | Note |
|---|---|---|
| Patient | PASS | Core Patient workflows use real backend contracts. |
| Doctor | PASS | Recovery workflow and structured editor are implemented. |
| Staff | BLOCKED | No Staff-specific backend domain contract. |
| Admin | PARTIAL | Browsing and department CRUD exist; entity-specific mutations remain. |
| Auth | PASS | Native session lifecycle is implemented. |
| Payment | PASS | API/browser/reconcile/history lifecycle is implemented. |
| Map | PASS | Native map and fallback exist. |
| Lab | PASS | Analyze/history/detail/OCR/trends exist. |
| Medication | PASS | Existing workflow retained and regression-checked. |
| Recovery plan | PASS | Patient and Doctor workflows implemented. |

## Production readiness

| Domain | State | Release blocker |
|---|---|---|
| Patient | BLOCKED | P0 clinical/privacy approval and HTTPS API. |
| Doctor | BLOCKED | Clinical publish and object/purpose authorization approval. |
| Staff | BLOCKED | Backend contract absent. |
| Admin | BLOCKED | Mutation parity and PHI/purpose governance. |
| Auth | BLOCKED | HTTPS API and native Google OAuth verification. |
| Payment | BLOCKED | Verified HTTPS App Link/Universal Link return domain. |
| Map | BLOCKED | Physical Android/iOS device QA. |
| Lab | BLOCKED | Approved secure upload and clinical review. |
| Medication | BLOCKED | Clinical/device QA. |
| Recovery plan | BLOCKED | Clinical publish approval and production backend. |

## Verification evidence

Exact command outcomes belong in the final task report. Local automated evidence covers TypeScript, ESLint, Jest, Expo Doctor, dependency audit, Expo config and web export. Maestro flows in `.maestro/` require controlled role accounts. Android compilation requires Android SDK/JDK; iOS compilation requires macOS/Xcode/signing.

## P0/P1 evidence

- REQ-010..014: direct ungated emergency CTA and component test.
- REQ-030..031: OCR provenance, server-only ranges and missing-range test.
- REQ-032..034/BR-025: exact Doctor hierarchy DTOs, confirmations, server reconciliation and published-only Patient API.
- REQ-040..044: SecureStore, one-retry refresh, role guards and no generic Admin patient-profile browser.
- REQ-050..053: shared headings, labelled fields, state announcement and minimum shared touch size.

## Required configuration names

- `EXPO_PUBLIC_APP_ENV`, `EXPO_PUBLIC_API_BASE_URL`, `MEDIMATE_ALLOW_DEV_HTTP`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` plus native Android/iOS OAuth clients and fingerprints
- `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`, `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, `EXPO_PUBLIC_CLOUDINARY_UPLOAD_FOLDER`
- Maestro: `PATIENT_EMAIL`, `PATIENT_PASSWORD`, `DOCTOR_EMAIL`, `DOCTOR_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

Never commit credential values, passwords, signing keys or provider secrets.

## External blockers

1. Supplied backend is HTTP; preview/production reject it and Secure refresh cookies require HTTPS.
2. Native Google OAuth credentials, fingerprints/bundle verification and device evidence are absent.
3. Swagger exposes Doctor recovery but no Staff domain capability.
4. PayOS return/cancel has no verified HTTPS App Link/Universal Link domain.
5. Direct unsigned Cloudinary upload needs an approved restricted preset/retention model or backend-signed upload.
6. Rulebook policies require clinical, privacy/security and accessibility owner approvals for P0 gates.

## Rollback considerations

- Retain the previous EAS artifact/API-compatible release until smoke tests pass.
- Recovery and payment mutations are server-authoritative; client rollback must not alter server records.
- Never roll back HTTPS enforcement, SecureStore, role guards or emergency access.

## Known limitations

- No SignalR mobile client; recovery uses explicit refresh/server reconciliation.
- AI configuration is mobile read-only pending P0 approval/evaluation workflow.
- Physical VoiceOver/TalkBack and device builds are unavailable in this Windows workspace.
