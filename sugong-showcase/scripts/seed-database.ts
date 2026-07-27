import "dotenv/config";
import { eq } from "drizzle-orm";
import { localProducts } from "../src/data/local/products";
import { graduationHats } from "../src/data/local/graduation-hats";
import { productCategoryMeta, productToneFilters, type ProductTone } from "../src/domain/product/product-taxonomy";
import type { Product } from "../src/domain/product/product.types";
import { mapToteBagsToProducts } from "../src/lib/tote-bags";
import { AdminCatalogService } from "../src/server/catalog/admin-catalog.service";
import { closeDatabase, getDatabase } from "../src/server/db/client";
import {
  attributeDefinitions,
  categories,
  classificationGroups,
  classificationValues,
  collectionProducts,
  collections,
  productTemplates,
  productTypeAttributes,
  productTypes,
  tones,
} from "../src/server/db/schema";

const db = getDatabase();
const admin = new AdminCatalogService();

const productTypeByCategory: Record<Product["category"], string> = {
  bag: "tui-handmade",
  scrunchie: "scrunchie",
  gift: "set-qua-tang",
  custom: "san-pham-ca-nhan-hoa",
  graduation: "non-tot-nghiep",
};

function mapProduct(product: Product) {
  return {
    legacyId: product.id,
    slug: product.slug,
    name: product.name,
    priceAmount: product.price,
    category: product.category,
    productType: productTypeByCategory[product.category],
    shortDescription: product.shortDescription,
    description: product.description,
    detailNote: product.detailNote,
    videoUrl: product.videoUrl,
    status: product.status,
    isFeatured: product.isFeatured,
    isCustomizable: product.customizable,
    displayOrder: product.displayOrder,
    tags: product.tags,
    tones: product.tones,
    media: product.images.map((image, index) => ({
      publicId: image.publicId,
      secureUrl: image.url,
      width: image.width,
      height: image.height,
      alt: image.alt,
      position: image.sortOrder ?? index,
      isCover: image.url === product.coverImage.url,
    })),
    attributes: (product.detailItems ?? []).map((item, index) => ({ ...item, position: index })),
  };
}

const productTypeSeeds = [
  { slug: "tui-handmade", name: "Túi handmade", description: "Túi tote, túi rút và các mẫu túi may thủ công.", displayOrder: 0 },
  { slug: "scrunchie", name: "Scrunchie", description: "Phụ kiện tóc may thủ công.", displayOrder: 1 },
  { slug: "non-tot-nghiep", name: "Nón tốt nghiệp", description: "Nón tốt nghiệp trang trí hoa, charm và chữ.", displayOrder: 2 },
  { slug: "hoa-len", name: "Hoa len", description: "Hoa và bó hoa móc len dùng làm quà tặng.", displayOrder: 3 },
  { slug: "moc-khoa", name: "Móc khóa handmade", description: "Móc khóa len, vải hoặc charm cá nhân hóa.", displayOrder: 4 },
  { slug: "set-qua-tang", name: "Set quà tặng", description: "Nhóm nhiều món thành một set quà.", displayOrder: 5 },
  { slug: "san-pham-ca-nhan-hoa", name: "Sản phẩm cá nhân hóa", description: "Sản phẩm làm theo tên, màu hoặc concept riêng.", displayOrder: 6 },
] as const;

const attributeSeeds = [
  { slug: "chat-lieu", name: "Chất liệu", dataType: "text" as const, isFilterable: true },
  { slug: "kich-thuoc", name: "Kích thước", dataType: "text" as const, unit: "cm" },
  { slug: "kieu-quai", name: "Kiểu quai", dataType: "select" as const, options: [
    { label: "Quai ngắn", value: "quai-ngan" },
    { label: "Quai dài", value: "quai-dai" },
    { label: "Có thể điều chỉnh", value: "dieu-chinh" },
  ] },
  { slug: "so-mat", name: "Số mặt sử dụng", dataType: "number" as const },
  { slug: "duong-kinh", name: "Đường kính", dataType: "number" as const, unit: "cm" },
  { slug: "loai-soi", name: "Loại sợi", dataType: "text" as const },
  { slug: "so-luong-hoa", name: "Số lượng hoa", dataType: "number" as const },
  { slug: "kich-thuoc-non", name: "Kích thước nón", dataType: "text" as const },
  { slug: "chi-tiet-trang-tri", name: "Chi tiết trang trí", dataType: "text" as const },
  { slug: "noi-dung-ca-nhan-hoa", name: "Nội dung cá nhân hóa", dataType: "text" as const },
] as const;

