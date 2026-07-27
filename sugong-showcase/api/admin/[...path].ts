import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ZodError } from "zod";

function json(res: VercelResponse, status: number, body: unknown) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  return res.status(status).json(body);
}

function getPath(req: VercelRequest) {
  const path = req.query.path;
  const querySegments = (Array.isArray(path) ? path : path ? [path] : [])
    .flatMap((segment) => segment.split("/"))
    .filter(Boolean);
  if (querySegments.length > 0) return querySegments;

  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  const adminPrefix = "/api/admin/";
  if (!pathname.startsWith(adminPrefix)) return [];
  return pathname
    .slice(adminPrefix.length)
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));
}

function bodyAsObject(req: VercelRequest) {
  if (typeof req.body === "string") return JSON.parse(req.body);
  return req.body ?? {};
}

async function rebuild(reason: string) {
  try {
    const { triggerFrontendRebuild } = await import("../../src/server/integrations/github.js");
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
      const { isAllowedAdminOrigin, loginAdmin } = await import("../../src/server/auth/session.js");
      if (!isAllowedAdminOrigin(req)) return json(res, 403, { message: "Origin is not allowed." });
      const body = bodyAsObject(req) as { token?: string };
      if (!body.token || body.token.length > 512) return json(res, 400, { message: "Token không hợp lệ." });
      const result = await loginAdmin(req, res, body.token);
      return json(res, result.ok ? 200 : result.status, result);
    }

    if (resource === "logout" && req.method === "POST") {
      const { logoutAdmin, requireAdmin } = await import("../../src/server/auth/session.js");
      const auth = await requireAdmin(req, { mutation: true });
      if (!auth.ok) return json(res, auth.status, { message: auth.message });
      await logoutAdmin(req, res);
      return json(res, 200, { ok: true });
    }

    if (resource === "session" && req.method === "GET") {
      const { requireAdmin } = await import("../../src/server/auth/session.js");
      const auth = await requireAdmin(req);
      if (!auth.ok) return json(res, auth.status, { authenticated: false, message: auth.message });
      return json(res, 200, { authenticated: true, csrfToken: auth.session.csrfToken });
    }

    const { requireAdmin, writeAuditLog } = await import("../../src/server/auth/session.js");
    const auth = await requireAdmin(req, { mutation: req.method !== "GET" });
    if (!auth.ok) return json(res, auth.status, { message: auth.message });

    if (resource === "products" && req.method === "GET") {
      const { AdminCatalogService } = await import("../../src/server/catalog/admin-catalog.service.js");
      const admin = new AdminCatalogService();
      if (id) {
        const item = await admin.getProduct(id);
        return item
          ? json(res, 200, { item })
          : json(res, 404, { message: "Không tìm thấy sản phẩm." });
      }
      return json(res, 200, { items: await admin.listProducts() });
    }

    if (resource === "catalog-config" && req.method === "GET") {
      const { CatalogConfigService } = await import("../../src/server/catalog/catalog-config.service.js");
      return json(res, 200, await new CatalogConfigService().list());
    }

    const catalogResources = new Set([
      "categories",
      "product-types",
      "classification-groups",
      "classification-values",
      "attribute-definitions",
      "product-templates",
      "collections",
    ]);
    if (catalogResources.has(resource) && ["POST", "PUT", "DELETE"].includes(req.method ?? "")) {
      const { CatalogConfigService } = await import("../../src/server/catalog/catalog-config.service.js");
      const service = new CatalogConfigService();
      if (req.method === "POST" && !id) {
        const item = await service.save(resource as Parameters<typeof service.save>[0], undefined, bodyAsObject(req));
        await writeAuditLog(req, auth.session.id, "create", resource, (item as { id?: string })?.id);
        return json(res, 201, { item });
      }
      if (req.method === "PUT" && id) {
        const item = await service.save(resource as Parameters<typeof service.save>[0], id, bodyAsObject(req));
        if (!item) return json(res, 404, { message: "Không tìm thấy dữ liệu cấu hình." });
        await writeAuditLog(req, auth.session.id, "update", resource, id);
        return json(res, 200, { item });
      }
      if (req.method === "DELETE" && id) {
        const item = await service.archive(resource as Parameters<typeof service.archive>[0], id);
        if (!item) return json(res, 404, { message: "Không tìm thấy dữ liệu cấu hình." });
        await writeAuditLog(req, auth.session.id, "archive", resource, id);
        return json(res, 200, { item });
      }
    }

    if (resource === "products" && !id && req.method === "POST") {
      const { AdminCatalogService } = await import("../../src/server/catalog/admin-catalog.service.js");
      const admin = new AdminCatalogService();
      const product = await admin.createProduct(bodyAsObject(req));
      await writeAuditLog(req, auth.session.id, "create", "product", product?.id, { slug: product?.slug });
      return json(res, 201, {
        item: product,
        rebuild: product?.status === "published"
          ? await rebuild(`Created product ${product.slug}`)
          : { triggered: false, reason: "Draft changes do not rebuild the public site." },
      });
    }

    if (resource === "products" && id && req.method === "PUT") {
      const { AdminCatalogService } = await import("../../src/server/catalog/admin-catalog.service.js");
      const { deleteCloudinaryAssets } = await import("../../src/server/integrations/cloudinary.js");
      const admin = new AdminCatalogService();
      const existing = await admin.getProduct(id);
      const product = await admin.updateProduct(id, bodyAsObject(req));
      if (!product) return json(res, 404, { message: "Không tìm thấy sản phẩm." });
      const retainedPublicIds = new Set(product.media.flatMap((item) => (item.publicId ? [item.publicId] : [])));
      const removedPublicIds = existing?.media.flatMap((item) =>
        item.publicId && !retainedPublicIds.has(item.publicId) ? [item.publicId] : [],
      ) ?? [];
      const cleanupErrors = await deleteCloudinaryAssets(removedPublicIds);
      await writeAuditLog(req, auth.session.id, "update", "product", id, { slug: product.slug, cleanupErrors });
      const affectsPublicSite = existing?.status === "published" || product.status === "published";
      return json(res, 200, {
        item: product,
        cleanupErrors,
        rebuild: affectsPublicSite
          ? await rebuild(`Updated product ${product.slug}`)
          : { triggered: false, reason: "Draft changes do not rebuild the public site." },
      });
    }

    if (resource === "products" && id && req.method === "DELETE") {
      const { AdminCatalogService } = await import("../../src/server/catalog/admin-catalog.service.js");
      const { deleteCloudinaryAssets } = await import("../../src/server/integrations/cloudinary.js");
      const admin = new AdminCatalogService();
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
        rebuild: deleted.product.status === "published"
          ? await rebuild(`Deleted product ${deleted.product.slug}`)
          : { triggered: false, reason: "Deleting a draft does not rebuild the public site." },
      });
    }

    if (resource === "cloudinary-signature" && req.method === "POST") {
      const { createSignedUpload } = await import("../../src/server/integrations/cloudinary.js");
      const body = bodyAsObject(req) as { productId?: string };
      const signature = createSignedUpload(body.productId);
      await writeAuditLog(req, auth.session.id, "sign_upload", "cloudinary", body.productId);
      return json(res, 200, signature);
    }

    if (resource === "import-preview" && req.method === "POST") {
      const { parseProductImport } = await import("../../src/server/imports/product-import.js");
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
      const { commitProductImport } = await import("../../src/server/imports/product-import.js");
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
