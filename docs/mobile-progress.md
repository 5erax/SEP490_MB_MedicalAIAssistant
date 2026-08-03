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

---

## Module 2: Dashboard

**Chức năng đã hoàn thành**
- Tư vấn chuyên khoa: nhập triệu chứng → AI tạo câu hỏi làm rõ → trả lời
  Yes/Không (hoặc nhiều lựa chọn) → gợi ý chuyên khoa + danh sách cơ sở y
  tế xếp hạng theo chuyên khoa/khoảng cách/đánh giá.
- Dùng vị trí thiết bị (tuỳ chọn) để tính khoảng cách tới cơ sở y tế.
- Nhắc hoàn thiện hồ sơ cho bệnh nhân đăng nhập lần đầu (dismiss theo phiên
  ứng dụng).
- Lịch sử gợi ý chuyên khoa (bottom sheet, pull-to-refresh, xem chi tiết
  từng phiên).
- Khôi phục tiến trình nhập liệu khi rời màn rồi quay lại (chưa mất dữ liệu
  đang nhập/câu trả lời) trong cùng phiên ứng dụng.

**API đã tích hợp**
- `POST /api/symptom-analysis/suggest-clinical-questions`
- `POST /api/symptom-analysis/submit-clinical-question-answers`
- `GET /api/symptom-analysis/my-sessions` (+ tự động gộp nhiều trang)
- `GET /api/symptom-analysis/{sessionId}`
- Đã có sẵn, chưa dùng ở UI (dành cho Module sau): `POST
  /api/symptom-analysis/submit-diagnosis` (dùng ở AI Consultation).

**UI đã hoàn thành**
- `app/(patient)/home.tsx` — thay placeholder bằng màn Dashboard thật.
- `src/components/dashboard/`: `IntakeForm`, `QuestionFlow`, `AnswerButtons`
  (Yes/Không + boolean-list), `ResultPanel`, `AnalysisHistorySheet`,
  `ProfileNudgeCard`, `SpecialtyIntakeScreen` (orchestrator).
- Stepper 3 bước (Mô tả/Làm rõ/Kết quả), skeleton loading khi AI đang tạo
  câu hỏi (`Skeleton`/`SkeletonGroup` — component UI mới, tái sử dụng được
  cho các module sau), progress bar câu hỏi, haptic feedback khi chọn đáp
  án, bottom sheet lịch sử có pull-to-refresh.

**Route:** `/(patient)/home` (giữ nguyên, chỉ thay nội dung).

**Hook**
- `useSymptomIntake()` (`src/hooks/useSymptomIntake.ts`) — port state
  machine 1:1 từ `useSymptomIntake.js` (Web).
- `useUserLocation()` (`src/hooks/useUserLocation.ts`) — tương đương
  `requestUserLocation()` của Web, dùng `expo-location` thay Geolocation
  API trình duyệt.

**Service**
- `symptomAnalysisService.ts` — port `symptomAnalysisApi` 1:1 (kể cả cache
  "clinical-map" phục vụ bàn giao sang Map, dùng AsyncStorage thay
  sessionStorage).
- `src/utils/clinicalQuestions.ts` — port nguyên vẹn phần logic phức tạp
  nhất của Web: suy luận Yes/Không vs multi-choice, dịch Anh→Việt câu hỏi
  lâm sàng, mã hoá/giải mã "boolean choice key".
- `src/utils/facilityRanking.ts` — port thuật toán xếp hạng cơ sở y tế
  (điểm theo chuyên khoa khớp, khoảng cách, đánh giá, trạng thái hoạt
  động...).

**State**
- State cục bộ trong `useSymptomIntake` + cache resumable ở module-level
  (tương đương cơ chế của Web, reset khi khởi động lại app thay vì đóng
  tab trình duyệt).

**Known Issues**
- **Khác biệt UX có chủ đích so với Web**: Web tự động điều hướng sang
  `/map` ngay sau khi trả lời xong (người dùng gần như không nhìn thấy
  panel kết quả). Mobile hiển thị panel kết quả trước, người dùng bấm rõ
  ràng "Mở bản đồ" mới điều hướng — tránh chuyển màn đột ngột, đúng chuẩn
  UX mobile. Dữ liệu/flow/đích đến (Map kèm `source/facilityId/
  departmentId/sessionId`) giữ nguyên như Web.
- Nút "Mở bản đồ" trỏ tới `/(patient)/map` — màn này thuộc Module 3 (Nearby
  Clinics/Map), sẽ được tạo ở bước tiếp theo ngay sau module này.
- Không port `sessionStorage` prefill triệu chứng từ landing page quick-
  prompt của Web vì Mobile hiện chưa có widget tương đương (không có
  landing chat trong phạm vi 14 module).
- Không gọi `trackUxEvent` (Web dùng cho analytics nội bộ) vì repo Mobile
  chưa có service analytics nào.
- Không tự động refresh token khi 401 — giữ nguyên hành vi Web (Web cũng
  không có).

**Hướng dẫn test trên Mobile**
1. Đăng nhập bằng tài khoản Patient thật.
2. Nhập triệu chứng (vd: "đau bụng âm ỉ sau ăn, buồn nôn nhẹ") → gửi → xác
   nhận skeleton loading rồi hiển thị câu hỏi làm rõ.
3. Trả lời hết câu hỏi (thử cả trường hợp câu hỏi dạng Yes/Không và dạng
   nhiều lựa chọn nếu backend trả về) → xác nhận nút "Xem gợi ý" chỉ bật
   khi trả lời đủ.
4. Xác nhận panel kết quả hiển thị đúng chuyên khoa + danh sách cơ sở xếp
   hạng; bấm "Dùng vị trí của tôi" → xác nhận quyền vị trí + khoảng cách
   cập nhật trong danh sách.
5. Bấm "Lịch sử" → xác nhận danh sách phiên tải được, kéo để làm mới, bấm
   vào 1 phiên xem chi tiết.
6. Rời màn Dashboard (chuyển tab khác) rồi quay lại giữa chừng luồng câu
   hỏi → xác nhận tiến trình không bị mất.
7. Test tài khoản patient đăng nhập lần đầu, chưa hoàn thiện hồ sơ → xác
   nhận thẻ nhắc hồ sơ hiển thị và có thể "Để sau"/"Cập nhật hồ sơ".

