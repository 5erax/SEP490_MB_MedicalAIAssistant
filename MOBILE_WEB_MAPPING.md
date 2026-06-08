# Mobile-Web Mapping - MediMate AI

Tai lieu nay dua tren `SEP490_FE_MedicalAIAssistant/FE_SCREEN_INVENTORY.md` va mapping tung man hinh Web sang React Native Mobile. Muc tieu la giu nguyen business logic, workflow, API integration va user journey; chi dieu chinh layout/interaction cho man hinh dien thoai.

## Priority Definition

| Priority | Y nghia |
|---|---|
| P0 | Bat buoc cho Mobile MVP patient journey. |
| P1 | Can cho trai nghiem tuong duong Web sau MVP. |
| P2 | Nen co nhung co the defer khi API/backend chua san sang. |
| P3 | Web-first/static/legacy, khong uu tien native mobile. |

## Main Screen Mapping

| Web Screen | Mobile Screen | Same Logic | Same API | UI Changes Required | Priority |
|---|---|---|---|---|---|
| Landing Page (`/`) | Onboarding / Public Home | Partial: giu brand, disclaimer, CTA login/signup, demo value proposition; rut gon marketing sections. | Partial: reuse `POST /api/web-chatbot/message` cho landing assistant neu can. | Can toi uu mobile: thay full landing scroll dai bang onboarding 2-3 slide, CTA ro, chat floating thanh entry card. | P1 |
| Login (`/login`) | LoginScreen | Yes: email/password, redirect theo role, first-login profile setup. | Yes: `POST /api/authentication/login`, optional `POST /api/authentication/google`. | Can toi uu mobile: 1 cot, hide side panel, keyboard-safe layout, SecureStore thay localStorage. | P0 |
| Signup (`/signup`) | RegisterScreen | Yes: RegisterRequest fields, consent/disclaimer, post-register session. | Yes: `POST /api/authentication/register`. | Can toi uu mobile: chia form thanh section/step, full-width inputs, sticky submit, password visibility toggle. | P0 |
| Staff Register Portal (`/staff/register`, `/staff-register`) | StaffRegisterScreen or WebView/UnsupportedStaffRegistration | Yes if supported: same registration application and pending approval state. | Yes: `POST /api/authentication/register/staff`. | Can toi uu mobile: wizard 3 buoc; tuy nhien khong phai patient MVP. | P2 |
| Forgot Password (`/forgot-password`) | ForgotPasswordScreen | Yes: submit email, show success/error. | Yes: `POST /api/authentication/forgot-password`. | Can giu gan 100%, chuyen sang single-card mobile form. | P0 |
| Change Password (`/change-password`) | ChangePasswordScreen | Yes: email, OTP, new password, confirm password. | Yes: `POST /api/authentication/change-password`. | Can giu gan 100%, them keyboard-safe scroll va validation inline. | P0 |
| Patient Dashboard / Specialty Intake (`/dashboard`) | HomeScreen / SpecialtyIntakeScreen | Yes: quick prompts, symptom input, submit, save context, navigate to map/result. | Yes: `POST /api/web-chatbot/message` auth optional. | Can toi uu mobile: textarea thanh multiline input, prompt chips horizontal scroll, CTA fixed bottom; khong dung desktop hero-scale layout. | P0 |
| User Profile (`/profile`) | ProfileScreen | Partial: tabs info/medical/security/subscription, premium gate. Web page hien save local; mobile nen dung real profile setup API where possible. | Partial: reuse auth state; nen reuse `GET /api/users/me`, `PUT /api/users/{id}`, patient profile APIs tu setup flow. | Can toi uu mobile: tabs thanh segmented control/list sections, avatar header, form sections collapsed, remove desktop sidebar. | P1 |
| Symptom Analysis (`/symptom`) | SymptomAnalysisScreen + SymptomResultScreen | Yes for workflow: input -> analyzing -> result -> save/clinic CTA. Data hien mock tren web. | Same as Web: no real symptom session API. Interim reuse `POST /api/web-chatbot/message`; future session APIs. | Can toi uu mobile: split into stack screens, stepper compact, result cards vertical, emergency banner sticky top. | P0 |
| AI Chatbot (`/chat`) | ChatScreen | Partial: same chat UX, prompt suggestions, disclaimer. Do not ship direct Anthropic key on mobile. | Change required: use backend `POST /api/web-chatbot/message` instead of external Anthropic from app. | Can toi uu mobile: native chat list, keyboard avoiding input bar, quick actions in header/menu. | P0 |
| Nearby Clinics / Map (`/map`) | NearbyClinicsScreen / MapScreen | Yes: search/filter/list/map sync, locate me, call, directions, context from symptom. | Yes: `GET /api/medical-facilities/active`; future `GET /api/medical-facilities/{id}`. | Can toi uu mobile: map top 50-55%, bottom sheet facility list, native location permission, native Linking for tel/maps. | P0 |
| Medical Records (`/records`) | MedicalRecordsScreen + RecordDetailScreen | Yes for UX concept: list, detail, lab, AI analysis, files. Web is mock. | Same as Web: no real API yet. Future records/lab/file APIs. | Can toi uu mobile: list-first, detail as stack screen, tables become vertical lab rows, file tiles use native picker. | P2 |
| Medication Scan (`/medication`) | MedicationScanScreen + MedicationResultScreen | Yes for flow: pick/capture image -> scan -> result -> interaction check. Web is mock. | Same as Web: no real API yet. Future medication scan/drug analysis APIs. | Can toi uu mobile: native camera/image picker, scan progress screen, medication result cards; avoid desktop two-column. | P2 |
| Pricing (`/pricing`) | PricingScreen / PaywallScreen | Yes: active plans, billing toggle, premium modal/status. | Yes: `GET /api/subscription-plans/active`; checkout later. | Can toi uu mobile: vertical plan cards, bottom CTA, FAQ accordion, compact toggle. | P0 |
| Workspace Redirect (`/app`) | AppBootstrap / RoleRedirectScreen | Yes: restore auth, route by role, first-login setup. | Yes local auth state; optional `GET /api/users/me` to refresh role. | Can giu logic 100%; UI is splash/loading/unsupported role CTA. | P0 |
| Account Redirect (`/account`, `/app/patient`) | LegacyDeepLinkRedirect | Yes: redirect to patient home/dashboard. | Yes local auth only. | No visible UI needed; handle as deep link alias. | P2 |
| Staff Workspace (`/app/staff`) | StaffWorkspaceScreen or WebFirstStaffNotice | Yes if implemented: role guard, department CRUD. | Yes: `GET /api/users/me`, department CRUD, logout. | Khong phu hop cho Mobile MVP: management table/forms should be simplified to list + modal if required. | P3 |
| Admin Workspace (`/app/admin`, `/admin`, `/admin/users`) | AdminConsoleUnsupportedScreen or AdminMobileLite | Partial: role guard and admin workflows. | Yes but large API surface: users, doctors, departments, AI configs, facilities. | Khong phu hop cho Mobile MVP: dense tables, filters, prompt editing. Use Web-first CTA. | P3 |
| Medical Assistant Advanced (`/medical-assistant`, `/symptom-chat`) | AdvancedAssistantScreen | Yes: authenticated symptom chat + hospital recommendation/map focus. | Partial: `POST /api/web-chatbot/message`; hospital recommendation currently mock. | Can toi uu mobile: chat-first with map/result bottom sheet; merge with Home/Map to avoid duplicate flow. | P1 |
| Patient Profile Setup (`/patient/profile/setup`) | PatientProfileSetupScreen | Yes: load user, load matching patient profile, update user, create/update patient profile, clear firstLogin. | Yes: `GET /api/users/me`, `GET /api/patient-profiles`, `PUT /api/users/{id}`, `POST/PUT /api/patient-profiles`. | Can toi uu mobile: wizard sections, progress indicator, required fields first, sticky submit. | P0 |
| Departments Redirect (`/departments`) | No Native Screen / RedirectHome | Yes: redirect home. | None. | No UI. Legacy route only. | P3 |
| Static Content Pages | StaticInfoScreen | Yes for content/legal copy. | None. | Can toi uu mobile: reusable static article template, section cards vertical, no desktop grid. | P2 |

