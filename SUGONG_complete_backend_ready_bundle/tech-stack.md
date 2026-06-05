# TECH STACK ĐỀ XUẤT CHO SUGONG

## Stack chính: Astro-first

### Astro 6 + TypeScript strict
Astro phù hợp vì website SUGONG chủ yếu là nội dung, ảnh sản phẩm và các page showcase. Phần lớn giao diện được render thành HTML nhẹ; JavaScript chỉ được gửi cho các phần thật sự cần tương tác.

Sử dụng Astro cho:
- Routing theo page.
- Layout chung.
- Render product card, category, footer và nội dung tĩnh.
- Sinh trang chi tiết theo slug.
- Tối ưu ảnh và metadata SEO.

### React chỉ dùng dưới dạng interactive islands
Chỉ dùng React cho:
- Product gallery/carousel.
- Filter và search sản phẩm.
- Mobile menu.
- Các control chọn màu, kích thước hoặc custom.

Không biến toàn bộ website thành React SPA.

### Tailwind CSS 4
Dùng Tailwind để hạn chế CSS chồng chéo và tạo style theo token.

Nguyên tắc:
- Toàn bộ màu, radius, spacing được khai báo trong `src/styles/theme.css` bằng `@theme`.
- Không viết màu hex trực tiếp trong component.
- Không dùng `!important`.
- Không tạo file CSS riêng cho từng component trừ khi animation hoặc selector đặc biệt thực sự cần thiết.
- Không kết hợp Tailwind với Sass/Less.

### Astro Content Collections + Zod
Dùng để quản lý dữ liệu sản phẩm có type safety:
- Tên sản phẩm.
- Slug.
- Giá.
- Danh mục.
- Danh sách ảnh.
- Video TikTok.
- Có nhận custom hay không.
- Nội dung chi tiết.

### Astro Image
Dùng `<Image />` hoặc `<Picture />` cho ảnh sản phẩm. Bắt buộc khai báo kích thước và alt text để tránh layout shift.

### Storybook
Dùng để phát triển và kiểm tra component độc lập trước khi đưa vào page:
- Button.
- ProductCard.
- CategoryCard.
- TikTokPreviewCard.
- CTA banner.
- ProductGallery.

### Playwright
Dùng test các luồng quan trọng:
- Mở danh sách sản phẩm.
- Lọc theo danh mục.
- Truy cập trang chi tiết.
- Bấm CTA Zalo.
- Kiểm tra responsive desktop/mobile.

### Tooling
- Runtime: Node.js 22.
- Package manager: pnpm.
- Formatting: Prettier.
- Lint: ESLint.
- Deploy: static build lên Vercel.

## Không dùng ở giai đoạn đầu
- Redux/Zustand.
- Backend riêng.
- Database.
- UI library lớn.
- Animation framework nặng.

## Khi nào cần chuyển sang Next.js
Chỉ cân nhắc Next.js khi dự án có đăng nhập, giỏ hàng/thanh toán thật, dashboard quản trị phức tạp, cá nhân hóa theo tài khoản hoặc API/backend chạy chung.
