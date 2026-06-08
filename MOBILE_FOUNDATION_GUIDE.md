# MOBILE_FOUNDATION_GUIDE

## 1. Foundation Scope

Foundation này thiết lập lớp nền cho Mobile App React Native Expo, bám theo tài liệu `MOBILE_ARCHITECTURE.md`, `MOBILE_WEB_MAPPING.md`, `DESIGN_SYSTEM_MAPPING.md` và giữ Expo Router làm navigation chính.

Phạm vi đã làm:

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Axios API Client | Hoàn thành | Dùng chung base URL Backend với Web |
| Environment Configuration | Hoàn thành | Dùng `EXPO_PUBLIC_API_BASE_URL` |
| Endpoint Registry | Hoàn thành | Gom endpoint vào `src/api/endpoints.ts` |
| Auth Context | Hoàn thành | Quản lý session, role, trạng thái restore |
| AsyncStorage Session | Hoàn thành | Lưu, đọc, cập nhật, xóa session |
| Theme Provider | Hoàn thành | Token MediMate AI dùng lại cho RN |
| Shared UI Components | Hoàn thành | Button, Card, TextField, Screen, Badge, message states |
| Global Types | Hoàn thành | API, Auth, User |
| Utility Functions | Hoàn thành | JWT, roles, premium, pagination, format, errors |

Chưa implement các workflow nghiệp vụ như Login, Register, Home, Symptom Analysis, AI Chat, Hospital Map, Profile.

## 2. Folder Structure

```text
src/
├── api/
│   ├── client.ts
│   ├── endpoints.ts
│   └── index.ts
├── components/
│   └── ui/
│       ├── ApiMessage.tsx
│       ├── AppText.tsx
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── EmptyState.tsx
│       ├── Screen.tsx
│       ├── TextField.tsx
│       └── index.ts
├── config/
│   ├── env.ts
│   └── index.ts
├── constants/
│   ├── medicalCopy.ts
│   ├── storageKeys.ts
│   └── index.ts
├── hooks/
│   ├── useAuthSession.ts
│   └── index.ts
├── providers/
│   ├── AppProviders.tsx
│   ├── AuthProvider.tsx
│   └── index.ts
├── services/
│   ├── authService.ts
│   ├── domainServices.ts
│   ├── sessionStorage.ts
│   └── index.ts
├── theme/
│   ├── navigationTheme.ts
│   ├── ThemeProvider.tsx
│   ├── tokens.ts
│   └── index.ts
├── types/
│   ├── api.ts
│   ├── auth.ts
│   ├── user.ts
│   └── index.ts
└── utils/
    ├── errors.ts
    ├── format.ts
    ├── jwt.ts
    ├── pagination.ts
    ├── premium.ts
    ├── roles.ts
    └── index.ts
```

Expo Router vẫn nằm trong thư mục `app/`. File `app/_layout.tsx` được bọc bởi:

1. `AppProviders`
2. React Navigation `ThemeProvider`
3. Expo Router `Stack`

## 3. Environment Configuration

File `.env.example`:

```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_BASE_URL=http://52.77.210.243:8080
```

Mobile đọc config qua `src/config/env.ts`.

Thứ tự lấy API URL:

1. `process.env.EXPO_PUBLIC_API_BASE_URL`
2. Fallback: `http://52.77.210.243:8080`

Khi đổi môi trường backend, chỉ cần tạo `.env` từ `.env.example` và thay `EXPO_PUBLIC_API_BASE_URL`.

## 4. API Flow

Luồng gọi API tiêu chuẩn:

```text
Mobile Screen / Hook
        ↓
Service Layer
        ↓
Endpoint Registry
        ↓
apiRequest()
        ↓
Axios Client
        ↓
Backend API
```

Ví dụ sau này khi làm màn Login:

```ts
import { authService } from '@/src/services';

const response = await authService.login({
  email,
  password,
});
```

API client nằm tại `src/api/client.ts`:

- Tự gắn `baseURL`.
- Tự parse response dạng `{ success, message, data }`.
- Tự ném lỗi chuẩn khi Backend trả `success: false`.
- Tự attach `Authorization: Bearer <token>` nếu request đặt `requiresAuth: true`.

Endpoint registry nằm tại `src/api/endpoints.ts` để tránh hard-code route API trong từng màn hình.

## 5. Auth Flow

Auth foundation hiện có:

| Thành phần | Vai trò |
|---|---|
| `AuthProvider` | Giữ session, role, trạng thái restore |
| `useAuth()` | Hook đọc/cập nhật auth state |
| `useAuthSession()` | Hook alias cho feature code |
| `authService` | Gọi API auth |
| `sessionStorage` | Lưu session bằng AsyncStorage |
| `roles.ts` | Chuẩn hóa role Web sang Mobile |

