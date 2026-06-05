# CODING RULES — CHỐNG OVERLOAD VÀ CSS CHỒNG

## CSS
- Chỉ `global.css` được phép style thẻ HTML toàn cục.
- Toàn bộ màu, font, radius và shadow phải lấy từ design token.
- Không dùng `!important`.
- Không dùng ID selector để style.
- Không viết selector lồng sâu hơn 2 cấp.
- Không dùng arbitrary Tailwind value nếu token đã tồn tại.
- Component không được sửa style component con bằng selector toàn cục.

## Component
- Ưu tiên Astro component cho phần không tương tác.
- Chỉ hydrate React component khi thật sự cần.
- Dùng `client:visible` cho carousel/video phía dưới màn hình.
- Dùng `client:idle` cho tương tác không quan trọng ngay lập tức.
- Dùng `client:load` chỉ cho mobile menu hoặc chức năng cần ngay.
- Không hydrate toàn bộ section chỉ vì một nút nhỏ.

## Performance
- Không load video thật khi chưa vào viewport; hiển thị poster trước.
- Ảnh hero được ưu tiên, ảnh dưới fold lazy-load.
- Mỗi page chỉ có 1 ảnh hero ưu tiên tải.
- Không auto-play nhiều video cùng lúc.
- Không tải font quá nhiều weight.

## Layout
- Trang chủ chỉ gồm hero, category strip, 3 sản phẩm nổi bật, CTA và footer.
- Danh sách sản phẩm hiển thị 6-9 sản phẩm mỗi page.
- Trang chi tiết ưu tiên gallery và CTA.
- Trang custom tập trung giải thích quy trình.
- Trang about chứa story, TikTok và review.

## Data
- Không hard-code sản phẩm trực tiếp trong page.
- Lấy sản phẩm từ Content Collections.
- Type sản phẩm phải được validate.

## Definition of Done
- Không có TypeScript error.
- Build thành công.
- Không có horizontal scroll ở mobile.
- CTA chính hoạt động.
- Ảnh có alt text và kích thước.
- Không có màu hex hard-code ngoài theme.
