import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  ExternalLink,
  FileSpreadsheet,
  LoaderCircle,
  LogOut,
  Network,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import type { AdminProductSummary } from "../../server/catalog/product-input";
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
    setConfig(await api<CatalogConfig>("catalog-config"));
  }

  async function loadWorkspace() {
    await reloadProducts();
  }

  async function ensureConfig() {
    if (config.categories.length > 0) return config;
    const next = await api<CatalogConfig>("catalog-config");
    setConfig(next);
    return next;
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
          <p className="mt-2 text-sm leading-6 text-text-secondary">Token chỉ dùng để tạo phiên đăng nhập và không được lưu trong trình duyệt.</p>
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

  const navigation = [
    ["products", "Sản phẩm", Boxes],
    ["catalog", "Cấu trúc catalogue", Network],
    ["import", "Import", FileSpreadsheet],
  ] as const;

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background-main/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-6">
            <div>
              <p className="font-heading text-xl text-primary-dark">SUGONG Admin</p>
              <p className="text-xs text-text-secondary">Catalogue workspace</p>
            </div>
            <nav className="hidden items-center gap-1 md:flex" aria-label="Quản trị">
              {navigation.map(([value, label, Icon]) => (
                <button
                  className={`inline-flex min-h-10 items-center gap-2 rounded-button px-3 text-sm transition ${
                    view === value ? "bg-background-section font-medium text-primary-dark" : "text-text-secondary hover:text-primary-dark"
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
              className="inline-flex min-h-10 items-center gap-2 rounded-button border border-border bg-background-card px-4 text-sm disabled:opacity-50"
              disabled={busy}
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
              <RefreshCw className={busy ? "animate-spin" : ""} size={15} />
              <span className="hidden lg:inline">Tải lại dữ liệu</span>
            </button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-button border border-border bg-background-card px-4 text-sm disabled:opacity-50" disabled={busy} onClick={rebuild}>
              <RefreshCw className={busy ? "animate-spin" : ""} size={15} /> <span className="hidden sm:inline">Cập nhật website</span>
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-button border border-border bg-background-card" onClick={logout} aria-label="Đăng xuất">
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

      <div className="mx-auto max-w-[1500px] px-5 py-6">
        {message && (
          <button className="mb-5 w-full rounded-[14px] border border-primary-soft bg-background-card px-4 py-3 text-left text-sm text-primary-dark" onClick={() => setMessage("")}>
            {message}
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