---

## Module 3: Nearby Clinics / Map

**Chức năng đã hoàn thành**
- Bản đồ + danh sách cơ sở y tế đang hoạt động, không yêu cầu đăng nhập
  (khớp Web: route `/map` là public).
- Tìm kiếm (debounce 400ms) + lọc theo loại cơ sở (Bệnh viện/Phòng khám/Nhà
  thuốc/Cấp cứu/Khác), hoàn toàn client-side như Web.
- Nhận bàn giao kết quả gợi ý từ Dashboard ("Mở bản đồ"): đọc `source=
  clinical&facilityId&departmentId&sessionId`, khôi phục kết quả từ cache
  (in-memory + AsyncStorage), xử lý đủ 4 trạng thái `locked/loading/ready/
  error` như Web.
- Chi tiết cơ sở (bottom sheet): thông tin đầy đủ, số lượng bác sĩ đang hoạt
  động (teaser), chỉ đường (mở Google Maps), gọi điện, chia sẻ.
- "Dùng vị trí của tôi" (expo-location) để tính khoảng cách hiển thị trong
  danh sách.
- Bottom tab bar mới cho khu vực Patient (Tư vấn/Bản đồ) — trước đây Map chỉ
  vào được qua nút "Mở bản đồ" của Dashboard.
- Pull-to-refresh trên danh sách cơ sở.

**API đã tích hợp**
- `GET /api/medical-facilities/active`
- `GET /api/facility-departments/active`
- `GET /api/medical-facilities/{id}` (chi tiết khi mở bottom sheet)
- `GET /api/doctors?facilityId=&isActive=true&...` (chỉ lấy số lượng, danh
  sách bác sĩ đầy đủ thuộc Module 6)

**UI đã hoàn thành**
- `app/(patient)/map.tsx` (không bọc `AuthGate` — khớp Web).
- `app/(patient)/_layout.tsx` chuyển từ `Stack` sang `Tabs` (Tư vấn/Bản đồ).
- `src/components/map/`: `MapScreen`, `FacilityListItem`, `FacilityFilters`,
  `FacilityDetailSheet`, `ClinicalSummaryCard`, `FacilityMapView.native.tsx`
  (bản đồ MapLibre thật) + `FacilityMapView.web.tsx` (stub cho môi trường
  không hỗ trợ native module).

**Route:** `/(patient)/map`.

**Hook**
- `useFacilities()` — fetch + normalize danh sách cơ sở, xử lý lỗi từng
  phần (Promise.allSettled) như Web.
- `useClinicalRecommendation()` — state machine 4 trạng thái cho luồng bàn
  giao từ Dashboard.
- `useDebouncedValue()` — hook debounce dùng chung, tái sử dụng được cho
  các ô tìm kiếm ở module sau.

**Service**
- `facilityService.ts` (`medicalFacilitiesApi`, `facilityDepartmentsApi`),
  `doctorService.ts` (`doctorManagementApi.list`, dùng chung cho Module 6).
- Đã xoá `medicalFacilitiesService`/`doctorsService` placeholder trùng lặp
  trong `domainServices.ts` (thay bằng service thật ở trên).

**State**
- `src/utils/facilityNormalize.ts` — port `normalizeFacility`,
  `normalizeFacilityType`, `TYPE_LABELS`, `mergeFacilityDetail`.
- `src/utils/clinicalFacilityMerge.ts` — port logic ghép danh sách cơ sở
  được gợi ý (giữ nguyên thứ tự gợi ý, không tính điểm lại) với danh sách
  cơ sở đang hoạt động.
- `src/utils/facilityRanking.ts` (Module 2) tổng quát hoá để dùng chung cho
  cả `ClinicalFacility` và `NormalizedFacility`.

**Known Issues**
- **Yêu cầu build native để kiểm thử bản đồ thật**: `@maplibre/maplibre-
  react-native` không chạy trên Expo Go lẫn bản xem trước web (đã xác nhận
  qua tài liệu + type definition của package) — cần `expo prebuild` +
  custom dev client hoặc EAS build để thấy bản đồ thật. Đã kiểm chứng toàn
  bộ phần còn lại (danh sách, lọc, chi tiết, tab bar, xử lý lỗi/rỗng) qua
  bản dựng web; component bản đồ chỉ được xác minh qua type-check nghiêm
  ngặt với type definition thật của thư viện (không chạy được trong sandbox
  này), không phải qua chạy thử trực tiếp — cần đội ngũ xác nhận lại trên
  thiết bị/dev client thật trước khi coi là hoàn toàn ổn định.
- Không port `MapConsultationAssistant` (chat AI nhúng trong bản đồ của
  Web) — thuộc phạm vi Module 4 (AI Consultation).
- Đánh giá cơ sở y tế (feedback reviews, CRUD đầy đủ có ảnh) chưa port ở
  module này — Web gộp chung vào trang Map nhưng nghiệp vụ thuộc Module 5
  (Medical Facility) theo đúng breakdown 14 module.
- Danh sách bác sĩ đầy đủ tại cơ sở chỉ hiển thị số lượng (teaser) — danh
  sách chi tiết/lọc theo khoa thuộc Module 6 (Doctor).
- Khách (chưa đăng nhập) hiện chưa có đường dẫn điều hướng tới `/map` vì
  route gốc `/` luôn yêu cầu đăng nhập (`AuthGate` không có children) —
  đây là quyết định kiến trúc điều hướng rộng hơn phạm vi module này, cần
  bàn riêng nếu muốn Mobile hỗ trợ duyệt Map như khách giống Web.
- `tsconfig.json` thêm `moduleSuffixes` để `tsc` hiểu quy ước
  `.native.tsx`/`.web.tsx` của Metro (trước đó `tsc` báo lỗi resolve module
  dù Metro build đúng).

**Hướng dẫn test trên Mobile**
1. Mở `/map` mà KHÔNG đăng nhập → xác nhận vẫn xem được danh sách/bản đồ
   (không bị redirect sang Login).
2. Từ Dashboard, phân tích triệu chứng xong bấm "Mở bản đồ" → xác nhận
   Map hiển thị đúng chuyên khoa + danh sách cơ sở đã gợi ý, đúng thứ tự.
