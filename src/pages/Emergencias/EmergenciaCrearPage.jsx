// src/pages/emergencias/EmergenciaCrearPage.jsx
// ✅ Sin Grid2: layout con <Box> (CSS grid) compatible con cualquier versión de MUI.
// ✅ idTipoEmergencia usa '' (string vacío) para evitar "out-of-range" y null en Select.
// ✅ TextFields/Selects siempre reciben string/number (no null/undefined).
// ✅ Catálogo multi, filtro independiente y creación inline.
// ✅ Estilo visual moderno, secciones claras y full responsive (sin cambiar lógica ni servicios).

import {
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  InputAdornment,
  useMediaQuery,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  crearEmergencia,
  listarTiposEmergencia,
  listarDescripciones,
  crearDescripcion,
} from "../../services/emergencias.service";
import MapPicker from "../../components/MapPicker";
import { Search } from "@mui/icons-material";

const ESTADOS = ["Pendiente", "En curso", "Finalizada"];

export default function EmergenciaCrearPage() {
  const navigate = useNavigate();
  const isSmall = useMediaQuery("(max-width:600px)");

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      idTipoEmergencia: "", // 👈 string vacío (no null)
      tipoEmergencia: "",
      catalogoSeleccion: [], // [{id,label}]
      descripcionCatalogo: "",
      descripcion: "",
      ubicacion: "",
      direccionTexto: "",
      lat: null,
      lng: null,
      fechahora: new Date().toISOString().slice(0, 16),
      estado: "Pendiente",
      documentoSolvencia: null,
    },
  });

  // Estado local
  const [tiposRaw, setTiposRaw] = useState([]);
  const [descsRaw, setDescsRaw] = useState([]);

  // Normalizadores
  const tipos = useMemo(
    () =>
      (tiposRaw || [])
        .map((t) => ({
          idStr: (t.idtipoemergencia ?? t.idtipo ?? t.idTipoEmergencia ?? t.id ?? "").toString(),
          label: t.nombre ?? t.label ?? t.descripcion ?? "",
        }))
        .filter((x) => x.idStr || x.label),
    [tiposRaw]
  );

  const descs = useMemo(
    () =>
      (descsRaw || [])
        .map((d) => ({
          id: d.iddescripcionemergencia ?? d.iddescripcion ?? d.idDescripcion ?? d.id ?? null,
          label: d.texto ?? d.descripcion ?? d.nombre ?? "",
        }))
        .filter((x) => x.id !== null || x.label),
    [descsRaw]
  );

  // Watches
  const typeId = watch("idTipoEmergencia");
  const seleccion = watch("catalogoSeleccion");

  // Filtro independiente del catálogo
  const [filtroDesc, setFiltroDesc] = useState("");

  // Carga de tipos
  useEffect(() => {
    (async () => {
      try {
        const ts = await listarTiposEmergencia();
        setTiposRaw(ts || []);
      } catch {
        Swal.fire("Error", "No se pudieron cargar los tipos", "error");
      }
    })();
  }, []);

  // Cargar descripciones según tipo + filtro
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const rs = await listarDescripciones({
          typeId: typeId ? Number(typeId) : null,
          q: filtroDesc || "",
        });
        if (!cancel) setDescsRaw(rs || []);
      } catch {
        // silencioso: UI sigue operativa
      }
    })();
    return () => {
      cancel = true;
    };
  }, [typeId, filtroDesc]);

  // Mantener SOLO texto unido de catálogo
  useEffect(() => {
    const texto = (seleccion || []).map((s) => s.label).join(", ");
    setValue("descripcionCatalogo", texto, { shouldValidate: false, shouldDirty: true });
  }, [seleccion, setValue]);

  // Crear nuevo tipo (inline)
  const [openTipo, setOpenTipo] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState("");
  const crearTipoDesdeModal = () => {
    const txt = (nuevoTipo || "").trim();
    if (!txt) return;
    setValue("idTipoEmergencia", ""); // 👈 limpiar select (no null)
    setValue("tipoEmergencia", txt);
    setOpenTipo(false);
    setNuevoTipo("");
  };

  // Crear nueva descripción catálogo (inline)
  const [openDesc, setOpenDesc] = useState(false);
  const [nuevaDesc, setNuevaDesc] = useState("");
  const crearDescDesdeModal = async () => {
    const txt = (nuevaDesc || filtroDesc || "").trim();
    if (!txt) return;
    try {
      const created = await crearDescripcion({
        texto: txt,
        idTipoEmergencia: typeId ? Number(typeId) : null,
      });
      const item = {
        id: created.iddescripcion ?? created.idDescripcion ?? created.id ?? null,
        label: created.texto ?? txt,
      };
      setDescsRaw((prev) => [created, ...(prev || [])]);
      const actual = watch("catalogoSeleccion") || [];
      setValue("catalogoSeleccion", [...actual, item], { shouldDirty: true });
      setOpenDesc(false);
      setNuevaDesc("");
      Swal.fire("Listo", "Descripción agregada al catálogo", "success");
    } catch {
      Swal.fire("Error", "No se pudo crear la descripción", "error");
    }
  };

  // Helpers multi
  const isSel = (id) =>
    (watch("catalogoSeleccion") || []).some((v) => v.id != null && Number(v.id) === Number(id));
  const addSel = (item) =>
    setValue(
      "catalogoSeleccion",
      [...(watch("catalogoSeleccion") || []), { id: item.id, label: item.label }],
      { shouldDirty: true }
    );
  const rmSel = (id) =>
    setValue(
      "catalogoSeleccion",
      (watch("catalogoSeleccion") || []).filter((v) => Number(v.id) !== Number(id)),
      { shouldDirty: true }
    );
  const toggleSel = (item) => (isSel(item.id) ? rmSel(item.id) : addSel(item));

  const onSubmit = async (form) => {
    try {
      const payload = {
        idTipoEmergencia: form.idTipoEmergencia ? Number(form.idTipoEmergencia) : undefined,
        tipoEmergencia: form.idTipoEmergencia ? undefined : form.tipoEmergencia || undefined,
        descripcionCatalogo: (form.catalogoSeleccion || []).map((x) => x.label).join(", "),
        descripcion: form.descripcion || undefined,
        ubicacion: form.ubicacion || undefined,
        direccionTexto: form.direccionTexto || undefined,
        lat: form.lat ?? undefined,
        lng: form.lng ?? undefined,
        fechahora: form.fechahora || undefined,
        estado: form.estado || undefined,
      };
      const file = form.documentoSolvencia instanceof File ? form.documentoSolvencia : null;
      await crearEmergencia(payload, file);
      Swal.fire("Éxito", "Emergencia creada", "success");
      navigate("/emergencias");
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo crear la emergencia";
      Swal.fire("Error", msg, "error");
    }
  };

  return (
    <LayoutDashboard>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Nueva emergencia
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Registra una atención con detalles de tipo, ubicación y estado
          </Typography>
        </Box>
      </Box>

      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          mt: 2,
          borderRadius: 3,
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* ====== Sección: Tipo ====== */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Tipo de emergencia
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
              mb: 2,
            }}
          >
            {/* Tipo (select) */}
            <Box>
              <FormControl fullWidth error={!!errors.idTipoEmergencia}>
                <InputLabel>Tipo</InputLabel>
                <Controller
                  name="idTipoEmergencia"
                  control={control}
                  rules={{
                    validate: (v) =>
                      (v !== "" || watch("tipoEmergencia")) || "El tipo es obligatorio",
                  }}
                  render={({ field }) => (
                    <Select {...field} label="Tipo" value={field.value ?? ""}>
                      <MenuItem value="">
                        <em>— Selecciona —</em>
                      </MenuItem>
                      {tipos.map((t) => (
                        <MenuItem key={t.idStr || t.label} value={t.idStr}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                <FormHelperText>{errors.idTipoEmergencia?.message}</FormHelperText>
              </FormControl>
            </Box>

            {/* Crear tipo (inline) */}
            <Box>
              <Box display="flex" gap={1} flexWrap="wrap">
                <TextField
                  label="Crear nuevo tipo (opcional)"
                  fullWidth
                  value={watch("tipoEmergencia") ?? ""}
                  onChange={(e) => setValue("tipoEmergencia", e.target.value ?? "")}
                />
                <Button variant="outlined" onClick={() => setOpenTipo(true)}>
                  Crear
                </Button>
              </Box>
              <FormHelperText>
                Si escribes un tipo nuevo, no es necesario seleccionar uno existente.
              </FormHelperText>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* ====== Sección: Catálogo de descripciones ====== */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Catálogo de descripciones
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ mb: 1 }}
          >
            <TextField
              label="Filtrar catálogo"
              value={filtroDesc}
              onChange={(e) => setFiltroDesc(e.target.value ?? "")}
              size={isSmall ? "small" : "medium"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: { xs: "100%", sm: 260 }, flex: 1 }}
            />
            <Button variant="outlined" onClick={() => setOpenDesc(true)}>
              Añadir descripción
            </Button>
          </Stack>

          <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
            {/* Seleccionadas */}
            <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
              {(watch("catalogoSeleccion") || []).map((it) => (
                <Chip
                  key={`${it.id ?? it.label}`}
                  label={it.label}
                  onDelete={() => rmSel(it.id)}
                />
              ))}
              {(watch("catalogoSeleccion") || []).length === 0 && (
                <em style={{ color: "#666" }}>Sin descripciones seleccionadas</em>
              )}
            </Box>

            {/* Listado filtrado */}
            <Box
              display="flex"
              gap={1}
              flexWrap="wrap"
              sx={{ maxHeight: 200, overflow: "auto" }}
            >
              {descs.map((d) => (
                <Chip
                  key={`${d.id ?? d.label}`}
                  label={d.label}
                  color={isSel(d.id) ? "primary" : "default"}
                  variant={isSel(d.id) ? "filled" : "outlined"}
                  onClick={() => toggleSel(d)}
                  sx={{ cursor: "pointer" }}
                />
              ))}
            </Box>
          </Paper>

          <TextField
            label="Catálogo (unido)"
            fullWidth
            value={(watch("catalogoSeleccion") || []).map((s) => s.label).join(", ")}
            margin="normal"
            InputProps={{ readOnly: true }}
          />

          <Divider sx={{ my: 2 }} />

          {/* ====== Sección: Detalles y ubicación ====== */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Detalles y ubicación
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
              mb: 2,
            }}
          >
            {/* Descripción libre (2 col) */}
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    label="Descripción (libre, opcional)"
                    fullWidth
                    multiline
                    minRows={3}
                  />
                )}
              />
            </Box>

            {/* Dirección / referencia */}
            <Box>
              <Controller
                name="direccionTexto"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    label="Dirección / referencia"
                    fullWidth
                  />
                )}
              />
            </Box>

            {/* Ubicación (texto opcional) */}
            <Box>
              <TextField
                label="Ubicación (texto opcional)"
                fullWidth
                value={watch("ubicacion") ?? ""}
                onChange={(e) => setValue("ubicacion", e.target.value ?? "")}
              />
            </Box>

            {/* Mapa (2 col) */}
            <Box sx={{ gridColumn: "1 / -1" }}>
              <MapPicker
                lat={watch("lat")}
                lng={watch("lng")}
                onChange={({ lat, lng, address }) => {
                  setValue("lat", lat, { shouldDirty: true });
                  setValue("lng", lng, { shouldDirty: true });
                  if (!(watch("direccionTexto") ?? ""))
                    setValue("direccionTexto", address || "", { shouldDirty: true });
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* ====== Sección: Fecha y estado ====== */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Fecha y estado
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
              mb: 2,
            }}
          >
            <Box>
              <Controller
                name="fechahora"
                control={control}
                rules={{ required: "Fecha y hora son obligatorias" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    label="Fecha y hora"
                    type="datetime-local"
                    fullWidth
                    error={!!errors.fechahora}
                    helperText={errors.fechahora?.message}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    label="Estado"
                    fullWidth
                    select
                    SelectProps={{ native: true }}
                  >
                    {ESTADOS.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </TextField>
                )}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* ====== Sección: Adjuntos ====== */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Adjuntos
          </Typography>

          <Box sx={{ gridColumn: "1 / -1" }}>
            <Button variant="outlined" component="label">
              Adjuntar documento de solvencia (opcional)
              <input
                type="file"
                hidden
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setValue("documentoSolvencia", f, { shouldValidate: true });
                }}
              />
            </Button>
            <Box sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }}>
              {watch("documentoSolvencia") instanceof File
                ? `Archivo: ${watch("documentoSolvencia").name}`
                : "Ningún archivo seleccionado"}
            </Box>
          </Box>

          {/* Submit */}
          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Crear emergencia"}
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Modal crear Tipo */}
      <Dialog open={openTipo} onClose={() => setOpenTipo(false)} fullWidth maxWidth="sm">
        <DialogTitle>Crear nuevo tipo</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Nombre del tipo"
            fullWidth
            value={nuevoTipo}
            onChange={(e) => setNuevoTipo(e.target.value ?? "")}
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTipo(false)}>Cancelar</Button>
          <Button onClick={crearTipoDesdeModal} variant="contained">
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal crear descripción de catálogo */}
      <Dialog open={openDesc} onClose={() => setOpenDesc(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nueva descripción de catálogo</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Texto de la descripción"
            fullWidth
            value={nuevaDesc}
            onChange={(e) => setNuevaDesc(e.target.value ?? "")}
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDesc(false)}>Cancelar</Button>
          <Button onClick={crearDescDesdeModal} variant="contained">
            Añadir
          </Button>
        </DialogActions>
      </Dialog>
    </LayoutDashboard>
  );
}
