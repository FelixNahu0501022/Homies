import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Button,
    TextField,
    Switch,
    FormControlLabel,
    Chip,
    Avatar,
    IconButton,
    Tooltip,
    Typography,
    InputAdornment,
    useMediaQuery,
    useTheme,
    Card,
    CardContent,
    CardActions,
    Grid,
    CircularProgress,
} from "@mui/material";
import {
    Add,
    Search,
    Edit,
    PersonOff,
    PersonAddAlt,
    Person,
    Badge,
} from "@mui/icons-material";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import { useAuth } from "../../context/AuthContext";
import miembrosService from "../../services/miembros.service";
import { getImageUrl } from "../../utils/imageUtils";
import { generarCredencialPDF } from "../../utils/credencialPDF";
import Swal from "sweetalert2";

function MiembrosPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const { hasPermission, hasRole } = useAuth();

    // Estados
    const [miembros, setMiembros] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtros, setFiltros] = useState({
        estado: true, // true = activos
        busqueda: "",
        limite: 50,
        offset: 0,
    });
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);

    // Verificar permisos
    // RPP puede crear pero no editar/eliminar/ticket
    const esRPP = hasRole('rpp');
    const tienePermisoGestion = hasPermission("miembros.gestion");

    const canCreate = tienePermisoGestion || esRPP;
    const canEdit = tienePermisoGestion && !esRPP; // Si es RPP, no puede editar aunque tuviera permiso (regla negocio)
    const canDelete = tienePermisoGestion && !esRPP;
    const canCredential = tienePermisoGestion && !esRPP;

    // Columna Acciones visible si puede hacer ALGO aparte de ver
    const showActions = canEdit || canDelete || canCredential;

    // Cargar miembros
    useEffect(() => {
        loadMiembros();
    }, [filtros]);

    const loadMiembros = async () => {
        setLoading(true);
        try {
            const response = await miembrosService.getMiembros(filtros);
            console.log("Miembros cargados:", response);
            console.log("Primer miembro:", response.data?.[0]);
            setMiembros(response.data || []);
            setTotal(response.total || 0);
        } catch (error) {
            console.error("Error al cargar miembros:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudieron cargar los miembros",
            });
        } finally {
            setLoading(false);
        }
    };

    // Manejar cambio de página
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
        setFiltros({
            ...filtros,
            offset: newPage * filtros.limite,
        });
    };

    // Manejar cambio de filas por página
    const handleChangeRowsPerPage = (event) => {
        const newLimit = parseInt(event.target.value, 10);
        setFiltros({
            ...filtros,
            limite: newLimit,
            offset: 0,
        });
        setPage(0);
    };

    // Manejar búsqueda
    const handleBusqueda = (event) => {
        const value = event.target.value;
        setFiltros({
            ...filtros,
            busqueda: value,
            offset: 0,
        });
        setPage(0);
    };

    // Toggle activos/inactivos
    const handleToggleEstado = () => {
        setFiltros({
            ...filtros,
            estado: !filtros.estado,
            offset: 0,
        });
        setPage(0);
    };

    // Dar de baja
    const handleDarDeBaja = async (miembro) => {
        const result = await Swal.fire({
            title: "¿Dar de baja?",
            text: `¿Estás seguro de dar de baja a ${miembro.nombres} ${miembro.apellidos}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: theme.palette.error.main,
            cancelButtonColor: theme.palette.grey[500],
            confirmButtonText: "Sí, dar de baja",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                await miembrosService.darDeBajaMiembro(miembro.id);
                Swal.fire({
                    icon: "success",
                    title: "Miembro dado de baja",
                    timer: 2000,
                    showConfirmButton: false,
                });
                loadMiembros();
            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error.message || "No se pudo dar de baja al miembro",
                });
            }
        }
    };

    // Reactivar
    const handleReactivar = async (miembro) => {
        const result = await Swal.fire({
            title: "¿Reactivar miembro?",
            text: `¿Deseas reactivar a ${miembro.nombres} ${miembro.apellidos}?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: theme.palette.success.main,
            cancelButtonColor: theme.palette.grey[500],
            confirmButtonText: "Sí, reactivar",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                await miembrosService.reactivarMiembro(miembro.id);
                Swal.fire({
                    icon: "success",
                    title: "Miembro reactivado",
                    timer: 2000,
                    showConfirmButton: false,
                });
                loadMiembros();
            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error.message || "No se pudo reactivar al miembro",
                });
            }
        }
    };

    // Generar credencial PDF
    const handleGenerarCredencial = async (miembro) => {
        try {
            await generarCredencialPDF(miembro);
            Swal.fire({
                icon: "success",
                title: "Credencial generada",
                text: "El PDF se ha descargado exitosamente",
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error("Error al generar credencial:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo generar la credencial",
            });
        }
    };

    // Renderizar vista mobile (cards)
    const renderMobileCards = () => (
        <Grid container spacing={2}>
            {miembros.map((miembro) => (
                <Grid item xs={12} key={miembro.id}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                                <Avatar
                                    src={getImageUrl(miembro.ruta_foto_perfil)}
                                    alt={`${miembro.nombres} ${miembro.apellidos}`}
                                    sx={{ width: 60, height: 60 }}
                                >
                                    {miembro.nombres[0]}{miembro.apellidos[0]}
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" fontWeight={600}>
                                        {miembro.nombres} {miembro.apellidos}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        CI: {miembro.ci} {miembro.expedido}
                                    </Typography>
                                    {miembro.telefono && (
                                        <Typography variant="body2" color="text.secondary">
                                            Tel: {miembro.telefono}
                                        </Typography>
                                    )}
                                </Box>
                                <Chip
                                    label={miembro.es_activo ? "Activo" : "Inactivo"}
                                    color={miembro.es_activo ? "success" : "default"}
                                    size="small"
                                />
                            </Box>
                        </CardContent>
                        <CardActions sx={{ justifyContent: "flex-end", gap: 1 }}>
                            {canCredential && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                    startIcon={<Badge />}
                                    onClick={() => handleGenerarCredencial(miembro)}
                                >
                                    Credencial
                                </Button>
                            )}
                            {canEdit && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<Edit />}
                                    onClick={() => navigate(`/miembros/editar/${miembro.id}`)}
                                >
                                    Editar
                                </Button>
                            )}
                            {canDelete && (
                                <>
                                    {miembro.es_activo ? (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            startIcon={<PersonOff />}
                                            onClick={() => handleDarDeBaja(miembro)}
                                        >
                                            Baja
                                        </Button>
                                    ) : (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="success"
                                            startIcon={<PersonAddAlt />}
                                            onClick={() => handleReactivar(miembro)}
                                        >
                                            Reactivar
                                        </Button>
                                    )}
                                </>
                            )}
                        </CardActions>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );

    // Renderizar tabla desktop
    const renderDesktopTable = () => (
        <TableContainer component={Paper} elevation={1}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Foto</TableCell>
                        <TableCell>Nombre Completo</TableCell>
                        <TableCell>CI</TableCell>
                        <TableCell>Teléfono</TableCell>
                        <TableCell>Estado</TableCell>
                        {showActions && <TableCell align="right">Acciones</TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {miembros.map((miembro) => (
                        <TableRow key={miembro.id} hover>
                            <TableCell>
                                <Avatar
                                    src={getImageUrl(miembro.ruta_foto_perfil)}
                                    alt={`${miembro.nombres} ${miembro.apellidos}`}
                                >
                                    {miembro.nombres[0]}{miembro.apellidos[0]}
                                </Avatar>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body1" fontWeight={500}>
                                    {miembro.nombres} {miembro.apellidos}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                {miembro.ci} <Chip label={miembro.expedido} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>{miembro.telefono || "-"}</TableCell>
                            <TableCell>
                                <Chip
                                    label={miembro.es_activo ? "Activo" : "Inactivo"}
                                    color={miembro.es_activo ? "success" : "default"}
                                    size="small"
                                />
                            </TableCell>
                            {showActions && (
                                <TableCell align="right">
                                    {canCredential && (
                                        <Tooltip title="Generar Credencial">
                                            <IconButton
                                                size="small"
                                                color="secondary"
                                                onClick={() => handleGenerarCredencial(miembro)}
                                            >
                                                <Badge />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    {canEdit && (
                                        <Tooltip title="Editar">
                                            <IconButton
                                                size="small"
                                                onClick={() => navigate(`/miembros/editar/${miembro.id}`)}
                                            >
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    {canDelete && (
                                        <>
                                            {miembro.es_activo ? (
                                                <Tooltip title="Dar de baja">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDarDeBaja(miembro)}
                                                    >
                                                        <PersonOff />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title="Reactivar">
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() => handleReactivar(miembro)}
                                                    >
                                                        <PersonAddAlt />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </>
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <LayoutDashboard title="Gestión de Miembros">
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                    <Typography variant="h5" fontWeight={700}>
                        <Person sx={{ mr: 1, verticalAlign: "middle" }} />
                        Miembros
                    </Typography>
                    {canCreate && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => navigate("/miembros/crear")}
                        >
                            Nuevo Miembro
                        </Button>
                    )}
                </Box>

                {/* Filtros */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                placeholder="Buscar por nombre, apellido o CI..."
                                value={filtros.busqueda}
                                onChange={handleBusqueda}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={filtros.estado}
                                        onChange={handleToggleEstado}
                                        color="success"
                                    />
                                }
                                label={filtros.estado ? "Activos" : "Inactivos"}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Contenido */}
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : miembros.length === 0 ? (
                    <Paper sx={{ p: 5, textAlign: "center" }}>
                        <Person sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            No se encontraron miembros
                        </Typography>
                    </Paper>
                ) : (
                    <>
                        {isMobile ? renderMobileCards() : renderDesktopTable()}

                        {/* Paginación */}
                        <TablePagination
                            component="div"
                            count={total}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={filtros.limite}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            labelRowsPerPage="Filas por página:"
                            labelDisplayedRows={({ from, to, count }) =>
                                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                            }
                            sx={{ mt: 2 }}
                        />
                    </>
                )}
            </Box>
        </LayoutDashboard>
    );
}

export default MiembrosPage;
