import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { AdminCatalogService } from "../catalog/admin-catalog.service.js";
import { getDatabase } from "../db/client.js";
import { importJobs } from "../db/schema.js";
import { deleteCloudinaryAssets, uploadRemoteImage } from "../integrations/cloudinary.js";

const maxImportBytes = 3 * 1024 * 1024;
const maxImportRows = 100;

const importRowSchema = z.object({
  legacyId: z.string().trim().min(1).optional(),
  catalogReview: z.boolean().default(false),
  slug: z.string().trim().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2),
  priceAmount: z.number().int().nonnegative().nullable(),
  category: z.string().trim().min(1).max(120),
  productType: z.string().trim().min(1).max(120).optional(),
  shortDescription: z.string().trim().min(2),
  description: z.string().trim().optional(),
  detailNote: z.string().trim().optional(),
  videoUrl: z.string().trim().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published", "hidden"]),
  isFeatured: z.boolean(),
  isCustomizable: z.boolean(),
  displayOrder: z.number().int().nonnegative(),
  tags: z.array(z.string().min(1)),
  tones: z.array(z.string().trim().min(1).max(120)).max(50),
  imageUrls: z.array(z.string().url().refine((value) => /^https?:\/\//.test(value), "Ảnh phải dùng HTTP hoặc HTTPS")).max(20),
}).superRefine((row, ctx) => {
  if (row.catalogReview && row.status !== "draft") ctx.addIssue({ code: "custom", path: ["status"], message: "Dữ liệu Catalog cần xác minh phải được nhập dưới dạng nháp" });
  if (row.status === "published" && (!row.tones.length || !row.imageUrls.length)) ctx.addIssue({ code: "custom", path: ["status"], message: "Xuất bản cần ảnh và màu đã xác minh" });
});

export type ParsedImportRow = z.infer<typeof importRowSchema>;

function cellText(value: ExcelJS.CellValue) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "text" in value) return String(value.text);
  if (typeof value === "object" && "result" in value) return String(value.result ?? "");
  return String(value);
}

