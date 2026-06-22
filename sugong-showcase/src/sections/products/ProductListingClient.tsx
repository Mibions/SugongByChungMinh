import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  Gift,
  GraduationCap,
  Heart,
  Palette,
  Search,
  SearchX,
  Scissors,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Tags,
  WandSparkles,
  X,
} from "lucide-react";
import {
  type ProductCategoryFilter,
  type ProductSort,
  getProductPrimaryImage,
  isProductCustomizable,
  matchesProductCategory,
  matchesProductSearch,
  matchesProductTone,
  sortProducts,
} from "../../domain/product/product.helpers";
import {
  productCategoryMeta,
  productToneFilters,
  type ProductTone,
} from "../../domain/product/product-taxonomy";
import type { Product } from "../../domain/product/product.types";
import { getCloudinaryImageProps } from "../../lib/cloudinary-image";
import { cn } from "../../lib/cn";
import { withBase } from "../../lib/url";

type CategoryValue = ProductCategoryFilter;
type SortValue = ProductSort;

type Props = {
  products: Product[];
  zaloHref: string;
};

const pageSize = 6;
const defaultMaxPrice = 600000;
type ListingCategoryValue = "bag" | "scrunchie" | "gift" | "custom";

const tabIcons: Record<ListingCategoryValue, typeof Sparkles> = {
  bag: ShoppingBag,
  scrunchie: Sparkles,
  gift: Gift,
  custom: WandSparkles,
};

const tabs: { label: string; value: CategoryValue; icon: typeof Sparkles }[] = [
  { label: "Tất cả", value: "all", icon: Sparkles },
  { label: productCategoryMeta.bag.tabLabel, value: "bag", icon: tabIcons.bag },
  { label: productCategoryMeta.scrunchie.tabLabel, value: "scrunchie", icon: tabIcons.scrunchie },
  { label: productCategoryMeta.gift.tabLabel, value: "gift", icon: tabIcons.gift },
  { label: productCategoryMeta.custom.tabLabel, value: "custom", icon: tabIcons.custom },
];

function isColorTone(value: string | null): value is ProductTone {
  return productToneFilters.some((filter) => filter.value === value);
}

