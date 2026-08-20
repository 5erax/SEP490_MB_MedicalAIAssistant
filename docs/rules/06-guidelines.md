# Guidelines — Khuyến nghị, có thể ngoại lệ

Ngoại lệ guideline phải ghi ngắn gọn trong PR. Nếu guideline được lặp lại như điều kiện release,
hãy nâng thành Standard thay vì âm thầm coi nó là bắt buộc.

## A. Thiết kế và nội dung y tế

- **GL-UX-001** Đưa hành động an toàn/bước tiếp theo trước phần giải thích dài. Patient cần biết
  “làm gì bây giờ” trước chi tiết kỹ thuật.
- **GL-UX-002** Dùng progressive disclosure: tóm tắt -> lý do -> dữ liệu nguồn -> giới hạn. Không
  đổ sáu tên bệnh và phần trăm lên đầu màn hình.
- **GL-UX-003** Viết câu ngắn, giọng bình tĩnh, không hù dọa và không trấn an tuyệt đối. Tránh
  “chắc chắn”, “không sao”, “an toàn 100%”.
- **GL-UX-004** Câu hỏi triệu chứng nên giải thích vì sao cần hỏi khi thông tin nhạy cảm; cho phép
  `Không biết/Không muốn trả lời` nếu không phá vỡ safety flow.
- **GL-UX-005** Với kết quả bất thường, hiển thị giá trị + đơn vị + range nguồn + trạng thái xác
  minh + bước tiếp theo; tránh chỉ dùng mũi tên/màu.
- **GL-UX-006** Map/directory nên cho phép xem danh sách, gọi điện/mở chỉ đường và fallback khi
  từ chối location; không ép chia sẻ vị trí chính xác.

## B. AI và prompt

- **GL-AI-001** Tách deterministic safety/routing khỏi generative explanation. Model chỉ diễn đạt
  sau khi rule engine xác định các guardrail bắt buộc.
- **GL-AI-002** Prompt dùng template versioned, delimit untrusted input, schema chặt và output
  length giới hạn. Không nối raw user text vào system instruction không phân tách.
- **GL-AI-003** Ưu tiên retrieval từ nguồn y khoa đã duyệt và ghi provenance hơn kiến thức parametric
  của model. Nội dung hết hạn phải tự ngừng được dùng.
- **GL-AI-004** Score ranking nội bộ nên tránh hiển thị; nếu cần hiển thị, dùng band đã validation
  và mô tả đúng ý nghĩa, không biến score thành probability.
- **GL-AI-005** Canary model/prompt trên synthetic/de-identified eval trước, sau đó rollout nhỏ có
  monitoring. Không A/B test nội dung nguy cơ cao chỉ để tối ưu engagement.
- **GL-AI-006** Thu thập feedback riêng về hữu ích và nguy cơ gây hại; thumbs-up không phải bằng
  chứng clinical accuracy.

## C. Kỹ thuật frontend/backend

- **GL-FE-001** Thiết kế mobile-first từ 320 px; table/map/chat có layout thay thế, không chỉ thu
  nhỏ desktop. Primary action dễ chạm nhưng không che cảnh báo.
- **GL-FE-002** Lazy-load map, admin, chat và route nặng; prefetch theo intent. Không tối ưu bằng
  cách cache PHI lâu ở client.
- **GL-FE-003** Validate API response quan trọng ở boundary (ví dụ Zod khi migration phù hợp) và
  có UI fallback an toàn cho schema drift.
- **GL-BE-001** Dùng policy-based authorization + query scoped by actor để giảm IDOR; tránh tải
  object rồi mới kiểm quyền nếu query có thể scope ngay từ DB.
- **GL-BE-002** External call có timeout, cancellation, bounded retry với jitter và circuit breaker;
  không retry non-idempotent mù quáng.
- **GL-BE-003** Cache key không chứa PHI rõ; cache clinical content có version/source và invalidation.
- **GL-BE-004** Feature flag theo environment/tenant/use case; default off cho capability P0 mới.

## D. Test và review

- **GL-QA-001** Dùng test pyramid: unit cho mapper/rule/calculation, integration cho DB/auth/vendor
  boundary, E2E cho critical journey, manual clinical review cho nội dung/nguy cơ.
- **GL-QA-002** Test dataset bao gồm typo, tiếng Việt không dấu, phủ định, mơ hồ, trẻ em/người già,
  thai kỳ khi in-scope, nhiều bệnh nền, unit/range lạ và prompt injection.
- **GL-QA-003** Accessibility test manual ít nhất với keyboard và một screen reader trên critical
  journeys mỗi release lớn.
- **GL-QA-004** PR P0 nên có reviewer không phải tác giả và reviewer domain phù hợp. Screenshot
  không thay thế test hoặc review nội dung.

## E. Observability

- **GL-OPS-001** Dùng metric theo event đã khử dữ liệu: latency, error category, schema rejection,
  safety escalation, quota outcome, model/prompt version. Không ghi raw prompt/output.
- **GL-OPS-002** Alert dựa trên user harm indicator và tỷ lệ safety failure, không chỉ CPU/5xx.
- **GL-OPS-003** Dashboard tách production/synthetic/admin testing; hành vi Admin kiểm thử AI
  không làm sai số liệu Patient.
