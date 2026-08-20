# MediMate mobile security notes

## Transport and session

- Preview/production accept only HTTPS API origins. Cleartext is opt-in and development-only.
- Native access tokens use Expo SecureStore. Refresh is single-flight and replays a rejected request at most once.
- Refresh failure clears the local session. Logout clears local state even if its network request fails.
- Google login is configuration-gated and cannot report fake success.

## Authorization and PHI

- Router guards resolve Patient, Doctor, Staff and Admin independently; Premium is an entitlement, not a role.
- Staff never probes Doctor/Admin endpoints.
- Doctor context uses the assigned Doctor endpoint. Release still requires owner confirmation of consent, purpose and audit controls under REQ-043/044 and CON-005.
- Admin generic browsing excludes Patient profiles and filters token/password/prompt/secret/credential fields. AI configuration mutation remains read-only pending approval.

## Clinical safety

- Emergency guidance exposes 115 without subscription gating.
- Lab ranges/status come only from server data. OCR is labelled fallible; missing ranges never become normal; mixed units warn.
- Recovery values are Doctor-authored through backend DTOs. Publish is confirmed, non-optimistic and server-reconciled; Patient APIs do not expose drafts.
- The client does not generate medication, nutrition, diagnosis or treatment values.

## Uploads and secrets

- Lab uploads accept validated JPEG, PNG and PDF only.
- Direct unsigned Cloudinary upload is not approved for production PHI until restricted preset, retention/deletion and access ownership are documented or replaced with backend signing.
- Never place provider secrets, OAuth secrets, passwords or signing material in `EXPO_PUBLIC_*`, source, EAS files or Maestro flows.

## Logging and rollback

- No intentional token/password/PHI console logging was found in the reviewed mobile path.
- Never resolve an outage by enabling production HTTP, bypassing TLS, moving tokens to AsyncStorage, widening roles or exposing Admin PHI.
