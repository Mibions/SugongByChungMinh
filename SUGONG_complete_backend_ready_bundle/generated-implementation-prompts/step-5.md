{
  "project": {
    "name": "SUGONG Product Showcase Website",
    "goal": "Tạo website giới thiệu sản phẩm handmade theo phong cách hiện đại, tối giản, nền tím pastel, quan sát sản phẩm trực quan như nội dung TikTok.",
    "website_type": "Product showcase / social commerce",
    "primary_conversion": "Nhắn Zalo để đặt hàng hoặc nhận tư vấn custom",
    "secondary_conversion": "Khám phá sản phẩm, xem TikTok, xem mẫu custom"
  },
  "brand": {
    "personality": [
      "nữ tính",
      "trẻ",
      "dịu dàng",
      "handmade",
      "hiện đại",
      "tối giản",
      "thân thiện"
    ],
    "visual_keywords": [
      "pastel lavender",
      "airy layout",
      "editorial ecommerce",
      "rounded cards",
      "soft natural light",
      "TikTok-inspired product media",
      "minimal floral decoration",
      "generous whitespace"
    ],
    "avoid": [
      "quá nhiều section trên một page",
      "banner dày chữ",
      "shadow đậm",
      "màu tím phủ kín toàn bộ ảnh",
      "grid sản phẩm quá nhỏ",
      "layout kiểu sàn thương mại điện tử",
      "nút CTA quá nhiều",
      "trang chủ dài và dàn trải"
    ]
  },
  "color_palette": {
    "background_main": "#F8F5FC",
    "background_section": "#EFE8F8",
    "background_card": "#FFFDFF",
    "primary": "#8D6CAF",
    "primary_dark": "#604A7C",
    "primary_soft": "#D9C8EC",
    "accent_pink": "#F3D8E5",
    "accent_cream": "#F7F0E8",
    "text_primary": "#30283A",
    "text_secondary": "#71657D",
    "border": "#E4DAEF",
    "success": "#6F9B79"
  },
  "typography": {
    "heading": "Playfair Display hoặc Cormorant Garamond",
    "body": "Be Vietnam Pro hoặc Inter",
    "heading_style": "serif mềm mại, sang nhưng không cổ điển quá mức",
    "body_style": "sans-serif rõ ràng, dễ đọc",
    "rules": [
      "Heading lớn tối đa 2-3 dòng",
      "Mỗi đoạn mô tả tối đa 2 dòng tại card",
      "Không dùng font viết tay cho nội dung chính",
      "Giữ độ tương phản chữ rõ trên nền pastel"
    ]
  },
  "layout_tokens": {
    "max_content_width": "1280px",
    "header_height": "64px",
    "section_spacing_desktop": "88px",
    "section_spacing_mobile": "56px",
    "grid_gap": "24px",
    "card_radius": "18px",
    "button_radius": "12px",
    "shadow": "0 8px 28px rgba(82, 61, 110, 0.08)",
    "image_ratio_product_card": "4:3",
    "image_ratio_tiktok": "9:16",
    "desktop_grid": "3 cột",
    "tablet_grid": "2 cột",
    "mobile_grid": "2 cột hoặc 1 cột tùy page"
  },
  "components": {
    "header": {
      "style": "mỏng, sticky, nền tím rất nhạt hoặc trong suốt có blur",
      "items": [
        "SUGONG",
        "Sản phẩm",
        "Custom",
        "TikTok",
        "Về SUGONG",
        "Đặt hàng"
      ],
      "rules": [
        "Không dùng mega menu",
        "CTA Đặt hàng là nút nổi bật duy nhất"
      ]
    },
    "product_card": {
      "fields": [
        "ảnh",
        "tên sản phẩm",
        "giá hoặc trạng thái custom",
        "nút xem chi tiết nhỏ"
      ],
      "rules": [
        "Ảnh chiếm 65-75% card",
        "Không nhồi nhiều badge",
        "Hover zoom nhẹ hoặc đổi ảnh"
      ]
    },
    "tiktok_card": {
      "fields": [
        "video dọc",
        "caption ngắn",
        "play icon",
        "CTA xem sản phẩm"
      ],
      "rules": [
        "Chỉ dùng 1-3 card mỗi section",
        "Không mô phỏng UI TikTok quá nặng"
      ]
    },
    "cta": {
      "primary": "Đặt hàng qua Zalo",
      "secondary": "Xem sản phẩm",
      "rules": [
        "Mỗi section tối đa 1 CTA chính",
        "Không đặt quá nhiều nút cạnh nhau"
      ]
    }
  },
  "responsive_rules": [
    "Hero desktop chia 45/55, mobile xếp dọc.",
    "Header mobile chỉ giữ logo, menu và CTA.",
    "Danh mục mobile cuộn ngang.",
    "Product grid desktop 3 cột, tablet 2 cột, mobile 2 cột.",
    "Trang chi tiết mobile ưu tiên ảnh > tên/giá > CTA > thông tin custom.",
    "CTA Zalo có thể sticky nhẹ trên mobile tại trang chi tiết."
  ]
}

