"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  Skeleton,
} from "@mui/material";
import { useFeedCache } from "@/app/context/FeedCacheContext";
import {
  getMyPurchasedPhotos,
  PurchasedPhoto,
} from "@/app/services/myPhotos/myPhotosService";

interface MyPhotosProps {
  hideTitle?: boolean;
}

export default function MyPhotos({ hideTitle = false }: MyPhotosProps) {
  // ===== CACHE (Instagram/TikTok style) =====
  const { getCache, setCache } = useFeedCache();
  const cacheKey = "my-photos";
  const [initialized, setInitialized] = useState(false);
  // =========================================
  
  const [photos, setPhotos] = useState<PurchasedPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPhotos = async () => {
    try {
      const data = await getMyPurchasedPhotos();
      setPhotos(data);
    } catch (err) {
      console.error("Erro ao carregar fotos compradas", err);
    } finally {
      setLoading(false);
    }
  };

  // ===== CACHE: Carregar dados ao montar =====
  useEffect(() => {
    if (initialized) return;

    // Tenta carregar do cache
    const cached = getCache(cacheKey);
    
    if (cached && cached.data.length > 0) {
      // ✅ Dados encontrados no cache!
      setPhotos(cached.data);
      setLoading(false);
      setInitialized(true);
      
      // Restaura posição do scroll
      const targetPosition = cached.scrollPosition;
      
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      
      let attempts = 0;
      const maxAttempts = 20;
      
      const attemptRestore = () => {
        attempts++;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'instant' as ScrollBehavior
        });
        
        const currentScroll = window.scrollY;
        const diff = Math.abs(currentScroll - targetPosition);
        
        if (diff >= 10 && attempts < maxAttempts) {
          requestAnimationFrame(attemptRestore);
        }
      };
      
      requestAnimationFrame(attemptRestore);
      
      [50, 100, 200, 400, 800, 1600].forEach(delay => {
        setTimeout(() => {
          window.scrollTo({
            top: targetPosition,
            behavior: 'instant' as ScrollBehavior
          });
        }, delay);
      });
    } else {
      // ❌ Sem cache - carrega da API
      loadPhotos();
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== CACHE: Salvar scroll position =====
  const lastScrollPositionRef = useRef(0);
  
  useEffect(() => {
    let throttleTimeout: NodeJS.Timeout | null = null;
    const THROTTLE_MS = 400; // Otimizado para performance
    
    const updateScrollPosition = () => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      lastScrollPositionRef.current = currentScroll;
      
      if (throttleTimeout) clearTimeout(throttleTimeout);
      
      throttleTimeout = setTimeout(() => {
        if (photos.length > 0) {
          setCache(cacheKey, photos, currentScroll);
        }
      }, THROTTLE_MS);
    };
    
    const handleScroll = () => {
      updateScrollPosition();
    };
    
    const handlePageHide = () => {
      if (photos.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, photos, finalScroll);
      }
    };
    
    const handleBeforeUnload = () => {
      if (photos.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, photos, finalScroll);
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden && photos.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, photos, finalScroll);
      }
    };
    
    const handleBlur = () => {
      if (photos.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, photos, finalScroll);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      if (throttleTimeout) clearTimeout(throttleTimeout);
      
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      
      if (photos.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, photos, finalScroll);
      }
    };
  }, [photos, cacheKey, setCache]);

  if (loading) {
    return (
      <Box padding={2}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
          {[1, 2, 3].map((item) => (
            <Skeleton
              key={item}
              variant="rectangular"
              width="100%"
              height={200}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  if (photos.length === 0) {
    return (
      <Box padding={2} textAlign="center">
        <Typography variant="body1" fontWeight={500} sx={{ color: "#fff", marginBottom: 1, fontSize: "0.9375rem" }}>
          Nenhuma foto comprada
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
          Você ainda não comprou nenhuma foto.
        </Typography>
      </Box>
    );
  }

  return (
    <Box padding={2}>
      {!hideTitle && (
        <Typography
          variant="h6"
          fontWeight={500}
          sx={{ color: "#fff", marginBottom: 2, fontSize: "1rem" }}
        >
          Minhas Fotos Compradas
        </Typography>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
        {photos.map((photo) => (
          <Card
            key={photo.id}
            sx={{
              backgroundColor: "transparent",
              boxShadow: "none",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <CardMedia
              component="img"
              image={photo.image_url}
              alt={`Foto ${photo.id}`}
              sx={{
                width: "100%",
                aspectRatio: "1 / 1",
                objectFit: "cover",
                borderRadius: 2,
              }}
            />
            {photo.event_name && (
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  display: "block",
                  marginTop: 1,
                }}
              >
                {photo.event_name}
              </Typography>
            )}
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.5)",
                display: "block",
              }}
            >
              {new Date(photo.purchased_at).toLocaleDateString("pt-BR")}
            </Typography>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

