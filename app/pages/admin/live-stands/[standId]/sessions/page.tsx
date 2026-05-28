"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";

import CheckInScanner from "@/app/components/admin/live-stands/CheckInScanner";
import QueueDisplay from "@/app/components/admin/live-stands/QueueDisplay";
import LiveStandSessionFormDialog, {
  LiveStandSessionFormValues,
} from "@/app/components/admin/live-stands/LiveStandSessionFormDialog";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { EventResponse, getEventById } from "@/app/services/events/eventAppService";
import {
  AdminStandSessionBooking,
  checkInAdminStandBooking,
  getAdminStandSessionBookings,
} from "@/app/services/liveStands/liveStandAdminBookingService";
import { getLiveStandById, LiveStandResponse } from "@/app/services/liveStands/liveStandService";
import {
  createLiveStandSession,
  deleteLiveStandSession,
  getLiveStandSessions,
  LiveStandSessionResponse,
  updateLiveStandSession,
} from "@/app/services/liveStands/liveStandSessionService";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

const getTodayIso = () => new Date().toISOString().split("T")[0];

const formatDay = (date: string, todayIso: string) =>
  date === todayIso
    ? "Hoje"
    : new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

const filterFieldSx = {
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.72)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#fff",
  },
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.24)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.4)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#fff",
    },
  },
  "& .MuiSelect-icon": {
    color: "#fff",
  },
  "& .MuiInputBase-input::placeholder": {
    color: "rgba(255,255,255,0.6)",
    opacity: 1,
  },
};

