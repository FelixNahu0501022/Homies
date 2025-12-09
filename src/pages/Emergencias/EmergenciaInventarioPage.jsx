// src/pages/emergencias/EmergenciaInventarioPage.jsx
import {
  Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Tooltip, Button, Box, TextField, TablePagination, Chip, Checkbox, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, useMediaQuery, TableContainer
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { ArrowBack, Inventory2, Delete, Add, Close } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import debounce from "lodash.debounce";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  listarInventarioDeEmergencia,
  registrarInventarioUsoLote,
  quitarInventarioUso,
  obtenerEmergencia,
  listarVehiculosDeEmergencia, // solo los asignados a la emergencia
} from "../../services/emergencias.service";
import {
  verInventarioAsignado, // materiales del vehículo seleccionado
} from "../../services/vehiculos.service";

// Helpers fecha
const toLocalInputValue = (d) => {
  if (!d) return "";
  try {
    const str = String(d).trim();
    // Si ya está en formato ISO, usar directamente
    if (str.includes('T') || str.includes('-')) {
      return new Date(d).toISOString().slice(0, 16);
    }
    // Parsear formato DD/MM/YYYY HH:mm del backend
    const match = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
    if (match) {
      const [, day, month, year, hour, minute] = match;
      const fecha = new Date(
        parseInt(year),
        parseInt(month) - 1, // mes 0-indexed
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      );
      return fecha.toISOString().slice(0, 16);
    }
    return new Date(d).toISOString().slice(0, 16);
  } catch {
    return "";
  }
};
const sameDay = (a, b) => {
  if (!a || !b) return false;
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
};
const fmtFecha = (f) => f ? String(f).replace("T", " ").slice(0, 16) : "—";

