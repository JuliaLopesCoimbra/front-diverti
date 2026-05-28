"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import api from "@/app/services/auth/axiosConfig";
import { jwtDecode } from "jwt-decode";

interface AdPlacement {
  image_url: string;
  redirect_url: string;
  viewable_url?: string;
  alt_text: string;
}

const MOCK_ADS: AdPlacement[] = [
  {
    image_url: "/ads/1.png",
    redirect_url: "https://www.globoplay.globo.com",
    alt_text: "Globoplay",
  },
  {
    image_url: "/ads/2.png",
    redirect_url: "https://www.brahma.com.br",
    alt_text: "Brahma",
  },
  {
    image_url: "/ads/3.png",
    redirect_url: "https://www.sicoob.com.br",
    alt_text: "Sicoob",
  },
  {
    image_url: "/ads/4.png",
    redirect_url: "https://www.vw.com.br",
    alt_text: "Volkswagen",
  },
  {
    image_url: "/ads/5.png",
    redirect_url: "https://www.ballantines.com",
    alt_text: "Ballantines",
  },
];

const getRandomMockAd = (): AdPlacement => {
  const randomIndex = Math.floor(Math.random() * MOCK_ADS.length);
  return MOCK_ADS[randomIndex];
};

const getFirstAd = (): AdPlacement => {
  return MOCK_ADS.find(ad => ad.image_url === "/ads/3.png") || MOCK_ADS[2];
};

interface AdBannerProps {
  isFirst?: boolean;
  eventId?: number; // ID do evento para tracking de cliques
}

