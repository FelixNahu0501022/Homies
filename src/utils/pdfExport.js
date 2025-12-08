// src/utils/pdfExport.js - VERSIÓN PREMIUM PROFESIONAL (CORREGIDA)
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import escudoImg from "../assets/img/EscudoSantaBarbara.jpg";

const CONFIG = {
  colors: {
    primary: [13, 71, 161],
    primaryLight: [84, 114, 211],
    secondary: [211, 47, 47],
    accent: [25, 118, 210],
    darkGray: [26, 32, 39],
    mediumGray: [94, 108, 132],
    lightGray: [244, 246, 248],
    borderGray: [224, 224, 224],
    white: [255, 255, 255],
  },

  system: {
    name: "Sistema de Gestión Bomberil",
    department: "Departamento de Bomberos Santa Bárbara",
    shortName: "SGBomberil",
    location: "Bolivia",
    version: "v1.0",
  },

  fonts: {
    titleMain: 20,
    titleSub: 15,
    heading1: 13,
    heading2: 11,
    heading3: 10,
    body: 9,
    bodySmall: 8,
    caption: 7,
    micro: 6,
  },

  spacing: {
    sectionGap: 18,
    elementGap: 10,
  },

  margins: {
    top: 110,
    bottom: 65,
    left: 45,
    right: 45,
  },
};

function getUserInfo() {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.nombre || user.apellido) {
        return {
          nombre: user.nombre || '',
          apellido: user.apellido || '',
          rol: user.rol_nombre || user.rol || '',
        };
      }
    }

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return {
          nombre: decoded.nombre || decoded.name || '',
          apellido: decoded.apellido || decoded.lastname || '',
          rol: decoded.rol_nombre || decoded.rol || decoded.role || '',
        };
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Error decodificando token:', e);
      }
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Error obteniendo usuario:', e);
  }

  return { nombre: '', apellido: '', rol: '' };
}

function drawPremiumHeader(doc, title, subtitle, userInfo) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...CONFIG.colors.primary);
  doc.rect(0, 0, pageWidth, 75, 'F');

  doc.setFillColor(...CONFIG.colors.primaryLight);
  doc.rect(0, 0, pageWidth, 2, 'F');

  try {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(16, 10, 54, 54, 3, 3, 'F');
    doc.addImage(escudoImg, 'JPEG', 18, 12, 50, 50);
  } catch (e) {
    if (import.meta.env.DEV) console.warn("Error logo:", e);
  }

  doc.setTextColor(...CONFIG.colors.white);
  doc.setFontSize(CONFIG.fonts.titleSub);
  doc.setFont("helvetica", "bold");
  doc.text(CONFIG.system.name, 82, 24);

  doc.setFontSize(CONFIG.fonts.bodySmall);
  doc.setFont("helvetica", "normal");
  doc.text(CONFIG.system.department, 82, 37);

  const now = new Date();
  const dateStr = now.toLocaleDateString("es-ES", {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' });

  doc.setFontSize(CONFIG.fonts.caption);
  doc.text(dateStr, 82, 48);
  doc.text(`Hora: ${timeStr}`, 82, 58);

  doc.setFontSize(CONFIG.fonts.caption);
  doc.setFont("helvetica", "italic");
  doc.text(CONFIG.system.version, pageWidth - CONFIG.margins.right, 16, { align: "right" });

  if (userInfo.nombre || userInfo.apellido) {
    doc.setFontSize(CONFIG.fonts.bodySmall);
    doc.setFont("helvetica", "normal");
    const nombreCompleto = `${userInfo.nombre} ${userInfo.apellido}`.trim();
    doc.text(`Por: ${nombreCompleto}`, pageWidth - CONFIG.margins.right, 28, { align: "right" });

    if (userInfo.rol) {
      doc.setFontSize(CONFIG.fonts.caption);
      doc.text(`Rol: ${userInfo.rol}`, pageWidth - CONFIG.margins.right, 38, { align: "right" });
    }
  }

  doc.setDrawColor(...CONFIG.colors.secondary);
  doc.setLineWidth(2.5);
  doc.line(CONFIG.margins.left, 79, pageWidth - CONFIG.margins.right, 79);

  doc.setDrawColor(...CONFIG.colors.accent);
  doc.setLineWidth(0.5);
  doc.line(CONFIG.margins.left, 82, pageWidth - CONFIG.margins.right, 82);

  doc.setTextColor(...CONFIG.colors.darkGray);
  doc.setFontSize(CONFIG.fonts.titleMain);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, 97, { align: "center" });

  if (subtitle) {
    doc.setFontSize(CONFIG.fonts.heading2);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...CONFIG.colors.mediumGray);
    doc.text(subtitle, pageWidth / 2, 110, { align: "center" });
  }
}

