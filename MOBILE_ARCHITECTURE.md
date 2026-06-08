# Mobile Architecture - MediMate AI

## 1. Nguồn tham chiếu từ Web

Repo web `SEP490_FE_MedicalAIAssistant` hiện là nguồn tham chiếu chính cho UI, workflow và API layer. Các phần quan trọng đã được rà soát:

- Routing chính: `src/App.jsx`
- Role/auth redirect: `src/utils/roles.js`
- API client và endpoint registry: `src/services/apiClient.js`, `src/services/endpoints.js`
- Domain services: auth, users, departments, facilities, doctors, patient profiles, subscription plans, AI configs, web chatbot
- Patient pages: dashboard, symptom analysis, chatbot, map, profile, patient profile setup, records, medication scan, pricing
- Operator pages: staff workspace, admin workspace
- Product flow docs: `API_ARCHITECTURE.md`, `docs/flows-and-use-cases.md`

Kết luận kiến trúc: Mobile MVP nên tập trung vào patient journey. Staff/Admin nên giữ trên web ở giai đoạn đầu vì thao tác dạng bảng, lọc, quản trị prompt/model, duyệt user và quản lý dữ liệu vận hành không tối ưu cho MVP mobile.

## 2. Role hiện có

### Guest
- Xem landing/demo trên web.
- Trên mobile nên cho xem onboarding, đăng nhập/đăng ký, pricing và có thể mở bản đồ/cơ sở y tế nếu backend cho phép public.
- Không lưu hồ sơ, lịch sử tư vấn, y bạ, thuốc.

### Patient/User
- Role mặc định sau đăng ký.
- Truy cập dashboard, nhập triệu chứng, xem gợi ý khoa/cơ sở y tế, chat AI, hồ sơ bệnh nhân, y bạ, thuốc, subscription.
- Web hiện khóa premium cho `/profile`, `/symptom`, `/chat`, `/records`, `/medication`; `/dashboard` và `/map` là free.

### Staff/Medical Operator
- Web: quản lý chuyên khoa.
- Có thể được mở rộng quản lý cơ sở y tế, khoa trong cơ sở, bác sĩ, review.
- Không đưa vào Mobile MVP.

### Admin
- Web: quản lý user chờ duyệt, staff account, chuyên khoa, bác sĩ, AI config.
- Không đưa vào Mobile MVP.

## 3. Màn hình Mobile đề xuất

### Public/Auth
1. **Splash / Onboarding**
   - Logo, medical disclaimer ngắn, CTA đăng nhập/đăng ký.
2. **Login**
   - Email/password.
   - Google login có thể làm sau vì web đang phụ thuộc `VITE_GOOGLE_CLIENT_ID`.
3. **Register**
   - Email, username, display name, password, gender, date of birth, address.
   - Checkbox đồng ý điều khoản và disclaimer.
4. **Forgot Password**
   - Nhập email nhận OTP/hướng dẫn.
5. **Change Password**
   - Email, OTP, mật khẩu mới.
6. **Pricing / Upgrade**
   - Free vs MediMate+.
   - MVP chỉ hiển thị plan và trạng thái; checkout native có thể để phase sau.

### Patient MVP
1. **Home / Specialty Intake**
   - Tương đương web `/dashboard`.
   - Nhập mô tả triệu chứng tự nhiên.
   - Quick prompts.
   - Gọi chatbot backend để lấy gợi ý ban đầu, sau đó chuyển sang map/result.
2. **Symptom Analysis**
   - Tương đương web `/symptom`.
   - Step form: triệu chứng, mức độ, thời gian.
   - MVP có thể dùng `web-chatbot/message` trước khi backend có session API riêng.
3. **Symptom Result**
   - Hiển thị disclaimer.
   - Gợi ý khoa, mức ưu tiên, cảnh báo cấp cứu, câu hỏi nên hỏi bác sĩ.
   - CTA: tìm cơ sở y tế, mở chat, lưu kết quả nếu backend hỗ trợ.
4. **AI Chat**
   - Tương đương web `/chat`, nhưng mobile không nên gọi Anthropic trực tiếp từ app.
   - Dùng backend `/api/web-chatbot/message`.
5. **Nearby Clinics / Map**
   - Tương đương web `/map`.
   - List + map, search, filter type, locate me, call, directions.
   - Dùng `/api/medical-facilities/active`; fallback mock chỉ dùng dev.