3. Tìm kiếm theo tên/địa chỉ/chuyên khoa, đổi bộ lọc loại cơ sở → xác nhận
   danh sách cập nhật đúng.
4. Bấm vào 1 cơ sở → xác nhận bottom sheet hiện đủ thông tin, số bác sĩ,
   và 3 nút Chỉ đường/Gọi/Chia sẻ hoạt động.
5. Bấm "Dùng vị trí của tôi" → xác nhận khoảng cách xuất hiện trong danh
   sách.
6. Kéo để làm mới danh sách cơ sở.
7. **Bắt buộc test trên dev client/thiết bị thật** (không phải Expo Go)
   để xác nhận bản đồ MapLibre render đúng, marker bấm được, camera
   fly-to/fit-bounds hoạt động như mô tả — phần này chưa được chạy thử
   trực tiếp trong quá trình build.

---

## Module 4: AI Consultation

**Chức năng đã hoàn thành**
- Chat AI tự do (authenticated), gated Premium giống Web (`access:
  "premium"`).
- Trạng thái chào mừng với 4 gợi ý câu hỏi nhanh; gửi tin nhắn, hiệu ứng
  "đang soạn phản hồi"; fallback message khi API lỗi (không throw ra UI).
- Xóa hội thoại (native `Alert.alert` xác nhận — không dựng Dialog tuỳ
  chỉnh vì đây là ngữ cảnh phù hợp cho confirm dialog gốc hệ điều hành).
- Lối tắt sang Tư vấn chuyên khoa / Bản đồ / Kiểm tra thuốc (Module 11,
  route chưa tồn tại nên dùng `as never` tạm thời).
- Thêm tab "Chat AI" vào bottom tab bar Patient.

**API đã tích hợp**
- `POST /api/web-chatbot/message` (auth: true) — dùng chung endpoint với
  chatbot khách trên Web, khác nhau ở cờ auth.

**UI đã hoàn thành**
- `app/(patient)/chat.tsx` (bọc `PremiumGate`).
- `src/components/chat/`: `ChatScreen`, `ChatMessageBubble` (+
  `TypingBubble`), `WelcomePrompts`.
- `src/components/auth/PremiumGate.tsx` — gate Premium tái sử dụng được
  cho Module 11 (Kiểm tra thuốc) sau này.

**Route:** `/(patient)/chat`.

**Service:** dùng lại `webChatbotService.message(text, true)` đã có sẵn
trong `domainServices.ts` (không tạo service trùng lặp).

**State:** state cục bộ trong `ChatScreen` (danh sách tin nhắn không lưu
lại giữa các phiên — khớp hành vi Web: hội thoại chỉ tồn tại trên màn hình
hiện tại, không có API lưu lịch sử chat).

**Known Issues**
- **Không port `MapConsultationAssistant`**: Web nhúng một trợ lý AI theo
  ngữ cảnh cơ sở y tế + chuyên khoa (gọi
  `consultationSessionsApi.generateQuestions`) ngay trong trang bản đồ.
  Đây là widget phụ, không phải trang độc lập; quyết định phạm vi: Module
  4 tập trung vào Chat AI tự do (giá trị chính, dùng được ngay), còn tính
  năng tư vấn theo cơ sở cụ thể có thể bổ sung sau như một cải tiến của
  Module 3/4 nếu team xác nhận cần. Chưa gọi API
  `consultationSessionsApi.*` ở Mobile.
- `PremiumGate` hiện hiển thị thẻ nâng cấp nội bộ thay vì điều hướng sang
  `/pricing` như Web, vì Subscription (Module 8) chưa tồn tại trên Mobile.
- Nút "Kiểm tra thuốc" trong composer trỏ tới route chưa tồn tại (Module
  11) — dùng cast tạm `as never`, sẽ hoạt động khi Module 11 hoàn thành.
- Web lưu prefill tin nhắn qua `sessionStorage` (`medimate.chat.prefill`)
  khi điều hướng từ nơi khác vào Chat — Mobile chưa có nguồn nào ghi giá
  trị này (không có landing chat), nên bỏ qua tương tự cách xử lý ở
  Module 2.

**Hướng dẫn test trên Mobile**
1. Đăng nhập bằng tài khoản **không có gói Premium** → vào tab "Chat AI"
   → xác nhận thấy thẻ nâng cấp, không thấy khung chat.
2. Đăng nhập bằng tài khoản **có Premium** (hoặc set thủ công cờ
   `isPremium`/`planName` trong response backend để test) → xác nhận vào
   được khung chat.
3. Bấm 1 gợi ý nhanh → xác nhận tin nhắn gửi đi và có phản hồi (hoặc
   fallback message nếu API lỗi, không crash).
4. Gửi vài tin nhắn → xác nhận danh sách tự cuộn xuống cuối.
5. Bấm "Xóa hội thoại" → xác nhận hộp thoại xác nhận gốc hệ điều hành hiện
   ra, chỉ xoá khi bấm đúng nút xác nhận.
6. Bấm lối tắt "Tư vấn chuyên khoa"/"Tìm cơ sở y tế" → xác nhận điều hướng
   đúng màn.

---

## Module 5: Medical Facility

**Chức năng đã hoàn thành**
- Thêm tab "Đánh giá" vào bottom sheet chi tiết cơ sở y tế (Module 3):
  điểm trung bình, biểu đồ phân bố 1-5 sao, danh sách đánh giá công khai.
- Viết đánh giá mới (1-5 sao + nhận xét tối đa 1000 ký tự + tối đa 5 ảnh)
  — yêu cầu đăng nhập (điều hướng sang Login nếu chưa), tự phát hiện đã có
  đánh giá của mình để chuyển sang chế độ xem/sửa thay vì tạo trùng.
  Chỉnh sửa đánh giá của chính mình.
- Upload ảnh trực tiếp lên Cloudinary (không qua backend) bằng
  `expo-image-picker`, cùng preset unsigned Web đang dùng thật.

**API đã tích hợp**
- `GET /api/feedback-reviews/facility/{facilityId}` (public, không cần
  đăng nhập)
- `POST /api/feedback-reviews` (auth)
- `PUT /api/feedback-reviews/{id}` (auth)
- Cloudinary unsigned upload (`POST https://api.cloudinary.com/v1_1/{cloud}/image/upload`)

