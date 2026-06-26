"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import InfoIcon from "@mui/icons-material/Info";
import MapIcon from "@mui/icons-material/Map";
import NightShelterRoundedIcon from "@mui/icons-material/NightShelterRounded";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import { getEventById, deleteEvent, EventResponse } from "@/app/services/events/eventAppService";
import DeleteEventModal from "@/app/components/admin/events/DeleteEventModal";

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function EventManagePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.id);
  const { role, authReady } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canAccess = role === "admin_master" || role === "admin";

  useEffect(() => { if (authReady && !canAccess) router.replace("/pages/user/home"); }, [authReady, canAccess, router]);

  useEffect(() => {
    if (!authReady || !canAccess) return;
    getEventById(eventId)
      .then((data) => { setEvent(data); setLoading(false); })
      .catch((err: any) => {
        showToast("Erro ao carregar evento", "error");
        if (err?.response?.status === 404) router.replace("/pages/admin/home");
        setLoading(false);
      });
  }, [authReady, canAccess, eventId, showToast, router]);

  const handleDelete = async () => {
    if (!event) return;
    setDeleting(true);
    try {
      await deleteEvent(eventId);
      showToast("Evento excluído com sucesso!", "success");
      setDeleteModalOpen(false);
      router.replace("/pages/admin/home");
    } catch (err: any) {
      showToast(err.message || "Erro ao excluir evento", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (!authReady || loading) {
    return (
      <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#fff" }} />
      </Box>
    );
  }

  if (!canAccess || !event) return null;

  const FEATURE_CARDS: { label: string; description: string; icon: React.ReactNode; color: string; route?: string; soon?: boolean }[] = [
    {
      label: "Info do Evento",
      description: "Editar dados, datas e configurações",
      icon: <InfoIcon sx={{ fontSize: 26 }} />,
      color: "#4f46e5",
      route: `/pages/admin/events/${eventId}/edit`,
    },
    {
      label: "Estandes",
      description: "Gerenciar estandes e sessões",
      icon: <StorefrontIcon sx={{ fontSize: 26 }} />,
      color: "#06b6d4",
      route: `/pages/admin/live-stands?eventId=${eventId}`,
    },
    {
      label: "Camping",
      description: "Áreas e vagas de camping",
      icon: <NightShelterRoundedIcon sx={{ fontSize: 26 }} />,
      color: "#10b981",
      route: `/pages/admin/camping?eventId=${eventId}`,
    },
    {
      label: "Mapa do Evento",
      description: "Imagens do mapa",
      icon: <MapIcon sx={{ fontSize: 26 }} />,
      color: "#8b5cf6",
      route: `/pages/admin/events/${eventId}/edit`,
    },
    {
      label: "Line Up",
      description: "Artistas e atrações",
      icon: <QueueMusicIcon sx={{ fontSize: 26 }} />,
      color: "#f97316",
      route: `/pages/admin/events/${eventId}/lineup`,
    },
    {
      label: "Restaurantes",
      description: "Cardápio, fotos e preços",
      icon: <RestaurantMenuIcon sx={{ fontSize: 26 }} />,
      color: "#f97316",
      route: `/pages/admin/events/${eventId}/restaurantes`,
    },
    {
      label: "Estacionamento",
      description: "Mapa e vagas de trailers",
      icon: <LocalParkingIcon sx={{ fontSize: 26 }} />,
      color: "#6366f1",
      route: `/pages/admin/events/${eventId}/estacionamento`,
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, pb: 6 }}>
      {/* Sticky header */}
      <Box
        sx={{
          position: "sticky", top: 0, zIndex: 10,
          backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          px: { xs: 2, sm: 3 }, py: 1.5,
        }}
      >
        <Box sx={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
            <IconButton
              onClick={() => router.push(role === "admin_master" ? "/pages/admin-master/eventos" : "/pages/admin/home")}
              sx={{ color: "#fff", width: 40, height: 40, backgroundColor: "rgba(255,255,255,0.06)", flexShrink: 0, "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: "0.9rem", sm: "1rem" }, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {event.title}
              </Typography>
              <Chip
                label={event.is_active ? "Ativo" : "Inativo"}
                size="small"
                sx={{ mt: 0.2, backgroundColor: event.is_active ? "rgba(46,204,113,0.15)" : "rgba(255,255,255,0.08)", color: event.is_active ? "#2ecc71" : "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "0.6rem", height: 18 }}
              />
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
            <IconButton
              onClick={() => router.push(`/pages/admin/events/${eventId}/edit`)}
              sx={{ color: "rgba(255,255,255,0.55)", "&:hover": { color: "#fff", backgroundColor: "rgba(255,255,255,0.06)" } }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={() => setDeleteModalOpen(true)}
              disabled={deleting}
              sx={{ color: "rgba(255,100,100,0.55)", "&:hover": { color: "#ff6464", backgroundColor: "rgba(255,100,100,0.06)" } }}
            >
              {deleting ? <CircularProgress size={20} sx={{ color: "#ff6464" }} /> : <DeleteIcon />}
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ maxWidth: 900, margin: "0 auto", px: { xs: 2, sm: 3 }, pt: 3 }}>
        {/* Event banner */}
        {event.banner_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.banner_image}
            alt={event.title}
            style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 16, display: "block", marginBottom: 20 }}
          />
        )}

        {/* Event meta */}
        <Box sx={{ display: "flex", gap: 2.5, mb: 3, flexWrap: "wrap" }}>
          {event.starts_at && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
              <CalendarTodayIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }} />
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>{formatDateShort(event.starts_at)}</Typography>
            </Box>
          )}
          {event.location && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
              <LocationOnIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }} />
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>{event.location}</Typography>
            </Box>
          )}
        </Box>

        {/* Feature cards grid */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" }, gap: 1.5 }}>
          {FEATURE_CARDS.map((card) => (
            <Paper
              key={card.label}
              elevation={0}
              onClick={() => !card.soon && card.route && router.push(card.route)}
              sx={{
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 3, p: 2,
                cursor: card.soon ? "default" : "pointer",
                opacity: card.soon ? 0.45 : 1,
                transition: "all 0.2s ease",
                ...(!card.soon && {
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.08)",
                    border: `1px solid ${card.color}55`,
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                  },
                }),
                display: "flex", flexDirection: "column", gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 44, height: 44, borderRadius: 2,
                  backgroundColor: `${card.color}20`,
                  border: `1px solid ${card.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: card.color,
                }}
              >
                {card.icon}
              </Box>
              <Box>
                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem", lineHeight: 1.3 }}>
                  {card.label}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", mt: 0.3 }}>
                  {card.description}
                </Typography>
                {card.soon && (
                  <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem", mt: 0.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Em breve
                  </Typography>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Delete modal */}
      {event && (
        <DeleteEventModal
          open={deleteModalOpen}
          eventTitle={event.title}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </Box>
  );
}
