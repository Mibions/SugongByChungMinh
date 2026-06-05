# FRONTEND DATA STRATEGY — LOCAL NOW, API LATER

## Stack frontend được chốt

- Astro 6.
- TypeScript strict.
- React islands cho phần tương tác.
- Tailwind CSS 4.
- Zod để validate dữ liệu.
- TanStack Query cho server state khi bắt đầu gọi backend.
- openapi-typescript + openapi-fetch để tạo type-safe API client từ OpenAPI.
- MSW để mock API trong lúc backend chưa có.
- Playwright cho end-to-end test.
- Vitest cho unit test.
- pnpm.

## Tại sao giữ Astro

Website SUGONG vẫn chủ yếu là product showcase. Astro tiếp tục phù hợp vì:

- Page tĩnh và nội dung vẫn nhẹ.
- Có thể render dữ liệu local ở hiện tại.
- Có thể gọi API ở build time, server time hoặc client time trong tương lai.
- Có thể chuyển một số route sang on-demand rendering khi sản phẩm cần cập nhật mới mà không rebuild toàn site.

## Kiến trúc dữ liệu bắt buộc

```text
src/
├── domain/
│   └── product/
│       ├── product.types.ts
│       ├── product.schema.ts
│       ├── product.repository.ts
│       └── product.mapper.ts
├── data/
│   ├── local/
│   │   └── local-product.repository.ts
│   ├── api/
│   │   ├── api-client.ts
│   │   ├── api-product.repository.ts
│   │   └── generated/
│   │       └── api-types.ts
│   └── mocks/
│       ├── handlers.ts
│       └── browser.ts
├── services/
│   └── product.service.ts
├── content/
│   └── products/
├── features/
│   └── product-search/
├── pages/
└── components/
```

## Quy tắc phụ thuộc

```text
components/pages
      ↓
services
      ↓
repository interface
      ↓
local repository | api repository
```

Không được phép:

```text
ProductCard -> fetch('/api/products')
Page -> axios.get(...)
Component -> đọc trực tiếp JSON file
```

## Domain model

Frontend phải có model riêng, không phụ thuộc trực tiếp vào response backend.

Ví dụ:

```ts
export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number | null;
  formattedPrice: string;
  category: ProductCategory;
  shortDescription: string;
  images: ProductImage[];
  videoUrl?: string;
  customizable: boolean;
  published: boolean;
};
```

Backend có thể đổi tên field hoặc response shape, nhưng mapper sẽ chuyển về `Product`.

## Repository interface

```ts
export interface ProductRepository {
  getAll(input?: ProductQuery): Promise<Product[]>;
  getBySlug(slug: string): Promise<Product | null>;
  getFeatured(limit?: number): Promise<Product[]>;
  getRelated(productId: string, limit?: number): Promise<Product[]>;
}
```

## Hiện tại: local mode

Dùng:

```text
LocalProductRepository
```

Nguồn dữ liệu có thể là:

- Astro Content Collections.
- JSON local.
- Markdown/MDX product files.

Biến môi trường:

```env
PUBLIC_DATA_SOURCE=local
```

## Tương lai: API mode

Dùng:

```text
ApiProductRepository
```

Biến môi trường:

```env
PUBLIC_DATA_SOURCE=api
PUBLIC_API_BASE_URL=https://api.example.com
```

Một factory chịu trách nhiệm chọn repository:

```ts
export function createProductRepository(): ProductRepository {
  return import.meta.env.PUBLIC_DATA_SOURCE === "api"
    ? new ApiProductRepository()
    : new LocalProductRepository();
}
```

UI không biết repository nào đang được dùng.

## Khi nào dùng TanStack Query

Chỉ dùng TanStack Query cho những phần client-side cần:

- Search sản phẩm không reload trang.
- Filter sản phẩm.
- Load thêm sản phẩm.
- Dữ liệu thay đổi thường xuyên.
- Wishlist hoặc trạng thái người dùng trong tương lai.

Không bọc toàn bộ website bằng QueryClient nếu chưa cần.

## Khi nào dùng Astro server rendering

Dùng on-demand rendering cho các route cần dữ liệu mới từ backend mỗi lần truy cập:

- `/products`
- `/products/[slug]`

Trang tĩnh như `/about` và `/custom` vẫn có thể prerender.

## Cache strategy tương lai

- Product list: cache ngắn.
- Product detail: cache theo slug.
- Ảnh sản phẩm: CDN cache dài.
- Không cache dữ liệu quản trị riêng tư ở frontend public.
- Backend phải quyết định quyền truy cập; frontend không phải lớp bảo mật.

## Migration path

### Giai đoạn 1 — Local
- Content Collections.
- LocalProductRepository.
- Không cần backend.
- Không cần TanStack Query ở hầu hết page.

### Giai đoạn 2 — Mock API
- Dùng MSW.
- Giữ nguyên UI.
- Test ApiProductRepository bằng mock response.

### Giai đoạn 3 — Backend thật
- Backend cung cấp OpenAPI.
- Generate TypeScript types.
- Bật ApiProductRepository bằng env.
- Chuyển route cần thiết sang on-demand rendering.

### Giai đoạn 4 — Quản trị sản phẩm
- Backend/admin quản lý sản phẩm.
- Frontend public chỉ đọc dữ liệu.
- Có thể thêm webhook/revalidation hoặc SSR tùy tần suất cập nhật.