**UI đã hoàn thành**
- `src/components/reviews/`: `StarRatingInput`/`StarRatingDisplay`,
  `RatingDistribution`, `ReviewCard`, `ReviewForm`, `ReviewsSection`.
- Tích hợp vào `src/components/map/FacilityDetailSheet.tsx` (Module 3)
  qua tab bar Tổng quan/Đánh giá — không tạo màn hình/route riêng vì Web
  cũng gắn chặt đánh giá vào trang chi tiết cơ sở, không phải trang độc
  lập.

**Hook:** `useFacilityReviews(facilityId)` — fetch, submit (create/update),
quản lý state form + upload ảnh, port đúng logic merge lại danh sách sau
khi gửi đánh giá (tìm theo id trong danh sách mới tải, chèn đầu danh sách
nếu chưa thấy — xử lý độ trễ kiểm duyệt như Web).

**Service:** `feedbackReviewService.ts` (chỉ phần user-facing:
`byFacility`/`create`/`update` — `list`/`setStatus`/`remove` thuộc Admin,
không port), `cloudinaryUploadService.ts` (port từ Web, dùng RN
FormData `{uri, name, type}` thay vì browser `File`).

**State:** `src/utils/reviewHelpers.ts` — port nguyên vẹn toàn bộ logic
xác định chủ sở hữu đánh giá (`isReviewByCurrentUser`), format tác giả/
ngày/ảnh, và đặc biệt `getReviewMessageText` (dò chuỗi tiếng Anh backend
trả về để map sang thông báo tiếng Việt — logic dễ vỡ nhưng giữ nguyên
để khớp hành vi thật của backend, không tự "dọn dẹp" khác Web).

**Known Issues**
- Cấu hình Cloudinary (`cloudName`/`uploadPreset`/`folder`) đặt giá trị
  mặc định trùng với `.env.production` thật của Web (`dnfcv21cy`/
  `medimate_unsigned`/`medical-facilities`) vì đây là unsigned preset —
  thiết kế để lộ phía client, không phải bí mật; nếu không đặt đúng giá
  trị thật thì tính năng upload ảnh sẽ không hoạt động được. Có thể ghi
  đè qua `EXPO_PUBLIC_CLOUDINARY_*` nếu team đổi cấu hình sau này.
- Chưa kiểm thử được luồng gửi đánh giá thật (CORS chặn API thật trong
  sandbox trình duyệt) — cần test trên thiết bị thật.
- Danh sách bác sĩ tại cơ sở vẫn chỉ là teaser số lượng (Module 6).

**Hướng dẫn test trên Mobile**
1. Vào `/map`, chọn 1 cơ sở, mở tab "Đánh giá" → xác nhận điểm trung bình
   + biểu đồ phân bố + danh sách hiển thị đúng.
2. Chưa đăng nhập → xác nhận thấy CTA "Đăng nhập", không thấy form viết
   đánh giá.
3. Đăng nhập → viết đánh giá: chọn sao, nhập nhận xét, thêm 1-2 ảnh từ
   thư viện ảnh → gửi → xác nhận đánh giá xuất hiện ngay trong danh sách,
   đúng nội dung/ảnh.
4. Gửi lại đánh giá lần 2 cho cùng cơ sở → xác nhận hệ thống chuyển sang
   chế độ "đánh giá của bạn" + nút "Chỉnh sửa" thay vì tạo đánh giá mới.
5. Bấm "Chỉnh sửa đánh giá" → đổi sao/nhận xét → lưu → xác nhận cập nhật
   đúng, không tạo bản ghi trùng.
6. Thử thêm ảnh thứ 6 → xác nhận bị chặn với thông báo "tối đa 5 ảnh".

---

## Module 6: Doctor

**Chức năng đã hoàn thành**
- Tab "Bác sĩ" thật trong bottom sheet chi tiết cơ sở y tế (thay teaser số
  lượng ở Module 3 bằng danh sách đầy đủ).
- Chi tiết bác sĩ (bottom sheet riêng): ảnh, học hàm/học vị, chuyên khoa,
  vai trò (Bác sĩ/Phó khoa/Trưởng khoa/Chuyên gia đầu ngành/Cố vấn chuyên
  môn), số năm kinh nghiệm.
- Nút "Đặt lịch" hiển thị nhưng vô hiệu hoá — khớp đúng trạng thái thật
  của Web ("Chưa hỗ trợ đặt lịch"), không tự thêm chức năng Web chưa có.

**API đã tích hợp:** `GET /api/doctors?facilityId=&isActive=true&PageNumber=&PageSize=`
(đã gọi từ Module 3, giờ lưu đầy đủ mảng bác sĩ thay vì chỉ đếm số lượng).

**UI đã hoàn thành**
- `src/components/doctor/{DoctorListItem,DoctorDetailSheet,index}.tsx`.
- Cập nhật `src/components/map/FacilityDetailSheet.tsx`: tab bar 3 mục
  (Tổng quan/Bác sĩ/Đánh giá), nút "Xem danh sách bác sĩ" ở tab Tổng quan
  giờ chuyển tab thay vì hiện toast tạm.

**State:** `src/utils/doctorHelpers.ts` — port `getDoctorImageUrl`,
`getDoctorName`, `getDoctorSpecialty`, `getDoctorRoleLabel` nguyên vẹn từ
Web.

**Known Issues**
- Web không có trang duyệt bác sĩ độc lập ngoài ngữ cảnh 1 cơ sở y tế cụ
  thể — Mobile giữ đúng kiến trúc này (không tạo route `/doctors` riêng).
- Đặt lịch khám: chưa có API/tính năng thật ở cả Web lẫn Mobile — nút chỉ
  mang tính hiển thị trạng thái "chưa hỗ trợ", không phải lỗi thiếu sót.

**Hướng dẫn test trên Mobile**
1. Vào `/map`, chọn 1 cơ sở, mở tab "Bác sĩ" → xác nhận danh sách bác sĩ
   đang hoạt động hiển thị đúng (ảnh/tên/học hàm/chuyên khoa/kinh nghiệm).
