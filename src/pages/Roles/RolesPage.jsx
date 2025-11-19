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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Snackbar,
  Alert,
  useMediaQuery,
  DialogContentText,
} from "@mui/material";
import { Add, Edit, Shield, Delete } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useState, forwardRef } from "react";
import debounce from "lodash.debounce";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import { listarRoles, eliminarRol } from "../../services/roles.service";
import RolCrearPage from "./RolCrearPage";
import RolEditarPage from "./RolEditarPage";
import RolPermisosPage from "./RolPermisosPage";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null, nombre: "" });

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openPermisos, setOpenPermisos] = useState(false);
  const [editId, setEditId] = useState(null);
  const [permisosId, setPermisosId] = useState(null);

  const isMobile = useMediaQuery("(max-width:900px)");

  /* ===================== DATA ===================== */
  const cargar = async () => {
    try {
      const data = await listarRoles();
      setRoles(data || []);
      setFiltered(data || []);
    } catch (err) {
      console.error("Error al cargar roles:", err);
      setSnackbar({ open: true, message: "No se pudo cargar roles", severity: "error" });
    }
  };

  useEffect(() => { cargar(); }, []);

  const applyFilter = useMemo(
    () =>
      debounce((value, source) => {
        const v = (value || "").toLowerCase().trim();
        if (!v) return setFiltered(source);
        setFiltered(
          source.filter(
            (r) =>
              r.nombre?.toLowerCase().includes(v) ||
              r.descripcion?.toLowerCase().includes(v)
          )
        );
      }, 300),
    []
  );

  useEffect(() => { applyFilter(search, roles); }, [search, roles, applyFilter]);

  /* ===================== HANDLERS ===================== */
  const handleConfirmDelete = (id, nombre) => {
    setConfirmDialog({ open: true, id, nombre });
  };

  const handleDelete = async () => {
    try {
      await eliminarRol(confirmDialog.id);
      await cargar();
      setSnackbar({ open: true, message: "Rol eliminado correctamente", severity: "success" });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || "No se pudo eliminar el rol",
        severity: "error",
      });
    } finally {
      setConfirmDialog({ open: false, id: null, nombre: "" });
    }
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenCreate = () => setOpenCreate(true);
  const handleCloseCreate = () => setOpenCreate(false);

  const handleOpenEdit = (id) => {
    setEditId(id);
    setOpenEdit(true);
  };
  const handleCloseEdit = () => setOpenEdit(false);

  const handleOpenPermisos = (id) => {
    setPermisosId(id);
    setOpenPermisos(true);
  };
  const handleClosePermisos = () => setOpenPermisos(false);

  /* ===================== RENDER ===================== */
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
        <Typography variant="h5" fontWeight={700}>
          Gestión de Roles
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreate}
        >
          Nuevo Rol
        </Button>
      </Box>

      {/* Buscador */}
      <TextField
        label="Buscar rol"
        fullWidth
        margin="normal"
        placeholder="Filtra por nombre o descripción"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Tabla */}
      <Paper sx={{ mt: 2, borderRadius: 3, overflowX: "auto" }}>
        <Table size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((r) => (
              <TableRow
                key={r.idrol}
                hover
                sx={{
                  "&:hover": { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04) },
                }}
              >
                <TableCell>{r.nombre}</TableCell>
                <TableCell>{r.descripcion || "—"}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Configurar Permisos">
                    <IconButton color="secondary" onClick={() => handleOpenPermisos(r.idrol)}>
                      <Shield />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton color="primary" onClick={() => handleOpenEdit(r.idrol)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton color="error" onClick={() => handleConfirmDelete(r.idrol, r.nombre)}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Sin resultados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog: Crear */}
      <Dialog
        open={openCreate}
        onClose={handleCloseCreate}
        fullWidth
        maxWidth="sm"
        TransitionComponent={Transition}
      >
        <DialogTitle>Crear nuevo rol</DialogTitle>
        <DialogContent dividers>
          <RolCrearPage
            onClose={handleCloseCreate}
            onSuccess={() => {
              handleCloseCreate();
              cargar();
              setSnackbar({
                open: true,
                message: "Rol creado correctamente",
                severity: "success",
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar */}
      <Dialog
        open={openEdit}
        onClose={handleCloseEdit}
        fullWidth
        maxWidth="sm"
        TransitionComponent={Transition}
      >
        <DialogTitle>Editar rol</DialogTitle>
        <DialogContent dividers>
          <RolEditarPage
            idRol={editId}
            onClose={handleCloseEdit}
            onSuccess={() => {
              handleCloseEdit();
              cargar();
              setSnackbar({
                open: true,
                message: "Rol actualizado correctamente",
                severity: "success",
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Permisos */}
      <Dialog
        open={openPermisos}
        onClose={handleClosePermisos}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        TransitionComponent={Transition}
        sx={{
          "& .MuiDialog-paper": {
            zIndex: 2000,
            height: "100%",
            margin: 0,
          },
        }}
      >
        <DialogTitle>Configurar permisos del rol</DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: { xs: 1, sm: 2 },
            maxHeight: "calc(100vh - 150px)",
            overflowY: "auto",
            backgroundColor: "#fff",
          }}
        >
          <RolPermisosPage idRol={permisosId} embedded onClose={handleClosePermisos} />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "flex-end", p: 2 }}>
          <Button onClick={handleClosePermisos} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmar eliminar */}
      <Dialog
        open={confirmDialog.open}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setConfirmDialog({ open: false })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle textAlign="center">
          ¿Eliminar rol "{confirmDialog.nombre}"?
        </DialogTitle>
        <DialogContent>
          <DialogContentText textAlign="center">
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button variant="outlined" onClick={() => setConfirmDialog({ open: false })}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Eliminar
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
