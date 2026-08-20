# Nguồn chuẩn và phạm vi áp dụng

Ngày kiểm tra nguồn: `2026-08-10`. Owner pháp lý phải xác nhận bản hiệu lực và nghĩa vụ cụ thể
trước production; bảng này không thay thế tư vấn pháp lý.

## 1. Pháp luật/khung Việt Nam cần đánh giá bắt buộc

| Nguồn | Hiệu lực/ý nghĩa | Cách dùng trong rulebook |
|---|---|---|
| [Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15](https://chinhphu.vn/?classid=1&docid=214590&orggroupid=1&pageid=27160) | Luật về bảo vệ dữ liệu cá nhân; cần Legal rà soát đầy đủ | POL-PRIVACY, CON-010..015, REQ-043 |
| [Nghị định 356/2025/NĐ-CP](https://vanban.chinhphu.vn/?classid=1&docid=216387&pageid=27160) | Chi tiết thi hành Luật Bảo vệ dữ liệu cá nhân; hiệu lực 01-01-2026 | data inventory, vendor, transfer, rights, incident process |
| [Luật Trí tuệ nhân tạo 134/2025/QH15](https://vanban.chinhphu.vn/?docid=216334&pageid=27160&typegroupid=3) | Hiệu lực 01-03-2026; AI lấy con người làm trung tâm, an toàn, minh bạch và kiểm soát của con người | POL-AI, risk classification, transparency, oversight |
| [Nghị định 142/2026/NĐ-CP](https://congbaocdn.chinhphu.vn/180507251028987904/2026/5/18/cong-bao-so-278-639144361744490033-ngay-18-05-47196_1779067252_signed.pdf) | Chi tiết thi hành Luật AI; cần Legal xác định phân loại/nghĩa vụ đúng use case | AI inventory, high-risk assessment, documentation/monitoring |
| [Thông tư 05/2026/TT-BKHCN](https://congbao.chinhphu.vn/van-ban/thong-tu-so-05-2026-tt-bkhcn-469079.htm) | Khung đạo đức AI quốc gia, hiệu lực 10-03-2026 | STD-AI và POL-AI |

Ngoài các nguồn trên, Legal phải lập applicability register cho pháp luật khám chữa bệnh, thiết bị
y tế, giao dịch điện tử, an ninh mạng/dữ liệu, bảo vệ người tiêu dùng, thương mại điện tử/thanh toán,
quảng cáo và quy định chuyên ngành theo mô hình vận hành thực tế.

## 2. Chuẩn/hướng dẫn quốc tế được chọn làm baseline nội bộ

| Nguồn | Trạng thái trong dự án |
|---|---|
| [WHO — Ethics and governance of AI for health](https://www.who.int/publications/i/item/9789240029200) | Baseline đạo đức/quản trị AI y tế |
| [WHO — Guidance on large multi-modal models](https://iris.who.int/bitstream/handle/10665/375579/9789240084759-eng.pdf) | Tham chiếu quản trị generative AI/LMM trong y tế |
| [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Bắt buộc Level AA theo STD-A11Y-001 |
| [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) | Bắt buộc ASVS 5.0.0 Level 2 theo STD-SEC-001 |
| [OWASP API Security Top 10:2023](https://owasp.org/API-Security/) | Baseline API threat/review |
| [HL7 FHIR R4](https://hl7.org/fhir/R4/) | Chỉ là chuẩn mục tiêu nếu có interoperability |

## 3. Chuẩn có điều kiện

ISO 13485, ISO 14971, IEC 62304, IEC 62366-1, ISO/IEC 27001 và ISO/IEC 27701 không được ghi là
“dự án đang tuân thủ/chứng nhận” chỉ vì xuất hiện trong tài liệu. Chúng chỉ trở thành nghĩa vụ nội
bộ sau quyết định applicability có owner, scope, gap assessment và kế hoạch bằng chứng.

## 4. Những điều rulebook cố ý không tự đặt

- Thời hạn retention/xóa cụ thể.
- Deadline thông báo sự cố cụ thể.
- Phân loại pháp lý hệ thống AI hoặc thiết bị y tế.
- Ngưỡng độ chính xác/nhạy/đặc hiệu lâm sàng.
- Danh sách red flag hoặc khoảng tham chiếu xét nghiệm.
- Quy tắc consent cho trẻ em/người đại diện.

Các nội dung này phải đến từ Legal/Clinical/Product và nguồn có thẩm quyền; ghi số tùy ý trong rule
sẽ tạo cảm giác tuân thủ giả.