2. Bấm vào 1 bác sĩ → xác nhận bottom sheet chi tiết mở đúng thông tin,
   nút "Chưa hỗ trợ đặt lịch" hiển thị nhưng không bấm được.
3. Từ tab "Tổng quan", bấm "Xem danh sách bác sĩ" → xác nhận chuyển sang
   tab "Bác sĩ" đúng (không còn toast tạm).
4. Cơ sở không có bác sĩ nào → xác nhận empty state "Hiện chưa có bác sĩ
   nào được công khai cho cơ sở này."

---

## Module 7: Appointment

**Ghi chú quan trọng trước khi đọc**: Đã xác minh kỹ (đối chiếu Swagger
backend đầu phiên làm việc + toàn bộ code Web) rằng **Web hiện không có
bất kỳ API, trang, hay luồng đặt lịch khám nào**. Backend không có domain
"Appointment" nào trong OpenAPI. Web chỉ có một nút "Đặt lịch" bị vô hiệu
hoá vĩnh viễn trong màn chi tiết bác sĩ với nhãn "Chưa hỗ trợ đặt lịch".
Theo đúng quy tắc "bám sát Web, không tự phát minh Business Logic mới",
Module 7 KHÔNG xây dựng chức năng đặt lịch giả. Phạm vi thực tế của module
này là làm rõ và làm cho trạng thái "chưa khả dụng" đó hữu ích hơn trên
thiết bị di động (không chỉ là một nút mờ bất động).

**Chức năng đã hoàn thành**
- Nút "Đặt lịch khám" trong màn chi tiết bác sĩ (Module 6) giờ có thể bấm
  được (trước đây chỉ là nút disabled tĩnh) → mở bottom sheet giải thích
  rõ tính năng chưa khả dụng, kèm 2 lối tắt thay thế: gọi trực tiếp cơ sở
  y tế (nếu có số điện thoại) hoặc mở Chat AI để được tư vấn thêm.

**UI đã hoàn thành**
- `src/components/appointment/AppointmentUnavailableSheet.tsx` — component
  tái sử dụng được, sẵn sàng cho bất kỳ điểm chạm "đặt lịch" nào khác nếu
  team thêm sau này (vd. từ trang cơ sở y tế).
- Cập nhật `src/components/doctor/DoctorDetailSheet.tsx`: nút booking đổi
  từ disabled sang tappable, mở sheet thay vì im lặng.

**Known Issues**
- Đây không phải một tính năng "thiếu sót cần bổ sung sau" — nó phản ánh
  đúng thực trạng sản phẩm hiện tại của cả Web lẫn Mobile. Nếu backend bổ
  sung API đặt lịch trong tương lai, cần một module riêng để port đúng
  luồng thật lúc đó.

**Hướng dẫn test trên Mobile**
1. Mở chi tiết 1 bác sĩ bất kỳ → bấm "Đặt lịch khám" → xác nhận bottom
   sheet giải thích hiện ra (không phải nút mờ vô tri).
2. Nếu cơ sở có số điện thoại → bấm "Gọi cơ sở y tế" → xác nhận mở ứng
   dụng gọi điện đúng số.
3. Bấm "Trò chuyện với AI" → xác nhận điều hướng sang tab Chat AI (hoặc
   thẻ nâng cấp Premium nếu tài khoản chưa có gói).

---

## Hotfix (ngoài thứ tự module): sai cổng backend gây "Network Error"

Trong lúc chuẩn bị Module 8, người dùng báo test Login/Register bị
"Network Error". Đã xác minh bằng `curl` trực tiếp:
- `http://52.77.210.243:8080` (giá trị mặc định cũ trong `env.ts`) — **timeout, không phản hồi**.
- `http://52.77.210.243` (không cổng, đúng như `.env.development`/
  `.env.production`/`.env.example` thật của Web) — **phản hồi đúng**
  (`GET /swagger/v1/swagger.json` → 200, `POST /api/authentication/login`
  với sai mật khẩu → 401).

Đây là lỗi do tôi cấu hình sai cổng mặc định từ Module 1 (dùng nhầm giá
trị `:8080` từ một ghi chú cũ trong tài liệu Web thay vì đối chiếu đúng
file `.env` thật). Đã sửa:
- `src/config/env.ts`, `.env.example`: đổi về `http://52.77.210.243`.
- Thêm `expo-build-properties` (`android.usesCleartextTraffic: true`) và
  ngoại lệ ATS trên iOS (`NSAllowsArbitraryLoads: true`) — vì backend chỉ
  chạy HTTP, một bản build native tuỳ chỉnh (EAS build/`expo prebuild`,
  khác với Expo Go) sẽ chặn cleartext theo mặc định trên Android/iOS hiện
  đại dù URL đã đúng. Cần thắt chặt lại khi backend có HTTPS.

**Giới hạn quan trọng cần biết khi test**: Nếu test qua **trình duyệt web**
(`expo start --web` mở bằng browser), vẫn sẽ luôn thấy "Network Error" —
đã xác minh bằng cách gọi `fetch()` trực tiếp trong console: điều hướng
cả trang tới backend thành công, nhưng `fetch()` từ trong trang bị chặn
bởi chính sách CORS của backend (không cho phép origin `localhost:8081`).
Đây **không phải lỗi code** và không ảnh hưởng khi test trên native thật
(Expo Go, thiết bị thật, hoặc simulator) vì CORS chỉ áp dụng cho trình
duyệt. **Khuyến nghị: luôn test trên Expo Go/thiết bị thật, không dùng
`expo start --web` để kiểm tra các màn hình cần gọi API.**