export default function LiveStandSessionsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const standId = Number(params.standId);
  const eventId = Number(searchParams.get("eventId"));
  const { role, authReady } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState<EventResponse | null>(null);
  const [stand, setStand] = useState<LiveStandResponse | null>(null);
  const [sessions, setSessions] = useState<LiveStandSessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<LiveStandSessionResponse | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<LiveStandSessionResponse | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [queueSession, setQueueSession] = useState<LiveStandSessionResponse | null>(null);
  const [sessionBookings, setSessionBookings] = useState<AdminStandSessionBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [checkingInBookingId, setCheckingInBookingId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayIso);
  const [showPreviousDates, setShowPreviousDates] = useState(false);
  const [participantDate, setParticipantDate] = useState("");
  const [participantSessionId, setParticipantSessionId] = useState("");
  const [participantSearch, setParticipantSearch] = useState("");

  const canAccess = role === "admin_master" || role === "admin";

  const isQueueStand = (name: string) => {
    const lower = name.toLowerCase();
    return ["tic tac", "tictac", "bauducco"].some((k) => lower.includes(k));
  };
  const showQueue = !!stand && isQueueStand(stand.name);
  const todayIso = useMemo(() => getTodayIso(), []);

  const loadData = useCallback(async () => {
    if (!standId || !canAccess) return;
    setLoading(true);
    try {
      const [standData, sessionsData] = await Promise.all([
        getLiveStandById(standId),
        getLiveStandSessions(standId),
      ]);
      setStand(standData);
      setSessions(sessionsData);
      if (eventId) {
        setEvent(await getEventById(eventId));
      }
    } catch (error: unknown) {
      const detail =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      showToast(detail || "Erro ao carregar sessoes", "error");
    } finally {
      setLoading(false);
    }
  }, [canAccess, eventId, showToast, standId]);

  useEffect(() => {
    if (authReady && !canAccess) router.push("/pages/user/home");
  }, [authReady, canAccess, router]);

  useEffect(() => {
    if (authReady && canAccess) loadData();
  }, [authReady, canAccess, loadData]);

  const dateTabs = useMemo(() => {
    const dates = [...new Set(sessions.map((session) => session.session_date))].sort();
    return dates.map((date) => ({ date, label: formatDay(date, todayIso) }));
  }, [sessions, todayIso]);

  const futureDates = useMemo(() => dateTabs.filter((tab) => tab.date >= todayIso), [dateTabs, todayIso]);
  const previousDates = useMemo(() => dateTabs.filter((tab) => tab.date < todayIso), [dateTabs, todayIso]);

  useEffect(() => {
    const visible = [...futureDates, ...(showPreviousDates ? previousDates : [])];
    if (!visible.length) return;
    if (!visible.some((tab) => tab.date === selectedDate)) {
      setSelectedDate(visible.find((tab) => tab.date === todayIso)?.date || visible[0].date);
    }
  }, [futureDates, previousDates, selectedDate, showPreviousDates, todayIso]);

  const sessionsOfDay = useMemo(
    () =>
      [...sessions]
        .filter((session) => session.session_date === selectedDate)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [selectedDate, sessions]
  );

  const participantDates = useMemo(
    () => [...new Set(sessions.map((session) => session.session_date))].sort(),
    [sessions]
  );

  const sessionsOfParticipantDate = useMemo(
    () =>
      [...sessions]
        .filter((session) => session.session_date === participantDate)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [participantDate, sessions]
  );

  const selectedParticipantSession = useMemo(
    () => sessions.find((session) => String(session.id) === participantSessionId) || null,
    [participantSessionId, sessions]
  );

  const filteredBookings = useMemo(() => {
    const search = participantSearch.trim().toLocaleLowerCase("pt-BR");
    return [...sessionBookings]
      .sort((a, b) =>
        (a.user_name || "Usuario").localeCompare(b.user_name || "Usuario", "pt-BR", {
          sensitivity: "base",
        })
      )
      .filter((booking) => {
        if (!search) return true;
        return (booking.user_name || "Usuario").toLocaleLowerCase("pt-BR").includes(search);
      });
  }, [participantSearch, sessionBookings]);

  useEffect(() => {
    if (!participantDates.length) {
      if (participantDate) setParticipantDate("");
      return;
    }

    if (!participantDate || !participantDates.includes(participantDate)) {
      setParticipantDate(
        participantDates.includes(selectedDate)
          ? selectedDate
          : participantDates.find((date) => date >= todayIso) || participantDates[0]
      );
    }
  }, [participantDate, participantDates, selectedDate, todayIso]);

  useEffect(() => {
    if (!sessionsOfParticipantDate.length) {
      if (participantSessionId) setParticipantSessionId("");
      return;
    }

    if (!sessionsOfParticipantDate.some((session) => String(session.id) === participantSessionId)) {
      setParticipantSessionId(String(sessionsOfParticipantDate[0].id));
    }
  }, [participantSessionId, sessionsOfParticipantDate]);

  useEffect(() => {
    if (!participantSessionId) {
      setSessionBookings([]);
      return;
    }

    let active = true;

    const loadBookings = async () => {
      setLoadingBookings(true);
      try {
        const bookings = await getAdminStandSessionBookings(Number(participantSessionId));
        if (active) setSessionBookings(bookings);
      } catch (error: unknown) {
        const detail =
          error && typeof error === "object" && "response" in error
            ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : undefined;
        if (active) {
          setSessionBookings([]);
          showToast(detail || "Erro ao carregar participantes", "error");
        }
      } finally {
        if (active) setLoadingBookings(false);
      }
    };

    loadBookings();

    return () => {
      active = false;
    };
  }, [participantSessionId, showToast]);

  const totals = useMemo(() => {
    return sessionsOfDay.reduce(
      (acc, session) => ({
        bookings: acc.bookings + session.quantity_bookings,
        capacity: acc.capacity + session.capacity,
        remaining: acc.remaining + session.quantity_remaining_slots,
        entries: acc.entries + session.quantity_entries,
        missing: acc.missing + session.quantity_missing_checkins,
        liveRemaining:
          acc.liveRemaining + session.quantity_remaining_slots + session.quantity_missing_checkins,
      }),
      { bookings: 0, capacity: 0, remaining: 0, entries: 0, missing: 0, liveRemaining: 0 }
    );
  }, [sessionsOfDay]);

  const handleSubmit = async (values: LiveStandSessionFormValues) => {
    setSaving(true);
    try {
      if (editingSession) {
        await updateLiveStandSession(editingSession.id, values);
        showToast("sessão atualizada com sucesso", "success");
      } else {
        await createLiveStandSession(standId, values);
        showToast("sessão criada com sucesso", "success");
      }
      setFormOpen(false);
      setEditingSession(null);
      await loadData();
    } catch (error: unknown) {
      const detail =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      showToast(detail || "Erro ao salvar sessão", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!sessionToDelete) return;
    setSaving(true);
    try {
      await deleteLiveStandSession(sessionToDelete.id);
      setSessionToDelete(null);
      showToast("sessão excluida com sucesso", "success");
      await loadData();
    } catch (error: unknown) {
      const detail =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      showToast(detail || "Erro ao excluir sessão", "error");
    } finally {
      setSaving(false);
    }
  };

  const reloadBookings = async () => {
    if (!participantSessionId) return;
    try {
      setSessionBookings(await getAdminStandSessionBookings(Number(participantSessionId)));
    } catch (error: unknown) {
      const detail =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      showToast(detail || "Erro ao atualizar participantes", "error");
    }
  };

  const handleCheckInBooking = async (bookingId: number) => {
    try {
      setCheckingInBookingId(bookingId);
      await checkInAdminStandBooking(bookingId);
      await reloadBookings();
      await loadData();
      showToast("Entrada registrada com sucesso", "success");
    } catch (error: unknown) {
      const detail =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      showToast(detail || "Erro ao registrar entrada", "error");
    } finally {
      setCheckingInBookingId(null);
    }
  };

  const closeFormDialog = () => {
    if (!saving) {
      setFormOpen(false);
      setEditingSession(null);
    }
  };

  if (!authReady || loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          ...dashboardBackgroundSx,
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress sx={{ color: "#ffcc01" }} />
      </Box>
    );
  }

  if (!canAccess) return null;

  return (
    <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, py: { xs: 2, md: 5 }, px: { xs: 1.5, md: 2 } }}>
      <Container maxWidth="lg" disableGutters>
        <Paper
          sx={{
            p: { xs: 2, md: 4 },
            backgroundColor: "rgba(26,26,26,0.95)",
            borderRadius: { xs: 3, md: 4 },
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() =>
              router.push(
                eventId ? `/pages/admin/live-stands?eventId=${eventId}` : "/pages/admin/live-stands"
              )
            }
            sx={{ color: "#fff", mb: 2.5, textTransform: "none" }}
          >
            Voltar para estandes
          </Button>

          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5, flexWrap: "wrap", mb: { xs: 2, md: 0 } }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="h4"
                  sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: "1.25rem", md: "2rem" } }}
                >
                  Sessões do estande
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.65)", mt: 0.5, fontSize: { xs: "0.85rem", md: "1rem" } }}>
                  {stand
                    ? `${stand.name}${event ? ` • ${event.title}` : ""}`
                    : "Gerencie os horarios deste estande"}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexDirection: { xs: "column", sm: "row" }, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                startIcon={<QrCodeScannerIcon />}
                onClick={() => setScannerOpen(true)}
                fullWidth={false}
                sx={{
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.35)",
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  flex: { xs: 1, sm: "none" },
                  "&:hover": { borderColor: "#fff", backgroundColor: "rgba(255,255,255,0.06)" },
                }}
              >
                Validar entrada
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingSession(null);
                  setFormOpen(true);
                }}
                sx={{
                  backgroundColor: "#ffffff",
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  flex: { xs: 1, sm: "none" },
                }}
              >
                Nova sessão
              </Button>
            </Box>
          </Box>

          {!!dateTabs.length && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                {[...futureDates, ...(showPreviousDates ? previousDates : [])].map((tab) => (
                  <Button
                    key={tab.date}
                    onClick={() => setSelectedDate(tab.date)}
                    sx={{
                      minWidth: 0,
                      px: 2,
                      py: 1,
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 700,
                      color: selectedDate === tab.date ? "#000" : "#fff",
                      backgroundColor:
                        selectedDate === tab.date ? "#fff" : "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.16)",
                    }}
                  >
                    {tab.label}
                  </Button>
                ))}
              </Box>
              {!!previousDates.length && (
                <Button
                  onClick={() => setShowPreviousDates((value) => !value)}
                  sx={{
                    px: 0,
                    minWidth: 0,
                    textTransform: "none",
                    color: "#fff",
                    textDecoration: "underline",
                  }}
                >
                  {showPreviousDates ? "Ocultar datas anteriores" : "Mostrar anteriores"}
                </Button>
              )}
            </Box>
          )}

          {!sessions.length ? (
            <Paper
              sx={{
                p: 4,
                borderRadius: 3,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Typography sx={{ color: "#fff", fontWeight: 600, mb: 1 }}>
                Nenhuma sessão cadastrada
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.68)" }}>
                Crie os horarios que serao usados depois no sistema de agendamento deste estande.
              </Typography>
            </Paper>
          ) : !sessionsOfDay.length ? (
            <Paper
              sx={{
                p: 4,
                borderRadius: 3,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Typography sx={{ color: "#fff", fontWeight: 600, mb: 1 }}>
                Nenhuma sessão neste dia
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.68)" }}>
                Escolha outra data ou crie uma nova sessão.
              </Typography>
            </Paper>
          ) : (
            <>
              {/* ── Mobile session cards ─────────────────────── */}
              <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 1.5 }}>
                {sessionsOfDay.map((session) => (
                  <Box
                    key={session.id}
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 2.5,
                      p: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                      <Box>
                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem" }}>
                          {session.start_time.substring(0, 5)}
                          {session.end_time ? ` – ${session.end_time.substring(0, 5)}` : ""}
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", mt: 0.25 }}>
                          {session.booking_open_time
                            ? `lista abre ${session.booking_open_time.substring(0, 5)}`
                            : "sem abertura definida"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => { setEditingSession(session); setFormOpen(true); }}
                          sx={{ color: "#ffc91f" }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setSessionToDelete(session)} sx={{ color: "#ff6b6b" }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, mb: 1.5 }}>
                      {[
                        { label: "Reservas", value: `${session.quantity_bookings}/${session.capacity}`, color: "#fff" },
                        { label: "Entradas", value: session.quantity_entries, color: "#4caf50" },
                        { label: "Faltantes", value: session.quantity_missing_checkins, color: session.quantity_missing_checkins > 0 ? "#ff6b6b" : "#fff" },
                      ].map(({ label, value, color }) => (
                        <Box key={label} sx={{ textAlign: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 1.5, py: 0.75, px: 0.5 }}>
                          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {label}
                          </Typography>
                          <Typography sx={{ color, fontWeight: 700, fontSize: "1rem" }}>{value}</Typography>
                        </Box>
                      ))}
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>
                        {session.quantity_remaining_slots + session.quantity_missing_checkins} vagas rem.
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          px: 1, py: 0.25,
                          borderRadius: 1,
                          backgroundColor: session.status === "active" ? "rgba(76,175,80,0.15)" : "rgba(255,255,255,0.06)",
                          color: session.status === "active" ? "#4caf50" : "rgba(255,255,255,0.45)",
                        }}
                      >
                        {session.status === "active" ? "Disponivel" : "Inativo"}
                      </Typography>
                    </Box>

                    {showQueue && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FormatListNumberedIcon fontSize="small" />}
                        onClick={() => setQueueSession(session)}
                        fullWidth
                        sx={{
                          mt: 0.5,
                          color: "#ffc91f",
                          borderColor: "rgba(255,193,7,0.35)",
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          borderRadius: 1.5,
                          "&:hover": { borderColor: "#ffc91f", backgroundColor: "rgba(255,193,7,0.06)" },
                        }}
                      >
                        Visualizar fila
                      </Button>
                    )}
                  </Box>
                ))}

                {/* Totals summary card */}
                <Box
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 2.5,
                    p: 2,
                  }}
                >
                  <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.82rem", mb: 1.25, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Totais do dia
                  </Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
                    {[
                      { label: "Reservas", value: `${totals.bookings}/${totals.capacity}`, color: "#fff" },
                      { label: "Entradas", value: totals.entries, color: "#4caf50" },
                      { label: "Faltantes", value: totals.missing, color: totals.missing > 0 ? "#ff6b6b" : "#fff" },
                    ].map(({ label, value, color }) => (
                      <Box key={label} sx={{ textAlign: "center" }}>
                        <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.62rem", textTransform: "uppercase" }}>{label}</Typography>
                        <Typography sx={{ color, fontWeight: 700, fontSize: "1rem" }}>{value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>

              {/* ── Desktop table ────────────────────────────── */}
              <TableContainer
                component={Paper}
                sx={{
                  display: { xs: "none", md: "block" },
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 3,
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Horario</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Reservas</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Sobra</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Entradas</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Faltantes</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Vagas rem.</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessionsOfDay.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.08)" }}>
                          <Typography sx={{ fontWeight: 700 }}>
                            {session.start_time.substring(0, 5)}
                            {session.end_time ? ` - ${session.end_time.substring(0, 5)}` : ""}
                          </Typography>
                          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                            {session.booking_open_time
                              ? `lista abre ${session.booking_open_time.substring(0, 5)}`
                              : "sem abertura definida"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.08)" }}>
                          {session.quantity_bookings}/{session.capacity}
                        </TableCell>
                        <TableCell sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.08)" }}>
                          {session.quantity_remaining_slots}
                        </TableCell>
                        <TableCell sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.08)" }}>
                          {session.quantity_entries}
                        </TableCell>
                        <TableCell sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.08)" }}>
                          {session.quantity_missing_checkins}
                        </TableCell>
                        <TableCell sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.08)" }}>
                          {session.quantity_remaining_slots + session.quantity_missing_checkins}
                        </TableCell>
                        <TableCell sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.08)" }}>
                          {session.status === "active" ? "Disponivel" : "Nao disponivel"}
                        </TableCell>
                        <TableCell sx={{ borderColor: "rgba(255,255,255,0.08)" }}>
                          {showQueue && (
                            <IconButton
                              onClick={() => setQueueSession(session)}
                              title="Visualizar fila"
                              sx={{ color: "#ffc91f" }}
                            >
                              <FormatListNumberedIcon />
                            </IconButton>
                          )}
                          <IconButton
                            onClick={() => { setEditingSession(session); setFormOpen(true); }}
                            sx={{ color: "#ffc91f" }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => setSessionToDelete(session)} sx={{ color: "#ff6b6b" }}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                      <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Totais do dia</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 700 }}>{totals.bookings}/{totals.capacity}</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 700 }}>{totals.remaining}</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 700 }}>{totals.entries}</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 700 }}>{totals.missing}</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 700 }}>{totals.liveRemaining}</TableCell>
                      <TableCell /><TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {!!sessions.length && (
            <Paper
              sx={{
                mt: 3,
                p: { xs: 2, md: 3 },
                borderRadius: 3,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
                    Participantes por sessão
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.65)", mt: 0.5 }}>
                    Filtre por data e horario para listar os nomes em ordem alfabetica.
                  </Typography>
                </Box>
                {selectedParticipantSession && (
                  <Typography sx={{ color: "rgba(255,255,255,0.75)" }}>
                    {new Date(`${selectedParticipantSession.session_date}T00:00:00`).toLocaleDateString("pt-BR")}{" "}
                    • {selectedParticipantSession.start_time.substring(0, 5)}
                    {selectedParticipantSession.end_time
                      ? ` - ${selectedParticipantSession.end_time.substring(0, 5)}`
                      : ""}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "220px 220px minmax(260px, 1fr)" },
                  gap: 2,
                  mb: 2,
                }}
              >
                <TextField
                  select
                  label="Data"
                  value={participantDate}
                  onChange={(e) => setParticipantDate(e.target.value)}
                  fullWidth
                  sx={filterFieldSx}
                >
                  {participantDates.map((date) => (
                    <MenuItem key={date} value={date}>
                      {new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR")}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Horario"
                  value={participantSessionId}
                  onChange={(e) => setParticipantSessionId(e.target.value)}
                  fullWidth
                  disabled={!sessionsOfParticipantDate.length}
                  sx={filterFieldSx}
                >
                  {sessionsOfParticipantDate.map((session) => (
                    <MenuItem key={session.id} value={String(session.id)}>
                      {session.start_time.substring(0, 5)}
                      {session.end_time ? ` - ${session.end_time.substring(0, 5)}` : ""}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Buscar por nome"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  placeholder="Digite o nome do participante"
                  fullWidth
                  disabled={!participantSessionId}
                  sx={filterFieldSx}
                />
              </Box>

              {!participantDate || !participantSessionId ? (
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Typography sx={{ color: "rgba(255,255,255,0.68)" }}>
                    Selecione uma data e um horario para visualizar os participantes.
                  </Typography>
                </Paper>
              ) : loadingBookings ? (
                <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
                  <CircularProgress sx={{ color: "#ffcc01" }} />
                </Box>
              ) : !filteredBookings.length ? (
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Typography sx={{ color: "#fff", fontWeight: 600, mb: 1 }}>
                    Nenhum participante encontrado
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.68)" }}>
                    {sessionBookings.length
                      ? "Ajuste a busca para localizar outro nome."
                      : "Ainda nao ha agendamentos para esta sessão."}
                  </Typography>
                </Paper>
              ) : (
                <>
                  {/* ── Mobile participant cards ─────────────── */}
                  <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 1 }}>
                    {filteredBookings.map((booking) => (
                      <Box
                        key={booking.id}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 1.5,
                          backgroundColor: booking.checked_in_at
                            ? "rgba(76,175,80,0.07)"
                            : "rgba(255,255,255,0.03)",
                          border: `1px solid ${booking.checked_in_at ? "rgba(76,175,80,0.2)" : "rgba(255,255,255,0.07)"}`,
                          borderRadius: 2,
                          p: 1.75,
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: "0.9rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {booking.user_name || "Usuario"}
                          </Typography>
                          <Typography
                            sx={{
                              color: "rgba(255,255,255,0.5)",
                              fontSize: "0.75rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {booking.user_email || "-"}
                          </Typography>
                          {booking.checked_in_at && (
                            <Typography sx={{ color: "#4caf50", fontSize: "0.7rem", mt: 0.25 }}>
                              ✓ {new Date(booking.checked_in_at).toLocaleString("pt-BR")}
                            </Typography>
                          )}
                        </Box>
                        <Button
                          size="small"
                          variant={booking.checked_in_at ? "outlined" : "contained"}
                          disabled={Boolean(booking.checked_in_at) || checkingInBookingId === booking.id}
                          onClick={() => handleCheckInBooking(booking.id)}
                          sx={{
                            flexShrink: 0,
                            minWidth: 80,
                            fontSize: "0.75rem",
                            textTransform: "none",
                            fontWeight: 700,
                            backgroundColor: booking.checked_in_at ? "transparent" : "#4caf50",
                            borderColor: booking.checked_in_at ? "#4caf50" : undefined,
                            color: "#fff",
                            "&:hover": {
                              backgroundColor: booking.checked_in_at ? "rgba(76,175,80,0.1)" : "#388e3c",
                            },
                            "&.Mui-disabled": {
                              color: "rgba(255,255,255,0.4)",
                              borderColor: "rgba(255,255,255,0.15)",
                              backgroundColor: booking.checked_in_at ? "transparent" : undefined,
                            },
                          }}
                        >
                          {booking.checked_in_at
                            ? "Confirmado"
                            : checkingInBookingId === booking.id
                              ? "..."
                              : "Dar entrada"}
                        </Button>
                      </Box>
                    ))}
                  </Box>

                  {/* ── Desktop participant table ─────────────── */}
                  <TableContainer
                    component={Paper}
                    sx={{
                      display: { xs: "none", md: "block" },
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 2,
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Nome</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Email</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Situacao</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Entrada</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Acao</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredBookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.08)" }}>
                              {booking.user_name || "Usuario"}
                            </TableCell>
                            <TableCell sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.08)" }}>
                              {booking.user_email || "-"}
                            </TableCell>
                            <TableCell sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.08)" }}>
                              {booking.checked_in_at ? "Entrada realizada" : "Aguardando entrada"}
                            </TableCell>
                            <TableCell sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.08)" }}>
                              {booking.checked_in_at
                                ? new Date(booking.checked_in_at).toLocaleString("pt-BR")
                                : "Pendente"}
                            </TableCell>
                            <TableCell sx={{ borderColor: "rgba(255,255,255,0.08)" }}>
                              <Button
                                size="small"
                                variant={booking.checked_in_at ? "outlined" : "contained"}
                                disabled={Boolean(booking.checked_in_at) || checkingInBookingId === booking.id}
                                onClick={() => handleCheckInBooking(booking.id)}
                              >
                                {booking.checked_in_at
                                  ? "Confirmado"
                                  : checkingInBookingId === booking.id
                                    ? "Validando..."
                                    : "Dar entrada"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Paper>
          )}
        </Paper>
      </Container>

      <CheckInScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        sessions={sessions}
        onCheckedIn={loadData}
      />

      <QueueDisplay
        open={!!queueSession}
        onClose={() => setQueueSession(null)}
        session={queueSession}
      />

      <LiveStandSessionFormDialog
        open={formOpen}
        mode={editingSession ? "edit" : "create"}
        session={editingSession}
        saving={saving}
        onClose={closeFormDialog}
        onSubmit={handleSubmit}
      />

      <Dialog
        open={Boolean(sessionToDelete)}
        onClose={saving ? undefined : () => setSessionToDelete(null)}
      >
        <DialogTitle>Excluir sessão</DialogTitle>
        <DialogContent>
          <DialogContentText>Tem certeza que deseja excluir esta sessão?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionToDelete(null)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} disabled={saving} variant="contained">
            {saving ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
