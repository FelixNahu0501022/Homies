// src/components/MapPicker.jsx
// ✅ Geolocaliza AUTOMÁTICO al montar (sin botón). Centra y crea marcador.
// Mantiene inputs Lat/Lng y Dirección. (Reemplaza el archivo.)

import { useEffect, useRef, useState } from "react";
import { Box, TextField, Stack, Alert } from "@mui/material";

export default function MapPicker({ value, onChange }) {
  const [lat, setLat] = useState(value?.lat ?? null);
  const [lng, setLng] = useState(value?.lng ?? null);
  const [direccionTexto, setDireccionTexto] = useState(value?.direccionTexto ?? "");
  const [geoMsg, setGeoMsg] = useState("");
  const mapRef = useRef(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const LRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Carga Leaflet
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        const iconRetinaUrl = new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href;
        const iconUrl = new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href;
        const shadowUrl = new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href;
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
        LRef.current = L;
        if (!canceled) setLeafletReady(true);
      } catch { if (!canceled) setLeafletReady(false); }
    })();
    return () => { canceled = true; };
  }, []);

  // Inicializa mapa
  useEffect(() => {
    if (!leafletReady || !mapRef.current) return;
    const L = LRef.current;
    const start = [lat ?? -17.7833, lng ?? -63.1821];
    const map = L.map(mapRef.current).setView(start, 13);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    function upsertMarker(latlng) {
      if (markerRef.current) markerRef.current.setLatLng(latlng);
      else {
        markerRef.current = L.marker(latlng, { draggable: true }).addTo(map);
        markerRef.current.on("dragend", (e) => {
          const p = e.target.getLatLng();
          setLat(Number(p.lat.toFixed(6))); setLng(Number(p.lng.toFixed(6)));
        });
      }
    }

    if (lat != null && lng != null) upsertMarker([lat, lng]);

    map.on("click", (e) => {
      const p = e.latlng;
      upsertMarker(p);
      setLat(Number(p.lat.toFixed(6)));
      setLng(Number(p.lng.toFixed(6)));
    });

    return () => map.remove();
  }, [leafletReady]); // eslint-disable-line

  // 🔥 Geolocalización automática al montar (HTTPS o localhost)
  useEffect(() => {
    if (!("geolocation" in navigator)) { setGeoMsg("Geolocalización no disponible."); return; }
    // Si ya hay lat/lng (vienen de edición), no forzamos geolocalizar.
    if (lat != null && lng != null) return;

    const watchId = navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = Number(pos.coords.latitude.toFixed(6));
        const ln = Number(pos.coords.longitude.toFixed(6));
        setLat(la); setLng(ln);
        setGeoMsg("Ubicación detectada automáticamente.");
        // centrar y marcar
        if (leafletReady && mapInstanceRef.current && LRef.current) {
          const map = mapInstanceRef.current;
          map.setView([la, ln], 15);
          if (markerRef.current) markerRef.current.setLatLng([la, ln]);
          else {
            const L = LRef.current;
            markerRef.current = L.marker([la, ln], { draggable: true }).addTo(map);
            markerRef.current.on("dragend", (e) => {
              const p = e.target.getLatLng();
              setLat(Number(p.lat.toFixed(6)));
              setLng(Number(p.lng.toFixed(6)));
            });
          }
        }
      },
      (err) => setGeoMsg(`No se pudo obtener ubicación: ${err?.message || ""}. (HTTPS/localhost)`),
      { enableHighAccuracy: true, timeout: 8000 }
    );

    return () => {
      if (watchId && navigator.geolocation.clearWatch) {
        try { navigator.geolocation.clearWatch(watchId); } catch {}
      }
    };
  }, [leafletReady]); // eslint-disable-line

  // Notificar a padre
  useEffect(() => { onChange?.({ lat, lng, direccionTexto }); }, [lat, lng, direccionTexto]); // eslint-disable-line

  return (
    <Stack gap={1}>
      {geoMsg && <Alert severity={geoMsg.includes("detectada") ? "success" : "info"}>{geoMsg}</Alert>}
      <Box sx={{ height: 320, borderRadius: 1, overflow: "hidden", bgcolor: "#f5f5f5" }}>
        {leafletReady ? <div ref={mapRef} style={{ height: "100%", width: "100%" }} /> : <Box sx={{ p: 2 }}>Mapa no disponible</Box>}
      </Box>
      <Stack direction={{ xs:"column", sm:"row" }} gap={1}>
        <TextField label="Latitud" value={lat ?? ""} onChange={(e) => setLat(e.target.value === "" ? null : Number(e.target.value))} fullWidth />
        <TextField label="Longitud" value={lng ?? ""} onChange={(e) => setLng(e.target.value === "" ? null : Number(e.target.value))} fullWidth />
      </Stack>
      <TextField label="Dirección (aproximada)" value={direccionTexto} onChange={(e) => setDireccionTexto(e.target.value)} fullWidth />
    </Stack>
  );
}
