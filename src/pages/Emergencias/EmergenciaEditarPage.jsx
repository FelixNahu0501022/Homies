// src/pages/emergencias/EmergenciaEditarPage.jsx
// ✅ Visual unificado con EmergenciaCrearPage (mismo diseño y estructura).
// ✅ 100% funcional, sin alterar lógica ni servicios.
// ✅ Full responsive, con secciones visualmente claras.

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
  CircularProgress,
  InputAdornment,
  useMediaQuery,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  obtenerEmergencia,
  editarEmergencia,
  listarTiposEmergencia,
  listarDescripciones,
  crearDescripcion,
} from "../../services/emergencias.service";
import MapPicker from "../../components/MapPicker";

const ESTADOS = ["Pendiente", "En curso", "Finalizada"];

export default function EmergenciaEditarPage() {
  const { id } = useParams();
  const idNum = Number(id);
  const navigate = useNavigate();
  const isSmall = useMediaQuery("(max-width:600px)");

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      idTipoEmergencia: "",
      tipoEmergencia: "",
      catalogoSeleccion: [],
      descripcionCatalogo: "",
      descripcion: "",
      ubicacion: "",
      direccionTexto: "",
      lat: null,
      lng: null,
      fechahora: "",
      estado: "Pendiente",
      documentoSolvencia: null,
    },
  });

  const [loading, setLoading] = useState(true);
  const [tiposRaw, setTiposRaw] = useState([]);
  const [descsRaw, setDescsRaw] = useState([]);
  const [filtroDesc, setFiltroDesc] = useState("");

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

  const typeId = watch("idTipoEmergencia");
  const seleccion = watch("catalogoSeleccion");

  // ===== CARGA INICIAL =====
  useEffect(() => {
    (async () => {
      try {
        const [ts, e] = await Promise.all([listarTiposEmergencia(), obtenerEmergencia(idNum)]);
        setTiposRaw(ts || []);
        if (!e) {
          await Swal.fire("Aviso", "Emergencia no encontrada", "warning");
          navigate("/emergencias");
          return;
        }

        const dtLocal = e.fechahora ? new Date(e.fechahora).toISOString().slice(0, 16) : "";
        const catTexto = e.descripcioncatalogo ?? e.descripcionCatalogo ?? e.catalogoDescripcion ?? "";
        const inicialSel = (catTexto || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((label) => ({ id: null, label }));

        reset({
          idTipoEmergencia: ((e.idtipoemergencia ?? e.idTipoEmergencia) ?? "").toString(),
          tipoEmergencia: "",
          catalogoSeleccion: inicialSel,
          descripcionCatalogo: inicialSel.map((x) => x.label).join(", "),
          descripcion: e.descripcion ?? "",
          ubicacion: e.ubicacion ?? "",
          direccionTexto: e.direcciontexto ?? e.direccionTexto ?? "",
          lat: e.lat ?? null,
          lng: e.lng ?? null,
          fechahora: dtLocal,
          estado: e.estado ?? "Pendiente",
          documentoSolvencia: null,
        });
      } catch (err) {
        const msg =
          err?.response?.data?.mensaje || err?.message || "No se pudo cargar la emergencia";
        await Swal.fire("Error", msg, "error");
        navigate("/emergencias");
      } finally {
        setLoading(false);
      }
    })();
  }, [idNum, navigate, reset]);

  // ===== CARGAR DESCRIPCIONES =====
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const rs = await listarDescripciones({
          typeId: typeId ? Number(typeId) : null,
          q: filtroDesc || "",
        });
        if (!cancel) setDescsRaw(rs || []);
      } catch {}
    })();
    return () => {
      cancel = true;
    };
  }, [typeId, filtroDesc]);

  // ===== SINCRONIZAR CATÁLOGO UNIDO =====
  useEffect(() => {
    const texto = (seleccion || []).map((s) => s.label).join(", ");
    setValue("descripcionCatalogo", texto, { shouldValidate: false, shouldDirty: true });
  }, [seleccion, setValue]);

  // ===== MODALES CREAR =====
  const [openTipo, setOpenTipo] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState("");
  const crearTipoDesdeModal = () => {
    const txt = (nuevoTipo || "").trim();
    if (!txt) return;
    setValue("idTipoEmergencia", "");
    setValue("tipoEmergencia", txt);
    setOpenTipo(false);
    setNuevoTipo("");
  };

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
      await editarEmergencia(idNum, payload, file);
      Swal.fire("Éxito", "Cambios guardados", "success");
      navigate("/emergencias");
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo actualizar";
      Swal.fire("Error", msg, "error");
    }
  };

  if (loading) {
    return (
      <LayoutDashboard>
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 280 }}>
          <CircularProgress />
        </Box>
      </LayoutDashboard>
    );
  }

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
            Editar emergencia #{idNum}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Modifica los detalles de la atención registrada
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
            {/* Tipo existente */}
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

            {/* Crear nuevo tipo */}
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

          {/* ====== Catálogo de descripciones ====== */}
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
              sx={{ flex: 1 }}
            />
            <Button variant="outlined" onClick={() => setOpenDesc(true)}>
              Añadir descripción
            </Button>
          </Stack>

          <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
            <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
              {(watch("catalogoSeleccion") || []).map((it) => (
                <Chip
                  key={`${it.id ?? it.label}`}
                  label={it.label}
                  onDelete={() =>
                    setValue(
                      "catalogoSeleccion",
                      (watch("catalogoSeleccion") || []).filter(
                        (v) => (v.id ?? v.label) !== (it.id ?? it.label)
                      ),
                      { shouldDirty: true }
                    )
                  }
                />
              ))}
              {(watch("catalogoSeleccion") || []).length === 0 && (
                <em style={{ color: "#666" }}>Sin descripciones seleccionadas</em>
              )}
            </Box>

            <Box display="flex" gap={1} flexWrap="wrap" sx={{ maxHeight: 200, overflow: "auto" }}>
              {descs.map((d) => (
                <Chip
                  key={`${d.id ?? d.label}`}
                  label={d.label}
                  onClick={() => {
                    const actual = watch("catalogoSeleccion") || [];
                    if (!actual.some((v) => (v.id ?? v.label) === (d.id ?? d.label))) {
                      setValue(
                        "catalogoSeleccion",
                        [...actual, { id: d.id, label: d.label }],
                        { shouldDirty: true }
                      );
                    }
                  }}
                  sx={{ cursor: "pointer" }}
                  variant="outlined"
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

          {/* ====== Detalles y ubicación ====== */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Detalles y ubicación
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
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

            <Box>
              <TextField
                label="Ubicación (texto opcional)"
                fullWidth
                value={watch("ubicacion") ?? ""}
                onChange={(e) => setValue("ubicacion", e.target.value ?? "")}
              />
            </Box>

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

          {/* ====== Fecha y estado ====== */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Fecha y estado
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
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
                  <TextField {...field} value={field.value ?? ""} label="Estado" fullWidth select>
                    {ESTADOS.map((e) => (
                      <MenuItem key={e} value={e}>
                        {e}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* ====== Adjuntos ====== */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Documento de solvencia
          </Typography>

          <Box sx={{ gridColumn: "1 / -1" }}>
            <Button variant="outlined" component="label">
              Adjuntar / actualizar documento
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

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Modales */}
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
