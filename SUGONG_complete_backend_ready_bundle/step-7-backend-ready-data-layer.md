# STEP 7 — BACKEND-READY DATA LAYER

Hãy refactor dự án SUGONG hiện tại để hỗ trợ hai nguồn dữ liệu:

- `local`: dùng ngay trong hiện tại.
- `api`: dùng trong tương lai khi backend tồn tại.

Đọc bắt buộc:
- `frontend-data-strategy.md`
- `api-contract-guideline.md`
- `backend-ready-implementation-prompt.md`
- `AGENTS-backend-ready.md`
- thư mục `starter-skeleton/`

Thực hiện:
1. Tạo domain model, repository interface và mapper.
2. Tạo LocalProductRepository đọc từ Astro Content Collections.
3. Tạo ApiProductRepository theo API contract.
4. Tạo repository factory chọn nguồn dữ liệu theo env.
5. Tạo ProductService.
6. Refactor các page hiện tại để lấy dữ liệu qua service.
7. UI và component tuyệt đối không gọi `fetch` trực tiếp.
8. Thêm MSW mock cho API mode.
9. Viết test cho local repository, mapper và API repository.
10. Bảo đảm local mode vẫn chạy khi chưa có backend.

Acceptance criteria:
- `PUBLIC_DATA_SOURCE=local` chạy không cần backend.
- `PUBLIC_DATA_SOURCE=api` dùng API adapter mà không sửa UI.
- Không duplicate Product type.
- Build, type-check và test thành công.
