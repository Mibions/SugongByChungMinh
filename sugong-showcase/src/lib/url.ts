const baseUrl = import.meta.env.BASE_URL ?? "/";

function getBasePath() {
  const normalized = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return normalized === "/" ? "" : normalized;
}

export function withBase(path: string) {
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("mailto:") ||
    path.startsWith("tel:") ||
    path.startsWith("#") ||
    !path.startsWith("/")
  ) {
    return path;
  }

  const basePath = getBasePath();
  if (!basePath || path === basePath || path.startsWith(`${basePath}/`)) {
    return path;
  }

  return `${basePath}${path}`;
}

export function withoutBase(pathname: string) {
  const basePath = getBasePath();
  if (!basePath) return pathname;

  if (pathname === basePath) return "/";
  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length) || "/";
  }

  return pathname;
}
