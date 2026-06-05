# BACKEND-READY GUIDE

## Hiện tại

```text
Astro page
  -> ProductService
  -> ProductRepository
  -> LocalProductRepository
  -> Astro Content Collections
```

## Tương lai

```text
Astro page / React island
  -> ProductService
  -> ProductRepository
  -> ApiProductRepository
  -> Backend REST API
```

## Điều không thay đổi khi thêm backend

- ProductCard
- ProductGrid
- Layout từng page
- Design system
- Phần lớn section
- Domain Product model
- ProductService public methods

## Điều cần thay đổi khi backend sẵn sàng

1. Backend cung cấp OpenAPI contract.
2. Generate API types.
3. Hoàn thiện ApiProductRepository.
4. Cấu hình biến môi trường:
   ```env
   PUBLIC_DATA_SOURCE=api
   PUBLIC_API_BASE_URL=https://api.example.com
   ```
5. Chuyển các route cần dữ liệu mới sang server/on-demand rendering nếu cần.
