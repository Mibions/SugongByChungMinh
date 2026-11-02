import { test } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { parseProductImport } from "../src/server/imports/product-import.js";

async function catalog(rows: unknown[][]) {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet("00_Dashboard").addRow(["Kiểm kê Threads"]);
  const sheet = workbook.addWorksheet("01_Products");
  sheet.addRow(["Product_ID", "Name_VI", "Slug", "Category_ID", "Description", "Status", "Current_Price_VND", "Primary_Post_ID", "Notes"]);
  rows.forEach((row) => sheet.addRow(row));
  return Buffer.from(await workbook.xlsx.writeBuffer()).toString("base64");
}
const product = ["SGCM-BAG-001", "Túi hai mặt", "tui-hai-mat", "BAG", "Mô tả từ bài gốc", "NEEDS_REVIEW", "", "DYkHn8sgeDM", "Cần kiểm tra kích thước"];

test("Catalog selects products sheet, permits unknown fields, retains source ID and drafts", async () => {
  const result = await parseProductImport("catalog.xlsx", await catalog([product]));
  assert.deepEqual(result.errors, []);
  assert.equal(result.rows.length, 1);
  const row = result.rows[0];
  assert.equal(row.legacyId, "SGCM-BAG-001");
  assert.equal(row.priceAmount, null);
  assert.equal(row.status, "draft");
  assert.equal(row.catalogReview, true);
  assert.deepEqual(row.imageUrls, []);
  assert.deepEqual(row.tones, []);
  assert.match(row.detailNote!, /DYkHn8sgeDM/);
});

test("merged aliases are skipped, never made into another product", async () => {
  const alias = [...product]; alias[0] = "SGCM-BAG-002"; alias[5] = "MERGED";
  const result = await parseProductImport("catalog.xlsx", await catalog([product, alias]));
  assert.equal(result.rows.length, 1);
  assert.equal(result.skippedRows.length, 1);
  assert.equal(result.totalRows, 2);
});

test("duplicate IDs/slugs and missing IDs are errors", async () => {
  const missing = [...product]; missing[0] = "";
  const result = await parseProductImport("catalog.xlsx", await catalog([product, product, missing]));
  assert.equal(result.errors.length, 2);
  assert.equal(result.rows.length, 1);
});

test("prices cannot silently convert ranges, negative amounts, or shorthand", async () => {
  for (const price of ["68k", "30–40K/m", "-100", "abc", "1.5"]) {
    const row = [...product]; row[6] = price;
    assert.equal((await parseProductImport("catalog.xlsx", await catalog([row]))).errors.length, 1, price);
  }
});

test("legacy CSV still supports published rows and commas inside image URLs", async () => {
  const csv = 'slug,name,category,shortDescription,status,tones,imageUrls,priceAmount\nexample,Example,bags,Example product,published,pink,"https://res.cloudinary.com/demo/image/upload/w_200,h_300/sample.jpg",68000';
  const result = await parseProductImport("products.csv", Buffer.from(csv).toString("base64"));
  assert.deepEqual(result.errors, []);
  assert.equal(result.rows[0].imageUrls.length, 1);
  assert.equal(result.rows[0].priceAmount, 68000);
});

test("published CSV without confirmed media and tones is rejected", async () => {
  const csv = 'slug,name,category,shortDescription,status\nexample,Example,bags,Example product,published';
  const result = await parseProductImport("products.csv", Buffer.from(csv).toString("base64"));
  assert.equal(result.errors.length, 1);
});
