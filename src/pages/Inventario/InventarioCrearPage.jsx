import {
  Typography, Paper, TextField, Button, Box, Grid, MenuItem,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Chip, Stack, CircularProgress
} from "@mui/material";
import { Add, Delete, Close, Inventory2 } from "@mui/icons-material";
import Autocomplete from "@mui/material/Autocomplete";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  crearItem, listarItems,
  listarCategorias, crearCategoria,
  listarUnidades, crearUnidad,
  listarUbicaciones, crearUbicacion,
  listarProveedores, crearProveedor,
  listarAtributosCategoria, crearAtributoCategoria,
} from "../../services/inventario.service";

const ESTADOS = ["Disponible", "Asignado", "Dañado", "Agotado", "Dado de baja"];

export default function InventarioCrearPage() {
  const navigate = useNavigate();
  const { control, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm({
    defaultValues: {
      nombre: "", descripcion: "", cantidad: 0, estado: "Disponible",
      idCategoria: "", idUnidad: "", idUbicacion: "", idProveedor: ""
    }
  });

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [sugeridos, setSugeridos] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [valAtributos, setValAtributos] = useState({});
  const [customFields, setCustomFields] = useState([]);

  const [openAttr, setOpenAttr] = useState(false);
  const [attrForm, setAttrForm] = useState({ nombre: "", tipo: "texto", opciones: "" });
  const idCategoria = watch("idCategoria");

  // === CARGA inicial ===
  useEffect(() => {
    (async () => {
      try {
        const [its, cats, unis, ubis, provs] = await Promise.all([
          listarItems(), listarCategorias(), listarUnidades(), listarUbicaciones(), listarProveedores()
        ]);
        setItems(its || []);
        setCategorias(cats || []);
        setUnidades(unis || []);
        setUbicaciones(ubis || []);
        setProveedores(provs || []);
      } catch (err) {
        Swal.fire("Error", err?.response?.data?.mensaje || err?.message, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // === helpers ===
  const parseOpciones = (op) => {
    if (!op) return [];
    if (Array.isArray(op)) return op;
    try {
      const arr = JSON.parse(op);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return String(op).split(",").map(s => s.trim()).filter(Boolean);
    }
  };

  const defaultValueByTipo = (t) => {
    switch ((t || "").toLowerCase()) {
      case "numero": return "";
      case "fecha": return "";
      case "opcion": return "";
      case "multivalor": return [];
      default: return "";
    }
  };

  // === Cambio de categoría ===
  useEffect(() => {
    (async () => {
      if (!idCategoria) {
        setSugeridos([]); setSeleccionados([]); setValAtributos({}); return;
      }
      try {
        const atts = await listarAtributosCategoria(idCategoria);
        setSugeridos(atts || []);
        setSeleccionados([]); setValAtributos({});
      } catch (e) {
        Swal.fire("Error", e?.response?.data?.mensaje || e?.message, "error");
      }
    })();
  }, [idCategoria]);

  // === Seleccionar ítem base ===
  const onSelectItemBase = (it) => {
    if (!it) return;
    setValue("nombre", it.nombre || "");
    setValue("idCategoria", it.idCategoria ?? it.idcategoria ?? "");
    setValue("idUnidad", it.idUnidad ?? it.idunidad ?? "");
    setValue("idUbicacion", it.idUbicacion ?? it.idubicacion ?? "");
    setValue("idProveedor", it.idProveedor ?? it.idproveedor ?? "");
    let espec = it.especificaciones;
    try { if (typeof espec === "string") espec = JSON.parse(espec); } catch {}
    const base = espec && typeof espec === "object" && !Array.isArray(espec) ? espec : {};
    const nuevosCustom = Object.entries(base).map(([k, v]) => ({
      key: k, tipo: "texto", valor: Array.isArray(v) ? v.join(", ") : v ?? ""
    }));
    setCustomFields(nuevosCustom);
    setSeleccionados([]); setValAtributos({});
  };

  // === Crear catálogo al vuelo ===
  const promptNuevo = async (titulo, onCreate) => {
    const { value: nombre } = await Swal.fire({
      title: titulo,
      input: "text",
      inputLabel: "Nombre",
      inputPlaceholder: "Escribe el nombre",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      inputValidator: (v) => (!v ? "Ingresa un nombre" : undefined),
    });
    if (!nombre) return null;
    return onCreate(nombre.trim());
  };

  const crearCatalogo = async (titulo, fnListar, fnCrear, setState, key) => {
    try {
      const c = await promptNuevo(titulo, fnCrear);
      if (c) {
        setState(await fnListar());
        setValue(
          key,
          c.idcategoria || c.idCategoria || c.idunidad || c.idUnidad || c.idubicacion || c.idUbicacion || c.idproveedor || c.idProveedor
        );
      }
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e?.message, "error");
    }
  };

  // === Crear nombre nuevo ===
  const onCrearNombre = async () => {
    const { value: nuevo } = await Swal.fire({
      title: "Crear nombre de ítem",
      input: "text",
      inputLabel: "Nombre",
      inputPlaceholder: "Ej. Guantes de intervención",
      showCancelButton: true,
      confirmButtonText: "Usar nombre",
      cancelButtonText: "Cancelar",
      inputValidator: (v) => (!v || !String(v).trim() ? "Ingresa un nombre" : undefined),
    });
    if (!nuevo) return;
    const base = items.find(x => (x?.nombre || "").toLowerCase() === String(nuevo).toLowerCase());
    if (base) {
      const r = await Swal.fire({
        title: "Nombre ya existe",
        text: "¿Usar datos del ítem existente como base?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí",
        cancelButtonText: "No"
      });
      if (r.isConfirmed) return onSelectItemBase(base);
    }
    setValue("nombre", String(nuevo).trim());
    setValue("idCategoria", ""); setValue("idUnidad", "");
    setValue("idUbicacion", ""); setValue("idProveedor", "");
    setSugeridos([]); setSeleccionados([]); setValAtributos({}); setCustomFields([]);
  };

  const renderValorPorTipo = (tipo, label, valor, onChange) => {
    const t = (tipo || "").toLowerCase();
    if (t === "numero") return <TextField type="number" label={label} value={valor ?? ""} onChange={(e) => onChange(e.target.value)} fullWidth />;
    if (t === "fecha") return <TextField type="date" label={label} InputLabelProps={{ shrink: true }} value={valor ?? ""} onChange={(e) => onChange(e.target.value)} fullWidth />;
    if (t === "opcion")
      return (
        <TextField
          select
          label={label}
          fullWidth
          value={valor ?? ""}
          onChange={(e) => onChange(e.target.value)}
          SelectProps={{
            MenuProps: {
              PaperProps: { sx: { minWidth: 360, maxWidth: 640 } },
            },
          }}
        >
          <MenuItem value={""}>—</MenuItem>
          {parseOpciones(seleccionados.find(s => s.nombre === label)?.opciones).map(o => (
            <MenuItem
              key={o}
              value={o}
              sx={{ whiteSpace: "normal", wordBreak: "break-word", alignItems: "flex-start", py: 1 }}
            >
              {o}
            </MenuItem>
          ))}
        </TextField>
      );
    if (t === "multivalor")
      return (
        <TextField
          label={`${label} (lista separada por comas)`}
          placeholder="ej: S,M,L"
          fullWidth
          value={Array.isArray(valor) ? valor.join(", ") : valor ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    return <TextField label={label} fullWidth value={valor ?? ""} onChange={(e) => onChange(e.target.value)} />;
  };

  const onSubmit = async (form) => {
    try {
      if (!form.nombre.trim()) return Swal.fire("Valida", "Define el nombre desde 'Crear nombre' o selecciona un ítem base", "info");
      const espec = {};

      for (const s of seleccionados) {
        let v = valAtributos[s.nombre];
        const t = (s.tipo || "").toLowerCase();
        if (t === "numero") v = Number(v);
        else if (t === "multivalor") v = String(v || "").split(",").map(x => x.trim()).filter(Boolean);
        else v = String(v ?? "");
        espec[s.nombre] = v;
      }

      for (const row of customFields) {
        const key = String(row.key || "").trim();
        if (!key) continue;
        let valor = row.valor;
        const tipo = (row.tipo || "").toLowerCase();
        if (tipo === "numero") valor = Number(valor);
        else if (tipo === "multivalor") valor = String(valor || "").split(",").map(s => s.trim()).filter(Boolean);
        else valor = String(valor ?? "");
        espec[key] = valor;
      }

      const payload = {
        nombre: form.nombre.trim(),
        descripcion: String(form.descripcion || "").trim(),
        cantidad: Number(form.cantidad || 0),
        estado: form.estado || "Disponible",
        idCategoria: form.idCategoria || null,
        idUnidad: form.idUnidad || null,
        idUbicacion: form.idUbicacion || null,
        idProveedor: form.idProveedor || null,
        ...(Object.keys(espec).length ? { especificaciones: espec } : {}),
      };

      await crearItem(payload);
      Swal.fire("Éxito", "Ítem creado correctamente", "success");
      reset(); setSugeridos([]); setSeleccionados([]); setValAtributos({}); setCustomFields([]);
      navigate("/inventario");
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.mensaje || err?.message, "error");
    }
  };

  if (loading)
    return (
      <LayoutDashboard>
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 300 }}>
          <CircularProgress />
        </Box>
      </LayoutDashboard>
    );

  return (
    <LayoutDashboard>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Inventory2 color="primary" />
        <Typography variant="h5">Nuevo ítem</Typography>
      </Stack>

      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2}>

            {/* Ítem base con menú ancho y multilínea */}
            <Grid item xs={12} sm={8}>
              <Autocomplete
                options={items || []}
                getOptionLabel={(opt) => opt?.nombre || ""}
                onChange={(_, val) => val && onSelectItemBase(val)}
                disablePortal
                slotProps={{
                  paper: { sx: { minWidth: { xs: "100%", sm: 420 }, maxWidth: 760 } },
                  listbox: {
                    sx: {
                      "& li": {
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        alignItems: "flex-start",
                        lineHeight: 1.25,
                        py: 1,
                      },
                    },
                  },
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option.iditem || option.idItem}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        — stock: {option.cantidad ?? 0}
                      </Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Selecciona ítem base (opcional)" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button fullWidth variant="contained" onClick={onCrearNombre}>Crear nombre</Button>
            </Grid>

            {/* Nombre */}
            <Grid item xs={12}>
              <Controller
                name="nombre"
                control={control}
                rules={{ required: "El nombre es obligatorio" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre"
                    fullWidth
                    InputProps={{ readOnly: true }}
                    error={!!errors.nombre}
                    helperText={errors.nombre?.message || "Define el nombre con el botón o selecciona un ítem base"}
                  />
                )}
              />
            </Grid>

            {/* Cantidad/Descripción/Estado */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="cantidad"
                control={control}
                rules={{ required: true, validate: v => Number(v) >= 0 || "Debe ser ≥ 0" }}
                render={({ field }) => (
                  <TextField {...field} type="number" label="Cantidad" fullWidth inputProps={{ min: 0 }}
                    error={!!errors.cantidad} helperText={errors.cantidad?.message} />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <Controller name="descripcion" control={control}
                render={({ field }) => (<TextField {...field} label="Descripción (opcional)" fullWidth />)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="estado" control={control}
                render={({ field }) => (
                  <TextField select fullWidth label="Estado" {...field}>
                    {ESTADOS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                  </TextField>
                )}
              />
            </Grid>

            {/* Catálogos — MENÚS ANCHOS y multilínea */}
            {[
              { label: "Categoría", data: categorias, onAdd: () => crearCatalogo("Nueva categoría", listarCategorias, crearCategoria, setCategorias, "idCategoria"), key: "idCategoria", id: "idcategoria" },
              { label: "Unidad", data: unidades, onAdd: () => crearCatalogo("Nueva unidad", listarUnidades, crearUnidad, setUnidades, "idUnidad"), key: "idUnidad", id: "idunidad" },
              { label: "Ubicación", data: ubicaciones, onAdd: () => crearCatalogo("Nueva ubicación raíz", listarUbicaciones, (n) => crearUbicacion({ nombre: n }), setUbicaciones, "idUbicacion"), key: "idUbicacion", id: "idubicacion" },
              { label: "Proveedor", data: proveedores, onAdd: () => crearCatalogo("Nuevo proveedor", listarProveedores, (n) => crearProveedor({ nombre: n }), setProveedores, "idProveedor"), key: "idProveedor", id: "idproveedor" },
            ].map((c) => (
              <Grid item xs={12} sm={6} key={c.key}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box sx={{ flexGrow: 1, minWidth: 260 }}>
                    <Controller
                      name={c.key}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label={c.label}
                          {...field}
                          SelectProps={{
                            MenuProps: {
                              PaperProps: { sx: { minWidth: 360, maxWidth: 720 } },
                            },
                          }}
                        >
                          <MenuItem value="">—</MenuItem>
                          {c.data.map((d) => (
                            <MenuItem
                              key={d[c.id] || d[c.key]}
                              value={d[c.id] || d[c.key]}
                              sx={{ whiteSpace: "normal", wordBreak: "break-word", alignItems: "flex-start", py: 1 }}
                            >
                              {d.nombre}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Box>
                  <Tooltip title={`Agregar ${c.label.toLowerCase()}`}>
                    <IconButton
                      color="primary"
                      onClick={c.onAdd}
                      sx={{ ml: 1, flexShrink: 0, border: "1px solid #ddd", borderRadius: 2 }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            ))}

            {/* === Especificaciones === */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Especificaciones</Typography>

              {sugeridos.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>Sugeridos por categoría:</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {sugeridos.map(s => {
                      const active = !!seleccionados.find(x => x.nombre === s.nombre);
                      return (
                        <Chip
                          key={s.nombre}
                          label={s.nombre}
                          onClick={() => {
                            if (active) {
                              setSeleccionados(prev => prev.filter(x => x.nombre !== s.nombre));
                              setValAtributos(prev => { const n = { ...prev }; delete n[s.nombre]; return n; });
                            } else {
                              setSeleccionados(prev => [...prev, s]);
                              setValAtributos(prev => ({ ...prev, [s.nombre]: defaultValueByTipo(s.tipo) }));
                            }
                          }}
                          color={active ? "primary" : "default"}
                          variant={active ? "filled" : "outlined"}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}

              {seleccionados.length > 0 && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {seleccionados.map((a) => (
                    <Grid key={a.nombre} item xs={12} sm={6} md={4}>
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Box sx={{ flex: 1 }}>
                          {renderValorPorTipo(
                            a.tipo,
                            a.nombre,
                            valAtributos[a.nombre],
                            (v) => setValAtributos(prev => ({ ...prev, [a.nombre]: v }))
                          )}
                        </Box>
                        <Tooltip title="Quitar"><IconButton onClick={() => {
                          setSeleccionados(prev => prev.filter(s => s.nombre !== a.nombre));
                          setValAtributos(prev => { const n = { ...prev }; delete n[a.nombre]; return n; });
                        }} size="small"><Close /></IconButton></Tooltip>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Campos personalizados */}
              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <Button size="small" startIcon={<Add />} onClick={() => setOpenAttr(true)}>
                  Nuevo atributo (categoría)
                </Button>
                <Button
                  size="small"
                  startIcon={<Add />}
                  variant="outlined"
                  onClick={() => setCustomFields(prev => [...prev, { key: "", tipo: "texto", valor: "" }])}
                >
                  Campo personalizado
                </Button>
              </Box>

              {customFields.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Campos personalizados</Typography>
                  <Grid container spacing={2}>
                    {customFields.map((row, idx) => (
                      <Grid item xs={12} key={idx}>
                        <Grid container spacing={1} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <TextField
                              label="Clave"
                              fullWidth
                              value={row.key}
                              onChange={(e) =>
                                setCustomFields(prev => prev.map((r, i) => i === idx ? { ...r, key: e.target.value } : r))
                              }
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              select
                              label="Tipo"
                              fullWidth
                              value={row.tipo}
                              onChange={(e) =>
                                setCustomFields(prev => prev.map((r, i) => i === idx ? { ...r, tipo: e.target.value } : r))
                              }
                              SelectProps={{ MenuProps: { PaperProps: { sx: { minWidth: 280 } } } }}
                            >
                              {["texto", "numero", "fecha", "opcion", "multivalor"].map(t => (
                                <MenuItem key={t} value={t}>{t}</MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            {renderValorPorTipo(
                              row.tipo,
                              "Valor",
                              row.valor,
                              (v) => setCustomFields(prev => prev.map((r, i) => i === idx ? { ...r, valor: v } : r))
                            )}
                          </Grid>
                          <Grid item xs={12} sm={1}>
                            <Tooltip title="Quitar"><IconButton color="error" onClick={() => setCustomFields(prev => prev.filter((_, i) => i !== idx))}><Delete /></IconButton></Tooltip>
                          </Grid>
                        </Grid>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </Grid>

            <Grid item xs={12}>
              <Box textAlign="center" mt={2}>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Crear ítem"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Modal: nuevo atributo de categoría */}
      <Dialog open={openAttr} onClose={() => setOpenAttr(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nuevo atributo de categoría</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
          <TextField label="Nombre del atributo" value={attrForm.nombre}
            onChange={(e) => setAttrForm(s => ({ ...s, nombre: e.target.value }))} />
          <TextField select label="Tipo" value={attrForm.tipo}
            onChange={(e) => setAttrForm(s => ({ ...s, tipo: e.target.value }))}>
            {["texto", "numero", "fecha", "opcion", "multivalor"].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          {["opcion", "multivalor"].includes(attrForm.tipo) && (
            <TextField
              label="Opciones (JSON o lista separada por comas)"
              multiline minRows={2}
              value={attrForm.opciones}
              onChange={(e) => setAttrForm(s => ({ ...s, opciones: e.target.value }))}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAttr(false)}>Cancelar</Button>
          <Button variant="contained" onClick={async () => {
            if (!idCategoria) return Swal.fire("Valida", "Selecciona una categoría", "info");
            const nombre = String(attrForm.nombre || "").trim();
            if (!nombre) return Swal.fire("Valida", "Nombre del atributo requerido", "info");
            const tipo = attrForm.tipo || "texto";
            let opciones = null;
            if (["opcion", "multivalor"].includes(tipo)) {
              try { opciones = parseOpciones(attrForm.opciones); } catch { opciones = []; }
            }
            try {
              await crearAtributoCategoria({ idCategoria, nombre, tipo, opciones });
              const atts = await listarAtributosCategoria(idCategoria);
              setSugeridos(atts || []);
              setOpenAttr(false);
              setAttrForm({ nombre: "", tipo: "texto", opciones: "" });
              Swal.fire("Listo", "Atributo creado", "success");
            } catch (e) {
              Swal.fire("Error", e?.response?.data?.mensaje || e?.message, "error");
            }
          }}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </LayoutDashboard>
  );
}
