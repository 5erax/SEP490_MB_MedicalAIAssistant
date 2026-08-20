# Constraints — Giới hạn bắt buộc

## A. Phạm vi sản phẩm và lâm sàng

- **CON-001** Sản phẩm bị giới hạn ở hỗ trợ thông tin/định hướng trước khám cho tới khi có đánh
  giá pháp lý, phân loại sản phẩm và hồ sơ chứng minh khác. Marketing/UI/API không được tự nhận
  là thiết bị y tế, hệ thống chẩn đoán hay dịch vụ khám chữa bệnh.
- **CON-002** Disclaimer không bù được thiết kế nguy hiểm. Một capability vi phạm rule an toàn
  phải bị chặn/ẩn, không được chỉ thêm câu “tham khảo bác sĩ”.
- **CON-003** Generative AI không được là nguồn duy nhất cho red-flag detection, mã ICD, khoảng
  tham chiếu xét nghiệm, tương tác thuốc hoặc hướng dẫn điều trị.
- **CON-004** Không triển khai tính năng tương tác thuốc cho đến khi có nguồn dược lâm sàng có
  giấy phép, version, quy trình cập nhật và clinical validation.
- **CON-005** Không mở truy cập hồ sơ Patient cho Doctor/Staff đến khi mô hình consent, assignment,
  purpose, revoke, audit và break-glass được duyệt và triển khai end-to-end.

## B. Dữ liệu cá nhân và nhà cung cấp

- **CON-010** Dữ liệu sức khỏe, triệu chứng, thuốc, xét nghiệm, vị trí gắn với cá nhân và hồ sơ
  phục hồi là dữ liệu nhạy cảm. Không đưa vào URL, analytics, client log, crash report, screenshot,
  tên file public, notification lock-screen hoặc support ticket không được bảo vệ.
- **CON-011** Secret, access/refresh token, OTP, API key và connection string không được commit,
  log hoặc gửi tới client. Biến `VITE_*` luôn được coi là public.
- **CON-012** Không gửi PHI/PII tới AI, OCR, translation, Cloudinary, email, analytics hoặc vendor
  mới trước khi có inventory, hợp đồng/data terms, purpose, vùng xử lý, retention và cơ chế xóa.
- **CON-013** Không dùng unsigned public upload cho tài liệu y tế production nếu không có kiểm
  soát server-side tương đương về chữ ký, scope, loại file, kích thước, thời hạn và quyền đọc.
- **CON-014** Không giữ dữ liệu vô thời hạn. Mỗi collection phải ánh xạ tới retention schedule
  được Legal/Privacy duyệt; hết hạn phải xóa/ẩn danh và có bằng chứng.
- **CON-015** Dữ liệu production không được copy sang local/test. Test dùng synthetic data không
  thể truy ngược cá nhân; việc ẩn tên đơn thuần không tự động thành anonymous.

## C. Bảo mật và phân quyền

- **CON-020** HTTPS là bắt buộc ở production, gồm REST, SignalR, callback và asset chứa dữ liệu.
  Không hard-code origin HTTP/IP production.
- **CON-021** Authorization phải ở server/service boundary và kiểm tra object ownership/assignment.
  Không tin `userId`, role, price, quota, status, redirect hoặc clinical flag do client gửi.
- **CON-022** Endpoint Swagger, Hangfire, health detail và công cụ admin không được public ở
  production nếu chưa có authentication, network restriction và cấu hình riêng.
- **CON-023** Mọi thao tác tạo thanh toán, webhook, submit analysis, publish plan và upload phải
  idempotent hoặc có cơ chế chống replay/duplicate phù hợp.
- **CON-024** Lỗi trả về client không được lộ stack trace, prompt, raw model response, query,
  connection detail, internal ID không cần thiết hoặc dữ liệu của user khác.

## D. Kỹ thuật và vận hành

- **CON-030** FE không được gọi vendor lâm sàng/AI bằng secret trực tiếp. Luồng nhạy cảm đi qua
  backend/proxy có auth, authorization, validation, rate limit và audit.
- **CON-031** API contract không được đổi ngầm. Breaking change cần version/migration và contract
  test hai repo; FE không được suy đoán field thiếu bằng dữ liệu y khoa giả.
- **CON-032** Thời gian lưu ở UTC; timezone chỉ dùng khi hiển thị/lập lịch. Lịch thuốc phải lưu
  timezone/IANA zone hoặc offset rule đủ để xử lý DST khi áp dụng.
- **CON-033** Không đặt SLO/độ chính xác lâm sàng, “confidence”, phần trăm uptime hoặc chứng nhận
  trên UI nếu chưa có cách đo, tập validation và owner xác nhận.
- **CON-034** Release có thay đổi P0 không được rollout nếu thiếu rollback/kill switch và người
  trực sự cố. Kill switch phải chặn capability nguy hiểm mà vẫn giữ cảnh báo khẩn cấp tĩnh.

## E. Quyết định còn mở — không được tự giả định

- **CON-040** Product Owner phải chốt quyền lợi/quota cụ thể của Premium.
- **CON-041** Product + Clinical phải chốt Doctor là role riêng hay Staff có hồ sơ chuyên môn.
- **CON-042** Legal/Clinical phải chốt việc sản phẩm có thuộc phần mềm thiết bị y tế và các nghĩa
  vụ đăng ký/đánh giá tương ứng trước khi mở rộng từ “định hướng” sang quyết định lâm sàng.
- **CON-043** Privacy/Legal phải chốt retention, xử lý trẻ em, chuyển dữ liệu xuyên biên giới và
  vendor list. Developer không tự chọn con số pháp lý.
