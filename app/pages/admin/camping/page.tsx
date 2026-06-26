"use client";

import React, { Fragment, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import NightShelterRoundedIcon from "@mui/icons-material/NightShelterRounded";
import HolidayVillageIcon from "@mui/icons-material/HolidayVillage";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import AdminMasterShell from "@/app/components/AdminMasterShell";
import { EventResponse, getEventById, uploadCampingMap } from "@/app/services/events/eventAppService";
import {
  CampingAreaResponse,
  CampingBookingInfo,
  CampingSessionResponse,
  createCampingArea,
  deleteCampingArea,
  generateDailySessions,
  getCampingAreasByEvent,
  getCampingSessionBookings,
  getCampingSessionsByEvent,
  updateCampingArea,
  uploadCampingAreaImage,
} from "@/app/services/camping/campingAdminService";

const CAMP_DAYS = Array.from({ length: 11 }, (_, i) => ({
  iso: `2026-08-${String(20 + i).padStart(2, "0")}`,
  label: `${20 + i}/08`,
}));

function Loading() {
  return (
    <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CircularProgress sx={{ color: "#fff" }} />
    </Box>
  );
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

const thSx = {
  color: "rgba(255,255,255,0.4)",
  fontSize: "0.72rem",
  fontWeight: 700,
  borderBottom: "1px solid rgba(255,255,255,0.07)",
  whiteSpace: "nowrap" as const,
  backgroundColor: "transparent",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  py: 1.2,
};

const tdSx = {
  color: "rgba(255,255,255,0.75)",
  fontSize: "0.8rem",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  whiteSpace: "nowrap" as const,
  py: 1,
};

function spotName(idx: number): string {
  const num = Math.floor(idx / 10) + 1;
  const letter = String.fromCharCode(65 + (idx % 10)); // A–J
  return `${num}${letter}`;
}

const inputSx = {
  "& .MuiInputBase-root": { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "10px", color: "#fff", fontSize: "0.88rem" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.15)" },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.45)", fontSize: "0.85rem" },
  "& .MuiInputLabel-root.Mui-focused": { color: "rgba(255,255,255,0.75)" },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface MappedEvent {
  eventId: number;
  title: string;
  campingMapUrl: string | null;
  areas: CampingAreaResponse[];
  sessions: Record<number, CampingSessionResponse[]>;
}

// ─────────────────────────────────────────────────────────────────────────────
function CampingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedEventId = Number(searchParams.get("eventId"));
  const { role, authReady, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  // ── List-mode state (no eventId) ─────────────────────────────────────────
  const [mappedEvents, setMappedEvents] = useState<MappedEvent[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [uploadingAreaId, setUploadingAreaId] = useState<number | null>(null);
  const areaImgRef = useRef<HTMLInputElement>(null);
  const areaImgTargetRef = useRef<number | null>(null);

  // ── Editor-mode state (with eventId) ─────────────────────────────────────
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [areas, setAreas] = useState<CampingAreaResponse[]>([]);
  const [sessions, setSessions] = useState<Record<number, CampingSessionResponse[]>>({});
  const [bookings, setBookings] = useState<Record<number, CampingBookingInfo>>({});
  const [loading, setLoading] = useState(true);
  const [addQty, setAddQty] = useState(1);
  const [addingSpots, setAddingSpots] = useState(false);
  const [generatingDiarias, setGeneratingDiarias] = useState(false);
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState("2026-08-20");
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const [dragAreaId, setDragAreaId] = useState<number | null>(null);
  const isDraggedRef = useRef(false);

  const canAccess = role === "admin_master" || role === "admin";

  // ── Load camping map from event (DB) ──────────────────────────────────────
  useEffect(() => {
    if (event?.camping_map_url) setMapImageUrl(event.camping_map_url);
  }, [event]);

  // ── List mode: fetch events with camping areas ────────────────────────────
  const loadMapList = useCallback(async () => {
    setListLoading(true);
    try {
      const { getEvents } = await import("@/app/services/events/eventAppService");
      const allEvents = await getEvents();

      // 1ª fase: buscar áreas de todos os eventos em paralelo
      const areaResults = await Promise.allSettled(
        allEvents.map((ev) => getCampingAreasByEvent(ev.id).then((areas) => ({ ev, areas })))
      );

      const withAreas = areaResults
        .filter((r): r is PromiseFulfilledResult<{ ev: typeof allEvents[0]; areas: CampingAreaResponse[] }> => r.status === "fulfilled")
        .map((r) => r.value)
        .filter(({ areas }) => areas.length > 0);

      // Mostra o mapa imediatamente — sem esperar sessões
      setMappedEvents(withAreas.map(({ ev, areas }) => ({
        eventId: ev.id,
        title: ev.title,
        campingMapUrl: ev.camping_map_url ?? null,
        areas,
        sessions: {},
      })));
      setListLoading(false);

      // 2ª fase: sessões em background — 1 request por evento (não por área)
      withAreas.forEach(({ ev }) => {
        getCampingSessionsByEvent(ev.id).then((allSessions) => {
          const sessionMap: Record<number, CampingSessionResponse[]> = {};
          allSessions.forEach((s) => {
            if (!sessionMap[s.area_id]) sessionMap[s.area_id] = [];
            sessionMap[s.area_id].push(s);
          });
          setMappedEvents((prev) =>
            prev.map((m) => m.eventId === ev.id ? { ...m, sessions: sessionMap } : m)
          );
        }).catch(() => {});
      });
    } catch {
      setListLoading(false);
    }
  }, []);

  // ── Area image upload (list mode) ─────────────────────────────────────────
  const triggerAreaImageUpload = (areaId: number) => {
    areaImgTargetRef.current = areaId;
    areaImgRef.current?.click();
  };

  const handleAreaImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const areaId = areaImgTargetRef.current;
    if (!file || !areaId) return;
    setUploadingAreaId(areaId);
    try {
      const updated = await uploadCampingAreaImage(areaId, file);
      setMappedEvents((prev) =>
        prev.map((me) => ({
          ...me,
          areas: me.areas.map((a) => (a.id === updated.id ? updated : a)),
        }))
      );
      showToast("Mapa da área atualizado", "success");
    } catch {
      showToast("Erro ao enviar mapa", "error");
    } finally {
      setUploadingAreaId(null);
      if (areaImgRef.current) areaImgRef.current.value = "";
      areaImgTargetRef.current = null;
    }
  };

  // ── Editor mode: load event + areas + sessions ───────────────────────────
  const loadData = useCallback(async () => {
    if (!canAccess) return;
    setLoading(true);
    try {
      // Event e áreas em paralelo — ambos usam requestedEventId diretamente
      const [selectedEvent, areasData] = await Promise.all([
        getEventById(requestedEventId),
        getCampingAreasByEvent(requestedEventId),
      ]);
      setEvent(selectedEvent);
      if (!selectedEvent) { setAreas([]); setLoading(false); return; }
      setAreas(areasData);

      // Página abre imediatamente após ter evento + áreas
      setLoading(false);

      // Sessões em background — 1 request para todas as áreas do evento
      const allSessions = await getCampingSessionsByEvent(requestedEventId);
      const sessionMap: Record<number, CampingSessionResponse[]> = {};
      allSessions.forEach((s) => {
        if (!sessionMap[s.area_id]) sessionMap[s.area_id] = [];
        sessionMap[s.area_id].push(s);
      });
      setSessions(sessionMap);
      const reserved = Object.values(sessionMap).flat().filter((s) => s.quantity_bookings > 0);
      if (reserved.length === 0) return;
      const bookingResults = await Promise.allSettled(reserved.map((s) => getCampingSessionBookings(s.id)));
      const bookingMap: Record<number, CampingBookingInfo> = {};
      bookingResults.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value.length > 0) bookingMap[reserved[i].id] = r.value[0];
      });
      setBookings(bookingMap);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Erro ao carregar áreas", "error");
      setLoading(false);
    }
  }, [canAccess, requestedEventId, showToast]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) { router.replace("/"); return; }
    if (!canAccess) router.replace("/pages/user/home");
  }, [authReady, isAuthenticated, canAccess, router]);

  useEffect(() => {
    if (!authReady || !canAccess) return;
    if (requestedEventId) {
      loadData();
    } else {
      setLoading(false);
      loadMapList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, canAccess, requestedEventId]);

  // Reload sessions whenever selected day changes so occupancy is always fresh
  useEffect(() => {
    if (!canAccess || !requestedEventId || areas.length === 0) return;
    getCampingSessionsByEvent(requestedEventId).then((allSessions) => {
      const sessionMap: Record<number, CampingSessionResponse[]> = {};
      allSessions.forEach((s) => {
        if (!sessionMap[s.area_id]) sessionMap[s.area_id] = [];
        sessionMap[s.area_id].push(s);
      });
      setSessions(sessionMap);
    }).catch(() => {});
  }, [selectedDay, canAccess, requestedEventId]);

  // ── Map upload ─────────────────────────────────────────────────────────────
  const handleMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !requestedEventId) return;
    e.target.value = "";
    try {
      const updated = await uploadCampingMap(requestedEventId, file);
      setMapImageUrl(updated.camping_map_url ?? null);
      showToast("Mapa de camping atualizado.", "success");
    } catch {
      showToast("Erro ao enviar mapa.", "error");
    }
  };

  // ── Generate daily sessions ────────────────────────────────────────────────
  const handleGenerateDiarias = async () => {
    if (!event) return;
    setGeneratingDiarias(true);
    try {
      const result = await generateDailySessions(event.id, "2026-08-20", "2026-08-30", 1);
      showToast(`${result.created} sessões criadas, ${result.skipped} já existiam (${result.areas} vagas).`, "success");
    } catch {
      showToast("Erro ao gerar sessões diárias.", "error");
    } finally {
      setGeneratingDiarias(false);
    }
  };

  // ── Add spots ──────────────────────────────────────────────────────────────
  const handleAddSpots = async () => {
    if (!event) return;
    setAddingSpots(true);
    const existing = areas.length;
    const newAreas: CampingAreaResponse[] = [];
    for (let i = 0; i < addQty; i++) {
      try {
        const created = await createCampingArea({
          event_id: event.id,
          name: spotName(existing + i),
          total_spots: 1,
          x_position: 0.5,
          y_position: 0.5,
        });
        newAreas.push(created);
      } catch {
        showToast(`Erro ao criar vaga ${spotName(existing + i)}`, "error");
      }
    }
    setAreas((prev) => [...prev, ...newAreas]);
    if (newAreas.length > 0) showToast(`${newAreas.length} vaga(s) criada(s)`, "success");
    setAddingSpots(false);
  };

  // ── Delete area ────────────────────────────────────────────────────────────
  const handleDeleteArea = (areaId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const areaSessions = sessions[areaId] ?? [];
    const hasBookings = areaSessions.some((s) => s.quantity_bookings > 0);
    if (hasBookings) {
      showToast("Não é possível excluir uma vaga com reservas ativas.", "error");
      return;
    }
    setDeleteConfirmId(areaId);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmId == null) return;
    try {
      await deleteCampingArea(deleteConfirmId);
      setAreas((prev) => prev.filter((a) => a.id !== deleteConfirmId));
      setSessions((prev) => { const next = { ...prev }; delete next[deleteConfirmId]; return next; });
    } catch {
      showToast("Erro ao excluir vaga", "error");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // ── Drag ───────────────────────────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent, areaId: number) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragAreaId(areaId);
    isDraggedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent, areaId: number) => {
    if (dragAreaId !== areaId || !mapRef.current) return;
    isDraggedRef.current = true;
    const rect = mapRef.current.getBoundingClientRect();
    const x = Math.max(0.01, Math.min(0.99, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0.01, Math.min(0.99, (e.clientY - rect.top) / rect.height));
    setAreas((prev) => prev.map((a) => a.id === areaId ? { ...a, x_position: x, y_position: y } : a));
  };

  const handlePointerUp = async (e: React.PointerEvent, areaId: number) => {
    if (dragAreaId !== areaId) return;
    const wasDragged = isDraggedRef.current;
    setDragAreaId(null);
    isDraggedRef.current = false;
    if (!wasDragged) {
      setSelectedAreaId((prev) => (prev === areaId ? null : areaId));
      return;
    }
    const area = areas.find((a) => a.id === areaId);
    if (!area) return;
    try {
      await updateCampingArea(areaId, {
        x_position: area.x_position ?? undefined,
        y_position: area.y_position ?? undefined,
      });
    } catch { /* non-critical */ }
  };

  function getAreaSessionForDay(areaId: number, dayIso: string): CampingSessionResponse | undefined {
    return sessions[areaId]?.find((s) => s.check_in_date.slice(0, 10) === dayIso);
  }

  function markerColor(areaId: number): { bg: string; fg: string } {
    const s = getAreaSessionForDay(areaId, selectedDay);
    if (!s) return { bg: "rgba(200,200,200,0.85)", fg: "#444" };
    if (s.quantity_remaining_slots === 0) return { bg: "rgba(220,50,50,0.92)", fg: "#fff" };
    if (s.quantity_remaining_slots < s.capacity * 0.3) return { bg: "rgba(255,160,0,0.92)", fg: "#fff" };
    return { bg: "rgba(34,197,94,0.92)", fg: "#fff" };
  }

  if (!authReady || loading) return <Loading />;
  if (!canAccess) return null;

  // ════════════════════════════════════════════════════════════════════════════
  // LIST MODE — no eventId in URL
  // ════════════════════════════════════════════════════════════════════════════
  if (!requestedEventId) {
    return (
      <AdminMasterShell>
        {/* hidden file input for area image upload */}
        <input ref={areaImgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAreaImageChange} />

        <Box sx={{ px: { xs: 2, md: 3 }, pt: 3, pb: 8 }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <NightShelterRoundedIcon sx={{ color: "#fff", fontSize: 24 }} />
              <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700 }}>Camping</Typography>
            </Box>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
              Áreas de camping por evento · selecione o dia para ver a ocupação
            </Typography>
          </Box>

          {/* Day selector */}
          <Box
            sx={{
              display: "flex", gap: 0.5, mb: 3, flexWrap: "wrap",
              pb: 1.5, borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {CAMP_DAYS.map((day) => {
              const active = selectedDay === day.iso;
              return (
                <Box
                  key={day.iso}
                  onClick={() => setSelectedDay(day.iso)}
                  sx={{
                    px: 1.8, py: 0.6, borderRadius: "10px", cursor: "pointer",
                    backgroundColor: active ? "#fff" : "rgba(255,255,255,0.06)",
                    color: active ? "#111" : "rgba(255,255,255,0.5)",
                    fontWeight: active ? 700 : 500, fontSize: "0.8rem",
                    transition: "all 0.15s",
                    "&:hover": { backgroundColor: active ? "#fff" : "rgba(255,255,255,0.1)", color: active ? "#111" : "#fff" },
                  }}
                >
                  {day.label}
                </Box>
              );
            })}
          </Box>

          {/* Legend */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            {[
              { color: "rgba(255,255,255,0.9)", label: "Livre" },
              { color: "#fb923c", label: "Ocupada" },
              { color: "rgba(200,200,200,0.5)", label: "Sem sessão" },
            ].map((l) => (
              <Box key={l.label} sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "3px", backgroundColor: l.color, border: "1px solid rgba(0,0,0,0.2)" }} />
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>{l.label}</Typography>
              </Box>
            ))}
          </Box>

          {listLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
              <CircularProgress sx={{ color: "#fff" }} />
            </Box>
          ) : mappedEvents.length === 0 ? (
            <Box
              sx={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                minHeight: 320, gap: 2,
                border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 4,
              }}
            >
              <NightShelterRoundedIcon sx={{ fontSize: 52, color: "rgba(255,255,255,0.12)" }} />
              <Typography sx={{ color: "rgba(255,255,255,0.35)", fontWeight: 700, fontSize: "1rem" }}>
                Nenhuma área de camping cadastrada
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.82rem", textAlign: "center", maxWidth: 360 }}>
                Acesse um evento e adicione vagas de camping para começar
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {mappedEvents.map((me) => (
                <Paper
                  key={me.eventId}
                  elevation={0}
                  sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}
                >
                  {/* Event header */}
                  <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <NightShelterRoundedIcon sx={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }} />
                      <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>{me.title}</Typography>
                      <Box sx={{ backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 1, px: 1, py: 0.2 }}>
                        <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.7rem", fontWeight: 600 }}>
                          {me.areas.length} vaga{me.areas.length !== 1 ? "s" : ""}
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      size="small"
                      endIcon={<ChevronRightIcon sx={{ fontSize: 16 }} />}
                      onClick={() => router.push(`/pages/admin/camping?eventId=${me.eventId}`)}
                      sx={{ backgroundColor: "#fff", color: "#111", fontWeight: 700, textTransform: "none", fontSize: "0.78rem", borderRadius: "10px", px: 1.8, "&:hover": { backgroundColor: "#e8e8e8" } }}
                    >
                      Gerenciar
                    </Button>
                  </Box>

                  {/* Map with markers or grid fallback */}
                  {me.campingMapUrl ? (
                    <Box sx={{ position: "relative", lineHeight: 0, borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={me.campingMapUrl}
                        alt={`Mapa de camping — ${me.title}`}
                        style={{ width: "100%", display: "block", backgroundColor: "rgba(0,0,0,0.45)" }}
                      />
                      {me.areas.map((area) => {
                        const x = area.x_position ?? 0.5;
                        const y = area.y_position ?? 0.5;
                        const areaSessions = me.sessions[area.id] ?? [];
                        const s = areaSessions.find((ss) => ss.check_in_date.slice(0, 10) === selectedDay);
                        const isFull = s ? s.quantity_remaining_slots === 0 : false;
                        const isLow = s ? (s.quantity_remaining_slots > 0 && s.quantity_remaining_slots < s.capacity * 0.3) : false;
                        const bg = !s
                          ? "rgba(200,200,200,0.7)"
                          : isFull
                          ? "#fb923c"
                          : isLow
                          ? "#fbbf24"
                          : "rgba(255,255,255,0.93)";
                        const fg = !s ? "#555" : isFull ? "#fff" : "#111";
                        return (
                          <Box
                            key={area.id}
                            sx={{
                              position: "absolute",
                              left: `${x * 100}%`,
                              top: `${y * 100}%`,
                              transform: "translate(-50%, -50%)",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              pointerEvents: "none",
                            }}
                          >
                            <Box sx={{
                              width: 36, height: 30,
                              borderRadius: "6px",
                              backgroundColor: bg,
                              border: "1.5px solid rgba(0,0,0,0.2)",
                              display: "flex", flexDirection: "column",
                              alignItems: "center", justifyContent: "center",
                              boxShadow: "0 2px 10px rgba(0,0,0,0.6)",
                              transition: "background-color 0.2s ease",
                            }}>
                              <HolidayVillageIcon sx={{ fontSize: 15, color: fg, lineHeight: 1 }} />
                              <Typography sx={{ fontSize: "0.5rem", fontWeight: 800, color: fg, lineHeight: 1.1, letterSpacing: "0.02em" }}>
                                {area.name}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Box sx={{ p: 2, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 1.5 }}>
                      {me.areas.map((area) => {
                        const isUploading = uploadingAreaId === area.id;
                        return (
                          <Box key={area.id} sx={{ position: "relative", borderRadius: 2, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.35)", aspectRatio: "4/3" }}>
                            {area.image_url ? (
                              <Box component="img" src={area.image_url} alt={area.name} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            ) : (
                              <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                <HolidayVillageIcon sx={{ color: "rgba(255,255,255,0.2)", fontSize: 28 }} />
                                <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.65rem" }}>sem mapa</Typography>
                              </Box>
                            )}
                            <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.75))", px: 1, py: 0.8 }}>
                              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {area.name}
                              </Typography>
                            </Box>
                            <IconButton size="small" onClick={() => triggerAreaImageUpload(area.id)} disabled={isUploading}
                              sx={{ position: "absolute", top: 6, right: 6, backgroundColor: "rgba(0,0,0,0.6)", color: "#fff", width: 28, height: 28, "&:hover": { backgroundColor: "#ffcc01", color: "#000" } }}>
                              {isUploading ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <PhotoCameraIcon sx={{ fontSize: 15 }} />}
                            </IconButton>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </AdminMasterShell>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // EDITOR MODE — eventId in URL
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, display: "flex", flexDirection: "column" }}>
      {/* ── Header ── */}
      <Box
        sx={{
          px: { xs: 2, md: 3 }, pt: 2.5, pb: 1.5,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 2, flexWrap: "wrap",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton
            onClick={() => router.push(`/pages/admin/events/${requestedEventId}`)}
            sx={{ color: "#fff", width: 44, height: 44, backgroundColor: "rgba(255,255,255,0.06)", "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, lineHeight: 1.2, fontSize: "1.05rem" }}>
              Camping
            </Typography>
            {event && (
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>{event.title}</Typography>
            )}
          </Box>
        </Box>

        {event && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                display: "flex", alignItems: "center",
                backgroundColor: "#fff", borderRadius: "12px",
                overflow: "hidden", height: 38,
              }}
            >
              <Box
                component="input"
                type="number"
                value={addQty}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddQty(Math.max(1, Math.min(50, Number(e.target.value))))}
                min={1}
                max={50}
                sx={{
                  width: 44, border: "none", outline: "none",
                  backgroundColor: "transparent", color: "#111",
                  fontWeight: 700, fontSize: "0.88rem",
                  textAlign: "center", px: 0.5,
                  "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": { opacity: 1 },
                }}
              />
              <Box sx={{ width: "1px", height: 20, backgroundColor: "rgba(0,0,0,0.12)" }} />
              <Button
                startIcon={addingSpots ? <CircularProgress size={14} sx={{ color: "#111" }} /> : <AddIcon sx={{ fontSize: 16 }} />}
                onClick={handleAddSpots}
                disabled={addingSpots}
                sx={{
                  backgroundColor: "transparent", color: "#111", fontWeight: 700,
                  textTransform: "none", borderRadius: 0, px: 2, height: "100%",
                  whiteSpace: "nowrap", minWidth: 0,
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.06)" },
                  "&:disabled": { color: "rgba(0,0,0,0.35)" },
                }}
              >
                Adicionar vagas
              </Button>
            </Box>
            <Button
              startIcon={generatingDiarias ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : null}
              onClick={handleGenerateDiarias}
              disabled={generatingDiarias}
              sx={{
                backgroundColor: "rgba(255,204,1,0.15)", color: "#ffcc01",
                border: "1px solid rgba(255,204,1,0.3)",
                fontWeight: 700, textTransform: "none", borderRadius: "12px", px: 2, whiteSpace: "nowrap",
                "&:hover": { backgroundColor: "rgba(255,204,1,0.25)" },
                "&:disabled": { opacity: 0.5 },
              }}
            >
              Gerar diárias 20–30/08
            </Button>
          </Box>
        )}
      </Box>

      {/* ── Day tabs ── */}
      {event && (
        <Box
          sx={{
            px: { xs: 1.5, md: 3 }, pt: 1.2, pb: 1,
            display: "flex", gap: 0.5, justifyContent: "center",
            overflowX: "auto",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
          }}
        >
          {CAMP_DAYS.map((day) => {
            const active = selectedDay === day.iso;
            return (
              <Box
                key={day.iso}
                onClick={() => setSelectedDay(day.iso)}
                sx={{
                  px: 1.8, py: 0.65,
                  borderRadius: "10px",
                  cursor: "pointer",
                  flexShrink: 0,
                  backgroundColor: active ? "#fff" : "rgba(255,255,255,0.06)",
                  color: active ? "#111" : "rgba(255,255,255,0.5)",
                  fontWeight: active ? 700 : 500,
                  fontSize: "0.82rem",
                  transition: "all 0.15s",
                  "&:hover": { backgroundColor: active ? "#fff" : "rgba(255,255,255,0.1)", color: active ? "#111" : "#fff" },
                }}
              >
                {day.label}
              </Box>
            );
          })}
        </Box>
      )}

      {/* ── Body ── */}
      {!event ? (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography sx={{ color: "rgba(255,255,255,0.4)" }}>Evento não encontrado</Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, px: { xs: 2, md: 3 }, pt: 2, pb: 5 }}>
          {/* ── Map section ── */}
          {!mapImageUrl ? (
            <Box
              component="label"
              sx={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                minHeight: { xs: 280, md: 500 },
                borderRadius: 3, border: "2px dashed rgba(255,255,255,0.18)",
                cursor: "pointer", gap: 1.5, transition: "all 0.2s",
                "&:hover": { borderColor: "rgba(255,255,255,0.38)", backgroundColor: "rgba(255,255,255,0.02)" },
              }}
            >
              <input type="file" accept="image/*" hidden onChange={handleMapUpload} />
              <CloudUploadIcon sx={{ color: "rgba(255,255,255,0.22)", fontSize: 56 }} />
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: "1rem" }}>
                Subir mapa do camping
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem" }}>PNG, JPG ou SVG</Typography>
            </Box>
          ) : (
            <Box
              ref={mapRef}
              sx={{ position: "relative", borderRadius: 3, overflow: "hidden", lineHeight: 0, maxWidth: "62%", mx: "auto" }}
            >
              <Box
                component="img"
                src={mapImageUrl}
                alt="Mapa camping"
                draggable={false}
                sx={{
                  width: "100%", display: "block",
                  objectFit: "contain",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  userSelect: "none",
                }}
              />

              <Box
                component="label"
                sx={{
                  position: "absolute", top: 10, right: 10,
                  backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
                  borderRadius: 1.5, px: 1.5, py: 0.6, cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.12)",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.8)" },
                }}
              >
                <input type="file" accept="image/*" hidden onChange={handleMapUpload} />
                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.72rem", userSelect: "none" }}>
                  Trocar mapa
                </Typography>
              </Box>

              {areas.length === 0 && (
                <Typography
                  sx={{
                    position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center",
                    color: "rgba(255,255,255,0.3)", fontSize: "0.82rem", pointerEvents: "none",
                  }}
                >
                  Adicione vagas e arraste para posicionar · toque para ver os horários
                </Typography>
              )}

              {areas.map((area, idx) => {
                const x = area.x_position ?? (0.08 + (idx % 5) * 0.18);
                const y = area.y_position ?? (0.08 + Math.floor(idx / 5) * 0.15);
                const isDragging = dragAreaId === area.id;
                const { bg: mBg, fg: mFg } = markerColor(area.id);
                return (
                  <Box
                    key={area.id}
                    onPointerDown={(e) => handlePointerDown(e, area.id)}
                    onPointerMove={(e) => handlePointerMove(e, area.id)}
                    onPointerUp={(e) => handlePointerUp(e, area.id)}
                    sx={{
                      position: "absolute",
                      left: `${x * 100}%`,
                      top: `${y * 100}%`,
                      transform: "translate(-50%, -50%)",
                      userSelect: "none",
                      touchAction: "none",
                      zIndex: isDragging ? 10 : 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 48, height: 40,
                        borderRadius: "6px",
                        backgroundColor: mBg,
                        color: mFg,
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        gap: 0,
                        cursor: isDragging ? "grabbing" : "grab",
                        border: "2px solid rgba(0,0,0,0.18)",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.6)",
                        transition: isDragging ? "none" : "transform 0.12s",
                        "&:hover": { transform: "scale(1.1)" },
                      }}
                    >
                      <HolidayVillageIcon sx={{ fontSize: 18, lineHeight: 1 }} />
                      <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, lineHeight: 1.1, letterSpacing: "0.02em", color: mFg }}>
                        {area.name}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerUp={(e) => e.stopPropagation()}
                      onClick={(e) => handleDeleteArea(area.id, e)}
                      sx={{
                        position: "absolute", top: -8, right: -8,
                        width: 18, height: 18,
                        backgroundColor: "rgba(220,50,50,0.9)", color: "#fff", p: 0,
                        "&:hover": { backgroundColor: "#e53935" },
                        "& .MuiSvgIcon-root": { fontSize: 11 },
                      }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* ── Day table ── */}
          {areas.length > 0 && (
            <Paper
              elevation={0}
              sx={{ mt: 3, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}
            >
              <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>
                  Vagas — {CAMP_DAYS.find((d) => d.iso === selectedDay)?.label}
                </Typography>
              </Box>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={thSx}>Vaga</TableCell>
                      <TableCell sx={thSx}>Status</TableCell>
                      <TableCell sx={thSx}>Nome</TableCell>
                      <TableCell sx={thSx}>CPF</TableCell>
                      <TableCell sx={thSx}>E-mail</TableCell>
                      <TableCell sx={thSx} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...areas].sort((a, b) => {
                      const parse = (n: string) => {
                        const m = n.match(/^(\d+)([A-Za-z]*)$/);
                        return m ? [parseInt(m[1]), m[2].toUpperCase()] as [number, string] : [0, n] as [number, string];
                      };
                      const [an, al] = parse(a.name);
                      const [bn, bl] = parse(b.name);
                      return an !== bn ? an - bn : al.localeCompare(bl);
                    }).map((area) => {
                      const s = getAreaSessionForDay(area.id, selectedDay);
                      const isOccupied = s ? s.quantity_remaining_slots === 0 : false;
                      const booking = s ? bookings[s.id] : undefined;
                      return (
                        <TableRow key={area.id} onClick={() => setSelectedAreaId(area.id)} sx={{ "&:last-child td": { borderBottom: 0 }, cursor: "pointer", "&:hover td": { backgroundColor: "rgba(255,255,255,0.03)" } }}>
                          <TableCell sx={{ ...tdSx, fontWeight: 700, color: "#fff" }}>{area.name}</TableCell>
                          <TableCell sx={tdSx}>
                            <Chip
                              label={!s ? "Sem sessão" : isOccupied ? "Ocupado" : "Livre"}
                              size="small"
                              sx={{
                                backgroundColor: !s
                                  ? "rgba(255,255,255,0.07)"
                                  : isOccupied
                                  ? "rgba(239,68,68,0.15)"
                                  : "rgba(46,204,113,0.15)",
                                color: !s ? "rgba(255,255,255,0.35)" : isOccupied ? "#f87171" : "#4ade80",
                                fontWeight: 700, fontSize: "0.65rem", height: 20,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={tdSx}>{booking?.user_name ?? "—"}</TableCell>
                          <TableCell sx={tdSx}>
                            {booking?.user_cpf
                              ? booking.user_cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                              : "—"}
                          </TableCell>
                          <TableCell sx={tdSx}>{booking?.user_email ?? "—"}</TableCell>
                          <TableCell sx={{ ...tdSx, p: 0 }} onClick={(e) => e.stopPropagation()}>
                            <IconButton
                              size="small"
                              onClick={(e) => handleDeleteArea(area.id, e)}
                              sx={{ color: "rgba(255,255,255,0.2)", "&:hover": { color: "#f87171" } }}
                            >
                              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          )}

          {/* ── Delete confirmation modal ── */}
          {(() => {
            const area = areas.find((a) => a.id === deleteConfirmId);
            return (
              <Dialog
                open={deleteConfirmId != null}
                onClose={() => setDeleteConfirmId(null)}
                PaperProps={{ sx: { backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3 } }}
              >
                <DialogTitle sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
                  Excluir vaga {area?.name}?
                </DialogTitle>
                <DialogContent>
                  <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem" }}>
                    Esta ação não pode ser desfeita.
                  </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                  <Button
                    onClick={() => setDeleteConfirmId(null)}
                    sx={{ color: "rgba(255,255,255,0.45)", textTransform: "none", fontWeight: 600, "&:hover": { color: "#fff" } }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmDelete}
                    sx={{
                      backgroundColor: "rgba(239,68,68,0.15)", color: "#f87171",
                      border: "1px solid rgba(239,68,68,0.3)",
                      textTransform: "none", fontWeight: 700, borderRadius: "10px", px: 2.5,
                      "&:hover": { backgroundColor: "rgba(239,68,68,0.25)" },
                    }}
                  >
                    Excluir
                  </Button>
                </DialogActions>
              </Dialog>
            );
          })()}

          {/* ── Area detail modal ── */}
          {(() => {
            const area = areas.find((a) => a.id === selectedAreaId);
            const areaSessions = area ? (sessions[area.id] ?? []) : [];
            return (
              <Dialog
                open={selectedAreaId != null}
                onClose={() => { setSelectedAreaId(null); setExpandedSessionId(null); }}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3 } }}
              >
                {area && (
                  <>
                    <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
                          Vaga {area.name}
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem" }}>
                          {areaSessions.length} dia(s) cadastrado(s)
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => { setSelectedAreaId(null); setExpandedSessionId(null); }} sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#fff" } }}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </DialogTitle>

                    <DialogContent sx={{ p: 0 }}>
                      {areaSessions.length === 0 ? (
                        <Box sx={{ py: 4, textAlign: "center" }}>
                          <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.85rem" }}>
                            Nenhum dia cadastrado para esta vaga
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ overflowX: "auto" }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={thSx}>Dia</TableCell>
                                <TableCell sx={thSx}>Status</TableCell>
                                <TableCell sx={thSx}>Nome</TableCell>
                                <TableCell sx={thSx}>CPF</TableCell>
                                <TableCell sx={thSx}>E-mail</TableCell>
                                <TableCell sx={thSx} />
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {areaSessions.map((s) => {
                                const booking = bookings[s.id];
                                const isOccupied = s.quantity_bookings > 0;
                                const isExpanded = expandedSessionId === s.id;
                                return (
                                  <Fragment key={s.id}>
                                    <TableRow
                                      onClick={() => isOccupied && setExpandedSessionId(isExpanded ? null : s.id)}
                                      sx={{
                                        cursor: isOccupied ? "pointer" : "default",
                                        "&:hover td": isOccupied ? { backgroundColor: "rgba(255,255,255,0.03)" } : {},
                                        backgroundColor: isExpanded ? "rgba(255,255,255,0.04)" : "transparent",
                                      }}
                                    >
                                      <TableCell sx={tdSx}>{s.label}</TableCell>
                                      <TableCell sx={tdSx}>
                                        <Chip
                                          label={isOccupied ? "Ocupado" : "Livre"}
                                          size="small"
                                          sx={{
                                            backgroundColor: isOccupied ? "rgba(251,146,60,0.15)" : "rgba(46,204,113,0.15)",
                                            color: isOccupied ? "#fb923c" : "#4ade80",
                                            fontWeight: 700, fontSize: "0.65rem", height: 20,
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell sx={tdSx}>{booking?.user_name ?? "—"}</TableCell>
                                      <TableCell sx={tdSx}>
                                        {booking?.user_cpf
                                          ? booking.user_cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                                          : "—"}
                                      </TableCell>
                                      <TableCell sx={tdSx}>{booking?.user_email ?? "—"}</TableCell>
                                      <TableCell sx={{ ...tdSx, width: 24 }}>
                                        {isOccupied && (
                                          <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.85rem", lineHeight: 1, transform: isExpanded ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform 0.15s" }}>
                                            ›
                                          </Typography>
                                        )}
                                      </TableCell>
                                    </TableRow>

                                    {/* Expanded booking detail */}
                                    {isExpanded && booking && (
                                      <TableRow sx={{ backgroundColor: "rgba(251,146,60,0.04)" }}>
                                        <TableCell colSpan={6} sx={{ borderBottom: "1px solid rgba(255,255,255,0.06)", p: 0 }}>
                                          <Box sx={{ px: 2.5, py: 2, display: "flex", gap: 2.5, alignItems: "flex-start", flexWrap: "wrap" }}>
                                            {/* Avatar */}
                                            <Box sx={{
                                              width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                                              overflow: "hidden", border: "2px solid rgba(255,255,255,0.1)",
                                              backgroundColor: "rgba(255,255,255,0.06)",
                                              display: "flex", alignItems: "center", justifyContent: "center",
                                            }}>
                                              {booking.user_profile_photo ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={booking.user_profile_photo} alt={booking.user_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                              ) : (
                                                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "1.1rem" }}>
                                                  {booking.user_name.charAt(0).toUpperCase()}
                                                </Typography>
                                              )}
                                            </Box>

                                            {/* Info grid */}
                                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 1.5, flex: 1 }}>
                                              <Box>
                                                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.3 }}>Reservado em</Typography>
                                                <Typography sx={{ color: "#fff", fontSize: "0.8rem", fontWeight: 600 }}>
                                                  {new Date(booking.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                                                  {" às "}
                                                  {new Date(booking.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                                </Typography>
                                              </Box>

                                              <Box>
                                                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.3 }}>Forma de reserva</Typography>
                                                <Typography sx={{ color: "#fff", fontSize: "0.8rem", fontWeight: 600 }}>Aplicativo</Typography>
                                              </Box>

                                              <Box>
                                                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.3 }}>Check-in</Typography>
                                                <Typography sx={{ color: booking.checked_in_at ? "#4ade80" : "rgba(255,255,255,0.35)", fontSize: "0.8rem", fontWeight: 600 }}>
                                                  {booking.checked_in_at
                                                    ? `${new Date(booking.checked_in_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} às ${new Date(booking.checked_in_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                                                    : "Não realizado"}
                                                </Typography>
                                              </Box>

                                              <Box>
                                                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.3 }}>E-mail</Typography>
                                                <Typography sx={{ color: "#fff", fontSize: "0.8rem", fontWeight: 600 }}>{booking.user_email}</Typography>
                                              </Box>
                                            </Box>
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </Fragment>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </Box>
                      )}
                    </DialogContent>
                  </>
                )}
              </Dialog>
            );
          })()}
        </Box>
      )}
    </Box>
  );
}

export default function CampingAdminPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CampingPageContent />
    </Suspense>
  );
}
