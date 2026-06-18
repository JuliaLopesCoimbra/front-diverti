"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Skeleton,
  Typography,
} from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import QrCodeRoundedIcon from "@mui/icons-material/QrCodeRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import QRCode from "react-qr-code";

import BottomNav from "@/app/components/layout/BottomNav";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import { useToast } from "@/app/context/ToastContext";
import {
  cancelMyStandBooking,
  getMyStandBookings,
  UserStandBooking,
} from "@/app/services/liveStands/liveStandUserService";
import { BRAND_DEFAULT_PHOTO } from "@/app/services/campaigns/mockData";

const BRAND_KEYS = Object.keys(BRAND_DEFAULT_PHOTO);
function brandPhotoFromName(name: string): string | null {
  const lower = name.toLowerCase();
  const match = BRAND_KEYS.find((k) => lower.includes(k));
  return match ? BRAND_DEFAULT_PHOTO[match] : null;
}

const QUEUE_STAND_KEYS = ["tic tac", "tictac", "bauducco"];
function isQueueStand(name: string) {
  return QUEUE_STAND_KEYS.some((k) => name.toLowerCase().includes(k));
}
function getStoredQueuePos(bookingId: number): number | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(`stand_queue_pos_${bookingId}`);
  return v ? parseInt(v, 10) : null;
}

function statusLabel(status: string) {
  switch (status) {
    case "checked_in": return { label: "Check-in feito", color: "#ffc91f" };
    case "cancelled": return { label: "Cancelado", color: "rgba(255,255,255,0.35)" };
    default: return { label: "Confirmado", color: "#2ecc71" };
  }
}

function BookingSkeleton() {
  return (
    <Box sx={{ borderRadius: "20px", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <Skeleton variant="rectangular" sx={{ width: "100%", height: 140, bgcolor: "rgba(255,255,255,0.07)" }} />
      <Box sx={{ p: 2 }}>
        <Skeleton variant="text" width="55%" height={22} sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 0.5 }} />
        <Skeleton variant="text" width="35%" height={16} sx={{ bgcolor: "rgba(255,255,255,0.06)", mb: 1.5 }} />
        <Skeleton variant="text" width="60%" height={16} sx={{ bgcolor: "rgba(255,255,255,0.06)", mb: 2 }} />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Skeleton variant="rectangular" width={110} height={36} sx={{ bgcolor: "rgba(255,255,255,0.07)", borderRadius: 2 }} />
          <Skeleton variant="rectangular" width={90} height={36} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2 }} />
        </Box>
      </Box>
    </Box>
  );
}

