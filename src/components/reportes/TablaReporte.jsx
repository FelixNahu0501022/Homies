/* src/components/reportes/TablaReporte.jsx
 * Componente reutilizable para mostrar tablas de reportes con scroll horizontal
 */
import {
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    Paper,
    Typography,
    Box,
} from "@mui/material";

export default function TablaReporte({ datos = [], titulo, sx = {} }) {
    // Si no hay datos, mostrar mensaje vacío
    if (!datos || datos.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: "center", ...sx }}>
                <Typography variant="body2" color="text.secondary">
                    Sin datos para mostrar
                </Typography>
            </Paper>
        );
    }

    // Obtener columnas dinámicamente de las claves del primer objeto
    const columnas = Object.keys(datos[0] || {});

    return (
        <Paper sx={{ ...sx }}>
            {titulo && (
                <Box sx={{ p: 2, borderBottom: "1px solid rgba(224, 224, 224, 1)" }}>
                    <Typography variant="h6">{titulo}</Typography>
                </Box>
            )}
            <TableContainer sx={{ overflowX: "auto" }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {columnas.map((col) => (
                                <TableCell key={col} sx={{ fontWeight: 700 }}>
                                    {col}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {datos.map((fila, idx) => (
                            <TableRow key={idx} hover>
                                {columnas.map((col) => (
                                    <TableCell key={col}>
                                        {Array.isArray(fila[col])
                                            ? fila[col].join(", ")
                                            : String(fila[col] ?? "—")}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}