function splitList(value: string) {
  return value
    .split(/[|,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitImageUrls(value: string) {
  // Commas and semicolons can be part of a valid URL (e.g. Cloudinary transforms).
  return value.split(/[|\r\n]+/).map((item) => item.trim()).filter(Boolean);
}

function parseBoolean(value: string) {
  return ["true", "1", "yes", "có", "co"].includes(value.trim().toLocaleLowerCase("vi"));
}

function parseNullablePrice(value: string) {
  if (!value.trim()) return null;
  // No conversion of "68k", ranges, negatives or currency prose into invented prices.
  if (!/^\d+$/.test(value.trim())) return Number.NaN;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : Number.NaN;
}

export async function parseProductImport(fileName: string, contentBase64: string) {
  const buffer = Buffer.from(contentBase64, "base64");
  if (buffer.byteLength === 0 || buffer.byteLength > maxImportBytes) {
    throw new Error("File import phải có dung lượng từ 1 byte đến 3 MB");
  }

  const workbook = new ExcelJS.Workbook();
  if (fileName.toLowerCase().endsWith(".csv")) {
    await workbook.csv.read(Readable.from(buffer));
  } else if (fileName.toLowerCase().endsWith(".xlsx")) {
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  } else {
    throw new Error("Chỉ hỗ trợ file .csv hoặc .xlsx");
  }

  const catalogSheet = workbook.getWorksheet("01_Products");
  const worksheet = catalogSheet ?? workbook.worksheets[0];
  if (!worksheet) throw new Error("File không có worksheet");
  const headers = (worksheet.getRow(1).values as ExcelJS.CellValue[]).map((value) => cellText(value).trim());
  const rows: ParsedImportRow[] = [];
  const errors: Array<{ row: number; message: string }> = [];
  const skippedRows: Array<{ row: number; message: string }> = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (let rowNumber = 2; rowNumber <= Math.min(worksheet.rowCount, maxImportRows + 1); rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    if (!row.hasValues) continue;
    const record = Object.fromEntries(
      headers.flatMap((header, index) => (header ? [[header, cellText(row.getCell(index).value).trim()]] : [])),
    );

    if (catalogSheet) {
      if (["MERGED", "SKIPPED", "ARCHIVED"].includes(record.Status?.toUpperCase())) {
        skippedRows.push({ row: rowNumber, message: `${record.Product_ID}: ${record.Status}` });
        continue;
      }
      if (!record.Product_ID?.trim()) {
        errors.push({ row: rowNumber, message: "Thiếu Product_ID ổn định" });
        continue;
      }
      const categoryMap: Record<string, string> = { BAG: "bag", MUS: "fabrics", ACC: "accessories", CLO: "clothing", BOX: "gift", KEY: "keychains", HAT: "graduation" };
      const scrunchieIds = new Set(["SGCM-ACC-002", "SGCM-ACC-003", "SGCM-ACC-004", "SGCM-ACC-007", "SGCM-ACC-009"]);
      Object.assign(record, {
        legacyId: record.Product_ID, slug: record.Slug, name: record.Name_VI,
        priceAmount: record.Current_Price_VND, category: scrunchieIds.has(record.Product_ID) ? "scrunchie" : categoryMap[record.Category_ID] ?? record.Category_ID,
        shortDescription: record.Description?.slice(0, 500), description: record.Description,
        detailNote: [`Catalog: ${record.Product_ID}`, `Nguồn Threads Post ID: ${record.Primary_Post_ID || "cần xác minh"}`, `Ảnh Drive: ${record.Drive_Folder_URL || "chưa lưu"}`, record.Notes, "Cần xác minh giá hiện tại, kích thước, chất liệu và tình trạng hàng trước khi xuất bản."].filter(Boolean).join("\n").slice(0, 2000),
        status: "draft", tones: "", imageUrls: "",
      });
    }

    const parsed = importRowSchema.safeParse({
      legacyId: record.legacyId || undefined,
      catalogReview: Boolean(catalogSheet),
      slug: record.slug,
      name: record.name,
      priceAmount: parseNullablePrice(record.priceAmount ?? record.price ?? ""),
      category: record.category,
      productType: record.productType || undefined,
      shortDescription: record.shortDescription,
      description: record.description || undefined,
      detailNote: record.detailNote || undefined,
      videoUrl: record.videoUrl || undefined,
      status: record.status || "draft",
      isFeatured: parseBoolean(record.isFeatured ?? ""),
      isCustomizable: parseBoolean(record.isCustomizable ?? ""),
      displayOrder: Number(record.displayOrder || rowNumber - 2),
      tags: splitList(record.tags ?? ""),
      tones: splitList(record.tones ?? ""),
      imageUrls: splitImageUrls(record.imageUrls ?? record.images ?? ""),
    });

    if (parsed.success) {
      if (slugs.has(parsed.data.slug) || (parsed.data.legacyId && ids.has(parsed.data.legacyId))) {
        errors.push({ row: rowNumber, message: "Trùng slug hoặc Product_ID trong file" });
      } else {
        slugs.add(parsed.data.slug);
        if (parsed.data.legacyId) ids.add(parsed.data.legacyId);
        rows.push(parsed.data);
      }
    }
    else errors.push({ row: rowNumber, message: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ") });
  }

  if (worksheet.rowCount - 1 > maxImportRows) {
    errors.push({ row: maxImportRows + 2, message: `Mỗi lần chỉ được import tối đa ${maxImportRows} sản phẩm` });
  }

  return { rows, errors, skippedRows, totalRows: rows.length + errors.length + skippedRows.length };
}

export async function commitProductImport(
  sessionId: string,
  fileName: string,
  rawRows: unknown[],
  mode: "create" | "upsert",
) {
  const rows = z.array(importRowSchema).max(maxImportRows).parse(rawRows);
  const db = getDatabase();
  const admin = new AdminCatalogService();
  const [job] = await db
    .insert(importJobs)
    .values({ sessionId, fileName, status: "processing", totalRows: rows.length })
    .returning({ id: importJobs.id });
  const errors: Array<{ row: number; message: string }> = [];
  let successRows = 0;

  for (const [index, row] of rows.entries()) {
    const uploadedPublicIds: string[] = [];
    try {
      const products = await admin.listProducts();
      const byId = row.legacyId ? products.find((product) => product.legacyId === row.legacyId) : undefined;
      const bySlug = products.find((product) => product.slug === row.slug);
      if (byId && bySlug && byId.id !== bySlug.id) throw new Error("Product_ID và slug trỏ tới hai sản phẩm khác nhau");
      if (row.catalogReview && bySlug && !byId) throw new Error("Slug đã có trên website; cần đối chiếu Product_ID trước khi gộp");
      const existing = byId ?? bySlug;
      if (existing && mode === "create") throw new Error(`Slug "${row.slug}" đã tồn tại`);
      const existingDetail = existing ? await admin.getProduct(existing.id) : null;
      if (row.catalogReview && existingDetail?.status === "published") throw new Error("Sản phẩm đã xuất bản cần được đối chiếu thủ công, không ghi đè bằng dữ liệu chưa xác minh");

      const uploadedMedia = [];
      for (const [mediaIndex, imageUrl] of row.imageUrls.entries()) {
        const uploaded = await uploadRemoteImage(imageUrl, job.id, row.slug);
        uploadedPublicIds.push(uploaded.publicId);
        uploadedMedia.push({
          ...uploaded,
          alt: row.name,
          position: mediaIndex,
          isCover: mediaIndex === 0,
        });
      }

      const input = {
        ...row,
        legacyId: row.legacyId ?? existingDetail?.legacyId,
        priceAmount: row.priceAmount ?? existingDetail?.priceAmount ?? null,
        tones: row.tones.length ? row.tones : existingDetail?.tones ?? [],
        media: uploadedMedia.length ? uploadedMedia : existingDetail?.media ?? [],
        attributes: existingDetail?.attributes ?? [],
        classifications: existingDetail?.classifications ?? [],
      };
      if (existing) {
        await admin.updateProduct(existing.id, input);
        if (uploadedMedia.length) await deleteCloudinaryAssets(
          existingDetail?.media.flatMap((item) => (item.publicId ? [item.publicId] : [])) ?? [],
        );
      } else {
        await admin.createProduct(input);
      }
      successRows += 1;
    } catch (error) {
      await deleteCloudinaryAssets(uploadedPublicIds);
      errors.push({ row: index + 2, message: error instanceof Error ? error.message : String(error) });
    }
  }

  await db
    .update(importJobs)
    .set({
      status: errors.length === rows.length ? "failed" : "completed",
      successRows,
      failedRows: errors.length,
      errors,
      completedAt: new Date(),
    })
    .where(eq(importJobs.id, job.id));

  return { jobId: job.id, successRows, failedRows: errors.length, errors };
}
