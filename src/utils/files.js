// src/utils/files.js
export function resolveFileUrl(p) {
  if (!p) return "";

  // Si ya es una URL absoluta o blob, devuélvela tal cual
  if (/^(https?:|blob:)/i.test(p)) return p;

  // 1. Intentar usar una URL estática dedicada (si existe en .env)
  let base = import.meta.env.VITE_STATIC_URL;

  // 2. Si no, derivarla de la API URL (quitando "/api" al final)
  if (!base) {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    base = apiUrl.replace(/\/api\/?$/, ""); // Quita "/api" o "/api/" del final
  }

  // Asegurar que base no tenga slash final
  base = base.replace(/\/+$/, "");

  // Limpieza de la ruta del archivo (evitar dobles slashes y asegurar uploads/)
  // Si la ruta empieza con /, se lo quitamos para concatenar limpio
  let clean = p.replace(/^\/+/, "");

  // Si la ruta NO empieza con "uploads/" y tampoco es una ruta completa rara,
  // asumimos que le falta el prefijo si es lo habitual.
  // Pero tu código original forzaba "uploads/" si venía "/uploads".
  // Mantengamos la lógica simple: solo concatenar.
  // El código original hacía: .replace(/^\/?uploads\/?/, "uploads/");
  // Lo mantendremos para consistencia si tus rutas en BD a veces traen slash inicial.
  if (clean.startsWith("uploads/")) {
    // ya está bien
  } else if (p.includes("uploads")) {
    // caso donde venga "/uploads/..." -> "uploads/..."
    clean = clean.substring(clean.indexOf("uploads"));
  }

  return `${base}/${clean}`;
}
