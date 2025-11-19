import {
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Box,
  CircularProgress,
  Divider,
  Button,
  Snackbar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Chip,
  useMediaQuery,
  InputAdornment,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import { useEffect, useMemo, useState } from "react";
import {
  listarPermisos,
  verPermisosDeRol,
  asignarPermisoARol,
  quitarPermisoDeRol,
} from "../../services/permisos.service";
import { obtenerRol } from "../../services/roles.service";

/**
 * Componente embebible para asignar permisos a un rol.
 * - Si `embedded` es true, se usa dentro de un Dialog (sin LayoutDashboard).
 * - Se infiere la "categoría" a partir del sufijo del nombre del permiso:
 *   - p.ej.: ver_usuarios, crear_usuarios, editar_usuarios → grupo "Usuarios"
 */
export default function RolPermisosPage({ idRol, embedded = false, onClose }) {
  const [rol, setRol] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [asignados, setAsignados] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [query, setQuery] = useState("");
  const isMobile = useMediaQuery("(max-width:700px)");

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    const cargar = async () => {
      try {
        const [r, todos, delRol] = await Promise.all([
          obtenerRol(idRol),
          listarPermisos(),
          verPermisosDeRol(idRol),
        ]);
        setRol(r);
        setPermisos(Array.isArray(todos) ? todos : []);
        setAsignados(new Set((delRol || []).map((p) => p.idpermiso)));
      } catch (err) {
        console.error("Error al cargar permisos:", err);
        showSnackbar("Error al cargar datos del rol/permisos", "error");
        onClose?.();
      } finally {
        setLoading(false);
      }
    };
    if (idRol) cargar();
  }, [idRol, onClose]);

  const isChecked = (idpermiso) => asignados.has(idpermiso);

  const togglePermiso = async (perm) => {
    const idPermiso = perm.idpermiso;
    const estaba = asignados.has(idPermiso);

    // Optimista
    const prev = new Set(asignados);
    const next = new Set(asignados);
    if (estaba) next.delete(idPermiso);
    else next.add(idPermiso);
    setAsignados(next);

    try {
      if (estaba) {
        await quitarPermisoDeRol({ idRol, idPermiso });
        showSnackbar(`Permiso "${perm.nombre}" removido`, "info");
      } else {
        await asignarPermisoARol({ idRol, idPermiso });
        showSnackbar(`Permiso "${perm.nombre}" asignado`, "success");
      }
    } catch (err) {
      // Revertir
      setAsignados(prev);
      showSnackbar("No se pudo actualizar el permiso", "error");
    }
  };

  // Inferir categoría por sufijo del nombre: ver_usuarios → "Usuarios"
  const inferGrupo = (perm) => {
    const base = String(perm?.nombre || "").trim();
    if (!base.includes("_")) return "General";
    const parts = base.split("_");
    const last = parts[parts.length - 1] || "General";
    // Capitaliza (usuarios → Usuarios)
    return last.charAt(0).toUpperCase() + last.slice(1);
  };

  // Filtro por búsqueda (nombre/descripcion)
  const permisosFiltrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return permisos;
    return permisos.filter(
      (p) =>
        String(p.nombre || "").toLowerCase().includes(q) ||
        String(p.descripcion || "").toLowerCase().includes(q)
    );
  }, [permisos, query]);

  // Agrupar por grupo inferido
  const grupos = useMemo(() => {
    const map = new Map();
    for (const perm of permisosFiltrados) {
      const g = inferGrupo(perm);
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(perm);
    }
    // Ordenar grupos alfabéticamente
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [permisosFiltrados]);

  // Estados de "operación por grupo" para deshabilitar botones mientras corre
  const [groupBusy, setGroupBusy] = useState({}); // { [groupName]: boolean }

  const setBusy = (groupName, v) => {
    setGroupBusy((prev) => ({ ...prev, [groupName]: v }));
  };

  const asignarGrupo = async (groupName, permisosGrupo) => {
    setBusy(groupName, true);
    // Optimista: añade todos los ids al set
    const prev = new Set(asignados);
    const ids = permisosGrupo.map((p) => p.idpermiso);
    const next = new Set(asignados);
    ids.forEach((id) => next.add(id));
    setAsignados(next);
    try {
      for (const idPermiso of ids) {
        if (!prev.has(idPermiso)) {
          await asignarPermisoARol({ idRol, idPermiso });
        }
      }
      showSnackbar(`Se asignaron todos los permisos de "${groupName}"`, "success");
    } catch (e) {
      // Revertir
      setAsignados(prev);
      showSnackbar(`No se pudo asignar el grupo "${groupName}"`, "error");
    } finally {
      setBusy(groupName, false);
    }
  };

  const quitarGrupo = async (groupName, permisosGrupo) => {
    setBusy(groupName, true);
    const prev = new Set(asignados);
    const ids = permisosGrupo.map((p) => p.idpermiso);
    const next = new Set(asignados);
    ids.forEach((id) => next.delete(id));
    setAsignados(next);
    try {
      for (const idPermiso of ids) {
        if (prev.has(idPermiso)) {
          await quitarPermisoDeRol({ idRol, idPermiso });
        }
      }
      showSnackbar(`Se quitaron todos los permisos de "${groupName}"`, "info");
    } catch (e) {
      setAsignados(prev);
      showSnackbar(`No se pudo quitar el grupo "${groupName}"`, "error");
    } finally {
      setBusy(groupName, false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 250 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        // Si está embebido en Dialog, controla alto y scroll internos
        maxHeight: embedded ? (isMobile ? "calc(100vh - 160px)" : "60vh") : "auto",
        overflowY: embedded ? "auto" : "visible",
      }}
    >
      {/* Header */}
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        mb={2}
        gap={1}
      >
        <Typography variant="h6" fontWeight={700}>
          Permisos del rol:{" "}
          <Typography component="span" fontWeight={800}>
            {rol?.nombre}
          </Typography>
        </Typography>

        {/* Indicador rápido: total asignados */}
        <Chip
          label={`Asignados: ${asignados.size}`}
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 700 }}
        />
      </Box>

      {/* Buscador */}
      <TextField
        fullWidth
        placeholder="Buscar permiso por nombre o descripción…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Grupos */}
      {grupos.length === 0 ? (
        <Paper sx={{ p: 2 }}>
          <Typography color="text.secondary">No hay permisos que coincidan con la búsqueda.</Typography>
        </Paper>
      ) : (
        grupos.map(([groupName, perms]) => {
          const total = perms.length;
          const marcados = perms.reduce((acc, p) => acc + (asignados.has(p.idpermiso) ? 1 : 0), 0);
          const allOn = marcados === total && total > 0;

          return (
            <Accordion key={groupName} defaultExpanded disableGutters sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography fontWeight={700}>
                    {groupName}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      size="small"
                      color={allOn ? "success" : "default"}
                      label={`${marcados}/${total}`}
                      sx={{ fontWeight: 700 }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={(e) => {
                        e.stopPropagation();
                        asignarGrupo(groupName, perms);
                      }}
                      disabled={groupBusy[groupName]}
                    >
                      Seleccionar todo
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        quitarGrupo(groupName, perms);
                      }}
                      disabled={groupBusy[groupName]}
                    >
                      Quitar todo
                    </Button>
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ p: 0 }}>
                <Paper elevation={0}>
                  <List disablePadding>
                    {perms.map((perm, idx) => (
                      <Box key={perm.idpermiso}>
                        {idx !== 0 && <Divider />}
                        <ListItem disablePadding>
                          <ListItemButton onClick={() => togglePermiso(perm)}>
                            <ListItemIcon>
                              <Checkbox
                                edge="start"
                                checked={isChecked(perm.idpermiso)}
                                tabIndex={-1}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={perm.nombre}
                              secondary={perm.descripcion || "—"}
                            />
                          </ListItemButton>
                        </ListItem>
                      </Box>
                    ))}
                  </List>
                </Paper>
              </AccordionDetails>
            </Accordion>
          );
        })
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
