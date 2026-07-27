import { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  ImagePlus,
  LoaderCircle,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { AdminProductInput, AdminProductRecord } from "../../server/catalog/product-input";
import { slugify } from "../../lib/slug";
import type { AdminApi, CatalogConfig, ProductDraft, ProductTemplateRecord } from "./admin-types";

type Props = {
  api: AdminApi;
  busy: boolean;
  config: CatalogConfig;
  products: AdminProductRecord[];
  setBusy: (value: boolean) => void;
  setMessage: (value: string) => void;
  reloadProducts: () => Promise<void>;
};

const editorSteps = [
  ["identity", "Thông tin"],
  ["classification", "Phân loại"],
  ["content", "Nội dung"],
  ["attributes", "Thông số"],
  ["media", "Hình ảnh"],
  ["publish", "Hiển thị"],
] as const;
type EditorStep = (typeof editorSteps)[number][0];

function emptyProduct(config: CatalogConfig, template?: ProductTemplateRecord): AdminProductInput {
  const category = config.categories.find((item) => item.id === template?.categoryId && item.isActive)
    ?? config.categories.find((item) => item.isActive);
  const productType = config.productTypes.find((item) => item.id === template?.productTypeId && item.isActive)
    ?? config.productTypes.find((item) => item.isActive);
  const defaults = template?.defaults ?? {};
  const colorGroup = config.classificationGroups.find((group) => group.slug === "mau-sac");
  const classifications = Array.isArray(defaults.classifications) ? defaults.classifications : [];
  const tones = colorGroup?.values
    .filter((value) => classifications.includes(value.id))
    .map((value) => value.slug) ?? [];

  return {
    slug: "",
    name: "",
    priceAmount: null,
    category: category?.slug ?? "",
    productType: productType?.slug,
    shortDescription: defaults.shortDescription ?? "",
    description: defaults.description ?? "",
    detailNote: defaults.detailNote ?? "",
    videoUrl: defaults.videoUrl ?? "",
    status: defaults.status ?? "draft",
    isFeatured: defaults.isFeatured ?? false,
    isCustomizable: defaults.isCustomizable ?? false,
    displayOrder: defaults.displayOrder ?? 0,
    tags: defaults.tags ?? [],
    tones,
    classifications,
    media: [],
    attributes: [],
  };
}

export function ProductManager({
  api,
  busy,
  config,
  products,
  setBusy,
  setMessage,
  reloadProducts,
}: Props) {
  const [editing, setEditing] = useState<ProductDraft | null>(null);
  const [search, setSearch] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi");
    if (!term) return products;
    return products.filter((product) =>
      `${product.name} ${product.slug} ${product.productType ?? ""}`.toLocaleLowerCase("vi").includes(term),
    );
  }, [products, search]);

  async function saveProduct(product: ProductDraft) {
    setBusy(true);
    setMessage("");
    try {
      const isUpdate = "id" in product && Boolean(product.id);
      const response = await api<{ item: AdminProductRecord }>(
        isUpdate ? `products/${product.id}` : "products",
        { method: isUpdate ? "PUT" : "POST", body: JSON.stringify(product) },
      );
      setEditing(response.item);
      setMessage(product.status === "published" ? "Đã lưu và yêu cầu cập nhật website." : "Đã lưu bản nháp.");
      await reloadProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function removeProduct(product: AdminProductRecord) {
    if (!window.confirm(`Xóa sản phẩm “${product.name}”? Ảnh Cloudinary liên quan cũng sẽ được dọn.`)) return;
    setBusy(true);
    try {
      await api(`products/${product.id}`, { method: "DELETE" });
      setEditing(null);
      setMessage("Đã xóa sản phẩm.");
      await reloadProducts();
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

  const templates = config.productTemplates.filter((item) => item.isActive);

  return (
    <div className="grid gap-5 xl:grid-cols-[21rem_minmax(0,1fr)]">
      <aside className="self-start rounded-[20px] bg-background-card p-4 shadow-soft ring-1 ring-border xl:sticky xl:top-24">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-primary">CATALOGUE</p>
            <h1 className="mt-1 font-heading text-2xl text-primary-dark">Sản phẩm</h1>
          </div>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-button bg-primary-dark px-3 text-sm text-background-card"
            onClick={() => setShowTemplates((value) => !value)}
          >
            <Plus size={16} /> Thêm
          </button>
        </div>

        {showTemplates && (
          <div className="mt-4 rounded-[16px] bg-background-section p-3">
            <p className="text-xs font-semibold text-primary-dark">Bắt đầu từ template</p>
            <div className="mt-2 space-y-1.5">
              <button
                className="flex w-full items-center justify-between rounded-[12px] bg-background-card px-3 py-2.5 text-left text-sm"
                onClick={() => {
                  setEditing(emptyProduct(config));
                  setShowTemplates(false);
                }}
              >
                Sản phẩm trống <ChevronRight size={15} />
              </button>
              {templates.map((template, index) => (
                <button
                  className="flex w-full items-start justify-between gap-3 rounded-[12px] px-3 py-2.5 text-left transition hover:bg-background-card"
                  key={template.id}
                  onClick={() => {
                    setEditing(emptyProduct(config, template));
                    setShowTemplates(false);
                  }}
                >
                  <span>
                    <span className="block text-sm font-medium text-primary-dark">{template.name}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-text-secondary">{template.description}</span>
                  </span>
                  {index === 0 && <Sparkles className="mt-0.5 shrink-0 text-primary" size={15} />}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
          <input
            className="min-h-11 w-full rounded-button border border-border bg-background-main pl-10 pr-3 text-sm"
            placeholder="Tìm tên, slug hoặc loại…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="scrollbar-none mt-3 max-h-[62dvh] space-y-1.5 overflow-y-auto">
          {filteredProducts.map((product) => (
            <button
              className={`w-full rounded-[14px] p-3 text-left transition ${
                "id" in (editing ?? {}) && editing?.id === product.id
                  ? "bg-background-section ring-1 ring-primary-soft"
                  : "hover:bg-background-main"
              }`}
              onClick={() => setEditing(product)}
              key={product.id}
            >
              <span className="block truncate font-medium text-primary-dark">{product.name}</span>
              <span className="mt-1 block truncate text-xs text-text-secondary">
                {config.productTypes.find((item) => item.slug === product.productType)?.name ?? product.category}
                {" · "}
                {product.status}
              </span>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-text-secondary">Không có sản phẩm phù hợp.</p>
          )}
        </div>
      </aside>

      <section className="min-w-0">
        {!editing ? (
          <div className="grid min-h-[34rem] place-items-center rounded-[24px] border border-dashed border-primary-soft bg-background-card/50 p-8 text-center">
            <div>
              <Sparkles className="mx-auto text-primary-soft" size={42} />
              <h2 className="mt-4 font-heading text-3xl text-primary-dark">Chọn sản phẩm để chỉnh sửa</h2>
              <p className="mx-auto mt-2 max-w-md leading-7 text-text-secondary">
                Hoặc chọn một template đã cấu hình để chỉ nhập những thông tin cần thiết.
              </p>
            </div>
          </div>
        ) : (
          <ProductEditor
            product={editing}
            config={config}
            busy={busy}
            onChange={setEditing}
            onSave={() => saveProduct(editing)}
            onDelete={"id" in editing ? () => removeProduct(editing as AdminProductRecord) : undefined}
            onUpload={uploadImages}
            onClose={() => setEditing(null)}
          />
        )}
      </section>
    </div>
  );
}

function ProductEditor({
  product,
  config,
  busy,
  onChange,
  onSave,
  onDelete,
  onUpload,
  onClose,
}: {
  product: ProductDraft;
  config: CatalogConfig;
  busy: boolean;
  onChange: (product: ProductDraft) => void;
  onSave: () => void;
  onDelete?: () => void;
  onUpload: (files: FileList | null) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<EditorStep>("identity");
  const update = <K extends keyof AdminProductInput>(key: K, value: AdminProductInput[K]) =>
    onChange({ ...product, [key]: value });
  const selectedType = config.productTypes.find((item) => item.slug === product.productType);
  const typeDefinitions = config.attributeDefinitions.filter((definition) =>
    selectedType?.attributeDefinitionIds.includes(definition.id),
  );

  function setClassification(groupId: string, valueId: string) {
    const group = config.classificationGroups.find((item) => item.id === groupId);
    if (!group) return;
    const groupValueIds = new Set(group.values.map((value) => value.id));
    const selected = product.classifications.includes(valueId);
    let classifications = product.classifications;
    if (group.selectionMode === "single") {
      classifications = selected
        ? classifications.filter((id) => id !== valueId)
        : [...classifications.filter((id) => !groupValueIds.has(id)), valueId];
    } else {
      classifications = selected
        ? classifications.filter((id) => id !== valueId)
        : [...classifications, valueId];
    }
    const colorGroup = config.classificationGroups.find((item) => item.slug === "mau-sac");
    const tones = colorGroup
      ? colorGroup.values.filter((value) => classifications.includes(value.id)).map((value) => value.slug)
      : product.tones;
    onChange({ ...product, classifications, tones });
  }

  function setAttribute(definitionId: string, value: string) {
    const definition = config.attributeDefinitions.find((item) => item.id === definitionId);
    if (!definition) return;
    const existingIndex = product.attributes.findIndex((item) => item.definitionId === definitionId);
    const next = [...product.attributes];
    const item = { definitionId, label: definition.name, value, position: existingIndex >= 0 ? next[existingIndex].position : next.length };
    if (existingIndex >= 0) next[existingIndex] = item;
    else next.push(item);
    update("attributes", next);
  }

  const completion = [
    Boolean(product.name && product.slug && product.category && product.productType),
    product.classifications.length > 0,
    Boolean(product.shortDescription),
    typeDefinitions.length === 0 || product.attributes.length > 0,
    product.media.length > 0,
    product.status === "published",
  ];

  return (
    <div className="overflow-hidden rounded-[24px] bg-background-card shadow-soft ring-1 ring-border">
      <header className="border-b border-border px-5 pb-0 pt-5 sm:px-7 sm:pt-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-primary">
              {selectedType?.name ?? "SẢN PHẨM MỚI"}
            </p>
            <h2 className="mt-1 text-balance font-heading text-3xl text-primary-dark">
              {product.name || "Chưa đặt tên"}
            </h2>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-button border border-border" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <nav className="scrollbar-none mt-6 flex gap-1 overflow-x-auto" aria-label="Các phần của sản phẩm">
          {editorSteps.map(([value, label], index) => (
            <button
              className={`relative shrink-0 px-3 pb-3 text-sm transition ${
                step === value ? "font-medium text-primary-dark" : "text-text-secondary hover:text-primary-dark"
              }`}
              onClick={() => setStep(value)}
              key={value}
            >
              <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-background-section text-[10px]">
                {completion[index] ? <Check size={11} /> : index + 1}
              </span>
              {label}
              {step === value && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-primary-dark" />}
            </button>
          ))}
        </nav>
      </header>

      <div className="min-h-[27rem] p-5 sm:p-7">
        {step === "identity" && (
          <EditorGrid>
            <Field label="Tên sản phẩm">
              <input
                value={product.name}
                onChange={(event) => {
                  const wasGenerated = !product.slug || product.slug === slugify(product.name);
                  onChange({
                    ...product,
                    name: event.target.value,
                    slug: wasGenerated ? slugify(event.target.value) : product.slug,
                  });
                }}
                required
              />
            </Field>
            <Field label="Slug">
              <input value={product.slug} onChange={(event) => update("slug", slugify(event.target.value))} required />
            </Field>
            <Field label="Loại sản phẩm">
              <select
                value={product.productType ?? ""}
                onChange={(event) => update("productType", event.target.value || undefined)}
              >
                <option value="">Chọn loại sản phẩm</option>
                {config.productTypes.filter((item) => item.isActive).map((item) => (
                  <option value={item.slug} key={item.id}>{item.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Danh mục chính">
              <select value={product.category} onChange={(event) => update("category", event.target.value)}>
                {config.categories.filter((item) => item.isActive).map((item) => (
                  <option value={item.slug} key={item.id}>{item.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Giá (VND, bỏ trống nếu liên hệ)">
              <input
                type="number"
                min="0"
                value={product.priceAmount ?? ""}
                onChange={(event) => update("priceAmount", event.target.value ? Number(event.target.value) : null)}
              />
            </Field>
            <Field label="Thứ tự hiển thị">
              <input
                type="number"
                min="0"
                value={product.displayOrder}
                onChange={(event) => update("displayOrder", Number(event.target.value))}
              />
            </Field>
          </EditorGrid>
        )}

        {step === "classification" && (
          <div className="space-y-7">
            {config.classificationGroups.filter((group) => group.isActive).map((group) => (
              <section key={group.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-xl text-primary-dark">{group.name}</h3>
                    {group.description && <p className="mt-1 text-sm text-text-secondary">{group.description}</p>}
                  </div>
                  <span className="text-xs text-text-secondary">
                    {group.selectionMode === "single" ? "Chọn một" : "Chọn nhiều"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.values.filter((value) => value.isActive).map((value) => {
                    const selected = product.classifications.includes(value.id)
                      || (group.slug === "mau-sac" && product.tones.includes(value.slug));
                    const hex = typeof value.metadata.hex === "string" ? value.metadata.hex : undefined;
                    return (
                      <button
                        className={`inline-flex min-h-10 items-center gap-2 rounded-button border px-3 text-sm transition ${
                          selected
                            ? "border-primary bg-background-section text-primary-dark"
                            : "border-border hover:border-primary-soft"
                        }`}
                        onClick={() => setClassification(group.id, value.id)}
                        key={value.id}
                      >
                        {hex && <span className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: hex }} />}
                        {value.name}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {step === "content" && (
          <EditorGrid>
            <Field label="Mô tả ngắn" wide>
              <textarea rows={3} value={product.shortDescription} onChange={(event) => update("shortDescription", event.target.value)} />
            </Field>
            <Field label="Mô tả đầy đủ" wide>
              <textarea rows={7} value={product.description ?? ""} onChange={(event) => update("description", event.target.value)} />
            </Field>
            <Field label="Ghi chú chi tiết" wide>
              <textarea rows={3} value={product.detailNote ?? ""} onChange={(event) => update("detailNote", event.target.value)} />
            </Field>
            <Field label="Video URL" wide>
              <input type="url" value={product.videoUrl ?? ""} onChange={(event) => update("videoUrl", event.target.value)} />
            </Field>
            <Field label="Tags" wide>
              <input
                placeholder="Nhập các tag, phân cách bằng dấu phẩy"
                value={product.tags.join(", ")}
                onChange={(event) => update("tags", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))}
              />
            </Field>
          </EditorGrid>
        )}

        {step === "attributes" && (
          <div>
            <h3 className="font-heading text-2xl text-primary-dark">
              Thông số cho {selectedType?.name ?? "loại sản phẩm"}
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Các trường này được cấu hình từ module Thuộc tính, không nằm cố định trong form.
            </p>
            {!selectedType ? (
              <p className="mt-8 rounded-[14px] bg-background-section p-4 text-sm text-primary-dark">
                Chọn loại sản phẩm trước để hiển thị bộ thông số phù hợp.
              </p>
            ) : typeDefinitions.length === 0 ? (
              <p className="mt-8 rounded-[14px] bg-background-section p-4 text-sm text-primary-dark">
                Loại sản phẩm này chưa được gán thuộc tính.
              </p>
            ) : (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {typeDefinitions.map((definition) => {
                  const value = product.attributes.find((item) => item.definitionId === definition.id)?.value ?? "";
                  return (
                    <Field label={`${definition.name}${definition.unit ? ` (${definition.unit})` : ""}`} key={definition.id}>
                      {definition.dataType === "select" ? (
                        <select value={value} onChange={(event) => setAttribute(definition.id, event.target.value)}>
                          <option value="">Chọn giá trị</option>
                          {definition.options.map((option) => (
                            <option value={option.value} key={option.value}>{option.label}</option>
                          ))}
                        </select>
                      ) : definition.dataType === "boolean" ? (
                        <select value={value} onChange={(event) => setAttribute(definition.id, event.target.value)}>
                          <option value="">Chọn giá trị</option>
                          <option value="Có">Có</option>
                          <option value="Không">Không</option>
                        </select>
                      ) : (
                        <input
                          type={definition.dataType === "number" ? "number" : "text"}
                          value={value}
                          onChange={(event) => setAttribute(definition.id, event.target.value)}
                        />
                      )}
                    </Field>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === "media" && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-2xl text-primary-dark">Gallery sản phẩm</h3>
                <p className="mt-1 text-sm text-text-secondary">Upload trực tiếp có chữ ký lên Cloudinary.</p>
              </div>
              <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-button border border-primary-soft px-4 text-sm font-medium text-primary-dark">
                <ImagePlus size={16} /> Upload ảnh
                <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => onUpload(event.target.files)} />
              </label>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {product.media.map((media, index) => (
                <article className="overflow-hidden rounded-[16px] bg-background-main ring-1 ring-border" key={`${media.publicId ?? media.secureUrl}-${index}`}>
                  <img className="aspect-[4/3] w-full object-cover" src={media.secureUrl} alt={media.alt} />
                  <div className="space-y-3 p-3">
                    <input
                      className="w-full rounded-button border border-border bg-background-card px-3 py-2 text-xs"
                      value={media.alt}
                      onChange={(event) => update("media", product.media.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, alt: event.target.value } : item,
                      ))}
                    />
                    <div className="flex items-center justify-between">
                      <label className="text-xs">
                        <input
                          type="radio"
                          name="cover"
                          checked={media.isCover}
                          onChange={() => update("media", product.media.map((item, itemIndex) => ({ ...item, isCover: itemIndex === index })))}
                        />{" "}
                        Ảnh bìa
                      </label>
                      <button
                        className="text-red-700"
                        onClick={() => update("media", product.media.filter((_, itemIndex) => itemIndex !== index).map((item, position) => ({ ...item, position, isCover: position === 0 ? true : item.isCover })))}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              {product.media.length === 0 && (
                <label className="grid min-h-56 cursor-pointer place-items-center rounded-[18px] border border-dashed border-primary-soft bg-background-section/40 text-center">
                  <span>
                    <ImagePlus className="mx-auto text-primary-soft" size={32} />
                    <span className="mt-2 block text-sm text-primary-dark">Thêm ảnh đầu tiên</span>
                  </span>
                  <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => onUpload(event.target.files)} />
                </label>
              )}
            </div>
          </div>
        )}

        {step === "publish" && (
          <EditorGrid>
            <Field label="Trạng thái">
              <select value={product.status} onChange={(event) => update("status", event.target.value as AdminProductInput["status"])}>
                <option value="draft">Bản nháp</option>
                <option value="published">Xuất bản</option>
                <option value="hidden">Ẩn khỏi website</option>
              </select>
            </Field>
            <div className="space-y-3 rounded-[16px] bg-background-section p-4">
              <Toggle label="Ưu tiên ở khu vực nổi bật" checked={product.isFeatured} onChange={(value) => update("isFeatured", value)} />
              <Toggle label="Có thể cá nhân hóa" checked={product.isCustomizable} onChange={(value) => update("isCustomizable", value)} />
            </div>
            <div className="md:col-span-2">
              <h3 className="font-heading text-xl text-primary-dark">Kiểm tra trước khi xuất bản</h3>
              <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {[
                  ["Tên, slug, loại và danh mục", completion[0]],
                  ["Có ít nhất một phân loại", completion[1]],
                  ["Có mô tả ngắn", completion[2]],
                  ["Đã nhập thông số", completion[3]],
                  ["Có ảnh sản phẩm", completion[4]],
                ].map(([label, done]) => (
                  <li className={`flex items-center gap-2 ${done ? "text-primary-dark" : "text-text-secondary"}`} key={String(label)}>
                    <span className={`grid h-5 w-5 place-items-center rounded-full ${done ? "bg-primary-dark text-background-card" : "bg-background-section"}`}>
                      {done ? <Check size={11} /> : "·"}
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </EditorGrid>
        )}
      </div>

      <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background-card/95 px-5 py-4 backdrop-blur sm:px-7">
        {onDelete ? (
          <button className="inline-flex min-h-11 items-center gap-2 rounded-button px-3 text-sm text-red-700 hover:bg-red-50" onClick={onDelete}>
            <Trash2 size={16} /> Xóa
          </button>
        ) : <span />}
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-button bg-primary-dark px-5 font-medium text-background-card disabled:opacity-50"
          disabled={busy}
          onClick={onSave}
        >
          {busy ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}
          {product.status === "published" ? "Lưu và xuất bản" : "Lưu bản nháp"}
        </button>
      </footer>
    </div>
  );
}

function EditorGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 text-sm text-primary-dark">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
