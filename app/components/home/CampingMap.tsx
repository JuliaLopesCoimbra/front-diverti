"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import NightShelterRoundedIcon from "@mui/icons-material/NightShelterRounded";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LockIcon from "@mui/icons-material/Lock";
import {
  getUserCampingAreas,
  getMyCampingBookings,
  bookCampingAreaDay,
  UserCampingArea,
  UserCampingBooking,
} from "@/app/services/camping/campingUserService";

type Stage = "pricing" | "calendar" | "map" | "review" | "payment" | "success" | "mypassports";

interface Package {
  id: string;
  label: string;
  badge: string;
  badgeColor: string;
  priceStr: string;
  priceLabel: string;
  period: string;
  days: string[]; // vazio para "diaria" — preenchido pelo calendário
}

const DAY_LABELS: Record<number, string> = {
  20: "Qui 20/08", 21: "Sex 21/08", 22: "Sáb 22/08", 23: "Dom 23/08",
  24: "Seg 24/08", 25: "Ter 25/08", 26: "Qua 26/08", 27: "Qui 27/08",
  28: "Sex 28/08", 29: "Sáb 29/08", 30: "Dom 30/08",
};

const PACKAGES: Package[] = [
  {
    id: "diaria",
    label: "Passaporte Camping Individual + Tag acesso Veículo",
    badge: "1° Lote",
    badgeColor: "rgba(255,255,255,0.12)",
    priceStr: "R$ 754,60",
    priceLabel: "por vaga",
    period: "1 dia",
    days: [],
  },
  {
    id: "pacote4",
    label: "Passaporte Camping Individual + Tag acesso Veículo",
    badge: "1° Lote",
    badgeColor: "rgba(255,204,1,0.18)",
    priceStr: "R$ 2.264,00",
    priceLabel: "total",
    period: "Qui 20/08 a Dom 23/08",
    days: ["Qui 20/08", "Sex 21/08", "Sáb 22/08", "Dom 23/08"],
  },
  {
    id: "pacote10",
    label: "Passaporte Camping Individual + Tag acesso Veículo",
    badge: "1° Lote",
    badgeColor: "rgba(255,204,1,0.18)",
    priceStr: "R$ 3.751,00",
    priceLabel: "total",
    period: "Qui 21/08 a Dom 30/08",
    days: [
      "Qui 21/08", "Sex 22/08", "Sáb 23/08", "Dom 24/08", "Seg 25/08",
      "Ter 26/08", "Qua 27/08", "Qui 28/08", "Sex 29/08", "Dom 30/08",
    ],
  },
];

function CampingQRCode({ value, size = 140 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SIZE = 21;
    const CELL = 9;
    canvas.width = SIZE * CELL;
    canvas.height = SIZE * CELL;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const fill = (r: number, c: number, dark = true) => {
      ctx.fillStyle = dark ? "#111111" : "#ffffff";
      ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 1, CELL - 1);
    };

    const drawFinder = (sr: number, sc: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const outer = r === 0 || r === 6 || c === 0 || c === 6;
          const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          fill(sr + r, sc + c, outer || inner);
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, 14);
    drawFinder(14, 0);

    for (let i = 8; i <= 12; i++) {
      fill(6, i, i % 2 === 0);
      fill(i, 6, i % 2 === 0);
    }

    let h = 5381;
    for (let i = 0; i < value.length; i++) h = ((h << 5) + h) ^ value.charCodeAt(i);
    h = Math.abs(h);

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if ((r < 9 && (c < 9 || c >= 12)) || (r >= 12 && c < 9)) continue;
        if (r === 6 || c === 6) continue;
        const idx = r * SIZE + c;
        const bit = ((h ^ (idx * 0x9e3779b9)) >>> 0) & 1;
        fill(r, c, bit === 1);
      }
    }
  }, [value]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: size, height: size, imageRendering: "pixelated" }}
    />
  );
}

interface Props {
  eventId: number;
  mapImageUrl?: string;
  initialStage?: Stage;
}

