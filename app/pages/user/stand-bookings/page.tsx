"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import QrCodeIcon from "@mui/icons-material/QrCode";
import QRCode from "react-qr-code";

import BottomNav from "@/app/components/layout/BottomNav";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import { useToast } from "@/app/context/ToastContext";
import {
  cancelMyStandBooking,
  getMyStandBookings,
  UserStandBooking,
} from "@/app/services/liveStands/liveStandUserService";

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
      setBookings(data);
    } catch (error: any) {
      console.error("Erro ao carregar meus agendamentos", error);
      showToast(error?.response?.data?.detail || "Erro ao carregar seus agendamentos", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCancel = async () => {
    if (!bookingToCancel) {
      return;
    }

    try {
      setCancelling(true);
      const cancelledBookingId = bookingToCancel.id;
      await cancelMyStandBooking(cancelledBookingId);
      setBookings((currentBookings) =>
        currentBookings.filter((booking) => booking.id !== cancelledBookingId)
      );
      if (bookingToShowQr?.id === cancelledBookingId) {
        setBookingToShowQr(null);
      }
      showToast("Agendamento cancelado com sucesso", "success");
      setBookingToCancel(null);
    } catch (error: any) {
      console.error("Erro ao cancelar agendamento", error);
      showToast(error?.response?.data?.detail || "Erro ao cancelar agendamento", "error");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, pb: "88px" }}>
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/pages/user/home?tab=estandes")}
          sx={{
            color: "#ff1f21",
            textTransform: "none",
            mb: 2,
            "&:hover": { backgroundColor: "rgba(255,31,33,0.08)" },
          }}
        >
          Voltar
        </Button>

        <Typography variant="h4" sx={{ color: "#fff", fontWeight: 700, mb: 3 }}>
          Meus agendamentos
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#ffc91f" }} />
          </Box>
        ) : bookings.length === 0 ? (
          <Card sx={{ backgroundColor: "rgba(255,255,255,0.04)", color: "#fff", borderRadius: 3 }}>
            <CardContent>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>Nenhum agendamento encontrado</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.68)" }}>
                Quando voce agendar uma sessao em um estande, ela vai aparecer aqui.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {bookings.map((booking) => (
              <Card
                key={booking.id}
                sx={{
                  backgroundColor: "rgba(0,0,0,0.35)",
                  color: "#fff",
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                {booking.stand_image_url ? (
                  <CardMedia component="img" image={booking.stand_image_url} alt={booking.stand_name} sx={{ height: 180, objectFit: "cover" }} />
                ) : null}
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {booking.stand_name}
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5 }}>
                    {booking.event_title || "Evento"}
                  </Typography>
                  <Typography sx={{ color: "#fff", mt: 2 }}>
                    {new Date(`${booking.session_date}T00:00:00`).toLocaleDateString("pt-BR")} • {booking.start_time.substring(0, 5)}
                    {booking.end_time ? ` - ${booking.end_time.substring(0, 5)}` : ""}
                  </Typography>
                  {booking.booking_open_time ? (
                    <Typography sx={{ color: "rgba(255,255,255,0.65)", mt: 0.5 }}>
                      Abertura da lista: {booking.booking_open_time.substring(0, 5)}
                    </Typography>
                  ) : null}

                  <Box sx={{ mt: 2 }}>
                    {booking.qr_token ? (
                      <Button
                        variant="contained"
                        startIcon={<QrCodeIcon />}
                        onClick={() => setBookingToShowQr(booking)}
                        sx={{
                          mr: 1.5,
                          mb: { xs: 1.5, sm: 0 },
                          backgroundColor: "#ff1f21",
                          color: "#fff",
                          textTransform: "none",
                          "&:hover": {
                            backgroundColor: "#dc1416",
                          },
                        }}
                      >
                        Ver QR
                      </Button>
                    ) : null}
                    <Button
                      variant="outlined"
                      onClick={() => setBookingToCancel(booking)}
                      sx={{
                        color: "#ff1f21",
                        borderColor: "#ff1f21",
                        textTransform: "none",
                        "&:hover": {
                          borderColor: "#dc1416",
                          backgroundColor: "rgba(255,31,33,0.08)",
                        },
                      }}
                    >
                      Cancelar agendamento
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>

      <Dialog
        open={Boolean(bookingToCancel)}
        onClose={cancelling ? undefined : () => setBookingToCancel(null)}
        PaperProps={{
          sx: {
            backgroundColor: "rgba(18,18,18,0.97)",
            color: "#fff",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle>Cancelar agendamento</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.75)" }}>
            Tem certeza que deseja cancelar este agendamento?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setBookingToCancel(null)}
            disabled={cancelling}
            sx={{ color: "#ff1f21", "&:hover": { backgroundColor: "rgba(255,31,33,0.08)" } }}
          >
            Voltar
          </Button>
          <Button
            onClick={handleCancel}
            disabled={cancelling}
            variant="contained"
            sx={{ backgroundColor: "#ff1f21", "&:hover": { backgroundColor: "#dc1416" } }}
          >
            {cancelling ? "Cancelando..." : "Confirmar cancelamento"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(bookingToShowQr)}
        onClose={() => setBookingToShowQr(null)}
        PaperProps={{
          sx: {
            backgroundColor: "rgba(18,18,18,0.97)",
            color: "#fff",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle>QR do agendamento</DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          {bookingToShowQr?.qr_token ? (
            <>
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
              <Typography sx={{ color: "rgba(255,255,255,0.72)", maxWidth: 320, mx: "auto" }}>
                Apresente este QR no acesso do estande para validar sua entrada.
              </Typography>
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setBookingToShowQr(null)}
            sx={{ color: "#ff1f21", "&:hover": { backgroundColor: "rgba(255,31,33,0.08)" } }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <BottomNav />
    </Box>
  );
}