const typeAttributeSlugs: Record<string, string[]> = {
  "tui-handmade": ["chat-lieu", "kich-thuoc", "kieu-quai", "so-mat"],
  scrunchie: ["chat-lieu", "duong-kinh"],
  "non-tot-nghiep": ["kich-thuoc-non", "chi-tiet-trang-tri", "noi-dung-ca-nhan-hoa"],
  "hoa-len": ["loai-soi", "kich-thuoc", "so-luong-hoa"],
  "moc-khoa": ["chat-lieu", "kich-thuoc", "noi-dung-ca-nhan-hoa"],
  "set-qua-tang": ["kich-thuoc", "chi-tiet-trang-tri", "noi-dung-ca-nhan-hoa"],
  "san-pham-ca-nhan-hoa": ["chat-lieu", "kich-thuoc", "noi-dung-ca-nhan-hoa"],
};

const classificationSeeds = [
  {
    slug: "mau-sac",
    name: "Màu sắc",
    description: "Màu chủ đạo hoặc màu phối của sản phẩm.",
    selectionMode: "multiple" as const,
    displayOrder: 0,
    values: [
      ["orange", "Cam", "#d89a59"],
      ["pink", "Hồng", "#e8a7bc"],
      ["cream", "Kem", "#eee0c9"],
      ["lavender", "Lavender", "#9b7ab7"],
      ["blue", "Xanh dương", "#8ea8d8"],
      ["green", "Xanh lá", "#8fb48a"],
      ["lilac", "Lilac", "#cbb5df"],
      ["neutral", "Trung tính", "#c9c0b8"],
    ],
  },
  {
    slug: "tone",
    name: "Tone",
    description: "Cảm giác màu tổng thể, tách biệt với màu cụ thể.",
    selectionMode: "multiple" as const,
    displayOrder: 1,
    values: [
      ["pastel", "Pastel", ""],
      ["earth-tone", "Earth tone", ""],
      ["trung-tinh", "Trung tính", ""],
      ["tuoi-sang", "Tươi sáng", ""],
      ["vintage", "Vintage", ""],
    ],
  },
  {
    slug: "dip-su-dung",
    name: "Dịp sử dụng",
    description: "Dịp hoặc mục đích tặng sản phẩm.",
    selectionMode: "multiple" as const,
    displayOrder: 2,
    values: [
      ["tot-nghiep", "Tốt nghiệp", ""],
      ["sinh-nhat", "Sinh nhật", ""],
      ["ky-niem", "Kỷ niệm", ""],
      ["qua-tang-hang-ngay", "Quà tặng hằng ngày", ""],
    ],
  },
  {
    slug: "phong-cach",
    name: "Phong cách",
    description: "Ngôn ngữ thiết kế của sản phẩm.",
    selectionMode: "multiple" as const,
    displayOrder: 3,
    values: [
      ["de-thuong", "Dễ thương", ""],
      ["toi-gian", "Tối giản", ""],
      ["hoa-la", "Hoa lá", ""],
      ["thanh-lich", "Thanh lịch", ""],
    ],
  },
] as const;

async function seedCatalogConfiguration() {
  const productTypeIds = new Map<string, string>();
  for (const item of productTypeSeeds) {
    const [saved] = await db
      .insert(productTypes)
      .values({ ...item, isActive: true })
      .onConflictDoUpdate({
        target: productTypes.slug,
        set: { name: item.name, description: item.description, displayOrder: item.displayOrder, isActive: true, updatedAt: new Date() },
      })
      .returning({ id: productTypes.id });
    productTypeIds.set(item.slug, saved.id);
  }

  const definitionIds = new Map<string, string>();
  for (const item of attributeSeeds) {
    const [saved] = await db
      .insert(attributeDefinitions)
      .values({ ...item, options: "options" in item ? [...item.options] : [], isActive: true })
      .onConflictDoUpdate({
        target: attributeDefinitions.slug,
        set: {
          name: item.name,
          dataType: item.dataType,
          unit: "unit" in item ? item.unit : null,
          options: "options" in item ? [...item.options] : [],
          isFilterable: "isFilterable" in item ? item.isFilterable : false,
          isActive: true,
          updatedAt: new Date(),
        },
      })
      .returning({ id: attributeDefinitions.id });
    definitionIds.set(item.slug, saved.id);
  }

  for (const [typeSlug, definitionSlugs] of Object.entries(typeAttributeSlugs)) {
    const productTypeId = productTypeIds.get(typeSlug);
    if (!productTypeId) continue;
    await db.delete(productTypeAttributes).where(eq(productTypeAttributes.productTypeId, productTypeId));
    const values = definitionSlugs.flatMap((slug, displayOrder) => {
      const attributeDefinitionId = definitionIds.get(slug);
      return attributeDefinitionId ? [{ productTypeId, attributeDefinitionId, displayOrder }] : [];
    });
    if (values.length > 0) await db.insert(productTypeAttributes).values(values);
  }

  const classificationIds = new Map<string, string>();
  for (const group of classificationSeeds) {
    const [savedGroup] = await db
      .insert(classificationGroups)
      .values({
        slug: group.slug,
        name: group.name,
        description: group.description,
        selectionMode: group.selectionMode,
        displayOrder: group.displayOrder,
        isActive: true,
        isFilterable: true,
      })
      .onConflictDoUpdate({
        target: classificationGroups.slug,
        set: { name: group.name, description: group.description, selectionMode: group.selectionMode, displayOrder: group.displayOrder, isActive: true, updatedAt: new Date() },
      })
      .returning({ id: classificationGroups.id });
    for (const [displayOrder, value] of group.values.entries()) {
      const [slug, name, hex] = value;
      const [savedValue] = await db
        .insert(classificationValues)
        .values({
          groupId: savedGroup.id,
          slug,
          name,
          metadata: hex ? { hex } : {},
          displayOrder,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: [classificationValues.groupId, classificationValues.slug],
          set: { name, metadata: hex ? { hex } : {}, displayOrder, isActive: true, updatedAt: new Date() },
        })
        .returning({ id: classificationValues.id });
      classificationIds.set(`${group.slug}:${slug}`, savedValue.id);
    }
  }

  return { productTypeIds, definitionIds, classificationIds };
}