export default function UserStandBookingsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState<UserStandBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<UserStandBooking | null>(null);
  const [bookingToShowQr, setBookingToShowQr] = useState<UserStandBooking | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyStandBookings();
      const mockStored: UserStandBooking[] = typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("mock_stand_bookings") ?? "[]")
        : [];
      // Mescla: API primeiro, mock só se não há booking real para a mesma sessão
      const apiSessionIds = new Set(data.map((b) => b.stand_session_id));
      const mockOnly = mockStored.filter((b) => !apiSessionIds.has(b.stand_session_id));
      const merged = [...data, ...mockOnly];
      const enriched = merged.map((b) => {
        if (isQueueStand(b.stand_name) && b.queue_position == null) {
          const pos = getStoredQueuePos(b.id);
          if (pos != null) return { ...b, queue_position: pos };
        }
        return b;
      });
      setBookings(enriched);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      showToast(err?.response?.data?.detail || "Erro ao carregar seus agendamentos", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCancel = async () => {
    if (!bookingToCancel) return;
    try {
      setCancelling(true);
      const id = bookingToCancel.id;
      // Booking mock (id negativo) — remove só do localStorage
      if (id < 0) {
        if (typeof window !== "undefined") {
          const stored: UserStandBooking[] = JSON.parse(localStorage.getItem("mock_stand_bookings") ?? "[]");
          localStorage.setItem("mock_stand_bookings", JSON.stringify(stored.filter((b) => b.id !== id)));
        }
        setBookings((prev) => prev.filter((b) => b.id !== id));
        showToast("Agendamento cancelado com sucesso", "success");
        setBookingToCancel(null);
        return;
      }
      await cancelMyStandBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      if (bookingToShowQr?.id === id) setBookingToShowQr(null);
      showToast("Agendamento cancelado com sucesso", "success");
      setBookingToCancel(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      showToast(err?.response?.data?.detail || "Erro ao cancelar agendamento", "error");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, pb: "calc(88px + env(safe-area-inset-bottom))" }}>

      {/* Sticky header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          px: { xs: 2, md: 3 },
          py: 1.5,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <IconButton
          onClick={() => router.push("/pages/user/home?tab=estandes")}
          sx={{
            color: "#fff",
            width: 38,
            height: 38,
            backgroundColor: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.13)" },
          }}
        >
          <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: 16, md: 18 } }}>
          Meus agendamentos
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ px: { xs: 1.5, md: 2 }, pt: 2.5, maxWidth: "600px", mx: "auto", width: "100%" }}>

        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[1, 2, 3].map((i) => <BookingSkeleton key={i} />)}
          </Box>
        ) : bookings.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              pt: 8,
              pb: 4,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <StorefrontRoundedIcon sx={{ fontSize: 32, color: "rgba(255,255,255,0.3)" }} />
            </Box>
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 16, mb: 0.5 }}>
                Nenhum agendamento
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 14, maxWidth: 260, mx: "auto" }}>
                Quando você agendar uma sessão em um estande, ela vai aparecer aqui.
              </Typography>
            </Box>
            <Button
              onClick={() => router.push("/pages/user/home?tab=estandes")}
              sx={{
                backgroundColor: "#ffffff",
                color: "#111111",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: "12px",
                px: 3,
                py: 1.2,
                mt: 1,
                "&:hover": { backgroundColor: "#e8e8e8" },
              }}
            >
              Ver estandes
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {bookings.map((booking) => {
              const { label: sLabel, color: sColor } = statusLabel(booking.status);
              const isCancelled = booking.status === "cancelled";

              const coverImg = booking.stand_image_url || brandPhotoFromName(booking.stand_name);

              return (
                <Box
                  key={booking.id}
                  sx={{
                    borderRadius: "20px",
                    overflow: "hidden",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    opacity: isCancelled ? 0.55 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {/* Stand image / brand logo */}
                  {coverImg ? (
                    <Box sx={{ position: "relative", width: "100%", height: 140, backgroundColor: "#000" }}>
                      <img
                        src={coverImg}
                        alt={booking.stand_name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                      <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: 80,
                        background: "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <StorefrontRoundedIcon sx={{ fontSize: 28, color: "rgba(255,255,255,0.2)" }} />
                    </Box>
                  )}

                  <Box sx={{ p: 2 }}>
                    {/* Stand name + status */}
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 0.4 }}>
                      <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>
                        {booking.stand_name}
                      </Typography>
                      <Box
                        sx={{
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          backgroundColor: `${sColor}18`,
                          border: `1px solid ${sColor}44`,
                          borderRadius: "999px",
                          px: 1.2,
                          py: 0.3,
                        }}
                      >
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: sColor, flexShrink: 0 }} />
                        <Typography sx={{ color: sColor, fontSize: 11, fontWeight: 700 }}>{sLabel}</Typography>
                      </Box>
                    </Box>

                    {/* Event name */}
                    {booking.event_title && (
                      <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 13, mb: 1.2 }}>
                        {booking.event_title}
                      </Typography>
                    )}

                    {/* Date + time */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                        <EventAvailableRoundedIcon sx={{ fontSize: 15, color: "rgba(255,255,255,0.45)" }} />
                        <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 600 }}>
                          {new Date(`${booking.session_date}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}
                        </Typography>
                      </Box>
                      <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>•</Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 600 }}>
                        {booking.start_time.substring(0, 5)}
                        {booking.end_time ? ` – ${booking.end_time.substring(0, 5)}` : ""}
                      </Typography>
                    </Box>

                    {/* Queue position */}
                    {isQueueStand(booking.stand_name) && booking.queue_position != null && (
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                          mb: 1.5,
                          backgroundColor: "rgba(255,201,31,0.08)",
                          border: "1px solid rgba(255,201,31,0.3)",
                          borderRadius: "12px",
                          px: 1.5,
                          py: 0.75,
                        }}
                      >
                        <Typography sx={{ fontSize: "1rem", lineHeight: 1 }}>🎟️</Typography>
                        <Box>
                          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", lineHeight: 1 }}>
                            Posição na fila
                          </Typography>
                          <Typography sx={{ color: "#ffc91f", fontWeight: 900, fontSize: "1.15rem", lineHeight: 1.2 }}>
                            #{booking.queue_position}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Actions */}
                    {!isCancelled && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
                        {booking.qr_token && (
                          <Button
                            startIcon={<QrCodeRoundedIcon />}
                            onClick={() => setBookingToShowQr(booking)}
                            sx={{
                              backgroundColor: "#ffffff",
                              color: "#111111",
                              fontWeight: 700,
                              textTransform: "none",
                              borderRadius: "12px",
                              px: 2,
                              py: 0.9,
                              fontSize: 13,
                              "&:hover": { backgroundColor: "#e8e8e8" },
                            }}
                          >
                            Ver QR Code
                          </Button>
                        )}
                        <Button
                          startIcon={<CancelRoundedIcon />}
                          onClick={() => setBookingToCancel(booking)}
                          sx={{
                            color: "rgba(255,255,255,0.45)",
                            borderColor: "rgba(255,255,255,0.15)",
                            border: "1px solid",
                            fontWeight: 600,
                            textTransform: "none",
                            borderRadius: "12px",
                            px: 2,
                            py: 0.9,
                            fontSize: 13,
                            "&:hover": { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)" },
                          }}
                        >
                          Cancelar
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Cancel confirmation dialog */}
      <Dialog
        open={Boolean(bookingToCancel)}
        onClose={cancelling ? undefined : () => setBookingToCancel(null)}
        PaperProps={{
          sx: {
            backgroundColor: "rgba(18,18,18,0.97)",
            backdropFilter: "blur(20px)",
            color: "#fff",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.1)",
            maxWidth: 380,
            width: "100%",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Cancelar agendamento</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
            Tem certeza que deseja cancelar este agendamento?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setBookingToCancel(null)}
            disabled={cancelling}
            sx={{ color: "rgba(255,255,255,0.55)", textTransform: "none", fontWeight: 600, borderRadius: "10px" }}
          >
            Voltar
          </Button>
          <Button
            onClick={handleCancel}
            disabled={cancelling}
            sx={{
              backgroundColor: "#ffffff",
              color: "#111111",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "10px",
              px: 2.5,
              "&:hover": { backgroundColor: "#e8e8e8" },
            }}
          >
            {cancelling ? "Cancelando..." : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR dialog */}
      <Dialog
        open={Boolean(bookingToShowQr)}
        onClose={() => setBookingToShowQr(null)}
        PaperProps={{
          sx: {
            backgroundColor: "rgba(18,18,18,0.97)",
            backdropFilter: "blur(20px)",
            color: "#fff",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.1)",
            maxWidth: 360,
            width: "100%",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", gap: 1 }}>
          <QrCodeRoundedIcon sx={{ fontSize: 20 }} />
          QR do agendamento
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", pb: 1 }}>
          {bookingToShowQr?.qr_token && (
            <>
              <Typography sx={{ color: "#fff", fontWeight: 700, mb: 0.25 }}>
                {bookingToShowQr.stand_name}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 13, mb: 2 }}>
                {new Date(`${bookingToShowQr.session_date}T00:00:00`).toLocaleDateString("pt-BR")} • {bookingToShowQr.start_time.substring(0, 5)}
                {bookingToShowQr.end_time ? ` – ${bookingToShowQr.end_time.substring(0, 5)}` : ""}
              </Typography>

              {isQueueStand(bookingToShowQr.stand_name) && bookingToShowQr.queue_position != null && (
                <Box
                  sx={{
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor: "rgba(255,201,31,0.08)",
                    border: "1.5px solid rgba(255,201,31,0.4)",
                    borderRadius: 2.5,
                    px: 3,
                    py: 1.5,
                    mb: 2.5,
                    minWidth: 150,
                  }}
                >
                  <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.25 }}>
                    Sua posição na fila
                  </Typography>
                  <Typography sx={{ color: "#ffc91f", fontSize: "2.5rem", fontWeight: 900, lineHeight: 1 }}>
                    #{bookingToShowQr.queue_position}
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: 11, mt: 0.4 }}>
                    Entrada de 3 em 3 pessoas
                  </Typography>
                </Box>
              )}

              <Box sx={{ backgroundColor: "#fff", p: 2, borderRadius: 2, display: "inline-flex", mb: 2 }}>
                <QRCode value={bookingToShowQr.qr_token} size={210} />
              </Box>
              <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 13, maxWidth: 280, mx: "auto" }}>
                Apresente este QR no acesso do estande para validar sua entrada.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button
            fullWidth
            onClick={() => setBookingToShowQr(null)}
            sx={{ color: "rgba(255,255,255,0.55)", textTransform: "none", fontWeight: 600, borderRadius: "10px" }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <BottomNav />
    </Box>
  );
}
