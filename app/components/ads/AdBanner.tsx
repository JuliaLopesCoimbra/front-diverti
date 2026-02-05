"use client";

import { useState, useEffect } from "react";
import { Box, Skeleton, Typography } from "@mui/material";

interface AdPlacement {
  image_url: string;
  redirect_url: string;
  viewable_url?: string;
  alt_text: string;
}

// Lista de anúncios mockados disponíveis na pasta public/ads
const MOCK_ADS: AdPlacement[] = [
  {
    image_url: "/ads/1.png",
    redirect_url: "https://www.ambev.com.br/marcas/brahma",
    alt_text: "Brahma - Oferta Exclusiva N1",
  },
  
  {
    image_url: "/ads/2.png",
    redirect_url: "https://www.maturatta.com.br",
    alt_text: "Maturatta - Oferta Exclusiva N1",
  },
  {
    image_url: "/ads/3.png",
    redirect_url: "https://www.pernod-ricard.com",
    alt_text: "Pernod - Oferta Exclusiva N1",
  },
  {
    image_url: "/ads/4.png",
    redirect_url: "https://www.uol.com.br",
    alt_text: "UOL - Oferta Exclusiva N1",
  },
  {
    image_url: "/ads/5.png",
    redirect_url: "https://www.uol.com.br",
    alt_text: "UOL - Oferta Exclusiva N1",
  },
];

// Função para selecionar um anúncio aleatório da lista mockada
const getRandomMockAd = (): AdPlacement => {
  const randomIndex = Math.floor(Math.random() * MOCK_ADS.length);
  return MOCK_ADS[randomIndex];
};

export default function AdBanner() {
  const [ad, setAd] = useState<AdPlacement | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const random = Math.floor(Math.random() * 1000000);
        const res = await fetch(
          `https://servedbyadbutler.com/adserve/;ID=189447;size=300x250;setID=1132395;type=json;rnd=${random}`,
          { cache: 'no-store' }
        );
        
        const data = await res.json();

        // Verifica se o status é SUCESSO e se existe de fato um anúncio no objeto placements
        if (data.status === "SUCCESS" && data.placements && data.placements.placement_1) {
          const placement = data.placements.placement_1;
          setAd(placement);

          // REGISTRO DE VIEW (Apenas se não for o fallback)
          if (placement.viewable_url) {
            const img = new window.Image();
            img.src = placement.viewable_url;
          }
        } else {
          // Caso retorne "NO_ADS" ou placements vazio
          console.log("AdButler retornou NO_ADS. Usando anúncio mockado.");
          setAd(getRandomMockAd());
        }
      } catch (error) {
        // Caso ocorra erro de conexão, timeout ou AdBlock
        console.warn("Erro de conexão com AdButler. Carregando anúncio mockado.");
        setAd(getRandomMockAd());
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

  // Se por algum motivo o ad ainda for null, não renderiza nada para não quebrar o layout
  if (!ad) return null;

  return (
    <Box
      sx={{
        mt: 0,
        mb: 1,
        mx: { xs: 2, md: "auto" },
        maxWidth: { xs: "100%", md: "800px", lg: "900px" },
        width: { xs: "calc(100% - 32px)", md: "100%" },
        borderRadius: "16px",
        overflow: "hidden",
       
        position: "relative",
        cursor: "pointer",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 30px rgba(255, 201, 31, 0.2)",
          borderColor: "rgba(255, 201, 31, 0.3)",
        },
      }}
      onClick={() => window.open(ad.redirect_url, "_blank")}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: { xs: 100, sm: 250, md: 300 },
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!imageError ? (
          <img
            src={ad.image_url}
            alt={ad.alt_text || "Propaganda N1"}
            onError={(e) => {
              console.warn("Erro ao carregar imagem do anúncio:", e);
              setImageError(true);
            }}
            onLoad={() => setImageError(false)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              cursor: "pointer",
            }}
            
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              color: "#fff",
              padding: 2,
              textAlign: "center",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.7)",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              Anúncio indisponível
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}