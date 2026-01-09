import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Grid,
    Autocomplete,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Alert,
} from '@mui/material';
import {
    ArrowBack,
    Save,
} from '@mui/icons-material';
import LayoutDashboard from '../../layouts/LayoutDashboard';
import usuariosService from '../../services/usuarios.service';
import rolesService from '../../services/roles.service';
import miembrosService from '../../services/miembros.service';
import Swal from 'sweetalert2';

function UsuarioFormPage() {
    const navigate = useNavigate();

    const [miembros, setMiembros] = useState([]);
    const [roles, setRoles] = useState([]);
    const [form, setForm] = useState({
        miembro_id: null,
        nombre_usuario: '',
        password: '',
        roles: [], // Array de IDs
    });
    const [loading, setLoading] = useState(false);
    const [miembroSeleccionado, setMiembroSeleccionado] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [rolesRes, miembrosRes] = await Promise.all([
                rolesService.getRoles(),
                // Traemos miembros activos. Idealmente el backend filtraría los que NO tienen usuario,
                // pero si no, lo haremos en frontend si es necesario o confiamos en el selector.
                miembrosService.getMiembros({ estado: true })
            ]);

            if (rolesRes.success) {
                setRoles(rolesRes.data || []);
            }
            if (miembrosRes.success) {
                setMiembros(miembrosRes.data || []);
            }
        } catch (err) {
            console.error('Error cargando datos:', err);
        }
    };

    const handleMiembroChange = (event, newValue) => {
        setMiembroSeleccionado(newValue);
        if (newValue) {
            setForm(prev => ({
                ...prev,
                miembro_id: newValue.id,
                // Sugerir nombre de usuario: primera letra nombre + apellido
                nombre_usuario: prev.nombre_usuario ||
                    `${newValue.nombres.charAt(0).toLowerCase()}${newValue.apellidos.split(' ')[0].toLowerCase()}`
            }));
        } else {
            setForm(prev => ({ ...prev, miembro_id: null }));
        }
    };

    const handleRoleChange = (roleId) => {
        const currentRoles = form.roles;
        if (currentRoles.includes(roleId)) {
            setForm({ ...form, roles: currentRoles.filter(id => id !== roleId) });
        } else {
            setForm({ ...form, roles: [...currentRoles, roleId] });
        }
    };

    const handleSubmit = async () => {
        if (!form.miembro_id || !form.nombre_usuario || !form.password || form.roles.length === 0) {
            Swal.fire('Error', 'Completa todos los campos obligatorios', 'warning');
            return;
        }

        setLoading(true);
        try {
            const response = await usuariosService.createUsuario(form);
            if (response.success) {
                await Swal.fire('Éxito', 'Usuario creado correctamente', 'success');
                navigate('/usuarios');
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Error al crear usuario', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LayoutDashboard title="Nuevo Usuario">
            <Box sx={{ p: 3 }}>
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/usuarios')} sx={{ mb: 2 }}>
                    Volver
                </Button>

                <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Crear Nuevo Usuario
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Asigna un usuario de sistema a un miembro existente.
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Autocomplete
                                fullWidth
                                options={miembros}
                                getOptionLabel={(option) => `${option.nombres} ${option.apellidos} (${option.ci})`}
                                value={miembroSeleccionado}
                                onChange={handleMiembroChange}
                                renderInput={(params) => (
                                    <TextField {...params} label="Seleccionar Miembro *" placeholder="Buscar por nombre o CI..." />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                required
                                label="Nombre de Usuario"
                                value={form.nombre_usuario}
                                onChange={(e) => setForm({ ...form, nombre_usuario: e.target.value })}
                                helperText="Sugerido: inicial nombre + apellido"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                required
                                type="password"
                                label="Contraseña"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                                Asignar Roles *
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Grid container spacing={2}>
                                    {roles.map((role) => (
                                        <Grid item xs={12} sm={6} md={4} key={role.id}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={form.roles.includes(role.id)}
                                                        onChange={() => handleRoleChange(role.id)}
                                                    />
                                                }
                                                label={role.alias || role.nombre}
                                                sx={{ width: '100%' }}
                                            />
                                        </Grid>
                                    ))}
                                    {roles.length === 0 && (
                                        <Grid item xs={12}>
                                            <Alert severity="warning">No hay roles disponibles</Alert>
                                        </Grid>
                                    )}
                                </Grid>
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
                                <Button variant="outlined" onClick={() => navigate('/usuarios')} size="large">
                                    Cancelar
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<Save />}
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    size="large"
                                >
                                    {loading ? 'Guardando...' : 'Crear Usuario'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </LayoutDashboard>
    );
}

export default UsuarioFormPage;
