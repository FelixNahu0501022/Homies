// src/utils/exportToExcel.js
import * as XLSX from 'xlsx';

/**
 * Exporta datos a un archivo Excel (.xlsx)
 * @param {Object} params - Parámetros de exportación
 * @param {Array} params.data - Array de objetos con los datos
 * @param {String} params.filename - Nombre del archivo (sin extensión)
 * @param {String} params.sheetName - Nombre de la hoja
 * @param {String} params.title - Título opcional para la primera fila
 */
export function exportToExcel({ data, filename = 'reporte', sheetName = 'Datos', title = null }) {
    if (!data || data.length === 0) {
        console.warn('No hay datos para exportar');
        return;
    }

    // Crear workbook
    const wb = XLSX.utils.book_new();

    // Si hay título, agregarlo como primera fila
    let ws;
    if (title) {
        const titleRow = [[title]];
        const emptyRow = [[]];
        ws = XLSX.utils.aoa_to_sheet([...titleRow, ...emptyRow]);
        XLSX.utils.sheet_add_json(ws, data, { origin: 'A3', skipHeader: false });

        // Combinar celdas del título
        const merge = { s: { r: 0, c: 0 }, e: { r: 0, c: Object.keys(data[0]).length - 1 } };
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push(merge);
    } else {
        ws = XLSX.utils.json_to_sheet(data);
    }

    // Auto-ajustar el ancho de las columnas
    const colWidths = [];
    const headers = Object.keys(data[0]);

    headers.forEach((header, i) => {
        const maxLength = Math.max(
            header.length,
            ...data.map(row => String(row[header] || '').length)
        );
        colWidths.push({ wch: Math.min(maxLength + 2, 50) }); // Max 50 caracteres
    });

    ws['!cols'] = colWidths;

    // Agregar hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Escribir archivo
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Exporta múltiples hojas de datos a un archivo Excel
 * @param {Object} params - Parámetros de exportación
 * @param {Array} params.sheets - Array de objetos { data, sheetName, title? }
 * @param {String} params.filename - Nombre del archivo
 */
export function exportMultipleSheetsToExcel({ sheets, filename = 'reporte' }) {
    if (!sheets || sheets.length === 0) {
        console.warn('No hay hojas para exportar');
        return;
    }

    const wb = XLSX.utils.book_new();

    sheets.forEach(({ data, sheetName = 'Hoja', title = null }) => {
        if (!data || data.length === 0) return;

        let ws;
        if (title) {
            const titleRow = [[title]];
            const emptyRow = [[]];
            ws = XLSX.utils.aoa_to_sheet([...titleRow, ...emptyRow]);
            XLSX.utils.sheet_add_json(ws, data, { origin: 'A3', skipHeader: false });

            const merge = { s: { r: 0, c: 0 }, e: { r: 0, c: Object.keys(data[0]).length - 1 } };
            if (!ws['!merges']) ws['!merges'] = [];
            ws['!merges'].push(merge);
        } else {
            ws = XLSX.utils.json_to_sheet(data);
        }

        // Auto-ajustar columnas
        const headers = Object.keys(data[0]);
        const colWidths = headers.map((header) => {
            const maxLength = Math.max(
                header.length,
                ...data.map(row => String(row[header] || '').length)
            );
            return { wch: Math.min(maxLength + 2, 50) };
        });
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, `${filename}.xlsx`);
}
