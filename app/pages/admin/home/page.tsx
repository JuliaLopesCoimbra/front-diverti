"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CampaignIcon from "@mui/icons-material/Campaign";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PendingIcon from "@mui/icons-material/Pending";
import PeopleIcon from "@mui/icons-material/People";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import { getEvents, EventResponse } from "@/app/services/events/eventAppService";

const GENERAL_ACTIONS = [
  { label: "Posts Pendentes", icon: <PendingIcon sx={{ fontSize: 20 }} />,              route: "/pages/admin/pending-posts",           color: "#f59e0b" },
  { label: "Patrocinadores",  icon: <PeopleIcon sx={{ fontSize: 20 }} />,               route: "/pages/admin/permissions",             color: "#10b981" },
  { label: "Anúncios",        icon: <CampaignIcon sx={{ fontSize: 20 }} />,             route: "/pages/admin/anuncios",                color: "#3b82f6" },
  { label: "Broadcast",       icon: <NotificationsActiveIcon sx={{ fontSize: 20 }} />,  route: "/pages/admin/broadcast-notification",  color: "#8b5cf6" },
];

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminHomePage() {
  const { isAdminMaster, authReady, logout, role } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const canAccess = role === "admin_master" || role === "admin";

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  useEffect(() => { if (authReady && !canAccess) router.replace("/pages/user/home"); }, [authReady, canAccess, router]);

  useEffect(() => {
    if (!authReady || !canAccess) return;
    getEvents(100, 0)
      .then((data) => setEvents([...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())))
      .catch(() => showToast("Erro ao carregar eventos", "error"))
      .finally(() => setLoading(false));
  }, [authReady, canAccess, showToast]);

  if (!authReady) {
    return (
      <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#ffcc01" }} />
      </Box>
    );
  }

  if (!canAccess) return null;

  const handleLogout = () => { logout(); router.replace("/pages/auth/login"); };

  return (
    <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, pb: 6 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          position: "sticky", top: 0, zIndex: 100,
          backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          px: { xs: 2, sm: 3 }, py: 1.5,
        }}
      >
        <Box sx={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Image src="/logo/logo-circuito.png" alt="Circuito Sertanejo" width={100} height={36} style={{ objectFit: "contain" }} priority />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Chip
              icon={<AdminPanelSettingsIcon sx={{ fontSize: 16, color: "#ffcc01 !important" }} />}
              label={isAdminMaster ? "Admin Master" : "Admin"}
              size="small"
              sx={{ backgroundColor: "rgba(255,204,1,0.15)", border: "1px solid rgba(255,204,1,0.3)", color: "#ffcc01", fontWeight: 600, fontSize: "0.7rem" }}
            />
            <IconButton onClick={handleLogout} size="small" sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff" } }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      <Box
        sx={{
          maxWidth: 1200, margin: "0 auto",
          px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 3, sm: 4 },
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.45s ease, transform 0.45s ease",
        }}
      >
        {/* Events section header */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3, gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700 }}>Eventos</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.88rem", mt: 0.3 }}>
              Selecione um evento para gerenciar
            </Typography>
          </Box>
          <Button
            startIcon={<AddIcon />}
            onClick={() => router.push("/pages/admin/events/create")}
            sx={{ backgroundColor: "#fff", color: "#111", textTransform: "none", fontWeight: 700, borderRadius: "12px", px: 2.5, flexShrink: 0, "&:hover": { backgroundColor: "#e8e8e8" } }}
          >
            Criar evento
          </Button>
        </Box>

        {/* Events grid */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: "#fff" }} />
          </Box>
        ) : events.length === 0 ? (
          <Paper sx={{ p: 4, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
            <EventIcon sx={{ color: "rgba(255,255,255,0.15)", fontSize: 48, mb: 1 }} />
            <Typography sx={{ color: "#fff", fontWeight: 600, mb: 0.5 }}>Nenhum evento cadastrado</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>Clique em "Criar evento" para começar.</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 2 }}>
            {events.map((ev) => (
              <Paper
                key={ev.id}
                elevation={0}
                onClick={() => router.push(`/pages/admin/events/${ev.id}`)}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 3, overflow: "hidden", cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", transform: "translateY(-3px)", boxShadow: "0 8px 24px rgba(0,0,0,0.35)" },
                }}
              >
                {ev.banner_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ev.banner_image} alt={ev.title} style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
                ) : (
                  <Box sx={{ width: "100%", height: 140, backgroundColor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <EventIcon sx={{ color: "rgba(255,255,255,0.12)", fontSize: 40 }} />
                  </Box>
                )}
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 1 }}>
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.3 }}>{ev.title}</Typography>
                    <Chip
                      label={ev.is_active ? "Ativo" : "Inativo"}
                      size="small"
                      sx={{ backgroundColor: ev.is_active ? "rgba(46,204,113,0.15)" : "rgba(255,255,255,0.08)", color: ev.is_active ? "#2ecc71" : "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "0.65rem", height: 20, flexShrink: 0 }}
                    />
                  </Box>
                  {ev.starts_at && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                      <CalendarTodayIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }} />
                      <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>{formatDateShort(ev.starts_at)}</Typography>
                    </Box>
                  )}
                  {ev.location && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: 0.4 }}>
                      <LocationOnIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }} />
                      <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }} noWrap>{ev.location}</Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        {/* General actions */}
        <Divider sx={{ borderColor: "rgba(255,255,255,0.07)", my: 4 }} />
        <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", mb: 2 }}>
          Ações gerais
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 1.5 }}>
          {GENERAL_ACTIONS.map((a) => (
            <Paper
              key={a.route}
              elevation={0}
              onClick={() => router.push(a.route)}
              sx={{
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 2.5, p: 2, cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.18)" },
                display: "flex", alignItems: "center", gap: 1.5,
              }}
            >
              <Box sx={{ color: a.color, display: "flex", flexShrink: 0 }}>{a.icon}</Box>
              <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>{a.label}</Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
