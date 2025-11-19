import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Divider,
  Slider,
  Chip,
  Tooltip,
  Stack,
  CircularProgress,
} from "@mui/material";
import { Save, Add, Delete, PictureAsPdf } from "@mui/icons-material";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import Swal from "sweetalert2";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?worker";
import { Rnd } from "react-rnd";
import {
  listarPlantillasCert,
  obtenerPlantilla,
  actualizarCamposPlantilla,
  crearPlantilla,
} from "../../services/capacitaciones.service";
import api from "../../services/axios";

pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker();

// Campos predefinidos
const FIELD_PRESETS = [
  { key: "nombre", label: "Nombre", sample: "Nombre Apellido" },
  { key: "titulo", label: "Curso", sample: "Curso de Primeros Auxilios" },
  { key: "tema", label: "Tema", sample: "Inmovilización de extremidades" },
  { key: "fecha", label: "Fecha", sample: "2025-01-01" },
  { key: "nroSerie", label: "Serie", sample: "SERIE-0001" },
  { key: "qr", label: "QR", sample: "QR" },
];

const ALIGN_OPTS = [
  { value: "left", label: "Izquierda" },
  { value: "center", label: "Centro" },
  { value: "right", label: "Derecha" },
];

function buildUrl(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  const base = api?.defaults?.baseURL
    ? api.defaults.baseURL.replace(/\/api\/?$/i, "")
    : "";
  return p.startsWith("/") ? `${base}${p}` : `${base}/${p}`;
}

/** Transformaciones entre coordenadas PDF y coordenadas imagen */
const toImg = (pdfCfg, pdfH, scale) => {
  if (!pdfCfg) return null;
  const { x = 0, y = 0, w, h, size, bold, align = "left" } = pdfCfg;
  return {
    x: x * scale,
    y: (pdfH - y) * scale,
    w: w ? w * scale : undefined,
    h: h ? h * scale : undefined,
    size,
    bold,
    align,
  };
};
const toPdf = (imgCfg, pdfH, scale) => {
  if (!imgCfg) return null;
  const { x = 0, y = 0, w, h, size, bold, align = "left" } = imgCfg;
  return {
    x: x / scale,
    y: pdfH - y / scale,
    w: w ? w / scale : undefined,
    h: h ? h / scale : undefined,
    size,
    bold,
    align,
  };
};