function graduationTone(tone: string): ProductTone[] {
  if (tone === "blue") return ["blue"];
  if (tone === "pink") return ["pink"];
  if (tone === "white") return ["cream"];
  if (tone === "purple") return ["lavender"];
  if (tone === "mixed") return ["pink", "lavender", "cream"];
  return ["neutral"];
}

try {
  const catalogConfig = await seedCatalogConfiguration();

  for (const [index, category] of Object.values(productCategoryMeta).entries()) {
    await db
      .insert(categories)
      .values({
        slug: category.value,
        name: category.label,
        displayOrder: index,
      })
      .onConflictDoUpdate({
        target: categories.slug,
        set: { name: category.label, displayOrder: index, isActive: true, updatedAt: new Date() },
      });
  }

  for (const tone of productToneFilters) {
    await db
      .insert(tones)
      .values({ slug: tone.value, name: tone.label })
      .onConflictDoUpdate({ target: tones.slug, set: { name: tone.label } });
  }

  const seedProducts = [...localProducts, ...mapToteBagsToProducts()];
  for (const product of seedProducts) {
    const existing = (await admin.listProducts()).find((item) => item.legacyId === product.id || item.slug === product.slug);
    if (existing) await admin.updateProduct(existing.id, mapProduct(product));
    else await admin.createProduct(mapProduct(product));
  }

  const graduationProductIds: string[] = [];
  for (const hat of graduationHats) {
    const input = {
      legacyId: hat.id,
      slug: hat.slug,
      name: hat.name,
      priceAmount: null,
      category: "graduation" as const,
      productType: "non-tot-nghiep",
      shortDescription: hat.shortDescription,
      description: hat.description,
      videoUrl: hat.tiktokUrl,
      status: hat.status,
      isFeatured: hat.isFeatured,
      isCustomizable: true,
      displayOrder: hat.displayOrder,
      tags: hat.tags,
      tones: graduationTone(hat.tone),
      media: hat.gallery.map((image, index) => ({
        publicId: image.publicId,
        secureUrl: image.url,
        width: image.width,
        height: image.height,
        alt: image.alt,
        position: index,
        isCover: image.url === hat.coverImage.url,
      })),
      attributes: [{ label: "Tone màu", value: hat.tone, position: 0 }],
    };
    const existing = (await admin.listProducts()).find((item) => item.legacyId === hat.id || item.slug === hat.slug);
    const saved = existing ? await admin.updateProduct(existing.id, input) : await admin.createProduct(input);
    if (saved) graduationProductIds.push(saved.id);
  }

  const categoryRows = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  const categoryIds = new Map(categoryRows.map((item) => [item.slug, item.id]));
  const templateSeeds = [
    {
      slug: "tui-tote-handmade",
      name: "Túi tote handmade",
      description: "Khởi tạo nhanh túi tote, có sẵn bộ thông số túi và trạng thái nháp.",
      productType: "tui-handmade",
      category: "bag",
      priority: 0,
      defaults: {
        status: "draft",
        isCustomizable: true,
        shortDescription: "Túi handmade may thủ công, có thể điều chỉnh màu và chi tiết theo concept.",
        classifications: ["tone:pastel", "phong-cach:de-thuong"],
      },
    },
    {
      slug: "non-tot-nghiep-trang-tri",
      name: "Nón tốt nghiệp trang trí",
      description: "Mẫu nón có hoa, charm và nội dung cá nhân hóa.",
      productType: "non-tot-nghiep",
      category: "graduation",
      priority: 1,
      defaults: {
        status: "draft",
        isCustomizable: true,
        shortDescription: "Nón tốt nghiệp trang trí thủ công theo tone màu và nội dung riêng.",
        classifications: ["dip-su-dung:tot-nghiep", "tone:pastel"],
      },
    },
    {
      slug: "scrunchie-vai",
      name: "Scrunchie vải",
      description: "Mẫu phụ kiện tóc với thuộc tính chất liệu và đường kính.",
      productType: "scrunchie",
      category: "scrunchie",
      priority: 2,
      defaults: {
        status: "draft",
        isCustomizable: false,
        shortDescription: "Scrunchie may thủ công, mềm nhẹ và dễ phối hằng ngày.",
        classifications: ["phong-cach:de-thuong"],
      },
    },
    {
      slug: "hoa-len-qua-tang",
      name: "Hoa len quà tặng",
      description: "Preset cho hoa đơn hoặc bó hoa móc len.",
      productType: "hoa-len",
      category: "gift",
      priority: 3,
      defaults: {
        status: "draft",
        isCustomizable: true,
        shortDescription: "Hoa len móc thủ công, phù hợp làm quà tặng và có thể phối màu riêng.",
        classifications: ["dip-su-dung:qua-tang-hang-ngay", "phong-cach:de-thuong"],
      },
    },
    {
      slug: "moc-khoa-ca-nhan-hoa",
      name: "Móc khóa cá nhân hóa",
      description: "Preset cho móc khóa có tên, chữ hoặc màu riêng.",
      productType: "moc-khoa",
      category: "gift",
      priority: 4,
      defaults: {
        status: "draft",
        isCustomizable: true,
        shortDescription: "Móc khóa handmade nhỏ gọn, có thể cá nhân hóa theo tên hoặc concept.",
        classifications: ["dip-su-dung:qua-tang-hang-ngay"],
      },
    },
    {
      slug: "set-qua-tang",
      name: "Set quà tặng",
      description: "Preset cho một nhóm sản phẩm được trình bày chung.",
      productType: "set-qua-tang",
      category: "gift",
      priority: 5,
      defaults: {
        status: "draft",
        isCustomizable: true,
        shortDescription: "Set quà handmade phối theo tone và dịp tặng.",
        classifications: ["dip-su-dung:sinh-nhat"],
      },
    },
  ] as const;

  for (const template of templateSeeds) {
    const classificationIds = template.defaults.classifications.flatMap((key) => {
      const value = catalogConfig.classificationIds.get(key);
      return value ? [value] : [];
    });
    await db
      .insert(productTemplates)
      .values({
        slug: template.slug,
        name: template.name,
        description: template.description,
        productTypeId: catalogConfig.productTypeIds.get(template.productType) ?? null,
        categoryId: categoryIds.get(template.category) ?? null,
        priority: template.priority,
        isActive: true,
        defaults: { ...template.defaults, classifications: classificationIds },
      })
      .onConflictDoUpdate({
        target: productTemplates.slug,
        set: {
          name: template.name,
          description: template.description,
          productTypeId: catalogConfig.productTypeIds.get(template.productType) ?? null,
          categoryId: categoryIds.get(template.category) ?? null,
          priority: template.priority,
          isActive: true,
          defaults: { ...template.defaults, classifications: classificationIds },
          updatedAt: new Date(),
        },
      });
  }

  const [collection] = await db
    .insert(collections)
    .values({
      slug: "graduation-hats",
      name: "Nón tốt nghiệp handmade",
      description: "Bộ sưu tập nón tốt nghiệp trang trí thủ công.",
      status: "published",
      displayOrder: 1,
    })
    .onConflictDoUpdate({
      target: collections.slug,
      set: { status: "published", updatedAt: new Date() },
    })
    .returning({ id: collections.id });

  await db.delete(collectionProducts).where(eq(collectionProducts.collectionId, collection.id));
  if (graduationProductIds.length > 0) {
    await db.insert(collectionProducts).values(
      graduationProductIds.map((productId, position) => ({
        collectionId: collection.id,
        productId,
        position,
      })),
    );
  }

  console.log(`Seeded ${seedProducts.length + graduationProductIds.length} products.`);
} finally {
  await closeDatabase();
}
