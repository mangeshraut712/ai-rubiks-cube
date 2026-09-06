export function getAppBasename() {
  const base = import.meta.env.BASE_URL || "/";
  if (base === "/") {
    return "/";
  }

  return base.replace(/\/+$/, "") || "/";
}
