"use client";

import { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  IconButton,
  Avatar,
  Chip,
  Divider,
} from "@mui/material";
import {
  Event as EventIcon,
  Pending as PendingIcon,
  Campaign as CampaignIcon,
  CardGiftcard as CardGiftcardIcon,
  Storefront as StorefrontIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  NotificationsActive as BroadcastIcon,
  MusicNote as MusicIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import Image from "next/image";

interface ActionCard {
  label: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

const ACTION_CARDS: ActionCard[] = [
  {
    label: "Eventos",
    description: "Criar e gerenciar eventos",
    icon: <EventIcon sx={{ fontSize: 28 }} />,
    route: "/pages/admin/events/create",
    color: "#4f46e5",
  },
  {
    label: "Posts Pendentes",
    description: "Aprovar ou rejeitar posts",
    icon: <PendingIcon sx={{ fontSize: 28 }} />,
    route: "/pages/admin/pending-posts",
    color: "#f59e0b",
  },
  {
    label: "Patrocinadores",
    description: "Gerenciar patrocinadores",
    icon: <PeopleIcon sx={{ fontSize: 28 }} />,
    route: "/pages/admin/permissions",
    color: "#10b981",
  },
  {
    label: "Anúncios",
    description: "Criar e ver analytics",
    icon: <CampaignIcon sx={{ fontSize: 28 }} />,
    route: "/pages/admin/anuncios",
    color: "#3b82f6",
  },
  {
    label: "Brindes",
    description: "Analytics por estande",
    icon: <CardGiftcardIcon sx={{ fontSize: 28 }} />,
    route: "/pages/admin/brindes",
    color: "#ec4899",
  },
  {
    label: "Estandes ao Vivo",
    description: "Dashboard em tempo real",
    icon: <StorefrontIcon sx={{ fontSize: 28 }} />,
    route: "/pages/admin/live-stands",
    color: "#06b6d4",
  },
  {
    label: "Broadcast",
    description: "Notificações em massa",
    icon: <BroadcastIcon sx={{ fontSize: 28 }} />,
    route: "/pages/admin/broadcast-notification",
    color: "#8b5cf6",
  },
  {
    label: "Letras",
    description: "Gerenciar letras de músicas",
    icon: <MusicIcon sx={{ fontSize: 28 }} />,
    route: "/pages/admin/music-lyrics",
    color: "#ef4444",
  },
];

export default function AdminHomePage() {
  const { isAdmin, isAdminMaster, authReady, logout, role } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!isAdmin) {
      router.replace("/pages/user/home");
    }
  }, [authReady, isAdmin, router]);

  if (!authReady) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          ...dashboardBackgroundSx,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#ffcc01" }} />
      </Box>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace("/pages/auth/login");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        ...dashboardBackgroundSx,
        pb: 6,
      }}
    >
      {/* ── HEADER ── */}
      <Paper
        elevation={0}
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "rgba(0, 0, 0, 0.55)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          px: { xs: 2, sm: 3 },
          py: 1.5,
        }}
      >
        <Box
          sx={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Image
              src="/logo/logo-circuito.png"
              alt="Circuito Sertanejo"
              width={100}
              height={36}
              style={{ objectFit: "contain" }}
              priority
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Chip
              icon={<AdminIcon sx={{ fontSize: 16, color: "#ffcc01 !important" }} />}
              label={isAdminMaster ? "Admin Master" : "Admin"}
              size="small"
              sx={{
                backgroundColor: "rgba(255, 204, 1, 0.15)",
                border: "1px solid rgba(255, 204, 1, 0.3)",
                color: "#ffcc01",
                fontWeight: 600,
                fontSize: "0.7rem",
              }}
            />
            <IconButton onClick={handleLogout} size="small" sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff" } }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* ── CONTEÚDO ── */}
      <Box
        sx={{
          maxWidth: 1200,
          margin: "0 auto",
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 3, sm: 4 },
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.45s ease, transform 0.45s ease",
        }}
      >
        {/* Boas vindas */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ color: "#fff", fontWeight: 700, mb: 0.5 }}
          >
            Painel Administrativo
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>
            Gerencie eventos, conteúdos e usuários do Circuito Sertanejo
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 4 }} />

        {/* Grade de ações */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }, gap: 2 }}>
          {ACTION_CARDS.map((card) => (
            <Box key={card.route}>
              <Paper
                elevation={0}
                onClick={() => router.push(card.route)}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 3,
                  p: 2.5,
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.11)",
                    borderColor: "rgba(255,255,255,0.22)",
                    transform: "translateY(-3px)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                  },
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2,
                    backgroundColor: `${card.color}22`,
                    border: `1px solid ${card.color}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: card.color,
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {card.label}
                  </Typography>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "0.78rem",
                      mt: 0.3,
                    }}
                  >
                    {card.description}
                  </Typography>
                </Box>

                <ChevronRightIcon sx={{ color: "rgba(255,255,255,0.25)", fontSize: 20, flexShrink: 0 }} />
              </Paper>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
