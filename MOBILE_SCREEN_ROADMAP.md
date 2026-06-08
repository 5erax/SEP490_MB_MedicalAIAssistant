# MOBILE_SCREEN_ROADMAP

Tai lieu nay duoc lap sau khi ra soat source code trong `SEP490_FE_MedicalAIAssistant`, gom `src/App.jsx`, `src/pages`, `src/components`, `src/services`, `src/utils/roles.js`, `FE_SCREEN_INVENTORY.md`, `API_ARCHITECTURE.md` va `docs/flows-and-use-cases.md`.

Muc tieu: xac dinh toan bo man hinh Web hien co, route, role, API, workflow, muc do quan trong va thu tu trien khai Mobile App theo user journey thuc te.

## 1. Priority Definition

| Priority | Y nghia |
|---|---|
| P0 | Bat buoc cho Mobile MVP patient journey. |
| P1 | Can sau MVP de trai nghiem patient gan Web hon. |
| P2 | Nen co nhung phu thuoc backend/API hoac chua phai luong cot loi. |
| P3 | Static, legacy, staff/admin web-first hoac khong uu tien native mobile. |

## 2. Screen Roadmap Table

| Priority | Screen | Route Web | Role | APIs | Dependencies | Recommended Sprint |
|---|---|---|---|---|---|---|
| P0 | Login | `/login` | Guest, Patient, Staff, Admin | `POST /api/authentication/login`, `POST /api/authentication/google` | API client, auth storage, role utils, redirect by role, first-login flag | Sprint 1 |
| P0 | Signup/Register | `/signup` | Guest | `POST /api/authentication/register` | Auth service, validation, medical disclaimer/terms consent, post-register session handling | Sprint 1 |
| P0 | Forgot Password | `/forgot-password` | Guest | `POST /api/authentication/forgot-password` | Auth service, form validation, error/success message component | Sprint 1 |
| P0 | Change Password | `/change-password` | Guest, logged-out recovery users | `POST /api/authentication/change-password` | Auth service, OTP/password validation, keyboard-safe form | Sprint 1 |
| P0 | App Bootstrap / Workspace Redirect | `/app`, `/account`, `/app/patient` | Guest, Patient, Staff, Admin | Local auth/session; optional `GET /api/users/me` | AuthProvider restore, role routing, premium helper, deep-link aliases | Sprint 1 |
| P0 | Patient Profile Setup | `/patient/profile/setup` | Patient | `GET /api/users/me`, `GET /api/patient-profiles`, `PUT /api/users/{id}`, `POST /api/patient-profiles`, `PUT /api/patient-profiles/{id}` | Login/register, user identity, patient profile service, first-login redirect | Sprint 1 |
| P0 | Medical Disclaimer | `/medical-disclaimer` | Guest, Patient, Staff, Admin | None | Static content template, must be reusable before AI outputs | Sprint 1 |
| P0 | Patient Dashboard / Specialty Intake | `/dashboard` | Guest, Patient, Staff, Admin on Web; Mobile MVP targets Patient/Guest demo | `POST /api/web-chatbot/message` auth optional | Auth optional request, symptom input state, prompt chips, result/map navigation | Sprint 2 |
| P0 | Symptom Analysis | `/symptom` | Patient Premium, Staff, Admin | Web page is mock/local; interim Mobile can reuse `POST /api/web-chatbot/message` | Dashboard intake, disclaimer, emergency banner, result state, premium gate | Sprint 2 |
| P0 | Symptom Result / Department Suggestion | Part of `/symptom` and `/dashboard -> /map` flow | Patient | `POST /api/web-chatbot/message`; future symptom session/recommendation APIs | Symptom analysis response parser, department cards, CTA to map/chat | Sprint 2 |
| P0 | AI Chat | `/chat` | Patient Premium, Staff, Admin | Web uses external Anthropic; Mobile must use `POST /api/web-chatbot/message` | Auth, backend chatbot service, chat list UI, keyboard avoiding input, disclaimer | Sprint 2 |
| P0 | Nearby Clinics / Map | `/map` | Guest, Patient, Staff, Admin | `GET /api/medical-facilities/active`, future `GET /api/medical-facilities/{id}` | Location permission, map/list layout, symptom context, call/directions Linking | Sprint 2 |
| P0 | Facility Detail | Derived from `/map` cards/list | Guest, Patient | `GET /api/medical-facilities/{id}` if needed; list data can hydrate detail | Nearby Clinics, route param, phone/map linking, facility normalization | Sprint 2 |
| P0 | Pricing / Paywall | `/pricing` | Guest, Patient, Staff, Admin | `GET /api/subscription-plans/active` | Subscription service, premium gate, plan cards, locked-feature redirect | Sprint 3 |
| P1 | Profile | `/profile` | Patient Premium, Staff, Admin | Web mostly local; Mobile should reuse `GET /api/users/me`, `PUT /api/users/{id}`, patient profile APIs | Auth session, profile setup service, segmented sections, premium status | Sprint 3 |
| P1 | Legal Hub | `/legal` | Guest, Patient, Staff, Admin | None | Static content template, Settings/Help navigation | Sprint 3 |
| P1 | Terms | `/terms` | Guest, Patient, Staff, Admin | None | Static article template, auth/register consent links | Sprint 3 |
| P1 | Privacy | `/privacy` | Guest, Patient, Staff, Admin | None | Static article template, health data/privacy copy | Sprint 3 |
| P1 | Help Center | `/help` | Guest, Patient, Staff, Admin | None | Static article/FAQ template, support entry from settings | Sprint 3 |
| P1 | Medical Assistant Advanced | `/medical-assistant`, `/symptom-chat` | Patient, Staff, Admin; component denies unauthenticated users | `POST /api/web-chatbot/message` auth true; hospital recommendation is mock | Chat, map, symptom context; should merge with Home/Map rather than duplicate MVP flow | Sprint 3 |
| P1 | Landing / Public Home / Onboarding | `/` | Guest, Patient, Staff, Admin | Optional landing chat: `POST /api/web-chatbot/message` | Brand assets, auth CTA, pricing CTA, static sections reduced for mobile | Sprint 3 |
| P2 | Staff Register Portal | `/staff/register`, `/staff-register` | Guest, Staff applicants | `POST /api/authentication/register/staff` | Long form wizard, staff approval workflow, not patient MVP | Sprint 4 |
| P2 | Medical Records | `/records` | Patient Premium, Staff, Admin | Web is mock/local only; future records/lab/file APIs | Profile/auth, file picker, list/detail patterns, backend contracts pending | Sprint 4 |
| P2 | Record Detail / Lab Result / AI Analysis | Part of `/records` | Patient Premium | Web mock/local only; future `medical-records`, `lab-results`, `ai-analysis` APIs | Medical Records list, vertical lab rows, file preview/upload | Sprint 4 |
| P2 | Medication Scan | `/medication` | Patient Premium, Staff, Admin | Web is mock/local only; future medication scan/drug analysis APIs | Camera/image picker permission, upload/scan state, backend OCR contract pending | Sprint 4 |
| P2 | Medication Result / Interaction Check | Part of `/medication` | Patient Premium | Web mock/local only; future `medication-scans`, `drug-analyses` APIs | Medication Scan, result cards, drug safety disclaimer | Sprint 4 |
| P2 | Support | `/support` | Guest, Patient, Staff, Admin | None | Static/support action list, mail/phone/link handling | Sprint 4 |
| P2 | Contact | `/contact` | Guest, Patient, Staff, Admin | None currently; Web form has no submit API | Support actions, optional mailto, future contact API | Sprint 4 |
| P2 | 404 / Not Found | Any unmatched path | Guest, Patient, Staff, Admin | None | Expo Router not-found handling, safe navigation home | Sprint 4 |
| P2 | Legacy Patient Workspace Logic | Component `PatientWorkspacePage.jsx`; `/app/patient` redirects to `/dashboard` | Patient | `GET /api/users/me`, `GET /api/patient-profiles`, `PUT /api/users/{id}`, `POST/PUT /api/patient-profiles`, departments | Do not port UI directly; reuse profile/map/profile setup logic only | Sprint 4 |
| P2 | Staff Department Management Mobile Lite | `/app/staff` section | Staff, Admin | `GET /api/users/me`, `GET/POST/PUT/DELETE /api/medical-departments`, `POST /api/authentication/logout` | Staff role guard, department CRUD components; mobile-lite only if product requires | Sprint 5 |
| P3 | Staff Workspace Full | `/app/staff` | Staff, Admin | Same as staff departments and logout | Dense management workflow; Web-first for MVP | Sprint 5 |
| P3 | Admin Workspace Full | `/app/admin`, `/admin`, `/admin/users` | Admin | `GET /api/users/me`, users, departments, facilities, doctors, AI configs, staff register, logout | Admin role guard, large table/filter/form surface; not phone-first | Sprint 5 |
| P3 | Admin Overview | `/app/admin`, section `overview` | Admin | Initial admin load: `me`, users, departments, doctors, AI configs, facilities | Admin workspace, KPI cards; defer mobile native | Sprint 5 |
| P3 | Admin Pending Users | `/app/admin`, section `users` | Admin | `GET /api/users`, `POST /api/authentication/{userId}/approve-staff`, `DELETE /api/users/{id}` | Admin workspace, moderation cards; defer unless operational need | Sprint 5 |
| P3 | Admin Doctor Management | `/app/admin`, section `doctors` | Admin | `GET/POST/PUT/PATCH/DELETE /api/doctors`, departments, facilities | Doctor forms, filters, status actions; table-to-card rewrite required | Sprint 5 |
| P3 | Admin AI Config Management | `/app/admin`, section `ai-configs` | Admin | `GET/POST/PUT/PATCH/DELETE /api/ai-configs` | Long prompt/model config forms; should remain Web-first | Sprint 5 |
| P3 | Admin Staff Account Creation | `/app/admin`, section `staff` | Admin | `POST /api/authentication/register/staff` | Admin auth, staff form; defer mobile native | Sprint 5 |
| P3 | Admin Department Management | `/app/admin`, section `departments` | Admin | `GET/POST/PUT/DELETE /api/medical-departments` | Admin workspace, CRUD forms; overlap with Staff Department Management | Sprint 5 |
| P3 | Departments Redirect | `/departments` | Guest, Patient, Staff, Admin | None because route redirects to `/` | No native screen; deep-link redirect home | Sprint 5 |
| P3 | Product Info | `/product` | Guest, Patient, Staff, Admin | None | Static content; can live as web link/help article | Sprint 5 |
| P3 | Features Info | `/features` | Guest, Patient, Staff, Admin | None | Static content; optional onboarding/help reuse | Sprint 5 |
| P3 | Roadmap Info | `/roadmap` | Guest, Patient, Staff, Admin | None | Static content; better as web link | Sprint 5 |
| P3 | API Info | `/api` | Guest, Patient, Staff, Admin | None | Partner/developer content; not patient mobile MVP | Sprint 5 |
| P3 | Status | `/status` | Guest, Patient, Staff, Admin | None | Static service status; optional support link | Sprint 5 |
| P3 | Community | `/community` | Guest, Patient, Staff, Admin | None | Static/community CTA; optional web link | Sprint 5 |
| P3 | Cookies | `/cookies` | Guest, Patient, Staff, Admin | None | Mobile app may reference privacy instead of cookie-specific page | Sprint 5 |
| P3 | Demo Info | `/demo` | Guest, Patient, Staff, Admin | None | Merge into onboarding/home demo; no standalone native need | Sprint 5 |
| P3 | Departments Legacy Page | `DepartmentsPage.jsx`, inactive because `/departments` redirects | Guest*, Patient*, Staff*, Admin* if manually mounted | `GET/POST/PUT/DELETE /api/medical-departments` | Superseded by Staff/Admin workspaces; do not port standalone | Sprint 5 |
| P3 | AdminUsers Legacy Page | `AdminUsersPage.jsx`, inactive because `/admin/users` renders Admin Workspace | Admin* | `GET /api/users`, approve staff, delete user | Superseded by Admin Workspace users section | Sprint 5 |
| P3 | Account Legacy Page | `AccountPage.jsx`, inactive because `/account` redirects | Patient, Staff, Admin* if manually mounted | Mixed: me, departments, users, update user, register staff, approve/delete, logout | Superseded by role-specific screens; do not port | Sprint 5 |

