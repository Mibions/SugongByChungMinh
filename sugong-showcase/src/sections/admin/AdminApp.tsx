import { useEffect, useMemo, useState } from "react";
import {
  CloudUpload,
  ExternalLink,
  FileSpreadsheet,
  ImagePlus,
  LoaderCircle,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import type { AdminProductInput, AdminProductRecord } from "../../server/catalog/product-input";

type Props = {
  configuredAdminUrl: string;
};

type ImportPreview = {
  rows: Array<Record<string, unknown>>;
  errors: Array<{ row: number; message: string }>;
  totalRows: number;
};

const categories = [
  ["bag", "Túi handmade"],
  ["scrunchie", "Scrunchie"],
  ["gift", "Quà tặng"],
  ["custom", "Custom"],
  ["graduation", "Tốt nghiệp"],
] as const;
const toneOptions = ["orange", "pink", "cream", "lavender", "blue", "green", "lilac", "neutral"] as const;

function emptyProduct(): AdminProductInput {
  return {
    slug: "",
    name: "",
    priceAmount: null,
    category: "bag",
    shortDescription: "",
    description: "",
    detailNote: "",
    videoUrl: "",
    status: "draft",
    isFeatured: false,
    isCustomizable: false,
    displayOrder: 0,
    tags: [],
    tones: ["neutral"],
    media: [],
    attributes: [],
  };
}

function getCookie(name: string) {
  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function readFileBase64(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary);
}

export function AdminApp({ configuredAdminUrl }: Props) {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [token, setToken] = useState("");
  const [products, setProducts] = useState<AdminProductRecord[]>([]);
  const [editing, setEditing] = useState<AdminProductInput | AdminProductRecord | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [importFileName, setImportFileName] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importMode, setImportMode] = useState<"create" | "upsert">("upsert");

  const isWrongHost = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (window.location.hostname.endsWith("github.io")) return true;
    if (!configuredAdminUrl) return false;
    try {
      return new URL(configuredAdminUrl).origin !== window.location.origin;
    } catch {
      return false;
    }
  }, [configuredAdminUrl]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi");
    if (!term) return products;
    return products.filter((product) => `${product.name} ${product.slug}`.toLocaleLowerCase("vi").includes(term));
  }, [products, search]);

  async function api<T>(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    if (init.body) headers.set("content-type", "application/json");
    const csrf = csrfToken || decodeURIComponent(getCookie("sugong_admin_csrf") ?? "");
    if (csrf && init.method && init.method !== "GET") headers.set("x-csrf-token", csrf);
    const response = await fetch(`/api/admin/${path}`, { ...init, headers, credentials: "same-origin" });
    const body = (await response.json()) as T & { message?: string };
    if (!response.ok) throw new Error(body.message ?? `Request failed (${response.status})`);
    return body;
  }

  async function loadProducts() {
    const response = await api<{ items: AdminProductRecord[] }>("products");
    setProducts(response.items);
  }

  useEffect(() => {
    if (isWrongHost) {
      setCheckingSession(false);
      return;
    }

    api<{ authenticated: boolean; csrfToken?: string }>("session")
      .then(async (session) => {
        setAuthenticated(session.authenticated);
        if (session.csrfToken) setCsrfToken(session.csrfToken);
        if (session.authenticated) await loadProducts();
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setCheckingSession(false));
  }, [isWrongHost]);

  async function login(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await api<{ ok: boolean; csrfToken: string }>("login", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setCsrfToken(result.csrfToken);
      setAuthenticated(true);
      setToken("");
      await loadProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await api("logout", { method: "POST" });
      setAuthenticated(false);
      setProducts([]);
      setEditing(null);
      setCsrfToken("");
    } finally {
      setBusy(false);
    }
  }

  async function saveProduct(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setMessage("");
    try {
      const isUpdate = "id" in editing && Boolean(editing.id);
      const response = await api<{ item: AdminProductRecord; rebuild?: { triggered: boolean; reason?: string } }>(
        isUpdate ? `products/${editing.id}` : "products",
        { method: isUpdate ? "PUT" : "POST", body: JSON.stringify(editing) },
      );
      setMessage(
        response.rebuild?.triggered
          ? "Đã lưu. GitHub Pages đang được rebuild."
          : `Đã lưu dữ liệu.${response.rebuild?.reason ? ` ${response.rebuild.reason}` : ""}`,
      );
      setEditing(response.item);
      await loadProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(product: AdminProductRecord) {
    if (!window.confirm(`Xóa sản phẩm “${product.name}”? Ảnh Cloudinary liên quan cũng sẽ được dọn.`)) return;
    setBusy(true);
    try {
      await api(`products/${product.id}`, { method: "DELETE" });
      setEditing(null);
      setMessage("Đã xóa sản phẩm và yêu cầu rebuild frontend.");
      await loadProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function uploadImages(files: FileList | null) {
    if (!editing || !files?.length) return;
    setBusy(true);
    setMessage("");
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name}: chỉ nhận ảnh tối đa 10 MB`);
        }
        const signed = await api<{
          cloudName: string;
          apiKey: string;
          signature: string;
          timestamp: number;
          folder: string;
          overwrite: boolean;
          unique_filename: boolean;
          use_filename: boolean;
        }>("cloudinary-signature", {
          method: "POST",
          body: JSON.stringify({ productId: "id" in editing ? editing.id : undefined }),
        });
        const form = new FormData();
        form.set("file", file);
        form.set("api_key", signed.apiKey);
        form.set("signature", signed.signature);
        form.set("timestamp", String(signed.timestamp));
        form.set("folder", signed.folder);
        form.set("overwrite", String(signed.overwrite));
        form.set("unique_filename", String(signed.unique_filename));
        form.set("use_filename", String(signed.use_filename));
        const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
          method: "POST",
          body: form,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message ?? `Không thể upload ${file.name}`);
        uploaded.push({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          format: result.format,
          width: result.width,
          height: result.height,
          alt: editing.name || file.name,
          position: editing.media.length + uploaded.length,
          isCover: editing.media.length === 0 && uploaded.length === 0,
        });
      }
      setEditing({ ...editing, media: [...editing.media, ...uploaded] });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function previewImport(file: File) {
    setBusy(true);
    setMessage("");
    try {
      const preview = await api<ImportPreview>("import-preview", {
        method: "POST",
        body: JSON.stringify({ fileName: file.name, contentBase64: await readFileBase64(file) }),
      });
      setImportFileName(file.name);
      setImportPreview(preview);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function commitImport() {
    if (!importPreview || importPreview.errors.length > 0) return;
    setBusy(true);
    try {
      let successRows = 0;
      let failedRows = 0;
      for (const [index, row] of importPreview.rows.entries()) {
        const result = await api<{ successRows: number; failedRows: number }>("import-commit", {
          method: "POST",
          body: JSON.stringify({
            fileName: importFileName,
            rows: [row],
            mode: importMode,
            triggerRebuild: index === importPreview.rows.length - 1,
          }),
        });
        successRows += result.successRows;
        failedRows += result.failedRows;
      }
      setMessage(`Import xong: ${successRows} thành công, ${failedRows} lỗi.`);
      setImportPreview(null);
      await loadProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  if (isWrongHost) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="w-full max-w-lg rounded-[24px] bg-background-card p-8 shadow-feather ring-1 ring-border">
          <ShieldCheck className="text-primary-dark" size={36} aria-hidden="true" />
          <h1 className="mt-5 font-heading text-3xl text-primary-dark">Admin chạy trên server riêng</h1>
          <p className="mt-3 leading-7 text-text-secondary">
            GitHub Pages chỉ phục vụ frontend tĩnh. Hãy mở admin trên Vercel để cookie bảo mật và API hoạt động đúng.
          </p>
          {configuredAdminUrl ? (
            <a className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-button bg-primary-dark px-5 text-background-card" href={configuredAdminUrl}>
              Mở trang admin <ExternalLink size={16} aria-hidden="true" />
            </a>
          ) : (
            <p className="mt-5 rounded-button bg-background-section p-4 text-sm text-primary-dark">
              Chưa cấu hình biến PUBLIC_ADMIN_URL trong GitHub Actions.
            </p>
          )}
        </div>
      </main>
    );
  }

  if (checkingSession) {
    return <main className="grid min-h-screen place-items-center"><LoaderCircle className="animate-spin text-primary-dark" /></main>;
  }

  if (!authenticated) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <form className="w-full max-w-md rounded-[24px] bg-background-card p-7 shadow-feather ring-1 ring-border" onSubmit={login}>
          <span className="grid h-12 w-12 place-items-center rounded-[16px] bg-background-section text-primary-dark">
            <ShieldCheck size={23} aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-heading text-3xl text-primary-dark">Quản trị SUGONG</h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">Nhập master token. Token không được lưu trong trình duyệt.</p>
          <label className="mt-6 block text-sm font-medium text-primary-dark" htmlFor="admin-token">Master token</label>
          <input
            id="admin-token"
            className="mt-2 min-h-12 w-full rounded-button border border-border bg-background-main px-4 outline-none focus:border-primary"
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            autoComplete="current-password"
            required
          />
          {message && <p className="mt-3 text-sm text-red-700">{message}</p>}
          <button className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-button bg-primary-dark px-5 font-medium text-background-card disabled:opacity-60" disabled={busy}>
            {busy && <LoaderCircle className="animate-spin" size={17} />} Đăng nhập an toàn
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background-main/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-4 px-5">
          <div><p className="font-heading text-xl text-primary-dark">SUGONG Admin</p><p className="text-xs text-text-secondary">Catalogue database</p></div>
          <div className="flex items-center gap-2">
            <button className="inline-flex min-h-10 items-center gap-2 rounded-button border border-border bg-background-card px-4 text-sm" onClick={() => api("rebuild", { method: "POST" }).then(() => setMessage("Đã yêu cầu rebuild GitHub Pages."))}>
              <RefreshCw size={15} /> Rebuild
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-button border border-border bg-background-card" onClick={logout} aria-label="Đăng xuất">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-6 xl:grid-cols-[350px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="rounded-[20px] bg-background-card p-4 shadow-soft ring-1 ring-border">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl text-primary-dark">Sản phẩm</h2>
              <button className="grid h-10 w-10 place-items-center rounded-button bg-primary-dark text-background-card" onClick={() => setEditing(emptyProduct())} aria-label="Thêm sản phẩm">
                <Plus size={18} />
              </button>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
              <input className="min-h-11 w-full rounded-button border border-border bg-background-main pl-10 pr-3 text-sm" placeholder="Tìm tên hoặc slug…" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <div className="scrollbar-none mt-3 max-h-[58vh] space-y-2 overflow-y-auto">
              {filteredProducts.map((product) => (
                <button
                  className={`w-full rounded-[14px] p-3 text-left transition ${"id" in (editing ?? {}) && editing?.id === product.id ? "bg-background-section ring-1 ring-primary-soft" : "hover:bg-background-main"}`}
                  onClick={() => setEditing(product)}
                  key={product.id}
                >
                  <span className="block font-medium text-primary-dark">{product.name}</span>
                  <span className="mt-1 block text-xs text-text-secondary">{product.slug} · {product.status}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] bg-background-card p-4 shadow-soft ring-1 ring-border">
            <div className="flex items-center gap-3"><FileSpreadsheet className="text-primary-dark" size={20} /><h2 className="font-heading text-xl">Import</h2></div>
            <p className="mt-2 text-xs leading-5 text-text-secondary">CSV/XLSX tối đa 3 MB và 100 dòng. Xem trước trước khi ghi database.</p>
            <a className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-primary-dark underline underline-offset-4" href="/admin/product-import-template.csv" download>
              Tải file CSV mẫu
            </a>
            <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-button border border-dashed border-primary-soft bg-background-main text-sm font-medium text-primary-dark">
              <CloudUpload size={16} /> Chọn file
              <input className="sr-only" type="file" accept=".csv,.xlsx" onChange={(event) => event.target.files?.[0] && previewImport(event.target.files[0])} />
            </label>
            {importPreview && (
              <div className="mt-4 rounded-[14px] bg-background-main p-3 text-sm">
                <p>{importPreview.totalRows} dòng · {importPreview.errors.length} lỗi</p>
                {importPreview.errors.slice(0, 4).map((error) => <p className="mt-1 text-xs text-red-700" key={`${error.row}-${error.message}`}>Dòng {error.row}: {error.message}</p>)}
                <select className="mt-3 min-h-10 w-full rounded-button border border-border bg-background-card px-3" value={importMode} onChange={(event) => setImportMode(event.target.value as "create" | "upsert")}>
                  <option value="upsert">Cập nhật theo slug</option>
                  <option value="create">Chỉ tạo mới</option>
                </select>
                <button className="mt-3 min-h-10 w-full rounded-button bg-primary-dark text-background-card disabled:opacity-50" disabled={importPreview.errors.length > 0 || busy} onClick={commitImport}>Xác nhận import</button>
              </div>
            )}
          </div>
        </aside>

        <section className="min-w-0">
          {message && <div className="mb-4 rounded-[14px] border border-primary-soft bg-background-card px-4 py-3 text-sm text-primary-dark">{message}</div>}
          {!editing ? (
            <div className="grid min-h-[520px] place-items-center rounded-[24px] border border-dashed border-primary-soft bg-background-card/50 p-8 text-center">
              <div><ImagePlus className="mx-auto text-primary-soft" size={42} /><h2 className="mt-4 font-heading text-3xl text-primary-dark">Chọn một sản phẩm</h2><p className="mt-2 text-text-secondary">Hoặc tạo sản phẩm mới để bắt đầu.</p></div>
            </div>
          ) : (
            <ProductEditor
              product={editing}
              busy={busy}
              onChange={setEditing}
              onSave={saveProduct}
              onDelete={"id" in editing ? () => deleteProduct(editing as AdminProductRecord) : undefined}
              onUpload={uploadImages}
              onClose={() => setEditing(null)}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function ProductEditor({
  product,
  busy,
  onChange,
  onSave,
  onDelete,
  onUpload,
  onClose,
}: {
  product: AdminProductInput | AdminProductRecord;
  busy: boolean;
  onChange: (product: AdminProductInput | AdminProductRecord) => void;
  onSave: (event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
  onDelete?: () => void;
  onUpload: (files: FileList | null) => void;
  onClose: () => void;
}) {
  const update = <K extends keyof AdminProductInput>(key: K, value: AdminProductInput[K]) => onChange({ ...product, [key]: value });

  return (
    <form className="rounded-[24px] bg-background-card p-5 shadow-soft ring-1 ring-border sm:p-7" onSubmit={onSave}>
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-semibold tracking-[0.12em] text-primary">PRODUCT EDITOR</p><h1 className="mt-1 font-heading text-3xl text-primary-dark">{product.name || "Sản phẩm mới"}</h1></div>
        <button className="grid h-10 w-10 place-items-center rounded-button border border-border" type="button" onClick={onClose}><X size={17} /></button>
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <Field label="Tên sản phẩm"><input value={product.name} onChange={(event) => update("name", event.target.value)} required /></Field>
        <Field label="Slug"><input value={product.slug} onChange={(event) => update("slug", event.target.value.toLowerCase())} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></Field>
        <Field label="Danh mục">
          <select value={product.category} onChange={(event) => update("category", event.target.value as AdminProductInput["category"])}>
            {categories.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </Field>
        <Field label="Giá (VND, bỏ trống = liên hệ)"><input type="number" min="0" value={product.priceAmount ?? ""} onChange={(event) => update("priceAmount", event.target.value ? Number(event.target.value) : null)} /></Field>
        <Field label="Trạng thái">
          <select value={product.status} onChange={(event) => update("status", event.target.value as AdminProductInput["status"])}>
            <option value="draft">Nháp</option><option value="published">Đã xuất bản</option><option value="hidden">Ẩn</option>
          </select>
        </Field>
        <Field label="Thứ tự"><input type="number" min="0" value={product.displayOrder} onChange={(event) => update("displayOrder", Number(event.target.value))} /></Field>
        <Field label="Mô tả ngắn" wide><textarea rows={3} value={product.shortDescription} onChange={(event) => update("shortDescription", event.target.value)} required /></Field>
        <Field label="Mô tả đầy đủ" wide><textarea rows={5} value={product.description ?? ""} onChange={(event) => update("description", event.target.value)} /></Field>
        <Field label="Ghi chú chi tiết" wide><textarea rows={3} value={product.detailNote ?? ""} onChange={(event) => update("detailNote", event.target.value)} /></Field>
        <Field label="Video URL" wide><input type="url" value={product.videoUrl ?? ""} onChange={(event) => update("videoUrl", event.target.value)} /></Field>
        <Field label="Tags, phân cách dấu phẩy" wide><input value={product.tags.join(", ")} onChange={(event) => update("tags", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></Field>
        <Field label="Tone màu" wide>
          <div className="flex flex-wrap gap-2">
            {toneOptions.map((tone) => (
              <label className={`cursor-pointer rounded-full border px-3 py-2 text-xs ${product.tones.includes(tone) ? "border-primary bg-background-section text-primary-dark" : "border-border"}`} key={tone}>
                <input className="sr-only" type="checkbox" checked={product.tones.includes(tone)} onChange={() => update("tones", product.tones.includes(tone) ? product.tones.filter((item) => item !== tone) : [...product.tones, tone])} />
                {tone}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Thông số sản phẩm" wide>
          <div className="space-y-3">
            {product.attributes.map((attribute, index) => (
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" key={`${index}-${attribute.position}`}>
                <input
                  aria-label={`Tên thông số ${index + 1}`}
                  placeholder="Ví dụ: Chất liệu"
                  value={attribute.label}
                  onChange={(event) =>
                    update(
                      "attributes",
                      product.attributes.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, label: event.target.value } : item,
                      ),
                    )
                  }
                />
                <input
                  aria-label={`Giá trị thông số ${index + 1}`}
                  placeholder="Ví dụ: Len cotton"
                  value={attribute.value}
                  onChange={(event) =>
                    update(
                      "attributes",
                      product.attributes.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, value: event.target.value } : item,
                      ),
                    )
                  }
                />
                <button
                  aria-label={`Xóa thông số ${index + 1}`}
                  className="grid h-11 w-11 place-items-center rounded-button border border-red-200 text-red-700"
                  type="button"
                  onClick={() =>
                    update(
                      "attributes",
                      product.attributes
                        .filter((_, itemIndex) => itemIndex !== index)
                        .map((item, position) => ({ ...item, position })),
                    )
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-button border border-primary-soft px-4 text-sm text-primary-dark"
              type="button"
              onClick={() =>
                update("attributes", [
                  ...product.attributes,
                  { label: "", value: "", position: product.attributes.length },
                ])
              }
            >
              <Plus size={16} /> Thêm thông số
            </button>
          </div>
        </Field>
        <div className="flex flex-wrap gap-5 md:col-span-2">
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={product.isFeatured} onChange={(event) => update("isFeatured", event.target.checked)} /> Nổi bật</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={product.isCustomizable} onChange={(event) => update("isCustomizable", event.target.checked)} /> Có thể custom</label>
        </div>
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-heading text-2xl text-primary-dark">Hình ảnh</h2><p className="text-xs text-text-secondary">Upload trực tiếp có chữ ký lên Cloudinary.</p></div>
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-button border border-primary-soft px-4 text-sm font-medium text-primary-dark">
            <ImagePlus size={16} /> Upload ảnh
            <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => onUpload(event.target.files)} />
          </label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {product.media.map((media, index) => (
            <div className="overflow-hidden rounded-[16px] bg-background-main ring-1 ring-border" key={`${media.publicId ?? media.secureUrl}-${index}`}>
              <img className="aspect-[4/3] w-full object-cover" src={media.secureUrl} alt={media.alt} />
              <div className="space-y-3 p-3">
                <input className="w-full rounded-button border border-border bg-background-card px-3 py-2 text-xs" value={media.alt} onChange={(event) => update("media", product.media.map((item, itemIndex) => itemIndex === index ? { ...item, alt: event.target.value } : item))} />
                <div className="flex items-center justify-between">
                  <label className="text-xs"><input type="radio" name="cover" checked={media.isCover} onChange={() => update("media", product.media.map((item, itemIndex) => ({ ...item, isCover: itemIndex === index })))} /> Ảnh bìa</label>
                  <button className="text-red-700" type="button" onClick={() => update("media", product.media.filter((_, itemIndex) => itemIndex !== index).map((item, position) => ({ ...item, position, isCover: position === 0 ? true : item.isCover })))}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-border pt-5">
        {onDelete ? <button className="inline-flex min-h-11 items-center gap-2 rounded-button border border-red-200 px-4 text-sm text-red-700" type="button" onClick={onDelete}><Trash2 size={16} /> Xóa</button> : <span />}
        <button className="inline-flex min-h-11 items-center gap-2 rounded-button bg-primary-dark px-5 font-medium text-background-card disabled:opacity-50" disabled={busy || product.media.length === 0}>
          {busy ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />} Lưu sản phẩm
        </button>
      </div>
    </form>
  );
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactElement }) {
  return (
    <label className={`block text-sm font-medium text-primary-dark ${wide ? "md:col-span-2" : ""}`}>
      <span className="mb-2 block">{label}</span>
      <span className="[&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-button [&_input]:border [&_input]:border-border [&_input]:bg-background-main [&_input]:px-3 [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-button [&_select]:border [&_select]:border-border [&_select]:bg-background-main [&_select]:px-3 [&_textarea]:w-full [&_textarea]:rounded-button [&_textarea]:border [&_textarea]:border-border [&_textarea]:bg-background-main [&_textarea]:p-3">
        {children}
      </span>
    </label>
  );
}
