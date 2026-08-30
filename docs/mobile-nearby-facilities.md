# Tìm cơ sở y tế quanh vị trí người dùng

## Phạm vi

Tích hợp frontend mobile; không sửa backend hoặc repo web.

## API và hành vi

- Gọi `GET /api/medical-facilities/nearby` sau khi người dùng bấm **Định vị** và cấp quyền vị trí.
- `latitude`, `longitude` lấy từ định vị thiết bị; không dùng tọa độ minh họa hoặc tâm bản đồ mặc định làm vị trí người dùng.
- Frontend gửi `radiusKm=7` mặc định, thay cho mặc định 5 km của backend. Có các lựa chọn 5, 7, 10, 20 km.
- Chọn khoa gửi UUID `departmentId`; chọn **Tất cả các khoa** bỏ tham số này. Tên khoa chỉ dùng hiển thị/tìm trong menu.
- `limit=20`; giao diện nêu giới hạn khi API trả đủ 20 kết quả. Tìm tên và loại cơ sở lọc tiếp trên tập kết quả này.
- Ưu tiên gần nhất theo `distanceKm` do backend trả về. Bản đồ và danh sách dùng cùng tập kết quả.
- Đổi vị trí, bán kính hoặc khoa sẽ tải lại; kết quả cũ bị ẩn và phản hồi của truy vấn cũ không được ghi đè truy vấn mới.
- Không có kết quả: gợi ý tăng bán kính/đổi khoa. Lỗi mạng: hiện lỗi và nút thử lại, không thay bằng toàn bộ cơ sở rồi gọi đó là kết quả gần đây.
- Chưa định vị/từ chối quyền: vẫn duyệt danh mục, nhưng ghi rõ chưa lọc theo vị trí.
- Cho phép định vị lại; giới hạn thời gian lấy tọa độ sau cấp quyền để không kẹt trạng thái chờ.
- Luồng tư vấn giữ danh sách gợi ý trước khi định vị. Sau định vị, tìm quanh người dùng theo khoa đang chọn; không trộn lại cơ sở ngoài bán kính từ kết quả tư vấn cũ.
- Bỏ giới hạn camera chỉ trong TP.HCM để có thể hiển thị vị trí thiết bị ở khu vực khác.

## Lưu ý nghiệm thu

Đã đối chiếu Swagger và phản hồi API thực tế bằng tọa độ mẫu trong yêu cầu. Cần kiểm tra quyền định vị, camera bản đồ và thao tác trên APK/iOS thực. Bản preview web của repo mobile hiện chỉ có placeholder bản đồ; không tương đương bản đồ native.