`*` Legacy component role depends on component-internal checks if mounted manually. These are not active routes in current `src/App.jsx`.

## 3. Workflow Importance Summary

| Workflow | Web Screens | Mobile Importance | Notes |
|---|---|---|---|
| Authentication and session restore | Login, Signup, Forgot Password, Change Password, Workspace Redirect | Critical | This unlocks every authenticated patient flow and role redirect. |
| First-login patient profile setup | Patient Profile Setup | Critical | Web redirects first-login non-staff/non-admin users here; mobile must preserve this. |
| Core symptom-to-clinic journey | Dashboard, Symptom Analysis, Nearby Clinics, Facility Detail | Critical | Main product value: describe symptoms, get guidance, find care. |
| AI chat assistance | Chatbot, Medical Assistant Advanced, landing chat | Critical for MVP, but backend-only | Mobile must not ship external Anthropic keys; use backend chatbot endpoint. |
| Pricing and premium gate | Pricing, premium-protected pages | High | Needed because many Web patient pages are behind `requirePremium`. |
| Patient account/profile management | Profile, PatientWorkspace legacy logic | High | Web profile is partly local, but real setup APIs can be reused. |
| Medical records | Medical Records | Medium | Web is mock; build after real backend contract exists. |
| Medication scan | Medication Scan | Medium | Web is mock; native camera makes it valuable but API dependency is high. |
| Staff operations | Staff Workspace | Low for patient MVP | Useful, but not central to patient mobile app. |
| Admin operations | Admin Workspace | Low for phone MVP | Dense web console should remain Web-first. |
| Static/legal/support | StaticPage routes | Medium-low | Legal/disclaimer is required; other pages can be article templates or web links. |