## Static Page Mapping

| Web Screen | Mobile Screen | Same Logic | Same API | UI Changes Required | Priority |
|---|---|---|---|---|---|
| Product (`/product`) | ProductInfoScreen | Yes: product education. | None. | Can toi uu mobile: article sections, CTA buttons. | P3 |
| Features (`/features`) | FeaturesInfoScreen | Yes. | None. | Can toi uu mobile: feature cards vertical. | P3 |
| Roadmap (`/roadmap`) | RoadmapInfoScreen | Yes. | None. | Can toi uu mobile or omit from app settings/help. | P3 |
| API Info (`/api`) | ApiInfoScreen | Yes. | None. | Khong phu hop patient MVP; move to web/help link. | P3 |
| Support (`/support`) | SupportScreen | Yes. | None. | Can toi uu mobile: list of support actions. | P2 |
| Help Center (`/help`) | HelpScreen | Yes. | None. | Can toi uu mobile: FAQ accordion, emergency section. | P1 |
| Contact (`/contact`) | ContactSupportScreen | Partial: static form on web. | None currently. | Can toi uu mobile: mailto/link actions; form later if API exists. | P2 |
| Status (`/status`) | SystemStatusScreen | Yes static. | None. | Optional in settings. | P3 |
| Community (`/community`) | CommunityInfoScreen | Yes static. | None. | Optional web link. | P3 |
| Legal (`/legal`) | LegalHubScreen | Yes. | None. | Can toi uu mobile: Settings -> Legal list. | P1 |
| Terms (`/terms`) | TermsScreen | Yes. | None. | Scroll article with accept/back. | P1 |
| Privacy (`/privacy`) | PrivacyScreen | Yes. | None. | Scroll article. | P1 |
| Cookies (`/cookies`) | CookiesScreen | Yes. | None. | Optional; mobile app may present tracking/privacy policy. | P3 |
| Medical Disclaimer (`/medical-disclaimer`) | MedicalDisclaimerScreen | Yes. | None. | Important: show before AI flows and in Legal. | P0 |
| Demo Info (`/demo`) | DemoInfoScreen | Yes. | None. | Can merge into onboarding/help. | P3 |
| 404 Fallback | NotFoundScreen | Yes. | None. | Simple native fallback with go home/contact. | P2 |

