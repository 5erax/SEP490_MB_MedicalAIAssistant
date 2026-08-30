# Mobile Sale Campaign

## Phạm vi

Pricing lấy `GET /api/subscription-plans/offers`. Request đính kèm JWT khi có phiên đăng nhập; nếu không có phiên thì endpoint được gọi ẩn danh. Backend quyết định eligibility, priority, capacity và offer duy nhất; mobile không tự chọn hay cộng dồn campaign.

Thẻ gói hiển thị `effectivePrice`, `grantedCredit`, giá gốc khi thực sự giảm giá, badge/campaign, lượt gốc/lượt khuyến mãi và số suất khi backend trả một số. Bonus-only không gạch giá. Thời điểm kết thúc chỉ là thông tin hiển thị, không được dùng để tự xác định hiệu lực offer.

## An toàn checkout

- Truyền toàn bộ offer đang hiển thị vào `startCheckout`.
- Đọc lại offers trước checkout. So sánh plan ID, offer ID, giá thực trả và tổng lượt với thẻ vừa được bấm.
- Nếu khác hoặc gói không còn: cập nhật bảng giá, thông báo bằng tiếng Việt, không tạo payment; người dùng phải xem lại và bấm mua lần nữa.
- Service bắt buộc gửi `expectedOfferId`, `expectedEffectivePrice`, `expectedGrantedCredit` và giữ `clientType: "mobile"`. No-sale gửi offer ID bằng `null`; không có đường fallback legacy.
- `409 SALE_OFFER_UNAVAILABLE` làm mới bảng giá, không mở PayOS, không tự retry hoặc đổi sang giá khác.
- Khóa thao tác cả ở màn hình và hook để chặn double tap trước khi React kịp render nút disabled.

## Làm mới dữ liệu

- Mỗi 15 giây khi Pricing đang được focus và app active; không hiện skeleton cho lần refresh nền.
- Refresh khi focus lại Pricing, phiên đăng nhập thay đổi và app trở lại foreground.
- Response cũ không ghi đè response mới hoặc dữ liệu của phiên đăng nhập mới.
- Paid refresh subscription, phiên người dùng, usage và offers. Cancelled/Failed/Expired cũng refresh offers.
- Giữ nguyên pending checkout storage, PayOS browser/deep-link và reconcile/polling.

## Lịch sử thanh toán

Chi tiết giao dịch đọc snapshot từ PaymentResponse, không tra ưu đãi đang chạy để tính lại giao dịch cũ. Có tên campaign/badge, giá gốc và giảm giá nếu thực sự giảm, lượt gốc, lượt thưởng và tổng lượt. Các giao dịch cũ không có snapshot vẫn hiển thị bình thường; giao dịch đang chờ không được trình bày như đã cộng lượt.

## Kiểm tra

```sh
npm run check
npm run test:sale
npx expo export --platform android --output-dir <temporary-output-directory>
```

`test:sale` chạy các module TypeScript thực với network, native APIs, timers và React hooks được giả lập trong bộ nhớ; không tạo giao dịch hoặc thay đổi backend. Bao phủ no-sale, price-only, bonus-only, combo, cập nhật giá/lượt/offer/slot, xóa gói, preflight thất bại, 409, 401, double tap, terminal refresh, auth interceptor, polling/foreground/cleanup, response trả sai thứ tự và nội dung snapshot trong lịch sử.

Kết quả tại lần tích hợp: lint/typecheck đạt; 37 kiểm tra tự động đạt; export bundle Android thành công. Đã đối chiếu Swagger và GET offers live; thời điểm kiểm tra backend trả một gói không có sale.

Chưa xác nhận Android APK build hoặc thanh toán trên thiết bị thật: máy triển khai thiếu Android SDK; bản local yêu cầu đăng nhập. Export bundle không thay thế build APK. Trước khi phát hành, cần tester xác nhận bằng tài khoản FirstPurchase/ReturningCustomer, tình huống hết suất/slot được giải phóng trên backend, thanh toán/hủy qua PayOS rồi quay lại app, và số lượt thực nhận. Không suy ra eligibility từ Payment History ở mobile.
