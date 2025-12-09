// src/pages/emergencias/EmergenciaDetallePage.jsx
// ✅ Versión de solo lectura basada en EmergenciaEditarPage
// ✅ Mismo diseño visual y estructura, sin botones de edición ni envío
// ✅ Totalmente responsiva y consistente con el resto del módulo

import {
  Typography, Paper, TextField, Box, Button,
  FormControl, InputLabel, Select, MenuItem, Chip, Stack,
  CircularProgress
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  obtenerEmergencia, listarTiposEmergencia, listarDescripciones
} from "../../services/emergencias.service";
import MapPicker from "../../components/MapPicker";

const ESTADOS = ["Pendiente", "En curso", "Finalizada"];

export default function EmergenciaDetallePage() {
  const { id } = useParams();
  const idNum = Number(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [tiposRaw, setTiposRaw] = useState([]);
  const [descsRaw, setDescsRaw] = useState([]);

  const tipos = useMemo(() => (tiposRaw || []).map((t) => ({
    idStr: (t.idtipoemergencia ?? t.idtipo ?? t.idTipoEmergencia ?? t.id ?? "").toString(),
    label: t.nombre ?? t.label ?? t.descripcion ?? "",
  })).filter(x => x.idStr || x.label), [tiposRaw]);

  const descs = useMemo(() => (descsRaw || []).map((d) => ({
    id: d.iddescripcionemergencia ?? d.iddescripcion ?? d.idDescripcion ?? d.id ?? null,
    label: d.texto ?? d.descripcion ?? d.nombre ?? "",
  })).filter(x => x.id !== null || x.label), [descsRaw]);

  useEffect(() => {
    (async () => {
      try {
        const [ts, e] = await Promise.all([
          listarTiposEmergencia(),
          obtenerEmergencia(idNum),
        ]);
        setTiposRaw(ts || []);
        if (!e) {
          await Swal.fire("Aviso", "Emergencia no encontrada", "warning");
          navigate("/emergencias");
          return;
        }
        setData(e);
      } catch (err) {
        const msg = err?.response?.data?.mensaje || err?.message || "No se pudo cargar la emergencia";
        await Swal.fire("Error", msg, "error");
        navigate("/emergencias");
      } finally {
        setLoading(false);
      }
    })();
  }, [idNum, navigate]);

  useEffect(() => {
    if (!data?.idtipoemergencia && !data?.idTipoEmergencia) return;
    (async () => {
      try {
        const rs = await listarDescripciones({ typeId: data.idtipoemergencia ?? data.idTipoEmergencia });
        setDescsRaw(rs || []);
      } catch { }
    })();
  }, [data]);

  if (loading) {
    return (
      <LayoutDashboard>
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 280 }}>
          <CircularProgress />
        </Box>
      </LayoutDashboard>
    );
  }

  if (!data) {
    return (
      <LayoutDashboard>
        <Typography variant="h6">Emergencia no encontrada</Typography>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard>
      <Typography variant="h5" mb={2}>
        Detalle de emergencia #{idNum}
        <Chip label={data.estado || "—"} size="small" sx={{ ml: 1 }} />
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          {/* Tipo */}
          <FormControl fullWidth>
            <InputLabel shrink>Tipo</InputLabel>
            <Select
              value={(data.idtipoemergencia ?? data.idTipoEmergencia ?? "").toString()}
              displayEmpty
              disabled
            >
              <MenuItem value=""><em>—</em></MenuItem>
              {tipos.map((t) => (
                <MenuItem key={t.idStr} value={t.idStr}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Estado */}
          <TextField
            label="Estado"
            value={data.estado ?? ""}
            fullWidth
            select
            SelectProps={{ native: true }}
            InputProps={{ readOnly: true }}
          >
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </TextField>

          {/* Catálogo */}
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Catálogo de descripciones</Typography>
            <Paper variant="outlined" sx={{ p: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {(data.descripcioncatalogo ?? data.descripcionCatalogo ?? "")
                .split(",")
                .map((txt, i) => (
                  <Chip key={i} label={txt.trim()} />
                ))}
              {!data.descripcionCatalogo && <em style={{ color: "#666" }}>Sin descripciones registradas</em>}
            </Paper>
          </Box>

          {/* Descripción */}
          <TextField
            label="Descripción libre"
            fullWidth
            multiline
            minRows={3}
            value={data.descripcion ?? ""}
            InputProps={{ readOnly: true }}
            sx={{ gridColumn: "1 / -1" }}
          />

          {/* Ubicación */}
          <TextField
            label="Dirección / referencia"
            fullWidth
            value={data.direcciontexto ?? data.direccionTexto ?? ""}
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Ubicación (texto opcional)"
            fullWidth
            value={data.ubicacion ?? ""}
            InputProps={{ readOnly: true }}
          />

          {/* Mapa */}
          <Box sx={{ gridColumn: "1 / -1" }}>
            <MapPicker
              lat={data.lat}
              lng={data.lng}
              readOnly={true}
            />
          </Box>

          {/* Fecha */}
          <TextField
            label="Fecha y hora"
            type="datetime-local"
            value={data.fechahora ? new Date(data.fechahora).toISOString().slice(0, 16) : ""}
            fullWidth
            InputProps={{ readOnly: true }}
          />

          {/* Control de Tiempos - Fechas Inicio/Fin */}
          <Box sx={{ gridColumn: "1 / -1", mt: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              ⏱️ Control de Tiempos
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              {/* Fecha Inicio */}
              <Box>
                <TextField
                  label="Fecha Inicio"
                  type="datetime-local"
                  fullWidth
                  value={data.fechainicio ? new Date(data.fechainicio).toISOString().slice(0, 16) : ""}
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                />
                {!data.fechainicio && (
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={async () => {
                      const ok = await Swal.fire({
                        title: "¿Marcar fecha de inicio?",
                        text: "Se registrará la fecha y hora actual",
                        icon: "question",
                        showCancelButton: true,
                      });
                      if (!ok.isConfirmed) return;
                      try {
                        const res = await marcarFechaInicio(idNum);
                        setData({ ...data, fechainicio: res.emergencia.fechainicio });
                        Swal.fire("Listo", "Fecha marcada", "success");
                      } catch (err) {
                        Swal.fire("Error", err?.response?.data?.mensaje || "Error", "error");
                      }
                    }}
                  >
                    Marcar Ahora
                  </Button>
                )}
                {data.fechainicio && <Chip label="Marcada" size="small" color="success" sx={{ mt: 1 }} />}
              </Box>

              {/* Fecha Fin */}
              <Box>
                <TextField
                  label="Fecha Fin"
                  type="datetime-local"
                  fullWidth
                  value={data.fechafin ? new Date(data.fechafin).toISOString().slice(0, 16) : ""}
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                  disabled={!data.fechainicio}
                />
                {!data.fechafin && data.fechainicio && (
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={async () => {
                      const ok = await Swal.fire({
                        title: "¿Marcar fecha de fin?",
                        text: "Se registrará la fecha y hora actual",
                        icon: "question",
                        showCancelButton: true,
                      });
                      if (!ok.isConfirmed) return;
                      try {
                        const res = await marcarFechaFin(idNum);
                        setData({ ...data, fechafin: res.emergencia.fechafin });
                        Swal.fire("Listo", "Fecha marcada", "success");
                      } catch (err) {
                        Swal.fire("Error", err?.response?.data?.mensaje || "Error", "error");
                      }
                    }}
                  >
                    Marcar Ahora
                  </Button>
                )}
                {data.fechafin && <Chip label="Finalizada" size="small" color="success" sx={{ mt: 1 }} />}
                {!data.fechainicio && (
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Marca fecha de inicio primero
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Documento */}
          <Box sx={{ gridColumn: "1 / -1", mt: 1 }}>
            <Typography variant="subtitle2">Documento de solvencia:</Typography>
            {data.documentoSolvencia ? (
              <a
                href={data.documentoSolvencia}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#1976d2", textDecoration: "underline" }}
              >
                Ver documento
              </a>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No se adjuntó ningún documento
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </LayoutDashboard>
  );
}
