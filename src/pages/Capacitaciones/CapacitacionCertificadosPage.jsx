import {
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Button,
  Box,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Stack,
  Divider,
} from "@mui/material";
import {
  PictureAsPdf,
  Download,
  Block,
  Add,
  WorkspacePremium,
} from "@mui/icons-material";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  obtenerCapacitacion,
  listarCertificados,
  emitirCertificados,
  anularCertificado,
  listarPlantillasCertificados,
  listarPersonalAsignado,
  listarPersonasExternas,
  descargarCertificado,
  urlVerCertificadoPublic,
} from "../../services/capacitaciones.service";
import { exportTablePdf } from "../../utils/pdfExport";

const safeArr = (x) => (Array.isArray(x) ? x : []);
const rowKey = (r) =>
  r?.idcertificado ??
  `${r?.tipoparticipante}-${r?.idreferencia}-${r?.nombremostrado}`;

export default function CapacitacionCertificadosPage() {
  const { id } = useParams();
  const idCap = Number(id);
  const navigate = useNavigate();

  const [cap, setCap] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // emisión
  const [openEmit, setOpenEmit] = useState(false);
  const [tipo, setTipo] = useState("personal"); // 'personal' | 'externo'
  const [catalogo, setCatalogo] = useState([]);
  const [seleccion, setSeleccion] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [idPlantilla, setIdPlantilla] = useState("");
  const [horas, setHoras] = useState("");
  const [saving, setSaving] = useState(false);

  const rowsRef = useRef([]);
  rowsRef.current = rows;

  /* -------- Cargar datos -------- */
  const cargar = async () => {
    try {
      setLoading(true);
      const [c, lista] = await Promise.all([
        obtenerCapacitacion(idCap),
        listarCertificados(idCap),
      ]);
      if (!c) {
        Swal.fire("Aviso", "Capacitación no encontrada", "warning");
        return navigate("/capacitaciones");
      }
      setCap(c);
      setRows(safeArr(lista));
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e.message, "error");
      navigate("/capacitaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------- Emitir certificados -------- */
  const abrirEmitir = async (nuevoTipo) => {
    try {
      setTipo(nuevoTipo);
      setSeleccion([]);
      const [cat, plats] = await Promise.all([
        nuevoTipo === "personal"
          ? listarPersonalAsignado(idCap)
          : listarPersonasExternas(idCap),
        listarPlantillasCertificados(),
      ]);
      setCatalogo(safeArr(cat));
      setPlantillas(safeArr(plats));
      setIdPlantilla(
        plats?.[0]?.idplantilla || plats?.[0]?.idPlantilla || ""
      );
      setOpenEmit(true);
    } catch {
      Swal.fire("Error", "No se pudo cargar catálogos para emitir", "error");
    }
  };
  const cerrarEmitir = () => setOpenEmit(false);

  const onEmitir = async () => {
    if (seleccion.length === 0)
      return Swal.fire("Valida", "Selecciona al menos un participante", "info");

    setSaving(true);
    try {
      const participantes = seleccion.map((x) => ({
        tipo: tipo === "personal" ? "interno" : "externo",
        id: x.idpersonal || x.idpersona,
        nombreMostrado: x.nombreMostrado || undefined,
      }));

      await emitirCertificados({
        idCapacitacion: idCap,
        idPlantilla: idPlantilla ? Number(idPlantilla) : null,
        participantes,
        camposExtra: { horas: horas ? Number(horas) : undefined },
      });

      cerrarEmitir();
      await cargar();
      Swal.fire("Éxito", "Certificados emitidos correctamente", "success");
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const onAnular = async (row) => {
    if (!row || row.anulado) return;
    const ok = await Swal.fire({
      title: "¿Anular certificado?",
      text: `Serie: ${row.nroserie || row.nroSerie || "(sin serie)"}`,
      icon: "warning",
      showCancelButton: true,
    });
    if (!ok.isConfirmed) return;
    try {
      const idCert = row.idcertificado ?? row.idCertificado;
      await anularCertificado(idCert);
      await cargar();
      Swal.fire("Listo", "Certificado anulado", "success");
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e.message, "error");
    }
  };

  const onDescargar = async (row) => {
    try {
      const idCert = row?.idcertificado ?? row?.idCertificado;
      if (!idCert) return;
      await descargarCertificado(idCert);
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e.message, "error");
    }
  };

  const onExport = () => {
    const columns = [
      { header: "Nombre", dataKey: "nombre" },
      { header: "Tipo", dataKey: "tipo" },
      { header: "Fecha", dataKey: "fecha" },
      { header: "Nro. Serie", dataKey: "nroSerie" },
      { header: "Estado", dataKey: "estado" },
      { header: "PDF", dataKey: "pdf" },
    ];
    const rowsData = safeArr(rowsRef.current).map((r) => ({
      nombre: r.nombremostrado || r.nombreMostrado || "",
      tipo: r.tipoparticipante || "",
      fecha: r.fecha || "",
      nroSerie: r.nroserie || r.nroSerie || "",
      estado: r.anulado ? "ANULADO" : "Vigente",
      pdf: r.archivopdf || r.archivoPDF || "",
    }));
    exportTablePdf({
      title: "Certificados por capacitación",
      subtitle: cap
        ? `${cap.titulo || cap.titulo_resuelto || "Capacitación"} — ID ${idCap}`
        : "",
      columns,
      rows: rowsData,
      filename: `certificados-cap-${idCap}.pdf`,
      orientation: "landscape",
    });
  };

  /* -------- Render -------- */
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
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        mb={2}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <WorkspacePremium color="primary" />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Certificados
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {cap?.titulo_resuelto || cap?.titulo || "—"}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={onExport}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => abrirEmitir("personal")}
          >
            Emitir (Internos)
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Add />}
            onClick={() => abrirEmitir("externo")}
          >
            Emitir (Externos)
          </Button>
        </Stack>
      </Box>

      {/* Info chips */}
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Box
          sx={{
            mb: 2,
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Chip
            label={`Solicitud: ${String(
              cap?.fechasolicitud || cap?.fecha || "—"
            ).slice(0, 10)}`}
          />
          <Chip
            color="primary"
            label={`Inicio: ${String(cap?.fechainicio || "—").slice(0, 10)}`}
          />
          <Chip
            color="secondary"
            label={`Fin: ${String(cap?.fechafin || "—").slice(0, 10)}`}
          />
        </Box>

        {/* Tabla */}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Nro. Serie</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {safeArr(rows).map((r) => {
              const idCert = r?.idcertificado ?? r?.idCertificado;
              return (
                <TableRow key={rowKey(r)} hover>
                  <TableCell>
                    {r.nombremostrado || r.nombreMostrado || "—"}
                  </TableCell>
                  <TableCell>{r.tipoparticipante || "—"}</TableCell>
                  <TableCell>{r.fecha || "—"}</TableCell>
                  <TableCell>{r.nroserie || r.nroSerie || "—"}</TableCell>
                  <TableCell>
                    {r.anulado ? (
                      <Chip size="small" color="error" label="ANULADO" />
                    ) : (
                      <Chip size="small" color="success" label="Vigente" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {idCert && (
                      <>
                        <Tooltip title="Ver certificado (QR público)">
                          <IconButton
                            component="a"
                            href={urlVerCertificadoPublic(idCert)}
                            target="_blank"
                            rel="noreferrer"
                            size="small"
                          >
                            <Download fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Descargar PDF">
                          <IconButton
                            onClick={() => onDescargar(r)}
                            size="small"
                          >
                            <PictureAsPdf fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                        {!r.anulado && (
                          <Tooltip title="Anular certificado">
                            <IconButton
                              onClick={() => onAnular(r)}
                              size="small"
                              color="error"
                            >
                              <Block fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    No hay certificados emitidos
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Modal emisión */}
      <Dialog open={openEmit} onClose={cerrarEmitir} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Add />
            <span>
              Emitir certificados —{" "}
              {tipo === "personal" ? "Internos" : "Externos"}
            </span>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Autocomplete
            multiple
            options={catalogo}
            getOptionLabel={(o) =>
              `${o?.nombreMostrado || o?.nombre || ""} ${
                o?.apellido || ""
              }`.trim() || "(sin nombre)"
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Selecciona participantes"
                placeholder="Buscar..."
              />
            )}
            value={seleccion}
            onChange={(_e, v) => setSeleccion(v)}
          />

          <Box display="flex" gap={2} mt={3}>
            <TextField
              select
              fullWidth
              label="Plantilla"
              value={idPlantilla}
              onChange={(e) => setIdPlantilla(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="">(sin plantilla)</option>
              {plantillas.map((p) => (
                <option
                  key={p.idplantilla || p.idPlantilla}
                  value={p.idplantilla || p.idPlantilla}
                >
                  {p.nombre}
                </option>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Horas (opcional)"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
              type="number"
              inputProps={{ min: 0 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={cerrarEmitir}>Cancelar</Button>
          <Button variant="contained" onClick={onEmitir} disabled={saving}>
            {saving ? "Emitiendo..." : "Emitir certificados"}
          </Button>
        </DialogActions>
      </Dialog>
    </LayoutDashboard>
  );
}