6. **Facility Detail**
   - Tên, địa chỉ, phone, opening hours, departments, doctors.
   - CTA gọi điện, chỉ đường, lưu kế hoạch đi khám.
7. **Patient Profile Setup**
   - Tương đương `/patient/profile/setup`.
   - First-login flow cho patient: thông tin liên hệ + blood type, height, weight, allergy, chronic disease.
8. **Profile**
   - Tài khoản, thông tin cá nhân, hồ sơ sức khỏe, bảo mật, subscription status.
9. **Medical Records**
   - Tương đương `/records`.
   - MVP đầu tiên có thể là UI shell + local/mock nếu backend records chưa có.
   - Phase sau: upload file, lab result, AI analysis.
10. **Medication Scan**
   - Tương đương `/medication`.
   - Cần camera/image picker native.
   - Web hiện đang mock OCR/result, nên mobile nên để phase sau nếu backend chưa có.
11. **Notifications / Reminders**
   - Không có web implementation thật, nhưng là lợi thế mobile.
   - Đưa vào roadmap sau treatment journey.

## 4. User Flow

### Guest to Patient
1. Mở app.
2. Xem onboarding + disclaimer.
3. Chọn đăng ký hoặc đăng nhập.
4. Sau đăng nhập, app đọc role từ auth response/JWT.
5. Nếu `isFirstLogin` và không phải Staff/Admin, chuyển sang Patient Profile Setup.
6. Nếu profile đã hoàn tất, vào Home.

### Core Triage Flow
1. Patient mở Home.
2. Nhập triệu chứng hoặc chọn quick prompt.
3. App gọi `POST /api/web-chatbot/message` với auth token nếu có.
4. App lưu ngữ cảnh triệu chứng trong state/store.
5. App hiển thị Symptom Result hoặc chuyển sang Nearby Clinics.
6. Patient xem cơ sở y tế phù hợp trên list/map.
7. Patient gọi điện, mở chỉ đường, hoặc lưu kế hoạch đi khám khi API visit có sẵn.

### Profile Setup Flow
1. Sau first login, app gọi `GET /api/users/me`.
2. App gọi `GET /api/patient-profiles?PageNumber=1&PageSize=100`.
3. App match profile theo `userId`.
4. User cập nhật thông tin.
5. App gọi `PUT /api/users/{userId}`.
6. App gọi `POST /api/patient-profiles` hoặc `PUT /api/patient-profiles/{id}`.
7. App cập nhật local auth flags: `firstLogin=false`, `isProfileCompleted=true`.

### Premium Gate Flow
1. User bấm tab premium như Chat, Symptom, Profile, Records, Medication.
2. App kiểm tra `hasPremiumAccess` từ auth payload.
3. Nếu chưa premium, mở paywall/pricing.
4. Không khóa emergency warning hoặc thông tin an toàn y tế sau paywall.

## 5. Navigation Structure

Expo Router nên dùng group theo trạng thái auth:

```txt
app/
  _layout.tsx
  (public)/
    onboarding.tsx
    login.tsx
    register.tsx
    forgot-password.tsx
    change-password.tsx
    pricing.tsx
  (setup)/
    patient-profile.tsx
  (patient)/
    _layout.tsx
    (tabs)/
      home.tsx
      map.tsx
      chat.tsx
      records.tsx
      profile.tsx
    symptom/
      index.tsx
      result.tsx
    facilities/
      [id].tsx
    medication/
      index.tsx
      result.tsx
    settings.tsx
```

Bottom tabs MVP:

- Home
- Map
- Chat
- Records
- Profile

Secondary stack screens:

- Symptom Analysis
- Symptom Result
- Facility Detail
- Medication Scan
- Pricing/Upgrade
- Patient Profile Setup

Role routing:

- `admin` -> show unsupported mobile screen with CTA "Use Web Admin" in MVP.
- `staff` -> show unsupported mobile screen with CTA "Use Web Staff Workspace" in MVP.
- default -> patient tabs.

## 6. API Mapping

Base URL from web docs:

- Development/prod backend currently points to `http://52.77.210.243:8080` in web documentation.
- Mobile should use `EXPO_PUBLIC_API_BASE_URL` instead of Vite env.

### Auth

