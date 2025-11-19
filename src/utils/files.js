// src/utils/files.js
export function resolveFileUrl(p) {
  if (!p) return "";

  // Si ya es una URL absoluta o blob, devuélvela tal cual
  if (/^(https?:|blob:)/i.test(p)) return p;

  // Base del backend según variable de entorno
  const base =
    import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ||
    import.meta.env.VITE_BASE_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000"; // fallback local

  // Limpieza de prefijos redundantes
  const clean = p
    .replace(/^\/?api\/?/, "")
    .replace(/^\/?uploads\/?/, "uploads/");

  // Siempre apuntamos al backend, no al dominio del frontend
  return `${base}/${clean}`;
}
