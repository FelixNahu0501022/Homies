// src/pages/Inventario/InventarioEditarPage.jsx
import {
  Typography, Paper, TextField, Button, Box, Grid, MenuItem,
  CircularProgress, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Chip
} from "@mui/material";
import { Add, Delete, Close } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  obtenerItem, editarItem,
  listarCategorias, crearCategoria,
  listarUnidades, crearUnidad,
  listarUbicaciones, crearUbicacion,
  listarProveedores, crearProveedor,
  listarAtributosCategoria, crearAtributoCategoria,
} from "../../services/inventario.service";

const ESTADOS = ["Disponible", "Asignado", "Dañado", "Agotado", "Dado de baja"];

export default function InventarioEditarPage() {
  const { id } = useParams();
  const idNum = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const { control, handleSubmit, formState:{errors,isSubmitting}, reset, setValue, watch } = useForm({
    defaultValues: {
      nombre:"", descripcion:"", cantidad:0, estado:"Disponible",
      idCategoria:"", idUnidad:"", idUbicacion:"", idProveedor:""
    }
  });

  const [categorias, setCategorias]   = useState([]);
  const [unidades, setUnidades]       = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [sugeridos, setSugeridos]       = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [valAtributos, setValAtributos] = useState({});
  const [customFields, setCustomFields] = useState([]);

  const [openAttr, setOpenAttr] = useState(false);
  const [attrForm, setAttrForm] = useState({ nombre: "", tipo: "texto", opciones: "" });
  const idCategoria = watch("idCategoria");

  const defaultValueByTipo = useCallback((t) => {
    switch ((t || "").toLowerCase()) {
      case "numero": return "";
      case "fecha": return "";
      case "opcion": return "";
      case "multivalor": return [];
      default: return "";
    }
  }, []);

  const parseOpciones = useCallback((op) => {
    if (!op) return [];
    if (Array.isArray(op)) return op;
    try {
      const arr = JSON.parse(op);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return String(op).split(",").map(s => s.trim()).filter(Boolean);
    }
  }, []);

  const inferTipoFromValue = (v) => {
    if (Array.isArray(v)) return "multivalor";
    if (typeof v === "number") return "numero";
    if (typeof v === "string") {
      const s = v.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return "fecha";
      return "texto";
    }
    return "texto";
  };

  useEffect(() => {
    (async () => {
      try {
        if (!id || Number.isNaN(idNum)) {
          Swal.fire("Aviso","ID inválido","warning");
          return navigate("/inventario");
        }
        const [it, cats, unis, ubis, provs] = await Promise.all([
          obtenerItem(idNum), listarCategorias(), listarUnidades(), listarUbicaciones(), listarProveedores(),
        ]);
        if (!it) {
          Swal.fire("Aviso","Ítem no encontrado","warning");
          return navigate("/inventario");
        }

        setCategorias(cats||[]); setUnidades(unis||[]); setUbicaciones(ubis||[]); setProveedores(provs||[]);

        const idCat = it.idCategoria ?? it.idcategoria ?? "";
        const idUni = it.idUnidad ?? it.idunidad ?? "";
        const idUbi = it.idUbicacion ?? it.idubicacion ?? "";
        const idProv = it.idProveedor ?? it.idproveedor ?? "";

        reset({
          nombre: it.nombre ?? "",
          descripcion: it.descripcion ?? "",
          cantidad: Number(it.cantidad ?? 0),
          estado: it.estado ?? "Disponible",
          idCategoria: idCat || "",
          idUnidad: idUni || "",
          idUbicacion: idUbi || "",
          idProveedor: idProv || "",
        });

        let espec = it.especificaciones;
        try { if (typeof espec === "string") espec = JSON.parse(espec || "{}"); } catch { espec = {}; }
        if (!espec || typeof espec !== "object" || Array.isArray(espec)) espec = {};

        if (idCat) {
          const atts = await listarAtributosCategoria(idCat);
          setSugeridos(atts || []);
          const sugeridosByName = new Map((atts || []).map(a => [String(a.nombre), a]));

          const preSeleccionados = [];
          const vals = {};
          for (const [k, v] of Object.entries(espec)) {
            const def = sugeridosByName.get(k);
            if (def) {
              preSeleccionados.push(def);
              vals[k] = Array.isArray(v) ? v.join(", ") : (v ?? defaultValueByTipo(def.tipo));
            }
          }
          setSeleccionados(preSeleccionados);

          const personalizados = Object.entries(espec)
            .filter(([k]) => !sugeridosByName.has(k))
            .map(([k, v]) => ({
              key: k,
              tipo: inferTipoFromValue(v),
              valor: Array.isArray(v) ? v.join(", ") : (v ?? ""),
            }));
          setCustomFields(personalizados);
          setValAtributos(vals);
        } else {
          const personalizados = Object.entries(espec).map(([k, v]) => ({
            key: k,
            tipo: inferTipoFromValue(v),
            valor: Array.isArray(v) ? v.join(", ") : (v ?? ""),
          }));
          setCustomFields(personalizados);
        }
      } catch (e) {
        Swal.fire("Error", e?.response?.data?.mensaje || e?.message, "error");
        navigate("/inventario");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, idNum, navigate, reset, defaultValueByTipo]);

  useEffect(() => {
    (async () => {
      if (!idCategoria) {
        setSugeridos([]); setSeleccionados([]); setValAtributos({});
        return;
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

  const addSugerido = (a) => {
    if (seleccionados.find(s => s.nombre === a.nombre)) return;
    setSeleccionados(prev => [...prev, a]);
    setValAtributos(prev => ({ ...prev, [a.nombre]: defaultValueByTipo(a.tipo) }));
  };
  const removeSugerido = (nombre) => {
    setSeleccionados(prev => prev.filter(s => s.nombre !== nombre));
    setValAtributos(prev => { const n = { ...prev }; delete n[nombre]; return n; });
  };

  const setCustomField = (idx, patch) => {
    setCustomFields(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };

  const renderValorPorTipo = (tipo, label, valor, onChange) => {
    const t = (tipo || "").toLowerCase();
    const menuProps = { PaperProps: { sx: { minWidth: 360, maxWidth: 720 } } };

    if (t === "numero")
      return <TextField type="number" label={label} value={valor ?? ""} onChange={(e)=>onChange(e.target.value)} fullWidth />;

    if (t === "fecha")
      return <TextField type="date" label={label} InputLabelProps={{shrink:true}} value={valor ?? ""} onChange={(e)=>onChange(e.target.value)} fullWidth />;

    if (t === "opcion") {
      const opciones = parseOpciones(seleccionados.find(s => s.nombre === label)?.opciones);
      return (
        <TextField select label={label} fullWidth value={valor ?? ""} onChange={(e)=>onChange(e.target.value)} SelectProps={{ MenuProps: menuProps }}>
          <MenuItem value={""}>—</MenuItem>
          {opciones.map(o => (
            <MenuItem
              key={String(o)}
              value={o}
              sx={{ whiteSpace:"normal", wordBreak:"break-word", alignItems:"flex-start", py:1 }}
            >
              {String(o)}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    if (t === "multivalor")
      return <TextField label={`${label} (lista separada por comas)`} fullWidth value={valor ?? ""} onChange={(e)=>onChange(e.target.value)} />;

    return <TextField label={label} fullWidth value={valor ?? ""} onChange={(e)=>onChange(e.target.value)} />;
  };

  const renderCustomValueField = (row, idx) => {
    const tipo = (row.tipo || "").toLowerCase();
    if (tipo === "numero")
      return <TextField type="number" label="Valor" fullWidth value={row.valor ?? ""} onChange={(e)=>setCustomField(idx, { valor:e.target.value })} />;
    if (tipo === "fecha")
      return <TextField type="date" label="Valor" fullWidth InputLabelProps={{shrink:true}} value={row.valor ?? ""} onChange={(e)=>setCustomField(idx, { valor:e.target.value })} />;
    if (tipo === "multivalor")
      return <TextField label="Valor (lista separada por comas)" fullWidth value={row.valor ?? ""} onChange={(e)=>setCustomField(idx, { valor:e.target.value })} />;
    return <TextField label="Valor" fullWidth value={row.valor ?? ""} onChange={(e)=>setCustomField(idx, { valor:e.target.value })} />;
  };

  const onSubmit = async (form) => {
    try {
      const espec = {};

      for (const s of seleccionados) {
        let v = valAtributos[s.nombre];
        const t = (s.tipo || "").toLowerCase();
        if (t === "numero") {
          const n = Number(v);
          if (!Number.isFinite(n)) continue;
          v = n;
        } else if (t === "multivalor") {
          v = String(v || "").split(",").map(x=>x.trim()).filter(Boolean);
        } else if (t === "fecha") {
          const vv = String(v || "").trim();
          if (!vv) continue;
          v = vv;
        } else {
          v = String(v ?? "");
        }
        espec[s.nombre] = v;
      }

      for (const row of customFields) {
        const key = String(row.key || "").trim();
        if (!key) continue;
        let valor = row.valor;
        const tipo = (row.tipo || "texto").toLowerCase();
        if (tipo === "numero") {
          const n = Number(valor);
          if (!Number.isFinite(n)) continue;
          valor = n;
        } else if (tipo === "multivalor") {
          valor = String(valor || "").split(",").map(s => s.trim()).filter(Boolean);
        } else if (tipo === "fecha") {
          const v = String(valor || "").trim();
          if (!v) continue;
          valor = v;
        } else {
          valor = String(valor ?? "");
        }
        espec[key] = valor;
      }

      const payload = {
        nombre: String(form.nombre || "").trim(),
        descripcion: String(form.descripcion || "").trim(),
        cantidad: Number(form.cantidad || 0),
        estado: form.estado || "Disponible",
        idCategoria: form.idCategoria || null,
        idUnidad: form.idUnidad || null,
        idUbicacion: form.idUbicacion || null,
        idProveedor: form.idProveedor || null,
        ...(Object.keys(espec).length ? { especificaciones: espec } : { especificaciones: null }),
      };

      await editarItem(idNum, payload);
      Swal.fire("Éxito","Ítem actualizado correctamente","success");
      navigate("/inventario");
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.mensaje || err?.message, "error");
    }
  };

  if (loading) {
    return (
      <LayoutDashboard>
        <Box sx={{ display:"grid", placeItems:"center", minHeight:280 }}>
          <CircularProgress/>
        </Box>
      </LayoutDashboard>
    );
  }

  // 🔧 Configuración de selects con manejadores “+” CORREGIDOS
  const selects = [
    {
      label: "Categoría",
      data: categorias,
      key: "idCategoria",
      idKey: "idcategoria",
      createPrompt: "Nueva categoría",
      onAdd: async (nombre) => crearCategoria(nombre),
      reload: listarCategorias,
      setAll: setCategorias,
    },
    {
      label: "Unidad",
      data: unidades,
      key: "idUnidad",
      idKey: "idunidad",
      createPrompt: "Nueva unidad",
      onAdd: async (nombre) => crearUnidad(nombre),
      reload: listarUnidades,
      setAll: setUnidades,
    },
    {
      label: "Ubicación (raíz)",
      data: ubicaciones,
      key: "idUbicacion",
      idKey: "idubicacion",
      createPrompt: "Nueva ubicación (nivel raíz)",
      onAdd: async (nombre) => crearUbicacion({ nombre }),
      reload: listarUbicaciones,
      setAll: setUbicaciones,
    },
    {
      label: "Proveedor",
      data: proveedores,
      key: "idProveedor",
      idKey: "idproveedor",
      createPrompt: "Nuevo proveedor",
      onAdd: async (nombre) => crearProveedor({ nombre }),
      reload: listarProveedores,
      setAll: setProveedores,
    },
  ];

  return (
    <LayoutDashboard>
      <Typography variant="h5" gutterBottom>Editar ítem de inventario</Typography>
      <Paper sx={{ p:4, mt:2 }}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2}>
            {/* Nombre */}
            <Grid item xs={12} sm={8}>
              <Controller
                name="nombre"
                control={control}
                rules={{ required:"El nombre es obligatorio" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre"
                    fullWidth
                    InputProps={{ readOnly:true }}
                    error={!!errors.nombre}
                    helperText={errors.nombre?.message || "Usa el botón para cambiar el nombre"}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={async () => {
                  const { value:nuevo } = await Swal.fire({
                    title:"Cambiar nombre",
                    input:"text",
                    inputLabel:"Nombre",
                    inputPlaceholder:"Ej. Guantes de intervención",
                    showCancelButton:true,
                    confirmButtonText:"Usar nombre",
                    cancelButtonText:"Cancelar",
                    inputValidator: (v) => (!v || !String(v).trim() ? "Ingresa un nombre" : undefined),
                  });
                  if (nuevo) setValue("nombre", String(nuevo).trim());
                }}
              >
                Cambiar nombre
              </Button>
            </Grid>

            {/* Cantidad / Estado */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="cantidad"
                control={control}
                rules={{ required:"La cantidad es obligatoria", validate:v => Number(v) >= 0 || "Debe ser ≥ 0" }}
                render={({ field }) => (
                  <TextField {...field} type="number" label="Cantidad" fullWidth inputProps={{ min:0 }}
                    error={!!errors.cantidad} helperText={errors.cantidad?.message} />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <TextField select fullWidth label="Estado" {...field}>
                    {ESTADOS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => <TextField {...field} label="Descripción" fullWidth multiline minRows={2} />}
              />
            </Grid>

            {/* Selects de catálogos (con + corregido) */}
            {selects.map((c) => (
              <Grid item xs={12} sm={6} key={c.key}>
                <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
                  <Box sx={{ flexGrow:1 }}>
                    <Controller
                      name={c.key}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          select
                          fullWidth
                          label={c.label}
                          {...field}
                          SelectProps={{ MenuProps:{ PaperProps:{ sx:{ minWidth:360, maxWidth:720 } } } }}
                        >
                          <MenuItem value="">{String("—")}</MenuItem>
                          {c.data.map(d => {
                            const idVal = d[c.idKey] ?? d[c.key];
                            const nom   = d.nombre ?? String(idVal);
                            return (
                              <MenuItem
                                key={String(idVal)}
                                value={idVal}
                                sx={{ whiteSpace:"normal", wordBreak:"break-word", alignItems:"flex-start", py:1 }}
                              >
                                {nom}
                              </MenuItem>
                            );
                          })}
                        </TextField>
                      )}
                    />
                  </Box>
                  <Tooltip title={`Agregar ${c.label.toLowerCase()}`}>
                    <IconButton
                      onClick={async () => {
                        const { value:nombre } = await Swal.fire({
                          title: c.createPrompt,
                          input: "text",
                          inputLabel: "Nombre",
                          showCancelButton: true,
                          confirmButtonText: "Guardar",
                          cancelButtonText: "Cancelar",
                          inputValidator: (v) => (!v ? "Ingresa un nombre" : undefined),
                        });
                        if (!nombre) return;
                        try {
                          const creado = await c.onAdd(String(nombre).trim());
                          c.setAll(await c.reload());
                          const idCreado = creado?.[c.idKey] ?? creado?.[c.key];
                          if (idCreado != null) setValue(c.key, idCreado);
                        } catch (e) {
                          Swal.fire("Error", e?.response?.data?.mensaje || e?.message, "error");
                        }
                      }}
                      color="primary"
                    >
                      <Add />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            ))}

            {/* Especificaciones */}
            <Grid item xs={12}>
              <Divider sx={{ my:2 }}/>
              <Typography variant="h6" gutterBottom>Especificaciones</Typography>

              {sugeridos.length>0 && (
                <Box sx={{ mb:2 }}>
                  <Typography variant="body2">Sugeridos por categoría (elige cuáles aplicar):</Typography>
                  <Box sx={{ display:"flex", flexWrap:"wrap", gap:1, mt:1 }}>
                    {sugeridos.map(s => {
                      const active = seleccionados.find(x=>x.nombre===s.nombre);
                      return (
                        <Chip
                          key={s.nombre}
                          label={s.nombre}
                          onClick={()=>addSugerido(s)}
                          color={active ? "primary" : "default"}
                          variant={active ? "filled" : "outlined"}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}

              {seleccionados.length>0 && (
                <Grid container spacing={2}>
                  {seleccionados.map(a=>(
                    <Grid key={a.nombre} item xs={12} sm={6} md={4}>
                      <Box sx={{ display:"flex", gap:1, alignItems:"center" }}>
                        <Box sx={{ flex:1 }}>
                          {renderValorPorTipo(a.tipo, a.nombre, valAtributos[a.nombre],
                            (v)=>setValAtributos(prev=>({...prev,[a.nombre]:v})))}
                        </Box>
                        <Tooltip title="Quitar">
                          <IconButton onClick={()=>removeSugerido(a.nombre)} size="small"><Close/></IconButton>
                        </Tooltip>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}

              <Box sx={{ display:"flex", gap:1, mt:2 }}>
                <Button size="small" startIcon={<Add/>} onClick={()=>setOpenAttr(true)}>
                  Nuevo atributo (categoría)
                </Button>
                <Button
                  size="small"
                  startIcon={<Add/>}
                  variant="outlined"
                  onClick={()=>setCustomFields(prev=>[...prev,{ key:"", tipo:"texto", valor:"" }])}
                >
                  Campo personalizado
                </Button>
              </Box>

              {customFields.length>0 && (
                <>
                  <Divider sx={{ my:2 }}/>
                  <Typography variant="subtitle2" sx={{ mb:1 }}>Campos personalizados (solo este ítem)</Typography>
                  <Grid container spacing={2}>
                    {customFields.map((row,idx)=>(
                      <Grid item xs={12} key={idx}>
                        <Grid container spacing={1} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <TextField
                              label="Clave"
                              placeholder="ej: color_interno"
                              fullWidth
                              value={row.key}
                              onChange={(e)=>setCustomField(idx,{ key:e.target.value })}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              select
                              label="Tipo"
                              fullWidth
                              value={row.tipo}
                              onChange={(e)=>setCustomField(idx,{ tipo:e.target.value, valor: defaultValueByTipo(e.target.value) })}
                            >
                              {["texto","numero","fecha","opcion","multivalor"].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </TextField>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            {renderCustomValueField(row, idx)}
                          </Grid>
                          <Grid item xs={12} sm={1}>
                            <Tooltip title="Quitar">
                              <IconButton color="error" onClick={()=>setCustomFields(prev=>prev.filter((_,i)=>i!==idx))}><Delete/></IconButton>
                            </Tooltip>
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
                  {isSubmitting ? "Guardando..." : "Guardar cambios"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Modal: nuevo atributo (categoría) */}
      <Dialog open={openAttr} onClose={()=>setOpenAttr(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nuevo atributo (categoría)</DialogTitle>
        <DialogContent sx={{ display:"grid", gap:2, pt:2 }}>
          <TextField label="Nombre del atributo" value={attrForm.nombre} onChange={(e)=>setAttrForm(s=>({...s, nombre:e.target.value}))} />
          <TextField select label="Tipo" value={attrForm.tipo} onChange={(e)=>setAttrForm(s=>({...s, tipo:e.target.value}))}>
            {["texto","numero","fecha","opcion","multivalor"].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          {["opcion","multivalor"].includes(attrForm.tipo) && (
            <TextField
              label="Opciones (JSON de array o lista separada por comas)"
              placeholder='["S","M","L"]  o  S,M,L'
              value={attrForm.opciones}
              onChange={(e)=>setAttrForm(s=>({...s, opciones:e.target.value}))}
              multiline minRows={2}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenAttr(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const catId = watch("idCategoria");
              if (!catId) return Swal.fire("Valida","Selecciona una categoría","info");
              const nombre = String(attrForm.nombre||"").trim();
              if (!nombre) return Swal.fire("Valida","Nombre del atributo requerido","info");
              const tipo = attrForm.tipo || "texto";
              let opciones = null;
              if (["opcion","multivalor"].includes(tipo)) opciones = parseOpciones(attrForm.opciones);
              try {
                await crearAtributoCategoria({ idCategoria: catId, nombre, tipo, opciones });
                const atts = await listarAtributosCategoria(catId);
                setSugeridos(atts || []);
                Swal.fire("Listo","Atributo creado","success");
                setOpenAttr(false);
                setAttrForm({ nombre:"", tipo:"texto", opciones:"" });
              } catch (e) {
                Swal.fire("Error", e?.response?.data?.mensaje || e?.message, "error");
              }
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </LayoutDashboard>
  );
}
