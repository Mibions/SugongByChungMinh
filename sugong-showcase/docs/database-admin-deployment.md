# Database and admin deployment

The public catalogue remains on GitHub Pages. The same repository is deployed to
Vercel to host `/admin` and the `/api/admin/*` serverless functions.

## 1. Supabase

1. Create a Supabase PostgreSQL project.
2. Copy the pooled PostgreSQL connection string.
3. Create a local `.env` from `.env.example`.
4. Run:

```powershell
pnpm db:migrate
pnpm db:seed
pnpm admin:token
```

Store the generated plaintext token in a password manager. Store only the
generated `scrypt$...` value as `ADMIN_TOKEN_HASH`.

## 2. Vercel project

Create a Vercel project with `sugong-showcase` as the project root and configure:

- `DATABASE_URL`
- `DATA_SOURCE=database`
- `ADMIN_TOKEN_HASH`
- `ADMIN_SESSION_TTL_HOURS=8`
- `ADMIN_ALLOWED_ORIGIN=https://<vercel-domain>`
- `PUBLIC_ADMIN_URL=https://<vercel-domain>/admin`
- `PUBLIC_CLOUDINARY_CLOUD_NAME`
- `PUBLIC_CLOUDINARY_ASSET_FOLDER`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `GITHUB_REBUILD_TOKEN`
- `GITHUB_REPOSITORY=Mibions/SugongByChungMinh`
- `GITHUB_WORKFLOW_FILE=deploy.yml`

`GITHUB_REBUILD_TOKEN` should be a fine-grained token limited to this repository
with Actions write permission. Do not expose it as a `PUBLIC_*` variable.

The Vercel deployment also renders the public site, but the canonical public
site remains GitHub Pages. Admin users must use the Vercel `/admin` URL so the
secure same-origin session cookie works.

## 3. GitHub repository settings

Add the following Actions secret:

- `DATABASE_URL`

Add the following Actions variables:

- `PUBLIC_ADMIN_URL`
- `PUBLIC_CLOUDINARY_CLOUD_NAME`
- `PUBLIC_CLOUDINARY_ASSET_FOLDER`

If `DATABASE_URL` is absent, the workflow deliberately falls back to local seed
data so the existing GitHub Pages deployment does not break during setup.

## 4. Publishing flow

1. Admin mutates or imports catalogue data on Vercel.
2. The mutation is committed to PostgreSQL.
3. Vercel dispatches the GitHub Pages workflow.
4. GitHub Actions reads PostgreSQL during the Astro build.
5. Existing product URLs and SEO-friendly static pages are regenerated.

The public update is eventually consistent and normally appears after the
GitHub Pages workflow finishes.

## 5. Import format

Use `public/admin/product-import-template.csv` as the template. CSV and XLSX are
supported. Limits:

- 3 MB per file
- 100 product rows
- 8 image URLs per product
- image URLs must be publicly reachable

The admin previews and validates every row before import. In `upsert` mode,
existing products are matched by slug. Remote images are copied into Cloudinary
before product media records are saved.

## 6. Security notes

- Never put the master token, database URL, Cloudinary secret, or GitHub token
  in `PUBLIC_*` variables.
- Rotate the master token immediately if it is ever pasted into logs or chat.
- Admin sessions are random, revocable, stored hashed, and delivered through
  `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
- Login attempts are rate-limited and temporarily blocked after repeated
  failures.
- Mutations validate same-origin requests and a CSRF token.
- Product changes, login, logout, import, upload signing, and rebuild requests
  are written to `admin_audit_logs`.
