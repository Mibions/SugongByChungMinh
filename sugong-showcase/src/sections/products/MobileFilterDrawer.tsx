import { useState } from "react";
import { Palette, SlidersHorizontal, WandSparkles, X } from "lucide-react";
import { withBase } from "../../lib/url";

export function MobileFilterDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="mb-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-primary-soft bg-background-card px-5 text-sm font-medium text-primary-dark shadow-soft lg:hidden"
        type="button"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        Mở bộ lọc
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            className="absolute inset-0 bg-text-primary/35 backdrop-blur-sm"
            type="button"
            aria-label="Đóng bộ lọc"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-x-3 bottom-3 rounded-card border border-primary-soft bg-background-card p-5 shadow-feather">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-background-section text-primary-dark">
                  <SlidersHorizontal size={18} aria-hidden="true" />
                </span>
                <p className="font-heading text-2xl text-primary-dark">Bộ lọc</p>
              </div>
              <button
                className="grid h-10 w-10 place-items-center rounded-full border border-border text-primary-dark"
                type="button"
                aria-label="Đóng bộ lọc"
                onClick={() => setOpen(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-5 text-sm text-text-secondary">
              <section className="rounded-card bg-background-section p-4">
                <p className="font-medium text-primary-dark">Khoảng giá</p>
                <div className="mt-4 h-1.5 rounded-full bg-primary-soft">
                  <div className="h-full w-full rounded-full bg-primary" />
                </div>
                <div className="mt-3 flex justify-between text-xs">
                  <span>0đ</span>
                  <span>600.000đ</span>
                </div>
              </section>

              <section className="rounded-card bg-background-section p-4">
                <p className="flex items-center gap-2 font-medium text-primary-dark">
                  <Palette size={16} aria-hidden="true" />
                  Màu sắc
                </p>
                <div className="mt-3 flex gap-3">
                  {["bg-primary", "bg-accent-pink", "bg-accent-cream", "bg-primary-soft"].map((color) => (
                    <span
                      className={`h-7 w-7 rounded-full border border-background-card shadow-soft ${color}`}
                      key={color}
                    />
                  ))}
                </div>
              </section>

              <section className="rounded-card bg-background-section p-4">
                <p className="flex items-center gap-2 font-medium text-primary-dark">
                  <WandSparkles size={16} aria-hidden="true" />
                  Custom / handmade
                </p>
                <p className="mt-2 leading-6">Ưu tiên các mẫu có thể cá nhân hóa theo ý tưởng riêng.</p>
              </section>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <a
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary-soft bg-background-card px-4 text-sm font-medium text-primary-dark"
                href={withBase("/products")}
              >
                Xóa lọc
              </a>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-background-card"
                type="button"
                onClick={() => setOpen(false)}
              >
                Áp dụng
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
