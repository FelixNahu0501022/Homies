import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const loadImage = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
};

export const generarVoucherPDF = async (venta) => {
    try {
        const doc = new jsPDF();

        // --- PALETA HOMIES (Extraída de Credencial) ---
        const colorMorado = [123, 41, 152];
        const colorAmarillo = [255, 229, 0];
        const colorGrisFondo = [240, 240, 245];
        const colorTexto = [60, 60, 60];

        // Colores Funcionales (Estado)
        const saldoPendiente = venta.monto_total - venta.monto_pagado;
        const esReserva = saldoPendiente > 0;
        const colorEstado = esReserva ? [220, 53, 69] : [40, 167, 69]; // Rojo vs Verde

        // --- MARCA DE AGUA (Mascota) ---
        try {
            const watermarkUrl = window.location.origin + '/mascota-homies.jpg';
            const imgWatermark = await loadImage(watermarkUrl);

            // Centrado y con opacidad muy baja
            doc.saveGraphicsState();
            doc.setGState(new doc.GState({ opacity: 0.1 }));
            const wmW = 100;
            const wmH = 100;
            const wmX = (210 - wmW) / 2;
            const wmY = (297 - wmH) / 2;
            doc.addImage(imgWatermark, 'JPEG', wmX, wmY, wmW, wmH);
            doc.restoreGraphicsState();
        } catch (e) {
            console.warn("No se pudo cargar watermark", e);
        }

        // --- HEADER BRANDING ---
        // Fondo Morado
        doc.setFillColor(...colorMorado);
        doc.rect(0, 0, 210, 40, 'F');

        // Línea Amarilla decorativa inferior header
        doc.setFillColor(...colorAmarillo);
        doc.rect(0, 38, 210, 2, 'F');

        // Logo
        try {
            const logoUrl = window.location.origin + '/logo-homies.png';
            const imgLogo = await loadImage(logoUrl);
            doc.addImage(imgLogo, 'PNG', 14, 6, 28, 28);
        } catch (e) {
            console.warn("No se pudo cargar logo", e);
        }

        // Título del Documento
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(26);
        doc.setFont('helvetica', 'bold');
        const titulo = esReserva ? "RECIBO DE RESERVA" : "NOTA DE ENTREGA";
        doc.text(titulo, 200, 20, { align: 'right' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colorAmarillo); // Número en amarillo para resaltar
        doc.text(`TICKET N° ${venta.id.toString().padStart(6, '0')}`, 200, 30, { align: 'right' });

        // --- DATOS DEL DOCUMENTO ---
        let yPos = 50;

        // Recuadro de datos (Estilo tarjeta)
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.roundedRect(14, yPos, 182, 35, 3, 3, 'FD');

        // Cliente
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150); // Label gris suave
        doc.setFont('helvetica', 'bold');
        doc.text("CLIENTE", 22, yPos + 8);

        doc.setFontSize(11);
        doc.setTextColor(...colorTexto);
        doc.setFont('helvetica', 'bold');
        doc.text(`${venta.comprador || 'Consumidor Final'}`, 22, yPos + 14);

        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`CI/NIT: ${venta.ci || 'S/N'}`, 22, yPos + 22);

        // Línea divisoria vertical sutil
        doc.setDrawColor(230, 230, 230);
        doc.line(110, yPos + 5, 110, yPos + 30);

        // Detalles Venta
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text("FECHA EMISIÓN", 118, yPos + 8);
        doc.setFontSize(10);
        doc.setTextColor(...colorTexto);
        doc.text(new Date(venta.fecha_venta).toLocaleString('es-BO'), 118, yPos + 14);

        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text("ATENDIDO POR", 160, yPos + 8);
        doc.setFontSize(10);
        doc.setTextColor(...colorTexto);
        doc.text(venta.vendedor || 'Staff', 160, yPos + 14);

        // --- TABLA ---
        const columns = [
            { header: 'PRODUCTO', dataKey: 'producto' },
            { header: 'CANT.', dataKey: 'cantidad' },
            { header: 'P. UNIT.', dataKey: 'precio' },
            { header: 'SUBTOTAL', dataKey: 'subtotal' },
        ];

        const rows = venta.detalles.map(item => ({
            producto: item.producto_nombre,
            cantidad: item.cantidad,
            precio: `Bs. ${parseFloat(item.precio_historico).toFixed(2)}`,
            subtotal: `Bs. ${parseFloat(item.subtotal).toFixed(2)}`
        }));

        autoTable(doc, {
            startY: yPos + 45,
            columns: columns,
            body: rows,
            theme: 'grid',
            headStyles: {
                fillColor: colorMorado,
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
                minCellHeight: 12,
                valign: 'middle',
                lineWidth: 0
            },
            bodyStyles: {
                textColor: 50,
                cellPadding: 4,
                valign: 'middle'
            },
            alternateRowStyles: {
                fillColor: [250, 250, 255]
            },
            columnStyles: {
                cantidad: { halign: 'center' },
                precio: { halign: 'right' },
                subtotal: { halign: 'right', fontStyle: 'bold' }
            },
        });

        // --- TOTALES Y RESUMEN ---
        let finalY = doc.lastAutoTable.finalY + 10;

        // Bloque de Totales
        const totalBoxX = 120;
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);

        // Total
        doc.text("TOTAL VENTA:", totalBoxX, finalY);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Bs. ${parseFloat(venta.monto_total).toFixed(2)}`, 196, finalY, { align: 'right' });

        finalY += 8;
        // Pagado
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text("A CUENTA / PAGADO:", totalBoxX, finalY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorMorado); // Usamos morado para el pago
        doc.text(`Bs. ${parseFloat(venta.monto_pagado).toFixed(2)}`, 196, finalY, { align: 'right' });

        // Línea gruesa divisoria
        finalY += 5;
        doc.setDrawColor(...colorTexto);
        doc.setLineWidth(0.5);
        doc.line(totalBoxX, finalY, 196, finalY);

        finalY += 8;
        // Saldo
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        if (esReserva) {
            doc.setTextColor(...colorEstado); // Rojo
            doc.text("SALDO PENDIENTE:", totalBoxX, finalY);
            doc.text(`Bs. ${saldoPendiente.toFixed(2)}`, 196, finalY, { align: 'right' });
        } else {
            doc.setTextColor(...colorEstado); // Verde
            doc.text("SALDO PENDIENTE:", totalBoxX, finalY);
            doc.text("Bs. 0.00", 196, finalY, { align: 'right' });
        }

        // --- SELLO DE ESTADO ---
        const selloY = finalY - 15;
        doc.setDrawColor(...colorEstado);
        doc.setLineWidth(2);
        doc.roundedRect(14, selloY, 80, 25, 2, 2, 'D');

        doc.setFontSize(16);
        doc.setTextColor(...colorEstado);
        doc.setFont('helvetica', 'bold');
        const textoSello = esReserva ? "PENDIENTE DE PAGO" : "ENTREGADO";
        doc.text(textoSello, 54, selloY + 16, { align: 'center' });

        // Texto pequeño bajo sello
        if (esReserva) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text("* No entregar productos hasta completar pago", 54, selloY + 32, { align: 'center' });
        }

        // --- FOOTER ---
        const pageHeight = doc.internal.pageSize.height;

        // Franja inferior morada fina
        doc.setFillColor(...colorMorado);
        doc.rect(0, pageHeight - 6, 210, 6, 'F');

        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text("HOMIES - Streetwear & Lifestyle", 105, pageHeight - 10, { align: 'center' });

        // Guardar
        const filename = `voucher_${venta.id}_${esReserva ? 'reserva' : 'entrega'}.pdf`;

        // Detectar si estamos en móvil (Capacitor)
        if (Capacitor.isNativePlatform()) {
            // En móvil: Guardar con Filesystem API y compartir
            const pdfOutput = doc.output('datauristring');
            const base64Data = pdfOutput.split(',')[1];

            const savedFile = await Filesystem.writeFile({
                path: filename,
                data: base64Data,
                directory: Directory.Documents,
                recursive: true
            });

            console.log('Voucher PDF guardado en:', savedFile.uri);

            // Compartir el archivo
            await Share.share({
                title: 'Voucher HOMIES',
                text: `Voucher de venta #${venta.id}`,
                url: savedFile.uri,
                dialogTitle: 'Guardar o compartir voucher'
            });

            return true;
        } else {
            // En web/desktop: Descarga normal
            doc.save(filename);
            return true;
        }

    } catch (error) {
        console.error("Error al generar voucher:", error);
        throw error;
    }
};
