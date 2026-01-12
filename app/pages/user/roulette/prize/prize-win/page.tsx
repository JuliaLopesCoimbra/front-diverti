"use client";

import { Box, Typography, Button } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PrizeWinPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [prize, setPrize] = useState<{
    id: string | null;
    name: string | null;
    image_url?: string | null;
    position: string | null;
  } | null>(null);

  useEffect(() => {
    const prizeId = params.get("prize_id");
    const prizeName = params.get("prize_name");
    const prizeImage = params.get("prize_image");
    const prizePosition = params.get("prize_position");

    if (!prizeName) {
      router.replace("/pages/user/home");
      return;
    }

    setPrize({
      id: prizeId,
      name: prizeName,
      image_url: prizeImage,
      position: prizePosition,
    });
  }, [params, router]);

  if (!prize) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundImage: "url(/background/dashboard.png)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="white">Carregando...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url(/background/prize.png)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
      }}
    >
   

      {prize.image_url && (
        <Box
          component="img"
          src={prize.image_url}
          alt={prize.name || "Prêmio"}
          sx={{
            width: "100%",
            maxWidth: 80,
            borderRadius: 2,
            marginTop: "470px",
            mb: 3,
            objectFit: "cover",
          }}
        />
      )}

 
      <Button
        variant="contained"
        size="large"
        onClick={() => router.push("/pages/user/home")}
        sx={{
          backgroundColor: "#ffcc01",
          color: "#000",
          fontWeight: 600,
          marginTop: "10px",
          borderRadius: "14px",
          textTransform: "none",
          px: 4,
          py: 0.5,
          "&:hover": {
            backgroundColor: "#e6b800",
          },
        }}
      >
        Resgatar Cupom
      </Button>
    </Box>
  );
}

