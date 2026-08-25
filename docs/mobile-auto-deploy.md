# Tự động triển khai mobile

Workflow `.github/workflows/mobile-deploy.yml` dùng GitHub Actions để kiểm tra mã nguồn và yêu cầu EAS Build tạo ứng dụng trên hạ tầng Expo.

## Luồng triển khai

| Sự kiện | Kết quả |
| --- | --- |
| Push mã nguồn lên `main` | Chạy lint, TypeScript và tạo Android APK với profile `preview` |
| Publish một GitHub Release | Tạo Android/iOS production build và tự động gửi tới kênh Store nội bộ mặc định |
| Chạy workflow thủ công | Chọn `android`, `ios` hoặc `all`; chọn `preview` hoặc `production`; tùy chọn submit |

Lệnh build dùng `--no-wait`: GitHub Actions kết thúc sau khi EAS nhận yêu cầu. Tiến độ và file cài đặt được xem trong Expo dashboard.

## Thiết lập một lần

1. Đăng nhập đúng Expo account sở hữu project `95787472-0086-4ce2-9a37-9bc7ca68f2a3`.
2. Tạo Expo personal access token tại <https://expo.dev/settings/access-tokens>.
3. Trong GitHub repository, mở **Settings → Secrets and variables → Actions → New repository secret**.
4. Tạo secret có tên chính xác `EXPO_TOKEN` và dán token Expo vào.
5. Trong Expo project, tạo các biến `EXPO_PUBLIC_*` cần thiết cho ba EAS environment: `development`, `preview` và `production`.
6. Chạy ít nhất một build tương tác cho từng nền tảng để EAS tạo/kiểm tra signing credentials trước khi dùng chế độ `--non-interactive`.

Các biến public đang được ứng dụng đọc:

- `EXPO_PUBLIC_APP_ENV`
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `EXPO_PUBLIC_CLOUDINARY_UPLOAD_FOLDER`

Không lưu access token, keystore, service-account JSON, `.p8` hoặc private key trong repository.

## Store credentials

Luồng GitHub Release dùng `--auto-submit`. Trước lần release đầu tiên:

- Android cần Google Play service account và ứng dụng đã được tạo trong Play Console.
- iOS cần App Store Connect credentials, distribution certificate và provisioning profile.

Với cấu hình submit mặc định hiện tại, Android được gửi tới internal testing và iOS được gửi tới TestFlight; workflow không tự đưa bản build ra public production.

## Chạy thủ công

Mở tab **Actions → Mobile CI/CD → Run workflow**:

- `platform`: nền tảng cần build.
- `profile`: `preview` để cài nội bộ, `production` để tạo binary cho Store.
- `submit`: chỉ bật khi profile là `production` và Store credentials đã sẵn sàng.

Nếu chỉ cần APK để cài trực tiếp, chọn `android`, `preview`, `submit = false`.