| Mobile feature | Web service | Endpoint | Method | Auth |
|---|---|---:|---:|---|
| Login | `authApi.login` | `/api/authentication/login` | POST | No |
| Register | `authApi.register` | `/api/authentication/register` | POST | No |
| Staff register application | `registerStaffApplication` | `/api/authentication/register/staff` | POST | No |
| Google login | `authApi.googleLogin` | `/api/authentication/google` | POST | No |
| Refresh token | `authApi.refresh` | `/api/authentication/refresh` | POST | Yes |
| Logout | `authApi.logout` | `/api/authentication/logout` | POST | Yes |
| Forgot password | `authApi.forgotPassword` | `/api/authentication/forgot-password` | POST | No |
| Change password | `authApi.changePassword` | `/api/authentication/change-password` | POST | No |
| Current user | `authApi.me` | `/api/users/me` | GET | Yes |

### Patient Profile

| Mobile feature | Web service | Endpoint | Method | Auth |
|---|---|---:|---:|---|
| List profiles | `patientProfilesApi.list` | `/api/patient-profiles?PageNumber=&PageSize=` | GET | Yes |
| Get profile | `patientProfilesApi.get` | `/api/patient-profiles/{id}` | GET | Yes |
| Create profile | `patientProfilesApi.create` | `/api/patient-profiles` | POST | Yes |
| Update profile | `patientProfilesApi.update` | `/api/patient-profiles/{id}` | PUT | Yes |
| Delete profile | `patientProfilesApi.remove` | `/api/patient-profiles/{id}` | DELETE | Yes |
| Update account fields | `authApi.updateUser` | `/api/users/{userId}` | PUT | Yes |

### Triage / Chat

| Mobile feature | Web service | Endpoint | Method | Auth |
|---|---|---:|---:|---|
| Chatbot message | `webChatbotApi.message` | `/api/web-chatbot/message` | POST | Optional |
| Symptom message | `sendSymptomMessage` | `/api/web-chatbot/message` | POST | Yes |

Important mobile decision:

- Do not port web `ChatbotPage` direct Anthropic call to mobile. API keys must not ship inside the app bundle.
- Use backend chatbot endpoint for all AI chat.

### Facilities / Map / Doctors

| Mobile feature | Web service | Endpoint | Method | Auth |
|---|---|---:|---:|---|
| Facility list | `medicalFacilitiesApi.list` | `/api/medical-facilities?PageNumber=&PageSize=` | GET | No |
| Active facilities | `medicalFacilitiesApi.active` | `/api/medical-facilities/active` | GET | No |
| Facility detail | `medicalFacilitiesApi.get` | `/api/medical-facilities/{id}` | GET | No |
| Doctor list | `doctorsApi.list` | `/api/doctors?PageNumber=&PageSize=` | GET | No |
| Active doctors | `doctorsApi.active` | `/api/doctors/active` | GET | No |
| Doctor detail | `doctorsApi.get` | `/api/doctors/{id}` | GET | No |
| Departments | `medicalDepartmentsApi.list` | `/api/medical-departments` | GET | No |

### Subscription

| Mobile feature | Web service | Endpoint | Method | Auth |
|---|---|---:|---:|---|
| Plan list | `subscriptionPlansApi.list` | `/api/subscription-plans` | GET | No |
| Active plans | `subscriptionPlansApi.active` | `/api/subscription-plans/active` | GET | No |
| Plan detail | `subscriptionPlansApi.get` | `/api/subscription-plans/{id}` | GET | No |

### Admin/Staff APIs present in web but not MVP mobile

| Domain | Endpoints |
|---|---|
| Users | `/api/users`, `/api/users/{id}`, `/api/authentication/{userId}/approve-staff` |
| Departments management | POST/PUT/DELETE `/api/medical-departments` |
| Facilities management | POST/PUT/PATCH/DELETE `/api/medical-facilities` |
| Doctors management | POST/PUT/PATCH/DELETE `/api/doctors` |
| AI config management | `/api/ai-configs`, `/api/ai-configs/active`, `/api/ai-configs/by-task-type/{taskType}`, `/api/ai-configs/{id}/status` |

### APIs described by product flow but not fully implemented in web services

These should be treated as backend gaps for future mobile phases:

- Symptom analysis sessions
- Department recommendations
- Consultation sessions/questions
- Medical visits
- Feedback reviews
- Medical records/files/lab results
- Medication scans/user medications/drug analyses
- Treatment journeys/recovery plans/treatment logs
- Reminders/notifications
- Payment checkout

## 7. Mobile Folder Structure

Recommended structure for Expo + TypeScript:

