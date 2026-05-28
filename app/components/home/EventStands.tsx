"use client";

import { type MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
} from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ImageIcon from "@mui/icons-material/Image";
import QrCodeIcon from "@mui/icons-material/QrCode";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";

import { useToast } from "@/app/context/ToastContext";
import {
  createUserStandBooking,
  getUserEventStands,
  UserEventStand,
  UserStandBooking,
} from "@/app/services/liveStands/liveStandUserService";

const STAND_IMAGES: { keys: string[]; image: string }[] = [
  {
    keys: ["coca"],
    image: "https://marcasmais.com.br/wp-content/uploads/2026/03/Banco-e-Samba-assinam-experiencias-da-Coca-Cola-Tic-Tac-Sprite-e-Schweppes-no-Lollapalooza-2026-3.jpg",
  },
  {
    keys: ["fiat"],
    image: "https://portalg.com.br/wp-content/uploads/2026/03/Fiat-transforma-fas-em-estrelas-com-experiencias-tecnologicas-no-Lollapalooza-2026-1068x588.webp",
  },
  {
    keys: ["sprite"],
    image: "https://gkpb.com.br/wp-content/uploads/2026/03/sprite-lollapalooza-gkpb-banner.jpg",
  },
  {
    keys: ["balatines", "ballantines"],
    image: "https://creativosbr.com.br/wp-content/uploads/2024/09/3D-do-estande-de-Johnnie-Walker-durante-o-Rock-in-Rio-Brasil-2024.png",
  },
  {
    keys: ["eisenbahn"],
    image: "https://www.meioemensagem.com.br/wp-content/uploads/2025/09/eisenbahn-thetown.jpg",
  },
  {
    keys: ["vivo"],
    image: "https://uploads.promoview.com.br/2025/09/Estande-Skyline_1.jpg",
  },
  {
    keys: ["samsung"],
    image: "https://t2.tudocdn.net/507931?w=1920",
  },
  {
    keys: ["volkswagen", "volks", "vw"],
    image: "https://marcasmais.com.br/wp-content/uploads/2025/09/Volkswagen-Tera-e-esportivos-VW-Legends-%E2%80%98dao-show-no-The-Town.jpg",
  },
  {
    keys: ["brahma"],
    image: "https://www.brahma.com.br/wp-content/uploads/2024/09/brahma-estande.jpg",
  },
];

const HIDDEN_STANDS = ["bauducco", "tic tac", "tictac", "piracanjuba", "eisenbahn"];
const STAND_RENAME: { from: string[]; to: string }[] = [];

function normalizeStand(stand: UserEventStand): UserEventStand {
  const lower = stand.name.toLowerCase();
  const rename = STAND_RENAME.find((r) => r.from.some((k) => lower.includes(k)));
  const fallbackImage = (() => {
    if (stand.image_url) return stand.image_url;
    const nameLower = rename ? rename.to.toLowerCase() : lower;
    for (const { keys, image } of STAND_IMAGES) {
      if (keys.some((k) => nameLower.includes(k) || lower.includes(k))) return image;
    }
    return null;
  })();
  return {
    ...stand,
    name: rename ? rename.to : stand.name,
    image_url: fallbackImage,
  };
}

interface Props {
  eventId: number;
}