PR: [#8](https://github.com/5erax/SEP490_MB_MedicalAIAssistant/pull/8) (đã squash-merge vào `main`).

---

## Module 8: Subscription

**Chức năng đã hoàn thành**
- Trang Bảng giá (`/pricing`, public — khớp Web): so sánh gói Miễn phí vs
  MediMate Plus, chuyển đổi chu kỳ Theo tháng/Theo năm (chỉ hiện chu kỳ
  backend thực sự cung cấp), quyền lợi lấy từ `featureLimitJson`.
- Gói hiện tại của tài khoản (trạng thái, ngày hết hạn, gia hạn tự động),
  hủy gia hạn (xác nhận qua Alert native).
- Thanh toán qua PayOS: tạo link thanh toán, mở trình duyệt trong ứng dụng
  (`expo-web-browser`), polling trạng thái thanh toán sau khi quay lại
  (tối đa 100 lần / 3 giây, khớp Web), tự làm mới quyền Premium khi thành
  công.
- FAQ đăng ký gói (accordion).

**API đã tích hợp**
- `GET /api/subscription-plans/active`
- `GET /api/user-subscriptions/me`
- `POST /api/user-subscriptions/checkout`
- `POST /api/user-subscriptions/{id}/cancel`
- `GET /api/payments/me/{id}` (dùng để polling — service dùng chung với
  Module 9)

**UI đã hoàn thành**
- `app/(public)/pricing.tsx` (không bọc AuthGate — khớp Web).
- `src/components/subscription/{PlanCard,CurrentSubscriptionCard,SubscriptionScreen,index}.tsx`.
- `PremiumGate` (Module 4) giờ điều hướng thật sang `/pricing` thay vì chỉ
  hiện toast tạm.

**Hook:** `useSubscription()` — port toàn bộ logic `PricingPage.jsx`: tải
gói/gói hiện tại, tạo thanh toán + polling, hủy gia hạn.

**Service:** `subscriptionService.ts` (`subscriptionPlansApi.active`,
`userSubscriptionsApi.checkout/me/cancel`, `paymentsApi.getMyPayment(s)/
payOsReturn/payOsCancel/payOsStatus` — phần payOs* và getMyPayments dành
cho Module 9). Đã xoá `subscriptionPlansService` placeholder trùng lặp
trong `domainServices.ts`.

**State:** `src/utils/subscriptionPlanPresentation.ts` — port nguyên vẹn
`getPlanDisplayName`, `getPlanBenefits`, `getPlanCycle`, `getDurationLabel`,
`formatPrice`, `isActiveSubscription`, `isSuccessfulPayment`,
`isTerminalPayment`.

**Known Issues**
- **Khác biệt kỹ thuật có chủ đích với Web**: Web mở PayOS trong tab/
  popup trình duyệt mới và polling nền trong lúc tab đó mở. Mobile dùng
  `expo-web-browser` (trình duyệt trong ứng dụng, tương đương popup gần
  nhất trên native) và bắt đầu polling ngay sau khi mở — vì không có tín
  hiệu kiểu "postMessage" báo về từ tab thanh toán trên cả hai nền tảng,
  polling vẫn là cơ chế đáng tin cậy chính trên cả Web lẫn Mobile.
- Chưa test được luồng thanh toán PayOS thật đầu-cuối (cần thiết bị thật
  + tài khoản thật + hoàn tất thanh toán thật).
- Lịch sử giao dịch đầy đủ (danh sách nhiều payment) và màn hình
  `/payment/return`, `/payment/cancel` thuộc Module 9.

**Hướng dẫn test trên Mobile**
1. Vào `/pricing` mà KHÔNG đăng nhập → xác nhận vẫn xem được bảng giá,
   nút "Thanh toán qua PayOS" đổi thành "Đăng nhập để nâng cấp".
2. Đăng nhập tài khoản chưa có gói → đổi chu kỳ Theo tháng/Theo năm (nếu
   backend có cả 2) → bật "Tự động gia hạn" → bấm nâng cấp → xác nhận mở
   trình duyệt trong ứng dụng tới trang PayOS.
3. Hoàn tất (hoặc hủy) thanh toán trên PayOS, quay lại ứng dụng → xác
   nhận trạng thái tự cập nhật thành công/lỗi mà không cần thao tác thêm.
4. Tài khoản đã có gói + bật gia hạn tự động → bấm "Hủy gia hạn" → xác
   nhận hộp thoại xác nhận + gói vẫn hiệu lực đến ngày kết thúc sau khi
   hủy.
5. Vào Chat AI với tài khoản chưa Premium → bấm "Xem gói dịch vụ" → xác
   nhận điều hướng đúng sang `/pricing` (không còn toast tạm).

---

## Module 9: Payment

**Chức năng đã hoàn thành**
- Lịch sử thanh toán: danh sách phân trang (10/trang), trạng thái
  (Đang chờ/Đã thanh toán/Đã hủy/Thất bại), pull-to-refresh.
- Chi tiết giao dịch (bottom sheet): mã thanh toán, gói, trạng thái, số
  tiền, cổng thanh toán, mã giao dịch, ngày tạo/thanh toán/cập nhật.
- Lối vào từ thẻ "Gói của bạn" ở `/pricing` (Module 8).

**API đã tích hợp**
- `GET /api/payments/me?PageNumber=&PageSize=`
- `GET /api/payments/me/{id}`

**UI đã hoàn thành**
- `app/(patient)/payment-history.tsx` (bọc `AuthGate`).
- `src/components/payment/{PaymentHistoryScreen,PaymentDetailSheet,PaymentStatusBadge,index}.tsx`.

**State:** `src/utils/paymentPresentation.ts` — port nguyên vẹn
`formatMoney`, `formatDateTime`, `getPaymentStatus`,
`getHistoryErrorMessage`, `getDetailErrorMessage`,
`normalizePaymentPage` từ `PaymentHistoryPanel.jsx`.

**Known Issues**
- **Không port `/payment/return` và `/payment/cancel` (PaymentResultPage.jsx)**:
  hai trang này trên Web tồn tại để xử lý redirect callback từ PayOS về
  đúng domain Web. Trên Mobile, PayOS không thể redirect thẳng vào app
  bằng deep link trừ khi backend được cấu hình lại để trỏ về custom
  scheme của app (`sep490mbmedicalaiassistant://...`) — việc này nằm
  ngoài khả năng chỉnh sửa từ phía Mobile. Toàn bộ luồng phát hiện
  thành công/hủy/lỗi sau thanh toán đã được xử lý đầy đủ bằng polling
  ngay trong Module 8 (`useSubscription`), nên không bị thiếu chức năng
  — chỉ khác cơ chế kỹ thuật so với Web.
- `subscriptionUsageApi` (hiển thị hạn mức còn lại sau thanh toán thành
  công trên `PaymentResultPage`) chưa port vì phụ thuộc trang đã bỏ qua
  ở trên; có thể bổ sung riêng nếu cần hiển thị hạn mức ở nơi khác.
- `PaymentHistoryScreen` hiện là route độc lập (`/payment-history`); Web
  đặt nó làm 1 tab trong trang Hồ sơ cá nhân. Sẽ liên kết/tích hợp lại
  đúng vị trí khi Module 13 (Profile) hoàn thành, theo đúng mẫu đã làm ở
  Module 6/7 (xây trước dưới dạng độc lập, gắn vào đúng chỗ khi module
  chủ quản lý ra đời).

**Hướng dẫn test trên Mobile**
1. Đăng nhập, vào `/pricing` → bấm "Lịch sử giao dịch" ở thẻ "Gói của
   bạn" → xác nhận danh sách hiển thị đúng (hoặc empty state nếu chưa có
   giao dịch nào).
