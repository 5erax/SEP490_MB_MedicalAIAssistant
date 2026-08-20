# Policies — Chính sách hệ thống/tổ chức

Các policy dưới đây cần được ban lãnh đạo/owner nêu trong README phê duyệt trước khi tuyên bố có
hiệu lực tổ chức. Chi tiết triển khai nằm ở Requirement/Business Rule/Standard tương ứng.

## POL-SAFETY — An toàn lâm sàng

1. MediMate AI ưu tiên tránh gây hại hơn engagement, conversion hoặc tốc độ phát hành.
2. AI hỗ trợ con người, không thay thế phán đoán của bác sĩ và không tự quyết định điều trị.
3. Tổ chức chỉ vận hành use case y tế khi có intended use, prohibited use, clinical owner, risk
   register, validation, monitoring, incident response, kill switch và lịch review.
4. Mọi suspected harm/near miss được ghi nhận không đổ lỗi, phân loại, điều tra và sửa có truy vết.
5. Cảnh báo khẩn cấp và tiếp cận trợ giúp cơ bản luôn miễn phí, không bị quota/paywall.

## POL-AI — Quản trị AI có trách nhiệm

1. Inventory mọi model/provider/use case, version, dữ liệu gửi/nhận, owner và trạng thái phê duyệt.
2. Người dùng được thông báo rõ khi tương tác với AI, giới hạn và cách yêu cầu hỗ trợ/khiếu nại.
3. Model/prompt mới phải qua impact/risk assessment và evaluation theo subgroup phù hợp trước rollout.
4. Không dùng production health data để train/fine-tune/evaluate ngoài mục đích đã thông báo và
   phê duyệt. Không dùng shadow AI/vendor cá nhân.
5. Có human oversight, auditability, contest/feedback channel và khả năng dừng/rollback.
6. Không tối ưu AI theo click/thời gian phiên nếu có thể khuyến khích phụ thuộc hoặc gây hại.

## POL-PRIVACY — Quyền riêng tư và bảo vệ dữ liệu

1. Privacy by design/default: tối thiểu hóa dữ liệu, mục đích cụ thể, minh bạch, chính xác, giới
   hạn lưu giữ và bảo mật xuyên suốt lifecycle.
2. Dữ liệu sức khỏe được xử lý như dữ liệu cá nhân nhạy cảm; access theo need-to-know và purpose.
3. Consent khi dùng phải tự nguyện, cụ thể, được thông tin, chứng minh được và dễ rút; không gộp
   consent y tế/AI/marketing vào một checkbox bắt buộc.
4. Duy trì data inventory, records of processing, retention schedule, vendor register, transfer
   assessment và kênh thực hiện quyền chủ thể dữ liệu.
5. Privacy incident phải được cô lập, đánh giá nghĩa vụ thông báo, lưu bằng chứng và giao tiếp theo
   playbook đã được Legal duyệt; không tự đặt deadline pháp lý trong code.

## POL-SECURITY — An toàn thông tin

1. Zero trust đối với input/client/vendor; least privilege, defense in depth và secure-by-default.
2. MFA bắt buộc cho Admin và tài khoản có quyền truy cập dữ liệu nhạy cảm; session/token lifecycle
   được quản lý, revoke và audit.
3. Secure SDLC gồm threat modeling cho P0, code review, dependency/secret/SAST scan, security test,
   asset inventory, patching, backup/restore test và incident response.
4. Không xử lý lỗ hổng chứa dữ liệu nhạy cảm qua issue công khai. Có kênh báo cáo bảo mật riêng.
5. Access đặc biệt/break-glass nếu được triển khai phải có lý do, thời hạn ngắn, cảnh báo và review.

## POL-DATA — Quản trị dữ liệu và vòng đời

1. Mỗi dataset có Data Owner, steward, schema, classification, source, quality rule, lineage,
   retention và authorized uses.
2. Clinical catalog/range/ICD/facility data có provenance, effective date và reviewer; không tự
   động coi dữ liệu AI sinh là master data.
3. Backup được mã hóa, giới hạn quyền, kiểm thử restore và tuân retention. Xóa production phải có
   cơ chế lan tới derivative/cache/vendor theo lịch đã phê duyệt.
4. Synthetic data là mặc định cho dev/test/demo; export production phải được phê duyệt và audit.

## POL-VENDOR — Nhà cung cấp và chuyển dữ liệu

1. Trước khi tích hợp vendor phải đánh giá security/privacy/clinical risk, data terms, subprocessor,
   location, retention, deletion, breach notification, availability và exit plan.
2. Chỉ gửi trường tối thiểu; dùng pseudonymous identifier khi có thể; tắt provider training/data
   retention nếu hợp đồng/tính năng cho phép.
3. Provider/model outage hoặc contract change không được làm hệ thống trả kết quả lâm sàng giả.
4. Thay provider là thay đổi material, cần re-evaluation và cập nhật notice/inventory.

## POL-INCIDENT — Sự cố và liên tục dịch vụ

1. Phân loại ít nhất: clinical safety, privacy, security, availability, payment và data quality.
2. P0 có on-call owner, runbook, kill switch, rollback, communication template và post-incident review.
3. Bảo toàn evidence nhưng không mở rộng truy cập PHI. Giao tiếp sự cố phải trung thực, không suy
   đoán nguyên nhân hoặc che giấu ảnh hưởng.
4. Sau sự cố phải cập nhật risk register, tests, rules và training; không chỉ vá triệu chứng.

## POL-CONTENT — Nội dung, công bằng và hỗ trợ người dùng

1. Nội dung y tế do người có chuyên môn duyệt, có nguồn/ngày review và chu kỳ hết hạn.
2. Không phân biệt đối xử theo giới, tuổi, khuyết tật, dân tộc, thu nhập, địa lý hoặc đặc điểm được
   pháp luật bảo vệ. Theo dõi performance theo subgroup mà vẫn bảo vệ privacy.
3. Có kênh báo sai, khiếu nại và yêu cầu human review. Không trả đũa hoặc giảm quyền lợi vì feedback.
4. Marketing không phóng đại năng lực, chứng nhận, độ chính xác hoặc quan hệ với cơ sở/bác sĩ.

## Trách nhiệm tối thiểu

| Vai trò | Trách nhiệm không được bỏ trống |
|---|---|
| Product Owner | intended use, scope, business rules, entitlement |
| Clinical Safety Owner | red flags, nội dung y tế, clinical risk/incident, approval |
| Privacy/Legal Owner | lawful basis, notice/consent, rights, retention, transfer/vendor |
| Security Owner | threat model, controls, vulnerability/incident response |
| AI Owner | inventory, evaluation, monitoring, model/prompt change |
| Tech Lead | architecture, contract, test/release evidence |

Một người có thể kiêm nhiều vai trò ở đội nhỏ nhưng phê duyệt P0 không nên chỉ có đúng tác giả.