export default function CampingMap({ eventId, mapImageUrl, initialStage }: Props) {
  const [stage, setStage] = useState<Stage>(initialStage ?? "pricing");
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);

  // calendário (só para diária) — multi-seleção
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [calendarTargetCount, setCalendarTargetCount] = useState(1);

  // stepper de dias extras (pricing + mapa)
  const [extraDays, setExtraDays] = useState(1);

  // vagas por dia: índice = índice do dia no activeDays
  const [selectedAreasByDay, setSelectedAreasByDay] = useState<(number | null)[]>([]);
  const [mapDayIndex, setMapDayIndex] = useState(0);

  const [areas, setAreas] = useState<UserCampingArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [campingMapUrl, setCampingMapUrl] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [reservationCode, setReservationCode] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [myBookings, setMyBookings] = useState<UserCampingBooking[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`camping_map_${eventId}`);
    if (saved) setCampingMapUrl(saved);
  }, [eventId]);

  async function handlePayment() {
    setBookingLoading(true);
    setBookingError(null);
    try {
      const bookings: UserCampingBooking[] = [];

      for (let i = 0; i < activeDays.length; i++) {
        const areaId = selectedAreasByDay[i];
        if (areaId == null) continue;

        const dayLabel = activeDays[i];
        const dayMatch = dayLabel.match(/(\d+)\/08/);
        const dayNum = dayMatch ? parseInt(dayMatch[1]) : -1;
        const dateIso = `2026-08-${String(dayNum).padStart(2, "0")}`;

        const booking = await bookCampingAreaDay(areaId, dateIso);
        bookings.push(booking);
      }

      if (bookings.length === 0) {
        throw new Error("Nenhuma reserva foi criada. Selecione ao menos uma vaga.");
      }

      const firstToken = bookings[0]?.qr_token;
      setReservationCode(
        firstToken
          ? `CAMP-${firstToken.slice(0, 8).toUpperCase()}`
          : `CAMP-${Date.now().toString(36).toUpperCase()}`
      );

      getUserCampingAreas(eventId).then(setAreas).catch(() => {});
      setStage("success");
    } catch (err: unknown) {
      const apiMsg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setBookingError(apiMsg ?? (err instanceof Error ? err.message : "Erro ao concluir pagamento."));
    } finally {
      setBookingLoading(false);
    }
  }

  useEffect(() => {
    getUserCampingAreas(eventId)
      .then(setAreas)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (stage === "mypassports") {
      setBookingLoading(true);
      getMyCampingBookings()
        .then((data) => setMyBookings([...data].sort((a, b) => a.check_in_date.localeCompare(b.check_in_date))))
        .catch(() => {})
        .finally(() => setBookingLoading(false));
    }
  }, [stage]);

  // dias ativos para o pacote selecionado
  const activeDays: string[] =
    selectedPkg?.id === "diaria"
      ? selectedDates.map((d) => DAY_LABELS[d] ?? `${d}/08`)
      : selectedPkg?.days ?? [];

  const totalDays = activeDays.length;
  const currentDayLabel = activeDays[mapDayIndex] ?? "";
  const currentAreaId = selectedAreasByDay[mapDayIndex] ?? null;

  const displayPrice: string =
    selectedPkg?.id === "diaria" && totalDays > 0
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalDays * 754.60)
      : selectedPkg?.priceStr ?? "";

  function setAreaForDay(dayIdx: number, areaId: number | null) {
    setSelectedAreasByDay((prev) => {
      const next = [...prev];
      next[dayIdx] = areaId;
      return next;
    });
  }

  function startMapFlow() {
    setMapDayIndex(0);
    setSelectedAreasByDay(Array(totalDays).fill(null));
    setStage("map");
  }

  const currentDayMatch = currentDayLabel.match(/(\d+)\/08/);
  const currentDayIso = currentDayMatch ? `2026-08-${currentDayMatch[1].padStart(2, "0")}` : null;

  const sessionForDay = (area: UserCampingArea) =>
    currentDayIso
      ? area.sessions.find((s) => s.check_in_date.slice(0, 10) === currentDayIso)
      : undefined;

  const isReserved = (area: UserCampingArea) => {
    const s = sessionForDay(area);
    return s ? s.remaining_slots <= 0 && !s.is_booked : false;
  };

  const isBooked = (area: UserCampingArea) => {
    const s = sessionForDay(area);
    return s ? s.is_booked : false;
  };

  // ─── Meus Passaportes ────────────────────────────────────────────────────────

  if (stage === "mypassports") {

    return (
      <Box sx={{ px: 2, pb: 12, pt: 2.5, maxWidth: 560, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Box onClick={() => setStage("pricing")} sx={{ cursor: "pointer", color: "rgba(255,255,255,0.55)", display: "flex" }}>
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>Meus passaportes</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>Suas reservas de camping</Typography>
          </Box>
        </Box>

        {bookingLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#fff" }} />
          </Box>
        ) : myBookings.length === 0 ? (
          <Box sx={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px", p: 4, textAlign: "center",
          }}>
            <Typography sx={{ fontSize: "2.5rem", mb: 1.5 }}>🏕️</Typography>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem", mb: 0.5 }}>
              Nenhuma reserva ainda
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.82rem" }}>
              Escolha um passaporte e garanta sua vaga
            </Typography>
            <Box onClick={() => setStage("pricing")} sx={{
              display: "inline-block", mt: 2.5,
              backgroundColor: "#fff", borderRadius: "12px",
              px: 2.5, py: 1, cursor: "pointer",
            }}>
              <Typography sx={{ color: "#111", fontWeight: 700, fontSize: "0.88rem" }}>
                Ver passaportes →
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            {/* Carrossel */}
            <Box
              ref={carouselRef}
              onScroll={(e) => {
                const el = e.currentTarget;
                const idx = Math.round(el.scrollLeft / el.offsetWidth);
                setCarouselIdx(idx);
              }}
              sx={{
                display: "flex",
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
                WebkitOverflowScrolling: "touch",
                mx: -2,
                px: 2,
                gap: 2,
              }}
            >
              {myBookings.map((booking) => {
                const qrValue = booking.qr_token ?? `camping-${booking.id}`;
                const checkIn = booking.check_in_date
                  ? new Date(booking.check_in_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                  : null;
                const checkOut = booking.check_out_date
                  ? new Date(booking.check_out_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                  : null;
                const isActive = !booking.cancelled_at;
                const code = booking.qr_token
                  ? `CAMP-${booking.qr_token.slice(0, 8).toUpperCase()}`
                  : `CAMP-${String(booking.id).padStart(6, "0")}`;

                return (
                  <Box key={booking.id} sx={{
                    minWidth: "100%",
                    scrollSnapAlign: "start",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: `1px solid ${isActive ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: "20px",
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    opacity: isActive ? 1 : 0.55,
                    boxSizing: "border-box",
                  }}>
                    {/* QR Code */}
                    <Box sx={{ backgroundColor: "#fff", borderRadius: "16px", p: 2 }}>
                      <CampingQRCode value={qrValue} size={180} />
                    </Box>

                    {/* Código */}
                    <Typography sx={{
                      color: "rgba(255,255,255,0.35)", fontSize: "0.78rem",
                      letterSpacing: "0.12em", fontWeight: 700, fontFamily: "monospace",
                    }}>
                      {code}
                    </Typography>

                    <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", width: "100%" }} />

                    {/* Info */}
                    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>Vaga</Typography>
                        <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.9rem" }}>
                          {booking.area_name}
                        </Typography>
                      </Box>
                      {checkIn && (
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>Válido</Typography>
                          <Typography sx={{ color: "#fff", fontSize: "0.82rem", fontWeight: 600 }}>
                            {checkIn}{checkOut && checkOut !== checkIn ? ` – ${checkOut}` : ""} · 00:00 às 23:59
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>Status</Typography>
                        <Chip
                          label={isActive ? "Confirmado" : "Cancelado"}
                          size="small"
                          sx={{
                            backgroundColor: isActive ? "rgba(34,197,94,0.15)" : "rgba(248,113,113,0.15)",
                            color: isActive ? "#22c55e" : "#f87171",
                            fontWeight: 700, fontSize: "0.68rem", height: 20,
                            border: `1px solid ${isActive ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)"}`,
                          }}
                        />
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>Passaporte</Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.72rem", maxWidth: "60%", textAlign: "right", lineHeight: 1.4 }}>
                          Camping Individual + Tag acesso Veículo
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Dots */}
            {myBookings.length > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", gap: 0.8, mt: 2 }}>
                {myBookings.map((_, i) => (
                  <Box
                    key={i}
                    onClick={() => {
                      carouselRef.current?.scrollTo({ left: i * (carouselRef.current.offsetWidth + 16), behavior: "smooth" });
                      setCarouselIdx(i);
                    }}
                    sx={{
                      width: i === carouselIdx ? 20 : 8, height: 8, borderRadius: "999px",
                      backgroundColor: i === carouselIdx ? "#fff" : "rgba(255,255,255,0.2)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Contador */}
            {myBookings.length > 1 && (
              <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", textAlign: "center", mt: 1 }}>
                {carouselIdx + 1} de {myBookings.length} passaportes
              </Typography>
            )}
          </>
        )}
      </Box>
    );
  }

  // ─── Pricing ────────────────────────────────────────────────────────────────

  if (stage === "pricing") {
    return (
      <Box sx={{ px: 2, pb: 12, pt: 2.5, maxWidth: 560, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: "12px",
            backgroundColor: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <NightShelterRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.15rem", lineHeight: 1.2 }}>
              Área Camping
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.73rem" }}>
              Escolha seu passaporte
            </Typography>
          </Box>
          <Box onClick={() => setStage("mypassports")} sx={{
            backgroundColor: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "20px",
            px: 1.5, py: 0.7,
            cursor: "pointer",
            flexShrink: 0,
            "&:active": { transform: "scale(0.96)" },
            transition: "transform 0.15s ease",
          }}>
            <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap" }}>
              Meus passaportes
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {PACKAGES.map((pkg) => (
            <Box key={pkg.id} sx={{
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px",
              p: 2.5,
              display: "flex", flexDirection: "column", gap: 2,
            }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                <Box>
                  <Chip label={pkg.badge} size="small" sx={{
                    backgroundColor: pkg.badgeColor,
                    color: pkg.id !== "diaria" ? "#ffcc01" : "rgba(255,255,255,0.65)",
                    fontWeight: 700, fontSize: "0.62rem", height: 20, mb: 0.8,
                    border: pkg.id !== "diaria" ? "1px solid rgba(255,204,1,0.3)" : "none",
                  }} />
                  <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.3 }}>
                    {pkg.label}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                    <CalendarMonthIcon sx={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }} />
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.73rem" }}>
                      {pkg.period}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                  <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.55rem", lineHeight: 1 }}>
                    {pkg.priceStr}
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.63rem", mt: 0.3 }}>
                    {pkg.priceLabel}
                  </Typography>
                </Box>
              </Box>
              {pkg.id === "diaria" ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box onClick={() => setExtraDays((n) => Math.max(1, n - 1))} sx={{
                    width: 38, height: 38, borderRadius: "10px", flexShrink: 0,
                    backgroundColor: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", userSelect: "none", fontSize: "1.4rem", color: "#fff",
                    "&:active": { transform: "scale(0.9)" },
                  }}>−</Box>
                  <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.2rem", minWidth: 28, textAlign: "center", flexShrink: 0 }}>
                    {extraDays}
                  </Typography>
                  <Box onClick={() => setExtraDays((n) => Math.min(10, n + 1))} sx={{
                    width: 38, height: 38, borderRadius: "10px", flexShrink: 0,
                    backgroundColor: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", userSelect: "none", fontSize: "1.4rem", color: "#fff",
                    "&:active": { transform: "scale(0.9)" },
                  }}>+</Box>
                  <Button fullWidth onClick={() => {
                    setSelectedPkg(pkg);
                    setSelectedDates([]);
                    setCalendarTargetCount(extraDays);
                    setSelectedAreasByDay([]);
                    setMapDayIndex(0);
                    setStage("calendar");
                  }} sx={{
                    backgroundColor: "#fff", color: "#111",
                    borderRadius: "12px", textTransform: "none",
                    fontWeight: 700, fontSize: "0.9rem", py: 1.2,
                    "&:hover": { backgroundColor: "#efefef" },
                  }}>
                    Adicionar {extraDays > 1 ? `${extraDays} diárias` : "diária"} →
                  </Button>
                </Box>
              ) : (
                <Button fullWidth onClick={() => {
                  setSelectedPkg(pkg);
                  setSelectedDates([]); setCalendarTargetCount(1);
                  setSelectedAreasByDay([]);
                  setMapDayIndex(0);
                  setSelectedAreasByDay(Array(pkg.days.length).fill(null));
                  setStage("map");
                }} sx={{
                  backgroundColor: "#fff", color: "#111",
                  borderRadius: "12px", textTransform: "none",
                  fontWeight: 700, fontSize: "0.92rem", py: 1.3,
                  "&:hover": { backgroundColor: "#efefef" },
                }}>
                  Adicionar
                </Button>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  // ─── Calendar (só para diária) ───────────────────────────────────────────────

  if (stage === "calendar") {
    const AVAILABLE_START = 20;
    const AVAILABLE_END = 30;

    // Agosto 2026: Aug 1 = Saturday → getDay() = 6
    const firstDow = new Date(2026, 7, 1).getDay(); // 6 = Saturday
    const daysInMonth = 31;

    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d);
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    const isMulti = calendarTargetCount > 1;

    function toggleDate(day: number) {
      setSelectedDates((prev) => {
        if (prev.includes(day)) return prev.filter((d) => d !== day);
        if (prev.length >= calendarTargetCount) return prev;
        return [...prev, day].sort((a, b) => a - b);
      });
    }

    return (
      <Box sx={{ px: 2, pb: 12, pt: 2.5, maxWidth: 560, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box onClick={() => setStage("pricing")} sx={{ cursor: "pointer", color: "rgba(255,255,255,0.55)", display: "flex" }}>
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>
              {isMulti ? `Escolha ${calendarTargetCount} dias` : "Escolha o dia"}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>
              Disponível de 20 a 30 de agosto
            </Typography>
          </Box>
          {isMulti && (
            <Box sx={{
              backgroundColor: selectedDates.length === calendarTargetCount ? "rgba(255,204,1,0.2)" : "rgba(255,255,255,0.08)",
              border: `1px solid ${selectedDates.length === calendarTargetCount ? "rgba(255,204,1,0.5)" : "rgba(255,255,255,0.12)"}`,
              borderRadius: "20px", px: 1.5, py: 0.5,
            }}>
              <Typography sx={{ color: selectedDates.length === calendarTargetCount ? "#ffcc01" : "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 700 }}>
                {selectedDates.length}/{calendarTargetCount}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{
          backgroundColor: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px", p: 2.5,
        }}>
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem", textAlign: "center", mb: 2 }}>
            Agosto 2026
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", mb: 1 }}>
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <Typography key={d} sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", fontWeight: 700, textAlign: "center" }}>
                {d}
              </Typography>
            ))}
          </Box>

          {weeks.map((wk, wi) => (
            <Box key={wi} sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, mb: 0.5 }}>
              {wk.map((day, di) => {
                const available = day !== null && day >= AVAILABLE_START && day <= AVAILABLE_END;
                const isSelected = day !== null && selectedDates.includes(day);
                const atMax = selectedDates.length >= calendarTargetCount && !isSelected;
                return (
                  <Box key={di} onClick={() => available && !atMax && toggleDate(day!)} sx={{
                    height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "8px",
                    cursor: available && !atMax ? "pointer" : "default",
                    backgroundColor: isSelected ? "#ffcc01" : available && !atMax ? "rgba(255,255,255,0.08)" : "transparent",
                    color: isSelected ? "#111" : available && !atMax ? "#fff" : "rgba(255,255,255,0.18)",
                    fontWeight: isSelected ? 800 : available ? 600 : 400,
                    fontSize: "0.85rem",
                    transition: "background-color 0.15s ease",
                    "&:hover": available && !atMax ? { backgroundColor: isSelected ? "#ffcc01" : "rgba(255,255,255,0.14)" } : {},
                  }}>
                    {day ?? ""}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>

        {selectedDates.length === calendarTargetCount && (
          <Box sx={{ mt: 2 }}>
            <Button fullWidth onClick={() => startMapFlow()} sx={{
              backgroundColor: "#fff", color: "#111",
              borderRadius: "14px", textTransform: "none",
              fontWeight: 700, fontSize: "0.95rem", py: 1.4,
              "&:hover": { backgroundColor: "#efefef" },
            }}>
              {calendarTargetCount === 1
                ? `Escolher vaga para ${DAY_LABELS[selectedDates[0]] ?? `${selectedDates[0]}/08`} →`
                : `Escolher vagas para ${calendarTargetCount} dias →`}
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  // ─── Map (repete para cada dia) ──────────────────────────────────────────────

  if (stage === "map") {
    const isLastDay = mapDayIndex === totalDays - 1;
    const allDaysSelected = selectedAreasByDay.slice(0, totalDays).every((id) => id != null);

    return (
      <Box sx={{ pb: 12 }}>
        {/* Header */}
        <Box sx={{
          display: "flex", alignItems: "center", gap: 1.5,
          px: 2, py: 1.5,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <Box onClick={() => {
            if (mapDayIndex > 0) setMapDayIndex((i) => i - 1);
            else setStage(selectedPkg?.id === "diaria" ? "calendar" : "pricing");
          }} sx={{ cursor: "pointer", color: "rgba(255,255,255,0.55)", display: "flex" }}>
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2 }}>
              {totalDays > 1 ? `Dia ${mapDayIndex + 1} de ${totalDays} — ${currentDayLabel}` : currentDayLabel}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>
              {selectedPkg?.priceStr} · Toque em uma vaga para selecionar
            </Typography>
          </Box>
          {currentAreaId && (
            <Chip label={areas.find((a) => a.id === currentAreaId)?.name ?? ""}
              size="small" sx={{ backgroundColor: "#ffcc01", color: "#111", fontWeight: 800, fontSize: "0.72rem", flexShrink: 0 }} />
          )}
        </Box>


        {/* Progress dots para multi-dia */}
        {totalDays > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", gap: 0.8, py: 1.2 }}>
            {activeDays.map((_, i) => (
              <Box key={i} sx={{
                width: i === mapDayIndex ? 20 : 8, height: 8, borderRadius: "999px",
                backgroundColor: selectedAreasByDay[i] != null
                  ? "#ffcc01"
                  : i === mapDayIndex
                  ? "rgba(255,255,255,0.7)"
                  : "rgba(255,255,255,0.2)",
                transition: "all 0.2s ease",
              }} />
            ))}
          </Box>
        )}

        {/* Map */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#fff" }} />
          </Box>
        ) : (
          <Box sx={{ px: 2 }}>
          <Box sx={{ position: "relative", width: "100%", lineHeight: 0, overflow: "hidden", borderRadius: "12px" }}>
            <Box component="img"
              src={campingMapUrl || mapImageUrl || "/mapa/Mapa-do-Rock-In-Rio-2024.png"}
              alt="Mapa de Camping"
              sx={{ width: "100%", display: "block" }}
            />
            {areas.map((area) => {
              const x = area.x_position ?? 0.08;
              const y = area.y_position ?? 0.1;
              const reserved = isReserved(area);
              const booked = isBooked(area);
              const isSelected = currentAreaId === area.id;
              const isHovered = hoveredId === area.id;
              const unavailable = reserved || booked;

              return (
                <Box key={area.id}
                  onClick={() => !unavailable && setAreaForDay(mapDayIndex, isSelected ? null : area.id)}
                  onMouseEnter={() => setHoveredId(area.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  sx={{
                    position: "absolute",
                    left: `${x * 100}%`, top: `${y * 100}%`,
                    transform: isHovered && !unavailable
                      ? "translate(-50%, -50%) scale(1.25)"
                      : "translate(-50%, -50%) scale(1)",
                    transition: "transform 0.15s ease",
                    cursor: unavailable ? "not-allowed" : "pointer",
                    zIndex: isSelected ? 10 : 2,
                  }}
                >
                  <Box sx={{
                    width: 28, height: 22, borderRadius: "4px",
                    backgroundColor: isSelected ? "#ffcc01" : booked || reserved ? "#f97316" : "rgba(255,255,255,0.93)",
                    color: isSelected ? "#111" : booked || reserved ? "#fff" : "#111",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    border: isSelected ? "2px solid #e6b800" : "1.5px solid rgba(0,0,0,0.2)",
                    boxShadow: isSelected
                      ? "0 0 0 3px rgba(255,204,1,0.35), 0 3px 12px rgba(0,0,0,0.6)"
                      : "0 1px 6px rgba(0,0,0,0.5)",
                    opacity: reserved ? 0.75 : 1,
                  }}>
                    {reserved ? <LockIcon sx={{ fontSize: 9 }} /> : <DirectionsCarIcon sx={{ fontSize: 10 }} />}
                    <Typography sx={{ fontSize: "0.38rem", fontWeight: 800, lineHeight: 1.1 }}>
                      {area.name}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
          </Box>
        )}

        {/* Legend */}
        <Box sx={{ px: 2, pt: 1.5, display: "flex", gap: 2.5, flexWrap: "wrap" }}>
          {[
            { color: "rgba(255,255,255,0.93)", border: "rgba(0,0,0,0.2)", label: "Disponível" },
            { color: "#f97316", border: "#f97316", label: "Reservada" },
            { color: "#ffcc01", border: "#e6b800", label: "Selecionada" },
          ].map(({ color, border, label }) => (
            <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
              <Box sx={{ width: 12, height: 10, borderRadius: "2px", backgroundColor: color, border: `1px solid ${border}`, flexShrink: 0 }} />
              <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.68rem" }}>{label}</Typography>
            </Box>
          ))}
        </Box>

        {/* 24h notice */}
        <Box sx={{
          mx: 2, mt: 1.5,
          backgroundColor: "rgba(255,204,1,0.07)",
          border: "1px solid rgba(255,204,1,0.18)",
          borderRadius: "12px",
          px: 2, py: 1.2,
        }}>
          <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.75rem", lineHeight: 1.55 }}>
            {totalDays === 1 ? (
              <>Você tem <Box component="span" sx={{ color: "#ffcc01", fontWeight: 700 }}>24h</Box> do dia comprado para permanecer na vaga. Se precisar passar a noite, considere 2 diárias.</>
            ) : (
              <>Sua vaga é válida das <Box component="span" sx={{ color: "#ffcc01", fontWeight: 700 }}>00:00 às 23:59</Box> do dia reservado.</>
            )}
          </Typography>
        </Box>

        {/* Comprar mais dias (só para diária) */}
        {totalDays === 1 && (
          <Box sx={{
            mx: 2, mt: 1,
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            px: 2, py: 1.2,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5,
          }}>
            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", fontWeight: 600 }}>
              Comprar mais dias
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Box onClick={() => setExtraDays((n) => Math.max(1, n - 1))} sx={{
                width: 28, height: 28, borderRadius: "8px",
                backgroundColor: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", userSelect: "none", color: "#fff", fontSize: "1.1rem",
                "&:active": { transform: "scale(0.9)" },
              }}>−</Box>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1rem", minWidth: 20, textAlign: "center" }}>
                {extraDays}
              </Typography>
              <Box onClick={() => setExtraDays((n) => Math.min(10, n + 1))} sx={{
                width: 28, height: 28, borderRadius: "8px",
                backgroundColor: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", userSelect: "none", color: "#fff", fontSize: "1.1rem",
                "&:active": { transform: "scale(0.9)" },
              }}>+</Box>
              <Button onClick={() => {
                setCalendarTargetCount(totalDays + extraDays);
                setSelectedDates([]);
                setStage("calendar");
              }} sx={{
                backgroundColor: "#ffcc01", color: "#111",
                borderRadius: "8px", textTransform: "none",
                fontWeight: 700, fontSize: "0.78rem", py: 0.7, px: 1.5,
                whiteSpace: "nowrap",
                "&:hover": { backgroundColor: "#e6b800" },
              }}>
                Selecionar dias
              </Button>
            </Box>
          </Box>
        )}

        {/* CTA */}
        {currentAreaId && (
          <Box sx={{ px: 2, pt: 2 }}>
            {isLastDay ? (
              <Button fullWidth onClick={() => setStage("review")} sx={{
                backgroundColor: "#fff", color: "#111", borderRadius: "14px",
                textTransform: "none", fontWeight: 700, fontSize: "0.95rem", py: 1.4,
                "&:hover": { backgroundColor: "#efefef" },
              }}>
                Revisar pedido →
              </Button>
            ) : (
              <Button fullWidth onClick={() => setMapDayIndex((i) => i + 1)} sx={{
                backgroundColor: "#fff", color: "#111", borderRadius: "14px",
                textTransform: "none", fontWeight: 700, fontSize: "0.95rem", py: 1.4,
                "&:hover": { backgroundColor: "#efefef" },
              }}>
                Próximo dia →
              </Button>
            )}
          </Box>
        )}
      </Box>
    );
  }

  // ─── Review ──────────────────────────────────────────────────────────────────

  if (stage === "review") {
    return (
      <Box sx={{ px: 2, pb: 12, pt: 2.5, maxWidth: 560, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Box onClick={() => { setMapDayIndex(totalDays - 1); setStage("map"); }}
            sx={{ cursor: "pointer", color: "rgba(255,255,255,0.55)", display: "flex" }}>
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>
            Revisão do pedido
          </Typography>
        </Box>

        <Box sx={{
          backgroundColor: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px", p: 2.5, mb: 2.5,
        }}>
          <Typography sx={{
            color: "rgba(255,255,255,0.4)", fontSize: "0.68rem", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.08em", mb: 2,
          }}>
            Resumo do pedido
          </Typography>

          {/* Cabeçalho de colunas */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 1, mb: 1 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" }}>Dia</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" }}>Vaga</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", textAlign: "right" }}>Valor</Typography>
          </Box>

          {activeDays.map((dayLabel, i) => {
            const area = areas.find((a) => a.id === selectedAreasByDay[i]);
            const unitPrice = selectedPkg?.id === "diaria"
              ? "R$ 754,60"
              : i === 0 ? selectedPkg?.priceStr ?? "—" : "—";
            const isPackageRow = selectedPkg?.id !== "diaria";
            return (
              <Box key={i} sx={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 1, alignItems: "center", mb: 1 }}>
                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem" }}>
                  {dayLabel}
                  {isPackageRow && i === 0 && (
                    <Box component="span" sx={{ display: "block", color: "rgba(255,255,255,0.3)", fontSize: "0.68rem" }}>
                      {selectedPkg?.period}
                    </Box>
                  )}
                </Typography>
                <Chip label={area?.name ?? "—"} size="small" sx={{
                  backgroundColor: "rgba(255,204,1,0.15)", color: "#ffcc01",
                  fontWeight: 700, fontSize: "0.68rem", height: 20,
                  border: "1px solid rgba(255,204,1,0.3)",
                }} />
                <Typography sx={{
                  color: unitPrice === "—" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.75)",
                  fontSize: "0.8rem", fontWeight: 600, textAlign: "right", whiteSpace: "nowrap",
                }}>
                  {unitPrice}
                </Typography>
              </Box>
            );
          })}

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 1.5 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Total</Typography>
            <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.3rem" }}>{displayPrice}</Typography>
          </Box>
        </Box>

        <Button fullWidth onClick={() => setStage("payment")} sx={{
          backgroundColor: "#fff", color: "#111", borderRadius: "14px",
          textTransform: "none", fontWeight: 700, fontSize: "0.95rem", py: 1.4,
          "&:hover": { backgroundColor: "#efefef" },
        }}>
          Confirmar e Pagar →
        </Button>
      </Box>
    );
  }

  // ─── Success ─────────────────────────────────────────────────────────────────

  if (stage === "success") {
    return (
      <Box sx={{ px: 2, pb: 12, pt: 4, maxWidth: 560, mx: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <Box sx={{
          width: 88, height: 88, borderRadius: "50%",
          backgroundColor: "#22c55e",
          display: "flex", alignItems: "center", justifyContent: "center",
          "@keyframes popIn": {
            "0%": { transform: "scale(0)", opacity: 0 },
            "70%": { transform: "scale(1.18)" },
            "100%": { transform: "scale(1)", opacity: 1 },
          },
          animation: "popIn 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
          boxShadow: "0 0 0 18px rgba(34,197,94,0.14), 0 0 0 36px rgba(34,197,94,0.06)",
        }}>
          <Typography sx={{ color: "#fff", fontSize: "2.8rem", lineHeight: 1, fontWeight: 700 }}>✓</Typography>
        </Box>

        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.5rem", mb: 0.5 }}>
            Pagamento confirmado!
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
            Sua reserva de camping foi efetuada com sucesso
          </Typography>
        </Box>

        <Box sx={{
          width: "100%",
          backgroundColor: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "20px",
          p: 2.5,
          "@keyframes slideUp": {
            "0%": { transform: "translateY(24px)", opacity: 0 },
            "100%": { transform: "translateY(0)", opacity: 1 },
          },
          animation: "slideUp 0.5s 0.2s ease forwards",
          opacity: 0,
        }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2.5 }}>
            <Box sx={{ backgroundColor: "#fff", borderRadius: "12px", p: 1.5, display: "inline-block" }}>
              <CampingQRCode value={reservationCode} />
            </Box>
            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", mt: 1.2, letterSpacing: "0.12em", fontWeight: 700 }}>
              {reservationCode}
            </Typography>
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.2 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem" }}>Pacote</Typography>
            <Typography sx={{ color: "#fff", fontSize: "0.78rem", fontWeight: 600, maxWidth: "58%", textAlign: "right", lineHeight: 1.4 }}>
              {selectedPkg?.label}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.8 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem" }}>Período</Typography>
            <Typography sx={{ color: "#fff", fontSize: "0.82rem", fontWeight: 600 }}>{selectedPkg?.period}</Typography>
          </Box>

          {activeDays.map((dayLabel, i) => {
            const area = areas.find((a) => a.id === selectedAreasByDay[i]);
            return (
              <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem" }}>{dayLabel}</Typography>
                <Chip label={area?.name ?? "—"} size="small" sx={{
                  backgroundColor: "rgba(255,204,1,0.15)", color: "#ffcc01",
                  fontWeight: 700, fontSize: "0.7rem", height: 22,
                  border: "1px solid rgba(255,204,1,0.3)",
                }} />
              </Box>
            );
          })}

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mt: 1.5, mb: 1.5 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ color: "#fff", fontWeight: 700 }}>Total pago</Typography>
            <Typography sx={{ color: "#22c55e", fontWeight: 900, fontSize: "1.3rem" }}>{displayPrice}</Typography>
          </Box>
        </Box>

        <Button fullWidth onClick={() => {
          setStage("pricing");
          setSelectedPkg(null);
          setSelectedDates([]); setCalendarTargetCount(1);
          setSelectedAreasByDay([]);
          setMapDayIndex(0);
          setReservationCode("");
        }} sx={{
          backgroundColor: "rgba(255,255,255,0.08)",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "14px",
          textTransform: "none",
          fontWeight: 700,
          fontSize: "0.95rem",
          py: 1.4,
          "&:hover": { backgroundColor: "rgba(255,255,255,0.14)" },
        }}>
          Voltar ao início
        </Button>
      </Box>
    );
  }

  // ─── Payment ──────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ px: 2, pb: 12, pt: 2.5, maxWidth: 560, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <Box onClick={() => setStage("review")} sx={{ cursor: "pointer", color: "rgba(255,255,255,0.55)", display: "flex" }}>
          <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>Pagamento</Typography>
      </Box>

      <Box sx={{
        backgroundColor: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "20px", p: 2.5, mb: 2.5,
      }}>
        {activeDays.map((dayLabel, i) => {
          const area = areas.find((a) => a.id === selectedAreasByDay[i]);
          return (
            <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem" }}>{dayLabel}</Typography>
              <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.82rem" }}>{area?.name ?? "—"}</Typography>
            </Box>
          );
        })}
        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 1.5 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ color: "#fff", fontWeight: 700 }}>Total</Typography>
          <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.2rem" }}>{displayPrice}</Typography>
        </Box>
      </Box>

      {bookingError && (
        <Typography sx={{ color: "#f87171", fontSize: "0.8rem", textAlign: "center", mb: 1.5 }}>
          {bookingError}
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 1.5, opacity: bookingLoading ? 0.6 : 1, pointerEvents: bookingLoading ? "none" : "auto" }}>
        <Box onClick={handlePayment} sx={{
          flex: 1, backgroundColor: "#fff", borderRadius: "16px",
          p: 2, cursor: "pointer", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 0.8,
          "&:active": { transform: "scale(0.97)" },
          transition: "transform 0.15s ease",
        }}>
          {bookingLoading
            ? <CircularProgress size={24} sx={{ color: "#111" }} />
            : <Typography sx={{ fontSize: "1.6rem", lineHeight: 1 }}>💳</Typography>
          }
          <Typography sx={{ color: "#111", fontWeight: 700, fontSize: "0.82rem", lineHeight: 1.3 }}>
            Cartão de Crédito
          </Typography>
        </Box>
        <Box onClick={handlePayment} sx={{
          flex: 1,
          backgroundColor: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "16px",
          p: 2, cursor: "pointer", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 0.8,
          "&:active": { transform: "scale(0.97)" },
          transition: "transform 0.15s ease",
        }}>
          {bookingLoading
            ? <CircularProgress size={24} sx={{ color: "#32BCAD" }} />
            : <Box component="svg" viewBox="0 0 512 512" sx={{ width: 32, height: 32 }}>
                <path d="M112.57 391.19a73 73 0 0 0 51.82 21.46h.14a73 73 0 0 0 51.75-21.46l84.91-84.92a11.08 11.08 0 0 1 15.63 0l85.25 85.25a73 73 0 0 0 51.82 21.46h.14A73 73 0 0 0 505 391.52l-119.74-120a11.08 11.08 0 0 1 0-15.63L505 135.86a73.27 73.27 0 0 0-51.82-21.47h-.14a73.27 73.27 0 0 0-51.75 21.47L316 221.14a11.08 11.08 0 0 1-15.63 0l-84.91-84.92a73.27 73.27 0 0 0-51.82-21.47h-.14a73.27 73.27 0 0 0-51.82 21.47L7 255.88l-.15.15 105.72 135.16z" fill="#32BCAD"/>
                <path d="M112.43 135.86a73.27 73.27 0 0 1 51.82-21.47h.14a73.27 73.27 0 0 1 51.82 21.47l84.91 84.92a11.08 11.08 0 0 0 15.63 0l85.11-85.25a73.27 73.27 0 0 1 51.75-21.47h.14a73.27 73.27 0 0 1 51.82 21.47L391 255.88l-.15.15L505 391.52a73 73 0 0 1-51.82 21.46h-.14a73 73 0 0 1-51.82-21.46l-85.11-85.25a11.08 11.08 0 0 0-15.63 0l-84.91 84.92a73 73 0 0 1-51.75 21.46h-.14a73 73 0 0 1-51.82-21.46L7 255.88z" fill="#32BCAD" opacity=".5"/>
              </Box>
          }
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.82rem", lineHeight: 1.3 }}>
            Pix
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
