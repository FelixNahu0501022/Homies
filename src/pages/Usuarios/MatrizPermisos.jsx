// src/pages/Usuarios/MatrizPermisos.jsx
import { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, Box, CircularProgress, Chip, Tooltip, IconButton
} from '@mui/material';
import { CheckCircle, Cancel, PictureAsPdf } from '@mui/icons-material';
import { repPermisosMatriz } from '../../services/usuarios.service';
import { exportTablePdf } from '../../utils/pdfExport';
import Swal from 'sweetalert2';

export default function MatrizPermisos() {
    const [loading, setLoading] = useState(true);
    const [matriz, setMatriz] = useState({ roles: [], permisos: [], asignaciones: [] });

    useEffect(() => {
        cargarMatriz();
    }, []);

    const cargarMatriz = async () => {
        setLoading(true);
        try {
            const data = await repPermisosMatriz();
            setMatriz(data || { roles: [], permisos: [], asignaciones: [] });
        } catch (error) {
            Swal.fire('Error', error?.message || 'No se pudo cargar la matriz', 'error');
        } finally {
            setLoading(false);
        }
    };

    const tienePermiso = (idRol, idPermiso) => {
        return matriz.asignaciones.some(
            a => a.idrol === idRol && a.idpermiso === idPermiso
        );
    };

    const exportarPDF = () => {
        if (!matriz.roles.length || !matriz.permisos.length) {
            Swal.fire('Aviso', 'No hay datos para exportar', 'info');
            return;
        }

        // Crear datos para PDF
        const rows = matriz.permisos.map(permiso => {
            const row = { Permiso: permiso.nombre };
            matriz.roles.forEach(rol => {
                row[rol.nombre] = tienePermiso(rol.idrol, permiso.idpermiso) ? 'Sí' : 'No';
            });
            return row;
        });

        const columns = [
            { header: 'Permiso', dataKey: 'Permiso' },
            ...matriz.roles.map(rol => ({ header: rol.nombre, dataKey: rol.nombre }))
        ];

        exportTablePdf({
            title: 'Matriz de Permisos por Rol',
            subtitle: `${matriz.roles.length} roles × ${matriz.permisos.length} permisos`,
            columns,
            rows,
            filename: 'matriz_permisos.pdf',
            orientation: matriz.roles.length > 5 ? 'landscape' : 'portrait'
        });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                <CircularProgress />
            </Box>
        );
    }

    if (!matriz.roles.length || !matriz.permisos.length) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No hay datos de permisos para mostrar</Typography>
            </Paper>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Matriz de Permisos por Rol
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {matriz.roles.length} roles × {matriz.permisos.length} permisos = {matriz.asignaciones.length} asignaciones
                    </Typography>
                </Box>
                <Tooltip title="Exportar a PDF">
                    <IconButton onClick={exportarPDF} color="primary">
                        <PictureAsPdf />
                    </IconButton>
                </Tooltip>
            </Box>

            <TableContainer component={Paper} elevation={2} sx={{ maxHeight: 600 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, minWidth: 200, backgroundColor: '#f5f5f5' }}>
                                Permiso
                            </TableCell>
                            {matriz.roles.map(rol => (
                                <TableCell
                                    key={rol.idrol}
                                    align="center"
                                    sx={{
                                        fontWeight: 700,
                                        minWidth: 100,
                                        backgroundColor: '#f5f5f5',
                                        writingMode: 'horizontal-tb',
                                    }}
                                >
                                    <Tooltip title={rol.descripcion || rol.nombre}>
                                        <span>{rol.nombre}</span>
                                    </Tooltip>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {matriz.permisos.map(permiso => (
                            <TableRow key={permiso.idpermiso} hover>
                                <TableCell sx={{ fontWeight: 500 }}>
                                    <Tooltip title={permiso.descripcion || permiso.nombre}>
                                        <span>{permiso.nombre}</span>
                                    </Tooltip>
                                </TableCell>
                                {matriz.roles.map(rol => {
                                    const tiene = tienePermiso(rol.idrol, permiso.idpermiso);
                                    return (
                                        <TableCell key={`${rol.idrol}-${permiso.idpermiso}`} align="center">
                                            {tiene ? (
                                                <CheckCircle sx={{ color: '#2E7D32', fontSize: 20 }} />
                                            ) : (
                                                <Cancel sx={{ color: '#BDBDBD', fontSize: 20 }} />
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Leyenda */}
            <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Chip
                    icon={<CheckCircle />}
                    label="Permiso Asignado"
                    size="small"
                    sx={{ borderColor: '#2E7D32', color: '#2E7D32' }}
                    variant="outlined"
                />
                <Chip
                    icon={<Cancel />}
                    label="Sin Permiso"
                    size="small"
                    variant="outlined"
                />
            </Box>
        </Box>
    );
}