## 4. Recommended Sprint Plan

### Sprint 1 - Auth, Session, Profile Setup, Safety Copy

Screens:

| Screen | Route Web | Priority |
|---|---|---|
| Login | `/login` | P0 |
| Signup/Register | `/signup` | P0 |
| Forgot Password | `/forgot-password` | P0 |
| Change Password | `/change-password` | P0 |
| App Bootstrap / Role Redirect | `/app`, `/account`, `/app/patient` | P0 |
| Patient Profile Setup | `/patient/profile/setup` | P0 |
| Medical Disclaimer | `/medical-disclaimer` | P0 |

Reason:

Sprint 1 tao nen duong vao app that su: dang nhap, dang ky, khoi phuc mat khau, restore session, redirect theo role va hoan thien profile lan dau. Day la nhom co do phu thuoc cao nhat, vi Home, Chat, Profile, Map co the can token, role, premium flag va patient profile.

Component/API tai su dung:

- Auth forms, `AuthProvider`, session persistence.
- `authService`, `patientProfilesService`.
- Shared `Button`, `TextField`, `ApiMessage`, `Screen`, `Card`.
- Static article/disclaimer component.

### Sprint 2 - Core Patient MVP: Symptom to Clinic

Screens:

| Screen | Route Web | Priority |
|---|---|---|
| Patient Dashboard / Specialty Intake | `/dashboard` | P0 |
| Symptom Analysis | `/symptom` | P0 |
| Symptom Result / Department Suggestion | Part of `/symptom` and `/dashboard` flow | P0 |
| AI Chat | `/chat` | P0 |
| Nearby Clinics / Map | `/map` | P0 |
| Facility Detail | Derived from `/map` | P0 |

