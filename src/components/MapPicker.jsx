// src/components/MapPicker.jsx
// ✅ Geolocaliza AUTOMÁTICO al montar (sin botón). Centra y crea marcador.
// ✅ Soporta props lat/lng directas y modo readOnly.

import { useEffect, useRef, useState } from "react";
import { Box, TextField, Stack, Alert } from "@mui/material";

export default function MapPicker({ lat: latProp, lng: lngProp, value, onChange, readOnly = false }) {
  // Compatibilidad: usar props directas o value object
  const pLat = latProp ?? value?.lat ?? null;
  const pLng = lngProp ?? value?.lng ?? null;
  const pDir = value?.direccionTexto ?? "";

  const [lat, setLat] = useState(pLat);
  const [lng, setLng] = useState(pLng);
  const [direccionTexto, setDireccionTexto] = useState(pDir);
  const [geoMsg, setGeoMsg] = useState("");

  const [isMapInit, setIsMapInit] = useState(false);
  const mapRef = useRef(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const LRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Sincronizar estado interno con props (cuando cargan asíncronamente)
  useEffect(() => {
    if (pLat !== null && pLat !== undefined) setLat(Number(pLat));
    if (pLng !== null && pLng !== undefined) setLng(Number(pLng));
    if (pDir) setDireccionTexto(pDir);
  }, [pLat, pLng, pDir]);

  // Actualizar vista del mapa cuando cambian lat/lng
  useEffect(() => {
    if (!isMapInit || !mapInstanceRef.current || !LRef.current) return;
    if (lat === null || lng === null) return;

    const map = mapInstanceRef.current;
    const L = LRef.current;
    const currentCenter = map.getCenter();

    // Solo mover si la diferencia es significativa para evitar loop con drag
    if (Math.abs(currentCenter.lat - lat) > 0.0001 || Math.abs(currentCenter.lng - lng) > 0.0001) {
      map.setView([lat, lng], 15);
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: !readOnly }).addTo(map);
      if (!readOnly) {
        markerRef.current.on("dragend", (e) => {
          const p = e.target.getLatLng();
          const newLat = Number(p.lat.toFixed(6));
          const newLng = Number(p.lng.toFixed(6));
          setLat(newLat);
          setLng(newLng);
          onChange?.({ lat: newLat, lng: newLng, address: direccionTexto });
        });
      }
    }
  }, [lat, lng, isMapInit, readOnly]); // eslint-disable-line

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
    if (!leafletReady || !mapRef.current || mapInstanceRef.current) return;
    const L = LRef.current;
    // Si no hay coords, usar default Santa Cruz
    const start = [lat ?? -17.7833, lng ?? -63.1821];
    const map = L.map(mapRef.current).setView(start, 13);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    if (!readOnly) {
      map.on("click", (e) => {
        const p = e.latlng;
        const newLat = Number(p.lat.toFixed(6));
        const newLng = Number(p.lng.toFixed(6));
        setLat(newLat);
        setLng(newLng);

        if (markerRef.current) {
          markerRef.current.setLatLng(p);
        } else {
          markerRef.current = L.marker(p, { draggable: true }).addTo(map);
          markerRef.current.on("dragend", (ev) => {
            const pos = ev.target.getLatLng();
            const nLat = Number(pos.lat.toFixed(6));
            const nLng = Number(pos.lng.toFixed(6));
            setLat(nLat);
            setLng(nLng);
            onChange?.({ lat: nLat, lng: nLng, address: direccionTexto });
          });
        }
        onChange?.({ lat: newLat, lng: newLng, address: direccionTexto });
      });
    }

    setIsMapInit(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      setIsMapInit(false);
    };
  }, [leafletReady]); // eslint-disable-line

  // 🔥 Geolocalización automática al montar (si no hay coords iniciales)
  useEffect(() => {
    if (readOnly) return; // No geolocalizar en modo lectura
    if (!("geolocation" in navigator)) { setGeoMsg("Geolocalización no disponible."); return; }

    // Si ya hay lat/lng (vienen de edición o props), no forzamos geolocalizar.
    if (pLat != null && pLng != null) return;
    if (lat != null && lng != null) return;

    const watchId = navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Doble chequeo por si cargaron props mientras geolocalizaba
        if (pLat != null && pLng != null) return;

        const la = Number(pos.coords.latitude.toFixed(6));
        const ln = Number(pos.coords.longitude.toFixed(6));
        setLat(la); setLng(ln);
        setGeoMsg("Ubicación detectada automáticamente.");

        onChange?.({ lat: la, lng: ln, address: direccionTexto });
      },
      (err) => setGeoMsg(`No se pudo obtener ubicación: ${err?.message || ""}. (HTTPS/localhost)`),
      { enableHighAccuracy: true, timeout: 8000 }
    );

    return () => {
      if (watchId && navigator.geolocation.clearWatch) {
        try { navigator.geolocation.clearWatch(watchId); } catch { }
      }
    };
  }, [leafletReady, readOnly, pLat, pLng]); // eslint-disable-line

  return (
    <Stack gap={1}>
      {geoMsg && !readOnly && <Alert severity={geoMsg.includes("detectada") ? "success" : "info"}>{geoMsg}</Alert>}
      <Box sx={{ height: 320, borderRadius: 1, overflow: "hidden", bgcolor: "#f5f5f5" }}>
        {leafletReady ? <div ref={mapRef} style={{ height: "100%", width: "100%" }} /> : <Box sx={{ p: 2 }}>Mapa no disponible</Box>}
      </Box>
      {!readOnly && (
        <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
          <TextField label="Latitud" value={lat ?? ""} onChange={(e) => {
            const v = e.target.value === "" ? null : Number(e.target.value);
            setLat(v);
            onChange?.({ lat: v, lng, address: direccionTexto });
          }} fullWidth />
          <TextField label="Longitud" value={lng ?? ""} onChange={(e) => {
            const v = e.target.value === "" ? null : Number(e.target.value);
            setLng(v);
            onChange?.({ lat, lng: v, address: direccionTexto });
          }} fullWidth />
        </Stack>
      )}
      {!readOnly && (
        <TextField
          label="Dirección (aproximada)"
          value={direccionTexto}
          onChange={(e) => {
            setDireccionTexto(e.target.value);
            onChange?.({ lat, lng, address: e.target.value });
          }}
          fullWidth
        />
      )}
    </Stack>
  );
}