```txt
SEP490_MB_MedicalAIAssistant/
  app/
    _layout.tsx
    (public)/
    (setup)/
    (patient)/
  src/
    api/
      client.ts
      endpoints.ts
      auth.ts
      users.ts
      patientProfiles.ts
      chatbot.ts
      departments.ts
      facilities.ts
      doctors.ts
      subscriptions.ts
    auth/
      AuthProvider.tsx
      authStorage.ts
      roleUtils.ts
      premium.ts
    components/
      ui/
      feedback/
      forms/
      medical/
      map/
    features/
      onboarding/
      auth/
      home/
      symptom/
      chat/
      map/
      profile/
      records/
      medication/
      pricing/
    hooks/
      useDebouncedValue.ts
      useLocationPermission.ts
      useCameraPermission.ts
    constants/
      theme.ts
      medicalCopy.ts
    types/
      api.ts
      auth.ts
      medical.ts
    utils/
      format.ts
      validation.ts
```

Key implementation notes:

- Store access token securely with `expo-secure-store` instead of browser `localStorage`.
- Use `EXPO_PUBLIC_API_BASE_URL`.
- Keep endpoint strings centralized like web `endpoints.js`.
- Keep services domain-oriented like web.
- Use React Query/TanStack Query if added later for caching and mutations.
- Use native permission flows for location, camera and image library.
- Never store API keys for external AI providers in mobile.

## 8. Data/Auth Rules to Preserve

- Decode role from auth payload and JWT claims, same logic as web `roles.js`.
- Admin aliases: `administrator`, `superadmin`.
- Staff aliases: `doctor`, `clinician`, `medicalstaff`.
- First login patient profile setup applies only to non-admin/non-staff.
- Premium access can come from `isPremium`, `isSubscribed`, `hasPremiumAccess`, active subscription status, premium plan name, admin/staff role.
- Always show medical disclaimer before/with AI output.
- Emergency warnings must not be hidden by subscription gates.
- User health data is sensitive; do not log payloads containing symptoms, lab results, medications or profile details.

## 9. Development Roadmap

### Phase 0 - Foundation
- Set up mobile API client, endpoint registry and auth storage.
- Build AuthProvider with login/logout/session restore.
- Implement role redirect and first-login routing.
- Define theme tokens based on web visual language but adapted to native mobile.
- Add shared UI primitives: Button, Field, Card, Screen, EmptyState, LoadingState, Toast.

### Phase 1 - Patient Core MVP
- Login, register, forgot/change password.
- Patient profile setup.
- Home specialty intake.
- Chatbot request through backend `/api/web-chatbot/message`.
- Symptom result UI with disclaimer and emergency banner.
- Facilities map/list using active facilities API.
- Facility detail with call/directions.
- Pricing screen and premium gate.

### Phase 2 - Profile and History
- Profile edit with `/api/users/{id}` and patient profile APIs.
- Persist symptom/chat history when backend exposes session APIs.
- Add saved clinic/visit draft once `MedicalVisit` API exists.
- Improve empty/error states and offline retry behavior.

### Phase 3 - Medical Records
- Records list/detail once backend APIs exist.
- File/image upload from device.
- Lab result display.
- AI analysis display with disclaimer.

### Phase 4 - Medication
- Camera/image picker scan flow.
- Medication recognition API integration when available.
- User medication list.
- Drug interaction analysis.
- Medication safety disclaimer.

### Phase 5 - Treatment Journey and Notifications
- Treatment journey list/detail.
- Recovery plan.
- Daily treatment log.
- Push/local reminders for medication, follow-up, daily logs.
- Notification center.

### Phase 6 - Payments and Advanced Account
- Native payment/checkout integration after backend payment contract is stable.
- Subscription management.
- Account deletion/change password hardening.

### Phase 7 - Optional Staff/Admin Mobile
- Staff lightweight review/department tools only if product requires it.
- Admin should remain web-first unless there is a clear mobile operations use case.

## 10. MVP Scope Recommendation

Build this first:

1. Auth/session restore.
2. Patient profile setup.
3. Home symptom intake.
4. AI chatbot via backend.
5. Symptom result.
6. Nearby facilities map/list/detail.
7. Profile summary.
8. Pricing/paywall.

Defer this until backend contracts are ready:

- Real symptom session persistence.
- Medical visits.
- Medical records upload/AI analysis.
- Medication OCR/interaction.
- Treatment journey.
- Push notifications.
- Native payment.
- Staff/Admin management.

