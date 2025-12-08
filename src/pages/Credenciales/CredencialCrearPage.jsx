// src/pages/Credenciales/CredencialCrearPage.jsx
import {
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Autocomplete,
} from "@mui/material";
import { useEffect, useMemo, useState, forwardRef } from "react";
import Swal from "sweetalert2";
import { crearCredencial } from "../../services/credenciales.service";
import { listarPersonal } from "../../services/personal.service";
import { resolveFileUrl } from "../../utils/files";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function nextYearISO() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

// Normaliza cualquier forma de respuesta del personal SIN cambiar el servicio
function normalizePersonal(resp) {
  if (Array.isArray(resp)) return resp;
  if (resp && Array.isArray(resp.data)) return resp.data;
  if (resp && Array.isArray(resp.rows)) return resp.rows;
  if (resp && Array.isArray(resp.result)) return resp.result;
  if (resp?.data && Array.isArray(resp.data.rows)) return resp.data.rows;
  return [];
}

/**
 * Modal de creación de credencial
 * Props:
 *  open: boolean
 *  onClose: function
 *  onSuccess: function (opcional)
 */
export default function CredencialCrearPage({ open, onClose, onSuccess }) {
  // Autocomplete (catálogo de personal)
  const [todos, setTodos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [sel, setSel] = useState(null);

  // Form
  const [fi, setFi] = useState(todayISO());
  const [ff, setFf] = useState(nextYearISO());
  const [creando, setCreando] = useState(false);

  // Carga inicial de personal (una vez)
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setCargando(true);
        const resp = await listarPersonal({ limit: 9999 });
        const arr = normalizePersonal(resp);
        setTodos(arr);
      } catch (err) {
        const msg = err?.response?.data?.error || err?.message || "No se pudo cargar personal";
        console.error("Listar personal error:", err);
        Swal.fire("Error", msg, "error");
      } finally {
        setCargando(false);
      }
    })();
  }, [open]);

  // Filtrado en cliente
  const opciones = useMemo(() => {
    const q = (busqueda || "").trim().toLowerCase();
    if (!q) return todos;
    return (todos || []).filter((p) => {
      const tokens = [p?.nombre, p?.apellido, p?.ci, p?.grado_nombre, p?.clase_etiqueta]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");
      return tokens.includes(q);
    });
  }, [todos, busqueda]);

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    if (!sel) {
      return Swal.fire("Valida", "Selecciona una persona", "info");
    }
    setCreando(true);
    try {
      const resp = await crearCredencial({
        idPersonal: sel.idpersonal,
        fechaInicio: fi,
        fechaFin: ff,
      });
      Swal.fire("Éxito", "Credencial creada", "success");
      if (resp?.pdfUrl) window.open(resolveFileUrl(resp.pdfUrl), "_blank");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "No se pudo crear la credencial";
      console.error("Crear credencial error:", err);
      Swal.fire("Error", msg, "error");
    } finally {
      setCreando(false);
    }
  };

  // Comparación correcta de opciones
  const isOptionEqualToValue = (opt, val) =>
    String(opt?.idpersonal) === String(val?.idpersonal);

  const getOptionLabel = (o) =>
    `${o?.nombre || ""} ${o?.apellido || ""} — ${o?.ci || ""}`.trim();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      TransitionComponent={Transition}
      keepMounted
    >
      <DialogTitle fontWeight={700}>Nueva Credencial</DialogTitle>

      <DialogContent dividers sx={{ backgroundColor: "#fff" }}>
        <Box component="form" onSubmit={onSubmit} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                size="medium"
                options={opciones}
                loading={cargando}
                value={sel}
                onChange={(_, v) => setSel(v)}
                isOptionEqualToValue={isOptionEqualToValue}
                getOptionLabel={getOptionLabel}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="medium"
                    label="Seleccionar personal"
                    placeholder="Nombre, apellido o CI..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {cargando ? <CircularProgress color="inherit" size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="medium"
                label="Fecha inicio vigencia"
                type="date"
                value={fi}
                onChange={(e) => setFi(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="medium"
                label="Fecha fin vigencia"
                type="date"
                value={ff}
                onChange={(e) => setFf(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "flex-end", p: 2 }}>
        <Button onClick={onClose} variant="outlined" disabled={creando}>
          Cancelar
        </Button>
        <Button
          type="submit"
          onClick={onSubmit}
          variant="contained"
          disabled={creando || cargando}
        >
          {creando ? "Generando..." : "Generar Credencial"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