{
  "brand": {
    "name": "SUGONG",
    "tagline": "Quà handmade theo cách riêng của bạn.",
    "description": "Thiết kế riêng, ý nghĩa riêng. Mỗi món quà là một câu chuyện.",
    "about": "SUGONG bắt đầu từ tình yêu với những món quà nhỏ nhưng mang nhiều ý nghĩa. Mỗi sản phẩm được làm thủ công tỉ mỉ, chọn lựa kỹ lưỡng từ chất liệu đến từng chi tiết.",
    "channels": {
      "tiktok": "@sugongbychungminh23",
      "instagram": "@sugongbychungminh",
      "zalo": "Chat với SUGONG"
    }
  },
  "categories": [
    {
      "name": "Túi handmade",
      "image": "assets/categories/bag.jpg"
    },
    {
      "name": "Scrunchie",
      "image": "assets/categories/scrunchie.jpg"
    },
    {
      "name": "Quà tặng",
      "image": "assets/categories/giftbox.jpg"
    },
    {
      "name": "Custom",
      "image": "assets/categories/custom.jpg"
    }
  ],
  "products": [
    {
      "id": "bag-lavender",
      "name": "Túi tote hoa nhí tím",
      "price": "390.000đ",
      "category": "Túi handmade",
      "customizable": true,
      "short_description": "Túi tote handmade nhẹ nhàng với họa tiết hoa tím.",
      "images": [
        "assets/products/bag-lavender-01.jpg",
        "assets/products/bag-lavender-02.jpg",
        "assets/products/bag-lavender-detail.jpg"
      ],
      "video": "assets/videos/bag-lavender.mp4"
    },
    {
      "id": "scrunchie-pastel",
      "name": "Scrunchie lụa pastel",
      "price": "89.000đ",
      "category": "Scrunchie",
      "customizable": false,
      "short_description": "Bộ scrunchie pastel mềm mại, nữ tính.",
      "images": [
        "assets/products/scrunchie-pastel.jpg"
      ]
    },
    {
      "id": "giftbox-bear",
      "name": "Hộp quà gấu bông hoa nhí",
      "price": "520.000đ",
      "category": "Quà tặng",
      "customizable": true,
      "short_description": "Hộp quà handmade với gấu bông và phụ kiện phối màu.",
      "images": [
        "assets/products/giftbox-bear.jpg"
      ]
    },
    {
      "id": "graduation-gift",
      "name": "Set tốt nghiệp handmade",
      "price": "490.000đ",
      "category": "Quà tặng",
      "customizable": true,
      "short_description": "Set quà tốt nghiệp thiết kế riêng theo yêu cầu.",
      "images": [
        "assets/products/graduation-gift.jpg"
      ]
    },
    {
      "id": "custom-keychain",
      "name": "Móc khóa custom tên",
      "price": "Liên hệ",
      "category": "Custom",
      "customizable": true,
      "short_description": "Móc khóa thêu tên và biểu tượng theo yêu cầu.",
      "images": [
        "assets/products/custom-keychain.jpg"
      ]
    },
    {
      "id": "custom-pouch",
      "name": "Túi thêu tên custom",
      "price": "290.000đ",
      "category": "Custom",
      "customizable": true,
      "short_description": "Túi nhỏ thêu tên, chọn màu chỉ và họa tiết.",
      "images": [
        "assets/products/custom-pouch.jpg"
      ]
    }
  ],
  "custom_process": [
    "Chọn sản phẩm",
    "Gửi ý tưởng",
    "Xác nhận thiết kế",
    "Nhận thành phẩm"
  ],
  "testimonials": [
    {
      "name": "Thu Trang",
      "text": "Túi xinh, hình thật giống ảnh và đóng gói rất cẩn thận."
    },
    {
      "name": "Minh Anh",
      "text": "Set tốt nghiệp handmade chỉn chu và bạn mình rất thích."
    },
    {
      "name": "Quỳnh Như",
      "text": "Hộp quà dễ thương, đúng phong cách nhẹ nhàng mình cần."
    }
  ]
}