Luồng dự kiến khi implement Login sau này:

```text
Login Screen
    ↓
authService.login()
    ↓
setSession(session)
    ↓
AsyncStorage lưu session
    ↓
AuthProvider cập nhật isAuthenticated + roles
    ↓
Expo Router điều hướng theo role/workflow
```

Role được chuẩn hóa theo Web:

- `patient`
- `staff`
- `admin`

Utility `getPostLoginRoute()` đã chuẩn bị chỗ để màn hình sau này quyết định route sau đăng nhập dựa trên role và trạng thái setup hồ sơ bệnh nhân.

## 6. Session Persistence

Session được lưu tại key:

```ts
STORAGE_KEYS.authSession = 'medimate.auth.session'
```

Các thao tác chính:

| Function | Mục đích |
|---|---|
| `getStoredSession()` | Đọc session từ AsyncStorage |
| `setStoredSession(session)` | Ghi session |
| `patchStoredSession(partial)` | Cập nhật một phần session |
| `clearStoredSession()` | Xóa session |

Khi app mở lại:

```text
App start
    ↓
AuthProvider mounted
    ↓
getStoredSession()
    ↓
Nếu token còn hạn: restore session
Nếu token hết hạn: clear session
```

`isRestoring` giúp màn hình sau này biết khi nào app đang khôi phục session để hiển thị splash/loading phù hợp.

## 7. Theme System

Design System được tái tạo tại `src/theme/tokens.ts`, dựa trên nhận diện MediMate AI từ Web:

| Nhóm | Token |
|---|---|
| Colors | `background`, `surface`, `primary`, `secondary`, `text`, `success`, `danger`, `warning` |
| Typography | font size, line height, font weight |
| Spacing | thang 4/8/12/16/20/24/32/40/48 |
| Radius | 6/8/12/16/20/full |
| Shadow | shadow nhẹ cho card và elevated surface |

Shared UI components không hard-code màu trực tiếp mà đọc từ `useAppTheme()`.

Ví dụ:

```ts
import { Button, Card, AppText } from '@/src/components/ui';
```

## 8. Shared UI Components

| Component | Mục đích |
|---|---|
| `Screen` | Wrapper màn hình có safe area, background, padding |
| `AppText` | Text theo typography token |
| `Button` | Button variant primary, secondary, ghost, dark, danger |
| `Card` | Surface/card theo style Web |
| `TextField` | Input nền tảng cho form |
| `Badge` | Trạng thái/role/status label |
| `ApiMessage` | Hiển thị lỗi/thành công từ API |
| `EmptyState` | Trạng thái rỗng |
| `LoadingState` | Trạng thái loading |

Các component này là primitive, chưa chứa business workflow.

## 9. Service Layer

Service đã chuẩn bị:

| Service | Mục đích |
|---|---|
| `authService` | Login/register/logout/refresh/me/change password |
| `usersService` | User APIs |
| `medicalDepartmentsService` | Khoa/phòng ban y tế |
| `medicalFacilitiesService` | Cơ sở y tế |
| `doctorsService` | Bác sĩ |
| `patientProfilesService` | Hồ sơ bệnh nhân |
| `subscriptionPlansService` | Gói Premium |
| `webChatbotService` | Web chatbot endpoints dùng lại khi làm AI Chat |

Các service này chỉ là wrapper API, chưa tạo màn hình hoặc workflow.

## 10. How To Test Foundation

1. Cài dependency:

```bash
npm install
```

2. Tạo `.env` nếu cần đổi backend:

```bash
cp .env.example .env
```

3. Kiểm tra TypeScript:

```bash
npx tsc --noEmit
```

4. Kiểm tra lint:

```bash
npm run lint
```

5. Chạy Expo:

```bash
npm start
```

6. Kiểm tra import foundation bằng cách dùng trong màn hình sau này:

```ts
import { ENDPOINTS, apiRequest } from '@/src/api';
import { Button, Card, Screen } from '@/src/components/ui';
import { useAuthSession } from '@/src/hooks';
import { authService } from '@/src/services';
import { useAppTheme } from '@/src/theme';
```

## 11. Development Notes

- Không gọi trực tiếp endpoint string trong screen. Luôn dùng `ENDPOINTS`.
- Không gọi Axios trực tiếp trong UI. Luôn đi qua `services`.
- Không đọc/ghi AsyncStorage trực tiếp trong screen. Luôn dùng `AuthProvider` hoặc `sessionStorage`.
- Không hard-code màu trong màn hình mới. Dùng theme token.
- Các workflow nghiệp vụ sẽ được implement ở giai đoạn sau dựa trên `MOBILE_WEB_MAPPING.md`.