2. Bấm vào 1 giao dịch → xác nhận bottom sheet chi tiết hiện đúng thông
   tin.
3. Nếu có nhiều hơn 10 giao dịch → xác nhận nút chuyển trang hoạt động.
4. Kéo để làm mới danh sách.

---

## Hotfix: Button/Badge lồng View trong Text (crash tiềm ẩn trên native)

**Vấn đề phát hiện**
- React Native chỉ cho phép `<Text>` chứa `<Text>` con trên iOS/Android
  thật, KHÔNG cho phép `<Text>` chứa `<View>` con (ví dụ hàng icon+nhãn).
  `Button` và `Badge` trước đó luôn bọc `children` trong `<AppText>`
  (→ `<Text>`) bất kể loại children.
- react-native-web bỏ qua giới hạn này và hiển thị đúng trên trình
  duyệt, nên toàn bộ kiểm thử bằng `expo start --web` từ Module 1 đến
  Module 9 không phát hiện ra — lỗi này chỉ lộ ra trên thiết bị/app
  native thật.
- Grep toàn bộ codebase tìm thấy khoảng 15+ file bị ảnh hưởng (mọi nơi
  gọi `<Button>`/`<Badge>` với children là `<View>` chứa icon+nhãn),
  trải khắp gần như mọi module đã build.

**Cách sửa**
- Sửa gốc tại `src/components/ui/Button.tsx` và
  `src/components/ui/Badge.tsx`: chỉ bọc `children` trong `<AppText>`
  khi `typeof children === "string" || typeof children === "number"`;
  các children khác (ví dụ `<View>` hàng icon+nhãn) được render trực
  tiếp, không bọc `<Text>`.
- Sửa 1 lần ở component dùng chung là đủ khắc phục toàn bộ ~15+ điểm gọi
  bị ảnh hưởng, không cần sửa từng file.

**Kiểm tra**
- `npx tsc --noEmit`, `npx expo lint`, `npx expo export --platform web`
  đều sạch sau khi sửa.
- Không thể tái hiện lỗi gốc (crash native) trong môi trường kiểm thử
  bằng trình duyệt — khuyến nghị kiểm tra thêm trên thiết bị thật/Expo
  Go để xác nhận cuối cùng.

