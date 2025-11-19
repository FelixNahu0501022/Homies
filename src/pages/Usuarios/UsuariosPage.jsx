// src/pages/Usuarios/UsuariosPage.jsx
import {
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Button,
  Box,
  Chip,
  TextField,
  Pagination,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Slide,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  TableContainer,
  LinearProgress,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Stack,
  InputAdornment,
} from "@mui/material";
import {
  Edit,
  Add,
  ToggleOn,
  ToggleOff,
  Assessment,
  MoreVert,
  Search,
  CheckCircleOutline,
  Block,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useState, forwardRef } from "react";
import debounce from "lodash.debounce";
import { useNavigate } from "react-router-dom";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  listarUsuarios,
  cambiarEstadoUsuario,
} from "../../services/usuarios.service";
import api from "../../services/axios";
import UsuarioCrearPage from "./UsuarioCrearPage";
import UsuarioEditarPage from "./UsuarioEditar"; // renombrado para consistencia

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/* ========= Helpers UI ========= */
const rolePalette = ["default", "primary", "secondary", "success", "warning", "info"];
const hashString = (s = "") => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
};
const colorForRole = (name = "") => rolePalette[hashString(name) % rolePalette.length];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [rolesLookup, setRolesLookup] = useState(new Map());
  const [rolesList, setRolesList] = useState([]); // para filtros
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("all"); // all|active|inactive
  const [filterRoles, setFilterRoles] = useState([]); // ids numéricos

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    id: null,
    activar: null,
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Modales
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editUserId, setEditUserId] = useState(null);

  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery("(max-width:900px)");
  const isSmall = useMediaQuery("(max-width:600px)");
  const navigate = useNavigate();

  /* ====== Catálogo de Roles ====== */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/roles");
        const map = new Map();
        (data || []).forEach((r) => map.set(r.idrol, r.nombre));
        setRolesLookup(map);
        setRolesList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("No se pudo cargar roles:", err);
      }
    })();
  }, []);

  /* ====== Carga de Usuarios ====== */
  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search,
      };

      if (filterEstado === "active") params.estado = true;
      if (filterEstado === "inactive") params.estado = false;
      if (filterRoles?.length) params.roles = filterRoles.join(",");

      const res = await listarUsuarios(params);
      let data = res?.data || [];

      if (filterEstado !== "all") {
        const want = filterEstado === "active";
        data = data.filter((u) => !!u.estado === want);
      }
      if (filterRoles?.length) {
        data = data.filter((u) => {
          if (Array.isArray(u.roles_detalle) && u.roles_detalle.length) {
            const ids = u.roles_detalle.map((r) => r.idrol);
            return filterRoles.some((rid) => ids.includes(rid));
          }
          if (Array.isArray(u.roles)) {
            return filterRoles.some((rid) => u.roles.includes(rid));
          }
          return false;
        });
      }

      setUsuarios(data);
      const pages = Math.max(1, Math.ceil((res?.total || 0) / (res?.limit || 10)));
      setTotalPages(pages);
    } catch (err) {
      console.error("Error al obtener usuarios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, [page, search, filterEstado, filterRoles]);

  /* ====== Search debounced ====== */
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setSearch(value);
        setPage(1);
      }, 500),
    []
  );
  const onSearchChange = (e) => debouncedSearch(e.target.value);

  /* ====== Menú móvil ====== */
  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  /* ====== Confirmar activar/desactivar ====== */
  const handleConfirmDialog = (id, activar) => {
    setConfirmDialog({ open: true, id, activar });
  };
  const handleConfirmAction = async () => {
    try {
      await cambiarEstadoUsuario(confirmDialog.id, confirmDialog.activar);
      await cargarUsuarios();
      setSnackbar({
        open: true,
        message: confirmDialog.activar
          ? "Usuario activado correctamente"
          : "Usuario desactivado correctamente",
        severity: confirmDialog.activar ? "success" : "warning",
      });
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      setSnackbar({
        open: true,
        message: "Ocurrió un error al actualizar el estado",
        severity: "error",
      });
    } finally {
      setConfirmDialog({ open: false, id: null, activar: null });
    }
  };
  const handleCancelAction = () => {
    setConfirmDialog({ open: false, id: null, activar: null });
  };

  /* ====== Snackbar ====== */
  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

  /* ====== Modales ====== */
  const handleOpenCreate = () => setOpenCreateDialog(true);
  const handleCloseCreate = () => setOpenCreateDialog(false);
  const handleOpenEdit = (id) => {
    setEditUserId(id);
    setOpenEditDialog(true);
  };
  const handleCloseEdit = () => setOpenEditDialog(false);

  /* ====== Render roles como chips ====== */
  const renderRoles = (u) => {
    if (Array.isArray(u.roles_detalle) && u.roles_detalle.length > 0) {
      return u.roles_detalle.map((r) => (
        <Chip
          key={`${u.idusuario}-${r.idrol}`}
          label={r.nombre}
          size="small"
          color={colorForRole(r.nombre)}
          sx={{ mr: 0.5 }}
        />
      ));
    }
    if (Array.isArray(u.roles) && u.roles.length > 0) {
      return u.roles.map((idRol) => {
        const name = rolesLookup.get(idRol) || `Rol #${idRol}`;
        return (
          <Chip
            key={`${u.idusuario}-${idRol}`}
            label={name}
            size="small"
            color={colorForRole(name)}
            sx={{ mr: 0.5 }}
          />
        );
      });
    }
    return <Chip label="Sin rol" size="small" />;
  };

  /* ====== Layout ====== */
  return (
    <LayoutDashboard>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Gestión de Usuarios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administra usuarios, roles y estados del sistema
          </Typography>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => navigate("/usuarios/reportes")}
          >
            Reportes
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
            Nuevo Usuario
          </Button>
        </Box>
      </Box>

      {/* Filtros + Búsqueda */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        sx={{ mb: 1 }}
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <TextField
          variant="outlined"
          placeholder="Buscar por nombre o usuario..."
          fullWidth
          onChange={onSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: isSmall ? "100%" : 160 }}>
          <InputLabel id="filter-estado-label">Estado</InputLabel>
          <Select
            labelId="filter-estado-label"
            label="Estado"
            value={filterEstado}
            onChange={(e) => {
              setFilterEstado(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="active">Activos</MenuItem>
            <MenuItem value="inactive">Inactivos</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: isSmall ? "100%" : 240 }}>
          <InputLabel id="filter-roles-label">Roles</InputLabel>
          <Select
            multiple
            labelId="filter-roles-label"
            value={filterRoles}
            onChange={(e) => {
              setFilterRoles(
                typeof e.target.value === "string"
                  ? e.target.value.split(",").map(Number)
                  : e.target.value
              );
              setPage(1);
            }}
            input={<OutlinedInput label="Roles" />}
            renderValue={(selected) => {
              if (!selected?.length) return "Todos";
              const names = selected.map((rid) => rolesLookup.get(rid) || `Rol #${rid}`);
              return names.join(", ");
            }}
          >
            {rolesList.map((rol) => (
              <MenuItem key={rol.idrol} value={rol.idrol}>
                <Checkbox checked={filterRoles.indexOf(rol.idrol) > -1} />
                <ListItemText primary={rol.nombre} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Leyenda */}
      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1, flexWrap: "wrap" }}>
        <Chip
          icon={<CheckCircleOutline />}
          label="Activo"
          color="success"
          size="small"
          sx={{ color: "#fff", fontWeight: 700 }}
        />
        <Chip
          icon={<Block />}
          label="Inactivo"
          color="error"
          size="small"
          sx={{ color: "#fff", fontWeight: 700 }}
        />
      </Box>

      {/* Tabla */}
      <Paper sx={{ width: "100%", borderRadius: 3, overflow: "hidden" }}>
        {loading && <LinearProgress />}

        <TableContainer sx={{ maxHeight: { xs: 420, sm: 520, md: 620 } }}>
          <Table stickyHeader size={isMobile ? "small" : "medium"}>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      <TableCell>
                        <Skeleton width={30} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={140} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={200} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={90} />
                      </TableCell>
                      <TableCell align="right">
                        <Skeleton width={120} />
                      </TableCell>
                    </TableRow>
                  ))
                : usuarios.map((u) => (
                    <TableRow
                      key={u.idusuario}
                      hover
                      sx={
                        u.estado
                          ? undefined
                          : {
                              backgroundColor: (theme) =>
                                alpha(theme.palette.error.main, 0.06),
                            }
                      }
                    >
                      <TableCell>{u.idusuario}</TableCell>
                      <TableCell>{u.nombreusuario}</TableCell>
                      <TableCell>{renderRoles(u)}</TableCell>
                      <TableCell>
                        <Tooltip
                          title={u.estado ? "Usuario activo" : "Usuario inactivo"}
                        >
                          <Chip
                            icon={u.estado ? <CheckCircleOutline /> : <Block />}
                            label={u.estado ? "Activo" : "Inactivo"}
                            color={u.estado ? "success" : "error"}
                            size="small"
                            sx={{
                              color: "#fff",
                              fontWeight: 700,
                              "& .MuiChip-icon": { color: "inherit" },
                            }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">
                        {!isMobile ? (
                          <>
                            <Tooltip title="Editar">
                              <IconButton
                                color="primary"
                                onClick={() => handleOpenEdit(u.idusuario)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            {u.estado ? (
                              <Tooltip title="Desactivar usuario">
                                <IconButton
                                  sx={{ color: "text.secondary" }}
                                  onClick={() =>
                                    handleConfirmDialog(u.idusuario, false)
                                  }
                                >
                                  <ToggleOff />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Activar usuario">
                                <IconButton
                                  color="success"
                                  onClick={() =>
                                    handleConfirmDialog(u.idusuario, true)
                                  }
                                >
                                  <ToggleOn />
                                </IconButton>
                              </Tooltip>
                            )}
                          </>
                        ) : (
                          <IconButton onClick={(e) => handleMenuOpen(e, u)}>
                            <MoreVert />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

              {!loading && usuarios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Sin resultados
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
        <Box p={isMobile ? 1 : 2} display="flex" justifyContent="center">
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            size={isSmall ? "small" : "medium"}
          />
        </Box>
      </Paper>

      {/* Menú móvil */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            handleOpenEdit(selectedUser?.idusuario);
            handleMenuClose();
          }}
        >
          Editar
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleConfirmDialog(selectedUser?.idusuario, !selectedUser?.estado);
            handleMenuClose();
          }}
          sx={{
            color: selectedUser?.estado ? "text.secondary" : "success.main",
            fontWeight: 600,
          }}
        >
          {selectedUser?.estado ? "Desactivar" : "Activar"}
        </MenuItem>
      </Menu>

      {/* Modal Crear */}
      <Dialog
        open={openCreateDialog}
        onClose={handleCloseCreate}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        TransitionComponent={Transition}
      >
        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        <DialogContent dividers>
          <UsuarioCrearPage
            onClose={handleCloseCreate}
            onSuccess={() => {
              handleCloseCreate();
              cargarUsuarios();
              setSnackbar({
                open: true,
                message: "Usuario creado correctamente",
                severity: "success",
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEdit}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        TransitionComponent={Transition}
      >
        <DialogTitle>Editar Usuario</DialogTitle>
        <DialogContent dividers>
          <UsuarioEditarPage
            idUsuario={editUserId}
            onClose={handleCloseEdit}
            onSuccess={() => {
              handleCloseEdit();
              cargarUsuarios();
              setSnackbar({
                open: true,
                message: "Usuario actualizado correctamente",
                severity: "success",
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Confirmar activar/desactivar */}
      <Dialog
        open={confirmDialog.open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleCancelAction}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle textAlign="center">
          {confirmDialog.activar ? "¿Activar usuario?" : "¿Desactivar usuario?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText textAlign="center">
            {confirmDialog.activar
              ? "El usuario podrá volver a acceder al sistema."
              : "El usuario no podrá iniciar sesión ni usar el sistema."}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button variant="outlined" onClick={handleCancelAction}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color={confirmDialog.activar ? "success" : "error"}
            onClick={handleConfirmAction}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </LayoutDashboard>
  );
}
