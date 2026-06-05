# PAGE IMPLEMENTATION PROMPTS

## STEP 0 — KHỞI TẠO DỰ ÁN
Khởi tạo dự án Astro với TypeScript strict và pnpm. Thêm React integration, Tailwind CSS 4, sitemap, Storybook và Playwright. Tạo đúng cấu trúc thư mục trong `architecture.md`. Tạo theme token từ `design-system.json`. Tạo Content Collection schema từ `content-model.json`. Chưa xây page hoàn chỉnh ở bước này.

Acceptance criteria:
- Dev server chạy được.
- TypeScript strict bật.
- Tailwind token hoạt động.
- Có BaseLayout, Container, Button, SectionHeading và ProductCard cơ bản.
- Có ít nhất một Storybook story cho Button và ProductCard.
- Build thành công.

---

## STEP 1 — TRANG CHỦ `/`
Triển khai đúng layout Page 1 trong `page-prompts.md`.

Tách thành:
- `HomeHero.astro`
- `CategoryStrip.astro`
- `FeaturedProducts.astro`
- `CustomCta.astro`

Không thêm testimonial hoặc quy trình custom vào trang chủ.

---

## STEP 2 — DANH SÁCH SẢN PHẨM `/products`
Triển khai đúng layout Page 2.

Tách thành:
- `ProductsHeader.astro`
- `CategoryTabs.astro`
- `ProductsToolbar.astro`
- `ProductGrid.astro`
- `ProductFilter.tsx` nếu thật sự cần tương tác client.

Search/filter chỉ hydrate đúng island chứa chức năng đó.

---

## STEP 3 — CHI TIẾT SẢN PHẨM `/products/[slug]`
Triển khai đúng layout Page 3 và sinh route từ Content Collections.

Tách thành:
- `ProductGallery.tsx`
- `ProductInfo.astro`
- `ProductDescription.astro`
- `CustomOptions.tsx`
- `RelatedProducts.astro`

Video chỉ load khi người dùng yêu cầu hoặc khi card visible.

---

## STEP 4 — TRANG CUSTOM `/custom`
Triển khai đúng layout Page 4.

Tách thành:
- `CustomHero.astro`
- `CustomProcess.astro`
- `CustomGallery.astro`
- `PreparationGuide.astro`
- `CustomContactCta.astro`

Không tạo form dài. CTA dẫn sang Zalo.

---

## STEP 5 — VỀ SUGONG `/about`
Triển khai đúng layout Page 5.

Tách thành:
- `BrandStory.astro`
- `TikTokHighlights.astro`
- `Testimonials.astro`
- `SocialContact.astro`

TikTok card mặc định dùng poster ảnh, không load ba video thật cùng lúc.

---

## STEP 6 — KIỂM TRA VÀ TỐI ƯU
- Chạy type-check, lint và build.
- Viết Playwright test cho navigation, product detail và CTA Zalo.
- Kiểm tra desktop, tablet và mobile.
- Kiểm tra ảnh, alt text và layout shift.
- Xóa component, style và dependency không dùng.
- Báo cáo page weight và số React island của từng page.
