import { useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes,
  CheckCircle2,
  Database,
  ExternalLink,
  FileSpreadsheet,
  LoaderCircle,
  LogOut,
  Network,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import type {
  AdminProductRecord,
  AdminProductSummary,
} from "../../server/catalog/product-input";
import { CatalogManager } from "./CatalogManager";
import { ImportManager } from "./ImportManager";
import { ProductManager } from "./ProductManager";
import type { AdminApi, CatalogConfig } from "./admin-types";

type Props = {
  configuredAdminUrl: string;
};

type View = "products" | "catalog" | "import";

const emptyConfig: CatalogConfig = {
  categories: [],
  productTypes: [],
  classificationGroups: [],
  attributeDefinitions: [],
  productTemplates: [],
  collections: [],
  tags: [],
};

function getCookie(name: string) {
  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function AdminApp({ configuredAdminUrl }: Props) {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [token, setToken] = useState("");
  const [products, setProducts] = useState<AdminProductSummary[]>([]);
  const [config, setConfig] = useState<CatalogConfig>(emptyConfig);
  const [view, setView] = useState<View>("products");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const configRef = useRef<CatalogConfig>(emptyConfig);
  const configRequestRef = useRef<Promise<CatalogConfig> | null>(null);
  const productRecordsRef = useRef(new Map<string, AdminProductRecord>());
  const productRecordsRequestRef = useRef<Promise<void> | null>(null);

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

  const api: AdminApi = async <T,>(path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (init.body) headers.set("content-type", "application/json");
    const csrf = csrfToken || decodeURIComponent(getCookie("sugong_admin_csrf") ?? "");
    if (csrf && init.method && init.method !== "GET") headers.set("x-csrf-token", csrf);
    const response = await fetch(`/api/admin/${path}`, { ...init, headers, credentials: "same-origin" });
    const rawBody = await response.text();
    let body: T & { message?: string; errorCode?: string; requestId?: string };
    try {
      body = (rawBody ? JSON.parse(rawBody) : {}) as T & {
        message?: string;
        errorCode?: string;
        requestId?: string;
      };
    } catch {
      body = {
        message: rawBody.startsWith("A server error")
          ? "Vercel API không khởi động được. Hãy kiểm tra Function Runtime Logs."
          : rawBody.slice(0, 300) || `Request failed (${response.status})`,
      } as T & { message?: string; errorCode?: string; requestId?: string };
    }
    if (!response.ok) {
      const diagnostic = [body.errorCode, body.requestId].filter(Boolean).join(" · ");
      throw new Error(`${body.message ?? `Request failed (${response.status})`}${diagnostic ? ` (${diagnostic})` : ""}`);
    }
    return body;
  };

  async function reloadProducts() {
    const response = await api<{ items: AdminProductSummary[] }>("products");
    setProducts(response.items);
  }

  async function reloadConfig() {
    configRequestRef.current = null;
    const next = await api<CatalogConfig>("catalog-config");
    configRef.current = next;
    setConfig(next);
  }

  async function loadWorkspace() {
    await reloadProducts();
  }

  async function ensureConfig() {
    if (configRef.current.categories.length > 0) return configRef.current;
    if (configRequestRef.current) return configRequestRef.current;

    const request = api<CatalogConfig>("catalog-config")
      .then((next) => {
        configRef.current = next;
        setConfig(next);
        return next;
      })
      .finally(() => {
        configRequestRef.current = null;
      });
    configRequestRef.current = request;
    return request;
  }

  function cacheProductRecord(product: AdminProductRecord) {
    productRecordsRef.current.set(product.id, product);
  }

  function removeCachedProductRecord(productId: string) {
    productRecordsRef.current.delete(productId);
  }

  async function preloadProductRecords() {
    if (productRecordsRef.current.size > 0) return;
    if (productRecordsRequestRef.current) return productRecordsRequestRef.current;

    const request = api<{ items: AdminProductRecord[] }>("product-records")
      .then(({ items }) => {
        for (const item of items) cacheProductRecord(item);
      })
      .finally(() => {
        productRecordsRequestRef.current = null;
      });
    productRecordsRequestRef.current = request;
    return request;
  }

  async function loadProductRecord(productId: string) {
    const cached = productRecordsRef.current.get(productId);
    if (cached) return cached;

    if (productRecordsRequestRef.current) {
      try {
        await productRecordsRequestRef.current;
      } catch {
        // Fall through to a focused single-record request.
      }
      const warmed = productRecordsRef.current.get(productId);
      if (warmed) return warmed;
    }

    const response = await api<{ item: AdminProductRecord }>(`products/${productId}`);
    cacheProductRecord(response.item);
    return response.item;
  }

  function warmEditorData() {
    void Promise.all([ensureConfig(), preloadProductRecords()]).catch(() => {
      // Warmup is best-effort. The editor retries and surfaces an error on demand.
    });
  }

  async function openView(nextView: View) {
    setView(nextView);
    if (nextView !== "catalog" || config.categories.length > 0) return;
    setBusy(true);
    setMessage("");
    try {
      await ensureConfig();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (isWrongHost) {
      setCheckingSession(false);
      return;
    }
    api<{
      authenticated: boolean;
      csrfToken?: string;
      items: AdminProductSummary[];
    }>("bootstrap")
      .then((workspace) => {
        setAuthenticated(workspace.authenticated);
        if (workspace.csrfToken) setCsrfToken(workspace.csrfToken);
        setProducts(workspace.items);
        window.setTimeout(warmEditorData, 0);
      })
      .catch((error) => {
        setAuthenticated(false);
        if (error instanceof Error && !error.message.includes("Phiên đăng nhập")) {
          setMessage(error.message);
        }
      })
      .finally(() => setCheckingSession(false));
  }, [isWrongHost]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await api<{
        ok: boolean;
        csrfToken: string;
        items: AdminProductSummary[];
      }>("login", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setCsrfToken(result.csrfToken);
      setAuthenticated(true);
      setToken("");
      setProducts(result.items);
      window.setTimeout(warmEditorData, 0);
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
      setConfig(emptyConfig);
      setCsrfToken("");
    } finally {
      setBusy(false);
    }
  }

  async function rebuild() {
    setBusy(true);
    try {
      await api("rebuild", { method: "POST" });
      setMessage("Đã yêu cầu GitHub Pages cập nhật dữ liệu mới.");
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
            GitHub Pages chỉ phục vụ frontend tĩnh. Mở admin trên Vercel để cookie bảo mật và API hoạt động đúng.
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
    return (
      <main className="min-h-dvh bg-background-main p-4 sm:p-6">
        <div className="mx-auto max-w-[1600px]">
          <div className="h-16 animate-pulse rounded-[18px] bg-background-card ring-1 ring-border" />
          <div className="mt-5 grid gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]">
            <div className="h-[38rem] animate-pulse rounded-[20px] bg-background-card ring-1 ring-border" />
            <div className="h-[38rem] animate-pulse rounded-[24px] bg-background-card/70 ring-1 ring-border" />
          </div>
          <p className="mt-5 text-center text-sm text-text-secondary">Đang kết nối catalogue…</p>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="grid min-h-dvh bg-background-main lg:grid-cols-[minmax(22rem,0.85fr)_minmax(30rem,1.15fr)]">
        <section className="relative hidden overflow-hidden bg-primary-dark p-12 text-background-card lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-28 -top-24 h-80 w-80 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-semibold tracking-[0.16em] text-primary-soft">SUGONG</p>
            <h1 className="mt-5 max-w-lg text-balance font-heading text-5xl leading-[1.08] tracking-[-0.035em]">
              Quản lý catalogue rõ ràng, theo từng lớp dữ liệu.
            </h1>
            <p className="mt-5 max-w-md text-pretty leading-7 text-background-section/80">
              Sản phẩm, phân loại, thuộc tính và hình ảnh được tách riêng để bạn cập nhật mà không làm rối cấu trúc website.
            </p>
          </div>
          <div className="relative grid gap-3 text-sm text-background-section/80">
            <p className="flex items-center gap-3"><CheckCircle2 size={17} /> Phiên đăng nhập được bảo vệ bằng cookie HttpOnly</p>
            <p className="flex items-center gap-3"><Database size={17} /> Dữ liệu được đọc trực tiếp từ catalogue production</p>
          </div>
        </section>
        <section className="grid place-items-center p-5 sm:p-10">
          <form className="w-full max-w-md" onSubmit={login}>
            <span className="grid h-12 w-12 place-items-center rounded-[15px] bg-background-section text-primary-dark ring-1 ring-primary-soft/60">
              <ShieldCheck size={22} aria-hidden="true" />
            </span>
            <p className="mt-7 text-sm font-semibold tracking-[0.12em] text-primary">ADMIN WORKSPACE</p>
            <h2 className="mt-2 text-balance font-heading text-4xl tracking-[-0.03em] text-primary-dark">Đăng nhập quản trị</h2>
            <p className="mt-3 text-pretty text-sm leading-6 text-text-secondary">
              Nhập master token để tạo phiên làm việc. Token không được lưu trong trình duyệt.
            </p>
            <label className="mt-8 block text-sm font-medium text-primary-dark" htmlFor="admin-token">Master token</label>
            <input
              id="admin-token"
              className="mt-2 min-h-12 w-full rounded-button border border-border bg-background-card px-4 shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary-soft/30"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="current-password"
              required
            />
            {message && <p className="mt-3 rounded-[12px] bg-red-50 px-3 py-2.5 text-sm text-red-700">{message}</p>}
            <button className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-button bg-primary-dark px-5 font-medium text-background-card transition hover:bg-primary active:translate-y-px disabled:opacity-60" disabled={busy}>
              {busy && <LoaderCircle className="animate-spin" size={17} />} Vào workspace
            </button>
          </form>
        </section>
      </main>
    );
  }

  const navigation = [
    ["products", "Sản phẩm", Boxes],
    ["catalog", "Cấu trúc catalogue", Network],
    ["import", "Import", FileSpreadsheet],
  ] as const;

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(217,200,236,0.2),transparent_32rem)]">
      {busy && <div className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-primary" />}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background-main/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[4.5rem] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-primary-dark text-background-card">
                <Boxes size={18} />
              </span>
              <div>
                <p className="font-heading text-lg leading-none text-primary-dark">SUGONG</p>
                <p className="mt-1 text-[11px] text-text-secondary">Catalogue admin</p>
              </div>
            </div>
            <nav className="hidden items-center gap-1 md:flex" aria-label="Quản trị">
              {navigation.map(([value, label, Icon]) => (
                <button
                  className={`inline-flex min-h-10 items-center gap-2 rounded-button px-3 text-sm transition ${
                    view === value
                      ? "bg-background-card font-medium text-primary-dark shadow-sm ring-1 ring-border"
                      : "text-text-secondary hover:bg-background-section/70 hover:text-primary-dark"
                  }`}
                  onClick={() => openView(value)}
                  key={value}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="grid h-10 w-10 place-items-center rounded-button border border-border bg-background-card text-primary-dark transition hover:bg-background-section active:translate-y-px disabled:opacity-50"
              disabled={busy}
              aria-label="Tải lại dữ liệu"
              title="Tải lại dữ liệu"
              onClick={async () => {
                setBusy(true);
                setMessage("");
                try {
                  await loadWorkspace();
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : String(error));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <RefreshCw className={busy ? "animate-spin" : ""} size={16} />
            </button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-button bg-primary-dark px-4 text-sm font-medium text-background-card transition hover:bg-primary active:translate-y-px disabled:opacity-50" disabled={busy} onClick={rebuild}>
              <RefreshCw className={busy ? "animate-spin" : ""} size={15} /> <span className="hidden sm:inline">Đồng bộ website</span>
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-button border border-border bg-background-card text-text-secondary transition hover:bg-red-50 hover:text-red-700" onClick={logout} aria-label="Đăng xuất" title="Đăng xuất">
              <LogOut size={17} />
            </button>
          </div>
        </div>
        <nav className="scrollbar-none flex gap-1 overflow-x-auto px-4 pb-2 md:hidden" aria-label="Quản trị mobile">
          {navigation.map(([value, label, Icon]) => (
            <button
              className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-button px-3 text-sm ${
                view === value ? "bg-primary-dark text-background-card" : "bg-background-card text-primary-dark"
              }`}
              onClick={() => openView(value)}
              key={value}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7">
        {message && (
          <button className="mb-5 flex w-full items-center gap-3 rounded-[14px] border border-primary-soft bg-background-card px-4 py-3 text-left text-sm text-primary-dark shadow-sm" onClick={() => setMessage("")}>
            <CheckCircle2 className="shrink-0 text-success" size={17} />
            <span className="flex-1">{message}</span>
            <span className="text-xs text-text-secondary">Đóng</span>
          </button>
        )}
        {view === "products" && (
          <ProductManager
            api={api}
            busy={busy}
            config={config}
            products={products}
            setBusy={setBusy}
            setMessage={setMessage}
            reloadProducts={reloadProducts}
            loadConfig={ensureConfig}
            loadProduct={loadProductRecord}
            cacheProduct={cacheProductRecord}
            removeCachedProduct={removeCachedProductRecord}
          />
        )}
        {view === "catalog" && (
          <CatalogManager api={api} config={config} reloadConfig={reloadConfig} setMessage={setMessage} />
        )}
        {view === "import" && (
          <ImportManager api={api} reloadProducts={reloadProducts} setMessage={setMessage} />
        )}
      </div>
    </main>
  );
}