export default function EmergenciaInventarioPage(props) {
  const { embedded = false, open = false, onClose, idEmergencia: idEmergProp } = props || {};
  const params = useParams();
  const navigate = useNavigate();
  const isSmall = useMediaQuery("(max-width:600px)");
  const isMobile = useMediaQuery("(max-width:900px)");

  // Si viene por modal usamos el idEmergProp, si no, el de la ruta
  const idEmergencia = idEmergProp != null ? Number(idEmergProp) : Number(params.id);

  const [emerg, setEmerg] = useState(null);
  const [usados, setUsados] = useState([]);
  const [catalogo, setCatalogo] = useState([]);     // materiales del vehículo seleccionado
  const [vehiculos, setVehiculos] = useState([]);   // SOLO los asignados a la emergencia

  const [itemSel, setItemSel] = useState(null);
  const [vehSel, setVehSel] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [dadoDeBaja, setDadoDeBaja] = useState(false);
  const [fechaMov, setFechaMov] = useState("");     // datetime-local string

  const [pendientes, setPendientes] = useState([]); // registros a enviar en lote

  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [page, setPage] = useState(0); const [rowsPerPage, setRowsPerPage] = useState(10);

  // Carga inicial: emergencia, usados, vehículos asignados (NO todos), sin catálogo aún
  const cargar = async () => {
    try {
      const [e, u, vs] = await Promise.all([
        obtenerEmergencia(idEmergencia),
        listarInventarioDeEmergencia(idEmergencia),
        listarVehiculosDeEmergencia(idEmergencia),
      ]);
      setEmerg(e || null);
      setUsados(u || []);
      setFiltered(u || []);
      setVehiculos(vs || []);
      setCatalogo([]);   // catálogo se carga al elegir vehículo
      setItemSel(null);
      setVehSel(null);
      setCantidad("");
      setDadoDeBaja(false);
      // fecha por defecto: uso = fecha emergencia, baja = ahora; como recién reiniciamos, usa fecha emergencia
      setFechaMov(toLocalInputValue(e?.fechahora));
      setPendientes([]);
      setPage(0);
    } catch {
      Swal.fire("Error", "No se pudo cargar inventario usado", "error");
      if (!embedded) navigate("/emergencias");
    }
  };
  useEffect(() => {
    if (!idEmergencia) return;
    cargar();
    // eslint-disable-next-line
  }, [idEmergencia]);

  // Cuando el usuario elige un vehículo, cargamos SOLO su inventario asignado
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!vehSel?.idvehiculo) {
        setCatalogo([]);
        setItemSel(null);
        return;
      }
      try {
        const items = await verInventarioAsignado(vehSel.idvehiculo); // [{idItem|iditem, nombre, cantidad, ...}]
        if (!cancel) {
          setCatalogo(items || []);
          setItemSel(null); // obliga a elegir del catálogo del vehículo
        }
      } catch {
        if (!cancel) {
          setCatalogo([]);
          setItemSel(null);
        }
      }
    })();
    return () => { cancel = true; };
  }, [vehSel]);

  // Cambiar fecha por defecto si conmutan baja/uso
  useEffect(() => {
    if (!emerg) return;
    if (dadoDeBaja) {
      // para baja: por defecto ahora
      setFechaMov(toLocalInputValue(new Date()));
    } else {
      // para uso: por defecto fecha de emergencia
      setFechaMov(toLocalInputValue(emerg.fechahora));
    }
  }, [dadoDeBaja, emerg]);

  const applyFilter = useMemo(() =>
    debounce((value, src) => {
      const v = (value || "").toLowerCase().trim();
      if (!v) return setFiltered(src);
      setFiltered(src.filter((x) => `${x.nombre ?? ""}`.toLowerCase().includes(v)));
      setPage(0);
    }, 250), []);
  useEffect(() => { applyFilter(search, usados); }, [search, usados, applyFilter]);

  const addPendiente = () => {
    if (!vehSel?.idvehiculo) return Swal.fire("Valida", "Selecciona un vehículo asignado", "info");
    if (!itemSel) return Swal.fire("Valida", "Selecciona un ítem del vehículo", "info");
    const cant = Number(cantidad);
    if (!cant || cant <= 0) return Swal.fire("Valida", "Cantidad inválida", "info");

    // Validar fecha
    if (!fechaMov) {
      return Swal.fire("Valida", "Selecciona la fecha del movimiento", "info");
    }
    const fechaJS = new Date(fechaMov);
    if (isNaN(fechaJS.getTime())) {
      return Swal.fire("Valida", "Fecha de movimiento inválida", "info");
    }
    // Validación same-day eliminada - permite emergencias pasadas

    setPendientes((prev) => ([
      ...prev,
      {
        idItem: itemSel.iditem || itemSel.idItem,
        idVehiculo: vehSel.idvehiculo,
        cantidadUsada: cant,
        dadoDeBaja,
        fecha: new Date(fechaMov).toISOString(),
        _view: {
          nombre: itemSel.nombre,
          vehiculoLabel: `${vehSel.placa} — ${vehSel.marca ?? ""} ${vehSel.modelo ?? ""}`,
          cantidad: cant,
          dadoDeBaja,
          fecha: fechaMov,
        }
      }
    ]));
    setItemSel(null);
    setCantidad("");
    // mantener mismo modo de baja/uso, no reseteamos switch
  };

  const sendLote = async () => {
    if (pendientes.length === 0) return Swal.fire("Valida", "No hay registros a enviar", "info");
    try {
      const registros = pendientes.map(p => ({
        idItem: p.idItem,
        idVehiculo: p.idVehiculo,
        cantidadUsada: p.cantidadUsada,
        dadoDeBaja: p.dadoDeBaja,
        fecha: p.fecha, // <-- importante
      }));
      await registrarInventarioUsoLote(idEmergencia, registros);
      setPendientes([]);
      await cargar();
      Swal.fire("Listo", "Material registrado", "success");
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo registrar el material";
      Swal.fire("Error", msg, "error");
    }
  };

  const removeUso = async (row) => {
    const ok = await Swal.fire({
      title: `¿Quitar uso de ${row?.nombre ?? "ítem"}?`,
      icon: "warning",
      showCancelButton: true,
    });
    if (!ok.isConfirmed) return;
    try {
      // El backend espera /inventario/:idItem/:idVehiculo
      const idItem = row.iditem ?? row.idItem;
      const idVehiculo = row.idvehiculo ?? row.idVehiculo;
      if (!idItem || !idVehiculo) throw new Error("Faltan identificadores del registro (idItem/idVehiculo)");
      await quitarInventarioUso(idEmergencia, idItem, idVehiculo);
      await cargar();
      Swal.fire("Listo", "Registro eliminado", "success");
    } catch (e) {
      const msg = e?.response?.data?.mensaje || e?.message || "No se pudo eliminar";
      Swal.fire("Error", msg, "error");
    }
  };

  // Filtra catálogo por texto de Autocomplete (client-side; catálogo ya viene por vehículo)
  const [itemInput, setItemInput] = useState("");
  const catalogoFiltrado = useMemo(() => {
    const v = (itemInput || "").toLowerCase().trim();
    if (!v) return catalogo;
    return (catalogo || []).filter(it => `${it.nombre ?? ""}`.toLowerCase().includes(v));
  }, [catalogo, itemInput]);

  const pageItems = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // ====== UI principal (contenido reutilizable) ======
  const Content = (
    <>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 1,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Inventario usado — Emergencia #{idEmergencia}
          </Typography>
          {emerg?.estado && (
            <Chip label={emerg.estado} size="small" sx={{ mt: 0.5 }} />
          )}
        </Box>

        {!embedded ? (
          <Button startIcon={<ArrowBack />} onClick={() => navigate("/emergencias")}>
            Volver
          </Button>
        ) : (
          <Button startIcon={<Close />} onClick={onClose}>
            Cerrar
          </Button>
        )}
      </Box>

      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 3 }}>
        {/* Selector de vehículo (SOLO asignados) */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1.2fr 1.6fr 0.9fr 1fr 1.1fr 0.8fr",
            },
            gap: 1,
            alignItems: "center",
          }}
        >
          <Autocomplete
            options={vehiculos}
            // getOptionKey no es usado por MUI, se deja para compat del código previo
            getOptionKey={(v) => v.idvehiculo}
            isOptionEqualToValue={(o, v) => (o?.idvehiculo || o?.idVehiculo) === (v?.idvehiculo || v?.idVehiculo)}
            getOptionLabel={(v) => (v ? `${v.placa} — ${v.marca ?? ""} ${v.modelo ?? ""}` : "")}
            value={vehSel}
            onChange={(_, v) => setVehSel(v || null)}
            renderInput={(params) => (
              <TextField {...params} label="Vehículo asignado" placeholder="Buscar por placa..." />
            )}
          />

          <Autocomplete
            options={catalogoFiltrado}
            value={itemSel}
            onInputChange={(_, val) => setItemInput(val)}
            onChange={(_, val) => setItemSel(val || null)}
            getOptionKey={(it) => it.iditem || it.idItem}
            isOptionEqualToValue={(o, v) => (o?.iditem || o?.idItem) === (v?.iditem || v?.idItem)}
            getOptionLabel={(it) => (it ? `${it.nombre ?? ""}` : "")}
            renderInput={(params) => (
              <TextField {...params} label="Material del vehículo" placeholder="Escribe para filtrar..." />
            )}
            disabled={!vehSel?.idvehiculo}
          />

          <TextField
            label="Cantidad usada"
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            disabled={!vehSel?.idvehiculo}
            inputProps={{ min: 1 }}
          />

          <TextField
            label="Fecha movimiento"
            type="datetime-local"
            value={fechaMov}
            onChange={(e) => setFechaMov(e.target.value)}
            disabled={!vehSel?.idvehiculo}
            helperText={
              dadoDeBaja
                ? "Para baja se sugiere la fecha actual"
                : emerg
                  ? `Auto-completado con fecha de emergencia`
                  : ""
            }
            InputLabelProps={{ shrink: true }}
            InputProps={{
              readOnly: !dadoDeBaja, // Solo editable si es baja
            }}
          />

          <FormControlLabel
            control={<Checkbox checked={dadoDeBaja} onChange={(e) => setDadoDeBaja(e.target.checked)} />}
            label="Dado de baja"
            disabled={!vehSel?.idvehiculo}
          />

          <Button variant="contained" startIcon={<Add />} onClick={addPendiente} disabled={!vehSel?.idvehiculo}>
            Agregar
          </Button>
        </Box>

        {/* Pendientes a enviar */}
        {pendientes.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Pendientes
            </Typography>
            <TableContainer>
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell>Vehículo</TableCell>
                    <TableCell>Material</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha movimiento</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendientes.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{p._view.vehiculoLabel}</TableCell>
                      <TableCell>{p._view.nombre}</TableCell>
                      <TableCell align="right">{p._view.cantidad}</TableCell>
                      <TableCell>{p._view.dadoDeBaja ? "Baja" : "Uso"}</TableCell>
                      <TableCell>{fmtFecha(p._view.fecha)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box textAlign="right" mt={1}>
              <Button startIcon={<Inventory2 />} variant="contained" onClick={sendLote}>
                Registrar lote
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Tabla de usos registrados */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 1,
            mb: 1,
          }}
        >
          <TextField
            size="small"
            label="Buscar por material"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: "100%", sm: 280 } }}
          />
        </Box>

        <TableContainer>
          <Table size={isMobile ? "small" : "medium"}>
            <TableHead>
              <TableRow>
                <TableCell>Material</TableCell>
                <TableCell>Vehículo</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell>Descargo</TableCell>
                <TableCell>Fecha movimiento</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageItems.map((r) => (
                <TableRow key={r.idemergenciainventario || r.idEmergenciaInventario || `${r.iditem}-${r.idvehiculo}`}>
                  <TableCell>{r.nombre ?? "-"}</TableCell>
                  <TableCell>
                    {r.placa ? `${r.placa} — ${r.marca ?? ""} ${r.modelo ?? ""}` : "—"}
                  </TableCell>
                  <TableCell align="right">{r.cantidadusada ?? r.cantidadUsada ?? 0}</TableCell>
                  <TableCell>{(r.dadodebaja ?? r.dadoDeBaja) ? "Sí" : "No"}</TableCell>
                  <TableCell>{fmtFecha(r.fechamovimiento ?? r.fechaMovimiento)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Eliminar">
                      <IconButton color="error" onClick={() => removeUso(r)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Sin registros
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box display="flex" justifyContent="center">
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 20]}
          />
        </Box>
      </Paper>
    </>
  );

  // ====== Render condicional: página vs modal ======
  if (embedded) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="lg"
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Inventory2 fontSize="small" />
            <Typography variant="h6">Inventario — Emergencia #{idEmergencia}</Typography>
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

  // Página completa (sin cambios de ruta/servicios)
  return (
    <LayoutDashboard>
      {Content}
    </LayoutDashboard>
  );
}
