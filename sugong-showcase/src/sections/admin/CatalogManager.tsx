import { useMemo, useState } from "react";
import {
  Archive,
  Boxes,
  FolderTree,
  Layers3,
  ListFilter,
  Plus,
  Save,
  Shapes,
  Sparkles,
  Tags,
} from "lucide-react";
import type { AdminApi, CatalogConfig } from "./admin-types";

type Resource =
  | "categories"
  | "product-types"
  | "classification-groups"
  | "classification-values"
  | "attribute-definitions"
  | "product-templates"
  | "collections";
type Section = Exclude<Resource, "classification-values">;
type Draft = Record<string, any> & { _resource: Resource; id?: string };

type Props = {
  api: AdminApi;
  config: CatalogConfig;
  reloadConfig: () => Promise<void>;
  setMessage: (message: string) => void;
};

const sections = [
  ["product-types", "Loại sản phẩm", Shapes],
  ["categories", "Danh mục", FolderTree],
  ["classification-groups", "Phân loại", ListFilter],
  ["attribute-definitions", "Thuộc tính", Tags],
  ["product-templates", "Template", Sparkles],
  ["collections", "Collection", Layers3],
] as const;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function initialDraft(resource: Resource, groupId?: string): Draft {
  const base = { _resource: resource, name: "", slug: "", displayOrder: 0, isActive: true };
  if (resource === "categories") return { ...base, description: "", parentId: null };
  if (resource === "product-types") return { ...base, description: "", attributeDefinitionIds: [] };
  if (resource === "classification-groups") {
    return { ...base, description: "", selectionMode: "multiple", isFilterable: true };
  }
  if (resource === "classification-values") {
    return { ...base, groupId, metadata: {}, hex: "" };
  }
  if (resource === "attribute-definitions") {
    return { ...base, dataType: "text", unit: "", optionsText: "", isFilterable: false };
  }
  if (resource === "product-templates") {
    return {
      ...base,
      description: "",
      productTypeId: null,
      categoryId: null,
      priority: 0,
      shortDescription: "",
      isCustomizable: false,
      classificationIds: [],
    };
  }
  return { ...base, description: "", status: "draft" };
}

