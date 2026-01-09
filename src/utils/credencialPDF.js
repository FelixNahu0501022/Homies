// src/utils/credencialPDF.js - DISEÑO FINAL "A FULL" (MAXIMIZADO)
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { getImageUrl } from './imageUtils';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const generarCredencialPDF = async (miembro) => {
    try {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [54, 85.6]
        });

        const morado = [123, 41, 152];
        const amarillo = [255, 229, 0];
        const cyan = [0, 217, 217];
        const cyanOscuro = [0, 150, 150];
        const rojoOscuro = [180, 0, 0];
        const grisOscuro = [40, 40, 40];

        // ===== FONDOS =====
        pdf.setFillColor(...morado);
        pdf.rect(0, 0, 54, 85.6, 'F');

        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(2, 2, 50, 81.6, 2, 2, 'F');

        // MARCA DE AGUA (Careta) - OPACIDAD BALANCEADA
        try {
            const watermarkUrl = window.location.origin + '/mascota-homies.jpg';
            const imgWatermark = await loadImage(watermarkUrl);

            pdf.setGState(new pdf.GState({ opacity: 0.12 })); // Punto medio perfecto

            const wmW = 44;
            const wmH = 44;
            const wmX = (54 - wmW) / 2;
            const wmY = (85.6 - wmH) / 2 + 5;

            pdf.addImage(imgWatermark, 'JPEG', wmX, wmY, wmW, wmH);
            pdf.setGState(new pdf.GState({ opacity: 1 }));
        } catch (e) {
            console.warn("No se pudo cargar la marca de agua", e);
        }

        // Borde Decorativo Interior
        pdf.setDrawColor(...amarillo);
        pdf.setLineWidth(0.8);
        pdf.roundedRect(2.8, 2.8, 48.4, 80, 1.5, 1.5);

        // ===== HEADER PROFESIONAL (12mm) =====
        // Aumentamos altura para dar protagonismo al logo
        const headerStart = 2.8;
        const headerH = 12;

        pdf.setFillColor(...morado);
        pdf.rect(2.8, headerStart, 48.4, headerH, 'F');

        // Línea inferior del header (amarilla)
        pdf.setFillColor(...amarillo);
        pdf.rect(2.8, headerStart + headerH - 0.7, 48.4, 0.7, 'F');

        // LOGO HEADER (Izquierda, Grande)
        try {
            const logoUrl = window.location.origin + '/logo-homies.png';
            const imgLogo = await loadImage(logoUrl);

            // Logo grande y prominente
            const logoW = 14;
            const logoH = 14; // Nota: si es rectangular, ajustar
            // Centrado verticalmente "saliendo" un poco por arriba para efecto 3D o contenido dentro
            // Vamos a contenerlo bien:
            const logoY = headerStart - 1; // Sube un poco para romper el borde superior (efecto pop) o centrado
            // Mejor centrado en el bloque morado:
            const logoY_centered = headerStart + (headerH - 10) / 2; // ~3.8

            pdf.addImage(imgLogo, 'PNG', 4, headerStart + 1, 10, 10); // 10x10 seguro dentro

            // TEXTOS (Alineados a la derecha y mejor distribuidos)
            const textX = 30; // Centro de la zona de texto

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(5.5);
            pdf.setFont('helvetica', 'bold');
            pdf.text('ESTACIÓN', textX + 2, headerStart + 3.5, { align: 'center' });

            pdf.setFontSize(14); // HOMIES más grande
            pdf.setTextColor(...amarillo);
            pdf.text('HOMIES', textX + 2, headerStart + 7.5, { align: 'center' });

            pdf.setFontSize(4.2);
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'normal');
            pdf.text('CREDENCIAL DE MIEMBRO', textX + 2, headerStart + 9.5, { align: 'center' });

        } catch (e) {
            console.warn("Error logo header", e);
            // Fallback
        }

        // ===== FOTO =====
        const fotoY = headerStart + headerH + 3; // ~17.8mm
        const fotoW = 24;
        const fotoH = 26;
        const fotoX = (54 - fotoW) / 2;

        // Sombra sutil para la foto
        pdf.setFillColor(200, 200, 200);
        pdf.roundedRect(fotoX - 0.2, fotoY - 0.2, fotoW + 1, fotoH + 1, 1, 1, 'F'); // Sombra desplazada

        // Marco blanco limpio
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(fotoX - 0.5, fotoY - 0.5, fotoW + 1, fotoH + 1, 0.5, 0.5, 'F');

        if (miembro.ruta_foto_perfil) {
            try {
                const fotoUrl = getImageUrl(miembro.ruta_foto_perfil);
                const img = await loadImage(fotoUrl);
                pdf.addImage(img, 'JPEG', fotoX, fotoY, fotoW, fotoH);
            } catch (error) {
                dibujarPlaceholder(pdf, fotoX, fotoY, fotoW, fotoH, morado, miembro);
            }
        } else {
            dibujarPlaceholder(pdf, fotoX, fotoY, fotoW, fotoH, morado, miembro);
        }

        // ===== NOMBRE =====
        let cursorY = fotoY + fotoH + 4; // ~48mm

        pdf.setFontSize(8.5); // Un pelín más grande si cabe
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...grisOscuro);

        const nombreCompleto = `${miembro.nombres} ${miembro.apellidos}`.toUpperCase();
        const nombreLines = pdf.splitTextToSize(nombreCompleto, 44);
        const lineCount = Math.min(nombreLines.length, 3);

        for (let i = 0; i < lineCount; i++) {
            pdf.text(nombreLines[i], 27, cursorY, { align: 'center' });
            cursorY += 3;
        }

        // Línea decorativa estilizada
        cursorY += 1;
        pdf.setDrawColor(...morado); // Línea morada sutil
        pdf.setLineWidth(0.1);
        pdf.line(20, cursorY, 34, cursorY);

        // ===== DATOS =====
        cursorY += 3.5;

        pdf.setFontSize(7); // Más legible
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(60, 60, 60);

        pdf.text(`CI: ${miembro.ci} ${miembro.expedido}`, 27, cursorY, { align: 'center' });
        cursorY += 3;

        if (miembro.telefono) {
            pdf.text(`Tel: ${miembro.telefono}`, 27, cursorY, { align: 'center' });
        }

        // ===== BADGE ESTADO =====
        const badgeY = cursorY + 2;
        const badgeH = 4.5;
        const badgeW = 24;

        pdf.setLineWidth(0.2);

        if (miembro.es_activo) {
            pdf.setFillColor(...cyan);
            pdf.setDrawColor(...cyanOscuro);
            // Efecto botón (borde inferior más grueso simulado con offset)
            pdf.roundedRect((54 - badgeW) / 2, badgeY, badgeW, badgeH, 1.5, 1.5, 'FD');

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'bold');
            pdf.text('ACTIVO', 27, badgeY + 3.2, { align: 'center' });
        } else {
            pdf.setFillColor(220, 53, 69);
            pdf.setDrawColor(...rojoOscuro);
            pdf.roundedRect((54 - badgeW) / 2, badgeY, badgeW, badgeH, 1.5, 1.5, 'FD');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'bold');
            pdf.text('INACTIVO', 27, badgeY + 3.2, { align: 'center' });
        }

        // ===== QR CODE =====
        const qrSize = 13;
        const qrY = badgeY + badgeH + 3.5;
        const qrX = (54 - qrSize) / 2;

        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(...morado);
        pdf.setLineWidth(0.4); // Borde más grueso
        pdf.roundedRect(qrX - 0.5, qrY - 0.5, qrSize + 1, qrSize + 1, 1, 1, 'FD');

        const urlVerificacion = `${window.location.origin}/verificar/${miembro.codigo_credencial_uuid}`;
        const qrDataUrl = await QRCode.toDataURL(urlVerificacion, {
            errorCorrectionLevel: 'M',
            margin: 0,
            width: 300,
            color: {
                dark: '#2c003e', // Morado muy oscuro casi negro
                light: '#FFFFFF'
            }
        });

        pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

        // ===== FOOTER =====
        const textY = qrY + qrSize + 2.5;

        pdf.setFontSize(5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...morado);
        pdf.text('ESCANEA PARA VERIFICAR', 27, textY, { align: 'center' });

        const footerY = textY + 2.5;

        pdf.setFontSize(4.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        const codCorto = miembro.codigo_credencial_uuid.split('-')[0].toUpperCase();
        pdf.text(`COD: ${codCorto}`, 27, footerY, { align: 'center' });

        const nombreArchivo = `credencial_${miembro.nombres}_${miembro.apellidos}`
            .replace(/\s+/g, '_')
            .toLowerCase();

        // Detectar si estamos en móvil (Capacitor)
        if (Capacitor.isNativePlatform()) {
            // En móvil: Guardar con Filesystem API y compartir
            const pdfOutput = pdf.output('datauristring');
            const base64Data = pdfOutput.split(',')[1];

            const fileName = `${nombreArchivo}.pdf`;

            // Guardar en Documents (más accesible que Downloads en Android)
            const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Documents,
                recursive: true
            });

            console.log('PDF guardado en:', savedFile.uri);

            // Compartir el archivo (esto abre el selector de apps)
            await Share.share({
                title: 'Credencial HOMIES',
                text: `Credencial de ${miembro.nombres} ${miembro.apellidos}`,
                url: savedFile.uri,
                dialogTitle: 'Guardar o compartir credencial'
            });

            return {
                success: true,
                message: 'Credencial generada. Selecciona dónde guardarla.',
                path: savedFile.uri
            };
        } else {
            // En web/desktop: Descarga normal
            pdf.save(`${nombreArchivo}.pdf`);
            return { success: true, message: 'Credencial descargada exitosamente' };
        }
    } catch (error) {
        console.error('Error al generar credencial:', error);
        throw error;
    }
};

const dibujarPlaceholder = (pdf, x, y, w, h, color, miembro) => {
    pdf.setFillColor(245, 245, 250);
    pdf.roundedRect(x, y, w, h, 0.5, 0.5, 'F');
    pdf.setFontSize(22);
    pdf.setTextColor(...color);
    const iniciales = miembro.nombres[0] + miembro.apellidos[0];
    pdf.text(iniciales, x + (w / 2), y + (h / 2) + 2, { align: 'center' });
};

const loadImage = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
};

export default {
    generarCredencialPDF
};
