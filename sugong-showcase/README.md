# SUGONG Showcase

Website catalogue cho SUGONG: trình bày sản phẩm handmade, collection, gallery và video; không có giỏ hàng hay thanh toán. Public site được build tĩnh bằng Astro và deploy qua GitHub Pages. Vercel cung cấp trang quản trị cùng serverless API, Supabase PostgreSQL lưu catalogue và Cloudinary lưu media.

## Stack

- Astro 6, React 19 và TypeScript
- Tailwind CSS 4
- PostgreSQL/Supabase, Drizzle ORM
- Cloudinary
- Vercel Functions
- Playwright

Yêu cầu Node.js 22 và pnpm 10.

## Chạy local

```powershell
pnpm install
Copy-Item .env.example .env
pnpm dev
```

Mặc định `DATA_SOURCE=local`, frontend dùng 17 record mẫu trong `src/data/local` và không cần database. Mở `http://localhost:4321`.

Để kiểm tra:

```powershell
pnpm check
pnpm check:server
pnpm test:e2e
pnpm build
```

## Khởi tạo database và admin

1. Tạo Supabase PostgreSQL và Cloudinary.
2. Điền biến môi trường trong `.env`.
3. Chạy migration, seed và tạo token:

```powershell
pnpm db:migrate
pnpm db:seed
pnpm admin:token
```

Lưu plaintext token trong password manager. Chỉ lưu chuỗi `scrypt$...` sinh ra vào `ADMIN_TOKEN_HASH`; không commit token, database URL hoặc Cloudinary secret.

Đặt `DATA_SOURCE=database`, chạy lại `pnpm dev`, sau đó mở `/admin`. Seed có tính idempotent: chạy lại sẽ cập nhật catalogue mẫu theo `slug`/`legacyId`, không tạo record trùng. Không tự động chạy seed khi deploy vì có thể ghi đè nội dung đã chỉnh trong admin.

## Biến môi trường

| Biến | Phạm vi | Mục đích |
| --- | --- | --- |
| `DATA_SOURCE` | build/server | `local` hoặc `database` |
| `DATABASE_URL` | private | PostgreSQL connection string |
| `PUBLIC_ADMIN_URL` | public | URL trang admin trên Vercel |
| `PUBLIC_CLOUDINARY_CLOUD_NAME` | public | Cloudinary cloud name |
| `PUBLIC_CLOUDINARY_ASSET_FOLDER` | public | Folder media mặc định |
| `CLOUDINARY_API_KEY` | private | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | private | Cloudinary API secret |
| `ADMIN_TOKEN_HASH` | private | Hash scrypt của master token |
| `ADMIN_SESSION_TTL_HOURS` | private | Thời hạn session admin |
| `ADMIN_ALLOWED_ORIGIN` | private | Origin được phép gọi admin API |
| `GITHUB_REBUILD_TOKEN` | private | Fine-grained token kích hoạt Actions |
| `GITHUB_REPOSITORY` | private | Repository `owner/name` |
| `GITHUB_WORKFLOW_FILE` | private | Workflow deploy GitHub Pages |

Xem cấu hình deploy chi tiết tại [docs/database-admin-deployment.md](docs/database-admin-deployment.md).

## Luồng dữ liệu

```text
Admin (Vercel)
  -> /api/admin/*
  -> Supabase PostgreSQL
  -> trigger GitHub Actions
  -> Astro đọc database lúc build
  -> GitHub Pages
```

- `DATA_SOURCE=database`: public repository đọc PostgreSQL.
- `DATA_SOURCE=local`: dùng record mẫu làm fallback và dữ liệu đầu vào cho seed.
- Mọi loại sản phẩm dùng chung contract `Product`; category, product type, classification, tone và attribute mở rộng từ database.
- Ảnh upload/import được đưa lên Cloudinary, database chỉ lưu URL, public ID và metadata.

## Tổ chức source

```text
src/
├─ components/        UI và product components dùng lại
├─ content/site.ts    brand, navigation và nội dung trình bày tĩnh
├─ data/local/        catalogue record mẫu/fallback
├─ domain/product/    contract, schema, taxonomy và helper sản phẩm
├─ layouts/           layout public/admin
├─ lib/               utility và điểm truy cập catalogue
├─ pages/             route Astro và JSON API public
├─ sections/          section theo page/feature
└─ server/            auth, database, admin service và integrations
api/                  Vercel admin function
drizzle/              migration SQL
scripts/              migrate, seed, token và Cloudinary sync
tests/                Playwright E2E
```

### Cập nhật nội dung

- Brand, menu, category card, trust item, testimonial và TikTok highlight: `src/content/site.ts`.
- Product mẫu/fallback: `src/data/local/*.ts`; tất cả record đi qua `createSeedProduct`.
- Metadata category/tone dùng ở public UI và seed: `src/domain/product/product-taxonomy.ts`.
- Catalogue thật: quản lý qua `/admin`; tránh thêm category/type/tone trực tiếp trong component.
- Media public duy nhất nằm trong `public/assets`; không tạo thêm thư mục asset song song ở project root.

## Admin

Admin tách riêng các phần:

- Sản phẩm và media
- Danh mục
- Loại sản phẩm
- Nhóm/value phân loại
- Định nghĩa thuộc tính
- Template
- Collection
- Import CSV/XLSX

File import mẫu: `public/admin/product-import-template.csv`. Giới hạn hiện tại là 3 MB, 100 record và 8 ảnh cho mỗi sản phẩm.

## Deploy

- GitHub Pages build public site từ workflow `.github/workflows/deploy.yml`.
- Vercel dùng `vercel.json`, chạy `pnpm db:migrate:deploy` trước build.
- Migration tự chạy khi deploy; seed không tự chạy.
- Sau khi admin thay đổi dữ liệu published, hệ thống dispatch workflow để tái build public site.

## Quy ước maintain

- Không tạo model riêng cho từng loại sản phẩm; dùng `Product` + product type/attribute/classification.
- Không hardcode dữ liệu catalogue trong JSX/Astro component.
- Nội dung trình bày tĩnh là typed record trong `src/content`.
- Thêm thay đổi schema bằng migration mới, không sửa migration đã chạy production.
- Chỉ secret thực sự public mới được đặt tiền tố `PUBLIC_`.
