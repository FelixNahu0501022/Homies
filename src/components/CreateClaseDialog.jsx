import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box
} from "@mui/material";
import api from "../services/axios";

export default function CreateClaseDialog({ open, onClose, onCreated }) {
  const [gestion, setGestion] = useState("");
  const [etiqueta, setEtiqueta] = useState("");

  useEffect(() => {
    if (open) {
      setGestion("");
      setEtiqueta("");
    }
  }, [open]);

  const onGuardar = async () => {
    const g = Number(String(gestion).replace(/[^\d]/g, ""));
    if (!Number.isInteger(g) || g < 1900 || g > 2100) {
      return alert("Ingresa un año válido (ej: 2025).");
    }
    const body = {
      gestion: g,
      etiqueta: etiqueta?.trim() || `Clase ${g}`,
    };
    const { data } = await api.post("/clases", body);
    // notificar arriba
    onCreated?.(data); // { idclase, gestion, etiqueta, activo }
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Nueva Clase (cohorte)</DialogTitle>
      <DialogContent>
        <Box mt={1} display="grid" gap={2}>
          <TextField
            label="Año de cohorte"
            placeholder="Ej: 2025"
            value={gestion}
            onChange={(e)=> setGestion(e.target.value)}
            inputMode="numeric"
          />
          <TextField
            label="Etiqueta (opcional)"
            placeholder="Ej: Clase 2025"
            value={etiqueta}
            onChange={(e)=> setEtiqueta(e.target.value)}
            helperText="Si la dejas vacía, se usará 'Clase {año}'."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onGuardar}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
