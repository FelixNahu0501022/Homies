// src/pages/Emergencias/EmergenciaChoferesPage.jsx
// ✅ Gestión de choferes asignados a vehículos en emergencias
// ✅ Tabla de choferes activos con estado de turno y horas
// ✅ Formulario para asignar nuevo chofer (Personal + Vehículo)
// ✅ Manejo de errores de simultaneidad (backend valida)

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
    TextField,
    Chip,
    TablePagination,
    useMediaQuery,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { ArrowBack, DirectionsCar, PersonRemove, Add } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import debounce from "lodash.debounce";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
    listarChoferesDeEmergencia,
    asignarChofer,
    desasignarChofer,
    obtenerEmergencia,
} from "../../services/emergencias.service";
import { listarPersonalDeEmergencia } from "../../services/emergencias.service";
import { listarVehiculosDeEmergencia } from "../../services/emergencias.service";

const estadoColor = (estado) => {
    if (estado === "ACTIVO") return "success";
    if (estado === "FINALIZADO") return "default";
    return "default";
};

export default function EmergenciaChoferesPage() {
    const { id } = useParams();
    const idEmergencia = Number(id);
    const navigate = useNavigate();
    const isMobile = useMediaQuery("(max-width:900px)");

    const [emerg, setEmerg] = useState(null);
    const [choferes, setChoferes] = useState([]);
    const [personal, setPersonal] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);

    const [personalSel, setPersonalSel] = useState(null);
    const [vehiculoSel, setVehiculoSel] = useState(null);
    const [observaciones, setObservaciones] = useState("");

    const [search, setSearch] = useState("");
    const [filtered, setFiltered] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // ====== Cargar datos ======
    const cargar = async () => {
        try {
            const [e, c, p, v] = await Promise.all([
                obtenerEmergencia(idEmergencia),
                listarChoferesDeEmergencia(idEmergencia),
                listarPersonalDeEmergencia(idEmergencia),
                listarVehiculosDeEmergencia(idEmergencia),
            ]);
            setEmerg(e || null);
            setChoferes(c || []);
            setFiltered(c || []);
            setPersonal(p || []);
            setVehiculos(v || []);
            setPage(0);
        } catch (err) {
            const msg = err?.response?.data?.mensaje || err?.message || "No se pudo cargar choferes";
            Swal.fire("Error", msg, "error");
            navigate("/emergencias");
        }
    };

    useEffect(() => {
        if (idEmergencia) cargar();
        // eslint-disable-next-line
    }, [idEmergencia]);

    // ====== Filtro ======
    const applyFilter = useMemo(
        () =>
            debounce((value, src) => {
                const v = (value || "").toLowerCase().trim();
                if (!v) return setFiltered(src);
                setFiltered(
                    src.filter(
                        (x) =>
                            `${x.nombre ?? ""} ${x.apellido ?? ""}`.toLowerCase().includes(v) ||
                            `${x.placa ?? ""}`.toLowerCase().includes(v)
                    )
                );
                setPage(0);
            }, 250),
        []
    );

    useEffect(() => {
        applyFilter(search, choferes);
    }, [search, choferes, applyFilter]);

    // ====== Acciones ======
    const addChofer = async () => {
        if (!personalSel) return Swal.fire("Valida", "Selecciona un personal", "info");
        if (!vehiculoSel) return Swal.fire("Valida", "Selecciona un vehículo", "info");

        // Validación: evitar asignar mismo personal a múltiples vehículos como chofer activo
        const yaAsignado = choferes.find(
            (c) => c.idpersonal === personalSel.idpersonal && c.estado_turno === "ACTIVO"
        );

        if (yaAsignado) {
            return Swal.fire(
                "No permitido",
                `${personalSel.nombre} ${personalSel.apellido} ya está asignado como chofer activo del vehículo ${yaAsignado.placa}. Debe finalizar ese turno primero.`,
                "warning"
            );
        }

        // Validación: evitar asignar múltiples choferes al mismo vehículo
        const vehiculoOcupado = choferes.find(
            (c) => c.idvehiculo === vehiculoSel.idvehiculo && c.estado_turno === "ACTIVO"
        );

        if (vehiculoOcupado) {
            return Swal.fire(
                "No permitido",
                `El vehículo ${vehiculoSel.placa} ya tiene un chofer activo: ${vehiculoOcupado.personal_nombre} ${vehiculoOcupado.personal_apellido}. Debe finalizar ese turno primero.`,
                "warning"
            );
        }

        try {
            await asignarChofer(idEmergencia, {
                idPersonal: personalSel.idpersonal,
                idVehiculo: vehiculoSel.idvehiculo,
                observaciones: observaciones.trim() || undefined,
            });

            setPersonalSel(null);
            setVehiculoSel(null);
            setObservaciones("");
            await cargar();
            Swal.fire("Listo", "Chofer asignado correctamente", "success");
        } catch (err) {
            const msg = err?.response?.data?.error || err?.response?.data?.mensaje || err?.message || "No se pudo asignar chofer";
            Swal.fire("Error", msg, "error");
        }
    };

    const removeChofer = async (row) => {
        const ok = await Swal.fire({
            title: `¿Desasignar a ${row.nombre} ${row.apellido}?`,
            text: `Vehículo: ${row.placa}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, desasignar",
            cancelButtonText: "Cancelar",
        });
        if (!ok.isConfirmed) return;

        try {
            await desasignarChofer(idEmergencia, row.idpersonal, row.idvehiculo, {
                observaciones: "Desasignado desde interfaz",
            });
            await cargar();
            Swal.fire("Listo", "Chofer desasignado correctamente", "success");
        } catch (err) {
            const msg = err?.response?.data?.mensaje || err?.message || "No se pudo desasignar";
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
                    mb: 2,
                }}
            >
                <Typography variant="h6" fontWeight={700}>
                    Choferes — Emergencia #{idEmergencia}
                    {emerg?.estado && (
                        <Chip label={emerg.estado} size="small" sx={{ ml: 1 }} />
                    )}
                </Typography>

                <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={() => navigate("/emergencias")}
                >
                    Volver
                </Button>
            </Box>

            {/* Formulario asignar chofer */}
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
                    Asignar Nuevo Chofer
                </Typography>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                        gap: 2,
                        mb: 2,
                    }}
                >
                    <Autocomplete
                        options={personal || []}
                        getOptionLabel={(p) => `${p.nombre ?? ""} ${p.apellido ?? ""} (CI: ${p.ci ?? ""})`}
                        value={personalSel}
                        onChange={(_, val) => setPersonalSel(val)}
                        renderInput={(params) => (
                            <TextField {...params} label="Personal *" required />
                        )}
                    />

                    <Autocomplete
                        options={vehiculos || []}
                        getOptionLabel={(v) => `${v.placa ?? ""} — ${v.marca ?? ""} ${v.modelo ?? ""}`}
                        value={vehiculoSel}
                        onChange={(_, val) => setVehiculoSel(val)}
                        renderInput={(params) => (
                            <TextField {...params} label="Vehículo *" required />
                        )}
                    />
                </Box>

                <TextField
                    label="Observaciones"
                    fullWidth
                    multiline
                    rows={2}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Ej: Turno diurno 8:00 a 16:00"
                    sx={{ mb: 2 }}
                />

                <Button variant="contained" startIcon={<Add />} onClick={addChofer}>
                    Asignar Chofer
                </Button>

                <Typography
                    variant="caption"
                    sx={{ display: "block", color: "text.secondary", mt: 1 }}
                >
                    ℹ️ El sistema valida que un chofer no esté asignado a múltiples vehículos simultáneamente.
                </Typography>
            </Paper>

            {/* Tabla de choferes */}
            <Paper sx={{ borderRadius: 3 }}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    p={2}
                    pb={0}
                >
                    <TextField
                        label="Buscar por nombre o placa"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        size="small"
                        sx={{ maxWidth: 360 }}
                    />
                </Box>

                <Table size={isMobile ? "small" : "medium"}>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <DirectionsCar fontSize="small" sx={{ mr: 0.5 }} /> Chofer
                            </TableCell>
                            <TableCell>CI</TableCell>
                            <TableCell>Vehículo</TableCell>
                            <TableCell>Estado Turno</TableCell>
                            <TableCell>Horas</TableCell>
                            <TableCell>Observaciones</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((c) => (
                                <TableRow key={`${c.idpersonal}-${c.idvehiculo}`} hover>
                                    <TableCell>
                                        {c.nombre} {c.apellido}
                                    </TableCell>
                                    <TableCell>{c.ci}</TableCell>
                                    <TableCell>
                                        {c.placa}
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            {c.nominacion || "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={c.estado_turno || "—"}
                                            color={estadoColor(c.estado_turno)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {c.horas_conducidas != null
                                            ? `${parseFloat(c.horas_conducidas).toFixed(2)} h`
                                            : "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                            {c.observaciones || "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        {c.estado_turno === "ACTIVO" && (
                                            <Tooltip title="Desasignar">
                                                <IconButton color="error" onClick={() => removeChofer(c)}>
                                                    <PersonRemove />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    Sin choferes asignados
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <TablePagination
                    component="div"
                    count={filtered.length}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 20]}
                />
            </Paper>
        </LayoutDashboard>
    );
}
