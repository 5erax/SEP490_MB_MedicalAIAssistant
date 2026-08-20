# Standards — Chuẩn team phải tuân theo

## 1. Chuẩn bắt buộc hiện tại

### Accessibility

- **STD-A11Y-001** Patient/public và critical staff flow phải đạt **WCAG 2.2 Level AA** trên toàn
  page/state/responsive variant. Automated axe không thay thế keyboard + screen reader test.
- **STD-A11Y-002** Target tương tác tối thiểu theo WCAG 2.2 AA; focus không bị che, help nhất quán,
  auth không bắt cognitive test đơn độc, motion tôn trọng `prefers-reduced-motion`.

### Application/API security

- **STD-SEC-001** Baseline verification là **OWASP ASVS 5.0.0 Level 2** cho web xử lý dữ liệu sức
  khỏe. Requirement phải ghi cả version và ID (`v5.0.0-x.y.z`) trong checklist security.
- **STD-SEC-002** API review dùng **OWASP API Security Top 10:2023**, đặc biệt object/function
  authorization, resource consumption, SSRF, inventory và unsafe consumption of APIs.
- **STD-SEC-003** TLS tối thiểu 1.2, ưu tiên 1.3; cipher/certificate do nền tảng được hỗ trợ quản
  lý. Password/token/OTP/refresh token theo chuẩn cryptography platform và OWASP, không tự thiết kế.
- **STD-SEC-004** Dependency, secret, SAST và IaC scan chạy trong CI; finding Critical/High có
  khả năng khai thác trên scope production phải được xử lý hoặc risk owner chấp thuận có hạn dùng.

### API và dữ liệu

- **STD-API-001** REST contract được mô tả bằng OpenAPI; request/response/error quan trọng có
  schema và contract test. Endpoint mới giữ pattern envelope hiện tại hoặc đi qua ADR migration.
- **STD-DATA-001** Timestamp interchange dùng ISO 8601/RFC 3339, UTC với `Z`; encoding UTF-8;
  số thập phân/đơn vị không phụ thuộc locale trong API.
- **STD-DATA-002** Clinical code/range/catalog luôn ghi hệ mã, version, source, effective date.
  ICD-10 không được dùng như chuỗi không có provenance.
- **STD-DATA-003** Nếu tích hợp trao đổi hồ sơ y tế, ưu tiên HL7 FHIR R4/R4B theo profile được
  thống nhất; đây là chuẩn mục tiêu, không tuyên bố FHIR-compliant trước conformance test.

### AI governance và clinical safety

- **STD-AI-001** AI governance dựa trên 6 nguyên tắc WHO: tự chủ; an toàn/lợi ích công; minh bạch;
  trách nhiệm; bao trùm/công bằng; đáp ứng/bền vững.
- **STD-AI-002** Mỗi use case AI có model card/system card nội bộ, intended use, prohibited use,
  data flow, risk assessment, evaluation dataset, subgroup analysis, failure modes và rollback.
- **STD-AI-003** Evaluation phải đo ít nhất: red-flag sensitivity theo catalog, harmful advice,
  hallucination/factuality, refusal correctness, schema validity, bias/subgroup, privacy leakage,
  prompt injection và regression so với bản đang chạy.
- **STD-AI-004** AI output có ảnh hưởng sức khỏe cần human oversight phù hợp và post-market/
  production monitoring; không dùng “model benchmark” chung thay cho validation use case.

## 2. Chuẩn kỹ thuật theo repo

- **STD-FE-001** FE quality gate: lint, build, unit/component test khi có, route E2E, critical flow
  E2E và accessibility. Visual test không thay semantic/behavior test.
- **STD-FE-002** React hooks/components phải qua ESLint; route lớn/map/admin/chat lazy-load khi
  phù hợp; Core Web Vitals budget do team đo và ghi, không tự tuyên bố đạt.
- **STD-BE-001** BE quality gate: restore, build warnings policy, unit/integration/authorization
  tests, migration validation và API contract tests.
- **STD-BE-002** ASP.NET Core auth middleware, policy/role và service ownership check phải được
  test với anonymous, wrong role, same role wrong object, disabled account và expired token.

## 3. Chuẩn có điều kiện — chỉ áp dụng sau phân loại chính thức

- **STD-COND-001** Nếu chức năng trở thành software as a medical device, tổ chức phải đánh giá
  áp dụng **ISO 13485**, **ISO 14971**, **IEC 62304**, **IEC 62366-1** và quy định thiết bị y tế
  tại thị trường triển khai. Không ghi “compliant/certified” nếu chưa được đánh giá/chứng nhận.
- **STD-COND-002** Nếu xây ISMS/PIMS chính thức, có thể dùng ISO/IEC 27001 và 27701; adoption
  nội bộ không đồng nghĩa chứng nhận.

## 4. Definition of Done theo risk

| Risk | Ví dụ | Bằng chứng tối thiểu |
|---|---|---|
| P0 Clinical/Security/Privacy | triage, PHI auth, lab, medication, publish plan | tests âm/dương, owner chuyên môn review, threat/risk update, rollback |
| P1 Business critical | auth, payment, quota, directory | unit/integration/E2E, audit, contract test |
| P2 UX/internal | copy, layout, refactor không đổi contract | lint/build, targeted test, a11y nếu UI |

Không được hạ risk chỉ để bỏ gate. Ngoại lệ chuẩn phải có owner, lý do, kiểm soát bù, hạn dùng
và issue theo dõi.
