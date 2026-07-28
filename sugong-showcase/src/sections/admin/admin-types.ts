import type { AdminProductInput, AdminProductRecord } from "../../server/catalog/product-input";

export type AdminApi = <T>(path: string, init?: RequestInit) => Promise<T>;

export type CategoryRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
};

export type ProductTypeRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  attributeDefinitionIds: string[];
};

export type ClassificationValueRecord = {
  id: string;
  groupId: string;
  slug: string;
  name: string;
  metadata: Record<string, unknown>;
  displayOrder: number;
  isActive: boolean;
};

export type ClassificationGroupRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  selectionMode: "single" | "multiple";
  isFilterable: boolean;
  displayOrder: number;
  isActive: boolean;
  values: ClassificationValueRecord[];
};

export type AttributeDefinitionRecord = {
  id: string;
  slug: string;
  name: string;
  dataType: "text" | "number" | "boolean" | "select" | "multi_select";
  unit: string | null;
  options: Array<{ label: string; value: string }>;
  isFilterable: boolean;
  isActive: boolean;
};

export type ProductTemplateRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  productTypeId: string | null;
  categoryId: string | null;
  defaults: Partial<AdminProductInput> & { classifications?: string[] };
  priority: number;
  isActive: boolean;
};

export type CollectionRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: "draft" | "published" | "hidden";
  displayOrder: number;
};

export type CatalogConfig = {
  categories: CategoryRecord[];
  productTypes: ProductTypeRecord[];
  classificationGroups: ClassificationGroupRecord[];
  attributeDefinitions: AttributeDefinitionRecord[];
  productTemplates: ProductTemplateRecord[];
  collections: CollectionRecord[];
};

export type ImportPreview = {
  rows: Array<Record<string, unknown>>;
  errors: Array<{ row: number; message: string }>;
  totalRows: number;
};

export type ProductDraft = AdminProductInput | AdminProductRecord;
