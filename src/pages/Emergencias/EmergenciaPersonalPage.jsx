// src/pages/emergencias/EmergenciaPersonalPage.jsx
// ✅ Compatible: modo página completa o modal embebido
// ✅ Misma estructura visual que InventarioModal
// ✅ Mantiene toda la lógica, sin romper servicios ni rutas

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
  TablePagination,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { ArrowBack, Person, Delete, Add, Close } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import debounce from "lodash.debounce";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import api from "../../services/axios";
import {
  listarPersonalDeEmergencia,
  asignarPersonal,
  desasignarPersonal,
  obtenerEmergencia,
} from "../../services/emergencias.service";

function normPerson(p) {
  const id = p.idpersonal ?? p.idPersonal ?? p.id ?? null;
  return {
    id,
    nombre: p.nombre ?? "",
    apellido: p.apellido ?? "",
    cargo: p.cargo ?? p.grado_nombre ?? "",
    estado: p.estado ?? "",
    _raw: p,
  };
}

export default function EmergenciaPersonalPage(props) {
  const { embedded = false, open = false, onClose, idEmergencia: idEmergProp } = props || {};
  const params = useParams();
  const idEmergencia = idEmergProp != null ? Number(idEmergProp) : Number(params.id);
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:900px)");

  const [emerg, setEmerg] = useState(null);
  const [asignados, setAsignados] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [catalogo, setCatalogo] = useState([]);
  const [pSel, setPSel] = useState(null);
  const [autoInput, setAutoInput] = useState("");
  const [search, setSearch] = useState("");

  // ---- carga inicial: emergencia + asignados
  const cargar = async () => {
    try {
      const [e, a] = await Promise.all([
        obtenerEmergencia(idEmergencia),
        listarPersonalDeEmergencia(idEmergencia),
      ]);
      setEmerg(e || null);
      const aN = (a || []).map(normPerson);
      setAsignados(aN);
      setFiltered(aN);
      setPage(0);
      await fetchCatalog("");
    } catch (err) {
      const msg =
        err?.response?.data?.mensaje ||
        err?.message ||
        "No se pudo cargar personal";
      Swal.fire("Error", msg, "error");
      if (!embedded) navigate("/emergencias");
    }
  };

  useEffect(() => {
    if (idEmergencia) cargar();
    // eslint-disable-next-line
  }, [idEmergencia]);

  // Recargar cuando la ventana recupera el focus
  useEffect(() => {
    const handleFocus = () => cargar();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [idEmergencia]);

  // ---- filtro tabla
  const applyFilter = useMemo(
    () =>
      debounce((value, src) => {
        const v = (value || "").toLowerCase().trim();
        if (!v) return setFiltered(src);
        setFiltered(
          src.filter(
            (x) =>
              `${x.nombre} ${x.apellido}`.toLowerCase().includes(v) ||
              `${x.cargo}`.toLowerCase().includes(v) ||
              `${x.estado}`.toLowerCase().includes(v)
          )
        );
        setPage(0);
      }, 250),
    []
  );
  useEffect(() => {
    applyFilter(search, asignados);
  }, [search, asignados, applyFilter]);

  // ---- búsqueda remota
  const fetchCatalog = useMemo(
    () =>
      debounce(async (q) => {
        try {
          const { data } = await api.get("/personal", {
            params: { page: 1, limit: 20, search: q || "" },
          });
          const arr = Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];
          setCatalogo(arr.map(normPerson));
        } catch {
          /* silencioso */
        }
      }, 300),
    []
  );

  useEffect(() => {
    fetchCatalog(autoInput);
  }, [autoInput, fetchCatalog]);

  const addPersonal = async () => {
    if (!pSel) return Swal.fire("Valida", "Selecciona una persona", "info");
    if (asignados.some((a) => Number(a.id) === Number(pSel.id))) {
      return Swal.fire("Aviso", "Ya está asignado", "info");
    }
    try {
      await asignarPersonal(idEmergencia, [pSel.id]);
      setPSel(null);
      await cargar();
      Swal.fire("Listo", "Personal asignado", "success");
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo asignar";
      Swal.fire("Error", msg, "error");
    }
  };

  const removePersonal = async (row) => {
    const ok = await Swal.fire({
      title: `¿Desasignar a ${row.nombre} ${row.apellido}?`,
      text: "Se registrará en el kardex",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, desasignar",
      cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;
    try {
      await desasignarPersonal(idEmergencia, row.id, {
        observaciones: "Desasignado desde interfaz"
      });
      await cargar();
      Swal.fire("Listo", "Personal desasignado correctamente", "success");
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo desasignar";
      Swal.fire("Error", msg, "error");
    }
  };

  // ======= CONTENIDO PRINCIPAL =======
  const Content = (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Personal — Emergencia #{idEmergencia}
          {emerg?.estado && (
            <Chip label={emerg.estado} size="small" sx={{ ml: 1 }} />
          )}
        </Typography>

        {!embedded ? (
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/emergencias")}
          >
            Volver
          </Button>
        ) : (
          <Button variant="outlined" startIcon={<Close />} onClick={onClose}>
            Cerrar
          </Button>
        )}
      </Box>

      {/* Selector + Añadir */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 3 }}>
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <Autocomplete
            options={catalogo || []}
            getOptionLabel={(p) => `${p.nombre} ${p.apellido} — ${p.cargo}`}
            value={pSel}
            onChange={(_, val) => setPSel(val)}
            inputValue={autoInput}
            onInputChange={(_, v) => setAutoInput(v)}
            renderInput={(params) => (
              <TextField {...params} label="Buscar personal…" />
            )}
            sx={{ minWidth: 280, flex: 1 }}
          />
          <Button variant="contained" startIcon={<Add />} onClick={addPersonal}>
            Asignar
          </Button>
        </Box>
        <Typography
          variant="caption"
          sx={{ display: "block", color: "text.secondary", mt: 0.5 }}
        >
          Busca por nombre, apellido o cargo. La búsqueda es remota y paginada.
        </Typography>
      </Paper>

      {/* Tabla de asignados */}
      <Paper sx={{ borderRadius: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          p={2}
          pb={0}
        >
          <TextField
            label="Filtrar asignados"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ maxWidth: 360 }}
          />
        </Box>

        <Table size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell>
                <Person fontSize="small" sx={{ mr: 0.5 }} /> Nombre
              </TableCell>
              <TableCell>Cargo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    {p.nombre} {p.apellido}
                  </TableCell>
                  <TableCell>{p.cargo || "—"}</TableCell>
                  <TableCell>{p.estado || "—"}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Quitar">
                      <IconButton color="error" onClick={() => removePersonal(p)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Sin personal asignado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 20]}
        />
      </Paper>
    </>
  );

  // ======= RENDER CONDICIONAL =======
  if (embedded) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Person fontSize="small" />
            <Typography variant="h6">
              Personal — Emergencia #{idEmergencia}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1, sm: 2 } }}>
          {Content}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined" startIcon={<Close />}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return <LayoutDashboard>{Content}</LayoutDashboard>;
}
