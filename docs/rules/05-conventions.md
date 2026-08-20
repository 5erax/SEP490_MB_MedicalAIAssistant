# Conventions — Quy ước để thống nhất

## A. Tên miền nghiệp vụ và nội dung UI

- **CV-001** Tên sản phẩm thống nhất là `MediMate AI`; tên namespace/backend lịch sử `MedMateAI`
  chỉ dùng trong code đến khi có migration riêng.
- **CV-002** Patient-facing dùng `định hướng`, `khả năng cần cân nhắc`, `mức độ ưu tiên`, `bước
  tiếp theo`; tránh `bạn mắc`, `chẩn đoán của bạn`, `xác suất bạn bị`, `AI bác sĩ`.
- **CV-003** `confidence` phải nêu đúng loại: confidence OCR, confidence matcher hoặc model score.
  Không đổi nhãn thành “độ chính xác/chắc chắn y khoa”.
- **CV-004** Provenance label thống nhất: `Tự khai báo`, `AI trích xuất — chưa xác nhận`, `Người
  dùng đã xác nhận`, `Nhân viên y tế đã xác minh`.
- **CV-005** Severity label và màu lấy từ một catalog semantic duy nhất; label luôn đi cùng text,
  icon và action, không chỉ màu.

## B. Frontend React/Vite

- **CV-FE-001** Data flow: `Route/Page -> feature hook/service -> domain API -> shared apiClient
  -> backend`. Component không chứa URL endpoint hoặc secret/vendor credential.
- **CV-FE-002** Component/page `PascalCase`; hook `useSomething`; handler `handleX`; callback prop
  `onX`; boolean bắt đầu `is/has/can/should`.
- **CV-FE-003** Endpoint tập trung; response được map/validate ở boundary. Không sửa clinical
  field bằng fallback giả như `normal`, `low risk` hoặc probability mặc định.
- **CV-FE-004** Server, form, URL và local UI state là bốn loại khác nhau. Không copy server data
  nhạy cảm vào storage/context toàn cục nếu không cần.
- **CV-FE-005** UI primitive dùng semantic variant (`primary`, `danger`, `warning`) và token;
  không hard-code màu có nghĩa lâm sàng trong page.
- **CV-FE-006** CSS mới không chèn `<style>` trong page; dùng shared token/CSS Module hoặc chiến
  lược đang được repo phê duyệt.

## C. Backend ASP.NET Core

- **CV-BE-001** Dependency đi theo `API -> Application -> Domain`; Infrastructure implement
  interface Application/Domain. Controller chỉ orchestration/HTTP mapping.
- **CV-BE-002** Mỗi use case nhạy cảm nhận actor từ authenticated context; không tin `userId`
  trong body/path để quyết định ownership.
- **CV-BE-003** Async I/O nhận `CancellationToken`; timestamp dùng `DateTimeOffset`/UTC theo
  convention đã thống nhất; tiền dùng decimal và currency explicit.
- **CV-BE-004** DTO request/response tách entity persistence. Enum serialize camelCase như contract
  hiện tại; thay đổi enum là contract change.
- **CV-BE-005** Validation error có code ổn định cho client và message Việt hóa; log dùng template
  có cấu trúc, correlation ID, không interpolation PHI.
- **CV-BE-006** Authorization policy/capability có tên semantic; role check đơn thuần không thay
  object-level check trong service/repository query.
- **CV-BE-007** Migration DB là append-only sau khi shared; tên migration mô tả; deploy có forward/
  rollback hoặc roll-forward plan và backup verification.

## D. API, identifier và lỗi

- **CV-API-001** Path dùng plural kebab-case; JSON camelCase; ID là UUID/GUID opaque. Không để
  sequential ID hoặc internal provider ID lộ không cần thiết.
- **CV-API-002** `401` cho chưa/xác thực không hợp lệ, `403` cho không đủ quyền, `404` có thể dùng
  để tránh lộ object, `409` cho conflict/idempotency, `422` cho semantic validation nếu contract chọn.
- **CV-API-003** Error response có `code`, message an toàn, correlation ID và field errors; không
  phụ thuộc message tự do để FE rẽ nhánh.
- **CV-API-004** Pagination có giới hạn server-side, sort ổn định và default được tài liệu hóa.

## E. Git, test và tài liệu

- **CV-DEV-001** Branch dùng prefix team quy định; commit ngắn ở imperative mood; một PR tập trung
  một mục tiêu và dẫn rule IDs (`Affects: REQ-020, BR-011`).
- **CV-DEV-002** Test đặt tên `Given_When_Then` hoặc mô tả hành vi; dữ liệu test synthetic; P0 có
  cả happy path, boundary, unauthorized và unsafe-output path.
- **CV-DEV-003** ADR dùng `docs/adr/NNNN-title.md`; quyết định thay đổi role, AI provider/model,
  clinical logic, vendor data flow hoặc API breaking change bắt buộc có ADR.
- **CV-DEV-004** Không dùng từ `compliant`, `certified`, `clinically proven`, `accurate X%` trong
  code/content/tài liệu nếu không dẫn chứng và owner có thẩm quyền duyệt.
