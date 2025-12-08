import {
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Tooltip,
  Divider,
  Stack,
  useMediaQuery,
  InputAdornment,
} from "@mui/material";
import { Add as AddIcon, HelpOutline, Search } from "@mui/icons-material";
import Autocomplete from "@mui/material/Autocomplete";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useTheme } from "@mui/material/styles";

import {
  crearDonativo,
  listarTiposDonativo,
  crearTipoDonativo,
  listarDonantes,
  crearDonante,
} from "../../services/donativos.service";

import {
  listarItems,
  listarCategorias,
  listarUnidades,
  listarUbicaciones,
  listarProveedores,
  listarAtributosCategoria,
} from "../../services/inventario.service";

const ESTADOS = ["Pendiente", "Aprobado", "Rechazado"];

export default function DonativoCrearPage({ onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      idtipodonativo: "",
      tipo: "", // legacy compat
      descripcion: "",
      cantidad: "",
      fecha: new Date().toISOString().slice(0, 10),
      estado: "Pendiente",
      idItem: "",
      idDonante: "",
    },
  });

  const idtipodonativo = watch("idtipodonativo");

  /* ===================
   * Tipos de donativo
   * =================== */
  const [tipos, setTipos] = useState([]);
  const cargarTipos = async () => {
    const data = await listarTiposDonativo(true);
    setTipos(Array.isArray(data) ? data : []);
    if ((!watch("idtipodonativo") || watch("idtipodonativo") === "") && Array.isArray(data) && data.length > 0) {
      setValue("idtipodonativo", data[0].idtipodonativo);
      setValue("tipo", data[0].nombre || ""); // legacy
    }
  };
  useEffect(() => {
    (async () => {
      try {
        await cargarTipos();
      } catch (e) {
        console.error(e);
        Swal.fire("Error", "No se pudo cargar el catálogo de tipos", "error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tipoSeleccionado = useMemo(
    () => tipos.find((t) => String(t.idtipodonativo) === String(idtipodonativo)),
    [tipos, idtipodonativo]
  );
  const isMaterial = (tipoSeleccionado?.codigo || "").toLowerCase() === "material";

  /* ===================
   * Donantes (auto + crear)
   * =================== */
  const [donantes, setDonantes] = useState([]);
  const [donanteSel, setDonanteSel] = useState(null);
  const [donQ, setDonQ] = useState("");

  const cargarDonantes = async (q = "") => {
    try {
      const data = await listarDonantes({ q, activo: true, limit: 20, offset: 0 });
      setDonantes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setDonantes([]);
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
  // Modal crear tipo de donativo
  const [openTipo, setOpenTipo] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState({ nombre: "", codigo: "", descripcion: "" });

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
        await cargarDonantes(d.razon_social || d.nombres || "");
        setDonanteSel(d);
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

  /* ===================
   * Inventario: Items existentes (para MATERIAL)
   * =================== */
  const [items, setItems] = useState([]);
  const [inputMat, setInputMat] = useState(""); // texto en Autocomplete
  useEffect(() => {
    (async () => {
      try {
        const data = await listarItems();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);
  const optionLabel = useMemo(() => (opt) => (typeof opt === "string" ? opt : opt?.nombre ?? ""), []);

  // Si el usuario selecciona un item existente vs. escribe texto (nuevo)
  const handleMaterialChange = async (_, value) => {
    if (typeof value === "object" && value && value.iditem) {
      setValue("idItem", value.iditem);
      setValue("descripcion", value.nombre || "");
      setInputMat(value.nombre || "");

      // Cargar categoría y atributos del material existente
      if (value.idCategoria || value.idcategoria) {
        const catId = value.idCategoria || value.idcategoria;
        setInvData((prev) => ({ ...prev, idCategoria: catId }));
        try {
          const at = await listarAtributosCategoria(catId);
          setAttrsCat(Array.isArray(at) ? at : []);
        } catch (e) {
          console.error(e);
          setAttrsCat([]);
        }
      }
    } else {
      // texto libre => material nuevo
      setValue("idItem", "");
      setValue("descripcion", value || "");
      setInputMat(value || "");
    }
  };

  /* ===================
   * Panel Inventario (nuevo material)
   * =================== */
  const [showInvPanel, setShowInvPanel] = useState(false);
  const [cats, setCats] = useState([]);
  const [unis, setUnis] = useState([]);
  const [ubis, setUbis] = useState([]);
  const [provs, setProvs] = useState([]);
  const [invData, setInvData] = useState({
    nombre: "",
    descripcion: "Ingreso por donativo",
    idCategoria: "",
    idUnidad: "",
    idUbicacion: "",
    idProveedor: "",
    especificaciones: {},
  });
  const [attrsCat, setAttrsCat] = useState([]);
  const [selectedSpecs, setSelectedSpecs] = useState({}); // { [keySpec]: true|false }
  const [manualSpec, setManualSpec] = useState({ key: "", value: "" });

  // cargar catálogos inventario solo si es MATERIAL
  useEffect(() => {
    if (isMaterial) {
      (async () => {
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
      })();
    }
  }, [isMaterial]);

  const specKey = (attr) => String(attr?.nombre || attr || "").trim().toLowerCase();

  const onChangeCategoria = async (idCat) => {
    setInvData((prev) => ({ ...prev, idCategoria: idCat || "" }));
    setSelectedSpecs({});
    if (idCat) {
      try {
        const at = await listarAtributosCategoria(idCat); // [{nombre, tipo, opciones,...}]
        setAttrsCat(Array.isArray(at) ? at : []);
      } catch (e) {
        console.error(e);
        setAttrsCat([]);
      }
    } else {
      setAttrsCat([]);
    }
  };

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

    const disabled = !included;

    // Si tu backend soporta tipos (numero, fecha, opcion, multivalor), aquí podrías ramificar como en el editor:
    return (
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography variant="body2" fontWeight={600}>{attr.nombre}</Typography>
          <FormControlLabel
            control={<Switch size="small" checked={included} onChange={(_, c) => toggleInclude(c)} />}
            label="Incluir"
          />
        </Box>
        <TextField
          fullWidth
          disabled={!included}
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      </Box>
    );
  };

  /* ===================
   * Submit
   * =================== */
  const onSubmit = async (form) => {
    try {
      const payload = {
        idtipodonativo: form.idtipodonativo ? Number(form.idtipodonativo) : null,
        tipo: tipoSeleccionado?.nombre || null, // legacy compat
        descripcion: String(form.descripcion || "").trim(),
        fecha: form.fecha || null,
        estado: form.estado || "Pendiente",
      };

      // Donante
      if (form.idDonante) payload.idDonante = Number(form.idDonante);
      else if (donanteSel && donanteSel.iddonante) payload.idDonante = Number(donanteSel.iddonante);

      if (isMaterial) {
        const cant = Number(form.cantidad || 0);
        if (!cant || cant <= 0) {
          return Swal.fire("Valida", "La cantidad es obligatoria y debe ser > 0 para materiales", "info");
        }
        payload.cantidad = cant;

        if (form.idItem && showInvPanel && invData.idCategoria) {
          // Material existente CON especificaciones → crear variante nueva
          const espec = invData.especificaciones || {};
          const onlyIncluded = {};
          Object.keys(espec).forEach((k) => {
            if (selectedSpecs[k]) {
              onlyIncluded[k] = espec[k];
            }
          });

          // Si hay especificaciones, crear como variante nueva
          if (Object.keys(onlyIncluded).length > 0) {
            const invPayload = {
              ...invData,
              nombre: inputMat.trim(),
              especificaciones: onlyIncluded,
            };
            // Normalizar ids vacíos como null
            ["idCategoria", "idUnidad", "idUbicacion", "idProveedor"].forEach((k) => {
              if (!invPayload[k]) invPayload[k] = null;
            });
            payload.inventarioData = invPayload;
          } else {
            // Sin especificaciones, solo sumar stock al existente
            payload.idItem = Number(form.idItem);
          }
        } else if (form.idItem) {
          // Material existente SIN panel de atributos: sumar stock al item
          payload.idItem = Number(form.idItem);
        } else if (showInvPanel && inputMat.trim()) {
          // Material nuevo: inventarioData via donativos.service → crearDonativo
          const invPayload = {
            ...invData,
            nombre: inputMat.trim(),
          };
          // Normalizar ids vacíos como null
          ["idCategoria", "idUnidad", "idUbicacion", "idProveedor"].forEach((k) => {
            if (!invPayload[k]) invPayload[k] = null;
          });

          // Solo specs incluidas
          const espec = invPayload.especificaciones || {};
          const onlyIncluded = {};
          Object.keys(espec).forEach((k) => {
            if (selectedSpecs[k]) {
              onlyIncluded[k] = espec[k];
            }
          });
          invPayload.especificaciones = Object.keys(onlyIncluded).length ? onlyIncluded : null;

          payload.inventarioData = invPayload;
        }
      } else {
        payload.cantidad = null;
      }

      await crearDonativo(payload);
      Swal.fire("Éxito", "Donativo creado", "success");
      reset();
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "No se pudo crear el donativo";
      Swal.fire("Error", msg, "error");
    }
  };

  // cuando cambia hidden idDonante manual, mantener el estado local del autocomplete
  useEffect(() => {
    const idDon = watch("idDonante");
    if (!idDon) return;
    const found = donantes.find((d) => String(d.iddonante) === String(idDon));
    if (found) setDonanteSel(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch("idDonante")]);

  /* ===================
   * UI
   * =================== */
  return (
    <Box sx={{ width: "100%", p: { xs: 1, sm: 2, md: 3 } }}>
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
            {/* Encabezado */}
            <Grid item xs={12}>
              <Typography variant="h6" fontWeight={700}>
                Nuevo donativo
              </Typography>
            </Grid>

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
                          onChange={async (e) => {
                            const val = e.target.value;
                            field.onChange(val);
                            const t = tipos.find((tt) => String(tt.idtipodonativo) === String(val));
                            setValue("tipo", t?.nombre || ""); // legacy
                            if ((t?.codigo || "").toLowerCase() !== "material") {
                              setValue("idItem", "");
                              setInputMat("");
                              setValue("cantidad", "");
                              setShowInvPanel(false);
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
                      <IconButton color="primary" onClick={() => setOpenTipo(true)}>
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
                        label="Fecha"
                        fullWidth
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
                <Box sx={{ flex: 2, minWidth: 260 }}>
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
                        <TextField
                          {...params}
                          label="Donante"
                          placeholder="Buscar por nombre, razón social o documento"
                          fullWidth
                          size="medium"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <Search sx={{ color: "text.secondary" }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props} key={option.iddonante}>
                          {option.tipo === "INSTITUCION"
                            ? `${option.razon_social || ""}`
                            : `${option.nombres || ""} ${option.apellidos || ""}`.trim()}
                          {option.documento_numero ? ` — ${option.documento_numero}` : ""}
                        </li>
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

            {/* Si MATERIAL: material/cantidad + switch inventario */}
            {isMaterial ? (
              <>
                <Grid item xs={12}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap">
                    <Box sx={{ flex: 2, minWidth: 280 }}>
                      <Autocomplete
                        freeSolo
                        options={items}
                        getOptionLabel={optionLabel}
                        value={null /* controlado por inputValue */}
                        inputValue={inputMat}
                        onInputChange={(_, newInput) => {
                          setInputMat(newInput);
                          setValue("descripcion", newInput || "");
                          setValue("idItem", "");
                        }}
                        onChange={handleMaterialChange}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Material (selecciona o escribe)"
                            placeholder="Ej: Guantes de cuero"
                            fullWidth
                          />
                        )}
                        renderOption={(props, option) => (
                          <li {...props} key={option.iditem}>
                            {option.nombre}
                          </li>
                        )}
                      />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 160 }}>
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
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showInvPanel}
                        onChange={(_, v) => setShowInvPanel(v)}
                        disabled={!inputMat.trim()}
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center" gap={1} sx={{ flexWrap: "wrap" }}>
                        Especificar atributos para <strong>{inputMat || "este material"}</strong>
                        <HelpOutline fontSize="small" />
                      </Box>
                    }
                  />
                </Grid>

                {/* Panel inventario/atributos */}
                {showInvPanel && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Detalles de Inventario
                      </Typography>
                      <Grid container spacing={2}>
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

                      {/* Manuales (claves que no vienen de la categoría) */}
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
                                        <Typography variant="body2" fontWeight={600}>
                                          {k}
                                        </Typography>
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
                              setSelectedSpecs((p) => ({ ...p, [k]: true })); // incluir por defecto
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
                )}
              </>
            ) : (
              // Otros tipos: descripción manual
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
            )}

            {/* hidden compat */}
            <Controller name="idItem" control={control} render={({ field }) => <input type="hidden" {...field} />} />
            <Controller name="tipo" control={control} render={({ field }) => <input type="hidden" {...field} />} />
            <Controller name="idDonante" control={control} render={({ field }) => <input type="hidden" {...field} />} />

            {/* Botones */}
            <Grid item xs={12}>
              <Box mt={3} display="flex" justifyContent="center" gap={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  onClick={onClose}
                  size={isMobile ? "small" : "medium"}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  size={isMobile ? "small" : "medium"}
                >
                  {isSubmitting ? "Guardando..." : "Guardar Donativo"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Modal Crear Tipo */}
      <Dialog open={openTipo} onClose={() => setOpenTipo(false)} fullWidth maxWidth="sm">
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
          <Button onClick={() => setOpenTipo(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={async () => {
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
                setOpenTipo(false);
                setNuevoTipo({ nombre: "", codigo: "", descripcion: "" });
                Swal.fire("Listo", "Tipo creado", "success");
              } catch (e) {
                const msg = e?.response?.data?.error || e?.message || "No se pudo crear el tipo";
                Swal.fire("Error", msg, "error");
              }
            }}
          >
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
                select fullWidth label="Tipo"
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Documento (tipo)"
                fullWidth
                value={nuevoDon.documento_tipo}
                onChange={(e) => setNuevoDon((p) => ({ ...p, documento_tipo: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Documento (número)"
                fullWidth
                value={nuevoDon.documento_numero}
                onChange={(e) => setNuevoDon((p) => ({ ...p, documento_numero: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                fullWidth
                value={nuevoDon.email}
                onChange={(e) => setNuevoDon((p) => ({ ...p, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Teléfono"
                fullWidth
                value={nuevoDon.telefono}
                onChange={(e) => setNuevoDon((p) => ({ ...p, telefono: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Dirección"
                fullWidth
                value={nuevoDon.direccion}
                onChange={(e) => setNuevoDon((p) => ({ ...p, direccion: e.target.value }))}
              />
            </Grid>
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
