# BACKEND-READY IMPLEMENTATION PROMPT — SUGONG

Bạn là Senior Frontend Engineer. Hãy nâng cấp dự án SUGONG hiện tại để dữ liệu sản phẩm có thể chạy local ngay bây giờ và chuyển sang backend API trong tương lai mà không phải viết lại UI.

## Phạm vi hiện tại

- Chưa có backend.
- Website phải chạy hoàn toàn bằng local product data.
- Không thêm dashboard quản trị.
- Không thêm đăng nhập.
- Không thêm giỏ hàng hoặc thanh toán.
- Phải chuẩn bị sẵn kiến trúc để thay local repository bằng API repository.

## Stack bắt buộc

- Astro 6.
- TypeScript strict.
- React islands.
- Tailwind CSS 4.
- Zod.
- Astro Content Collections.
- TanStack Query chỉ ở feature cần client-side server state.
- openapi-typescript và openapi-fetch cho API tương lai.
- MSW cho mock API.
- Vitest và Playwright.
- pnpm.

## Công việc bắt buộc

### 1. Tạo domain layer

Tạo:

```text
src/domain/product/product.types.ts
src/domain/product/product.schema.ts
src/domain/product/product.repository.ts
src/domain/product/product.mapper.ts
```

Domain model không phụ thuộc trực tiếp vào Astro Content Collection hoặc API response.

### 2. Tạo local data adapter

Tạo:

```text
src/data/local/local-product.repository.ts
```

Repository này đọc dữ liệu từ Content Collections và implement `ProductRepository`.

### 3. Tạo API adapter skeleton

Tạo:

```text
src/data/api/api-client.ts
src/data/api/api-product.repository.ts
src/data/api/generated/api-types.ts
```

Hiện tại API repository có thể là skeleton hoặc dùng mock API, nhưng phải implement cùng interface.

### 4. Tạo repository factory

Tạo factory chọn data source theo env:

```env
PUBLIC_DATA_SOURCE=local
PUBLIC_API_BASE_URL=http://localhost:3000
```

Mặc định luôn là local.

### 5. Tạo service layer

Tạo:

```text
src/services/product.service.ts
```

Page và section gọi service, không gọi repository trực tiếp nếu có logic tổ hợp.

### 6. Refactor page

- Trang chủ lấy featured products qua service.
- `/products` lấy product list qua service.
- `/products/[slug]` lấy product detail qua service.
- ProductCard chỉ nhận props, không tự fetch.
- Search/filter client-side dùng TanStack Query chỉ khi cần.

### 7. Tạo mock API

Dùng MSW để mock các endpoint:

```text
GET /api/v1/products
GET /api/v1/products/:slug
```

Mock response phải giống API contract guideline.

### 8. Test

- Unit test LocalProductRepository.
- Unit test mapper.
- Test ApiProductRepository với MSW.
- Playwright test sản phẩm hiển thị từ local mode.
- Bảo đảm đổi env sang api mode không yêu cầu sửa UI.

## Quy tắc nghiêm ngặt

- UI không gọi `fetch` trực tiếp.
- Không dùng Axios nếu openapi-fetch đã đáp ứng.
- Không duplicate Product type ở nhiều nơi.
- Không hard-code API base URL.
- Không để API response đi thẳng vào component.
- Không thêm global state library.
- Không tự ý triển khai backend.

## Acceptance criteria

- Website vẫn chạy local bình thường.
- Data source có thể đổi qua env.
- Product repository có ít nhất local và API implementation.
- UI không phụ thuộc nguồn dữ liệu.
- Build, type-check và test thành công.
