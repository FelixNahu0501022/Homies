import {
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  TextField,
  Pagination,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import debounce from "lodash.debounce";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  repResumenUsuarios,
  repUsuariosPorRol,
  repUsuariosDeRol,
  repUsuariosSinRol,
  repUsuariosMultiRol,
  repRolesSinUsuarios,
  repPermisosSinRol,
  repPermisosMatriz,
} from "../../services/usuarios.service";
import { listarRoles } from "../../services/roles.service";
import { exportKpiAndRankingPdf, exportTablePdf } from "../../utils/pdfExport";

export default function UsuariosReportes() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  // datos generales
  const [kpi, setKpi] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [rolesLookup, setRolesLookup] = useState(new Map());

  // datos por sección
  const [rolesSinUsuarios, setRolesSinUsuarios] = useState([]);
  const [permisosSinRol, setPermisosSinRol] = useState([]);
  const [usuariosSinRol, setUsuariosSinRol] = useState([]);
  const [usuariosMultiRol, setUsuariosMultiRol] = useState([]);
  const [usuariosDeRol, setUsuariosDeRol] = useState([]);
  const [permisosMatriz, setPermisosMatriz] = useState({
    roles: [],
    permisos: [],
    asignaciones: [],
  });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useMemo(
    () => debounce((v) => setSearch(v), 500),
    []
  );

  // 🔹 Carga inicial del resumen general y catálogos
  useEffect(() => {
    (async () => {
      try {
        const [k, r, rsu, psr, roles] = await Promise.all([
          repResumenUsuarios(),
          repUsuariosPorRol(),
          repRolesSinUsuarios(),
          repPermisosSinRol(),
          listarRoles(),
        ]);
        setKpi(k || {});
        setRanking(r || []);
        setRolesSinUsuarios(rsu || []);
        setPermisosSinRol(psr || []);
        const map = new Map();
        (roles || []).forEach((rl) => map.set(rl.idrol, rl.nombre));
        setRolesLookup(map);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 🔹 Funciones de carga de datos por reporte
  const cargarUsuariosSinRol = async () => {
    const res = await repUsuariosSinRol({ page, limit: 10, search });
    setUsuariosSinRol(res?.data || []);
  };

  const cargarUsuariosMultiRol = async () => {
    const res = await repUsuariosMultiRol({ page, limit: 10, search });
    setUsuariosMultiRol(res?.data || []);
  };

  const cargarUsuariosDeRol = async (idRol) => {
    const res = await repUsuariosDeRol(idRol, { page, limit: 10, search });
    setUsuariosDeRol(res?.data || []);
  };

  const cargarMatriz = async () => {
    const res = await repPermisosMatriz();
    setPermisosMatriz(res);
  };

  const renderRoles = (u) => {
    if (Array.isArray(u.roles_detalle) && u.roles_detalle.length > 0) {
      return u.roles_detalle.map((r) => (
        <Chip
          key={`${u.idusuario}-${r.idrol}`}
          label={r.nombre}
          size="small"
          sx={{ mr: 0.5 }}
        />
      ));
    }
    if (Array.isArray(u.roles) && u.roles.length > 0) {
      return u.roles.map((rid) => (
        <Chip
          key={`${u.idusuario}-${rid}`}
          label={rolesLookup.get(rid) || `Rol #${rid}`}
          size="small"
          sx={{ mr: 0.5 }}
        />
      ));
    }
    return <Chip label="Sin rol" size="small" />;
  };

  // 🔹 Auto-carga de datos al cambiar de pestaña
  useEffect(() => {
    if (tab === 1 && usuariosSinRol.length === 0) cargarUsuariosSinRol();
    if (tab === 2 && usuariosMultiRol.length === 0) cargarUsuariosMultiRol();
    if (tab === 3 && usuariosDeRol.length === 0 && rolesLookup.size > 0) {
      const primerRol = [...rolesLookup.keys()][0];
      cargarUsuariosDeRol(primerRol);
    }
    if (tab === 4 && permisosMatriz.roles.length === 0) cargarMatriz();
  }, [tab, rolesLookup]);

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
      <Typography variant="h5" gutterBottom>
        Reportes del módulo Usuarios
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Resumen general" />
        <Tab label="Usuarios sin rol" />
        <Tab label="Usuarios multi-rol" />
        <Tab label="Usuarios de un rol" />
        <Tab label="Matriz de permisos" />
      </Tabs>

      {/* === TAB 0: Resumen general === */}
      {tab === 0 && (
        <>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Button
              variant="outlined"
              onClick={() => exportKpiAndRankingPdf({ kpi, ranking })}
            >
              Exportar PDF (Resumen)
            </Button>
            <Box display="flex" gap={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={() =>
                  exportTablePdf({
                    title: "Roles sin usuarios",
                    columns: [
                      { header: "ID", dataKey: "idrol" },
                      { header: "Rol", dataKey: "nombre" },
                      { header: "Descripción", dataKey: "descripcion" },
                    ],
                    rows: rolesSinUsuarios,
                    filename: "roles_sin_usuarios.pdf",
                  })
                }
              >
                Exportar Roles sin usuarios
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() =>
                  exportTablePdf({
                    title: "Permisos sin rol",
                    columns: [
                      { header: "ID", dataKey: "idpermiso" },
                      { header: "Permiso", dataKey: "nombre" },
                      { header: "Descripción", dataKey: "descripcion" },
                    ],
                    rows: permisosSinRol,
                    filename: "permisos_sin_rol.pdf",
                  })
                }
              >
                Exportar Permisos sin rol
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {[
              { label: "Usuarios Totales", value: kpi?.total_usuarios ?? 0 },
              { label: "Activos", value: kpi?.activos ?? 0 },
              { label: "Inactivos", value: kpi?.inactivos ?? 0 },
              { label: "Con Roles", value: kpi?.usuarios_con_roles ?? 0 },
              { label: "Sin Roles", value: kpi?.usuarios_sin_roles ?? 0 },
              { label: "Roles Distintos", value: kpi?.roles_distintos ?? 0 },
            ].map((c, i) => (
              <Grid key={i} item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="overline">{c.label}</Typography>
                    <Typography variant="h4">{c.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Usuarios por rol (ranking)
            </Typography>
            <Paper>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rol</TableCell>
                    <TableCell align="right"># Usuarios</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(ranking || []).map((r) => (
                    <TableRow key={r.idrol}>
                      <TableCell>{r.rol_nombre}</TableCell>
                      <TableCell align="right">{r.total_usuarios}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        </>
      )}

      {/* === TAB 1: Usuarios sin rol === */}
      {tab === 1 && (
        <>
          <TextField
            label="Buscar"
            onChange={(e) => debouncedSearch(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(usuariosSinRol || []).map((u) => (
                  <TableRow key={u.idusuario}>
                    <TableCell>{u.idusuario}</TableCell>
                    <TableCell>{u.nombreusuario}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.estado ? "Activo" : "Inactivo"}
                        color={u.estado ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}

      {/* === TAB 2: Usuarios multi-rol === */}
      {tab === 2 && (
        <>
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(usuariosMultiRol || []).map((u) => (
                  <TableRow key={u.idusuario}>
                    <TableCell>{u.idusuario}</TableCell>
                    <TableCell>{u.nombreusuario}</TableCell>
                    <TableCell>{renderRoles(u)}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.estado ? "Activo" : "Inactivo"}
                        color={u.estado ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}

      {/* === TAB 3: Usuarios de un rol === */}
      {tab === 3 && (
        <>
          <TextField
            select
            label="Rol"
            SelectProps={{ native: true }}
            onChange={(e) => {
              const idRol = Number(e.target.value);
              cargarUsuariosDeRol(idRol);
            }}
            sx={{ mb: 2 }}
          >
            <option value="">Seleccionar...</option>
            {[...rolesLookup.entries()].map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </TextField>

          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(usuariosDeRol || []).map((u) => (
                  <TableRow key={u.idusuario}>
                    <TableCell>{u.idusuario}</TableCell>
                    <TableCell>{u.nombreusuario}</TableCell>
                    <TableCell>{renderRoles(u)}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.estado ? "Activo" : "Inactivo"}
                        color={u.estado ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}

      {/* === TAB 4: Matriz de permisos === */}
      {tab === 4 && (
        <>
          <Paper sx={{ mt: 2, overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Permiso \\ Rol</TableCell>
                  {(permisosMatriz.roles || []).map((r) => (
                    <TableCell key={r.idrol}>{r.nombre}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(permisosMatriz.permisos || []).map((p) => (
                  <TableRow key={p.idpermiso}>
                    <TableCell>{p.nombre}</TableCell>
                    {(permisosMatriz.roles || []).map((r) => {
                      const on = permisosMatriz.asignaciones?.some(
                        (a) =>
                          a.idrol === r.idrol && a.idpermiso === p.idpermiso
                      );
                      return (
                        <TableCell key={`${r.idrol}-${p.idpermiso}`}>
                          {on ? "✓" : "—"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </LayoutDashboard>
  );
}
