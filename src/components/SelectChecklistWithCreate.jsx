// src/components/SelectChecklistWithCreate.jsx
// (REEMPLAZA TODO) – mejora UX y asegura que "crear tipo" deje id en null y pase texto
import { useEffect, useMemo, useState } from "react";
import {
  Box, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItemButton, ListItemIcon, ListItemText, Checkbox, Stack, Typography, Chip
} from "@mui/material";
import debounce from "lodash.debounce";

export default function SelectChecklistWithCreate({
  label,
  options = [],            // [{ id, label }]
  value = null,            // id seleccionado (o null)
  onChange,                // (id | null, item | null) => void
  onCreate,                // async (text) => { id, label } | { id:null, label:text }
  allowCreate = true,
  placeholder = "Buscar...",
  createButtonLabel = "Crear nueva opción",
  initialSearch = "",
  createdBadge = "Nuevo",
}) {
  const [search, setSearch] = useState(initialSearch);
  const [filtered, setFiltered] = useState(options);
  const [open, setOpen] = useState(false);
  const [createText, setCreateText] = useState("");

  const applyFilter = useMemo(
    () => debounce((q, src) => {
      const v = (q || "").toLowerCase().trim();
      if (!v) return setFiltered(src);
      setFiltered(src.filter(o => `${o.label}`.toLowerCase().includes(v)));
    }, 200),
    []
  );

  useEffect(() => { applyFilter(search, options); }, [search, options, applyFilter]);
  useEffect(() => { if (initialSearch) setSearch(initialSearch); }, [initialSearch]);

  const toggle = (item) => {
    const isSelected = value === item.id;
    onChange?.(isSelected ? null : item.id, isSelected ? null : item);
  };

  const handleCreate = async () => {
    const text = (createText || search || "").trim();
    if (!text) return;
    const created = await onCreate?.(text);
    if (created) {
      onChange?.(created.id, created);
      setSearch("");
      setCreateText("");
      setOpen(false);
    }
  };

  return (
    <Box>
      <Stack direction={{ xs:"column", sm:"row" }} gap={1} alignItems="flex-start" mb={1}>
        <TextField fullWidth label={label} placeholder={placeholder} value={search} onChange={(e) => setSearch(e.target.value)} />
        {allowCreate && <Button variant="outlined" onClick={() => { setCreateText(search); setOpen(true); }}>{createButtonLabel}</Button>}
      </Stack>

      {!!value && filtered.every(o => o.id !== value) && (
        <Chip size="small" color="primary" label={`${createdBadge}: ${search || createText}`} sx={{ mb: 1 }} />
      )}

      {filtered.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Sin coincidencias.</Typography>
      )}

      <List dense sx={{ border: "1px solid #e0e0e0", borderRadius: 1, maxHeight: 260, overflow: "auto" }}>
        {filtered.map((item) => {
          const checked = value === item.id;
          return (
            <ListItemButton key={item.id ?? item.label} onClick={() => toggle(item)}>
              <ListItemIcon><Checkbox edge="start" checked={!!checked} tabIndex={-1} disableRipple /></ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Crear {label.toLowerCase()}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" fullWidth label={label} value={createText} onChange={(e) => setCreateText(e.target.value)} />
          <Typography variant="caption" color="text.secondary">Si esta opción no existe, la agregamos ahora.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate}>Crear</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
