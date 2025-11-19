import {
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  MenuItem,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Divider,
  FormControlLabel,
  Switch,
  Stack,
  useMediaQuery,
} from "@mui/material";
import { Add as AddIcon, HelpOutline } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import Autocomplete from "@mui/material/Autocomplete";
import { useTheme } from "@mui/material/styles";

import {
  obtenerDonativo,
  editarDonativo,
  listarTiposDonativo,
  crearTipoDonativo,
  listarDonantes,
  crearDonante,
  listarDonantesPorDonativo,
} from "../../services/donativos.service";

import {
  obtenerItem,
  editarItem,
  listarCategorias,
  listarUnidades,
  listarUbicaciones,
  listarProveedores,
  listarAtributosCategoria,
} from "../../services/inventario.service";

const ESTADOS = ["Pendiente", "Aprobado", "Rechazado"];

export default function DonativoEditarPage({ onClose, onSuccess, embedded = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { id } = useParams();
  const idNum = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      idtipodonativo: "",
      tipo: "",
      descripcion: "",
      cantidad: "",
      fecha: "",
      estado: "Pendiente",
      idDonante: "",
      idItem: "",
    },
  });

  const idtipodonativo = watch("idtipodonativo");

  /* ========== Tipos ========== */
  const [tipos, setTipos] = useState([]);
  const cargarTipos = async () => {
    const data = await listarTiposDonativo(true);
    setTipos(Array.isArray(data) ? data : []);
  };

  /* ========== Donantes (autocomplete + modal) ========== */
  const [donantes, setDonantes] = useState([]);
  const [donanteSel, setDonanteSel] = useState(null);
  const [donQ, setDonQ] = useState("");

  const cargarDonantes = async (q = "") => {
    try {
      const data = await listarDonantes({ q, activo: true, limit: 20, offset: 0 });
      const list = Array.isArray(data) ? data : [];
      setDonantes(list);
      return list;
    } catch (e) {
      console.error(e);
      setDonantes([]);
      return [];
    }
  };
  useEffect(() => {
    cargarDonantes();
  }, []);

  // Modal crear Donante
  const [openDon, setOpenDon] = useState(false);
  const [nuevoDon, setNuevoDon] = useState({
    tipo: "PERSONA",
    nombres: "",
    apellidos: "",
    razon_social: "",
    documento_tipo: "",
    documento_numero: "",
    email: "",
    telefono: "",
    direccion: "",
  });
  const abrirModalDon = () => setOpenDon(true);
  const cerrarModalDon = () => {
    setOpenDon(false);
    setNuevoDon({
      tipo: "PERSONA",
      nombres: "",
      apellidos: "",
      razon_social: "",
      documento_tipo: "",
      documento_numero: "",
      email: "",
      telefono: "",
      direccion: "",
    });
  };
  const crearDonanteRapido = async () => {
    try {
      const body = { ...nuevoDon };
      if (body.tipo === "PERSONA" && !String(body.nombres || "").trim()) {
        return Swal.fire("Valida", "Nombres es obligatorio para PERSONA", "info");
      }
      if (body.tipo === "INSTITUCION" && !String(body.razon_social || "").trim()) {
        return Swal.fire("Valida", "Razón social es obligatoria para INSTITUCION", "info");
      }
      const resp = await crearDonante(body);
      const d = resp?.donante;
      if (d?.iddonante) {
        const list = await cargarDonantes(d.razon_social || d.nombres || "");
        const found = list.find((x) => String(x.iddonante) === String(d.iddonante));
        if (found) setDonanteSel(found);
        setValue("idDonante", d.iddonante);
        cerrarModalDon();
        Swal.fire("Listo", "Donante creado", "success");
      } else {
        Swal.fire("Atención", "No se pudo crear el donante", "warning");
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "No se pudo crear el donante";
      Swal.fire("Error", msg, "error");
    }
  };

  /* ========== Inventario (para MATERIAL) ========== */
  const [cats, setCats] = useState([]);
  const [unis, setUnis] = useState([]);
  const [ubis, setUbis] = useState([]);
  const [provs, setProvs] = useState([]);
  const [attrsCat, setAttrsCat] = useState([]);

  const [invData, setInvData] = useState({
    nombre: "",
    descripcion: "",
    idCategoria: "",
    idUnidad: "",
    idUbicacion: "",
    idProveedor: "",
    especificaciones: {},
  });
  const [selectedSpecs, setSelectedSpecs] = useState({});
  const [manualSpec, setManualSpec] = useState({ key: "", value: "" });

  const specKey = (attrOrName) => String(attrOrName?.nombre || attrOrName || "").trim().toLowerCase();

  const removeManualSpec = (key) => {
    setInvData((p) => {
      const next = { ...(p.especificaciones || {}) };
      delete next[key];
      return { ...p, especificaciones: next };
    });
    setSelectedSpecs((p) => {
      const next = { ...p };
      delete next[key];
      return next;
    });
  };

  const cargarCatalogosInventario = async () => {
    try {
      const [c, u, b, p] = await Promise.all([
        listarCategorias(),
        listarUnidades(),
        listarUbicaciones(),
        listarProveedores(),
      ]);
      setCats(c || []);
      setUnis(u || []);
      setUbis(b || []);
      setProvs(p || []);
    } catch (e) {
      console.error(e);
    }
  };

  const onChangeCategoria = async (idCat) => {
    setInvData((prev) => ({ ...prev, idCategoria: idCat || "" }));
    setSelectedSpecs({});
    if (idCat) {
      try {
        const at = await listarAtributosCategoria(idCat);
        setAttrsCat(Array.isArray(at) ? at : []);
      } catch (e) {
        console.error(e);
        setAttrsCat([]);
      }
    } else {
      setAttrsCat([]);
    }
  };

  const renderSpecField = (attr) => {
    const key = specKey(attr);
    const included = !!selectedSpecs[key];
    const val = invData.especificaciones?.[key] ?? "";
    const setVal = (v) =>
      setInvData((p) => ({
        ...p,
        especificaciones: { ...(p.especificaciones || {}), [key]: v },
      }));
    const toggleInclude = (checked) => {
      setSelectedSpecs((prev) => ({ ...prev, [key]: checked }));
    };
    const commonTop = (
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="body2" fontWeight={600}>{attr.nombre}</Typography>
        <FormControlLabel
          control={<Switch size="small" checked={included} onChange={(_, c) => toggleInclude(c)} />}
          label="Incluir"
        />
      </Box>
    );
    const disabled = !included;
    switch (String(attr.tipo).toLowerCase()) {
      case "numero":
        return (
          <Box>
            {commonTop}
            <TextField type="number" fullWidth disabled={disabled} value={val} onChange={(e) => setVal(e.target.value)} />
          </Box>
        );
      case "fecha":
        return (
          <Box>
            {commonTop}
            <TextField type="date" fullWidth disabled={disabled} value={val}
                       onChange={(e) => setVal(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Box>
        );
      case "opcion": {
        const opts = Array.isArray(attr.opciones) ? attr.opciones : (attr.opciones?.lista || []);
        return (
          <Box>
            {commonTop}
            <TextField select fullWidth disabled={disabled} value={val} onChange={(e) => setVal(e.target.value)}>
              {(opts || []).map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </TextField>
          </Box>
        );
      }
      case "multivalor": {
        const opts = Array.isArray(attr.opciones) ? attr.opciones : (attr.opciones?.lista || []);
        const sel = Array.isArray(val) ? val : (val ? [val] : []);
        return (
          <Box>
            {commonTop}
            <TextField
              select fullWidth disabled={disabled} value={sel}
              onChange={(e) => setVal(e.target.value.split(","))}
              SelectProps={{ multiple: true, renderValue: (s) => (Array.isArray(s) ? s.join(", ") : s) }}
            >
              {(opts || []).map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </TextField>
          </Box>
        );
      }
      default:
        return (
          <Box>
            {commonTop}
            <TextField fullWidth disabled={disabled} value={val} onChange={(e) => setVal(e.target.value)} />
          </Box>
        );
    }
  };

  /* ========== Cargar donativo + catálogos + donante/inventario ========== */
  useEffect(() => {
    const cargar = async () => {
      try {
        const [tiposData, d] = await Promise.all([
          listarTiposDonativo(true),
          obtenerDonativo(idNum, { detalle: "1" }),
        ]);
        setTipos(Array.isArray(tiposData) ? tiposData : []);

        if (!d) {
          Swal.fire("Aviso", "Donativo no encontrado", "warning");
          return embedded ? onClose?.() : navigate("/donativos");
        }

        let tipoId = d.idtipodonativo || "";
        if (!tipoId && d.tipo && Array.isArray(tiposData)) {
          const hallado = tiposData.find(
            (t) => (t.nombre || "").toLowerCase() === String(d.tipo).toLowerCase()
          );
          if (hallado) tipoId = hallado.idtipodonativo;
        }

        let idDonante = d.idDonante || d.iddonante || d?.donante_principal?.iddonante || "";
        if (!idDonante) {
          try {
            const vinculos = await listarDonantesPorDonativo(idNum);
            if (Array.isArray(vinculos) && vinculos.length) {
              const principal = vinculos.find((x) => x.principal) || vinculos[0];
              idDonante = principal?.iddonante || "";
            }
          } catch (e) {
            console.warn("No se pudieron cargar donantes del donativo:", e);
          }
        }

        if (idDonante) {
          setValue("idDonante", idDonante);
          const list = await cargarDonantes();
          const found = list.find((x) => String(x.iddonante) === String(idDonante));
          if (found) setDonanteSel(found);
        }

        const idItem = d.iditem || d.idItem || null;
        const fecha = d.fecha ? String(d.fecha).slice(0, 10) : "";
        reset({
          idtipodonativo: tipoId || (tiposData[0]?.idtipodonativo || ""),
          tipo: d.tipo || (tiposData[0]?.nombre || ""),
          descripcion: d.descripcion ?? "",
          cantidad: d.cantidad ?? "",
          fecha,
          estado: d.estado ?? "Pendiente",
          idDonante: idDonante || "",
          idItem: idItem || "",
        });

        const codigoTipo = (d.tipoCodigo || d.tipo || "").toString().toLowerCase();
        const esMaterial =
          (d.codigo || "").toLowerCase() === "material" || codigoTipo === "material";
        if (esMaterial && idItem) {
          await cargarCatalogosInventario();
          const item = await obtenerItem(idItem);
          setInvData({
            nombre: item?.nombre || d?.item_nombre || d?.descripcion || "",
            descripcion: item?.descripcion || "Ingreso por donativo",
            idCategoria: item?.idCategoria ?? item?.idcategoria ?? "",
            idUnidad: item?.idUnidad ?? item?.idunidad ?? "",
            idUbicacion: item?.idUbicacion ?? item?.idubicacion ?? "",
            idProveedor: item?.idProveedor ?? item?.idproveedor ?? "",
            especificaciones: item?.especificaciones || {},
          });

          const catId = item?.idCategoria ?? item?.idcategoria;
          if (catId) {
            try {
              const at = await listarAtributosCategoria(catId);
              setAttrsCat(Array.isArray(at) ? at : []);
            } catch {
              setAttrsCat([]);
            }
          } else {
            setAttrsCat([]);
          }

          const espec = item?.especificaciones || {};
          const includeMap = {};
          Object.keys(espec).forEach((k) => {
            includeMap[k] = true;
          });
          setSelectedSpecs(includeMap);
        }
      } catch (err) {
        const msg = err?.response?.data?.error || err?.message || "No se pudo cargar";
        Swal.fire("Error", msg, "error");
        embedded ? onClose?.() : navigate("/donativos");
      } finally {
        setLoading(false);
      }
    };
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idNum, reset]);

  const tipoSeleccionado = useMemo(
    () => tipos.find((t) => String(t.idtipodonativo) === String(idtipodonativo)),
    [tipos, idtipodonativo]
  );
  const isMaterial = (tipoSeleccionado?.codigo || "").toLowerCase() === "material";

  /* ========== Submit ========== */
  const onSubmit = async (form) => {
    try {
      const idItem = form.idItem ? Number(form.idItem) : null;
      if (isMaterial && idItem) {
        const payloadItem = {
          nombre: invData.nombre || form.descripcion || "",
          descripcion: invData.descripcion || "Ingreso por donativo",
          idCategoria: invData.idCategoria || null,
          idUnidad: invData.idUnidad || null,
          idUbicacion: invData.idUbicacion || null,
          idProveedor: invData.idProveedor || null,
          especificaciones: (() => {
            const espec = invData.especificaciones || {};
            const onlyIncluded = {};
            Object.keys(espec).forEach((k) => {
              if (selectedSpecs[k]) onlyIncluded[k] = espec[k];
            });
            return Object.keys(onlyIncluded).length ? onlyIncluded : null;
          })(),
        };
        await editarItem(idItem, payloadItem);
      }

      const payloadDon = {
        idtipodonativo: form.idtipodonativo ? Number(form.idtipodonativo) : null,
        tipo: tipoSeleccionado?.nombre || null,
        descripcion: String(form.descripcion || "").trim(),
        fecha: form.fecha || null,
        estado: form.estado || "Pendiente",
      };

      if (form.idDonante) payloadDon.idDonante = Number(form.idDonante);
      else if (donanteSel?.iddonante) payloadDon.idDonante = Number(donanteSel.iddonante);

      if (isMaterial) {
        payloadDon.cantidad = Number(form.cantidad || 0);
        if (!payloadDon.cantidad || payloadDon.cantidad <= 0) {
          return Swal.fire("Valida", "La cantidad debe ser > 0 para materiales", "info");
        }
      } else {
        payloadDon.cantidad = null;
      }

      await editarDonativo(idNum, payloadDon);
      Swal.fire("Éxito", "Donativo actualizado", "success");

      if (onSuccess) onSuccess();
      if (embedded && onClose) return onClose();
      navigate("/donativos");
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "No se pudo actualizar";
      Swal.fire("Error", msg, "error");
    }
  };

  /* ========== Modal Crear Tipo ========== */
  const [openTipo, setOpenTipo] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState({ nombre: "", codigo: "", descripcion: "" });
  const abrirModalTipo = () => setOpenTipo(true);
  const cerrarModalTipo = () => {
    setOpenTipo(false);
    setNuevoTipo({ nombre: "", codigo: "", descripcion: "" });
  };

  const crearTipo = async () => {
    try {
      const nombre = String(nuevoTipo.nombre || "").trim();
      if (!nombre) return Swal.fire("Valida", "El nombre del tipo es obligatorio", "info");
      const payload = {
        nombre,
        codigo: String(nuevoTipo.codigo || nombre).trim(),
        descripcion: String(nuevoTipo.descripcion || "").trim() || null,
        activo: true,
      };
      const resp = await crearTipoDonativo(payload);
      const created = resp?.tipo;
      await cargarTipos();
      if (created?.idtipodonativo) {
        setValue("idtipodonativo", created.idtipodonativo);
        setValue("tipo", created.nombre || "");
      }
      cerrarModalTipo();
      Swal.fire("Listo", "Tipo creado", "success");
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "No se pudo crear el tipo";
      Swal.fire("Error", msg, "error");
    }
  };

  /* ========== Loading ========== */
  if (loading) {
    if (embedded) {
      return (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 220 }}>
          <CircularProgress />
        </Box>
      );
    }
    return (
      <LayoutDashboard>
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 280 }}>
          <CircularProgress />
        </Box>
      </LayoutDashboard>
    );
  }

  /* ========== UI principal (responsive) ========== */
  const FormUI = (
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid
          container
          spacing={2}
          sx={{
            "& .MuiTextField-root": { backgroundColor: "white" },
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
          }}
        >
          {/* Tipo / Fecha / Estado / Donante */}
          <Grid item xs={12}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap">
              {/* Tipo */}
              <Box sx={{ flex: 1, minWidth: 220 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Controller
                    name="idtipodonativo"
                    control={control}
                    rules={{ required: "Tipo requerido" }}
                    render={({ field }) => (
                      <TextField
                        select
                        fullWidth
                        size="medium"
                        label="Tipo de donativo"
                        {...field}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val);
                          const t = tipos.find((tt) => String(tt.idtipodonativo) === String(val));
                          setValue("tipo", t?.nombre || "");
                          if ((t?.codigo || "").toLowerCase() !== "material") {
                            setValue("cantidad", "");
                          }
                        }}
                        error={!!errors.idtipodonativo}
                        helperText={errors.idtipodonativo?.message}
                      >
                        {tipos.map((t) => (
                          <MenuItem key={t.idtipodonativo} value={t.idtipodonativo}>
                            {t.nombre} {t.activo ? "" : " (inactivo)"}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                  <Tooltip title="Crear nuevo tipo">
                    <IconButton color="primary" onClick={abrirModalTipo}>
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Fecha */}
              <Box sx={{ flex: 1, minWidth: 180 }}>
                <Controller
                  name="fecha"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      fullWidth
                      label="Fecha"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Box>

              {/* Estado */}
              <Box sx={{ flex: 1, minWidth: 180 }}>
                <Controller
                  name="estado"
                  control={control}
                  render={({ field }) => (
                    <TextField select fullWidth label="Estado" {...field}>
                      {ESTADOS.map((e) => (
                        <MenuItem key={e} value={e}>
                          {e}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Box>

              {/* Donante */}
              <Box sx={{ flex: 2, minWidth: 250 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Autocomplete
                    options={donantes}
                    value={donanteSel}
                    onChange={(_, v) => {
                      setDonanteSel(v || null);
                      setValue("idDonante", v?.iddonante || "");
                    }}
                    inputValue={donQ}
                    onInputChange={(_, q) => {
                      setDonQ(q || "");
                      cargarDonantes(q);
                    }}
                    getOptionLabel={(opt) => {
                      if (!opt) return "";
                      return opt.tipo === "INSTITUCION"
                        ? opt.razon_social || ""
                        : `${opt.nombres || ""} ${opt.apellidos || ""}`.trim();
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Donante" fullWidth size="medium" />
                    )}
                  />
                  <Tooltip title="Crear donante">
                    <IconButton color="primary" onClick={abrirModalDon}>
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Stack>
          </Grid>

          {/* Descripción */}
          <Grid item xs={12}>
            <Controller
              name="descripcion"
              control={control}
              rules={{ required: "La descripción es obligatoria" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Descripción"
                  fullWidth
                  multiline
                  minRows={2}
                  error={!!errors.descripcion}
                  helperText={errors.descripcion?.message}
                />
              )}
            />
          </Grid>

          {/* Cantidad si MATERIAL */}
          {isMaterial && (
            <Grid item xs={12} md={6}>
              <Controller
                name="cantidad"
                control={control}
                rules={{
                  required: "Cantidad requerida para materiales",
                  validate: (v) => Number(v) > 0 || "Debe ser > 0",
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Cantidad"
                    fullWidth
                    inputProps={{ min: 1 }}
                    error={!!errors.cantidad}
                    helperText={errors.cantidad?.message}
                  />
                )}
              />
            </Grid>
          )}

          {/* Panel de Inventario (si MATERIAL y hay idItem) */}
          {isMaterial && watch("idItem") ? (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Detalles de Inventario
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Nombre del ítem"
                      fullWidth
                      value={invData.nombre}
                      onChange={(e) => setInvData((p) => ({ ...p, nombre: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Descripción"
                      fullWidth
                      value={invData.descripcion}
                      onChange={(e) => setInvData((p) => ({ ...p, descripcion: e.target.value }))}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Categoría"
                      value={invData.idCategoria || ""}
                      onChange={async (e) => {
                        const v = e.target.value ? Number(e.target.value) : "";
                        await onChangeCategoria(v);
                      }}
                    >
                      {cats.map((c) => (
                        <MenuItem
                          key={c.idCategoria ?? c.idcategoria ?? c.id}
                          value={c.idCategoria ?? c.idcategoria ?? c.id}
                        >
                          {c.nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Unidad"
                      value={invData.idUnidad || ""}
                      onChange={(e) =>
                        setInvData((p) => ({
                          ...p,
                          idUnidad: e.target.value ? Number(e.target.value) : "",
                        }))
                      }
                    >
                      {unis.map((u) => (
                        <MenuItem key={u.idUnidad ?? u.idunidad ?? u.id} value={u.idUnidad ?? u.idunidad ?? u.id}>
                          {u.nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Ubicación"
                      value={invData.idUbicacion || ""}
                      onChange={(e) =>
                        setInvData((p) => ({
                          ...p,
                          idUbicacion: e.target.value ? Number(e.target.value) : "",
                        }))
                      }
                    >
                      {ubis.map((b) => (
                        <MenuItem key={b.idUbicacion ?? b.idubicacion ?? b.id} value={b.idUbicacion ?? b.idubicacion ?? b.id}>
                          {b.nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Proveedor"
                      value={invData.idProveedor || ""}
                      onChange={(e) =>
                        setInvData((p) => ({
                          ...p,
                          idProveedor: e.target.value ? Number(e.target.value) : "",
                        }))
                      }
                    >
                      {provs.map((p) => (
                        <MenuItem key={p.idProveedor ?? p.idproveedor ?? p.id} value={p.idProveedor ?? p.idproveedor ?? p.id}>
                          {p.nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />
                <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1, flexWrap: "wrap" }}>
                  <Button
                    size="small"
                    onClick={() => {
                      const all = {};
                      (attrsCat || []).forEach((a) => {
                        all[specKey(a)] = true;
                      });
                      Object.keys(invData.especificaciones || {}).forEach((k) => {
                        all[k] = true;
                      });
                      setSelectedSpecs(all);
                    }}
                  >
                    Seleccionar todo
                  </Button>
                  <Button size="small" onClick={() => setSelectedSpecs({})}>
                    Seleccionar ninguno
                  </Button>
                  <Tooltip title="Solo se guardan las especificaciones con 'Incluir' activo">
                    <HelpOutline fontSize="small" />
                  </Tooltip>
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Especificaciones (sugeridas por categoría)
                </Typography>
                <Grid container spacing={2}>
                  {attrsCat.length === 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Selecciona una categoría para ver especificaciones sugeridas. También puedes guardar sin especificaciones.
                      </Typography>
                    </Grid>
                  )}
                  {attrsCat.map((attr) => (
                    <Grid item xs={12} sm={6} md={4} key={attr.nombre}>
                      {renderSpecField(attr)}
                    </Grid>
                  ))}
                </Grid>

                {/* Manuales */}
                {(() => {
                  const sugKeys = new Set((attrsCat || []).map((a) => specKey(a)));
                  const espec = invData.especificaciones || {};
                  const manualKeys = Object.keys(espec).filter((k) => !sugKeys.has(k));
                  if (manualKeys.length === 0) return null;
                  return (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Especificaciones agregadas manualmente
                      </Typography>
                      <Grid container spacing={2}>
                        {manualKeys.map((k) => {
                          const included = !!selectedSpecs[k];
                          const val = espec[k] ?? "";
                          return (
                            <Grid item xs={12} sm={6} md={4} key={k}>
                              <Box display="flex" flexDirection="column" gap={1}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                  <Typography variant="body2" fontWeight={600}>{k}</Typography>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        size="small"
                                        checked={included}
                                        onChange={(_, c) => setSelectedSpecs((p) => ({ ...p, [k]: c }))}
                                      />
                                    }
                                    label="Incluir"
                                  />
                                </Box>
                                <TextField
                                  fullWidth
                                  disabled={!included}
                                  value={val}
                                  onChange={(e) =>
                                    setInvData((p) => ({
                                      ...p,
                                      especificaciones: { ...(p.especificaciones || {}), [k]: e.target.value },
                                    }))
                                  }
                                />
                                <Box display="flex" justifyContent="flex-end">
                                  <Button color="error" size="small" onClick={() => removeManualSpec(k)}>
                                    Quitar
                                  </Button>
                                </Box>
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </>
                  );
                })()}

                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Agregar especificación manual
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Clave (ej. color)"
                      fullWidth
                      value={manualSpec.key}
                      onChange={(e) => setManualSpec((p) => ({ ...p, key: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Valor"
                      fullWidth
                      value={manualSpec.value}
                      onChange={(e) => setManualSpec((p) => ({ ...p, value: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => {
                        const k = String(manualSpec.key || "").trim().toLowerCase();
                        if (!k) return Swal.fire("Valida", "Ingresa una clave de especificación", "info");
                        setInvData((p) => ({
                          ...p,
                          especificaciones: { ...(p.especificaciones || {}), [k]: manualSpec.value },
                        }));
                        setSelectedSpecs((p) => ({ ...p, [k]: true }));
                        setManualSpec({ key: "", value: "" });
                        Swal.fire("Listo", "Especificación agregada", "success");
                      }}
                    >
                      Agregar
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ) : null}

          {/* Ocultos */}
          <Controller name="tipo" control={control} render={({ field }) => <input type="hidden" {...field} />} />
          <Controller name="idDonante" control={control} render={({ field }) => <input type="hidden" {...field} />} />
          <Controller name="idItem" control={control} render={({ field }) => <input type="hidden" {...field} />} />

          {/* Botones */}
          <Grid item xs={12}>
            <Box mt={3} display="flex" justifyContent="center" gap={2} flexWrap="wrap">
              {embedded && (
                <Button variant="outlined" onClick={onClose} size={isMobile ? "small" : "medium"}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" variant="contained" disabled={isSubmitting} size={isMobile ? "small" : "medium"}>
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );

  /* ========== Render final ========== */
  if (embedded) {
    return (
      <Box sx={{ width: "100%", p: { xs: 1, sm: 2, md: 3 } }}>
        {FormUI}

        {/* Modal Crear Tipo */}
        <Dialog open={openTipo} onClose={cerrarModalTipo} fullWidth maxWidth="sm">
          <DialogTitle>Crear tipo de donativo</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre *"
                  fullWidth
                  value={nuevoTipo.nombre}
                  onChange={(e) => setNuevoTipo((p) => ({ ...p, nombre: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Código (opcional)"
                  fullWidth
                  placeholder="p. ej. material, monetario"
                  value={nuevoTipo.codigo}
                  onChange={(e) => setNuevoTipo((p) => ({ ...p, codigo: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Descripción (opcional)"
                  fullWidth
                  multiline
                  minRows={2}
                  value={nuevoTipo.descripcion}
                  onChange={(e) => setNuevoTipo((p) => ({ ...p, descripcion: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={cerrarModalTipo}>Cancelar</Button>
            <Button variant="contained" onClick={crearTipo}>
              Crear
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal Crear Donante */}
        <Dialog open={openDon} onClose={cerrarModalDon} fullWidth maxWidth="sm">
          <DialogTitle>Crear Donante</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Tipo"
                  value={nuevoDon.tipo}
                  onChange={(e) => setNuevoDon((p) => ({ ...p, tipo: e.target.value }))}
                >
                  <MenuItem value="PERSONA">Persona</MenuItem>
                  <MenuItem value="INSTITUCION">Institución</MenuItem>
                </TextField>
              </Grid>
              {nuevoDon.tipo === "PERSONA" ? (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Nombres *"
                      fullWidth
                      value={nuevoDon.nombres}
                      onChange={(e) => setNuevoDon((p) => ({ ...p, nombres: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Apellidos"
                      fullWidth
                      value={nuevoDon.apellidos}
                      onChange={(e) => setNuevoDon((p) => ({ ...p, apellidos: e.target.value }))}
                    />
                  </Grid>
                </>
              ) : (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Razón social *"
                    fullWidth
                    value={nuevoDon.razon_social}
                    onChange={(e) => setNuevoDon((p) => ({ ...p, razon_social: e.target.value }))}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={cerrarModalDon}>Cancelar</Button>
            <Button variant="contained" onClick={crearDonanteRapido}>
              Crear
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Modo página (standalone)
  return (
    <LayoutDashboard>
      <Typography variant="h5" gutterBottom>
        Editar donativo
      </Typography>

      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        {FormUI}
      </Box>

      {/* Modal Crear Tipo */}
      <Dialog open={openTipo} onClose={cerrarModalTipo} fullWidth maxWidth="sm">
        <DialogTitle>Crear tipo de donativo</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre *"
                fullWidth
                value={nuevoTipo.nombre}
                onChange={(e) => setNuevoTipo((p) => ({ ...p, nombre: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Código (opcional)"
                fullWidth
                placeholder="p. ej. material, monetario"
                value={nuevoTipo.codigo}
                onChange={(e) => setNuevoTipo((p) => ({ ...p, codigo: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descripción (opcional)"
                fullWidth
                multiline
                minRows={2}
                value={nuevoTipo.descripcion}
                onChange={(e) => setNuevoTipo((p) => ({ ...p, descripcion: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarModalTipo}>Cancelar</Button>
          <Button variant="contained" onClick={crearTipo}>
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Crear Donante */}
      <Dialog open={openDon} onClose={cerrarModalDon} fullWidth maxWidth="sm">
        <DialogTitle>Crear Donante</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Tipo"
                value={nuevoDon.tipo}
                onChange={(e) => setNuevoDon((p) => ({ ...p, tipo: e.target.value }))}
              >
                <MenuItem value="PERSONA">Persona</MenuItem>
                <MenuItem value="INSTITUCION">Institución</MenuItem>
              </TextField>
            </Grid>
            {nuevoDon.tipo === "PERSONA" ? (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nombres *"
                    fullWidth
                    value={nuevoDon.nombres}
                    onChange={(e) => setNuevoDon((p) => ({ ...p, nombres: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Apellidos"
                    fullWidth
                    value={nuevoDon.apellidos}
                    onChange={(e) => setNuevoDon((p) => ({ ...p, apellidos: e.target.value }))}
                  />
                </Grid>
              </>
            ) : (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Razón social *"
                  fullWidth
                  value={nuevoDon.razon_social}
                  onChange={(e) => setNuevoDon((p) => ({ ...p, razon_social: e.target.value }))}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarModalDon}>Cancelar</Button>
          <Button variant="contained" onClick={crearDonanteRapido}>
            Crear
          </Button>
        </DialogActions>
      </Dialog>
    </LayoutDashboard>
  );
}