export default function AdBanner({ isFirst = false, eventId }: AdBannerProps = {}) {
  const [ad, setAd] = useState<AdPlacement | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const viewRegisteredRef = useRef(false); // Para evitar registrar múltiplas views
  const viewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastViewTimeRef = useRef<number>(0);

  // Função helper para obter identificador do anúncio
  const getAdIdentifier = useCallback((adData: AdPlacement): string => {
    let adIdentifier = adData.image_url;
    if (adIdentifier.startsWith("/ads/")) {
      adIdentifier = adIdentifier.replace("/ads/", "").replace(".png", "");
    } else if (adIdentifier.includes("/")) {
      // Se for URL completa, pega a última parte
      adIdentifier = adIdentifier.split("/").pop() || adIdentifier;
      // Remove extensão se houver
      adIdentifier = adIdentifier.replace(/\.(png|jpg|jpeg|gif)$/i, "");
    }
    return adIdentifier;
  }, []);

  // Função para registrar view no backend
  const registerAdView = useCallback(async (adData: AdPlacement) => {
    // Só registra se tiver eventId
    if (!eventId || viewRegisteredRef.current) {
      return;
    }

    const now = Date.now();
    // Throttle: máximo 1 view a cada 5 segundos
    if (now - lastViewTimeRef.current < 5000) {
      return;
    }

    // Limpa timeout anterior se existir
    if (viewTimeoutRef.current) {
      clearTimeout(viewTimeoutRef.current);
    }

    // Debounce: espera 2 segundos de visibilidade antes de registrar
    viewTimeoutRef.current = setTimeout(async () => {
      if (viewRegisteredRef.current) return;

      try {
        const viewData = {
          event_id: eventId,
          ad_identifier: getAdIdentifier(adData),
          ad_url: adData.image_url,
        };

        await api.post("/ads/views", viewData).catch((error) => {
          // Silenciosamente ignora erros (especialmente rate limit 429)
          if (error.response?.status !== 429) {
            console.warn("Erro ao registrar view de anúncio:", error);
          }
        });
        
        viewRegisteredRef.current = true;
        lastViewTimeRef.current = Date.now();
      } catch (error) {
        // Ignora erros silenciosamente
        console.warn("Erro ao registrar view de anúncio:", error);
      }
    }, 2000); // Espera 2 segundos
  }, [eventId, getAdIdentifier]);

  // Função para registrar clique no backend
  const registerAdClick = async (adData: AdPlacement) => {
    // Só registra se tiver eventId
    if (!eventId) {
      return;
    }

    try {
      const clickData = {
        event_id: eventId,
        ad_identifier: getAdIdentifier(adData),
        ad_url: adData.image_url,
        redirect_url: adData.redirect_url,
      };

      // Tenta registrar o clique (não bloqueia se falhar)
      await api.post("/ads/clicks", clickData).catch((error) => {
        // Silenciosamente ignora erros para não interromper a experiência do usuário
        console.warn("Erro ao registrar clique de anúncio:", error);
      });
    } catch (error) {
      // Silenciosamente ignora erros
      console.warn("Erro ao registrar clique de anúncio:", error);
    }
  };

  // Função para lidar com o clique
  const handleAdClick = async () => {
    if (!ad) return;

    // Registra o clique (não bloqueia a navegação)
    await registerAdClick(ad);

    // Abre o link (sempre executa, mesmo se o registro falhar)
    window.open(ad.redirect_url, "_blank");
  };

  useEffect(() => {
    const fetchAd = async () => {
      if (isFirst) {
        setAd(getFirstAd());
        setLoading(false);
        return;
      }

      try {
        const accessKey = 'A48227066';
        const zone = 'n1'; 
    
        // Esta URL simplificada é a mais estável para contas Pro
        const res = await fetch(
          `https://www.adplugg.com/serve/${accessKey}/json.js?zn=${zone}`,
          { cache: 'no-store' }
        );
        
        if (!res.ok) throw new Error('Aguardando ativação das métricas no AdPlugg');
    
        const data = await res.json();
        const adsList = Array.isArray(data) ? data : (data.ads || []);
    
        if (adsList.length > 0) {
          const remoteAd = adsList[0];
          
          // O AdPlugg só conta a VIEW se batermos no pixel_url
          if (remoteAd.pixel_url) {
            const img = new window.Image();
            img.src = remoteAd.pixel_url;
          }
    
          setAd({
            image_url: remoteAd.image_url,
            redirect_url: remoteAd.click_url, // O AdPlugg conta o CLICK aqui
            alt_text: remoteAd.name || "N1 App"
          });
        } else {
          setAd(getRandomMockAd());
        }
      } catch (error) {
        // Se a API falhar, mostramos o local para não perder o anúncio na tela
        console.warn("API AdPlugg em propagação. Métricas iniciarão em breve.");
        setAd(getRandomMockAd());
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [isFirst]);

  // Intersection Observer para detectar quando o anúncio fica visível
  useEffect(() => {
    if (!ad || !bannerRef.current || !eventId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Registra view quando o anúncio fica visível (pelo menos 70% visível)
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            registerAdView(ad);
          } else {
            // Se sair da tela, cancela o timeout
            if (viewTimeoutRef.current) {
              clearTimeout(viewTimeoutRef.current);
              viewTimeoutRef.current = null;
            }
          }
        });
      },
      {
        threshold: 0.7, // 70% do anúncio precisa estar visível
        rootMargin: "0px",
      }
    );

    observer.observe(bannerRef.current);

    return () => {
      observer.disconnect();
      if (viewTimeoutRef.current) {
        clearTimeout(viewTimeoutRef.current);
      }
    };
  }, [ad, eventId, registerAdView]);

  // Reset do flag quando o anúncio muda
  useEffect(() => {
    viewRegisteredRef.current = false;
    lastViewTimeRef.current = 0;
    if (viewTimeoutRef.current) {
      clearTimeout(viewTimeoutRef.current);
      viewTimeoutRef.current = null;
    }
  }, [ad]);

  if (loading) {
    return (
      <Box sx={{ mx: { xs: 2, md: "auto" }, mt: 2, mb: 2, maxWidth: { xs: "100%", md: "800px", lg: "900px" }, width: { xs: "calc(100% - 32px)", md: "100%" } }}>
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!ad) return null;

  return (
    <Box
      ref={bannerRef}
      sx={{
        mt: 0, mb: 1, mx: { xs: 2, md: "auto" },
        maxWidth: { xs: "100%", md: "800px", lg: "900px" },
        width: { xs: "calc(100% - 32px)", md: "100%" },
        borderRadius: "16px", overflow: "hidden", position: "relative", cursor: "pointer",
        transition: "all 0.3s ease",
        "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 30px rgba(255, 201, 31, 0.2)" },
      }}
      onClick={handleAdClick}
    >
      <Box sx={{ position: "relative", width: "100%", height: { xs: 100, sm: 250, md: 300 }, backgroundColor: "rgba(0, 0, 0, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {!imageError ? (
          <img
            src={ad.image_url}
            alt={ad.alt_text}
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 47%" }}
          />
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: "#fff" }}>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>Anúncio indisponível</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}