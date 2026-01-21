"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Button, Skeleton } from "@mui/material";
import Image from "next/image";

interface AdPlacement {
  image_url: string;
  redirect_url: string;
  viewable_url: string;
  alt_text: string;
  // O AdButler pode enviar título/descrição via metadados, 
  // mas aqui usaremos os seus padrões caso não venham.
}

export default function AdBanner() {
  const [ad, setAd] = useState<AdPlacement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const res = await fetch(
          "https://servedbyadbutler.com/adserve/;ID=189447;size=300x250;setID=1132395;type=json"
        );
        const data = await res.json();

        if (data.status === "SUCCESS" && data.placements.placement_1) {
          const placement = data.placements.placement_1;
          setAd(placement);

          // REGISTRO DE VIEW (Impressão)
          if (placement.viewable_url) {
            const img = new window.Image();
            img.src = placement.viewable_url;
          }
        }
      } catch (error) {
        console.error("Erro AdButler:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, []);

  if (loading) {
    return (
      <Box 
        sx={{ 
          mx: { xs: 2, md: "auto" },
          mt: 2, 
          mb: 2,
          maxWidth: { xs: "100%", md: "800px", lg: "900px" },
          width: { xs: "calc(100% - 32px)", md: "100%" },
        }}
      >
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!ad) return null;

  return (
    <Box
      sx={{
        mt: 0,
        mb: 1,
        mx: { xs: 2, md: "auto" },
        maxWidth: { xs: "100%", md: "800px", lg: "900px" },
        width: { xs: "calc(100% - 32px)", md: "100%" },
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
        position: "relative",
        cursor: "pointer",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
        },
      }}
      onClick={() => window.open(ad.redirect_url, "_blank")}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          // AQUI ESTÃO OS SEUS BREAKPOINTS
          height: { xs: 100, sm: 250, md: 300 },
          backgroundColor: "#000",
        }}
      >
      <img
  src={ad.image_url}
  alt={ad.alt_text || "Propaganda AdButler"}
  style={{
    width: "100%",
    height: "100%",
    objectFit: "cover", // Mantém o preenchimento que você desejava
    cursor: "pointer",
  }}
/>
    
      </Box>
    </Box>
  );
}