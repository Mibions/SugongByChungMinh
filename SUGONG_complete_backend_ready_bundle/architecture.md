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
