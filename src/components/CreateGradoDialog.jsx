import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box
} from "@mui/material";
import api from "../services/axios";

export default function CreateGradoDialog({ open, onClose, onCreated }) {
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    if (open) setNombre("");
  }, [open]);

  const onGuardar = async () => {
    const n = String(nombre || "").trim();
    if (n.length < 2) return alert("Ingresa un nombre de grado válido (ej: Bombero I).");
    const { data } = await api.post("/grados", { nombre: n });
    onCreated?.(data); // { idgrado, nombre, activo }
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Nuevo Grado (rango)</DialogTitle>
      <DialogContent>
        <Box mt={1} display="grid" gap={2}>
          <TextField
            label="Nombre del grado"
            placeholder="Ej: Bombero I"
            value={nombre}
            onChange={(e)=> setNombre(e.target.value)}
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
