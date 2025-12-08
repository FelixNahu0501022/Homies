/* src/components/reportes/SelectorTipoReporte.jsx
 * Componente reutilizable para seleccionar el tipo de reporte
 */
import { TextField, MenuItem } from "@mui/material";

export default function SelectorTipoReporte({
    value,
    onChange,
    opciones = [],
    label = "Tipo de Reporte",
    size = "small",
    ...props
}) {
    return (
        <TextField
            select
            fullWidth
            label={label}
            value={value}
            onChange={onChange}
            size={size}
            helperText={!value ? "Selecciona el tipo de reporte que deseas generar" : null}
            {...props}
        >
            {opciones.map((opcion) => (
                <MenuItem key={opcion.value} value={opcion.value}>
                    {opcion.label}
                </MenuItem>
            ))}
        </TextField>
    );
}
