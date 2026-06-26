"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import {
  ParkingSpot,
  adminGetParkingSpots,
  adminCreateParkingSpot,
  adminUpdateParkingSpot,
  adminDeleteParkingSpot,
  adminUpdateParkingMapImage,
  adminGenerateParkingFromCamping,
  uploadParkingMap,
} from "@/app/services/camping/parkingService";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

interface SpotWithLocal extends ParkingSpot {
  _localX?: number;
  _localY?: number;
}

function ParkingLotSVG({ spots }: { spots: ParkingSpot[] }) {
  const W = 800;
  const H = 500;
  const cols = Math.min(8, Math.max(1, spots.length));
  const rows = Math.ceil(spots.length / cols);
  const laneH = rows > 0 ? Math.floor((H - 80) / rows) : H - 80;
  const spotW = cols > 0 ? Math.floor((W - 60) / cols) : W - 60;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", width: "100%", height: "auto", maxHeight: 520 }}
    >
      {/* Background */}
      <rect width={W} height={H} fill="#1a1f2e" />
      {/* Road surface */}
      <rect x={0} y={40} width={W} height={H - 40} fill="#252b3b" />
      {/* Entry/Exit labels */}
      <text x={W / 2} y={22} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={13} fontWeight="bold">ENTRADA / SAÍDA</text>
      <rect x={W / 2 - 1} y={0} width={2} height={40} fill="rgba(255,255,255,0.2)" />

      {/* Parking lanes */}
      {Array.from({ length: rows }).map((_, row) => {
        const laneY = 50 + row * laneH;
        const midY = laneY + laneH / 2;
        const spotsInRow = row < rows - 1 ? cols : spots.length - row * cols;

        return (
          <g key={row}>
            {/* Lane divider line */}
            {row > 0 && <line x1={30} y1={laneY} x2={W - 30} y2={laneY} stroke="rgba(255,255,255,0.07)" strokeWidth={1} strokeDasharray="8 6" />}
            {/* Lane arrow */}
            <text x={18} y={midY + 5} textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize={16}>⟶</text>

            {/* Spot slots */}
            {Array.from({ length: spotsInRow }).map((_, col) => {
              const spotX = 30 + col * spotW + 4;
              const spotY = laneY + 6;
              const sw = spotW - 8;
              const sh = laneH - 12;
              return (
                <g key={col}>
                  <rect x={spotX} y={spotY} width={sw} height={sh} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth={1} rx={4} />
                  {/* Lane marker lines */}
                  <line x1={spotX} y1={spotY} x2={spotX} y2={spotY + sh} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Border */}
      <rect x={1} y={1} width={W - 2} height={H - 2} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={2} rx={8} />
    </svg>
  );
}

export default function ParkingAdminPage() {
  const params = useParams();
  const router = useRouter();
  const { role, authReady } = useAuth();
  const { showToast } = useToast();
  const eventId = Number(params.id);

  const [spots, setSpots] = useState<SpotWithLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapImageUrl, setMapImageUrl] = useState("");
  const [savedMapImageUrl, setSavedMapImageUrl] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [savingImage, setSavingImage] = useState(false);
  const [uploadingMap, setUploadingMap] = useState(false);
  const [generating, setGenerating] = useState(false);
  const mapFileRef = useRef<HTMLInputElement>(null);

  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editCapacity, setEditCapacity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ spotId: number } | null>(null);
  const dragSavedRef = useRef(false);

  const canAccess = role === "admin_master" || role === "admin";

  useEffect(() => {
    if (authReady && !canAccess) router.replace("/pages/user/home");
  }, [authReady, canAccess, router]);

  const loadSpots = useCallback(() => {
    adminGetParkingSpots(eventId)
      .then((data) => { setSpots(data); setLoading(false); })
      .catch(() => { showToast("Erro ao carregar vagas", "error"); setLoading(false); });
  }, [eventId, showToast]);

  useEffect(() => {
    if (!authReady || !canAccess) return;
    loadSpots();
    const saved = localStorage.getItem(`parking_map_${eventId}`);
    if (saved) { setSavedMapImageUrl(saved); setMapImageUrl(saved); }
  }, [authReady, canAccess, loadSpots, eventId]);

  const selectedSpot = spots.find((s) => s.id === selectedSpotId) ?? null;

  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if (draggingRef.current) return;
    if ((e.target as HTMLElement).closest("[data-spot]")) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const nextLabel = `V${spots.length + 1}`;
    adminCreateParkingSpot({
      event_id: eventId,
      label: nextLabel,
      x_position: Math.round(x * 100) / 100,
      y_position: Math.round(y * 100) / 100,
      capacity: 1,
    })
      .then((spot) => {
        setSpots((prev) => [...prev, spot]);
        setSelectedSpotId(spot.id);
        setEditLabel(spot.label);
        setEditCapacity(spot.capacity);
      })
      .catch(() => showToast("Erro ao criar vaga", "error"));
  }

  function handleSpotMouseDown(e: React.MouseEvent, spotId: number) {
    e.stopPropagation();
    e.preventDefault();
    draggingRef.current = { spotId };
    dragSavedRef.current = false;

    const spot = spots.find((s) => s.id === spotId);
    if (spot) {
      setSelectedSpotId(spotId);
      setEditLabel(spot.label);
      setEditCapacity(spot.capacity);
    }
  }

  function handleContainerMouseMove(e: React.MouseEvent) {
    const dragging = draggingRef.current;
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setSpots((prev) =>
      prev.map((s) =>
        s.id === dragging.spotId
          ? { ...s, x_position: Math.round(x * 100) / 100, y_position: Math.round(y * 100) / 100 }
          : s
      )
    );
    dragSavedRef.current = false;
  }

  function handleContainerMouseUp() {
    if (!draggingRef.current || dragSavedRef.current) {
      draggingRef.current = null;
      return;
    }
    const spotId = draggingRef.current.spotId;
    draggingRef.current = null;
    dragSavedRef.current = true;

    const spot = spots.find((s) => s.id === spotId);
    if (!spot) return;
    adminUpdateParkingSpot(spotId, { x_position: spot.x_position, y_position: spot.y_position })
      .catch(() => showToast("Erro ao mover vaga", "error"));
  }

  function handleSaveSpot() {
    if (!selectedSpotId) return;
    setSaving(true);
    adminUpdateParkingSpot(selectedSpotId, { label: editLabel, capacity: editCapacity })
      .then((updated) => {
        setSpots((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
        showToast("Vaga salva", "success");
      })
      .catch(() => showToast("Erro ao salvar", "error"))
      .then(() => setSaving(false));
  }

  function handleDeleteSpot() {
    if (!selectedSpotId) return;
    setDeleting(true);
    adminDeleteParkingSpot(selectedSpotId)
      .then(() => {
        setSpots((prev) => prev.filter((s) => s.id !== selectedSpotId));
        setSelectedSpotId(null);
        showToast("Vaga removida", "success");
      })
      .catch(() => showToast("Erro ao remover", "error"))
      .then(() => setDeleting(false));
  }

  function handleGenerate() {
    setGenerating(true);
    adminGenerateParkingFromCamping(eventId)
      .then((data) => {
        setSpots(data);
        showToast(`${data.length} vagas geradas com sucesso`, "success");
      })
      .catch((err: any) => {
        const msg = err?.response?.data?.detail ?? "Erro ao gerar vagas";
        showToast(msg, "error");
      })
      .then(() => setGenerating(false));
  }

  async function handleMapFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingMap(true);
    try {
      const res = await uploadParkingMap(eventId, file);
      setSavedMapImageUrl(res.parking_map_image_url);
      setMapImageUrl(res.parking_map_image_url);
      showToast("Mapa de estacionamento atualizado.", "success");
    } catch {
      showToast("Erro ao enviar imagem.", "error");
    } finally {
      setUploadingMap(false);
    }
  }

  function handleSaveMapImage() {
    if (!imageUrlInput.trim()) return;
    setSavingImage(true);
    const url = imageUrlInput.trim();
    adminUpdateParkingMapImage(eventId, url)
      .then(() => {
        setSavedMapImageUrl(url);
        setMapImageUrl(url);
        localStorage.setItem(`parking_map_${eventId}`, url);
        showToast("Imagem salva", "success");
      })
      .catch(() => {
        setSavedMapImageUrl(url);
        setMapImageUrl(url);
        localStorage.setItem(`parking_map_${eventId}`, url);
        showToast("Imagem salva localmente", "success");
      })
      .then(() => setSavingImage(false));
  }

  if (!authReady || loading) {
    return (
      <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#fff" }} />
      </Box>
    );
  }

  if (!canAccess) return null;

  return (
    <Box
      sx={{ minHeight: "100vh", ...dashboardBackgroundSx, pb: 6 }}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      onMouseLeave={handleContainerMouseUp}
    >
      {/* Header */}
      <Box sx={{
        position: "sticky", top: 0, zIndex: 10,
        backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        px: { xs: 2, sm: 3 }, py: 1.5,
      }}>
        <Box sx={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton
            onClick={() => router.push(`/pages/admin/events/${eventId}`)}
            sx={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.06)", "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", backgroundColor: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LocalParkingIcon sx={{ color: "#10b981", fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
              Mapa de Estacionamento
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
              {spots.length} {spots.length === 1 ? "vaga" : "vagas"} configuradas
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1100, margin: "0 auto", px: { xs: 2, sm: 3 }, pt: 3, display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>

        {/* Map area */}
        <Box sx={{ flex: 1, minWidth: 0 }}>

          {/* Image URL input or auto-generate */}
          {!savedMapImageUrl && (
            <Box sx={{
              backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px", p: 3, mb: 3,
            }}>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", mb: 0.5 }}>
                Mapa de estacionamento
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", mb: 2 }}>
                Gere as vagas automaticamente (baseado nas áreas de camping) ou cole a URL de um mapa customizado.
              </Typography>

              {/* Auto-generate */}
              <Button
                fullWidth variant="contained" onClick={handleGenerate} disabled={generating}
                startIcon={generating ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <AutoFixHighIcon />}
                sx={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: "12px", textTransform: "none", fontWeight: 700, py: 1.3, mb: 2, "&:hover": { backgroundColor: "#4f46e5" } }}
              >
                {generating ? "Gerando vagas..." : "Gerar vagas automaticamente (mesmo que camping)"}
              </Button>

              <input ref={mapFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleMapFileUpload} />

              <Button
                fullWidth variant="outlined"
                onClick={() => mapFileRef.current?.click()}
                disabled={uploadingMap}
                sx={{ borderColor: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: "12px", textTransform: "none", fontWeight: 700, py: 1.2, mb: 1.5, "&:hover": { borderColor: "rgba(255,255,255,0.4)", backgroundColor: "rgba(255,255,255,0.04)" } }}
              >
                {uploadingMap ? <CircularProgress size={18} sx={{ color: "#fff", mr: 1 }} /> : "📷"}
                {uploadingMap ? "Enviando..." : " Subir foto do mapa"}
              </Button>

              <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem", textAlign: "center", mb: 1.5 }}>
                — ou cole a URL da imagem —
              </Typography>

              <Box sx={{ display: "flex", gap: 1.5 }}>
                <TextField
                  fullWidth size="small" placeholder="https://..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#fff", borderRadius: "12px",
                      "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                    },
                    "& input::placeholder": { color: "rgba(255,255,255,0.3)" },
                  }}
                />
                <Button
                  variant="contained" onClick={handleSaveMapImage} disabled={!imageUrlInput.trim() || savingImage}
                  sx={{ backgroundColor: "#10b981", color: "#fff", borderRadius: "12px", textTransform: "none", fontWeight: 700, px: 3, minWidth: 100, "&:hover": { backgroundColor: "#059669" } }}
                >
                  {savingImage ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Salvar"}
                </Button>
              </Box>
            </Box>
          )}

          {(savedMapImageUrl || spots.length > 0) && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", flex: 1 }}>
                  Clique no mapa para adicionar vagas · Arraste vagas para reposicionar
                </Typography>
                <Button
                  size="small" onClick={handleGenerate} disabled={generating}
                  startIcon={generating ? <CircularProgress size={12} /> : <AutoFixHighIcon sx={{ fontSize: 14 }} />}
                  sx={{ color: "rgba(99,102,241,0.8)", textTransform: "none", fontSize: "0.75rem" }}
                >
                  Regenerar
                </Button>
                {savedMapImageUrl && (
                  <Button
                    size="small" onClick={() => { setSavedMapImageUrl(null); setMapImageUrl(""); setImageUrlInput(""); }}
                    sx={{ color: "rgba(255,255,255,0.4)", textTransform: "none", fontSize: "0.75rem" }}
                  >
                    Trocar imagem
                  </Button>
                )}
              </Box>

              <Box
                ref={containerRef}
                onClick={handleMapClick}
                sx={{
                  position: "relative", cursor: "crosshair",
                  borderRadius: "20px", overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.1)",
                  userSelect: "none",
                  backgroundColor: "rgba(255,255,255,0.03)",
                }}
              >
                {savedMapImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={savedMapImageUrl}
                    alt="Mapa de estacionamento"
                    draggable={false}
                    style={{ display: "block", width: "100%", maxHeight: 520, objectFit: "contain" }}
                  />
                ) : (
                  /* Auto-generated SVG parking lot */
                  <ParkingLotSVG spots={spots} />
                )}

                {spots.map((spot) => {
                  const x = spot.x_position ?? 50;
                  const y = spot.y_position ?? 50;
                  const isSelected = selectedSpotId === spot.id;
                  const isFull = spot.booked_count >= spot.capacity;

                  return (
                    <Box
                      key={spot.id}
                      data-spot="true"
                      onMouseDown={(e) => handleSpotMouseDown(e, spot.id)}
                      sx={{
                        position: "absolute",
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: "translate(-50%, -50%)",
                        width: 36, height: 36,
                        borderRadius: "50%",
                        backgroundColor: isSelected
                          ? "rgba(99,102,241,0.9)"
                          : isFull
                          ? "rgba(239,68,68,0.85)"
                          : "rgba(16,185,129,0.85)",
                        border: isSelected ? "2px solid #a5b4fc" : "2px solid rgba(255,255,255,0.4)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "grab",
                        boxShadow: isSelected ? "0 0 0 3px rgba(99,102,241,0.4)" : "0 2px 8px rgba(0,0,0,0.4)",
                        transition: "box-shadow 0.15s ease",
                        zIndex: isSelected ? 10 : 5,
                      }}
                    >
                      <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.65rem", lineHeight: 1, pointerEvents: "none" }}>
                        {spot.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Legend */}
              <Box sx={{ display: "flex", gap: 2, mt: 1.5, flexWrap: "wrap" }}>
                {[
                  { color: "rgba(16,185,129,0.85)", label: "Disponível" },
                  { color: "rgba(239,68,68,0.85)", label: "Ocupada" },
                  { color: "rgba(99,102,241,0.9)", label: "Selecionada" },
                ].map((item) => (
                  <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: item.color }} />
                    <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem" }}>{item.label}</Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>

        {/* Sidebar */}
        <Box sx={{ width: { xs: "100%", md: 280 }, flexShrink: 0 }}>

          {/* Selected spot editor */}
          {selectedSpot ? (
            <Box sx={{
              backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "20px", p: 2.5, mb: 2,
            }}>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", mb: 2 }}>
                Editar vaga
              </Typography>
              <TextField
                fullWidth label="Identificação" size="small" value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    color: "#fff", borderRadius: "12px",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                    "&.Mui-focused fieldset": { borderColor: "#6366f1" },
                  },
                  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#6366f1" },
                }}
              />
              <TextField
                fullWidth label="Capacidade" size="small" type="number"
                value={editCapacity}
                onChange={(e) => setEditCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                InputProps={{ inputProps: { min: 1 } }}
                sx={{
                  mb: 2.5,
                  "& .MuiOutlinedInput-root": {
                    color: "#fff", borderRadius: "12px",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                    "&.Mui-focused fieldset": { borderColor: "#6366f1" },
                  },
                  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#6366f1" },
                }}
              />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  fullWidth onClick={handleSaveSpot} disabled={saving || !editLabel.trim()}
                  startIcon={saving ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <CheckIcon />}
                  sx={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: "12px", textTransform: "none", fontWeight: 700, "&:hover": { backgroundColor: "#4f46e5" } }}
                >
                  Salvar
                </Button>
                <Tooltip title="Remover vaga">
                  <IconButton
                    onClick={handleDeleteSpot} disabled={deleting}
                    sx={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#ef4444", borderRadius: "12px", "&:hover": { backgroundColor: "rgba(239,68,68,0.2)" } }}
                  >
                    {deleting ? <CircularProgress size={18} sx={{ color: "#ef4444" }} /> : <DeleteIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
              {selectedSpot.booked_count > 0 && (
                <Typography sx={{ color: "rgba(255,165,0,0.8)", fontSize: "0.75rem", mt: 1.5 }}>
                  {selectedSpot.booked_count}/{selectedSpot.capacity} vaga(s) reservada(s)
                </Typography>
              )}
            </Box>
          ) : savedMapImageUrl && (
            <Box sx={{
              backgroundColor: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.12)",
              borderRadius: "20px", p: 2.5, mb: 2, textAlign: "center",
            }}>
              <AddIcon sx={{ color: "rgba(255,255,255,0.2)", fontSize: 32, mb: 0.5 }} />
              <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
                Clique no mapa para adicionar uma vaga
              </Typography>
            </Box>
          )}

          {/* Spots list */}
          <Box sx={{
            backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px", p: 2,
          }}>
            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", mb: 1.5 }}>
              Vagas ({spots.length})
            </Typography>
            {spots.length === 0 ? (
              <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem", textAlign: "center", py: 2 }}>
                Nenhuma vaga configurada
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
                {spots.map((spot) => {
                  const isFull = spot.booked_count >= spot.capacity;
                  return (
                    <Box
                      key={spot.id}
                      onClick={() => {
                        setSelectedSpotId(spot.id);
                        setEditLabel(spot.label);
                        setEditCapacity(spot.capacity);
                      }}
                      sx={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        p: 1.2, borderRadius: "12px", cursor: "pointer",
                        backgroundColor: selectedSpotId === spot.id ? "rgba(99,102,241,0.12)" : "transparent",
                        border: selectedSpotId === spot.id ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                        "&:hover": { backgroundColor: "rgba(255,255,255,0.04)" },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{
                          width: 28, height: 28, borderRadius: "50%",
                          backgroundColor: isFull ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                          border: `1px solid ${isFull ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Typography sx={{ color: isFull ? "#ef4444" : "#10b981", fontWeight: 800, fontSize: "0.6rem" }}>
                            {spot.label}
                          </Typography>
                        </Box>
                        <Typography sx={{ color: "#fff", fontSize: "0.82rem", fontWeight: 600 }}>
                          {spot.label}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${spot.booked_count}/${spot.capacity}`}
                        size="small"
                        sx={{
                          backgroundColor: isFull ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                          color: isFull ? "#ef4444" : "#10b981",
                          fontWeight: 700, fontSize: "0.65rem", height: 20,
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