function drawWatermark(doc) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  try {
    const size = 260;
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.03 }));
    doc.addImage(escudoImg, 'JPEG', (pageWidth - size) / 2, (pageHeight - size) / 2 + 15, size, size);
    doc.restoreGraphicsState();
  } catch (e) {
    if (import.meta.env.DEV) console.warn("Error marca agua:", e);
  }
}

function drawFooter(doc, pageNum, totalPages, userInfo) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 55;

  doc.setDrawColor(...CONFIG.colors.borderGray);
  doc.setLineWidth(0.5);
  doc.line(CONFIG.margins.left, footerY, pageWidth - CONFIG.margins.right, footerY);

  doc.setDrawColor(...CONFIG.colors.secondary);
  doc.setLineWidth(1.5);
  doc.line(CONFIG.margins.left, footerY + 2, pageWidth - CONFIG.margins.right, footerY + 2);

  doc.setTextColor(...CONFIG.colors.darkGray);
  doc.setFontSize(CONFIG.fonts.bodySmall);
  doc.setFont("helvetica", "bold");
  doc.text(CONFIG.system.shortName, CONFIG.margins.left, footerY + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(CONFIG.fonts.caption);
  doc.setTextColor(...CONFIG.colors.mediumGray);
  doc.text(CONFIG.system.department, CONFIG.margins.left, footerY + 24);

  if (userInfo.nombre || userInfo.apellido) {
    const nombreCompleto = `${userInfo.nombre} ${userInfo.apellido}`.trim();
    const rolTexto = userInfo.rol ? ` (${userInfo.rol})` : '';
    doc.text(`Usuario: ${nombreCompleto}${rolTexto}`, CONFIG.margins.left, footerY + 34);
  }

  doc.setFontSize(CONFIG.fonts.heading2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...CONFIG.colors.primary);
  doc.text(`${pageNum}`, pageWidth / 2 - 8, footerY + 20, { align: "center" });

  doc.setFontSize(CONFIG.fonts.caption);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...CONFIG.colors.mediumGray);
  doc.text("de", pageWidth / 2, footerY + 20, { align: "center" });

  doc.setFontSize(CONFIG.fonts.heading2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...CONFIG.colors.primary);
  doc.text(`${totalPages}`, pageWidth / 2 + 8, footerY + 20, { align: "center" });

  doc.setFontSize(CONFIG.fonts.caption);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...CONFIG.colors.mediumGray);
  doc.text(CONFIG.system.location, pageWidth - CONFIG.margins.right, footerY + 16, { align: "right" });
  doc.setFontSize(CONFIG.fonts.micro);
  doc.text("Documento generado automáticamente", pageWidth - CONFIG.margins.right, footerY + 32, { align: "right" });
}

function drawBadge(doc, x, y, label, value, color) {
  const badgeWidth = 75;
  const badgeHeight = 19;

  doc.setFillColor(...color);
  doc.roundedRect(x, y, badgeWidth, badgeHeight, 2, 2, 'F');

  doc.setTextColor(...CONFIG.colors.white);
  doc.setFontSize(CONFIG.fonts.micro);
  doc.setFont("helvetica", "bold");
  doc.text(label, x + 3, y + 7);

  doc.setFontSize(CONFIG.fonts.heading3);
  doc.text(value, x + 3, y + 15);
}

