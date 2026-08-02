# Mobile Progress Log — MediMate AI (User scope)

Nguồn chuẩn (source of truth) cho API/Business Logic/Flow: repo Web
`SEP490_FE_MedicalAIAssistant`. Mỗi module dưới đây được đối chiếu trực
tiếp với code Web tương ứng trước khi build; các điểm khác biệt (nếu có)
được ghi rõ trong mục "Known Issues" của module đó.

---

## Module 1: Authentication

**Chức năng đã hoàn thành**
- Đăng nhập bằng email/mật khẩu.
- Đăng ký tài khoản (auto-login sau khi đăng ký thành công, giống Web).
- Quên mật khẩu (gửi email hướng dẫn).
- Đổi mật khẩu bằng email + mã xác thực (OTP) + mật khẩu mới.
- Đăng xuất có gọi API backend (best-effort) trước khi xoá session cục bộ.
- Điều hướng sau đăng nhập theo role (admin/doctor/staff/patient), bao gồm
  redirect sang màn hoàn thiện hồ sơ cho bệnh nhân đăng nhập lần đầu.
- Toast thông báo thành công cho đăng nhập/đăng ký/quên mật khẩu/đổi mật khẩu.

**API đã tích hợp** (`POST /api/authentication/*`)
- `POST /api/authentication/login`
- `POST /api/authentication/register`
- `POST /api/authentication/forgot-password`
- `POST /api/authentication/change-password`
- `POST /api/authentication/logout`
- Đã có sẵn, chưa gọi ở UI (giữ cho module sau): `GET /api/users/me`,
  `PUT /api/users/{userId}`, `POST /api/authentication/google`,
  `POST /api/authentication/refresh`.

**UI đã hoàn thành**
- `app/(public)/login.tsx` — thiết kế lại: hero card, password hint, link
  "Quên mật khẩu?", ghi chú Google Sign-In (tắt do chưa cấu hình).
- `app/(public)/register.tsx` — thêm date picker ngày sinh native
  (`@react-native-community/datetimepicker`) thay ô nhập text tự do.
- `app/(public)/forgot-password.tsx` — màn mới.
- `app/(public)/change-password.tsx` — màn mới.
- `app/(setup)/patient-profile.tsx` — placeholder tạm thời cho luồng
  redirect bệnh nhân lần đầu (xem Known Issues).
- Toast (`ToastProvider`/`ToastItem`) — enter/exit animation, haptic
  feedback theo tone (success/error/warning), tap-to-dismiss, auto-dismiss.

**Route**
- `/(public)/login`, `/(public)/register`, `/(public)/forgot-password`,
  `/(public)/change-password`, `/(setup)/patient-profile`.

**Hook**
- `useToast()` (`src/hooks/useToast.ts`) — hiển thị toast toàn cục.
- `useLogout()` (`src/hooks/useLogout.ts`) — gọi API logout best-effort,
  xoá session, điều hướng về login.

**Service**
- `authService` — bổ sung `normalizeAuthSession()` (port 1:1
  `normalizeAuthResponse` của Web: suy ra `firstLogin`/`isFirstLogin`/
  `isProfileCompleted`).
- `sessionStorage` — chuyển sang lưu hybrid: access/refresh token trong
  `expo-secure-store` (Keychain/Keystore), phần còn lại trong AsyncStorage.

**State**
- `AuthProvider` (giữ nguyên interface `useAuth()`), thêm `ToastProvider`
  và `SafeAreaProvider` vào `AppProviders`.

**Known Issues**
- Đăng nhập Google: chưa nối SDK native (`@react-native-google-signin`) vì
  chưa có OAuth client ID Android/iOS từ team; UI hiển thị đúng trạng thái
  "chưa cấu hình" giống cách Web tắt tính năng khi thiếu `VITE_GOOGLE_CLIENT_ID`.
  Cần team đăng ký OAuth client rồi bổ sung SDK + handler thực.
- `(setup)/patient-profile` chỉ là placeholder — form hoàn thiện hồ sơ đầy
  đủ (giống `PersonalPatientProfilePage`/`PatientProfileSetupModal` của Web)
  sẽ được xây ở Module 13 (Profile). Placeholder không tự đặt
  `isProfileCompleted = true`, chỉ cho phép người dùng tiếp tục vào app.
