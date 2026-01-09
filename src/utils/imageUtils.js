// src/utils/imageUtils.js

/**
 * Construir URL completa para imágenes del backend
 * @param {string} ruta - Ruta relativa de la imagen (ej: "/uploads/perfiles/imagen.jpg")
 * @returns {string} URL completa o null si no hay ruta
 */
export const getImageUrl = (ruta) => {
    if (!ruta) return null;

    // Si la ruta ya es una URL completa
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
        // PARCHE CRÍTICO: Si la URL es HTTP y apunta a nuestro backend, forzar HTTPS
        // Esto evita bloqueo por "Mixed Content" en Android
        if (ruta.includes('api.foxtrotalfa.org') && ruta.startsWith('http://')) {
            return ruta.replace('http://', 'https://');
        }
        return ruta;
    }

    // Fallback para rutas relativas
    const productionBase = 'https://api.foxtrotalfa.org';

    // Asegurar que la ruta empiece con / si se concatena
    const cleanRuta = ruta.startsWith('/') ? ruta : `/${ruta}`;

    return `${productionBase}${cleanRuta}`;
};

export default {
    getImageUrl,
};
