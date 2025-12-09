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

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "Fecha inválida";

    return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
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
