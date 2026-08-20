# Targeted mobile accessibility audit

Code audit date: 2026-08-20. Scope: Login, Register OTP, Patient dashboard/intake/emergency, Map, Lab, Medication, Recovery, Doctor and Admin.

## Fixes completed

- `AppText` maps h1/h2/h3 variants to the native header role.
- `TextField` exposes its visible label, hint and invalid/disabled state to assistive technology.
- Shared buttons announce disabled state; small buttons now retain a minimum 44px target.
- New Doctor/Admin/Lab/Recovery actions use button/tab/radio roles and selected/checked/disabled state.
- Emergency CTA has an explicit Vietnamese label and remains reachable without a premium gate.
- Lab and workflow statuses include text, not color alone; OCR/range uncertainty has descriptive copy.
- Destructive Recovery/Admin/Doctor mutations require a native confirmation alert.

## Static audit result

Critical flows have labelled fields, headings, action roles, disabled state, non-color status and shared minimum targets. Layouts use wrapping/vertical cards rather than wide desktop tables. No accessibility-blocking horizontal data table was added.

## Device verification still required

VoiceOver focus order and announcements, TalkBack traversal, 200% font scaling, contrast under real display settings, reduced-motion behavior, switch control and physical 320px layout require installed iOS/Android builds and assistive-technology devices. Those checks cannot be claimed PASS from this Windows workspace.
