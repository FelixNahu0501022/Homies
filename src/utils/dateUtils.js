// src/utils/dateUtils.js
// Utilidades para manejo consistente de fechas en zona horaria local

/**
 * Convierte una fecha al formato datetime-local (YYYY-MM-DDTHH:mm)
 * Ajusta a zona horaria local del navegador
 */
export function toLocalInputValue(dateInput) {
    if (!dateInput) return "";

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";

    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
}

/**
 * Retorna fecha/hora actual en zona horaria local para inputs datetime-local
 */
export function nowLocalInputValue() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localTime = new Date(now.getTime() - offset);
    return localTime.toISOString().slice(0, 16);
}

/**
 * Formatea fecha para mostrar en UI (día/mes/año hora:minuto)
 * Usa zona horaria local
 */
export function formatDateTime(dateInput) {
    if (!dateInput) return "—";

    let date;
    const str = String(dateInput);

    // Si ya es Date object válido
    if (dateInput instanceof Date) {
        date = dateInput;
    }
    // Si es ISO format (YYYY-MM-DD o con T/Z)
    else if (str.includes('T') || str.includes('Z') || str.match(/^\d{4}-\d{2}-\d{2}/)) {
        date = new Date(dateInput);
    }
    // Parsear formato DD/MM/YYYY HH:mm del backend  
    else {
        const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
        if (match) {
            const [, day, month, year, hour = 0, minute = 0] = match;
            date = new Date(
                parseInt(year),
                parseInt(month) - 1, // mes es 0-indexed
                parseInt(day),
                parseInt(hour),
                parseInt(minute)
            );
            console.log('📅 [formatDateTime] Parseado DD/MM/YYYY:', { input: dateInput, output: date.toLocaleString('es-ES') });
        } else {
            // Fallback: intentar parsear directamente (puede fallar con DD/MM/YYYY)
            date = new Date(dateInput);
        }
    }

    if (!date || isNaN(date.getTime())) return "Fecha inválida";

    // ✅ CLAVE: Agregar timeZone: 'America/La_Paz' para forzar conversión correcta desde UTC
    return new Intl.DateTimeFormat('es-BO', {
        timeZone: 'America/La_Paz', // Zona horaria de Bolivia (UTC-4)
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

/**
 * Formatea solo fecha (sin hora)
 */
export function formatDate(dateInput) {
    if (!dateInput) return "—";

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "Fecha inválida";

    return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(date);
}

/**
 * Formatea solo hora
 */
export function formatTime(dateInput) {
    if (!dateInput) return "—";

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(date);
}

/**
 * Verifica si una fecha es válida
 */
export function isValidDate(dateInput) {
    if (!dateInput) return false;
    const date = new Date(dateInput);
    return !isNaN(date.getTime());
}
