// src/pages/Emergencias/EmergenciasHorasPage.jsx
// Reportes de horas trabajadas: chofer, emergencias, resumen consolidado

import {
    Typography, Paper, Box, Button, TextField,
    Table, TableHead, TableRow, TableCell, TableBody,
    FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { TableChart, ArrowBack } from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
    obtenerHorasChofer,
    obtenerHorasEmergencias,
    obtenerResumenHorasTodos,
    opcionesPersonal
} from "../../services/emergencias.service";
import { useEffect } from "react";

const TIPOS_REPORTE = [
    { value: "chofer", label: "Horas como Chofer" },
    { value: "emergencias", label: "Horas en Emergencias" },
    { value: "resumen", label: "Resumen Consolidado (Todos)" },
];

export default function EmergenciasHorasPage() {
    const navigate = useNavigate();

    const [tipoReporte, setTipoReporte] = useState("chofer");
    const [personalSel, setPersonalSel] = useState(null);
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");

    const [personal, setPersonal] = useState([]);
    const [datos, setDatos] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const p = await opcionesPersonal();
                setPersonal(p || []);
            } catch { }
        })();
    }, []);

    const generar = async () => {
        if ((tipoReporte === "chofer" || tipoReporte === "emergencias") && !personalSel) {
            return Swal.fire("Valida", "Selecciona un personal", "info");
        }

        setLoading(true);
        try {
            const params = {
                fechaInicio: fechaInicio || undefined,
                fechaFin: fechaFin || undefined,
            };

            let res;
            if (tipoReporte === "chofer") {
                res = await obtenerHorasChofer(personalSel.id, params);
            } else if (tipoReporte === "emergencias") {
                res = await obtenerHorasEmergencias(personalSel.id, params);
            } else {
                res = await obtenerResumenHorasTodos(params);
            }

            setDatos(res || []);
            if (!res || res.length === 0) {
                Swal.fire("Aviso", "No se encontraron datos", "info");
            }
        } catch (err) {
            const msg = err?.response?.data?.mensaje || err?.message || "Error al generar reporte";
            Swal.fire("Error", msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <LayoutDashboard>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                    <TableChart sx={{ mr: 1, verticalAlign: "middle" }} />
                    Reportes de Horas
                </Typography>
                <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/emergencias")}>
                    Volver
                </Button>
            </Box>

            {/* Filtros */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel>Tipo de Reporte</InputLabel>
                        <Select
                            value={tipoReporte}
                            label="Tipo de Reporte"
                            onChange={(e) => {
                                setTipoReporte(e.target.value);
                                setDatos([]);
                            }}
                        >
                            {TIPOS_REPORTE.map((t) => (
                                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {(tipoReporte === "chofer" || tipoReporte === "emergencias") && (
                        <Autocomplete
                            options={personal}
                            getOptionLabel={(p) => p.label || `#${p.id}`}
                            value={personalSel}
                            onChange={(_, val) => {
                                setPersonalSel(val);
                                setDatos([]);
                            }}
                            renderInput={(params) => <TextField {...params} label="Personal *" required />}
                        />
                    )}

                    <TextField
                        label="Fecha Inicio"
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        label="Fecha Fin"
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Box>

                <Button
                    variant="contained"
                    startIcon={<TableChart />}
                    onClick={generar}
                    disabled={loading}
                    sx={{ mt: 2 }}
                >
                    {loading ? "Generando..." : "Generar Reporte"}
                </Button>
            </Paper>

            {/* Resultados */}
            {datos.length > 0 && (
                <Paper sx={{ p: 0 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                {tipoReporte === "resumen" ? (
                                    <>
                                        <TableCell>Personal</TableCell>
                                        <TableCell>Horas Chofer</TableCell>
                                        <TableCell>Horas Emergencias</TableCell>
                                        <TableCell>Total Horas</TableCell>
                                        <TableCell>Emergencias (Chofer)</TableCell>
                                        <TableCell>Emergencias (Participante)</TableCell>
                                    </>
                                ) : tipoReporte === "chofer" ? (
                                    <>
                                        <TableCell>Emergencia</TableCell>
                                        <TableCell>Ubicación</TableCell>
                                        <TableCell>Vehículo</TableCell>
                                        <TableCell>Horas Conducidas</TableCell>
                                        <TableCell>Estado Turno</TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell>Emergencia</TableCell>
                                        <TableCell>Ubicación</TableCell>
                                        <TableCell>Horas Trabajadas</TableCell>
                                    </>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {datos.map((row, idx) => (
                                <TableRow key={idx}>
                                    {tipoReporte === "resumen" ? (
                                        <>
                                            <TableCell>{row.nombre} {row.apellido}</TableCell>
                                            <TableCell>{row.horas_como_chofer || 0} h</TableCell>
                                            <TableCell>{row.horas_en_emergencias || 0} h</TableCell>
                                            <TableCell>{row.total_horas || 0} h</TableCell>
                                            <TableCell>{row.total_emergencias_chofer || 0}</TableCell>
                                            <TableCell>{row.total_emergencias_participante || 0}</TableCell>
                                        </>
                                    ) : tipoReporte === "chofer" ? (
                                        <>
                                            <TableCell>#{row.idemergencia}</TableCell>
                                            <TableCell>{row.ubicacion_emergencia}</TableCell>
                                            <TableCell>{row.placa}</TableCell>
                                            <TableCell>{row.horas_conducidas || 0} h</TableCell>
                                            <TableCell>{row.estado_turno}</TableCell>
                                        </>
                                    ) : (
                                        <>
                                            <TableCell>#{row.idemergencia}</TableCell>
                                            <TableCell>{row.ubicacion_emergencia}</TableCell>
                                            <TableCell>{row.horas_trabajadas || 0} h</TableCell>
                                        </>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            )}

            {datos.length === 0 && !loading && (
                <Paper sx={{ p: 4, textAlign: "center" }}>
                    <Typography color="text.secondary">
                        Configura los filtros y genera un reporte
                    </Typography>
                </Paper>
            )}
        </LayoutDashboard>
    );
}