# MASTER PROMPT — SUGONG WEBSITE UI

Bạn là một Senior UI/UX Designer và Art Director chuyên thiết kế website product showcase cho thương hiệu handmade.

Hãy thiết kế website cho thương hiệu **SUGONG**, chuyên túi handmade, scrunchie, quà tặng và sản phẩm custom.

## Mục tiêu
- Tạo cảm giác hiện đại, tối giản, nữ tính, nhẹ nhàng.
- Nền chủ đạo tím pastel nhưng không phủ tím quá nhiều lên ảnh.
- Sản phẩm phải là trung tâm quan sát.
- Trải nghiệm xem sản phẩm có cảm giác gần giống TikTok: ảnh/video lớn, trực quan, ít chữ.
- Không thiết kế một landing page quá dài và dàn trải.
- Chia website thành các page nhỏ liên kết rõ ràng.

## Design system bắt buộc
- Nền chính: #F8F5FC
- Nền section: #EFE8F8
- Card: #FFFDFF
- Primary: #8D6CAF
- Primary dark: #604A7C
- Text chính: #30283A
- Text phụ: #71657D
- Border: #E4DAEF
- Heading: Playfair Display hoặc Cormorant Garamond
- Body: Be Vietnam Pro hoặc Inter
- Card radius: 18px
- Button radius: 12px
- Shadow rất nhẹ
- Max content width: 1280px
- Khoảng cách section lớn, nhiều whitespace

## Hình ảnh
- Dùng ảnh thật hoặc realistic product photography.
- Chủ đề ảnh: túi hoa nhí tím, scrunchie pastel, hộp quà gấu bông, móc khóa thêu tên, set tốt nghiệp handmade.
- Ánh sáng tự nhiên, mềm, nền sáng và tối giản.
- Video dọc dùng tỷ lệ 9:16.
- Không dùng ảnh stock xa lạ với handmade.

## Header chung
- Logo SUGONG bên trái.
- Menu: Sản phẩm, Custom, TikTok, Về SUGONG.
- Nút CTA duy nhất nổi bật: Đặt hàng.
- Header mỏng, sticky, không dùng mega menu.

## Quy tắc layout chung
- Mỗi page chỉ nên có 3-5 section chính.
- Không lặp lại quá nhiều card hoặc CTA.
- Desktop ưu tiên grid 3 cột để ảnh đủ lớn.
- Mobile ưu tiên ảnh và CTA, giảm trang trí.
- Footer đơn giản và đồng nhất trên toàn bộ website.

## Nội dung thương hiệu
- Tagline: “Quà handmade theo cách riêng của bạn.”
- Supporting text: “Thiết kế riêng, ý nghĩa riêng. Mỗi món quà là một câu chuyện.”
- CTA chính: “Đặt hàng qua Zalo”
- CTA phụ: “Xem sản phẩm”

## Yêu cầu đầu ra
Tạo một mockup website hoàn chỉnh, polished, có tính khả thi để triển khai thật. Không làm wireframe. Không làm giao diện quá nhiều chi tiết. Giữ nhận diện nhất quán giữa các page.


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


# KIẾN TRÚC DỰ ÁN

Không áp dụng Clean Architecture backend một cách máy móc cho frontend. Dùng **feature-based modular architecture** để tách page, section, component và dữ liệu rõ ràng.

## Cấu trúc thư mục