export function CatalogManager({ api, config, reloadConfig, setMessage }: Props) {
  const [section, setSection] = useState<Section>("product-types");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState(config.classificationGroups[0]?.id ?? "");
  const selectedGroup = config.classificationGroups.find((group) => group.id === selectedGroupId)
    ?? config.classificationGroups[0];

  const sectionItems = useMemo(() => {
    if (section === "product-types") return config.productTypes;
    if (section === "categories") return config.categories;
    if (section === "classification-groups") return config.classificationGroups;
    if (section === "attribute-definitions") return config.attributeDefinitions;
    if (section === "product-templates") return config.productTemplates;
    return config.collections;
  }, [config, section]);

  function edit(resource: Resource, item: Record<string, unknown>) {
    const next: Draft = { ...item, _resource: resource };
    if (resource === "classification-values") {
      next.hex = typeof (item.metadata as Record<string, unknown> | undefined)?.hex === "string"
        ? (item.metadata as Record<string, unknown>).hex
        : "";
    }
    if (resource === "attribute-definitions") {
      next.optionsText = Array.isArray(item.options)
        ? item.options.map((option: { label: string; value: string }) => `${option.label}:${option.value}`).join("\n")
        : "";
    }
    if (resource === "product-templates") {
      const defaults = (item.defaults ?? {}) as Record<string, unknown>;
      next.shortDescription = defaults.shortDescription ?? "";
      next.isCustomizable = defaults.isCustomizable ?? false;
      next.classificationIds = Array.isArray(defaults.classifications) ? defaults.classifications : [];
    }
    setDraft(next);
  }

  async function save() {
    if (!draft) return;
    const { _resource: resource, id, ...payload } = draft;
    if (resource === "classification-values") {
      payload.metadata = draft.hex ? { ...draft.metadata, hex: draft.hex } : draft.metadata ?? {};
      delete payload.hex;
    }
    if (resource === "attribute-definitions") {
      payload.options = String(draft.optionsText ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [label, value] = line.split(":").map((part) => part.trim());
          return { label, value: value || slugify(label) };
        });
      delete payload.optionsText;
      delete payload.description;
      delete payload.displayOrder;
    }
    if (resource === "product-templates") {
      payload.defaults = {
        ...(draft.defaults ?? {}),
        shortDescription: draft.shortDescription,
        isCustomizable: draft.isCustomizable,
        status: "draft",
        classifications: draft.classificationIds ?? [],
      };
      delete payload.shortDescription;
      delete payload.isCustomizable;
      delete payload.classificationIds;
      delete payload.displayOrder;
    }
    if (resource === "collections") {
      delete payload.isActive;
    }

    try {
      await api(`${resource}${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setMessage(`Đã lưu ${draft.name}.`);
      setDraft(null);
      await reloadConfig();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function archive() {
    if (!draft?.id) return;
    try {
      await api(`${draft._resource}/${draft.id}`, { method: "DELETE" });
      setMessage(`Đã ngừng sử dụng ${draft.name}. Dữ liệu cũ vẫn được giữ.`);
      setDraft(null);
      await reloadConfig();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-primary">CATALOGUE STRUCTURE</p>
          <h1 className="mt-1 font-heading text-3xl text-primary-dark">Cấu trúc catalogue</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
            Quản lý dữ liệu dùng chung trước, sau đó form sản phẩm sẽ tự hiển thị đúng lựa chọn.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-button bg-primary-dark px-4 text-sm font-medium text-background-card"
          onClick={() => setDraft(initialDraft(section))}
        >
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      <nav className="scrollbar-none mt-6 flex gap-2 overflow-x-auto border-b border-border pb-3" aria-label="Cấu trúc catalogue">
        {sections.map(([value, label, Icon]) => (
          <button
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-button px-3 text-sm transition ${
              section === value ? "bg-primary-dark text-background-card" : "bg-background-card text-primary-dark hover:bg-background-section"
            }`}
            onClick={() => {
              setSection(value);
              setDraft(null);
            }}
            key={value}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </nav>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <section className="min-w-0">
          {section === "classification-groups" ? (
            <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
              <div className="space-y-2">
                {config.classificationGroups.map((group) => (
                  <button
                    className={`w-full rounded-[14px] p-3 text-left ${selectedGroup?.id === group.id ? "bg-background-section ring-1 ring-primary-soft" : "bg-background-card hover:bg-background-main"}`}
                    onClick={() => setSelectedGroupId(group.id)}
                    key={group.id}
                  >
                    <span className="block font-medium text-primary-dark">{group.name}</span>
                    <span className="mt-1 block text-xs text-text-secondary">{group.values.length} giá trị</span>
                  </button>
                ))}
              </div>
              <div className="rounded-[20px] bg-background-card p-4 shadow-soft ring-1 ring-border">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-2xl text-primary-dark">{selectedGroup?.name ?? "Chưa có nhóm"}</h2>
                    <p className="mt-1 text-xs text-text-secondary">{selectedGroup?.description}</p>
                  </div>
                  {selectedGroup && (
                    <div className="flex gap-2">
                      <button className="rounded-button border border-border px-3 py-2 text-xs" onClick={() => edit("classification-groups", selectedGroup)}>
                        Sửa nhóm
                      </button>
                      <button className="rounded-button bg-primary-dark px-3 py-2 text-xs text-background-card" onClick={() => setDraft(initialDraft("classification-values", selectedGroup.id))}>
                        Thêm giá trị
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {selectedGroup?.values.map((value) => (
                    <button
                      className="flex items-center justify-between rounded-[14px] bg-background-main p-3 text-left hover:ring-1 hover:ring-primary-soft"
                      onClick={() => edit("classification-values", value)}
                      key={value.id}
                    >
                      <span className="flex items-center gap-2">
                        {typeof value.metadata.hex === "string" && (
                          <span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ backgroundColor: value.metadata.hex }} />
                        )}
                        <span>
                          <span className="block text-sm font-medium text-primary-dark">{value.name}</span>
                          <span className="text-xs text-text-secondary">{value.slug}</span>
                        </span>
                      </span>
                      {!value.isActive && <span className="text-xs text-text-secondary">Đã tắt</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {sectionItems.map((item) => (
                <button
                  className="group min-h-36 rounded-[18px] bg-background-card p-4 text-left shadow-soft ring-1 ring-border transition hover:-translate-y-0.5 hover:ring-primary-soft"
                  onClick={() => edit(section, item as unknown as Record<string, unknown>)}
                  key={item.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-background-section text-primary-dark">
                      <Boxes size={17} />
                    </span>
                    {"isActive" in item && !item.isActive && <span className="text-xs text-text-secondary">Đã tắt</span>}
                  </div>
                  <span className="mt-4 block font-medium text-primary-dark">{item.name}</span>
                  <span className="mt-1 block text-xs text-text-secondary">
                    {item.slug}
                    {section === "product-templates" ? ` · ưu tiên ${(item as CatalogConfig["productTemplates"][number]).priority}` : ""}
                  </span>
                </button>
              ))}
              {sectionItems.length === 0 && (
                <div className="sm:col-span-2 2xl:col-span-3 rounded-[20px] border border-dashed border-primary-soft p-10 text-center text-sm text-text-secondary">
                  Chưa có dữ liệu. Chọn “Thêm mới” để bắt đầu.
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="self-start xl:sticky xl:top-24">
          {draft ? (
            <EditorPanel
              draft={draft}
              config={config}
              setDraft={setDraft}
              onSave={save}
              onArchive={draft.id ? archive : undefined}
              onClose={() => setDraft(null)}
            />
          ) : (
            <div className="rounded-[20px] border border-dashed border-primary-soft bg-background-card/50 p-7">
              <h2 className="font-heading text-2xl text-primary-dark">Chọn dữ liệu để chỉnh sửa</h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Mỗi thay đổi ở đây sẽ trở thành lựa chọn dùng chung trong form sản phẩm.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function EditorPanel({
  draft,
  config,
  setDraft,
  onSave,
  onArchive,
  onClose,
}: {
  draft: Draft;
  config: CatalogConfig;
  setDraft: (draft: Draft) => void;
  onSave: () => void;
  onArchive?: () => void;
  onClose: () => void;
}) {
  const update = (key: string, value: unknown) => setDraft({ ...draft, [key]: value });
  const title = sections.find(([value]) => value === draft._resource)?.[1]
    ?? (draft._resource === "classification-values" ? "Giá trị phân loại" : "Dữ liệu");

  return (
    <div className="rounded-[20px] bg-background-card p-5 shadow-soft ring-1 ring-border">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.1em] text-primary">{title}</p>
          <h2 className="mt-1 font-heading text-2xl text-primary-dark">{draft.name || "Thêm mới"}</h2>
        </div>
        <button className="text-sm text-text-secondary" onClick={onClose}>Đóng</button>
      </div>

      <div className="mt-5 space-y-4">
        <Input label="Tên">
          <input
            value={draft.name ?? ""}
            onChange={(event) => {
              const generated = !draft.slug || draft.slug === slugify(draft.name ?? "");
              setDraft({ ...draft, name: event.target.value, slug: generated ? slugify(event.target.value) : draft.slug });
            }}
          />
        </Input>
        <Input label="Slug"><input value={draft.slug ?? ""} onChange={(event) => update("slug", slugify(event.target.value))} /></Input>

        {"description" in draft && (
          <Input label="Mô tả"><textarea rows={3} value={draft.description ?? ""} onChange={(event) => update("description", event.target.value)} /></Input>
        )}
        {draft._resource === "categories" && (
          <Input label="Danh mục cha">
            <select value={draft.parentId ?? ""} onChange={(event) => update("parentId", event.target.value || null)}>
              <option value="">Không có</option>
              {config.categories.filter((item) => item.id !== draft.id).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
          </Input>
        )}
        {draft._resource === "product-types" && (
          <Input label="Bộ thuộc tính">
            <div className="grid gap-2">
              {config.attributeDefinitions.filter((item) => item.isActive).map((definition) => (
                <label className="flex items-center gap-2 rounded-[12px] bg-background-main px-3 py-2 text-sm" key={definition.id}>
                  <input
                    type="checkbox"
                    checked={(draft.attributeDefinitionIds ?? []).includes(definition.id)}
                    onChange={() => update(
                      "attributeDefinitionIds",
                      (draft.attributeDefinitionIds ?? []).includes(definition.id)
                        ? draft.attributeDefinitionIds.filter((id: string) => id !== definition.id)
                        : [...(draft.attributeDefinitionIds ?? []), definition.id],
                    )}
                  />
                  {definition.name}
                </label>
              ))}
            </div>
          </Input>
        )}
        {draft._resource === "classification-groups" && (
          <>
            <Input label="Cách chọn">
              <select value={draft.selectionMode} onChange={(event) => update("selectionMode", event.target.value)}>
                <option value="multiple">Chọn nhiều</option>
                <option value="single">Chọn một</option>
              </select>
            </Input>
            <CheckField label="Cho phép dùng làm bộ lọc" checked={draft.isFilterable} onChange={(value) => update("isFilterable", value)} />
          </>
        )}
        {draft._resource === "classification-values" && (
          <Input label="Màu swatch (không bắt buộc)">
            <input type="color" value={draft.hex || "#795a9b"} onChange={(event) => update("hex", event.target.value)} />
          </Input>
        )}
        {draft._resource === "attribute-definitions" && (
          <>
            <Input label="Kiểu dữ liệu">
              <select value={draft.dataType} onChange={(event) => update("dataType", event.target.value)}>
                <option value="text">Văn bản</option>
                <option value="number">Số</option>
                <option value="boolean">Có / Không</option>
                <option value="select">Chọn một</option>
                <option value="multi_select">Chọn nhiều</option>
              </select>
            </Input>
            <Input label="Đơn vị"><input value={draft.unit ?? ""} onChange={(event) => update("unit", event.target.value)} placeholder="cm, gram…" /></Input>
            {["select", "multi_select"].includes(draft.dataType) && (
              <Input label="Các lựa chọn (mỗi dòng: Tên:slug)">
                <textarea rows={5} value={draft.optionsText ?? ""} onChange={(event) => update("optionsText", event.target.value)} />
              </Input>
            )}
            <CheckField label="Cho phép dùng làm bộ lọc" checked={draft.isFilterable} onChange={(value) => update("isFilterable", value)} />
          </>
        )}
        {draft._resource === "product-templates" && (
          <>
            <Input label="Loại sản phẩm">
              <select value={draft.productTypeId ?? ""} onChange={(event) => update("productTypeId", event.target.value || null)}>
                <option value="">Chưa chọn</option>
                {config.productTypes.filter((item) => item.isActive).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </Input>
            <Input label="Danh mục">
              <select value={draft.categoryId ?? ""} onChange={(event) => update("categoryId", event.target.value || null)}>
                <option value="">Chưa chọn</option>
                {config.categories.filter((item) => item.isActive).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </Input>
            <Input label="Mô tả ngắn mặc định">
              <textarea rows={3} value={draft.shortDescription ?? ""} onChange={(event) => update("shortDescription", event.target.value)} />
            </Input>
            <Input label="Phân loại mặc định">
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {config.classificationGroups.flatMap((group) =>
                  group.values.filter((value) => value.isActive).map((value) => (
                    <label className="flex items-center gap-2 text-sm" key={value.id}>
                      <input
                        type="checkbox"
                        checked={(draft.classificationIds ?? []).includes(value.id)}
                        onChange={() => update(
                          "classificationIds",
                          (draft.classificationIds ?? []).includes(value.id)
                            ? draft.classificationIds.filter((id: string) => id !== value.id)
                            : [...(draft.classificationIds ?? []), value.id],
                        )}
                      />
                      <span className="text-text-secondary">{group.name}:</span> {value.name}
                    </label>
                  )),
                )}
              </div>
            </Input>
            <Input label="Độ ưu tiên"><input type="number" min="0" value={draft.priority ?? 0} onChange={(event) => update("priority", Number(event.target.value))} /></Input>
            <CheckField label="Mặc định cho phép cá nhân hóa" checked={draft.isCustomizable} onChange={(value) => update("isCustomizable", value)} />
          </>
        )}
        {draft._resource === "collections" && (
          <Input label="Trạng thái">
            <select value={draft.status} onChange={(event) => update("status", event.target.value)}>
              <option value="draft">Nháp</option>
              <option value="published">Đã xuất bản</option>
              <option value="hidden">Ẩn</option>
            </select>
          </Input>
        )}
        {"displayOrder" in draft && draft._resource !== "product-templates" && (
          <Input label="Thứ tự"><input type="number" min="0" value={draft.displayOrder ?? 0} onChange={(event) => update("displayOrder", Number(event.target.value))} /></Input>
        )}
        {"isActive" in draft && draft._resource !== "collections" && (
          <CheckField label="Đang sử dụng" checked={draft.isActive} onChange={(value) => update("isActive", value)} />
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
        {onArchive ? (
          <button className="inline-flex items-center gap-2 px-2 py-2 text-sm text-red-700" onClick={onArchive}>
            <Archive size={15} /> Ngừng dùng
          </button>
        ) : <span />}
        <button className="inline-flex min-h-10 items-center gap-2 rounded-button bg-primary-dark px-4 text-sm font-medium text-background-card" onClick={onSave}>
          <Save size={15} /> Lưu
        </button>
      </div>
    </div>
  );
}

function Input({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <label className="block text-sm font-medium text-primary-dark">
      <span className="mb-2 block">{label}</span>
      <span className="[&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-button [&_input]:border [&_input]:border-border [&_input]:bg-background-main [&_input]:px-3 [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-button [&_select]:border [&_select]:border-border [&_select]:bg-background-main [&_select]:px-3 [&_textarea]:w-full [&_textarea]:rounded-button [&_textarea]:border [&_textarea]:border-border [&_textarea]:bg-background-main [&_textarea]:p-3">
        {children}
      </span>
    </label>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-[12px] bg-background-main px-3 py-2 text-sm text-primary-dark">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
