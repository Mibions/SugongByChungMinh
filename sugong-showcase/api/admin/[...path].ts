import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ZodError } from "zod";
import { AdminCatalogService } from "../../src/server/catalog/admin-catalog.service";
import { createSignedUpload, deleteCloudinaryAssets } from "../../src/server/integrations/cloudinary";
import { triggerFrontendRebuild } from "../../src/server/integrations/github";
import { commitProductImport, parseProductImport } from "../../src/server/imports/product-import";
import { isAllowedAdminOrigin, loginAdmin, logoutAdmin, requireAdmin, writeAuditLog } from "../../src/server/auth/session";

function json(res: VercelResponse, status: number, body: unknown) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  return res.status(status).json(body);
}

function getPath(req: VercelRequest) {
  const path = req.query.path;
  return (Array.isArray(path) ? path : path ? [path] : []).filter(Boolean);
}

function bodyAsObject(req: VercelRequest) {
  if (typeof req.body === "string") return JSON.parse(req.body);
  return req.body ?? {};
}

async function rebuild(reason: string) {
  try {
    return await triggerFrontendRebuild(reason);
  } catch (error) {
    return { triggered: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const [resource, id] = getPath(req);

  try {
    if (resource === "health" && req.method === "GET") {
      return json(res, 200, { ok: true });
    }

    if (resource === "login" && req.method === "POST") {
      if (!isAllowedAdminOrigin(req)) return json(res, 403, { message: "Origin is not allowed." });
      const body = bodyAsObject(req) as { token?: string };
      if (!body.token || body.token.length > 512) return json(res, 400, { message: "Token không hợp lệ." });
      const result = await loginAdmin(req, res, body.token);
      return json(res, result.ok ? 200 : result.status, result);
    }

    if (resource === "logout" && req.method === "POST") {
      const auth = await requireAdmin(req, { mutation: true });
      if (!auth.ok) return json(res, auth.status, { message: auth.message });
      await logoutAdmin(req, res);
      return json(res, 200, { ok: true });
    }

    if (resource === "session" && req.method === "GET") {
      const auth = await requireAdmin(req);
      if (!auth.ok) return json(res, auth.status, { authenticated: false, message: auth.message });
      return json(res, 200, { authenticated: true, csrfToken: auth.session.csrfToken });
    }

    const auth = await requireAdmin(req, { mutation: req.method !== "GET" });
    if (!auth.ok) return json(res, auth.status, { message: auth.message });
    const admin = new AdminCatalogService();

    if (resource === "products" && req.method === "GET") {
      return json(res, 200, { items: await admin.listProducts() });
    }

    if (resource === "products" && !id && req.method === "POST") {
      const product = await admin.createProduct(bodyAsObject(req));
      await writeAuditLog(req, auth.session.id, "create", "product", product?.id, { slug: product?.slug });
      return json(res, 201, { item: product, rebuild: await rebuild(`Created product ${product?.slug}`) });
    }

    if (resource === "products" && id && req.method === "PUT") {
      const existing = await admin.getProduct(id);
      const product = await admin.updateProduct(id, bodyAsObject(req));
      if (!product) return json(res, 404, { message: "Không tìm thấy sản phẩm." });
      const retainedPublicIds = new Set(product.media.flatMap((item) => (item.publicId ? [item.publicId] : [])));
      const removedPublicIds = existing?.media.flatMap((item) =>
        item.publicId && !retainedPublicIds.has(item.publicId) ? [item.publicId] : [],
      ) ?? [];
      const cleanupErrors = await deleteCloudinaryAssets(removedPublicIds);
      await writeAuditLog(req, auth.session.id, "update", "product", id, { slug: product.slug, cleanupErrors });
      return json(res, 200, {
        item: product,
        cleanupErrors,
        rebuild: await rebuild(`Updated product ${product.slug}`),
      });
    }

    if (resource === "products" && id && req.method === "DELETE") {
      const deleted = await admin.deleteProduct(id);
      if (!deleted) return json(res, 404, { message: "Không tìm thấy sản phẩm." });
      const cleanupErrors = await deleteCloudinaryAssets(deleted.cloudinaryPublicIds);
      await writeAuditLog(req, auth.session.id, "delete", "product", id, {
        slug: deleted.product.slug,
        cleanupErrors,
      });
      return json(res, 200, {
        deleted: true,
        cleanupErrors,
        rebuild: await rebuild(`Deleted product ${deleted.product.slug}`),
      });
    }

    if (resource === "cloudinary-signature" && req.method === "POST") {
      const body = bodyAsObject(req) as { productId?: string };
      const signature = createSignedUpload(body.productId);
      await writeAuditLog(req, auth.session.id, "sign_upload", "cloudinary", body.productId);
      return json(res, 200, signature);
    }

    if (resource === "import-preview" && req.method === "POST") {
      const body = bodyAsObject(req) as { fileName?: string; contentBase64?: string };
      if (!body.fileName || !body.contentBase64) return json(res, 400, { message: "Thiếu file import." });
      const preview = await parseProductImport(body.fileName, body.contentBase64);
      await writeAuditLog(req, auth.session.id, "preview", "product_import", undefined, {
        fileName: body.fileName,
        totalRows: preview.totalRows,
        errorRows: preview.errors.length,
      });
      return json(res, 200, preview);
    }

    if (resource === "import-commit" && req.method === "POST") {
      const body = bodyAsObject(req) as {
        fileName?: string;
        rows?: unknown[];
        mode?: "create" | "upsert";
        triggerRebuild?: boolean;
      };
      if (!body.fileName || !Array.isArray(body.rows)) return json(res, 400, { message: "Dữ liệu import không hợp lệ." });
      const result = await commitProductImport(
        auth.session.id,
        body.fileName,
        body.rows,
        body.mode === "create" ? "create" : "upsert",
      );
      await writeAuditLog(req, auth.session.id, "commit", "product_import", result.jobId, result);
      return json(res, 200, {
        ...result,
        rebuild: body.triggerRebuild ? await rebuild(`Imported catalogue products`) : { triggered: false },
      });
    }

    if (resource === "rebuild" && req.method === "POST") {
      const result = await rebuild("Manual rebuild requested from admin");
      await writeAuditLog(req, auth.session.id, "rebuild", "github_workflow", undefined, result);
      return json(res, result.triggered ? 202 : 503, result);
    }

    res.setHeader("Allow", "GET, POST, PUT, DELETE");
    return json(res, 404, { message: "Admin endpoint không tồn tại." });
  } catch (error) {
    if (error instanceof ZodError) {
      return json(res, 400, {
        message: "Dữ liệu không hợp lệ.",
        issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    const isConflict = /unique|duplicate/i.test(message);
    console.error("[admin-api]", error);
    return json(res, isConflict ? 409 : 500, {
      message: isConflict ? "Slug hoặc mã sản phẩm đã tồn tại." : "Server không thể xử lý yêu cầu.",
    });
  }
}
