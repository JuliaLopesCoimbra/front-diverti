"use client";

import { Button, Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

export default function EventIndisponivelPublic() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        ...dashboardBackgroundSx,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        padding: { xs: 3, sm: 4 },
        textAlign: "center",
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{
          color: "white",
          fontWeight: 700,
          marginBottom: 2,
          fontSize: { xs: "1.75rem", sm: "2.25rem" },
        }}
      >
        Evento Indisponível
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: "white",
          fontSize: { xs: "1rem", sm: "1.125rem" },
          marginBottom: 4,
          maxWidth: "600px",
          lineHeight: 1.6,
        }}
      >
        O evento que você procurou não está mais disponível ou não está ativo no momento.
      </Typography>
      <Button
        onClick={() => router.push("/")}
        sx={{
          backgroundColor: "#ffffff",
          color: "#fff",
          fontWeight: 700,
          padding: "12px 32px",
          borderRadius: "30px",
          textTransform: "none",
          fontSize: { xs: 14, sm: 16 },
          "&:hover": {
            backgroundColor: "#FFC400",
          },
        }}
      >
        Voltar para a página inicial
      </Button>
    </Box>
  );
}