export default function PlantillasAdminPage() {
  const [plantillas, setPlantillas] = useState([]);
  const [selId, setSelId] = useState("");
  const [plantilla, setPlantilla] = useState(null);
  const [pdfW, setPdfW] = useState(0);
  const [pdfH, setPdfH] = useState(0);
  const [pdfImage, setPdfImage] = useState(null);
  const [displayScale, setDisplayScale] = useState(1.2);
  const [snap, setSnap] = useState(5);
  const [camposPdf, setCamposPdf] = useState({});
  const [camposImg, setCamposImg] = useState({});
  const [activo, setActivo] = useState("");
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  // Cargar catálogo inicial
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const arr = await listarPlantillasCert();
        setPlantillas(arr || []);
      } catch {
        Swal.fire("Error", "No se pudo listar plantillas", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** ===========================
   *  PDF renderizado a imagen
   *  =========================== */
  async function loadPageMeta(pdfUrl, scale) {
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale });
    return { page, viewport };
  }
  async function renderToImage(pdfUrl, scale) {
    const { page, viewport } = await loadPageMeta(pdfUrl, scale);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
    return {
      dataUrl: canvas.toDataURL("image/png"),
      width: canvas.width,
      height: canvas.height,
    };
  }

  // Cargar plantilla seleccionada
  useEffect(() => {
    if (!selId) {
      setPlantilla(null);
      setPdfImage(null);
      setCamposPdf({});
      setCamposImg({});
      setActivo("");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const p = await obtenerPlantilla(selId);
        setPlantilla(p);

        const meta = await loadPageMeta(buildUrl(p.archivopdf), 1.0);
        setPdfW(meta.viewport.width);
        setPdfH(meta.viewport.height);

        const campos = p?.campos || {};
        setCamposPdf(campos);

        const img = await renderToImage(buildUrl(p.archivopdf), displayScale);
        setPdfImage(img.dataUrl);

        const mapped = {};
        for (const k of Object.keys(campos))
          mapped[k] = toImg(campos[k], meta.viewport.height, displayScale);
        setCamposImg(mapped);
      } catch (e) {
        console.error(e);
        Swal.fire("Error", "No se pudo cargar la plantilla", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [selId]);

  // Recalcular vista al cambiar el zoom
  useEffect(() => {
    if (!plantilla?.archivopdf || !pdfH) return;
    (async () => {
      const img = await renderToImage(buildUrl(plantilla.archivopdf), displayScale);
      setPdfImage(img.dataUrl);
      const mapped = {};
      for (const k of Object.keys(camposPdf))
        mapped[k] = toImg(camposPdf[k], pdfH, displayScale);
      setCamposImg(mapped);
    })();
  }, [displayScale]);

  /* =====================
     CREAR NUEVA PLANTILLA
     ===================== */
  async function onCrearNueva(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const nombre = form.get("nombre");
    const archivo = form.get("archivo");
    if (!nombre || !archivo?.name)
      return Swal.fire("Atención", "Completa nombre y PDF", "info");
    try {
      const p = await crearPlantilla({ nombre, archivo, campos: {} });
      setPlantillas((prev) => [p, ...prev]);
      setSelId(p.idplantilla);
      Swal.fire("Éxito", "Plantilla creada", "success");
      e.currentTarget.reset();
    } catch (err) {
      const msg =
        err?.response?.data?.mensaje ||
        err?.message ||
        "No se pudo crear la plantilla";
      Swal.fire("Error", msg, "error");
    }
  }

  /* =====================
     CAMPOS
     ===================== */
  function addCampo(key) {
    if (!pdfW || !pdfH) return;
    const isQR = key === "qr";
    const wImg = (isQR ? 120 : 220) * displayScale;
    const hImg = (isQR ? 120 : 44) * displayScale;
    const xImg = Math.round((pdfW * displayScale - wImg) / 2);
    const yImg = Math.round((pdfH * displayScale - hImg) / 2);
    const imgCfg = {
      x: xImg,
      y: yImg,
      w: wImg,
      h: hImg,
      size: isQR ? undefined : 18,
      bold: key === "nombre",
      align: "left",
    };
    setCamposImg((prev) => ({ ...prev, [key]: imgCfg }));
    setCamposPdf((prev) => ({ ...prev, [key]: toPdf(imgCfg, pdfH, displayScale) }));
    setActivo(key);
  }

  function delCampo(key) {
    setCamposImg((p) => {
      const c = { ...p };
      delete c[key];
      return c;
    });
    setCamposPdf((p) => {
      const c = { ...p };
      delete c[key];
      return c;
    });
    if (activo === key) setActivo("");
  }

  async function onGuardar() {
    if (!selId) return;
    try {
      await actualizarCamposPlantilla(Number(selId), camposPdf);
      Swal.fire("Listo", "Posiciones guardadas correctamente", "success");
    } catch {
      Swal.fire("Error", "No se pudieron guardar los cambios", "error");
    }
  }

  /* =====================
     INTERFAZ VISUAL
     ===================== */
  const bgStyle = useMemo(
    () => ({
      position: "relative",
      display: "inline-block",
      backgroundImage: pdfImage ? `url("${pdfImage}")` : "none",
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      width: `${pdfW * displayScale}px`,
      height: `${pdfH * displayScale}px`,
      boxShadow: "0 0 0 1px rgba(0,0,0,.1) inset",
      outline: "none",
    }),
    [pdfImage, pdfW, pdfH, displayScale]
  );

  const boxStyle = (active) => ({
    border: `1px dashed ${active ? "#1976d2" : "#888"}`,
    background: active ? "rgba(25,118,210,0.08)" : "rgba(0,0,0,0.05)",
  });

  const sampleFor = (k) => FIELD_PRESETS.find((f) => f.key === k)?.sample || k;
  const labelFor = (k) => FIELD_PRESETS.find((f) => f.key === k)?.label || k;

  if (loading) {
    return (
      <LayoutDashboard>
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 240 }}>
          <CircularProgress />
        </Box>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard>
      <Typography variant="h5" gutterBottom>
        Plantillas de Certificados
      </Typography>

      {/* Crear nueva */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <form onSubmit={onCrearNueva}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                name="nombre"
                label="Nombre de la plantilla"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <Button variant="outlined" component="label" startIcon={<PictureAsPdf />}>
                Subir PDF
                <input
                  type="file"
                  name="archivo"
                  accept="application/pdf,.pdf"
                  hidden
                />
              </Button>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button type="submit" variant="contained" fullWidth>
                Crear
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Selector y controles */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              select
              label="Seleccionar plantilla"
              value={selId || ""}
              onChange={(e) => setSelId(e.target.value)}
              fullWidth
            >
              {plantillas.map((p) => (
                <MenuItem key={p.idplantilla} value={p.idplantilla}>
                  {p.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="caption">Zoom</Typography>
            <Slider
              min={0.8}
              max={2}
              step={0.1}
              value={displayScale}
              onChange={(_, v) => setDisplayScale(v)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="caption">Snap</Typography>
            <Slider
              min={0}
              max={20}
              step={1}
              value={snap}
              onChange={(_, v) => setSnap(v)}
            />
          </Grid>
          <Grid item xs={12} md={2} display="flex" justifyContent="flex-end">
            <Button
              startIcon={<Save />}
              variant="contained"
              onClick={onGuardar}
              disabled={!selId}
            >
              Guardar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Añadir campos */}
      <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
        {FIELD_PRESETS.map((f) => (
          <Chip
            key={f.key}
            label={`Añadir ${f.label}`}
            onClick={() => addCampo(f.key)}
            color={activo === f.key ? "primary" : "default"}
            variant={activo === f.key ? "filled" : "outlined"}
          />
        ))}
      </Box>

      {/* Lienzo */}
      <Paper sx={{ p: 2, overflow: "auto" }}>
        {!pdfImage ? (
          <Typography color="text.secondary">
            Selecciona una plantilla para editar.
          </Typography>
        ) : (
          <Box sx={bgStyle} ref={canvasRef}>
            {Object.entries(camposImg).map(([k, cfg]) => {
              const isQR = k === "qr";
              const w = cfg.w ?? (isQR ? 120 : 260) * displayScale;
              const h = cfg.h ?? (isQR ? 120 : 54) * displayScale;
              return (
                <Rnd
                  key={k}
                  bounds="parent"
                  size={{ width: w, height: h }}
                  position={{ x: cfg.x || 0, y: cfg.y || 0 }}
                  onClick={() => setActivo(k)}
                  onDragStop={(_, d) => {
                    const X = snap ? Math.round(d.x / snap) * snap : d.x;
                    const Y = snap ? Math.round(d.y / snap) * snap : d.y;
                    const imgCfg = { ...camposImg[k], x: X, y: Y };
                    setCamposImg((p) => ({ ...p, [k]: imgCfg }));
                    setCamposPdf((p) => ({
                      ...p,
                      [k]: toPdf(imgCfg, pdfH, displayScale),
                    }));
                  }}
                  style={boxStyle(activo === k)}
                >
                  <Box
                    sx={{
                      p: 0.5,
                      fontSize: 12,
                      color: "#0d47a1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <b>{labelFor(k)}</b>
                    <Tooltip title="Eliminar campo">
                      <IconButton size="small" onClick={() => delCampo(k)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box
                    sx={{
                      px: 0.5,
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        cfg.align === "center"
                          ? "center"
                          : cfg.align === "right"
                          ? "flex-end"
                          : "flex-start",
                      fontSize: (cfg.size || 18) * (displayScale / 1.2),
                      fontWeight: cfg.bold ? 700 : 400,
                      color: "#000",
                    }}
                  >
                    {isQR ? "QR" : sampleFor(k)}
                  </Box>
                </Rnd>
              );
            })}
          </Box>
        )}
      </Paper>
    </LayoutDashboard>
  );
}
