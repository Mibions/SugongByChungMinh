import { useState } from "react";
import { CloudUpload, FileSpreadsheet, LoaderCircle } from "lucide-react";
import type { AdminApi, ImportPreview } from "./admin-types";

type Props = {
  api: AdminApi;
  reloadProducts: () => Promise<void>;
  setMessage: (message: string) => void;
};

async function readFileBase64(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary);
}

export function ImportManager({ api, reloadProducts, setMessage }: Props) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mode, setMode] = useState<"create" | "upsert">("upsert");

  async function previewFile(file: File) {
    setBusy(true);
    setMessage("");
    try {
      const result = await api<ImportPreview>("import-preview", {
        method: "POST",
        body: JSON.stringify({ fileName: file.name, contentBase64: await readFileBase64(file) }),
      });
      setFileName(file.name);
      setPreview(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!preview || preview.errors.length > 0) return;
    setBusy(true);
    try {
      let successRows = 0;
      let failedRows = 0;
      const chunkSize = 3;
      setProgress({ done: 0, total: preview.rows.length });
      for (let index = 0; index < preview.rows.length; index += chunkSize) {
        const rows = preview.rows.slice(index, index + chunkSize);
        const result = await api<{ successRows: number; failedRows: number }>("import-commit", {
          method: "POST",
          body: JSON.stringify({
            fileName,
            rows,
            mode,
            triggerRebuild: index + chunkSize >= preview.rows.length,
          }),
        });
        successRows += result.successRows;
        failedRows += result.failedRows;
        setProgress({ done: Math.min(index + rows.length, preview.rows.length), total: preview.rows.length });
      }
      setMessage(`Import hoàn tất: ${successRows} thành công, ${failedRows} lỗi.`);
      setPreview(null);
      await reloadProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
      setProgress({ done: 0, total: 0 });
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <p className="text-xs font-medium text-text-secondary">Nhập dữ liệu hàng loạt</p>
        <h1 className="mt-1 font-heading text-3xl tracking-[-0.025em] text-primary-dark">Import sản phẩm</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          Import được tách khỏi form sản phẩm để có thể kiểm tra dữ liệu, xử lý lỗi và xác nhận trước khi ghi database.
        </p>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="rounded-[24px] bg-background-card p-5 shadow-soft ring-1 ring-border sm:p-6">
          <label className="grid min-h-56 cursor-pointer place-items-center rounded-[18px] border border-dashed border-primary-soft bg-background-section/35 p-8 text-center transition hover:border-primary hover:bg-background-section/70">
            <span>
              {busy ? <LoaderCircle className="mx-auto animate-spin text-primary" size={38} /> : <CloudUpload className="mx-auto text-primary" size={38} />}
              <span className="mt-4 block font-heading text-2xl tracking-[-0.02em] text-primary-dark">Chọn file CSV hoặc XLSX</span>
              <span className="mt-2 block text-sm text-text-secondary">Tối đa 3 MB và 100 sản phẩm mỗi lần.</span>
            </span>
            <input className="sr-only" type="file" accept=".csv,.xlsx" onChange={(event) => event.target.files?.[0] && previewFile(event.target.files[0])} />
          </label>

          {preview && (
            <div className="mt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-primary-dark">{fileName}</p>
                  <p className="mt-1 text-sm text-text-secondary">{preview.totalRows} dòng · {preview.errors.length} lỗi</p>
                </div>
                <select className="min-h-10 rounded-button border border-border bg-background-main px-3 text-sm" value={mode} onChange={(event) => setMode(event.target.value as "create" | "upsert")}>
                  <option value="upsert">Cập nhật theo slug</option>
                  <option value="create">Chỉ tạo mới</option>
                </select>
              </div>
              {preview.errors.length > 0 ? (
                <div className="mt-4 rounded-[14px] bg-red-50 p-4">
                  {preview.errors.slice(0, 10).map((error) => (
                    <p className="mt-1 text-sm text-red-700" key={`${error.row}-${error.message}`}>
                      Dòng {error.row}: {error.message}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-[14px] ring-1 ring-border">
                  <div className="grid grid-cols-[4rem_minmax(0,1fr)_10rem] bg-background-section px-3 py-2 text-xs font-medium text-primary-dark">
                    <span>Dòng</span><span>Sản phẩm</span><span>Danh mục</span>
                  </div>
                  {preview.rows.slice(0, 12).map((row, index) => (
                    <div className="grid grid-cols-[4rem_minmax(0,1fr)_10rem] border-t border-border px-3 py-2 text-sm" key={`${String(row.slug)}-${index}`}>
                      <span className="text-text-secondary">{index + 2}</span>
                      <span className="truncate text-primary-dark">{String(row.name)}</span>
                      <span className="truncate text-text-secondary">{String(row.category)}</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-button bg-primary-dark px-5 font-medium text-background-card disabled:opacity-50"
                disabled={preview.errors.length > 0 || busy}
                onClick={commit}
              >
                {busy && <LoaderCircle className="animate-spin" size={17} />}
                {busy && progress.total > 0
                  ? `Đang nhập ${progress.done}/${progress.total}`
                  : "Xác nhận import"}
              </button>
            </div>
          )}
        </section>

        <aside className="self-start rounded-[20px] bg-background-section/55 p-5 ring-1 ring-primary-soft/60">
          <FileSpreadsheet className="text-primary-dark" size={24} />
          <h2 className="mt-4 font-heading text-xl text-primary-dark">Chuẩn bị file</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Dùng đúng tên cột và slug đã cấu hình. Hệ thống xử lý theo từng nhóm nhỏ để tránh timeout.
          </p>
          <a className="mt-4 inline-flex text-sm font-medium text-primary-dark underline underline-offset-4" href="/admin/product-import-template.csv" download>
            Tải CSV mẫu
          </a>
        </aside>
      </div>
    </div>
  );
}