export function exportTablePdf({
  title = "Reporte",
  subtitle = "",
  columns = [],
  rows = [],
  filename = "reporte.pdf",
  orientation = "portrait",
  summary = null,
  showStats = true,
}) {
  const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const userInfo = getUserInfo();

  doc.setProperties({
    title: `${CONFIG.system.shortName} - ${title}`,
    subject: subtitle || title,
    author: userInfo.nombre && userInfo.apellido ? `${userInfo.nombre} ${userInfo.apellido}` : CONFIG.system.shortName,
    keywords: "reporte, bomberos, gestión",
    creator: CONFIG.system.name,
  });

  drawWatermark(doc);
  drawPremiumHeader(doc, title, subtitle, userInfo);

  let currentY = subtitle ? CONFIG.margins.top + 18 : CONFIG.margins.top + 5;

  if (showStats && rows.length > 0) {
    drawBadge(doc, CONFIG.margins.left, currentY, "REGISTROS", String(rows.length), CONFIG.colors.primary);
    drawBadge(doc, CONFIG.margins.left + 83, currentY, "COLUMNAS", String(columns.length), CONFIG.colors.accent);
    const dayOfWeek = new Date().toLocaleDateString("es-ES", { weekday: 'short' }).toUpperCase();
    drawBadge(doc, CONFIG.margins.left + 166, currentY, "DÍA", dayOfWeek, CONFIG.colors.secondary);
    currentY += 28;
  }

  if (summary) {
    currentY += CONFIG.spacing.sectionGap;
    doc.setFontSize(CONFIG.fonts.heading1);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...CONFIG.colors.primary);
    doc.text("Resumen Ejecutivo", CONFIG.margins.left, currentY);

    doc.setDrawColor(...CONFIG.colors.primaryLight);
    doc.setLineWidth(1.5);
    doc.line(CONFIG.margins.left, currentY + 3, CONFIG.margins.left + 120, currentY + 3);

    currentY += CONFIG.spacing.elementGap;

    autoTable(doc, {
      startY: currentY,
      head: [["Métrica", "Valor"]],
      body: Object.entries(summary).map(([k, v]) => [k, String(v)]),
      theme: "grid",
      styles: { fontSize: CONFIG.fonts.body, cellPadding: 7, lineColor: CONFIG.colors.borderGray },
      headStyles: { fillColor: CONFIG.colors.primary, textColor: CONFIG.colors.white, fontStyle: "bold", halign: "center" },
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "center", fontStyle: "bold", fontSize: CONFIG.fonts.heading2, textColor: CONFIG.colors.secondary },
      },
      alternateRowStyles: { fillColor: CONFIG.colors.lightGray },
      margin: { left: CONFIG.margins.left, right: CONFIG.margins.right },
    });

    currentY = doc.lastAutoTable.finalY + CONFIG.spacing.sectionGap;
  }

  doc.setFontSize(CONFIG.fonts.heading1);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...CONFIG.colors.primary);
  doc.text("Datos Detallados", CONFIG.margins.left, currentY);

  doc.setFontSize(CONFIG.fonts.bodySmall);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...CONFIG.colors.mediumGray);
  doc.text(`${rows.length} registro${rows.length !== 1 ? 's' : ''}`,
    pageWidth - CONFIG.margins.right, currentY, { align: "right" });

  doc.setDrawColor(...CONFIG.colors.secondary);
  doc.setLineWidth(1.5);
  doc.line(CONFIG.margins.left, currentY + 3, CONFIG.margins.left + 110, currentY + 3);

  currentY += CONFIG.spacing.elementGap;

  autoTable(doc, {
    startY: currentY,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => {
      const v = r[c.dataKey];
      return v !== null && v !== undefined ? String(v) : "—";
    })),
    theme: "striped",
    styles: {
      fontSize: CONFIG.fonts.body,
      cellPadding: 6,
      textColor: CONFIG.colors.darkGray,
      lineColor: CONFIG.colors.borderGray,
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: CONFIG.colors.secondary,
      textColor: CONFIG.colors.white,
      fontSize: CONFIG.fonts.heading3,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 8,
    },
    alternateRowStyles: { fillColor: CONFIG.colors.lightGray },
    margin: { left: CONFIG.margins.left, right: CONFIG.margins.right, bottom: CONFIG.margins.bottom },
    didDrawPage: function () {
      drawWatermark(doc);
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      const totalPages = doc.internal.getNumberOfPages();
      drawFooter(doc, currentPage, totalPages, userInfo);
    },
  });

  doc.save(filename.replace(/[^a-z0-9_\-\.]/gi, "_"));
}

