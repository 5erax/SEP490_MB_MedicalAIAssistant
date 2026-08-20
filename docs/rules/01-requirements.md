# Requirements — Hệ thống phải làm gì

## A. Định vị và minh bạch

- **REQ-001 (P0)** Mọi bề mặt AI hướng tới Patient PHẢI nói rõ đây là AI hỗ trợ định hướng,
  không phải chẩn đoán, kê đơn hay thay thế nhân viên y tế.
- **REQ-002 (P0)** Kết quả phải tách rõ: dữ liệu người dùng cung cấp, dữ liệu hệ thống suy ra,
  giới hạn/sự không chắc chắn, mức ưu tiên hành động và bước tiếp theo.
- **REQ-003 (P0)** Tính năng demo/mock PHẢI có nhãn rõ và không được hòa lẫn với hồ sơ thật.
- **REQ-004 (P1)** Người dùng phải biết khi đang tương tác với AI, model/cấu hình nào tạo kết
  quả (ở mức phù hợp), thời điểm tạo và phiên bản nội dung an toàn áp dụng.

## B. Triage và tình huống khẩn cấp

- **REQ-010 (P0)** Trước khi gọi generative AI, backend PHẢI chạy bộ phát hiện red flag có phiên
  bản, được chuyên gia lâm sàng duyệt và có test; AI không phải lớp bảo vệ duy nhất.
- **REQ-011 (P0)** Khi có red flag, hệ thống PHẢI ưu tiên thông báo khẩn cấp và hành động rõ:
  gọi `115` tại Việt Nam hoặc số cấp cứu địa phương, liên hệ người hỗ trợ, đến cơ sở gần nhất.
- **REQ-012 (P0)** Cảnh báo khẩn cấp PHẢI khả dụng cho Guest, không bị paywall/quota chặn,
  không đòi hoàn tất hồ sơ và không bị che bởi modal/quảng cáo.
- **REQ-013 (P0)** Nếu không đủ dữ liệu để phân tầng nguy cơ, hệ thống PHẢI nói là chưa đủ dữ
  liệu và hỏi thêm hoặc khuyến nghị đánh giá trực tiếp; không mặc định là nguy cơ thấp.
- **REQ-014 (P0)** Red-flag catalog phải có owner lâm sàng, ngày duyệt, nguồn, version, lịch
  rà soát và cơ chế rollback.

## C. Phân tích triệu chứng và AI

- **REQ-020 (P0)** Đầu ra cho Patient chỉ được trình bày dưới dạng khả năng cần cân nhắc/định
  hướng chuyên khoa; không gọi là kết luận chẩn đoán.
- **REQ-021 (P0)** Không hiển thị xác suất bệnh hoặc `confidence` như xác suất lâm sàng nếu chưa
  có nghiên cứu hiệu chuẩn/validation cho đúng model, population và use case.
- **REQ-022 (P0)** Mọi output model phải được validate schema, allowlist/range, kiểm tra nội
  dung cấm và fallback an toàn trước khi lưu hoặc trả cho client.
- **REQ-023 (P0)** Hệ thống PHẢI fail closed: khi provider lỗi, JSON lỗi, model chưa duyệt hoặc
  safety check lỗi, không trả nội dung thô và không suy diễn kết quả thay thế.
- **REQ-024 (P1)** Mỗi phiên AI phải truy vết được model/version, prompt template version,
  safety-rule version, dữ liệu nguồn và thời điểm, nhưng audit log không chứa PHI thô.
- **REQ-025 (P1)** Thay model/prompt/range tham chiếu phải qua evaluation regression và phê
  duyệt theo `POL-AI` trước rollout.

## D. Xét nghiệm, thuốc và kế hoạch phục hồi

- **REQ-030 (P0)** OCR phiếu xét nghiệm PHẢI hiển thị dữ liệu trích xuất để người dùng xác nhận;
  giá trị, đơn vị hoặc khoảng tham chiếu không chắc chắn phải được đánh dấu, không tự sửa im lặng.
- **REQ-031 (P0)** Diễn giải xét nghiệm phải dùng khoảng tham chiếu đúng nguồn/đơn vị/nhóm áp
  dụng khi có; nếu thiếu thì nói rõ không thể phân loại, không dùng một khoảng mặc định.
- **REQ-032 (P0)** Thuốc do người dùng nhập/scan phải gắn nhãn `tự khai báo/chưa xác minh`.
  Lịch nhắc không được biến thành chỉ định dùng thuốc.
- **REQ-033 (P0)** Hệ thống không được khuyên bắt đầu, dừng, đổi liều hoặc thay thuốc. Mọi thay
  đổi điều trị phải dẫn người dùng tới bác sĩ/dược sĩ có thẩm quyền.
- **REQ-034 (P0)** Kế hoạch phục hồi/nutrition mang tính cá nhân hóa cao chỉ được publish cho
  Patient sau khi người có thẩm quyền duyệt; phải lưu người duyệt, version và thời điểm.

## E. Danh tính, quyền và dữ liệu

- **REQ-040 (P0)** Backend PHẢI xác thực và kiểm tra quyền trên từng object; biết GUID không tạo
  quyền truy cập. FE guard chỉ hỗ trợ UX, không phải kiểm soát bảo mật.
- **REQ-041 (P0)** Patient chỉ truy cập dữ liệu của mình hoặc dữ liệu được chia sẻ bằng căn cứ
  rõ ràng. Admin không mặc nhiên có quyền đọc nội dung lâm sàng chỉ vì là Admin.
- **REQ-042 (P0)** Hành động nhạy cảm phải có audit trail chống sửa gồm actor, action, target,
  purpose, timestamp, outcome và correlation ID; không ghi token/nội dung sức khỏe thô.
- **REQ-043 (P0)** Hệ thống phải cung cấp luồng notice/consent theo mục đích và tiếp nhận yêu
  cầu truy cập, sửa, rút consent, hạn chế/xóa dữ liệu theo pháp luật áp dụng.
- **REQ-044 (P0)** Upload tài liệu y tế phải kiểm tra loại thật, kích thước, malware, quyền sở
  hữu, URL an toàn; bucket/provider không được public mặc định.

## F. Trải nghiệm và khả năng tiếp cận

- **REQ-050 (P0)** Critical journeys phải dùng được bằng bàn phím, screen reader và mobile;
  đạt WCAG 2.2 AA trong phạm vi `STD-A11Y-001`.
- **REQ-051 (P0)** Không dùng màu làm tín hiệu duy nhất cho mức nguy cơ/kết quả bất thường.
- **REQ-052 (P1)** Mỗi data view có loading, empty, partial, stale, success, validation error,
  permission denied, network error và retry an toàn.
- **REQ-053 (P1)** Ngôn ngữ mặc định là tiếng Việt rõ ràng; thuật ngữ y khoa cần giải thích
  bằng ngôn ngữ phổ thông và không tạo trấn an giả.

## G. Nghiệm thu tối thiểu

Một requirement chỉ được coi là hoàn tất khi có: owner, acceptance test, negative test, audit/
observability phù hợp, tài liệu vận hành và bằng chứng review lâm sàng/privacy/security nếu liên quan.
