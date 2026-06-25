"use client";

import { Box, CircularProgress } from "@mui/material";
import EditEventForm from "@/app/components/admin/events/EditEventForm";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

export default function EditEventPage() {
  const { isAdmin, authReady } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = Number(params.id);

  useEffect(() => {
    if (authReady && !isAdmin) {
      router.push("/pages/user/home");
    }
  }, [isAdmin, router, authReady]);

  if (!authReady) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#ffc91f" }} />
      </Box>
    );
  }

  if (!isAdmin || !eventId) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        ...dashboardBackgroundSx,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ALTERADO: Container adicionado para limitar a largura e centralizar todo o conteúdo */}
      <Box 
        sx={{ 
          width: "100%",
          maxWidth: { xs: "100%", sm: "600px", md: "800px" }, // Ajuste esses valores para casar com o tamanho dos seus outros componentes
          mx: "auto", 
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 3, sm: 4 },
          pb: 6
        }}
      >
        <EditEventForm eventId={eventId} />
      </Box>
    </Box>
  );
}