function getInitialState(): {
  category: CategoryValue;
  search: string;
  sort: SortValue;
  page: number;
  maxPrice: number;
  colorTone: ProductTone | null;
  customOnly: boolean;
} {
  if (typeof window === "undefined") {
    return {
      category: "all",
      search: "",
      sort: "newest",
      page: 1,
      maxPrice: defaultMaxPrice,
      colorTone: null,
      customOnly: false,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const rawCategory = params.get("category") as CategoryValue | null;
  const rawSort = params.get("sort") as SortValue | null;
  const rawMaxPrice = Number(params.get("maxPrice") ?? defaultMaxPrice);
  const rawColorTone = params.get("tone");

  return {
    category: tabs.some((tab) => tab.value === rawCategory) ? rawCategory! : "all",
    search: params.get("q") ?? "",
    sort: rawSort === "price-asc" || rawSort === "price-desc" ? rawSort : "newest",
    page: Math.max(Number(params.get("page") ?? "1") || 1, 1),
    maxPrice: Number.isFinite(rawMaxPrice) ? Math.min(Math.max(rawMaxPrice, 0), defaultMaxPrice) : defaultMaxPrice,
    colorTone: isColorTone(rawColorTone) ? rawColorTone : null,
    customOnly: params.get("custom") === "1",
  };
}

function productMatchesPrice(product: Product, maxPrice: number) {
  if (maxPrice >= defaultMaxPrice) return true;
  if (product.price === null) return false;
  return product.price <= maxPrice;
}

function updateUrl(
  category: CategoryValue,
  search: string,
  sort: SortValue,
  page = 1,
  maxPrice = defaultMaxPrice,
  colorTone: ProductTone | null = null,
  customOnly = false,
) {
  const params = new URLSearchParams();
  if (category !== "all") params.set("category", category);
  if (search.trim()) params.set("q", search.trim());
  if (sort !== "newest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  if (maxPrice < defaultMaxPrice) params.set("maxPrice", String(maxPrice));
  if (colorTone) params.set("tone", colorTone);
  if (customOnly) params.set("custom", "1");

  const query = params.toString();
  window.history.pushState({}, "", query ? `${withBase("/products")}?${query}` : withBase("/products"));
}

function ProductCard({ product }: { product: Product }) {
  const image = getProductPrimaryImage(product);
  const imageProps = getCloudinaryImageProps(image, "product-card");

  return (
    <article data-product-card className="group flex h-full flex-col overflow-hidden rounded-card border border-primary-soft/35 bg-background-card/95 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-primary-soft/80 hover:shadow-feather">
      <a className="block" href={withBase(`/products/${product.slug}`)} aria-label={`Xem ${product.name}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-background-section">
          <img
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            src={imageProps.src}
            srcSet={imageProps.srcset}
            sizes={imageProps.sizes}
            alt={image.alt}
            width={imageProps.width}
            height={imageProps.height}
            loading="lazy"
            decoding="async"
          />
          <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background-card/90 text-primary shadow-feather ring-1 ring-primary-soft/30">
            <Heart size={18} aria-hidden="true" />
          </span>
        </div>
      </a>
      <div className="flex flex-1 flex-col space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background-section px-3 py-1 text-xs font-medium text-primary-dark">
              <Scissors size={13} aria-hidden="true" />
              Handmade
            </span>
            {isProductCustomizable(product) && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft/45 px-3 py-1 text-xs font-medium text-primary-dark">
                <WandSparkles size={13} aria-hidden="true" />
                Custom
              </span>
            )}
          </div>
          <h3 className="font-heading text-xl leading-snug text-primary-dark">{product.name}</h3>
          <p className="text-sm font-semibold text-text-primary">{product.formattedPrice}</p>
        </div>
        <a
          className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-primary-dark transition hover:text-text-primary"
          href={withBase(`/products/${product.slug}`)}
        >
          Xem chi tiết
          <Sparkles size={15} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function FilterControls({
  maxPrice,
  colorTone,
  customOnly,
  onMaxPriceChange,
  onColorToneChange,
  onCustomOnlyChange,
}: {
  maxPrice: number;
  colorTone: ProductTone | null;
  customOnly: boolean;
  onMaxPriceChange: (value: number) => void;
  onColorToneChange: (value: ProductTone | null) => void;
  onCustomOnlyChange: (value: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="border-t border-border pt-6">
        <p className="flex items-center gap-2 font-medium text-primary-dark">
          <Tags size={17} aria-hidden="true" />
          Khoảng giá
        </p>
        <input
          className="mt-4 h-1.5 w-full accent-primary"
          type="range"
          min="0"
          max={defaultMaxPrice}
          step="10000"
          value={maxPrice}
          aria-label="Khoảng giá tối đa"
          onInput={(event) => onMaxPriceChange(Number(event.currentTarget.value))}
          onChange={(event) => onMaxPriceChange(Number(event.target.value))}
        />
        <div className="mt-3 flex justify-between text-xs text-text-secondary">
          <span>0đ</span>
          <span>{maxPrice.toLocaleString("vi-VN")}đ</span>
        </div>
      </section>

      <section className="border-t border-border pt-6">
        <p className="flex items-center gap-2 font-medium text-primary-dark">
          <Palette size={17} aria-hidden="true" />
          Màu sắc
        </p>
        <div className="mt-4 flex items-center gap-3">
          {productToneFilters.map((filter) => (
            <button
              className={cn(
                "h-8 w-8 rounded-full border border-background-card shadow-soft transition",
                filter.className,
                colorTone === filter.value ? "ring-2 ring-primary ring-offset-2 ring-offset-background-card" : "hover:ring-2 hover:ring-primary-soft",
              )}
              type="button"
              aria-label={`Lọc màu ${filter.label}`}
              aria-pressed={colorTone === filter.value}
              onClick={() => onColorToneChange(colorTone === filter.value ? null : filter.value)}
              key={filter.value}
            />
          ))}
        </div>
      </section>

      <section className="border-t border-border pt-6">
        <button
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-medium transition",
            customOnly
              ? "border-primary bg-primary text-background-card"
              : "border-primary-soft bg-background-section text-primary-dark hover:bg-background-card",
          )}
          type="button"
          aria-pressed={customOnly}
          onClick={() => onCustomOnlyChange(!customOnly)}
        >
          <WandSparkles size={16} aria-hidden="true" />
          Chỉ hiện mẫu custom
        </button>
      </section>
    </div>
  );
}

function FilterDrawer({
  open,
  maxPrice,
  colorTone,
  customOnly,
  onMaxPriceChange,
  onColorToneChange,
  onCustomOnlyChange,
  onClose,
  onClear,
}: {
  open: boolean;
  maxPrice: number;
  colorTone: ProductTone | null;
  customOnly: boolean;
  onMaxPriceChange: (value: number) => void;
  onColorToneChange: (value: ProductTone | null) => void;
  onCustomOnlyChange: (value: boolean) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] lg:hidden">
      <button className="absolute inset-0 bg-text-primary/35 backdrop-blur-sm" type="button" aria-label="Đóng bộ lọc" onClick={onClose} />
      <aside className="absolute inset-x-3 bottom-3 rounded-card border border-primary-soft bg-background-card p-5 shadow-feather">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-background-section text-primary-dark">
              <SlidersHorizontal size={18} aria-hidden="true" />
            </span>
            <p className="font-heading text-2xl text-primary-dark">Bộ lọc</p>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-full border border-border text-primary-dark" type="button" aria-label="Đóng bộ lọc" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 rounded-card bg-background-section p-4 text-sm text-text-secondary">
          <FilterControls
            maxPrice={maxPrice}
            colorTone={colorTone}
            customOnly={customOnly}
            onMaxPriceChange={onMaxPriceChange}
            onColorToneChange={onColorToneChange}
            onCustomOnlyChange={onCustomOnlyChange}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary-soft bg-background-card px-4 text-sm font-medium text-primary-dark" type="button" onClick={onClear}>
            Xóa lọc
          </button>
          <button className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-background-card" type="button" onClick={onClose}>
            Áp dụng
          </button>
        </div>
      </aside>
    </div>
  );
}

export function ProductListingClient({ products, zaloHref }: Props) {
  const initialState = getInitialState();
  const [category, setCategory] = useState<CategoryValue>(initialState.category);
  const [search, setSearch] = useState(initialState.search);
  const [sort, setSort] = useState<SortValue>(initialState.sort);
  const [page, setPage] = useState(initialState.page);
  const [maxPrice, setMaxPrice] = useState(initialState.maxPrice);
  const [colorTone, setColorTone] = useState<ProductTone | null>(initialState.colorTone);
  const [customOnly, setCustomOnly] = useState(initialState.customOnly);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return sortProducts(
      products.filter(
        (product) =>
          matchesProductCategory(product, category) &&
          matchesProductSearch(product, search) &&
          productMatchesPrice(product, maxPrice) &&
          matchesProductTone(product, colorTone) &&
          (!customOnly || isProductCustomizable(product)),
      ),
      sort,
    );
  }, [category, colorTone, customOnly, maxPrice, products, search, sort]);

  const totalPages = Math.max(Math.ceil(filteredProducts.length / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const visibleProducts = filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  function setFilters(next: {
    category?: CategoryValue;
    search?: string;
    sort?: SortValue;
    page?: number;
    maxPrice?: number;
    colorTone?: ProductTone | null;
    customOnly?: boolean;
  }) {
    const nextCategory = next.category ?? category;
    const nextSearch = next.search ?? search;
    const nextSort = next.sort ?? sort;
    const nextPage = next.page ?? 1;
    const nextMaxPrice = next.maxPrice ?? maxPrice;
    const nextColorTone = next.colorTone !== undefined ? next.colorTone : colorTone;
    const nextCustomOnly = next.customOnly ?? customOnly;

    setCategory(nextCategory);
    setSearch(nextSearch);
    setSort(nextSort);
    setPage(nextPage);
    setMaxPrice(nextMaxPrice);
    setColorTone(nextColorTone);
    setCustomOnly(nextCustomOnly);
    updateUrl(nextCategory, nextSearch, nextSort, nextPage, nextMaxPrice, nextColorTone, nextCustomOnly);
  }

  function clearFilters() {
    setFilters({
      category: "all",
      search: "",
      sort: "newest",
      maxPrice: defaultMaxPrice,
      colorTone: null,
      customOnly: false,
    });
  }

  return (
    <>
      <section className="border-b border-border bg-background-card/70 py-4">
        <div className="mx-auto w-full max-w-page px-5 sm:px-6 lg:px-8">
          <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <div className="flex min-w-max gap-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = tab.value === category;

                return (
                  <button
                    className={cn(
                      "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-medium transition",
                      active
                        ? "border-primary bg-primary text-background-card shadow-soft"
                        : "border-primary-soft/70 bg-background-section/70 text-text-secondary hover:border-primary-soft hover:bg-background-card hover:text-primary-dark",
                    )}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilters({ category: tab.value })}
                    key={tab.value}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {tab.label}
                  </button>
                );
              })}
              <a
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary-soft/70 bg-background-card px-5 text-sm font-medium text-primary-dark transition hover:border-primary-soft hover:bg-background-section"
                href={withBase("/products/graduation-hats")}
              >
                <GraduationCap size={16} aria-hidden="true" />
                Nón tốt nghiệp
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-10 pb-section-mobile lg:pt-10 lg:pb-section-desktop">
        <div className="mx-auto w-full max-w-page px-5 sm:px-6 lg:px-5">
          <div className="grid gap-7 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr]">
            <aside className="hidden lg:block">
              <div className="space-y-6 rounded-card border border-primary-soft/45 bg-background-card/90 p-5 shadow-soft backdrop-blur">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-background-section text-primary-dark">
                    <SlidersHorizontal size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-heading text-xl text-primary-dark">Bộ lọc</p>
                    <p className="text-xs text-text-secondary">Tinh gọn theo phong cách bạn thích</p>
                  </div>
                </div>

                <FilterControls
                  maxPrice={maxPrice}
                  colorTone={colorTone}
                  customOnly={customOnly}
                  onMaxPriceChange={(value) => setFilters({ maxPrice: value })}
                  onColorToneChange={(value) => setFilters({ colorTone: value })}
                  onCustomOnlyChange={(value) => setFilters({ customOnly: value })}
                />
              </div>
            </aside>

            <div className="space-y-7">
              <form
                className="rounded-card border border-primary-soft/50 bg-background-card/90 p-4 shadow-soft"
                onSubmit={(event) => {
                  event.preventDefault();
                  setFilters({ search });
                }}
              >
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <p data-product-count className="flex items-center text-sm font-medium text-primary-dark">
                    <span className="font-heading text-2xl">{filteredProducts.length}</span>
                    <span className="ml-2 text-text-secondary">sản phẩm</span>
                  </p>
                  <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto_auto_auto] sm:items-center">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary-soft" size={17} aria-hidden="true" />
                      <input
                        className="min-h-12 w-full rounded-full border border-border bg-background-card px-11 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary-soft"
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Tìm mẫu handmade..."
                      />
                    </div>
                    <div className="relative">
                      <ArrowUpDown className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary-soft" size={16} aria-hidden="true" />
                      <select
                        className="min-h-12 w-full appearance-none rounded-full border border-border bg-background-card px-10 pr-8 text-sm text-text-primary outline-none transition focus:border-primary-soft sm:w-48"
                        aria-label="Sắp xếp sản phẩm"
                        value={sort}
                        onChange={(event) => setFilters({ sort: event.target.value as SortValue })}
                      >
                        <option value="newest">Mới nhất</option>
                        <option value="price-asc">Giá thấp đến cao</option>
                        <option value="price-desc">Giá cao đến thấp</option>
                      </select>
                    </div>
                    <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary-soft bg-background-section px-5 text-sm font-medium text-primary-dark transition hover:bg-background-card" type="submit">
                      <SlidersHorizontal size={16} aria-hidden="true" />
                      Áp dụng
                    </button>
                    <button
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary-soft bg-background-card px-5 text-sm font-medium text-primary-dark shadow-soft transition hover:bg-background-section lg:hidden"
                      type="button"
                      onClick={() => setDrawerOpen(true)}
                    >
                      <SlidersHorizontal size={16} aria-hidden="true" />
                      Lọc
                    </button>
                  </div>
                </div>
              </form>

              {visibleProducts.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 xl:gap-8">
                  {visibleProducts.map((product) => (
                    <ProductCard product={product} key={product.id} />
                  ))}
                </div>
              ) : (
                <div className="rounded-card border border-primary-soft/60 bg-background-card p-8 text-center shadow-soft">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-background-section text-primary-dark">
                    <SearchX size={26} aria-hidden="true" />
                  </div>
                  <p className="mt-5 font-heading text-3xl text-primary-dark">Chưa có sản phẩm phù hợp</p>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-text-secondary">
                    Bạn có thể thử đổi bộ lọc hoặc nhắn SUGONG qua Zalo để được tư vấn thêm.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary-soft bg-background-card px-5 text-sm font-medium text-primary-dark" type="button" onClick={clearFilters}>
                      <Sparkles size={16} aria-hidden="true" />
                      Xem tất cả sản phẩm
                    </button>
                    <a className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-background-card" href={zaloHref}>
                      Nhắn Zalo để tư vấn
                    </a>
                  </div>
                </div>
              )}

              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-2 pt-2" aria-label="Phân trang sản phẩm">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <button
                      className={cn(
                        "flex h-10 min-w-10 items-center justify-center rounded-button border px-3 text-sm font-medium transition",
                        pageNumber === safePage
                          ? "border-primary-soft bg-primary text-background-card"
                          : "border-primary-soft bg-background-card text-primary-dark hover:bg-background-section",
                      )}
                      type="button"
                      aria-current={pageNumber === safePage ? "page" : undefined}
                      onClick={() => setFilters({ page: pageNumber })}
                      key={pageNumber}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </nav>
              )}
            </div>
          </div>
        </div>
      </section>

      <FilterDrawer
        open={drawerOpen}
        maxPrice={maxPrice}
        colorTone={colorTone}
        customOnly={customOnly}
        onMaxPriceChange={(value) => setFilters({ maxPrice: value })}
        onColorToneChange={(value) => setFilters({ colorTone: value })}
        onCustomOnlyChange={(value) => setFilters({ customOnly: value })}
        onClose={() => setDrawerOpen(false)}
        onClear={() => {
          setDrawerOpen(false);
          clearFilters();
        }}
      />
    </>
  );
}