export function exportKpiAndRankingPdf({ kpi = {}, ranking = [], title = "Reporte de Usuarios" }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const userInfo = getUserInfo();

  doc.setProperties({
    title: `${CONFIG.system.shortName} - ${title}`,
    author: userInfo.nombre && userInfo.apellido ? `${userInfo.nombre} ${userInfo.apellido}` : CONFIG.system.shortName,
    creator: CONFIG.system.name,
  });

  drawWatermark(doc);
  drawPremiumHeader(doc, title, "Resumen General y Ranking", userInfo);

  let currentY = CONFIG.margins.top + 5;

  doc.setFontSize(CONFIG.fonts.heading1);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...CONFIG.colors.primary);
  doc.text("Indicadores Clave", CONFIG.margins.left, currentY);

  doc.setDrawColor(...CONFIG.colors.primaryLight);
  doc.setLineWidth(1.5);
  doc.line(CONFIG.margins.left, currentY + 3, CONFIG.margins.left + 120, currentY + 3);

  autoTable(doc, {
    startY: currentY + 10,
    head: [["Métrica", "Valor"]],
    body: [
      ["Usuarios Totales", String(kpi.total_usuarios ?? 0)],
      ["Activos", String(kpi.activos ?? 0)],
      ["Inactivos", String(kpi.inactivos ?? 0)],
      ["Con Roles", String(kpi.usuarios_con_roles ?? 0)],
      ["Sin Roles", String(kpi.usuarios_sin_roles ?? 0)],
      ["Roles Distintos", String(kpi.roles_distintos ?? 0)],
    ],
    theme: "grid",
    styles: { fontSize: CONFIG.fonts.body, cellPadding: 7, lineColor: CONFIG.colors.borderGray },
    headStyles: { fillColor: CONFIG.colors.primary, textColor: CONFIG.colors.white, fontStyle: "bold" },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "center", fontStyle: "bold", fontSize: CONFIG.fonts.heading2, textColor: CONFIG.colors.secondary },
    },
    margin: { left: CONFIG.margins.left, right: CONFIG.margins.right },
  });

  const rankingStartY = doc.lastAutoTable.finalY + CONFIG.spacing.sectionGap;

  doc.setFontSize(CONFIG.fonts.heading1);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...CONFIG.colors.primary);
  doc.text("Ranking de Usuarios por Rol", CONFIG.margins.left, rankingStartY);

  doc.setDrawColor(...CONFIG.colors.secondary);
  doc.setLineWidth(1.5);
  doc.line(CONFIG.margins.left, rankingStartY + 3, CONFIG.margins.left + 165, rankingStartY + 3);

  autoTable(doc, {
    startY: rankingStartY + 10,
    head: [["Pos.", "Rol", "Usuarios"]],
    body: (ranking || []).map((r, idx) => [String(idx + 1), r.rol_nombre, String(r.total_usuarios)]),
    theme: "striped",
    styles: { fontSize: CONFIG.fonts.body, cellPadding: 6, lineColor: CONFIG.colors.borderGray },
    headStyles: { fillColor: CONFIG.colors.secondary, textColor: CONFIG.colors.white, fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { halign: "center", cellWidth: 45, fontStyle: "bold" },
      2: { halign: "center", fontStyle: "bold", textColor: CONFIG.colors.primary },
    },
    alternateRowStyles: { fillColor: CONFIG.colors.lightGray },
    margin: { left: CONFIG.margins.left, right: CONFIG.margins.right, bottom: CONFIG.margins.bottom },
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawWatermark(doc);
    drawFooter(doc, i, totalPages, userInfo);
  }

  doc.save("reporte_usuarios_completo.pdf");
}
