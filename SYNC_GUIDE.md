# Cẩm nang Đồng bộ: Kho Mây Tre (Fullstack)

Tài liệu này hướng dẫn cách bạn phối hợp giữa App Mobile (Expo) và Web Backend (Next.js) để phát triển tính năng mới mà không bị lỗi dữ liệu.

## 🔄 Quy trình 3 bước khi thêm tính năng mới

Nếu bạn muốn thêm một trường thông tin mới (ví dụ: `color` cho Sản phẩm):

### Bước 1: Cập nhật cơ sở dữ liệu (Backend)
1. Mở file `prisma/schema.prisma` trong dự án Web.
2. Thêm trường vào Model mong muốn: `color String?`.
3. Chạy lệnh: `npx prisma db push` để cập nhật MongoDB.

### Bước 2: Cập nhật API (Backend)
1. Mở file Route tương ứng (ví dụ: `src/app/api/products/route.ts`).
2. Trong hàm `POST` hoặc `PATCH`, đảm bảo bạn đã nhận dữ liệu từ body và gán vào câu lệnh `prisma.product.create`.
3. Test thử bằng Postman hoặc trình duyệt.

### Bước 3: Cập nhật App (Mobile)
1. Cập nhật Interface trong `utils/api.ts` (ví dụ: `type Product = { ... color?: string }`).
2. Sửa giao diện screen tương ứng để hiển thị hoặc nhập dữ liệu mới.

---

## ⚡ Lưu ý quan trọng (Gotchas)

### 1. Sự khác nhau giữa `qty` và `quantity`
- Trong cơ sở dữ liệu (Prisma), một số bảng dùng `qty` (Stock, Delivery) và một số dùng `quantity` (QuoteItem).
- **Giải pháp:** Tôi đã viết hàm `normalizeQty` trong `utils/api.ts` của App Mobile. Mọi dữ liệu đi qua hàm `readJson` sẽ tự động có cả 2 trường này để không bị lỗi UI.

### 2. Header bắt buộc
- Mọi yêu cầu API từ App Mobile **BẮT BUỘC** phải có header `x-org-id` (Mã định danh kho/cơ sở). 
- Phần code trong `api.ts` đã tự động xử lý việc này dựa trên kho bạn chọn.

---

## 💻 Chế độ Phát triển Local (Development)

Để App Mobile trên điện thoại/giả lập kết nối được với Server Backend đang chạy ở máy tính của bạn:

1. **Backend:** Chạy lệnh `npm run dev` (thường ở cổng 3000).
2. **Mobile:** Sửa file `.env` trong dự án App:
   ```env
   # Thay localhost bằng IP máy tính của bạn (ví dụ: 192.168.1.10)
   EXPO_PUBLIC_API_BASE_URL=http://<IP_CUA_BAN>:3000 
   ```
3. **Mạng:** Đảm bảo điện thoại và máy tính dùng chung một mạng Wi-Fi.

---

## 🚀 Deployment (Triển khai)

- **Backend:** Push code lên GitHub và deploy lên **Vercel**.
- **Mobile:** Sử dụng **EAS Build** để tạo file APK/IPA hoặc đẩy lên Store. Đảm bảo biến môi trường `EXPO_PUBLIC_API_BASE_URL` trên Vercel/EAS là chính xác.
