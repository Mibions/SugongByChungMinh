import { useState } from "react";
import { withBase, withoutBase } from "../../lib/url";

type NavItem = {
  href: string;
  label: string;
};

type Props = {
  items: NavItem[];
  currentPath?: string;
};

export function MobileNavigation({ items, currentPath = "/" }: Props) {
  const [open, setOpen] = useState(false);
  const normalizedPath = withoutBase(currentPath);

  return (
    <div className="relative md:hidden">
      <button
        className="flex h-10 w-10 items-center justify-center rounded-button border border-border bg-background-card text-primary-dark"
        type="button"
        aria-expanded={open}
        aria-label="Mở menu"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex w-4 flex-col gap-1" aria-hidden="true">
          <span className="h-0.5 rounded-full bg-current" />
          <span className="h-0.5 rounded-full bg-current" />
          <span className="h-0.5 rounded-full bg-current" />
        </span>
      </button>
      {open && (
        <nav className="absolute right-0 top-12 w-56 rounded-card border border-border bg-background-card p-3 shadow-soft">
          {items.map((item) => {
            const active = normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`);

            return (
              <a
                className={[
                  "block rounded-button px-3 py-2 text-sm font-medium hover:bg-background-section hover:text-primary-dark",
                  active ? "text-primary-dark" : "text-text-secondary",
                ].join(" ")}
                href={withBase(item.href)}
                key={item.href}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      )}
    </div>
  );
}