## Admin/Staff Sub-Screen Mapping

| Web Screen | Mobile Screen | Same Logic | Same API | UI Changes Required | Priority |
|---|---|---|---|---|---|
| Admin Overview | AdminOverviewLiteScreen | Partial. | Same initial admin APIs. | Khong phu hop MVP; if built, replace charts/tables with KPI cards and action list. | P3 |
| Users Pending Approval | AdminPendingUsersScreen | Yes. | `GET /api/users`, approve-staff, delete user. | Table -> vertical user cards with approve/delete actions. | P3 |
| Doctor Management | AdminDoctorsScreen | Yes. | Doctor CRUD/status + departments/facilities. | Dense table/filter -> searchable list + filter sheet + form modal. | P3 |
| AI Config Management | AdminAIConfigsScreen | Yes. | AI config CRUD/status. | Not ideal mobile due long prompts; use read-only or Web CTA. | P3 |
| Staff Account Creation | AdminCreateStaffScreen | Yes. | `POST /api/authentication/register/staff`. | Form wizard if required. | P3 |
| Department Management | StaffDepartmentsScreen / AdminDepartmentsScreen | Yes. | Department CRUD. | List + add/edit bottom sheet. Could be mobile-lite. | P2 |

## Legacy Component Mapping

| Web Screen | Mobile Screen | Same Logic | Same API | UI Changes Required | Priority |
|---|---|---|---|---|---|
| `DepartmentsPage.jsx` | Do not port as standalone | Superseded by Staff/Admin Department screens. | Department CRUD if reused. | Remove legacy public CRUD page from mobile. | P3 |
| `AdminUsersPage.jsx` | Do not port as standalone | Superseded by Admin Workspace users section. | Users/approve/delete if reused. | Merge with AdminPendingUsersScreen only if admin mobile is needed. | P3 |
| `AccountPage.jsx` | Do not port | Superseded by role-specific screens. | Mixed APIs. | Avoid confusing multi-actor UI on mobile. | P3 |
| `PatientWorkspacePage.jsx` | Do not port directly | Useful logic for real profile API update and patient map concept. | `me`, departments, patient profiles, user update. | Extract API/workflow ideas into ProfileSetup/Profile/Map; do not keep old dashboard layout. | P2 |

## UI Portability Assessment

| Web Area | UI Assessment | Mobile Direction |
|---|---|---|
| Auth pages | Can keep brand 100%, layout needs mobile optimization. | Use one card, hide dark side panel on small screens, keep lime/dark identity. |
| Patient Dashboard | Logic/API 100% portable, UI needs optimization. | Mobile-first intake card, prompt chips, bottom CTA. |
| Chatbot | Workflow portable, direct Anthropic API not portable. | Use backend chatbot only, native chat layout. |
| Map | Workflow/API portable, desktop split panel needs mobile redesign. | Map + bottom sheet list/details. |
| Symptom Analysis | Workflow portable, API not final. | Step stack + result screen, vertical cards. |
| Profile/Records/Medication | UX concept portable; some APIs missing/mocked. | Build shells now, wire real APIs later. |
| Pricing/Legal/Help | Highly portable. | Reusable info/article templates. |
| Staff/Admin | Business logic portable, UI not suitable for phone-first MVP. | Keep Web-first or build mobile-lite cards. |

## Recommended Mobile Navigation

| Web Route Source | Mobile Navigation Target |
|---|---|
| `/dashboard` | `(patient)/(tabs)/home` |
| `/map` | `(patient)/(tabs)/map` |
| `/chat` | `(patient)/(tabs)/chat` |
| `/records` | `(patient)/(tabs)/records` |
| `/profile` | `(patient)/(tabs)/profile` |
| `/symptom` | `(patient)/symptom/index` and `(patient)/symptom/result` |
| `/medication` | `(patient)/medication/index` and `(patient)/medication/result` |
| `/pricing` | `(public)/pricing` or modal paywall |
| `/patient/profile/setup` | `(setup)/patient-profile` |
| static legal/help | `(public)/legal/*`, `(public)/help` or Settings sub-screens |

