import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { AdminCatalogService } from "../catalog/admin-catalog.service";
import { getDatabase } from "../db/client";
import { importJobs } from "../db/schema";
import { deleteCloudinaryAssets, uploadRemoteImage } from "../integrations/cloudinary";

const maxImportBytes = 3 * 1024 * 1024;
const maxImportRows = 100;

const importRowSchema = z.object({
  slug: z.string().trim().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2),
  priceAmount: z.number().int().nonnegative().nullable(),
  category: z.enum(["bag", "scrunchie", "gift", "custom", "graduation"]),
  shortDescription: z.string().trim().min(2),
  description: z.string().trim().optional(),
  detailNote: z.string().trim().optional(),
  videoUrl: z.string().trim().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published", "hidden"]),
  isFeatured: z.boolean(),
  isCustomizable: z.boolean(),
  displayOrder: z.number().int().nonnegative(),
  tags: z.array(z.string().min(1)),
  tones: z.array(z.enum(["orange", "pink", "cream", "lavender", "blue", "green", "lilac", "neutral"])).min(1),
  imageUrls: z.array(z.string().url()).min(1).max(8),
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

function parseBoolean(value: string) {
  return ["true", "1", "yes", "có", "co"].includes(value.trim().toLocaleLowerCase("vi"));
}

function parseNullablePrice(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
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

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("File không có worksheet");
  const headers = (worksheet.getRow(1).values as ExcelJS.CellValue[]).map((value) => cellText(value).trim());
  const rows: ParsedImportRow[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  for (let rowNumber = 2; rowNumber <= Math.min(worksheet.rowCount, maxImportRows + 1); rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    if (!row.hasValues) continue;
    const record = Object.fromEntries(
      headers.flatMap((header, index) => (header ? [[header, cellText(row.getCell(index).value).trim()]] : [])),
    );

    const parsed = importRowSchema.safeParse({
      slug: record.slug,
      name: record.name,
      priceAmount: parseNullablePrice(record.priceAmount ?? record.price ?? ""),
      category: record.category,
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
      imageUrls: splitList(record.imageUrls ?? record.images ?? ""),
    });

    if (parsed.success) rows.push(parsed.data);
    else errors.push({ row: rowNumber, message: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ") });
  }

  if (worksheet.rowCount - 1 > maxImportRows) {
    errors.push({ row: maxImportRows + 2, message: `Mỗi lần chỉ được import tối đa ${maxImportRows} sản phẩm` });
  }

  return { rows, errors, totalRows: rows.length + errors.length };
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
      const existing = (await admin.listProducts()).find((product) => product.slug === row.slug);
      if (existing && mode === "create") throw new Error(`Slug "${row.slug}" đã tồn tại`);

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
        media: uploadedMedia,
        attributes: [],
      };
      if (existing) {
        await admin.updateProduct(existing.id, input);
        await deleteCloudinaryAssets(existing.media.flatMap((item) => (item.publicId ? [item.publicId] : [])));
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
