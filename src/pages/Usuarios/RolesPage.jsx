import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Grid,
    CircularProgress,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    IconButton,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { ExpandMore, Security, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import LayoutDashboard from '../../layouts/LayoutDashboard';
import rolesService from '../../services/roles.service';
import Swal from 'sweetalert2';

function RolesPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [roles, setRoles] = useState([]);
    const [permisos, setPermisos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estado para gestionar la adición
    const [selectedPermiso, setSelectedPermiso] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permisosRes] = await Promise.all([
                rolesService.getRoles(),
                rolesService.getPermisos()
            ]);

            if (rolesRes.success) setRoles(rolesRes.data || []);
            if (permisosRes.success) setPermisos(permisosRes.data || []);

        } catch (err) {
            console.error('Error cargando datos:', err);
            Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPermiso = async (rolId) => {
        if (!selectedPermiso) return;
        try {
            const role = roles.find(r => r.id === rolId);
            if (!role) return;

            const existingPermisosIds = role.permisos.map(p => p.id);
            const newPermisosIds = [...existingPermisosIds, selectedPermiso];

            // Asumimos que el backend espera { nombre, alias, permisos: [ids] } o similar
            // Para ser seguros, enviamos lo que tenemos
            const payload = {
                nombre: role.nombre,
                alias: role.alias,
                permisos: newPermisosIds
            };

            await rolesService.updateRole(rolId, payload);
            Swal.fire({
                icon: 'success',
                title: 'Permiso asignado',
                timer: 1500,
                showConfirmButton: false
            });
            setSelectedPermiso('');
            loadData();
        } catch (error) {
            Swal.fire('Error', 'No se pudo asignar el permiso', 'error');
        }
    };

    const handleRemovePermiso = async (rolId, permisoId) => {
        const result = await Swal.fire({
            title: '¿Quitar permiso?',
            text: "El rol perderá acceso a esta funcionalidad",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, quitar'
        });

        if (result.isConfirmed) {
            try {
                const role = roles.find(r => r.id === rolId);
                if (!role) return;

                const existingPermisosIds = role.permisos.map(p => p.id);
                const newPermisosIds = existingPermisosIds.filter(id => id !== permisoId);

                const payload = {
                    nombre: role.nombre,
                    alias: role.alias,
                    permisos: newPermisosIds
                };

                await rolesService.updateRole(rolId, payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Permiso eliminado',
                    timer: 1500,
                    showConfirmButton: false
                });
                loadData();
            } catch (error) {
                Swal.fire('Error', 'No se pudo quitar el permiso', 'error');
            }
        }
    };

    return (
        <LayoutDashboard title="Roles y Permisos">
            <Box sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Gestión de Roles y Permisos
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Administra los permisos asignados a cada rol. Tenga cuidado al modificar los permisos del Administrador.
                </Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : roles.length === 0 ? (
                    <Alert severity="info">No hay roles definidos en el sistema.</Alert>
                ) : (
                    <Box sx={{ mt: 3 }}>
                        {roles.map((role) => (
                            <Accordion key={role.id}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Security color={role.alias === 'admin' ? 'error' : 'primary'} />
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {role.nombre}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Alias: {role.alias} | {role.permisos?.length || 0} Permisos
                                            </Typography>
                                        </Box>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Permisos Activos:
                                        </Typography>
                                        <Grid container spacing={1}>
                                            {role.permisos && role.permisos.length > 0 ? (
                                                role.permisos.map((permiso) => (
                                                    <Grid item key={permiso.id}>
                                                        <Chip
                                                            label={`${permiso.alias}`}
                                                            title={permiso.nombre} // Tooltip con nombre completo
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                            onDelete={role.alias === 'admin' ? undefined : () => handleRemovePermiso(role.id, permiso.id)}
                                                        />
                                                    </Grid>
                                                ))
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                    Sin permisos asignados.
                                                </Typography>
                                            )}
                                        </Grid>
                                    </Box>

                                    {/* Sección para agregar permisos */}
                                    {role.alias !== 'admin' && ( // No dejar editar admin fácilmente para evitar bloqueos
                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center', mt: 3 }}>
                                            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 250 } }}>
                                                <InputLabel>Asignar Nuevo Permiso</InputLabel>
                                                <Select
                                                    value={selectedPermiso}
                                                    label="Asignar Nuevo Permiso"
                                                    onChange={(e) => setSelectedPermiso(e.target.value)}
                                                >
                                                    <MenuItem value="">
                                                        <em>Seleccione...</em>
                                                    </MenuItem>
                                                    {permisos
                                                        .filter(p => !role.permisos.some(rp => rp.id === p.id)) // Filtrar los que ya tiene
                                                        .map(p => (
                                                            <MenuItem key={p.id} value={p.id}>
                                                                {p.alias} - {p.nombre}
                                                            </MenuItem>
                                                        ))}
                                                </Select>
                                            </FormControl>
                                            <Button
                                                variant="contained"
                                                startIcon={<AddIcon />}
                                                onClick={() => handleAddPermiso(role.id)}
                                                disabled={!selectedPermiso}
                                                fullWidth={!!isMobile}
                                                sx={{ width: { xs: '100%', sm: 'auto' } }}
                                            >
                                                Asignar
                                            </Button>
                                        </Box>
                                    )}
                                    {role.alias === 'admin' && (
                                        <Alert severity="warning" sx={{ mt: 2 }}>
                                            Los permisos del administrador no deben modificarse manualmente para asegurar la integridad del sistema.
                                        </Alert>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                )}
            </Box>
        </LayoutDashboard>
    );
}

export default RolesPage;
