# Điểm đánh giá cơ sở y tế

## Nguồn dữ liệu

Điểm trung bình = tổng `FeedbackReview.rating` / số đánh giá công khai hợp lệ của cơ sở.
Backend đã trả kết quả qua `averageRating` và `reviewCount` trong API cơ sở y tế (active, nearby, chi tiết).
Mobile sử dụng hai trường tổng hợp này, không tính trung bình từ trang đầu của danh sách đánh giá (20 mục/trang).

Đối chiếu API thực ngày 30/08/2026: cơ sở `5e596be3-865b-4fdd-9042-28f42799d39f` có ratings `[2, 1, 1, 2]`, API trả `averageRating=1.5`, `reviewCount=4`.

## Hiển thị và cập nhật

- Giữ nguyên rating/count khi chuẩn hóa dữ liệu danh sách, nearby, chi tiết.
- Hiển thị cùng nguồn điểm ở thẻ cơ sở, tổng quan chi tiết và tab Đánh giá.
- Điểm hiển thị một chữ số thập phân theo tiếng Việt, ví dụ `1,5/5 · 4 đánh giá`.
- Hàng sao hỗ trợ phần sao lẻ, không làm tròn 1,5 thành 2 sao đầy.
- `reviewCount=0`: “Chưa có đánh giá”; thiếu dữ liệu không được biến thành 0 đánh giá hay 5 sao.
- Sau tạo/sửa đánh giá: tải lại danh sách và điểm tổng hợp, đồng bộ thẻ cơ sở đang hiển thị.
- Nếu lưu thành công nhưng tải lại thất bại: thông báo đã lưu, cho tải lại, không yêu cầu gửi lại POST/PUT.
- Có tải thêm đánh giá; biểu đồ phân bố ghi rõ chỉ áp dụng cho những đánh giá đã tải, không giả làm phân bố toàn bộ.
- Phản hồi cũ hoặc của cơ sở đã đóng không được ghi đè cơ sở đang xem.

Không sửa backend, không tạo đánh giá trên hệ thống thật để kiểm tra. Cần nghiệm thu tương tác gửi/sửa trên APK hoặc iOS với tài khoản kiểm thử.