**PR:** [#11](https://github.com/5erax/SEP490_MB_MedicalAIAssistant/pull/11)

---

## Module 10: Recovery Plan

**Chức năng đã hoàn thành**
- Trang tĩnh thông báo "Kế hoạch phục hồi chưa được mở" — khớp 1:1 hành
  vi thật của Web (`RecoveryPlanPage.jsx` không gọi API nào, dù backend
  có sẵn endpoint `RecoveryPlanRequests`/`DoctorRecoveryPlanRequests`).
- Thẻ hero (badge "Chưa khả dụng", tiêu đề, mô tả, 2 nút hành động sang
  Trang chủ/Bản đồ).
- Thẻ "Bạn có thể làm ngay" (3 bước đánh số).
- Thẻ "Những thông tin nên chuẩn bị" (3 mục có icon).
- Thẻ ghi chú chăm sóc (nền tối) với nút "Xem cơ sở y tế".

**API đã tích hợp:** Không có — khớp đúng hiện trạng của Web (trang
tĩnh, chưa có tính năng thật).

**UI đã hoàn thành**
- `app/(patient)/recovery-plan.tsx` (bọc `AuthGate`, khớp `access: "auth"`
  trên Web).
- `src/components/recovery/{RecoveryPlanScreen,index}.tsx` — thiết kế
  lại theo phong cách MediMate (hero card tối, danh sách bước, thẻ CTA),
  không sao chép UI Web.

**Route:** `ROUTES.PATIENT.RECOVERY_PLAN` = `/(patient)/recovery-plan`
(`src/navigation/routes.ts`).

**Hook / Service / State:** Không cần — trang tĩnh, không có logic
nghiệp vụ hay gọi API.

**Known Issues**
- Đây là trang đặt chỗ (placeholder) trên cả Web lẫn Mobile; không có
  liên kết menu điều hướng tới trang này trên Web (chỉ truy cập được
  qua URL trực tiếp) — Mobile giữ nguyên hiện trạng này, không tự thêm
  liên kết menu.
- Nếu Web triển khai tính năng Kế hoạch phục hồi thật trong tương lai,
  module này trên Mobile cần được xây dựng lại theo đúng API/luồng mới.

**Hướng dẫn test trên Mobile**
1. Vào `/(patient)/recovery-plan` khi CHƯA đăng nhập → xác nhận
   `AuthGate` chuyển hướng sang màn Đăng nhập.
2. Đăng nhập rồi vào lại → xác nhận hiển thị đúng nội dung tĩnh: thẻ
   hero, danh sách bước, thẻ chuẩn bị, thẻ ghi chú chăm sóc.
3. Bấm "Phân tích triệu chứng" → điều hướng đúng sang Trang chủ.
4. Bấm "Tìm cơ sở y tế" hoặc "Xem cơ sở y tế" → điều hướng đúng sang
   Bản đồ.

**Kết quả build:** `tsc --noEmit` sạch, `expo lint` sạch, `expo export
--platform web` xuất bundle thành công (route `/(patient)/recovery-plan`
có mặt).

**PR:** [#12](https://github.com/5erax/SEP490_MB_MedicalAIAssistant/pull/12)

---

## Module 11: Medication

**Chức năng đã hoàn thành**

*`/my-medications` — "Thuốc & lịch nhắc" (CRUD thật, `access: "auth"`)*
- Danh sách thuốc đang theo dõi, pull-to-refresh, empty/error state.
- Thêm/sửa/xoá thuốc (bottom sheet form + xác nhận xoá bằng Alert).
- Đặt ngày bắt đầu/kết thúc (date picker), bật/tắt nhắc nhở, thêm/xoá
  nhiều giờ nhắc (time picker, hiển thị dạng chip, tự sắp xếp tăng dần).
- Toast báo thành công cho thêm/sửa/xoá.

*`/medication` — "Kiểm tra thuốc" (bản xem trước tại chỗ, `access: "premium"`)*
- Chọn ảnh từ thư viện hoặc chụp ảnh trực tiếp để xem trước tại chỗ.
- Nút "Kiểm tra trạng thái nhận diện" — khớp đúng hành vi Web: có độ trễ
  giả rồi luôn hiện thông báo cố định "Tính năng đang được hoàn thiện",
  không phân tích hay lưu ảnh (không có backend nhận diện thật trên Web
  để port).
- Lối vào: nút camera trong Chat AI (đã nối sẵn từ Module 4).

**API đã tích hợp**
- `GET /api/user-medications`
- `POST /api/user-medications`
- `PUT /api/user-medications/{id}`
- `DELETE /api/user-medications/{id}`
- `/medication`: không có (bản xem trước tại chỗ, không gọi API — khớp
  đúng Web).

**UI đã hoàn thành**
- `app/(patient)/my-medications.tsx` (bọc `AuthGate`).
- `app/(patient)/medication.tsx` (bọc `PremiumGate`, tái dùng từ Module 4).
- `src/components/medication/{UserMedicationsScreen,MedicationCard,
  MedicationFormSheet,MedicationScanScreen,index}.tsx`.

**Route:** `ROUTES.PATIENT.MY_MEDICATIONS` = `/(patient)/my-medications`;
`ROUTES.PATIENT.MEDICATION` = `/(patient)/medication` (đã có từ trước,
nay có màn hình thật). Đã xoá hằng số `MEDICATION_RESULT` không dùng
(Web không có trang kết quả riêng).

**Hook:** `useUserMedications()` — port toàn bộ state/handler từ
`UserMedicationsPage.jsx` (load, mở form thêm/sửa, thêm/xoá giờ nhắc,
submit, xoá).

**Service:** `userMedicationService.ts` (`userMedicationsApi.list/create/
update/remove`). Không port `get(id)` và `replaceReminders` vì UI trên
Web không gọi (giờ nhắc được gửi cùng payload tạo/sửa).

**State:** `src/utils/medicationValidation.ts` — port nguyên vẹn
`validateForm`, `buildPayload`, `toFormState`, `formatDateRange`,
`getErrorMessage`, các hằng số giới hạn (`MAX_REMINDER_TIMES=12`,
`MAX_MEDICINE_NAME_LENGTH=256`, `MAX_DOSAGE_LENGTH=1000`) và nội dung
cảnh báo (disclaimer) từ `UserMedicationsPage.jsx` (Web không có file
`medicationValidation.js` riêng — toàn bộ logic vốn nằm inline trong
trang).

**Known Issues**
- Web đặt lối vào `/my-medications` trong menu tài khoản (account
  dropdown) — thành phần này thuộc Module 13/14 (Profile/Settings) trên
  Mobile, chưa tồn tại. Theo đúng mẫu đã dùng ở Module 9
  (`PaymentHistoryScreen`), màn hình được xây trước dưới dạng route độc
  lập; sẽ gắn lối vào đúng chỗ khi Module 13/14 hoàn thành.
  `/medication` đã có lối vào thật từ nút camera trong Chat AI (Module 4),
  khớp đúng Web.
- Mobile bổ sung chụp ảnh trực tiếp bằng camera (`expo-image-picker`
  `launchCameraAsync`) bên cạnh chọn từ thư viện — Web chỉ hỗ trợ
  tải lên/kéo-thả (kèm thuộc tính `capture` ẩn trên input file). Đây là
  khác biệt UX chủ đích cho thiết bị di động, không đổi hành vi cốt lõi
  (vẫn chỉ xem trước tại chỗ, không phân tích).
- Chưa test được luồng CRUD thật + camera trên thiết bị/tài khoản thật
  (cần thiết bị thật, xem Hướng dẫn test).

**Hướng dẫn test trên Mobile**
1. Vào `/(patient)/my-medications` khi chưa đăng nhập → xác nhận
   `AuthGate` chuyển hướng sang Đăng nhập.
2. Đăng nhập → bấm nút "+" (FAB) → nhập tên thuốc, hướng dẫn dùng, chọn
   ngày bắt đầu/kết thúc → lưu → xác nhận thuốc mới xuất hiện trong danh
   sách + toast thành công.
3. Bật "Nhắc nhở" mà chưa chọn ngày/giờ nhắc → xác nhận báo lỗi đúng như
   mô tả (bắt buộc ngày bắt đầu/kết thúc/ít nhất 1 giờ nhắc).
4. Thêm nhiều giờ nhắc trùng nhau → xác nhận báo lỗi "Không được trùng
   giờ nhắc"; thêm quá 12 giờ → xác nhận báo lỗi giới hạn.
5. Sửa một thuốc đã có → xác nhận form điền sẵn đúng dữ liệu cũ.
6. Xoá một thuốc → xác nhận hộp thoại xác nhận + danh sách cập nhật sau
   khi xoá.
7. Kéo để làm mới danh sách.
8. Vào `/(patient)/medication` với tài khoản chưa Premium → xác nhận
   chuyển hướng sang `/pricing` (`PremiumGate`); với tài khoản Premium →
   chọn ảnh từ thư viện hoặc chụp ảnh → bấm "Kiểm tra trạng thái nhận
   diện" → xác nhận hiện đúng thông báo "đang hoàn thiện" sau độ trễ
   ngắn.

**Kết quả build:** `tsc --noEmit` sạch, `expo lint` sạch, `expo export
--platform web` xuất bundle thành công (`/(patient)/my-medications` và
`/(patient)/medication` đều có mặt).

**PR:** [#14](https://github.com/5erax/SEP490_MB_MedicalAIAssistant/pull/14)
