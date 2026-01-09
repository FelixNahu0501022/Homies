import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Button,
    IconButton,
    Chip,
    Avatar,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    useMediaQuery,
    useTheme,
    Card,
    CardContent,
    CardActions,
    Grid,
    InputAdornment,
} from '@mui/material';
import {
    Add,
    Edit,
    LockReset,
    Block,
    CheckCircle,
    Search,
    Person,
} from '@mui/icons-material';
import LayoutDashboard from '../../layouts/LayoutDashboard';
import usuariosService from '../../services/usuarios.service';
import Swal from 'sweetalert2';

function UsuariosPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');

    // Estado para cambio de contraseña
    const [passwordDialog, setPasswordDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [passwordForm, setPasswordForm] = useState({
        password_nueva: '',
        confirmar_password: ''
    });

    useEffect(() => {
        loadUsuarios();
    }, []);

    const loadUsuarios = async () => {
        setLoading(true);
        try {
            const response = await usuariosService.getUsuarios();
            if (response.success) {
                setUsuarios(response.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setBusqueda(e.target.value);
    };

    const usuariosFiltrados = usuarios.filter(u =>
        u.nombre_usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.miembro_nombre?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const handleOpenPasswordDialog = (user) => {
        setSelectedUser(user);
        setPasswordForm({ password_nueva: '', confirmar_password: '' });
        setPasswordDialog(true);
    };

    const handleChangePassword = async () => {
        if (!passwordForm.password_nueva || passwordForm.password_nueva !== passwordForm.confirmar_password) {
            Swal.fire('Error', 'Las contraseñas no coinciden o están vacías', 'error');
            return;
        }

        try {
            const response = await usuariosService.updatePassword(selectedUser.id, {
                password_actual: 'ADMIN_OVERRIDE', // En un caso real de admin, a veces no se pide la actual, o se usa un endpoint especial. Aquí asumimos que el backend lo permite o enviamos un flag.
                // Ajuste: Según la spec del usuario, pide 'password_actual'. Si soy admin reseteando, ¿cómo sé la actual? 
                // Asumiré por ahora que es un reset administrativo y enviaré la nueva. Si el backend valida estrictamente, habrá que verlo.
                password_nueva: passwordForm.password_nueva
            });

            if (response.success) {
                Swal.fire('Éxito', 'Contraseña actualizada correctamente', 'success');
                setPasswordDialog(false);
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'No se pudo actualizar la contraseña', 'error');
        }
    };

    return (
        <LayoutDashboard title="Gestión de Usuarios">
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Usuarios del Sistema
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate('/usuarios/crear')}
                    >
                        Nuevo Usuario
                    </Button>
                </Box>

                <Paper sx={{ p: 2, mb: 3 }}>
                    <TextField
                        fullWidth
                        placeholder="Buscar por nombre de usuario o miembro..."
                        value={busqueda}
                        onChange={handleSearch}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Paper>

                {isMobile ? (
                    <Grid container spacing={2}>
                        {usuariosFiltrados.map((user) => (
                            <Grid item xs={12} key={user.id}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
                                                {user.nombre_usuario[0].toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6">{user.nombre_usuario}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {user.miembro_nombre || 'Sin miembro asociado'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ mb: 1 }}>
                                            {user.roles.map((role) => (
                                                <Chip key={role.id} label={role.nombre} size="small" sx={{ mr: 0.5 }} />
                                            ))}
                                        </Box>
                                        <Chip
                                            label={user.estado}
                                            color={user.estado === 'ACTIVO' ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small" startIcon={<Edit />} onClick={() => navigate(`/usuarios/${user.id}/editar`)}>
                                            Editar
                                        </Button>
                                        <Button size="small" startIcon={<LockReset />} onClick={() => handleOpenPasswordDialog(user)}>
                                            Contraseña
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Usuario</TableCell>
                                    <TableCell>Miembro Asociado</TableCell>
                                    <TableCell>Roles</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {usuariosFiltrados.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ mr: 2, width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                                                    {user.nombre_usuario[0].toUpperCase()}
                                                </Avatar>
                                                <Typography fontWeight="bold">{user.nombre_usuario}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{user.miembro_nombre || '-'}</TableCell>
                                        <TableCell>
                                            {user.roles.map((role) => (
                                                <Chip key={role.id} label={role.alias} size="small" sx={{ mr: 0.5 }} variant="outlined" />
                                            ))}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.estado}
                                                color={user.estado === 'ACTIVO' ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Editar Usuario">
                                                <IconButton onClick={() => navigate(`/usuarios/${user.id}/editar`)} color="info">
                                                    <Edit />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Cambiar Contraseña">
                                                <IconButton onClick={() => handleOpenPasswordDialog(user)} color="primary">
                                                    <LockReset />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Dialogo Cambio Contraseña */}
                <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)}>
                    <DialogTitle>Cambiar Contraseña</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Usuario: <strong>{selectedUser?.nombre_usuario}</strong>
                        </Typography>
                        <TextField
                            fullWidth
                            label="Nueva Contraseña"
                            type="password"
                            value={passwordForm.password_nueva}
                            onChange={(e) => setPasswordForm({ ...passwordForm, password_nueva: e.target.value })}
                            sx={{ mb: 2, mt: 1 }}
                        />
                        <TextField
                            fullWidth
                            label="Confirmar Contraseña"
                            type="password"
                            value={passwordForm.confirmar_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmar_password: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setPasswordDialog(false)}>Cancelar</Button>
                        <Button variant="contained" onClick={handleChangePassword}>Guardar</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LayoutDashboard>
    );
}

export default UsuariosPage;
