"use client";

import { Box, Typography, Avatar, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, MeResponse } from "@/app/services/auth/authService";
import { EventResponse } from "@/app/services/events/eventAppService";
import { getProfile, ProfileResponse } from "@/app/services/profile/profileService";
import HamburgerMenu from "@/app/components/layout/HamburgerMenu";

interface Props {
  event: EventResponse;
  events: EventResponse[];
  onSelectEvent: (event: EventResponse) => void;
  currentEvent: EventResponse;
}

export default function HomeHeader({
  event,
  events,
  onSelectEvent,
  currentEvent,
}: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((error) => {
        console.error("Erro ao buscar perfil:", error);
      });
  }, []);


  if (!profile) return null;

  return (
    <Box
      sx={{
        padding: { xs: 2, md: 3, lg: 4 },
        borderBottom: "solid 1px rgba(255,255,255,0.2)",
        display: "flex",
        flexDirection: "column",
        gap: { xs: 1, md: 1.5, lg: 2 },
      }}
    >
      {/* LINHA SUPERIOR */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* ESQUERDA: HAMBURGER + NOME */}
        <Box display="flex" alignItems="center" gap={{ xs: 1, md: 1.5, lg: 2 }}>
          <HamburgerMenu
            events={events}
            currentEvent={currentEvent}
            onSelectEvent={onSelectEvent}
          />

          <Typography 
            variant="h6" 
            fontWeight={700} 
            sx={{ 
              color: "white",
              fontSize: { xs: "1.25rem", md: "1.5rem", lg: "1.75rem" },
            }}
          >
            {profile.name || profile.email}
          </Typography>
        </Box>

        {/* DIREITA: NOTIFICAÇÕES + AVATAR */}
        <Box display="flex" alignItems="center" gap={{ xs: 1, md: 1.5, lg: 2 }}>
          <IconButton
            onClick={() => setNotificationsOpen(true)}
            sx={{
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
              fontSize: { xs: "1.5rem", md: "1.75rem", lg: "2rem" },
            }}
          >
            <NotificationsIcon sx={{ fontSize: "inherit" }} />
          </IconButton>
          
          <Avatar 
            src={profile.profile_photo || undefined} 
            onClick={() => router.push("/pages/user/profile")}
            sx={{ 
              width: { xs: 40, md: 56, lg: 64 }, 
              height: { xs: 40, md: 56, lg: 64 },
              border: "2px solid #FFD600",
              cursor: "pointer",
              transition: "transform 0.2s",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            {!profile.profile_photo && (profile.name?.[0] || profile.email[0]).toUpperCase()}
          </Avatar>
        </Box>
      </Box>

      {/* DATA */}
      {/* <Typography variant="body2" sx={{ color: "white" }}>
        {today}
      </Typography> */}

      {/* EVENTO + STATUS */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: { xs: 0.4, md: 0.6, lg: 0.8 },
        }}
      >
        <Typography
          variant="body1"
          fontWeight={600}
          sx={{ 
            color: "#fff",
            fontSize: { xs: "1rem", md: "1.25rem", lg: "1.5rem" },
          }}
        >
          {event.title}
        </Typography>

        <Box display="flex" alignItems="center" gap={{ xs: 0.6, md: 0.8, lg: 1 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: "white",
              fontSize: { xs: "0.875rem", md: "1rem", lg: "1.125rem" },
            }}
          >
            {event.is_active ? "Ambiente ao vivo" : "Ambiente offline"}
          </Typography>

          <Box
            sx={{
              width: { xs: 8, md: 10, lg: 12 },
              height: { xs: 8, md: 10, lg: 12 },
              borderRadius: "50%",
              backgroundColor: event.is_active ? "#2ecc71" : "#9e9e9e",
              boxShadow: event.is_active 
                ? "0 0 6px rgba(46, 204, 113, 0.8)" 
                : "0 0 6px rgba(158, 158, 158, 0.5)",
            }}
          />
        </Box>
      </Box>

      {/* DIALOG DE NOTIFICAÇÕES */}
      <Dialog
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: "#1a1a1a",
            color: "white",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: "white" }}>Notificações</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
            Ainda não há notificações.
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
