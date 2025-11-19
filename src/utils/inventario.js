export const TIPO_MOV_OPTIONS = [
  { value: "IN",  label: "Entrada" },
  { value: "OUT", label: "Salida" },
];

export function tipoMovToLabel(v) {
  if (v === "IN") return "Entrada";
  if (v === "OUT") return "Salida";
  return v ?? "";
}
