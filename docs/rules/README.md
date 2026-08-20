# MediMate AI Rulebook

- Phiên bản: `2.0.0`
- Ngày rà soát: `2026-08-10`
- Phạm vi: frontend React/Vite và backend ASP.NET Core của MediMate AI
- Trạng thái: bản chuẩn mới đề xuất để thay thế toàn bộ rule cũ
- Chủ sở hữu cần chỉ định: Product Owner, Clinical Safety Owner, Security/Privacy Owner, Tech Lead

## 1. Dự án là gì

MediMate AI là nền tảng **định hướng trước khi đi khám**, không phải dịch vụ khám chữa bệnh và
không thay thế bác sĩ. Hệ thống hiện có các miền nghiệp vụ: tài khoản và hồ sơ người dùng,
thu thập triệu chứng, AI hỗ trợ định hướng chuyên khoa/cơ sở y tế, OCR và diễn giải phiếu xét
nghiệm, thuốc tự khai báo và lịch nhắc, yêu cầu kế hoạch phục hồi có bác sĩ tham gia, danh mục
cơ sở/khoa/bác sĩ, subscription/thanh toán và workspace quản trị.

Các capability đang dùng mock hoặc chưa có contract backend hoàn chỉnh phải được gắn nhãn
`demo/experimental`; không được quảng bá như dịch vụ y tế đang hoạt động.

## 2. Ngôn ngữ quy phạm

- **PHẢI / KHÔNG ĐƯỢC**: bắt buộc; vi phạm chặn merge hoặc release.
- **NÊN / KHÔNG NÊN**: mặc định phải làm; ngoại lệ cần ghi lý do trong PR hoặc ADR.
- **CÓ THỂ**: tùy chọn, không tạo nghĩa vụ.

Mỗi quy tắc có mã ổn định: `REQ`, `BR`, `CON`, `STD`, `CV`, `GL`, `POL`. Không tái sử dụng
mã đã xóa; đánh dấu `Deprecated` và trỏ tới mã thay thế.

## 3. Bảy loại rule

| Loại | Trả lời câu hỏi | Mức bắt buộc mặc định |
|---|---|---|
| Requirement | Hệ thống phải làm gì? | Bắt buộc sau khi được duyệt |
| Business Rule | Nghiệp vụ cho phép/cấm gì? | Bắt buộc |
| Constraint | Giới hạn không được vượt qua? | Bắt buộc |
| Standard | Chuẩn đo lường/team phải đạt? | Bắt buộc trong phạm vi đã nêu |
| Convention | Cách gọi/viết/tổ chức thống nhất? | Bắt buộc, trừ migration được duyệt |
| Guideline | Cách làm tốt được khuyến nghị? | Có thể có ngoại lệ được giải trình |
| Policy | Ý chí quản trị ở mức hệ thống/tổ chức? | Bắt buộc; cần owner phê duyệt |

## 4. Thứ tự ưu tiên khi xung đột

1. Pháp luật và yêu cầu của cơ quan có thẩm quyền.
2. An toàn người bệnh và `07-policies.md`.
3. `03-constraints.md` và `02-business-rules.md`.
4. `01-requirements.md`.
5. `04-standards.md`, rồi `05-conventions.md`.
6. `06-guidelines.md`.

Nếu vẫn chưa rõ: chọn phương án ít nguy cơ gây hại và ít xử lý dữ liệu nhất, tạm ẩn capability,
ghi ADR và yêu cầu Product + Clinical + Privacy/Security duyệt. Không tự hợp thức hóa bằng disclaimer.

## 5. Cách dùng trong hai repo

1. Đặt nguyên thư mục này tại `docs/rules/` trong mỗi repo hoặc dùng một repo governance làm
   nguồn chuẩn và đồng bộ tự động.
2. Đặt `AGENTS.md` ở root mỗi repo; sửa đường dẫn tài liệu nếu cần.
3. PR phải dẫn mã rule bị tác động và test/chứng cứ tương ứng.
4. Khi FE và BE khác nhau, API contract đã được duyệt là nguồn kỹ thuật; rulebook là nguồn về
   ý nghĩa sản phẩm, an toàn và quyền truy cập.

## 6. Quản trị thay đổi

- Thay đổi `POL`, rule an toàn lâm sàng, quyền truy cập dữ liệu hoặc mục đích AI cần tối thiểu
  Product Owner + owner chuyên môn tương ứng phê duyệt.
- Thay đổi schema/API cần migration plan, tương thích ngược hoặc version mới, và contract test.
- Mỗi quý và trước mỗi release lớn phải rà soát luật, nhà cung cấp AI, dữ liệu, prompt, model,
  red-flag catalog, nội dung y khoa và danh sách quyền.
- Rule không có test tự động phải có checklist kiểm tra thủ công, người kiểm tra và bằng chứng.

## 7. Không phải chứng nhận

Bộ rule này là baseline kỹ thuật/quản trị dựa trên code hiện tại và nguồn công khai, không phải
ý kiến pháp lý, chứng nhận thiết bị y tế hay xác nhận tuân thủ. Trước production cần luật sư Việt
Nam và bác sĩ/chuyên gia an toàn lâm sàng duyệt phạm vi, nội dung và quy trình vận hành.