```text
src/
├── assets/
│   ├── brand/
│   ├── products/
│   └── social/
├── components/
│   ├── ui/
│   ├── product/
│   ├── custom/
│   └── social/
├── content/
│   └── products/
├── features/
│   ├── product-filter/
│   ├── product-search/
│   └── mobile-navigation/
├── layouts/
│   ├── BaseLayout.astro
│   └── ProductLayout.astro
├── pages/
│   ├── index.astro
│   ├── products/
│   │   ├── index.astro
│   │   └── [slug].astro
│   ├── custom.astro
│   └── about.astro
├── sections/
│   ├── home/
│   ├── products/
│   ├── product-detail/
│   ├── custom/
│   └── about/
├── styles/
│   ├── global.css
│   └── theme.css
├── lib/
│   ├── products.ts
│   ├── seo.ts
│   └── cn.ts
└── content.config.ts
```

## Quy tắc phụ thuộc

```text
pages -> sections -> components/features -> lib/content
```

- `pages`: chỉ tổ chức page và truyền data, không chứa UI dài.
- `sections`: section riêng của từng page.
- `features`: phần có tương tác hoặc nghiệp vụ UI rõ ràng.
- `components/ui`: component nhỏ, tái sử dụng, không biết dữ liệu sản phẩm.
- `components/product`: component dùng chung trong domain sản phẩm.
- `content`: dữ liệu sản phẩm.
- `lib`: hàm dùng chung, không chứa UI.

## Giới hạn kích thước
- Một page file tối đa khoảng 120 dòng.
- Một section tối đa khoảng 180 dòng.
- Một component chỉ có một trách nhiệm chính.
- Khi component có hơn 8 props, xem xét tách hoặc gom thành object có type.

## Route mapping
- `/` → Trang chủ.
- `/products` → Danh sách sản phẩm.
- `/products/[slug]` → Chi tiết sản phẩm.
- `/custom` → Nhận custom.
- `/about` → Về SUGONG / TikTok.


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


# MASTER IMPLEMENTATION PROMPT — SUGONG

Bạn là Senior Frontend Engineer phụ trách triển khai website SUGONG từ bộ layout và design system có sẵn.

## Mục tiêu kỹ thuật
- Dùng Astro-first architecture để tạo website nhẹ, nhanh và dễ bảo trì.
- Dùng React chỉ cho interactive islands.
- Dùng Tailwind CSS theo design token để tránh CSS chồng chéo.
- Tách page, section, feature, component và content rõ ràng.
- Không tạo một page dài chứa toàn bộ component và data.

## Stack bắt buộc
- Astro 6.
- TypeScript strict.
- React islands.
- Tailwind CSS 4.
- Astro Content Collections.
- Astro Image.
- Storybook.
- Playwright.
- pnpm.

## Nguồn đầu vào bắt buộc đọc trước khi code
- `design-system.json`
- `content-model.json`
- `master-prompt.md`
- `page-prompts.md`
- `tech-stack.md`
- `architecture.md`
- `coding-rules.md`

## Quy trình triển khai bắt buộc
1. Đọc toàn bộ input và tóm tắt phạm vi page đang làm.
2. Liệt kê file sẽ tạo hoặc sửa.
3. Tạo component dùng chung trước.
4. Tạo section riêng cho page.
5. Ghép section tại file page; page không chứa markup dài.
6. Dùng dữ liệu từ Content Collections, không hard-code sản phẩm trong page.
7. Chỉ thêm React island khi phần đó cần state hoặc tương tác thật.
8. Kiểm tra responsive.
9. Chạy lint, type-check, build và test.
10. Báo cáo ngắn file đã tạo và điều còn chưa làm.

## Ràng buộc nghiêm ngặt
- Không dùng Redux, Zustand hoặc global state library.
- Không dùng UI framework lớn.
- Không dùng Sass/Less.
- Không dùng `!important`.
- Không tạo CSS global cho component.
- Không nhồi toàn bộ website vào `index.astro`.
- Không tự ý thêm giỏ hàng, đăng nhập, thanh toán hoặc backend.
- Không tự ý mở rộng ngoài layout đã duyệt.


# CURRENT IMPLEMENTATION TASK
## STEP 5 — VỀ SUGONG `/about`
Triển khai đúng layout Page 5.

Tách thành:
- `BrandStory.astro`
- `TikTokHighlights.astro`
- `Testimonials.astro`
- `SocialContact.astro`

TikTok card mặc định dùng poster ảnh, không load ba video thật cùng lúc.

---