- Không thêm cơ chế tự động refresh token khi 401: xác nhận Web cũng không
  có interceptor tự refresh (chỉ gọi `authApi.refresh()` thủ công sau khi
  thanh toán) — Mobile bám đúng theo, không tự phát minh thêm.
- Kiểm thử runtime qua `expo start --web` trong sandbox gặp lỗi "Network
  Error" khi gọi API thật — đây là do CORS chặn origin `localhost:8081`
  trên backend, không phải lỗi code (CORS không áp dụng khi chạy native
  thật trên thiết bị/simulator). Xem "Hướng dẫn test" bên dưới.

**Bug đã sửa trên Mobile để khớp Web (không phải thay đổi business logic mới, mà là sửa lệch so với chuẩn)**
- `hasRole()`: bỏ nhánh đồng nghĩa sai `staff → doctor/clinician/medicalstaff`
  (Web không có); giữ đúng 2 nhánh đồng nghĩa của Web: `admin →
  administrator/superadmin`, `doctor → clinician`.
- `getPrimaryRoleForSession()`: dùng `hasRole(roles, "doctor")` thay vì so
  khớp chuỗi trực tiếp `roles.includes("doctor")` — trước đó bỏ sót
  synonym "clinician".
- `shouldSetupPatientProfile()`: bổ sung điều kiện `!isProfileCompleted`
  và đổi từ loại trừ `staff` sang loại trừ đúng `doctor` (khớp
  `src/utils/roles.js` của Web).
- `hasPremiumAccess()`: bỏ override `roles.includes("admin") ||
  roles.includes("staff")` — Web không có, tránh cấp nhầm quyền Premium
  cho tài khoản doctor/staff.
- Đăng ký (`register.tsx`): trước đây sau khi đăng ký thành công chỉ
  chuyển về màn Login; Web thực tế auto-login (lưu session ngay từ response
  register) và điều hướng thẳng vào app — đã sửa để khớp.
- Xoá hàm `getPostLoginRoute()` (dead code, không được gọi ở đâu, logic
  sai/route không tồn tại) — `roleRedirect.ts` là nguồn logic điều hướng
  duy nhất.
- Bỏ ràng buộc "mật khẩu tối thiểu 6 ký tự" tự đặt thêm ở Mobile (Web
  không enforce độ dài mật khẩu phía client, chỉ hiển thị hint).
- `unstable_settings.anchor` ở `app/_layout.tsx` trỏ vào `(tabs)` (nhóm
  boilerplate không dùng) — đã sửa trỏ về `(public)` đúng luồng thật.

**Todo**
- Nối Google Sign-In thật khi có OAuth client ID.
- Xây form hoàn thiện hồ sơ bệnh nhân đầy đủ ở Module 13.
- Cân nhắc dọn `(tabs)`, `modal.tsx`, top-level `components/` (boilerplate
  Expo chưa dùng) — nằm ngoài phạm vi Module 1, đề xuất dọn ở module dọn
  dẹp riêng để không lẫn vào PR tính năng.

**Hướng dẫn test trên Mobile**
1. `npm install` (đã cài `expo-secure-store`,
   `@react-native-community/datetimepicker`).
2. `npx expo start` → mở bằng Expo Go hoặc dev client trên thiết bị/simulator
   thật (không dùng `--web` để test API thật, vì trình duyệt sẽ chặn CORS).
3. Test đăng ký tài khoản mới → xác nhận tự động vào thẳng Dashboard
   (không quay lại Login).
4. Test đăng nhập sai mật khẩu → xác nhận banner lỗi hiển thị, không crash.
5. Test đăng nhập đúng → xác nhận toast "Đăng nhập thành công" + điều
   hướng đúng theo role.
6. Test "Quên mật khẩu" → "Đổi mật khẩu" với email + OTP thật từ backend.
7. Vào màn Role Placeholder (Patient/Doctor/Staff/Admin) → bấm "Đăng xuất"
   → xác nhận quay về Login và không thể back lại vào workspace.
8. Kill app, mở lại → xác nhận session được khôi phục từ SecureStore/
   AsyncStorage (không bị đăng xuất ngoài ý muốn) nếu token còn hạn.
