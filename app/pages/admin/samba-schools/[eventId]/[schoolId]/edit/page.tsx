"use client";

import { Box, CircularProgress } from "@mui/material";
import EditSambaSchoolForm from "@/app/components/admin/samba-schools/EditSambaSchoolForm";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";

export default function EditSambaSchoolPage() {
  const { isAdmin, authReady } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = Number(params.eventId);
  const schoolId = Number(params.schoolId);

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

  if (!isAdmin) {
    return null;
  }

  if (!eventId || isNaN(eventId) || !schoolId || isNaN(schoolId)) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#000",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box>ID inválido</Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        height: "100vh",
        overflowY: "auto",
        backgroundImage: "url(/background/dashboard.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <EditSambaSchoolForm eventId={eventId} schoolId={schoolId} />
    </Box>
  );
}