export default function EventStands({ eventId }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [stands, setStands] = useState<UserEventStand[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingSessionId, setBookingSessionId] = useState<number | null>(null);
  const [selectedStandId, setSelectedStandId] = useState<number | null>(null);
  const [selectedSessionDate, setSelectedSessionDate] = useState("");
  const [bookingToShowQr, setBookingToShowQr] = useState<UserStandBooking | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUserEventStands(eventId);
      const filtered = data
        .filter((s) => !HIDDEN_STANDS.some((h) => s.name.toLowerCase().includes(h)))
        .map(normalizeStand);
      setStands(filtered);
    } catch (error: any) {
      console.error("Erro ao carregar estandes para o usuario", error);
      showToast(error?.response?.data?.detail || "Erro ao carregar estandes", "error");
    } finally {
      setLoading(false);
    }
  }, [eventId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!stands.length) {
      setSelectedStandId(null);
      return;
    }

    if (!selectedStandId || !stands.some((stand) => stand.id === selectedStandId)) {
      setSelectedStandId(null);
    }
  }, [selectedStandId, stands]);

  const selectedStand = useMemo(
    () => stands.find((stand) => stand.id === selectedStandId) || null,
    [selectedStandId, stands]
  );

  const groupedSessions = useMemo(() => {
    if (!selectedStand) return [];

    const groups = new Map<string, typeof selectedStand.sessions>();

    selectedStand.sessions
      .slice()
      .sort((a, b) => {
        if (a.session_date === b.session_date) {
          return a.start_time.localeCompare(b.start_time);
        }
        return a.session_date.localeCompare(b.session_date);
      })
      .forEach((session) => {
        const existing = groups.get(session.session_date) || [];
        existing.push(session);
        groups.set(session.session_date, existing);
      });

    return Array.from(groups.entries()).map(([date, sessions]) => ({ date, sessions }));
  }, [selectedStand]);

  useEffect(() => {
    if (!groupedSessions.length) {
      if (selectedSessionDate) setSelectedSessionDate("");
      return;
    }

    if (!selectedSessionDate || !groupedSessions.some((group) => group.date === selectedSessionDate)) {
      setSelectedSessionDate(groupedSessions[0].date);
    }
  }, [groupedSessions, selectedSessionDate]);

  const activeSessionGroup = useMemo(
    () => groupedSessions.find((group) => group.date === selectedSessionDate) || groupedSessions[0] || null,
    [groupedSessions, selectedSessionDate]
  );

  const applyBookedSessionToState = useCallback((booking: UserStandBooking) => {
    setStands((current) =>
      current.map((stand) => {
        if (stand.id !== booking.stand_id) {
          return stand;
        }

        return {
          ...stand,
          sessions: stand.sessions.map((session) => {
            if (session.id !== booking.stand_session_id) {
              return session;
            }

            return {
              ...session,
              is_booked: true,
              booked_slots: session.booked_slots + 1,
              remaining_slots: Math.max(session.remaining_slots - 1, 0),
            };
          }),
        };
      })
    );
  }, []);

  const handleBooking = async (event: MouseEvent<HTMLButtonElement>, sessionId: number) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      setBookingSessionId(sessionId);
      const booking = await createUserStandBooking(sessionId);
      applyBookedSessionToState(booking);
      setBookingToShowQr(booking);
    } catch (error: any) {
      console.error("Erro ao criar agendamento", error);
      showToast(error?.response?.data?.detail || "Erro ao criar agendamento", "error");
    } finally {
      setBookingSessionId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "#7c3aed" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, md: 3 }, pb: 10 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <StorefrontIcon sx={{ color: "#7c3aed" }} />
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700 }}>
            Estandes
          </Typography>
        </Box>
        <Button
          type="button"
          variant="outlined"
          onClick={() => router.push("/pages/user/stand-bookings")}
          sx={{
            color: "#fff",
            borderColor: "rgba(255,255,255,0.3)",
            textTransform: "none",
            "&:hover": {
              borderColor: "rgba(255,255,255,0.5)",
              backgroundColor: "rgba(255,255,255,0.06)",
            },
          }}
        >
          Meus agendamentos
        </Button>
      </Box>

      {stands.length === 0 ? (
        <Card sx={{ backgroundColor: "rgba(255,255,255,0.04)", color: "#fff", borderRadius: 3 }}>
          <CardContent>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>Nenhum estande disponivel</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.68)" }}>
              Os estandes deste evento ainda nao foram publicados.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
              gap: 2.5,
            }}
          >
            {stands.map((stand) => {
              const isSelected = stand.id === selectedStandId;

              return (
                <Card
                  key={stand.id}
                  onClick={() => setSelectedStandId((current) => (current === stand.id ? null : stand.id))}
                  sx={{
                    backgroundColor: isSelected ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.35)",
                    color: "#fff",
                    borderRadius: 3,
                    border: isSelected ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.08)",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      borderColor: "rgba(255,255,255,0.28)",
                    },
                  }}
                >
                  {stand.image_url ? (
                    <CardMedia
                      component="img"
                      image={stand.image_url}
                      alt={stand.name}
                      sx={{ height: { xs: 220, md: 280 }, objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: { xs: 220, md: 280 },
                        display: "grid",
                        placeItems: "center",
                        background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))",
                      }}
                    >
                      <ImageIcon sx={{ fontSize: 54, color: "rgba(255,255,255,0.5)" }} />
                    </Box>
                  )}

                  <CardContent sx={{ p: 2.5 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, textAlign: "center", minHeight: 56, display: "grid", placeItems: "center" }}
                    >
                      {stand.name}
                    </Typography>

                    <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                      <Button
                        type="button"
                        endIcon={
                          <KeyboardArrowDownIcon
                            sx={{
                              transform: isSelected ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s ease",
                            }}
                          />
                        }
                        sx={{ color: "#fff", textTransform: "none", fontWeight: 700 }}
                      >
                        {isSelected ? "Ocultar horarios" : "Ver dias e horarios"}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          {selectedStand ? (
            <Paper
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 3,
                backgroundColor: "rgba(0,0,0,0.4)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                {selectedStand.name}
              </Typography>
              {selectedStand.description ? (
                <Typography sx={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.7, mb: 3 }}>
                  {selectedStand.description}
                </Typography>
              ) : null}

              {groupedSessions.length === 0 ? (
                <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
                  Nenhuma sessao ativa disponivel neste estande.
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {groupedSessions.map((group) => {
                      const isActive = activeSessionGroup?.date === group.date;

                      return (
                        <Button
                          type="button"
                          key={group.date}
                          onClick={() => setSelectedSessionDate(group.date)}
                          sx={{
                            px: 2,
                            py: 1,
                            borderRadius: "999px",
                            textTransform: "none",
                            fontWeight: 700,
                            color: isActive ? "#000" : "#fff",
                            backgroundColor: isActive ? "#fff" : "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.14)",
                            "&:hover": {
                              backgroundColor: isActive ? "#fff" : "rgba(255,255,255,0.12)",
                            },
                          }}
                        >
                          {new Date(`${group.date}T00:00:00`).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </Button>
                      );
                    })}
                  </Box>

                  {activeSessionGroup ? (
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", mb: 1.5 }}>
                        {new Date(`${activeSessionGroup.date}T00:00:00`).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </Typography>

                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        {activeSessionGroup.sessions.map((session, index) => (
                          <Box key={session.id}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: { xs: "flex-start", md: "center" },
                                gap: 2,
                                flexDirection: { xs: "column", md: "row" },
                                py: 1.5,
                              }}
                            >
                              <Box>
                                <Typography sx={{ color: "#fff", fontWeight: 700 }}>
                                  {session.start_time.substring(0, 5)}
                                  {session.end_time ? ` - ${session.end_time.substring(0, 5)}` : ""}
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.65)", mt: 0.5 }}>
                                  {session.remaining_slots} vagas restantes de {session.capacity}
                                  {session.booking_open_time
                                    ? ` • lista abre ${session.booking_open_time.substring(0, 5)}`
                                    : ""}
                                </Typography>
                              </Box>

                              <Button
                                type="button"
                                variant={session.is_booked ? "outlined" : "contained"}
                                startIcon={<EventAvailableIcon />}
                                disabled={session.is_booked || session.remaining_slots <= 0 || bookingSessionId === session.id}
                                onClick={(event) => handleBooking(event, session.id)}
                                sx={{
                                  textTransform: "none",
                                  minWidth: 180,
                                  backgroundColor: session.is_booked ? "transparent" : "#ffffff",
                                  color: "#fff",
                                  borderColor: "rgba(255,255,255,0.3)",
                                  "&:hover": {
                                    backgroundColor: session.is_booked ? "rgba(255,255,255,0.05)" : "#e8e8e8",
                                  },
                                  "&.Mui-disabled": {
                                    color: "rgba(255,255,255,0.45)",
                                    borderColor: "rgba(255,255,255,0.15)",
                                    backgroundColor: session.is_booked ? "transparent" : "rgba(255,255,255,0.12)",
                                  },
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

                            {index < activeSessionGroup.sessions.length - 1 ? (
                              <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
                            ) : null}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  ) : null}
                </Box>
              )}
            </Paper>
          ) : null}
        </Box>
      )}

      <Dialog
        open={Boolean(bookingToShowQr)}
        onClose={() => setBookingToShowQr(null)}
        PaperProps={{
          sx: {
            backgroundColor: "rgba(18,18,18,0.97)",
            color: "#fff",
            borderRadius: 3,
            width: "100%",
            maxWidth: 420,
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <QrCodeIcon />
          QR do agendamento
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          {bookingToShowQr ? (
            <>
              <Typography sx={{ fontWeight: 700 }}>{bookingToShowQr.stand_name}</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.72)", mt: 0.5, mb: 2 }}>
                {new Date(`${bookingToShowQr.session_date}T00:00:00`).toLocaleDateString("pt-BR")} •{" "}
                {bookingToShowQr.start_time.substring(0, 5)}
                {bookingToShowQr.end_time ? ` - ${bookingToShowQr.end_time.substring(0, 5)}` : ""}
              </Typography>

              <Typography sx={{ color: "#7c3aed", fontWeight: 700, mb: 2 }}>
                Chegue com antecedência de 15 minutos antes do horário de inicio da sessão.
              </Typography>

              {bookingToShowQr.qr_token ? (
                <Box
                  sx={{
                    backgroundColor: "#fff",
                    p: 2,
                    borderRadius: 2,
                    display: "inline-flex",
                    mb: 2,
                  }}
                >
                  <QRCode value={bookingToShowQr.qr_token} size={220} />
                </Box>
              ) : null}

              <Typography sx={{ color: "rgba(255,255,255,0.72)", maxWidth: 320, mx: "auto" }}>
                Este QR identifica seu usuario e sua sessão. Ele só pode ser validado uma única vez no check-in.
              </Typography>

              {bookingToShowQr.checked_in_at ? (
                <Typography sx={{ color: "rgba(255,255,255,0.58)", mt: 1.5 }}>
                  Entrada registrada em {new Date(bookingToShowQr.checked_in_at).toLocaleString("pt-BR")}.
                </Typography>
              ) : null}
            </>
          ) : null}
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
