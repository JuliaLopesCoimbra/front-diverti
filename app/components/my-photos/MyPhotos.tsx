"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { useFeedCache } from "@/app/context/FeedCacheContext";
import {
  getMyDownloadedPhotos,
  DownloadedPhoto,
} from "@/app/services/myPhotos/myPhotosService";
import api from "@/app/services/auth/axiosConfig";
import { useToast } from "@/app/context/ToastContext";

interface MyPhotosProps {
  hideTitle?: boolean;
}

export default function MyPhotos({ hideTitle = false }: MyPhotosProps) {
  // ===== CACHE (Instagram/TikTok style) =====
  const { getCache, setCache } = useFeedCache();
  const cacheKey = "my-photos";
  const [initialized, setInitialized] = useState(false);
  // =========================================
  
  const PHOTOS_PER_LOAD = 5;
  const [photos, setPhotos] = useState<DownloadedPhoto[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<DownloadedPhoto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { showToast } = useToast();
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Log quando o componente renderiza
  useEffect(() => {
    console.log("🔍 [MyPhotos] Componente renderizado", {
      loading,
      loadingMore,
      photosLength: photos.length,
      offset,
      hasMore,
      initialized
    });
  }, [loading, loadingMore, photos.length, offset, hasMore, initialized]);

  const loadPhotos = async (reset = false) => {
    console.log("🔍 [MyPhotos] loadPhotos CHAMADO", { 
      reset, 
      loading, 
      loadingMore, 
      offset,
      photosLength: photos.length 
    });
    
    if (loading || loadingMore) {
      console.log("⚠️ [MyPhotos] loadPhotos BLOQUEADO - já está carregando");
      return;
    }

    if (reset) {
      console.log("🔍 [MyPhotos] Setando loading = true (reset)");
      setLoading(true);
    } else {
      console.log("🔍 [MyPhotos] Setando loadingMore = true");
      setLoadingMore(true);
    }

    const nextOffset = reset ? 0 : offset;
    console.log("🔍 [MyPhotos] Chamando getMyDownloadedPhotos", { 
      limit: PHOTOS_PER_LOAD, 
      offset: nextOffset 
    });

    try {
      const data = await getMyDownloadedPhotos(PHOTOS_PER_LOAD, nextOffset);
      console.log("✅ [MyPhotos] Dados recebidos:", data.length, "fotos");
      console.log("🔍 [MyPhotos] Dados completos:", data);
      
      if (reset) {
        console.log("🔍 [MyPhotos] Resetando fotos com novos dados");
        setPhotos(data);
      } else {
        console.log("🔍 [MyPhotos] Adicionando fotos às existentes");
        setPhotos(prev => {
          const merged = [...prev, ...data];
          const unique = Array.from(
            new Map(merged.map((item) => [item.id, item])).values()
          );
          console.log("🔍 [MyPhotos] Fotos após merge:", unique.length);
          return unique;
        });
      }
      
      setOffset(nextOffset + data.length);
      setHasMore(data.length >= PHOTOS_PER_LOAD);
      console.log("✅ [MyPhotos] Estado atualizado:", {
        photosCount: reset ? data.length : photos.length + data.length,
        offset: nextOffset + data.length,
        hasMore: data.length >= PHOTOS_PER_LOAD
      });
    } catch (err: any) {
      console.error("❌ [MyPhotos] ERRO ao carregar fotos:", err);
      console.error("❌ [MyPhotos] Detalhes do erro:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
        baseURL: err.config?.baseURL
      });
      setHasMore(false);
    } finally {
      console.log("🔍 [MyPhotos] Finalizando loadPhotos - setando loading = false");
      setLoading(false);
      setLoadingMore(false);
      console.log("✅ [MyPhotos] loadPhotos FINALIZADO");
    }
  };

  // ===== CACHE: Carregar dados ao montar =====
  useEffect(() => {
    console.log("🔍 [MyPhotos] useEffect INICIADO", { initialized });
    
    if (initialized) {
      console.log("⚠️ [MyPhotos] Já inicializado, pulando");
      return;
    }

    console.log("🔍 [MyPhotos] Verificando cache...");
    const cached = getCache(cacheKey);
    console.log("🔍 [MyPhotos] Cache encontrado:", {
      exists: !!cached,
      hasData: cached?.data && Array.isArray(cached.data) && cached.data.length > 0,
      dataLength: cached?.data?.length || 0,
      cacheKey
    });
    
    if (cached && cached.data && cached.data.length > 0) {
      console.log("✅ [MyPhotos] Cache encontrado com dados, usando cache");
      setPhotos(cached.data);
      setOffset(cached.data.length);
      setHasMore(cached.data.length >= PHOTOS_PER_LOAD);
      setLoading(false);
      setInitialized(true);
      console.log("✅ [MyPhotos] Estado atualizado do cache");
      
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
      
      // Revalidar em background
      (async () => {
        try {
          console.log("🔍 [MyPhotos] Revalidando cache em background...");
          const freshData = await getMyDownloadedPhotos(100, 0);
          console.log("✅ [MyPhotos] Cache revalidado:", freshData.length, "fotos");
          
          const cachedIds = cached.data.map((p: DownloadedPhoto) => p.id).sort().join(',');
          const freshIds = freshData.map((p: DownloadedPhoto) => p.id).sort().join(',');
          
          if (cachedIds !== freshIds || cached.data.length !== freshData.length) {
            setPhotos([...freshData]);
            setOffset(freshData.length);
            setHasMore(freshData.length >= PHOTOS_PER_LOAD);
            
            const hasNewItems = freshData.length > cached.data.length;
            const hasRemovedItems = freshData.length < cached.data.length;
            
            if (hasNewItems) {
              setCache(cacheKey, freshData, 0);
              setTimeout(() => {
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }, 500);
            } else if (hasRemovedItems) {
              const safeScrollPosition = Math.min(targetPosition, document.documentElement.scrollHeight - window.innerHeight);
              setCache(cacheKey, freshData, safeScrollPosition);
            } else {
              setCache(cacheKey, freshData, targetPosition);
            }
          } else {
            const contentChanged = JSON.stringify(cached.data) !== JSON.stringify(freshData);
            if (contentChanged) {
              setPhotos([...freshData]);
              setOffset(freshData.length);
              setHasMore(freshData.length >= PHOTOS_PER_LOAD);
            }
            setCache(cacheKey, freshData, targetPosition);
          }
        } catch (err) {
          console.error('❌ [MyPhotos] Erro ao revalidar cache:', err);
        }
      })();
    } else {
      console.log("🔍 [MyPhotos] SEM CACHE - Carregando do servidor");
      console.log("🔍 [MyPhotos] Chamando loadPhotos(true)...");
      
      loadPhotos(true)
        .then(() => {
          console.log("✅ [MyPhotos] loadPhotos concluído com sucesso");
          setInitialized(true);
        })
        .catch((err) => {
          console.error("❌ [MyPhotos] Erro ao carregar fotos na inicialização:", err);
          setLoading(false);
          setInitialized(true);
        });
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

  // Infinite scroll - carregar mais fotos quando chegar no final
  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadPhotos(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, offset, loading, loadingMore]);

  const handlePhotoClick = (photo: DownloadedPhoto) => {
    setSelectedPhoto(photo);
    setModalOpen(true);
  };

  const handleDownloadPhoto = async () => {
    if (!selectedPhoto) return;
    try {
      // Preparar parâmetros para o download
      const params: any = { url: selectedPhoto.image_url };
      
      // Adicionar event_id se disponível
      if (selectedPhoto.event_id) {
        params.event_id = selectedPhoto.event_id;
      }
      
      // Adicionar event_name se disponível
      if (selectedPhoto.event_name) {
        params.event_name = selectedPhoto.event_name;
      }
      
      // Adicionar similaridade se disponível
      if (selectedPhoto.similarity) {
        params.similarity = selectedPhoto.similarity;
      }

      const res = await api.get("/photo-ai/download-image", {
        params,
        responseType: "blob",
      });
      const blob = res.data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `foto-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Foto baixada com sucesso!", "success");
      setModalOpen(false);
      setSelectedPhoto(null);
    } catch {
      showToast("Não foi possível baixar a foto. Tente novamente.", "error");
    }
  };

  if (loading) {
    return (
      <Box 
        padding={2}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Box 
          sx={{ 
            display: "grid", 
            gridTemplateColumns: { 
              xs: "repeat(2, 1fr)", 
              md: "repeat(3, 1fr)" 
            }, 
            gap: 2,
            width: "100%",
            maxWidth: { xs: "100%", md: "800px" },
          }}
        >
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

  if (photos.length === 0 && !loading) {
    return (
      <Box 
        padding={2} 
        textAlign="center"
        sx={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: { xs: "100%", md: "800px" },
          }}
        >
          <Typography variant="body1" fontWeight={500} sx={{ color: "#fff", marginBottom: 1, fontSize: "0.9375rem" }}>
            Nenhuma foto baixada
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
            Você ainda não baixou nenhuma foto.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      padding={2}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: { xs: "100%", md: "800px" },
        }}
      >
        {!hideTitle && (
          <Typography
            variant="h6"
            fontWeight={500}
            sx={{ color: "#fff", marginBottom: 2, fontSize: "1rem" }}
          >
            Minhas Fotos Baixadas
          </Typography>
        )}

        <Box 
          sx={{ 
            display: "grid", 
            gridTemplateColumns: { 
              xs: "repeat(2, 1fr)", 
              md: "repeat(3, 1fr)" 
            }, 
            gap: 2 
          }}
        >
          {photos.map((photo) => (
            <Card
              key={photo.id}
              onClick={() => handlePhotoClick(photo)}
              sx={{
                backgroundColor: "transparent",
                boxShadow: "none",
                borderRadius: 2,
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "scale(1.02)",
                },
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
            </Card>
          ))}
        </Box>

        {/* Loader para infinite scroll */}
        {hasMore && (
          <Box
            ref={loaderRef}
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: 3,
              minHeight: 100,
            }}
          >
            {loadingMore && (
              <CircularProgress
                size={24}
                sx={{
                  color: "#5a3cf1",
                }}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Modal de confirmação de download */}
      <Dialog
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPhoto(null);
        }}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-container": {
            alignItems: "center",
          },
        }}
        PaperProps={{
          sx: {
            backgroundColor: "#1a1a1a",
            color: "#fff",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            pb: 2,
            fontWeight: 600,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: "rgba(90, 60, 241, 0.1)",
            }}
          >
            <ImageOutlinedIcon sx={{ color: "#5a3cf1", fontSize: 28 }} />
          </Box>
          Deseja baixar novamente?
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              alignItems: "center",
            }}
          >
            {selectedPhoto && (
              <>
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: 300,
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  }}
                >
                  <img
                    src={selectedPhoto.image_url}
                    alt={selectedPhoto.event_name || "Foto selecionada"}
                    style={{
                      width: "100%",
                      display: "block",
                      aspectRatio: "1 / 1",
                      objectFit: "cover",
                    }}
                  />
                </Box>
                {selectedPhoto.event_name && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255,255,255,0.7)",
                      textAlign: "center",
                    }}
                  >
                    {selectedPhoto.event_name}
                  </Typography>
                )}
                {selectedPhoto.similarity && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255,255,255,0.5)",
                      textAlign: "center",
                    }}
                  >
                    Similaridade: {selectedPhoto.similarity}
                  </Typography>
                )}
              </>
            )}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            p: 2,
            gap: 1,
          }}
        >
          <Button
            onClick={() => {
              setModalOpen(false);
              setSelectedPhoto(null);
            }}
            sx={{
              color: "rgba(255,255,255,0.7)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.05)",
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDownloadPhoto}
            variant="contained"
            startIcon={<DownloadIcon />}
            sx={{
              backgroundColor: "#5a3cf1",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#4a2cd1",
              },
            }}
          >
            Baixar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

