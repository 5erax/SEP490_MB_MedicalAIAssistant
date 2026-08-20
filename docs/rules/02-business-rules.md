# Business Rules — Nghiệp vụ cho phép/cấm gì

## A. Actor, role và entitlement

- **BR-001** Role lâu dài: `Patient`, `Staff/Doctor` (sau khi mô hình được PO chốt), `Admin`.
  `Premium`, `Staff Applicant`, `Doctor Invitee` là entitlement/trạng thái, không phải role quyền lực.
- **BR-002** Quyền được cấp theo least privilege và deny-by-default; mọi endpoint nhạy cảm phải
  khai báo actor/capability/object scope cụ thể.
- **BR-003** Patient sở hữu logical scope hồ sơ của mình. Truy cập thay mặt cần consent/ủy quyền
  hợp lệ hoặc căn cứ pháp luật, có hạn dùng và audit.
- **BR-004** Admin quản trị tài khoản/danh mục không đồng nghĩa được xem triệu chứng, xét nghiệm,
  thuốc hoặc kế hoạch phục hồi. Truy cập hỗ trợ đặc biệt cần purpose, quyền riêng và audit.
- **BR-005** Tài khoản bị khóa/xóa không được tạo phiên AI, thanh toán hoặc truy cập PHI; quyền
  xử lý yêu cầu dữ liệu và hỗ trợ khôi phục vẫn theo policy.

## B. AI và an toàn lâm sàng

- **BR-010** AI được phép hỗ trợ thu thập thông tin, phát hiện nguy cơ theo rule đã duyệt, gợi ý
  chuyên khoa/cơ sở và soạn thảo nội dung cho người có thẩm quyền duyệt.
- **BR-011** AI không được tự chẩn đoán xác định, kê đơn, thay đổi điều trị, xác nhận thuốc thật,
  chứng nhận kết quả xét nghiệm hoặc bảo đảm một bệnh không tồn tại.
- **BR-012** Prompt injection hoặc nội dung người dùng không được thay đổi system safety rules,
  quyền truy cập, nguồn dữ liệu hay format kiểm soát.
- **BR-013** Không dùng output AI để tự động từ chối dịch vụ, giảm ưu tiên cấp cứu, khóa tài khoản,
  định giá theo tình trạng sức khỏe hoặc đưa ra quyết định có hậu quả đáng kể.
- **BR-014** Nếu clinical reviewer và model khác nhau, quyết định của người có thẩm quyền thắng;
  thay đổi phải có lý do và audit, không dùng để train lại nếu chưa có căn cứ/consent.
- **BR-015** Nội dung y khoa, red flags và prompt safety chỉ được publish khi đã có clinical owner
  duyệt; developer hoặc Admin kỹ thuật không tự đóng vai trò phê duyệt lâm sàng.

## C. Triệu chứng, xét nghiệm, thuốc, phục hồi

- **BR-020** Một phiên symptom analysis chỉ dùng dữ liệu đúng user/session và mục đích đã thông
  báo; không tự ghép lịch sử khác mục đích để tăng cá nhân hóa.
- **BR-021** ICD chỉ phục vụ mã hóa/tra cứu có nguồn và version; mã ICD do model sinh không được
  coi là đã xác minh nếu chưa qua catalog/validation.
- **BR-022** Kết quả OCR luôn có trạng thái `unverified`, `user-confirmed` hoặc `professionally-
  verified`; UI và API không được làm mất provenance này.
- **BR-023** Khoảng tham chiếu xét nghiệm phụ thuộc lab, đơn vị, tuổi, giới tính thai kỳ và bối
  cảnh. Thiếu điều kiện bắt buộc thì không được kết luận bình thường/bất thường.
- **BR-024** Medication reminder chỉ nhắc lại lịch người dùng đã nhập hoặc chỉ định đã được xác
  minh; không tự sinh liều/tần suất/thời gian dùng.
- **BR-025** Recovery-plan có state machine được server kiểm soát. Chỉ Doctor/clinical reviewer
  được phân công mới duyệt/publish; Patient không sửa nội dung đã duyệt mà không tạo version mới.

## D. Directory, đánh giá và thương mại

- **BR-030** Cơ sở/khoa/bác sĩ chỉ xuất hiện như đã xác minh khi có nguồn, người duyệt, ngày kiểm
  tra và trạng thái hoạt động. Dữ liệu mock không được mang nhãn xác minh.
- **BR-031** Gợi ý cơ sở phải dựa trên tiêu chí công khai (phù hợp khoa, vị trí, trạng thái),
  không ngụ ý endorsement hoặc xếp hạng chất lượng y tế nếu chưa có dữ liệu hợp lệ.
- **BR-032** Review phải thuộc user thật, có chống spam và moderation; không được sửa nội dung để
  làm sai ý. “Đã khám” chỉ hiển thị khi có cơ chế xác minh lượt khám.
- **BR-033** Premium là quyền lợi, không thay đổi mức độ cảnh báo khẩn cấp hay tiêu chuẩn an toàn.
- **BR-034** Quota chỉ được trừ khi tác vụ được chấp nhận theo contract. Retry idempotent, lỗi hệ
  thống hoặc safety rejection không được tính phí/lượt.
- **BR-035** Thanh toán chỉ thành công sau xác nhận server-to-server/webhook hợp lệ và idempotent;
  redirect phía client không phải bằng chứng thanh toán.

## E. Dữ liệu và lifecycle

- **BR-040** Mỗi loại dữ liệu phải có purpose, lawful basis/consent khi cần, owner, thời hạn giữ,
  nơi lưu, bên nhận và cơ chế xóa trước khi được thu thập.
- **BR-041** Không bán dữ liệu sức khỏe, không dùng cho quảng cáo hành vi và không train/fine-tune
  model từ dữ liệu production nếu chưa có phê duyệt pháp lý, đạo đức và cơ chế opt-in phù hợp.
- **BR-042** Soft delete không đồng nghĩa hoàn tất yêu cầu xóa. Policy phải quy định xóa khỏi hệ
  thống chính, bản sao, cache, search index, provider và backup theo lịch khả thi.
- **BR-043** Dữ liệu trẻ em/người mất hoặc hạn chế năng lực hành vi chỉ được xử lý sau khi luồng
  xác minh tuổi, đại diện/consent và quyền chủ thể dữ liệu được Product + Legal duyệt.
