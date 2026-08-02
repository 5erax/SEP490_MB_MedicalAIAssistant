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
