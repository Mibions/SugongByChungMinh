# SUGONG FRONTEND — BACKEND READY EXTENSION

Bộ này dùng để nâng cấp bộ prompt/layout SUGONG hiện tại theo hướng:

- Hiện tại chạy local, chưa cần backend.
- Tương lai có thể kết nối backend để quản lý và hiển thị sản phẩm.
- Frontend không phải viết lại toàn bộ khi chuyển từ local data sang API.
- Dữ liệu, UI và logic gọi API được tách riêng.

## Cách dùng

Copy toàn bộ file trong bộ này vào thư mục SUGONG đã giải nén trước đó.

Sau đó gửi cho coding agent theo thứ tự:

1. `frontend-data-strategy.md`
2. `api-contract-guideline.md`
3. `backend-ready-implementation-prompt.md`
4. `AGENTS-backend-ready.md`

## Nguyên tắc quan trọng

UI không được gọi API trực tiếp.

```text
UI / Page
   ↓
Service / Use case
   ↓
Repository interface
   ↓
Local repository hoặc API repository
```

Hiện tại dùng `LocalProductRepository`.

Tương lai chỉ cần đổi sang `ApiProductRepository`, phần UI gần như không đổi.
