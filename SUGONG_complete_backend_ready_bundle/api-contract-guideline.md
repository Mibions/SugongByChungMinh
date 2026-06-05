# API CONTRACT GUIDELINE

## Mục tiêu

Backend tương lai cần cung cấp contract rõ ràng để frontend gọi ổn định.

Ưu tiên OpenAPI 3.1.

## Endpoint tối thiểu

```http
GET /api/v1/products
GET /api/v1/products/{slug}
GET /api/v1/categories
GET /api/v1/products/{id}/related
```

## Query đề xuất

```http
GET /api/v1/products?
  category=bag&
  search=hoa&
  featured=true&
  page=1&
  pageSize=12&
  sort=newest
```

## Response list đề xuất

```json
{
  "items": [],
  "page": 1,
  "pageSize": 12,
  "totalItems": 42,
  "totalPages": 4
}
```

## Product response đề xuất

```json
{
  "id": "prod_001",
  "slug": "tui-tote-hoa-nhi-tim",
  "name": "Túi tote hoa nhí tím",
  "price": 390000,
  "currency": "VND",
  "category": {
    "id": "bag",
    "name": "Túi handmade"
  },
  "shortDescription": "Túi tote handmade nhẹ nhàng.",
  "description": "Nội dung chi tiết",
  "images": [
    {
      "url": "https://cdn.example.com/products/bag-01.webp",
      "alt": "Túi tote hoa nhí tím",
      "width": 1200,
      "height": 900,
      "sortOrder": 1
    }
  ],
  "videoUrl": null,
  "customizable": true,
  "featured": true,
  "published": true,
  "updatedAt": "2026-06-05T10:00:00Z"
}
```

## Contract rules

- Backend trả ID ổn định.
- Dùng slug cho URL public.
- Giá trả dạng number, không trả chuỗi đã format.
- Image phải có `alt`, `width`, `height`.
- Không trả field nội bộ không cần thiết.
- List endpoint bắt buộc có pagination.
- Search/filter/sort thực hiện ở backend khi dữ liệu lớn.
- API version bắt đầu bằng `/api/v1`.
- Error response phải nhất quán.

## Error response đề xuất

```json
{
  "code": "PRODUCT_NOT_FOUND",
  "message": "Product was not found",
  "details": null,
  "traceId": "..."
}
```

## OpenAPI workflow

```text
Backend OpenAPI schema
        ↓
openapi-typescript
        ↓
generated/api-types.ts
        ↓
openapi-fetch client
        ↓
ApiProductRepository
        ↓
Product mapper
        ↓
Frontend domain model
```

Không sửa file generated bằng tay.
