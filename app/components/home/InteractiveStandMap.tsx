"use client";

import {
  forwardRef,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Slide,
  Typography,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import QrCodeIcon from "@mui/icons-material/QrCode";
import StorefrontIcon from "@mui/icons-material/Storefront";
import React from "react";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/context/ToastContext";
import {
  createUserStandBooking,
  getUserEventStands,
  UserEventStand,
  UserStandBooking,
} from "@/app/services/liveStands/liveStandUserService";

// ─── Stand positions on the map (percentage of image width/height) ─────────────
// Adjust these values to match the exact stand locations on the map image.

interface StandPosition {
  x: number;    // % from left
  y: number;    // % from top
  color: string;
  labelOffset?: { x?: number; y?: number }; // fine-tune label placement
}

const STAND_CONFIGS: { keys: string[]; config: StandPosition }[] = [
  {
    keys: ["coca"],
    config: { x: 30, y: 54, color: "#CC0000" },
  },
  {
    keys: ["tic tac", "tictac"],
    config: { x: 64, y: 42, color: "#00A651" },
  },
  {
    keys: ["bauducco"],
    config: { x: 50, y: 68, color: "#E8850C" },
  },
];

const FALLBACK_POSITIONS: StandPosition[] = [
  { x: 22, y: 38, color: "#6C63FF" },
  { x: 78, y: 58, color: "#FF6B6B" },
  { x: 40, y: 75, color: "#4ECDC4" },
  { x: 72, y: 72, color: "#FFD93D" },
];

function getStandConfig(name: string, fallbackIndex: number): StandPosition {
  const lower = name.toLowerCase();
  for (const { keys, config } of STAND_CONFIGS) {
    if (keys.some((k) => lower.includes(k))) return config;
  }
  return FALLBACK_POSITIONS[fallbackIndex % FALLBACK_POSITIONS.length];
}

// ─── Queue type helpers ───────────────────────────────────────────────────────
// "queue" stands work with ordered position (3 people enter at a time).
// "bulk" stands allow a group at the door simultaneously.

const QUEUE_STAND_KEYS = ["tic tac", "tictac", "bauducco"];

function isQueueStand(name: string): boolean {
  const lower = name.toLowerCase();
  return QUEUE_STAND_KEYS.some((k) => lower.includes(k));
}

// ─── Bottom sheet transition ──────────────────────────────────────────────────

const SlideUp = forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});
SlideUp.displayName = "SlideUp";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  eventId: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InteractiveStandMap({ eventId }: Props) {
  const router = useRouter();
  const { showToast } = useToast();

  const [stands, setStands] = useState<UserEventStand[]>([]);
  const [loading, setLoading] = useState(true);

  const showToastRef = useRef(showToast);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);

  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedStand, setSelectedStand] = useState<UserEventStand | null>(null);

  const [selectedDate, setSelectedDate] = useState("");
  const [bookingSessionId, setBookingSessionId] = useState<number | null>(null);
  const [bookingToShowQr, setBookingToShowQr] = useState<UserStandBooking | null>(null);

  // Load stands
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserEventStands(eventId);
      setStands(data);
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      showToastRef.current(detail || "Erro ao carregar estandes", "error");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Group sessions by date for the selected stand
  const groupedSessions = useMemo(() => {
    if (!selectedStand) return [];
    const groups = new Map<string, typeof selectedStand.sessions>();
    [...selectedStand.sessions]
      .sort((a, b) =>
        a.session_date !== b.session_date
          ? a.session_date.localeCompare(b.session_date)
          : a.start_time.localeCompare(b.start_time)
      )
      .forEach((s) => {
        const list = groups.get(s.session_date) ?? [];
        list.push(s);
        groups.set(s.session_date, list);
      });
    return Array.from(groups.entries()).map(([date, sessions]) => ({ date, sessions }));
  }, [selectedStand]);

  useEffect(() => {
    if (!groupedSessions.length) { setSelectedDate(""); return; }
    if (!groupedSessions.some((g) => g.date === selectedDate)) {
      setSelectedDate(groupedSessions[0].date);
    }
  }, [groupedSessions, selectedDate]);

  const activeGroup = groupedSessions.find((g) => g.date === selectedDate) ?? groupedSessions[0] ?? null;

  const applyBooked = useCallback((booking: UserStandBooking) => {
    setStands((cur) =>
      cur.map((stand) =>
        stand.id !== booking.stand_id
          ? stand
          : {
              ...stand,
              sessions: stand.sessions.map((s) =>
                s.id !== booking.stand_session_id
                  ? s
                  : { ...s, is_booked: true, booked_slots: s.booked_slots + 1, remaining_slots: Math.max(s.remaining_slots - 1, 0) }
              ),
            }
      )
    );
    if (selectedStand?.id === booking.stand_id) {
      setSelectedStand((cur) =>
        cur
          ? {
              ...cur,
              sessions: cur.sessions.map((s) =>
                s.id !== booking.stand_session_id
                  ? s
                  : { ...s, is_booked: true, booked_slots: s.booked_slots + 1, remaining_slots: Math.max(s.remaining_slots - 1, 0) }
              ),
            }
          : cur
      );
    }
  }, [selectedStand]);

  const handleBooking = async (e: MouseEvent<HTMLButtonElement>, sessionId: number) => {
    e.stopPropagation();
    setBookingSessionId(sessionId);
    try {
      // Capture booked_slots before booking to compute queue position
      const sessionSnapshot = stands
        .flatMap((s) => s.sessions)
        .find((s) => s.id === sessionId);
      const queuePosition = sessionSnapshot ? sessionSnapshot.booked_slots + 1 : undefined;

      const booking = await createUserStandBooking(sessionId);

      // Attach position locally (API may or may not return it)
      if (queuePosition !== undefined && isQueueStand(booking.stand_name)) {
        booking.queue_position = queuePosition;
        // Persist so the stand-bookings page can display it without re-fetching
        if (typeof window !== "undefined") {
          localStorage.setItem(`stand_queue_pos_${booking.id}`, String(queuePosition));
        }
      }

      applyBooked(booking);
      setBookingToShowQr(booking);
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      showToast(detail || "Erro ao criar agendamento", "error");
    } finally {
      setBookingSessionId(null);
    }
  };

  // Stands with their map positions
  const standsWithPos = useMemo(
    () => stands.map((stand, i) => ({ stand, pos: getStandConfig(stand.name, i) })),
    [stands]
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress sx={{ color: "#ff1f21" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 1.5, md: 3 }, pb: 10 }}>

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <StorefrontIcon sx={{ color: "#ffc91f" }} />
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700 }}>Estandes</Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => router.push("/pages/user/stand-bookings")}
          sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", textTransform: "none", "&:hover": { borderColor: "rgba(255,255,255,0.5)", backgroundColor: "rgba(255,255,255,0.06)" } }}
        >
          Meus agendamentos
        </Button>
      </Box>

      {/* Map */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.1)",
          userSelect: "none",
        }}
      >
        {/* Base map image */}
        <Box
          component="img"
          src="/mapa/Mapa-do-Rock-In-Rio-2024.png"
          alt="Mapa Rock in Rio"
          sx={{ width: "100%", height: "auto", display: "block" }}
        />

        {/* Dark vignette overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.35) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Stand hotspots */}
        {standsWithPos.map(({ stand, pos }) => {
          const isHovered = hoveredId === stand.id;
          const c = pos.color;

          return (
            <Box key={stand.id}>
              {/* Outer ripple ring (no pointer events) */}
              <Box
                sx={{
                  position: "absolute",
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  width: { xs: 52, md: 72 },
                  height: { xs: 52, md: 72 },
                  borderRadius: "50%",
                  border: `1.5px solid ${c}`,
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                  animation: "rippleOut 2.4s ease-out infinite",
                  "@keyframes rippleOut": {
                    "0%":   { transform: "translate(-50%, -50%) scale(0.85)", opacity: 0.9 },
                    "100%": { transform: "translate(-50%, -50%) scale(1.6)",  opacity: 0   },
                  },
                }}
              />

              {/* Secondary slower ripple */}
              <Box
                sx={{
                  position: "absolute",
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  width: { xs: 52, md: 72 },
                  height: { xs: 52, md: 72 },
                  borderRadius: "50%",
                  border: `1px solid ${c}88`,
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                  animation: "rippleOut2 2.4s ease-out infinite",
                  animationDelay: "1.2s",
                  "@keyframes rippleOut2": {
                    "0%":   { transform: "translate(-50%, -50%) scale(0.85)", opacity: 0.6 },
                    "100%": { transform: "translate(-50%, -50%) scale(1.6)",  opacity: 0   },
                  },
                }}
              />

              {/* Clickable hotspot */}
              <Box
                onClick={() => { setSelectedStand(stand); setSelectedDate(""); }}
                onMouseEnter={() => setHoveredId(stand.id)}
                onMouseLeave={() => setHoveredId(null)}
                sx={{
                  position: "absolute",
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  width: { xs: 32, md: 44 },
                  height: { xs: 32, md: 44 },
                  borderRadius: "50%",
                  cursor: "pointer",
                  transform: isHovered
                    ? "translate(-50%, -50%) scale(1.35)"
                    : "translate(-50%, -50%) scale(1)",
                  background: isHovered
                    ? `radial-gradient(circle, ${c} 0%, ${c}bb 50%, ${c}44 100%)`
                    : `radial-gradient(circle, ${c}cc 0%, ${c}88 50%, ${c}33 100%)`,
                  border: `2px solid ${c}`,
                  boxShadow: isHovered
                    ? `0 0 28px ${c}, 0 0 56px ${c}88, 0 0 84px ${c}44`
                    : `0 0 12px ${c}88, 0 0 24px ${c}44`,
                  transition: "transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease",
                  animation: "hotspotPulse 2.6s ease-in-out infinite",
                  "@keyframes hotspotPulse": {
                    "0%":   { boxShadow: `0 0 10px ${c}66, 0 0 20px ${c}33` },
                    "50%":  { boxShadow: `0 0 22px ${c}aa, 0 0 44px ${c}66` },
                    "100%": { boxShadow: `0 0 10px ${c}66, 0 0 20px ${c}33` },
                  },
                  zIndex: 2,
                }}
              >
                {/* Inner dot */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: "25%",
                    borderRadius: "50%",
                    backgroundColor: "#fff",
                    opacity: isHovered ? 1 : 0.85,
                    boxShadow: `0 0 8px ${c}`,
                  }}
                />
              </Box>

              {/* Hover label */}
              {isHovered && (
                <Box
                  sx={{
                    position: "absolute",
                    left: `${pos.x}%`,
                    top: `${pos.y - 9}%`,
                    transform: "translate(-50%, -100%)",
                    pointerEvents: "none",
                    zIndex: 10,
                    animation: "labelIn 0.14s ease",
                    "@keyframes labelIn": {
                      "0%":   { opacity: 0, transform: "translate(-50%, -90%)" },
                      "100%": { opacity: 1, transform: "translate(-50%, -100%)" },
                    },
                  }}
                >
                  {/* Arrow */}
                  <Box
                    sx={{
                      width: 0, height: 0,
                      borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent",
                      borderTop: `6px solid ${c}`,
                      mx: "auto",
                      mb: "-1px",
                    }}
                  />
                  <Box
                    sx={{
                      backgroundColor: "rgba(8,8,8,0.92)",
                      backdropFilter: "blur(10px)",
                      border: `1.5px solid ${c}`,
                      borderRadius: "8px",
                      px: 1.5,
                      py: 0.75,
                      whiteSpace: "nowrap",
                      boxShadow: `0 4px 20px rgba(0,0,0,0.6), 0 0 12px ${c}55`,
                    }}
                  >
                    <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: { xs: "0.75rem", md: "0.85rem" } }}>
                      {stand.name}
                    </Typography>
                    <Typography sx={{ color: `${c}`, fontSize: "0.68rem", fontWeight: 600 }}>
                      {stand.sessions.filter((s) => s.remaining_slots > 0).length} sessao(oes) com vagas
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          );
        })}

      </Box>

      {/* Map legend + hint */}
      <Box
        sx={{
          mt: 1.5,
          px: 0.5,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Legenda
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: { xs: 1.5, md: 2.5 } }}>
          {standsWithPos.map(({ stand, pos }) => (
            <Box key={stand.id} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ flexShrink: 0, width: 10, height: 10, borderRadius: "50%", backgroundColor: pos.color, boxShadow: `0 0 6px ${pos.color}` }} />
              <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.78rem", fontWeight: 600, lineHeight: 1.2 }}>
                {stand.name}
              </Typography>
            </Box>
          ))}
        </Box>
        <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", mt: 0.25 }}>
          Toque em um ponto do mapa para ver os horarios e agendar sua visita
        </Typography>
      </Box>

      {/* ── Bottom Sheet: Stand details ── */}
      <Dialog
        open={!!selectedStand}
        onClose={() => setSelectedStand(null)}
        TransitionComponent={SlideUp}
        keepMounted={false}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            m: 0,
            width: "100%",
            maxWidth: "100%",
            borderRadius: "20px 20px 0 0",
            backgroundColor: "#111827",
            color: "#fff",
            maxHeight: "82vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}
        sx={{ "& .MuiBackdrop-root": { backgroundColor: "rgba(0,0,0,0.75)" } }}
      >
        {selectedStand && (
          <>
            {/* Stand image header */}
            {selectedStand.image_url && (
              <Box sx={{ position: "relative", height: { xs: 180, sm: 220 }, flexShrink: 0 }}>
                <Box
                  component="img"
                  src={selectedStand.image_url}
                  alt={selectedStand.name}
                  sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                {/* Gradient fade */}
                <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, #111827 100%)" }} />
                {/* Stand name over image */}
                <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, px: 2.5, pb: 1.5 }}>
                  <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: { xs: "1.3rem", md: "1.6rem" } }}>
                    {selectedStand.name}
                  </Typography>
                  {selectedStand.description && (
                    <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.88rem", mt: 0.25 }}>
                      {selectedStand.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            {!selectedStand.image_url && (
              <DialogTitle sx={{ pb: 1, pt: 2.5 }}>
                <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.3rem" }}>
                  {selectedStand.name}
                </Typography>
                {selectedStand.description && (
                  <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.88rem", mt: 0.5 }}>
                    {selectedStand.description}
                  </Typography>
                )}
              </DialogTitle>
            )}

            <DialogContent sx={{ px: 2.5, py: 2, overflowY: "auto", flex: 1 }}>

              {/* Queue type info card */}
              {selectedStand && (() => {
                const queue = isQueueStand(selectedStand.name);
                return (
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      alignItems: "flex-start",
                      backgroundColor: queue ? "rgba(255,193,7,0.08)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${queue ? "rgba(255,193,7,0.25)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 2,
                      px: 2,
                      py: 1.5,
                      mb: 2.5,
                    }}
                  >
                    <Typography sx={{ fontSize: "1.2rem", lineHeight: 1, mt: "1px" }}>
                      {queue ? "🎟️" : "🚪"}
                    </Typography>
                    <Box>
                      <Typography sx={{ color: queue ? "#ffc91f" : "#fff", fontWeight: 700, fontSize: "0.82rem", mb: 0.4 }}>
                        {queue ? "Entrada por ordem de fila" : "Entrada em grupo"}
                      </Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.76rem", lineHeight: 1.5 }}>
                        {queue
                          ? "Este estande funciona com fila numerada. Cada sessão comporta até 100 pessoas e a entrada ocorre de 3 em 3, na ordem do agendamento. Ao confirmar, você recebe o número da sua posição na fila."
                          : "Este estande realiza a entrada em grupo. Esteja na porta no horário agendado — a entrada é rápida e acontece com todas as pessoas ao mesmo tempo."}
                      </Typography>
                    </Box>
                  </Box>
                );
              })()}

              {groupedSessions.length === 0 ? (
                <Typography sx={{ color: "rgba(255,255,255,0.6)", py: 2 }}>
                  Nenhuma sessao disponivel neste estande.
                </Typography>
              ) : (
                <>
                  {/* Date tabs */}
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
                    {groupedSessions.map((g) => {
                      const isActive = g.date === selectedDate;
                      return (
                        <Button
                          key={g.date}
                          onClick={() => setSelectedDate(g.date)}
                          sx={{
                            px: 2, py: 0.75, borderRadius: "999px", textTransform: "none", fontWeight: 700, minWidth: 0,
                            color: isActive ? "#000" : "#fff",
                            backgroundColor: isActive ? "#fff" : "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            fontSize: "0.85rem",
                            "&:hover": { backgroundColor: isActive ? "#fff" : "rgba(255,255,255,0.14)" },
                          }}
                        >
                          {new Date(`${g.date}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                        </Button>
                      );
                    })}
                  </Box>

                  {/* Sessions */}
                  {activeGroup && (
                    <Box>
                      <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem", mb: 1.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {new Date(`${activeGroup.date}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" })}
                      </Typography>

                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        {activeGroup.sessions.map((session, i) => (
                          <Box key={session.id}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                py: 1.75,
                                gap: 1.5,
                                flexWrap: "wrap",
                              }}
                            >
                              <Box>
                                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
                                  {session.start_time.substring(0, 5)}
                                  {session.end_time ? ` — ${session.end_time.substring(0, 5)}` : ""}
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", mt: 0.25 }}>
                                  {session.remaining_slots} vagas de {session.capacity}
                                  {session.booking_open_time ? ` • lista abre ${session.booking_open_time.substring(0, 5)}` : ""}
                                </Typography>
                              </Box>

                              <Button
                                variant={session.is_booked ? "outlined" : "contained"}
                                startIcon={<EventAvailableIcon />}
                                disabled={session.is_booked || session.remaining_slots <= 0 || bookingSessionId === session.id}
                                onClick={(e) => handleBooking(e, session.id)}
                                size="small"
                                sx={{
                                  textTransform: "none",
                                  minWidth: 148,
                                  backgroundColor: session.is_booked ? "transparent" : "#ff1f21",
                                  color: "#fff",
                                  borderColor: "rgba(255,255,255,0.3)",
                                  fontWeight: 700,
                                  "&:hover": { backgroundColor: session.is_booked ? "rgba(255,255,255,0.05)" : "#dc1416" },
                                  "&.Mui-disabled": { color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.15)", backgroundColor: session.is_booked ? "transparent" : "rgba(255,255,255,0.1)" },
                                }}
                              >
                                {session.is_booked
                                  ? "Ja agendado"
                                  : session.remaining_slots <= 0
                                    ? "Sem vagas"
                                    : bookingSessionId === session.id
                                      ? "Agendando..."
                                      : "Agendar sessao"}
                              </Button>
                            </Box>
                            {i < activeGroup.sessions.length - 1 && (
                              <Divider sx={{ borderColor: "rgba(255,255,255,0.07)" }} />
                            )}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 2.5, py: 2, borderTop: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
              <Button
                fullWidth
                onClick={() => setSelectedStand(null)}
                sx={{ color: "rgba(255,255,255,0.6)", textTransform: "none", fontWeight: 600 }}
              >
                Fechar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── QR dialog after booking ── */}
      <Dialog
        open={!!bookingToShowQr}
        onClose={() => setBookingToShowQr(null)}
        PaperProps={{
          sx: { backgroundColor: "rgba(18,18,18,0.97)", color: "#fff", borderRadius: 3, maxWidth: 420, width: "100%" },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <QrCodeIcon />
          QR do agendamento
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          {bookingToShowQr && (
            <>
              <Typography sx={{ fontWeight: 700 }}>{bookingToShowQr.stand_name}</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.72)", mt: 0.5, mb: 2 }}>
                {new Date(`${bookingToShowQr.session_date}T00:00:00`).toLocaleDateString("pt-BR")} •{" "}
                {bookingToShowQr.start_time.substring(0, 5)}
                {bookingToShowQr.end_time ? ` - ${bookingToShowQr.end_time.substring(0, 5)}` : ""}
              </Typography>

              {/* Queue position badge — only for queue-type stands */}
              {isQueueStand(bookingToShowQr.stand_name) && bookingToShowQr.queue_position != null && (
                <Box
                  sx={{
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor: "rgba(255,193,7,0.1)",
                    border: "1.5px solid rgba(255,193,7,0.5)",
                    borderRadius: 2.5,
                    px: 3,
                    py: 1.5,
                    mb: 2.5,
                    minWidth: 160,
                  }}
                >
                  <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.25 }}>
                    Sua posição na fila
                  </Typography>
                  <Typography sx={{ color: "#ffc91f", fontSize: "2.6rem", fontWeight: 900, lineHeight: 1 }}>
                    #{bookingToShowQr.queue_position}
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", mt: 0.5 }}>
                    Entrada de 3 em 3 pessoas
                  </Typography>
                </Box>
              )}

              <Typography sx={{ color: "#ffc91f", fontWeight: 700, mb: 2 }}>
                Chegue com antecedencia de 15 minutos antes do inicio da sessao.
              </Typography>
              {bookingToShowQr.qr_token && (
                <Box sx={{ backgroundColor: "#fff", p: 2, borderRadius: 2, display: "inline-flex", mb: 2 }}>
                  <QRCode value={bookingToShowQr.qr_token} size={200} />
                </Box>
              )}
              <Typography sx={{ color: "rgba(255,255,255,0.72)", maxWidth: 300, mx: "auto" }}>
                Este QR identifica seu usuario e sua sessao. Ele so pode ser validado uma unica vez no check-in.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setBookingToShowQr(null)} sx={{ color: "#fff" }}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
