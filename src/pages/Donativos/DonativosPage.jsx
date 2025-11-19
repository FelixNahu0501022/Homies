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
  Chip,
  Pagination,
  LinearProgress,
  TableContainer,
  Skeleton,
  Stack,
  InputAdornment,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  VolunteerActivism,
  Assessment,
  Search,
} from "@mui/icons-material";
import { useEffect, useMemo, useState, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import debounce from "lodash.debounce";
import { alpha, useTheme } from "@mui/material/styles";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import { listarDonativos, eliminarDonativo } from "../../services/donativos.service";
import DonativoCrearPage from "./DonativoCrearPage";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function DonativosPage() {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await listarDonativos();
      setRows(data || []);
      setFiltered(data || []);
      setPage(1);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "No se pudo cargar donativos";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const applyFilter = useMemo(
    () =>
      debounce((value, source) => {
        const v = (value || "").toLowerCase().trim();
        if (!v) {
          setFiltered(source);
          setPage(1);
          return;
        }
        setFiltered(
          source.filter(
            (d) =>
              `${d.tipo ?? ""}`.toLowerCase().includes(v) ||
              `${d.descripcion ?? ""}`.toLowerCase().includes(v) ||
              `${d.estado ?? ""}`.toLowerCase().includes(v)
          )
        );
        setPage(1);
      }, 300),
    []
  );

  useEffect(() => {
    applyFilter(search, rows);
  }, [search, rows, applyFilter]);

  const onDelete = async (d) => {
    const confirm = await Swal.fire({
      title: `¿Eliminar donativo?`,
      text: d.descripcion || "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    try {
      await eliminarDonativo(d.iddonativo);
      await cargar();
      Swal.fire("Listo", "Donativo eliminado", "success");
    } catch (err) {
      const msg =
        err?.response?.data?.error || err?.message || "No se pudo eliminar";
      Swal.fire("Error", msg, "error");
    }
  };

  const fechaFmt = (f) => (f ? String(f).slice(0, 10) : "—");
  const estadoColor = (e) =>
    e === "Pendiente"
      ? "warning"
      : e === "Aprobado"
      ? "success"
      : e === "Rechazado"
      ? "error"
      : "default";

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageItems = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleOpenCreate = () => setOpenCreateDialog(true);
  const handleCloseCreate = () => setOpenCreateDialog(false);

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
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Gestión de Donativos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administra y revisa los donativos registrados en el sistema
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          justifyContent={{ xs: "flex-start", sm: "flex-end" }}
        >
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            size={isSmall ? "small" : "medium"}
            onClick={() => navigate("/donativos/reportes")}
          >
            Reportes
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            size={isSmall ? "small" : "medium"}
            onClick={handleOpenCreate}
          >
            Nuevo Donativo
          </Button>
        </Stack>
      </Box>

      {/* Buscador */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        sx={{ mb: 2 }}
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <TextField
          variant="outlined"
          placeholder="Buscar por tipo, descripción o estado..."
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size={isSmall ? "small" : "medium"}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      {/* Tabla principal */}
      <Paper sx={{ width: "100%", borderRadius: 3, overflow: "hidden" }}>
        {loading && <LinearProgress />}

        <TableContainer>
          <Table
            stickyHeader
            size={isMobile ? "small" : "medium"}
            aria-label="tabla de donativos"
          >
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Descripción</TableCell>
                {!isSmall && <TableCell>Cantidad</TableCell>}
                <TableCell>Fecha</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      <TableCell colSpan={6}>
                        <Skeleton width="100%" height={28} />
                      </TableCell>
                    </TableRow>
                  ))
                : pageItems.map((d) => (
                    <TableRow
                      key={d.iddonativo}
                      hover
                      sx={
                        d.estado === "Rechazado"
                          ? {
                              backgroundColor: (t) =>
                                alpha(t.palette.error.main, 0.06),
                            }
                          : undefined
                      }
                    >
                      <TableCell>
                        <Chip
                          icon={<VolunteerActivism fontSize="small" />}
                          size="small"
                          label={d.tipo || "—"}
                          color="info"
                        />
                      </TableCell>
                      <TableCell>{d.descripcion || "—"}</TableCell>
                      {!isSmall && (
                        <TableCell>
                          {d.cantidad != null ? Number(d.cantidad) : "—"}
                        </TableCell>
                      )}
                      <TableCell>{fechaFmt(d.fecha)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={d.estado || "Pendiente"}
                          color={estadoColor(d.estado)}
                          sx={{
                            color: "#fff",
                            fontWeight: 700,
                            "& .MuiChip-icon": { color: "inherit" },
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton
                            color="primary"
                            size={isSmall ? "small" : "medium"}
                            onClick={() =>
                              navigate(`/donativos/editar/${d.iddonativo}`)
                            }
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            color="error"
                            size={isSmall ? "small" : "medium"}
                            onClick={() => onDelete(d)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
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
        <Box p={2} display="flex" justifyContent="center">
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            size={isSmall ? "small" : "medium"}
          />
        </Box>
      </Paper>

      {/* Modal Crear Donativo */}
      <Dialog
        open={openCreateDialog}
        onClose={handleCloseCreate}
        fullWidth
        maxWidth="lg"
        fullScreen={isMobile}
        TransitionComponent={Transition}
      >
        <DialogTitle>Crear Nuevo Donativo</DialogTitle>
        <DialogContent dividers>
          <DonativoCrearPage
            onClose={handleCloseCreate}
            onSuccess={() => {
              handleCloseCreate();
              cargar();
            }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "flex-end", p: 2 }}>
          <Button variant="outlined" onClick={handleCloseCreate}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </LayoutDashboard>
  );
}