Reason:

Day la gia tri cot loi cua MediMate AI tren mobile: user mo app, nhap trieu chung, nhan dinh huong an toan, trao doi AI neu can, tim co so y te va goi/chi duong. Sprint nay nen dung backend `/api/web-chatbot/message` va `/api/medical-facilities/active` truoc, vi day la cac API Web dang dung that.

Component/API tai su dung:

- Chat input/message list, prompt chips, emergency/disclaimer banner.
- Map/list/facility card pattern.
- `webChatbotApi.message`, `medicalFacilitiesApi.active`.
- Native location, phone, maps linking.

### Sprint 3 - Monetization, Profile, Help/Legal, Public Onboarding

Screens:

| Screen | Route Web | Priority |
|---|---|---|
| Pricing / Paywall | `/pricing` | P0 |
| Profile | `/profile` | P1 |
| Landing / Onboarding | `/` | P1 |
| Medical Assistant Advanced | `/medical-assistant`, `/symptom-chat` | P1 |
| Legal Hub | `/legal` | P1 |
| Terms | `/terms` | P1 |
| Privacy | `/privacy` | P1 |
| Help Center | `/help` | P1 |

Reason:

Sau khi core journey chay duoc, app can premium gate va pricing de phan biet free/premium giong Web. Profile giup user quan ly thong tin, con onboarding/help/legal giup app day du hon ve trust, safety va compliance. Medical Assistant Advanced nen duoc merge logic vao Chat/Map thay vi tao mot luong trung lap.

