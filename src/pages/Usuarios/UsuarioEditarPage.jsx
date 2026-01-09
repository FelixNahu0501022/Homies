import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    FormControlLabel,
    Checkbox,
    Grid,
    FormGroup,
    CircularProgress,
    MenuItem,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import LayoutDashboard from '../../layouts/LayoutDashboard';
import usuariosService from '../../services/usuarios.service';
import rolesService from '../../services/roles.service';
import Swal from 'sweetalert2';

function UsuarioEditarPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState([]);
    const [form, setForm] = useState({
        nombre_usuario: '',
        estado: 'ACTIVO',
        roles: [] // array de IDs
    });

    useEffect(() => {
        loadData();
    }, []);

    // Estado inicial de roles para calcular diferencias
    const [initialRoles, setInitialRoles] = useState([]);

    const loadData = async () => {
        try {
            const [rolesRes, userRes] = await Promise.all([
                rolesService.getRoles(),
                usuariosService.getUsuario(id)
            ]);

            if (rolesRes.success) {
                setRoles(rolesRes.data || []);
            }

            if (userRes.success) {
                const u = userRes.data;
                const userRolesIds = u.roles.map(r => r.id);
                setInitialRoles(userRolesIds); // Guardar estado inicial
                setForm({
                    nombre_usuario: u.nombre_usuario,
                    estado: u.estado,
                    roles: userRolesIds,
                    miembro_id: u.miembro_id // Guardar ID de miembro oculto
                });
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'No se pudo cargar la información del usuario', 'error');
            navigate('/usuarios');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = (roleId) => {
        setForm(prev => {
            const currentRoles = prev.roles;
            if (currentRoles.includes(roleId)) {
                return { ...prev, roles: currentRoles.filter(id => id !== roleId) };
            } else {
                return { ...prev, roles: [...currentRoles, roleId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 1. Actualizar Datos Básicos (Usuario, Estado)
            // Enviar solo lo necesario para evitar conflictos en backend (ej. si le molesta recibir 'roles')
            const userPayload = {
                nombre_usuario: form.nombre_usuario,
                estado: form.estado,
                miembro_id: form.miembro_id // Requerido por validación backend probablemente
            };

            await usuariosService.updateUsuario(id, userPayload);

            // 2. Calcular diferencias de Roles
            const rolesToAdd = form.roles.filter(rid => !initialRoles.includes(rid));
            const rolesToRemove = initialRoles.filter(rid => !form.roles.includes(rid));

            // 3. Aplicar cambios de Roles uno por uno
            const rolePromises = [];

            rolesToAdd.forEach(rid => {
                rolePromises.push(usuariosService.addRol(id, rid));
            });

            rolesToRemove.forEach(rid => {
                rolePromises.push(usuariosService.removeRol(id, rid));
            });

            await Promise.all(rolePromises);

            Swal.fire({
                icon: 'success',
                title: 'Datos Actualizados',
                text: 'Usuario y roles actualizados correctamente.',
            });
            navigate('/usuarios');

        } catch (err) {
            console.error(err);
            Swal.fire('Error', err.response?.data?.message || 'Error al actualizar', 'error');
        }
    };

    if (loading) {
        return (
            <LayoutDashboard title="Editar Usuario">
                <Box sx={{ p: 5, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            </LayoutDashboard>
        );
    }

    return (
        <LayoutDashboard title="Editar Usuario">
            <Box sx={{ p: 3 }}>
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/usuarios')} sx={{ mb: 2 }}>
                    Volver
                </Button>

                <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom mb={3}>
                        Editar Usuario: {form.nombre_usuario}
                    </Typography>

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Nombre de Usuario"
                                    value={form.nombre_usuario}
                                    onChange={(e) => setForm({ ...form, nombre_usuario: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Estado"
                                    value={form.estado}
                                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                                >
                                    <MenuItem value="ACTIVO">ACTIVO</MenuItem>
                                    <MenuItem value="INACTIVO">INACTIVO</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>Roles Asignados</Typography>
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <FormGroup row>
                                        {roles.map((role) => (
                                            <FormControlLabel
                                                key={role.id}
                                                control={
                                                    <Checkbox
                                                        checked={form.roles.includes(role.id)}
                                                        onChange={() => handleRoleChange(role.id)}
                                                    />
                                                }
                                                label={role.alias || role.nombre}
                                                sx={{ width: '30%' }}
                                            />
                                        ))}
                                    </FormGroup>
                                </Paper>
                            </Grid>

                            <Grid item xs={12}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    startIcon={<Save />}
                                    sx={{ mt: 2 }}
                                >
                                    Guardar Cambios
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            </Box>
        </LayoutDashboard>
    );
}

export default UsuarioEditarPage;
