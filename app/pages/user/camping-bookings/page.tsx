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
import NightShelterRoundedIcon from "@mui/icons-material/NightShelterRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import QRCode from "react-qr-code";

import BottomNav from "@/app/components/layout/BottomNav";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import { useToast } from "@/app/context/ToastContext";
import {
  cancelMyCampingBooking,
  getMyCampingBookings,
  UserCampingBooking,
} from "@/app/services/camping/campingUserService";

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateRange(checkIn: string, checkOut: string): string {
  return `${formatDate(checkIn)} → ${formatDate(checkOut)}`;
}

function BookingSkeleton() {
  return (
    <Box sx={{ borderRadius: "20px", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <Box sx={{ p: 2 }}>
        <Skeleton variant="text" width="55%" height={22} sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 0.5 }} />
        <Skeleton variant="text" width="35%" height={16} sx={{ bgcolor: "rgba(255,255,255,0.06)", mb: 0.5 }} />
        <Skeleton variant="text" width="60%" height={16} sx={{ bgcolor: "rgba(255,255,255,0.06)", mb: 2 }} />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Skeleton variant="rectangular" width={110} height={36} sx={{ bgcolor: "rgba(255,255,255,0.07)", borderRadius: 2 }} />
          <Skeleton variant="rectangular" width={90} height={36} sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2 }} />
        </Box>
      </Box>
    </Box>
  );
}

export default function UserCampingBookingsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState<UserCampingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<UserCampingBooking | null>(null);
  const [bookingToShowQr, setBookingToShowQr] = useState<UserCampingBooking | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyCampingBookings();
      setBookings(data);
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
      await cancelMyCampingBooking(bookingToCancel.id);
      setBookings((prev) => prev.filter((b) => b.id !== bookingToCancel.id));
      if (bookingToShowQr?.id === bookingToCancel.id) setBookingToShowQr(null);
      showToast("Reserva cancelada com sucesso", "success");
      setBookingToCancel(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      showToast(err?.response?.data?.detail || "Erro ao cancelar reserva", "error");
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
          onClick={() => router.push("/pages/user/home?tab=camping")}
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
          Meus agendamentos de camping
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
              <NightShelterRoundedIcon sx={{ fontSize: 32, color: "rgba(255,255,255,0.3)" }} />
            </Box>
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 16, mb: 0.5 }}>
                Nenhuma reserva de camping
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 14, maxWidth: 260, mx: "auto" }}>
                Quando você reservar uma vaga no camping, ela vai aparecer aqui.
              </Typography>
            </Box>
            <Button
              onClick={() => router.push("/pages/user/home?tab=camping")}
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
              Ver áreas de camping
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {bookings.map((booking) => {
              const isCancelled = !!booking.cancelled_at;

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
                  {/* Area image */}
                  {booking.area_image_url ? (
                    <Box sx={{ position: "relative", width: "100%", height: 120, backgroundColor: "#000" }}>
                      <img
                        src={booking.area_image_url}
                        alt={booking.area_name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                      <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: 72,
                        background: "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <NightShelterRoundedIcon sx={{ fontSize: 28, color: "rgba(255,255,255,0.2)" }} />
                    </Box>
                  )}

                  <Box sx={{ p: 2 }}>
                    {/* Area name + status badge */}
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 0.4 }}>
                      <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>
                        {booking.area_name}
                      </Typography>
                      <Box
                        sx={{
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          backgroundColor: isCancelled ? "rgba(255,255,255,0.06)" : "rgba(46,204,113,0.12)",
                          border: `1px solid ${isCancelled ? "rgba(255,255,255,0.12)" : "rgba(46,204,113,0.35)"}`,
                          borderRadius: "999px",
                          px: 1.2,
                          py: 0.3,
                        }}
                      >
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: isCancelled ? "rgba(255,255,255,0.3)" : "#2ecc71", flexShrink: 0 }} />
                        <Typography sx={{ color: isCancelled ? "rgba(255,255,255,0.4)" : "#2ecc71", fontSize: 11, fontWeight: 700 }}>
                          {isCancelled ? "Cancelado" : "Confirmado"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Event name */}
                    {booking.event_title && (
                      <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 13, mb: 1 }}>
                        {booking.event_title}
                      </Typography>
                    )}

                    {/* Period label + dates */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                        <EventAvailableRoundedIcon sx={{ fontSize: 15, color: "rgba(255,255,255,0.45)" }} />
                        <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 600 }}>
                          {booking.label}
                        </Typography>
                      </Box>
                      <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>·</Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                        {formatDateRange(booking.check_in_date, booking.check_out_date)}
                      </Typography>
                    </Box>

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

      {/* Cancel confirmation */}
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
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Cancelar reserva</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
            Tem certeza que deseja cancelar esta reserva de camping?
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
            {cancelling ? <CircularProgress size={16} sx={{ color: "#111" }} /> : "Confirmar"}
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
          QR da reserva
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", pb: 1 }}>
          {bookingToShowQr?.qr_token && (
            <>
              <Typography sx={{ color: "#fff", fontWeight: 700, mb: 0.25 }}>
                {bookingToShowQr.area_name}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 13, mb: 0.5 }}>
                {bookingToShowQr.label}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: 12, mb: 2 }}>
                {formatDateRange(bookingToShowQr.check_in_date, bookingToShowQr.check_out_date)}
              </Typography>
              <Box sx={{ backgroundColor: "#fff", p: 2, borderRadius: 2, display: "inline-flex", mb: 2 }}>
                <QRCode value={bookingToShowQr.qr_token} size={210} />
              </Box>
              <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 13, maxWidth: 280, mx: "auto" }}>
                Apresente este QR na entrada da área de camping para validar sua reserva.
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