Component/API tai su dung:

- Paywall modal, plan cards, article template.
- `subscriptionPlansApi.active`.
- Existing profile setup APIs for profile edit.
- Settings/help/legal navigation.

### Sprint 4 - Patient Extended Features and Backend-Gap Shells

Screens:

| Screen | Route Web | Priority |
|---|---|---|
| Medical Records | `/records` | P2 |
| Record Detail / Lab Result / AI Analysis | Part of `/records` | P2 |
| Medication Scan | `/medication` | P2 |
| Medication Result / Interaction Check | Part of `/medication` | P2 |
| Staff Register Portal | `/staff/register`, `/staff-register` | P2 |
| Support | `/support` | P2 |
| Contact | `/contact` | P2 |
| Not Found | Any unmatched path | P2 |
| Legacy Patient Workspace Logic reuse | `PatientWorkspacePage.jsx` | P2 |

Reason:

Records va medication la tinh nang hop voi mobile, nhung Web hien dang mock/local va chua co API contract day du. Sprint 4 nen tao UI shell, permission flow, picker/camera integration va state pattern, chi wire backend khi endpoint san sang. Support/contact/not-found hoan thien trai nghiem app nhung khong chan MVP.

Component/API tai su dung:

- List/detail pattern, file/image picker, scan progress, empty state.
- Reuse profile/map logic tu `PatientWorkspacePage.jsx`, khong port layout legacy.
- Backend future contracts: records, lab results, medication scans, drug analyses.

### Sprint 5 - Staff/Admin, Static Low-Priority, Legacy Cleanup

Screens:

| Screen | Route Web | Priority |
|---|---|---|
| Staff Department Management Mobile Lite | `/app/staff` section | P2 |
| Staff Workspace Full | `/app/staff` | P3 |
| Admin Workspace Full | `/app/admin`, `/admin`, `/admin/users` | P3 |
| Admin Overview | Admin section | P3 |
| Admin Pending Users | Admin section | P3 |
| Admin Doctor Management | Admin section | P3 |
| Admin AI Config Management | Admin section | P3 |
| Admin Staff Account Creation | Admin section | P3 |
| Admin Department Management | Admin section | P3 |
| Static low-priority pages | `/product`, `/features`, `/roadmap`, `/api`, `/status`, `/community`, `/cookies`, `/demo` | P3 |
| Legacy inactive pages | `DepartmentsPage`, `AdminUsersPage`, `AccountPage` | P3 |

Reason:

Staff/Admin tren Web la console van hanh co bang, filter, modal form va prompt editor dai. Day khong phai phone-first MVP. Mobile nen chi co unsupported/CTA dung Web, hoac mot ban mobile-lite cho staff department neu san pham bat buoc. Cac static route marketing/developer nen de web link hoac help article sau.

Component/API tai su dung:

- Role guard Staff/Admin.
- CRUD list-card pattern neu lam mobile-lite.
- Web-first CTA cho admin console.

## 5. Mobile MVP Cut Recommendation

Nen chot MVP mobile sau Sprint 2 neu can ra ban dung thu:

1. Auth/session.
2. Patient profile setup.
3. Home symptom intake.
4. AI chat qua backend.
5. Symptom result/disclaimer/emergency banner.
6. Nearby clinics map/list/detail.
7. Pricing/paywall basic.

Nen defer khoi MVP:

- Medical records upload/AI lab analysis vi Web con mock.
- Medication OCR/drug interaction vi Web con mock.
- Treatment journey/reminders vi chua co Web implementation/API.
- Staff/Admin native console vi Web-first va UI khong phu hop dien thoai.

