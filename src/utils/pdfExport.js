// src/utils/pdfExport.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ importar función

export function exportTablePdf({
  title = "Reporte",
  subtitle = "",
  columns = [],
  rows = [],
  filename = "reporte.pdf",
  orientation = "portrait",
}) {
  const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });
  const now = new Date().toLocaleString();

  // Encabezado
  doc.setFontSize(16);
  doc.text(title, 40, 40);
  doc.setFontSize(10);
  if (subtitle) doc.text(subtitle, 40, 58);
  doc.text(`Generado: ${now}`, 40, subtitle ? 72 : 58);

  // Tabla
  autoTable(doc, {                     // ✅ usar autoTable(doc, options)
    startY: subtitle ? 90 : 75,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => String(r[c.dataKey] ?? ""))),
    styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
    headStyles: { fillColor: [33, 150, 243] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 40, right: 40 },
  });

  // Pie
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setFontSize(9);
    doc.text(`Página ${i} de ${pages}`, w - 40, h - 20, { align: "right" });
  }

  doc.save(filename);
}

export function exportKpiAndRankingPdf({ kpi = {}, ranking = [] }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const now = new Date().toLocaleString();

  doc.setFontSize(16);
  doc.text("Reporte: Usuarios (Resumen + Ranking)", 40, 40);
  doc.setFontSize(10);
  doc.text(`Generado: ${now}`, 40, 58);

  // KPIs
  const kpiRows = [
    ["Usuarios Totales", String(kpi.total_usuarios ?? 0)],
    ["Activos", String(kpi.activos ?? 0)],
    ["Inactivos", String(kpi.inactivos ?? 0)],
    ["Con Roles", String(kpi.usuarios_con_roles ?? 0)],
    ["Sin Roles", String(kpi.usuarios_sin_roles ?? 0)],
    ["Roles Distintos", String(kpi.roles_distintos ?? 0)],
  ];

  doc.setFontSize(12);
  doc.text("Resumen (KPIs)", 40, 84);
  autoTable(doc, {                    // ✅
    startY: 95,
    head: [["Métrica", "Valor"]],
    body: kpiRows,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [33, 150, 243] },
    margin: { left: 40, right: 40 },
  });

  // Ranking
  doc.setFontSize(12);
  doc.text("Usuarios por rol (ranking)", 40, doc.lastAutoTable.finalY + 24);
  autoTable(doc, {                    // ✅
    startY: doc.lastAutoTable.finalY + 34,
    head: [["Rol", "# Usuarios"]],
    body: (ranking || []).map((r) => [r.rol_nombre, String(r.total_usuarios)]),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [33, 150, 243] },
    margin: { left: 40, right: 40 },
  });

  // Pie
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setFontSize(9);
    doc.text(`Página ${i} de ${pages}`, w - 40, h - 20, { align: "right" });
  }

  doc.save("reporte_usuarios_resumen.pdf");
}
