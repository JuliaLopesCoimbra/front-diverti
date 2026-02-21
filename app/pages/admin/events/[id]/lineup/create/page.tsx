"use client";

import { Box, CircularProgress } from "@mui/material";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import CreateLineupItemForm from "@/app/components/admin/lineup/CreateLineupItemForm";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";

export default function CreateLineupItemPage() {
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
          ...dashboardBackgroundSx,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#ffc91f" }} />
      </Box>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (!eventId || isNaN(eventId)) {
    return (
      <Box
        sx={{
          ...dashboardBackgroundSx,
          minHeight: "100vh",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box>ID do evento inválido</Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        ...dashboardBackgroundSx,
        minHeight: "100vh",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CreateLineupItemForm eventId={eventId} />
    </Box>
  );
}












