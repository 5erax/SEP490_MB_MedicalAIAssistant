# Migration từ bộ rule/tài liệu cũ

## 1. Vấn đề đã phát hiện

Qua hai repo tại ngày rà soát:

- Frontend định vị đúng là “định hướng trước khi đi khám”, nhưng backend prompt yêu cầu MedGemma
  sinh 6 differential diagnoses và tự ước lượng `p_A`, `p_B_given_A`; service sau đó chuẩn hóa thành
  `P(A|B)`. Các số này không có bằng chứng là xác suất lâm sàng đã hiệu chuẩn.
- Một số DTO/entity/code dùng từ `Diagnosis`/`ConfidenceScore`, dễ bị UI/marketing diễn giải quá mức.
- `PatientProfileController` có route lấy hồ sơ theo `userId`/`id` chỉ yêu cầu authenticated ở cấp
  controller; cần xác minh và test object-level authorization trong service cho mọi route tương tự.
- Swagger được map ngoài block Development; production exposure cần được khóa theo CON-022.
- Frontend cấu hình upload trực tiếp Cloudinary unsigned cho tài liệu; production cần review theo
  REQ-044/CON-013 và data-vendor policy.
- Tài liệu cũ có nhiều nguyên tắc tốt nhưng trộn requirement, target architecture, backlog và rule,
  khiến khó biết cái gì chặn release và ai chịu trách nhiệm.

Đây là finding từ static review, không khẳng định đã có sự cố hoặc lỗ hổng khai thác được.

## 2. Tài liệu cũ nên xử lý thế nào

- Giữ `docs/product-definition/*` làm bối cảnh sản phẩm, nhưng thêm banner: rulebook v2 là nguồn
  chuẩn cho safety, privacy, authorization và release gate.
- Giữ `docs/frontend-architecture/*` cho target architecture; bỏ các câu mang tính business/safety
  trùng lặp hoặc thay bằng link tới rule ID.
- Chuyển checklist `screen-flow-business-rule-checklist.md` thành implementation tracker; không
  dùng nó làm nguồn business rule độc lập.
- Đánh dấu rule cũ bị thay thế là `Deprecated`, nêu ngày và link thay thế; không xóa ngay nếu PR/
  audit history còn tham chiếu.

## 3. Thứ tự rollout khuyến nghị

1. Chỉ định 6 owner trong `07-policies.md`; duyệt định vị và P0 rules.
2. Tạo issue cho từng finding P0: AI probability/wording, deterministic triage, object auth,
   production admin surfaces, private medical upload và PHI telemetry.
3. Đưa `AGENTS.md` và rulebook vào cả hai repo; cập nhật PR template với rule/risk/evidence.
4. Viết contract test FE-BE và authorization matrix test trước refactor lớn.
5. Sửa P0 theo feature flag; chạy clinical/AI/security/privacy review và rollout có monitoring.
6. Sau một release ổn định, deprecate rule cũ và bật CI check cho link rule ID/quality gates.

## 4. Điều kiện tuyên bố “đã thay toàn bộ rule cũ”

- [ ] Owner đã phê duyệt policy và P0 rule.
- [ ] Hai repo cùng trỏ tới một version rulebook.
- [ ] PR template/CI/review flow dùng rule IDs mới.
- [ ] Tài liệu cũ có banner deprecated/superseded và không còn mâu thuẫn.
- [ ] P0 gaps có fix hoặc exception có owner + expiry; không chỉ được ghi nhận trong tài liệu.
- [ ] Legal và Clinical review đã hoàn tất cho phạm vi production.
