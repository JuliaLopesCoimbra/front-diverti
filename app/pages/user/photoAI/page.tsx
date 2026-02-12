"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  // Badge, // sistema de compra (carrinho) desativado
} from "@mui/material";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
// import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined"; // sistema de compra desativado
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import { useFeedCache } from "@/app/context/FeedCacheContext";
import { searchFace } from "@/app/services/ai/searchFaceService";
import { useToast } from "@/app/context/ToastContext";
import api from "@/app/services/auth/axiosConfig";
// import { useRouter } from "next/navigation"; // usado só para carrinho/roulette
type Stage = "intro" | "camera" | "results";

interface SearchResult {
  url: string;
  similarity?: number;
  label?: string;
}

interface PhotoAIPageProps {
  eventId: number;
}

export default function PhotoAIPage({ eventId }: PhotoAIPageProps) {
  const { getCache, setCache } = useFeedCache();
  const cacheKey = `photo-ai-results-event-${eventId}`;
  
  const [stage, setStage] = useState<Stage>("intro");
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<SearchResult | null>(null);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  // const [cart, setCart] = useState<SearchResult[]>([]); // sistema de compra desativado
  const { showToast } = useToast();
  // const router = useRouter(); // usado só para carrinho/roulette

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previousEventIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  useEffect(() => {
    const isEventChange = previousEventIdRef.current !== null && previousEventIdRef.current !== eventId;
    
    if (isEventChange) {
      setStage("intro");
      setResults([]);
      setSearchMessage(null);
      // setCart([]); // sistema de compra desativado
      setSelectedPhoto(null);
      setIsUploading(false);
      setCountdown(null);
      setCameraError(null);
      stopCamera();
      previousEventIdRef.current = eventId;
      return;
    }

    const cached = getCache(cacheKey);
    
    if (cached && cached.data.length > 0) {
      setResults(cached.data);
      setStage("results");
      
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
    }

    previousEventIdRef.current = eventId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // ===== CACHE: Salvar scroll position quando em results =====
  const lastScrollPositionRef = useRef(0);
  
  useEffect(() => {
    if (stage !== "results" || results.length === 0) return;
    
    let throttleTimeout: NodeJS.Timeout | null = null;
    const THROTTLE_MS = 400; // Otimizado para performance
    
    const updateScrollPosition = () => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      lastScrollPositionRef.current = currentScroll;
      
      if (throttleTimeout) clearTimeout(throttleTimeout);
      
      throttleTimeout = setTimeout(() => {
        if (results.length > 0) {
          setCache(cacheKey, results, currentScroll);
        }
      }, THROTTLE_MS);
    };
    
    const handleScroll = () => {
      updateScrollPosition();
    };
    
    const handlePageHide = () => {
      if (results.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, results, finalScroll);
      }
    };
    
    const handleBeforeUnload = () => {
      if (results.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, results, finalScroll);
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden && results.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, results, finalScroll);
      }
    };
    
    const handleBlur = () => {
      if (results.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, results, finalScroll);
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
      
      if (results.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, results, finalScroll);
      }
    };
  }, [stage, results, cacheKey, setCache]);

  // Garantir que o stream seja atribuído quando mudar para câmera
  useEffect(() => {
    if (stage === "camera" && streamRef.current && videoRef.current) {
      console.log("Atribuindo stream ao vídeo no useEffect");
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.error("Erro ao reproduzir vídeo:", err);
      });
    }
  }, [stage]);

  const extractErrorMessage = (error: any) => {
    return (
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "Não foi possível concluir a operação. Tente novamente."
    );
  };

  const getCameraUnavailableMessage = () => {
    const isSecure = typeof window !== "undefined" && window.location?.protocol === "https:";
    if (!isSecure) {
      return "A câmera só funciona em conexão segura (HTTPS). Acesse o app pelo link com cadeado ou use a mesma rede em modo seguro.";
    }
    return "Câmera não disponível neste navegador ou dispositivo. Tente abrir no Chrome ou Safari (não use navegador dentro de rede social ou app de mensagem).";
  };

  const requestCamera = async () => {
    setIsRequestingCamera(true);
    setCameraError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      console.error("[PhotoAI/Camera] navigator.mediaDevices.getUserMedia não disponível", {
        hasNavigator: typeof navigator !== "undefined",
        hasMediaDevices: typeof navigator?.mediaDevices !== "undefined",
        protocol: typeof window !== "undefined" ? window.location?.protocol : null,
      });
      const message = getCameraUnavailableMessage();
      setCameraError(message);
      showToast(message, "error");
      setIsRequestingCamera(false);
      return;
    }

    try {
      console.log("[PhotoAI/Camera] Solicitando permissão da câmera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      console.log("[PhotoAI/Camera] Câmera permitida. Stream:", stream.id);
      streamRef.current = stream;
      setStage("camera");

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // play() pode rejeitar no primeiro momento (autoplay policy / vídeo ainda não pronto).
          // Não mostrar erro aqui: o vídeo costuma iniciar no onLoadedMetadata ou sozinho.
          videoRef.current.play().catch((err) => {
            console.warn("[PhotoAI/Camera] play() rejeitou (pode ser temporário):", err);
          });
        }
      }, 100);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      console.error("[PhotoAI/Camera] Erro getUserMedia:", e?.name, e?.message, err);

      const isMediaDevicesError =
        e?.message?.includes("navigator.mediaDevices") ||
        e?.message?.includes("getUserMedia") ||
        e?.message?.includes("undefined is not an object");

      const message = isMediaDevicesError
        ? getCameraUnavailableMessage()
        : `Não foi possível acessar a câmera. ${e?.message?.includes("Permission") ? "Permita o acesso à câmera nas configurações do navegador." : "Tente novamente ou use outro navegador (Chrome/Safari)."}`;

      setCameraError(message);
      showToast(message, "error");
    } finally {
      setIsRequestingCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise<File | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
          resolve(file);
        },
        "image/jpeg",
        0.9
      );
    });
  };

  const handleSearch = async () => {
    // Inicia a contagem regressiva
    setCountdown(3);
    
    // Contagem regressiva: 3, 2, 1
    let currentCount = 3;
    const countdownInterval = setInterval(() => {
      currentCount -= 1;
      if (currentCount > 0) {
        setCountdown(currentCount);
      } else {
        clearInterval(countdownInterval);
        setCountdown(null);
        // Inicia a busca após a contagem
        performSearch();
      }
    }, 1000);
  };

  const performSearch = async () => {
    setIsUploading(true);
    setSearchMessage(null);
    
    try {
      const file = await capturePhoto();
      if (!file) {
        const message = "Não foi possível capturar a foto. Tente novamente.";
        setSearchMessage(message);
        showToast(message, "error");
        setIsUploading(false);
        return;
      }

      const response = await searchFace(file, String(eventId));
      console.log("Resposta completa da API:", response);
      console.log("Matches:", response.matches);

      const imagesFromApi: SearchResult[] =
        response.images?.map((url: string) => ({ url })) ||
        response.matches
          ?.map((m: any) => {
            console.log("Processando match:", m);
            return {
              url: m.image_url || m.url || m.image || "",
              similarity: m.similarity,
              label: m.name || m.external_image_id,
            };
          })
          .filter((r: SearchResult) => {
            console.log("Resultado após filtro:", r);
            return r.url;
          }) ||
        [];

      console.log("Imagens finais para exibir:", imagesFromApi);
      setResults(imagesFromApi);
      setSearchMessage(response.message || null);
      if (response.message) {
        showToast(response.message, "info");
      }
      setStage("results");
    } catch (error: any) {
      const message = extractErrorMessage(error);
      setSearchMessage(message);
      showToast(message, "error");
    } finally {
      stopCamera();
      setIsUploading(false);
    }
  };

  const renderIntro = () => (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Container centralizado para desktop */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "1200px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box px={4} py={3} display="flex" flexDirection="column" gap={3} sx={{ maxWidth: 700, width: "100%", alignSelf: "center" }}>
          <Box
            sx={{
              background: "#e9e8ed",
              borderRadius: 2,
              display: "flex",
              gap: 2,
              p: 2,
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                border: "2px solid #4c36e0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#4c36e0",
                background: "#fff",
              }}
            >
              <ImageOutlinedIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
              Encontre suas fotos por reconhecimento facial.Tire uma selfie ou envie sua foto de rosto.
              </Typography>
            </Box>
          </Box>

          <Box display="flex" flexDirection="column" gap={1}>
            <Typography variant="h6" fontWeight={700}>
              Encontre suas fotos tiradas durante o evento
            </Typography>
            <Typography variant="body1">
            Utilizamos reconhecimento facial para localizar suas fotos com rapidez e segurança.
             Basta tirar uma selfie ou enviar uma foto do seu rosto, e o sistema encontrará automaticamente todas as imagens em que você aparece.
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            fullWidth
            sx={{ background: "#5a3cf1", borderRadius: 2, py: 1.5 }}
            onClick={requestCamera}
            disabled={isRequestingCamera}
          >
            {isRequestingCamera ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Procurar agora"
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );

  const renderCamera = () => (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Container centralizado para desktop */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "1200px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box px={2} py={2} display="flex" flexDirection="column" gap={2} sx={{ maxWidth: 700, width: "100%", alignSelf: "center" }}>
          <Box
            sx={{
              width: "100%",
              maxWidth: 320,
              margin: "0 auto",
              aspectRatio: "3 / 4",
              border: "3px solid #6c54ff",
              borderRadius: "50%",
              overflow: "hidden",
              background: "#d9d9d9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              flexShrink: 0,
            }}
          >
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          onLoadedMetadata={() => {
            if (videoRef.current) {
              videoRef.current.play().catch(() => {});
            }
          }}
          onPlaying={() => {
            // Vídeo realmente iniciou; remove mensagem de erro se foi exibida por engano
            setCameraError(null);
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "50%",
          }}
        />
        
        {countdown !== null && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              borderRadius: "50%",
              overflow: "hidden",
            }}
          >
            <Typography
              variant="h1"
              sx={{
                color: "white",
                fontSize: 120,
                fontWeight: 700,
              }}
            >
              {countdown}
            </Typography>
          </Box>
        )}

        {isUploading && countdown === null && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              gap: 2,
              borderRadius: "50%",
              overflow: "hidden",
            }}
          >
            <CircularProgress size={60} sx={{ color: "#fff" }} />
            <Typography
              variant="h6"
              sx={{
                color: "white",
                fontWeight: 600,
              }}
            >
              Buscando fotos...
            </Typography>
          </Box>
        )}

        {countdown === null && !isUploading && (
          <Button
            variant="contained"
            size="small"
            onClick={handleSearch}
            disabled={isUploading || countdown !== null}
            sx={{ 
              position: "absolute",
              bottom: 20,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#6c54ff",
              borderRadius: 2,
              px: 3,
              py: 1,
              fontSize: 14,
              fontWeight: 600,
              textTransform: "none",
              zIndex: 5,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              "&:hover": {
                background: "#5a3cf1",
              },
            }}
          >
            Pronto
          </Button>
        )}
      </Box>

      {cameraError && (
        <Typography color="error" textAlign="center" sx={{ fontSize: 14 }}>
          {cameraError}
        </Typography>
      )}

      {countdown === null && !isUploading && (
        <Stack gap={0.5} sx={{ px: 1, py: 1 }}>
          <Typography 
            variant="body1" 
            textAlign="center" 
            fontWeight={700}
            sx={{ 
              color: "white",
              fontSize: 16,
              lineHeight: 1.4,
            }}
          >
            Primeiro, posicione seu rosto dentro da marcação.
          </Typography>
          <Typography 
            variant="body2" 
            textAlign="center" 
            sx={{ 
              color: "#666",
              fontSize: 14,
              lineHeight: 1.4,
            }}
          >
            Clique em "Pronto" quando estiver enquadrado.
          </Typography>
        </Stack>
      )}

      {countdown !== null && (
        <Typography
          variant="body1"
          textAlign="center"
          sx={{
            color: "white",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Preparando captura...
        </Typography>
      )}
        </Box>
      </Box>
    </Box>
  );

  const handlePhotoClick = (photo: SearchResult) => {
    setSelectedPhoto(photo);
    setCartModalOpen(true);
  };

  const handleDownloadPhoto = async () => {
    if (!selectedPhoto) return;
    try {
      const res = await api.get("/photo-ai/download-image", {
        params: { url: selectedPhoto.url },
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
      setCartModalOpen(false);
      setSelectedPhoto(null);
    } catch {
      showToast("Não foi possível baixar a foto. Tente novamente.", "error");
    }
  };

  // Sistema de compra (carrinho) desativado por enquanto
  // const handleCartClick = () => {
  //   if (cart.length > 0) {
  //     router.push(`/pages/user/roulette/${eventId}`);
  //   }
  // };

  const renderResults = () => (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Container centralizado para desktop */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "1200px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box px={2} py={3} display="flex" flexDirection="column" gap={2} sx={{ maxWidth: 700, width: "100%", alignSelf: "center" }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight={700}>
              Minhas fotos
            </Typography>
            {/* Botão carrinho / sistema de compra desativado por enquanto
            <Badge badgeContent={cart.length} color="primary">
              <Box
                onClick={handleCartClick}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "#5a3cf1",
                  cursor: cart.length > 0 ? "pointer" : "default",
                  transition: "opacity 0.2s",
                  "&:hover": cart.length > 0 ? { opacity: 0.8 } : {},
                }}
              >
                <ShoppingCartOutlinedIcon />
              </Box>
            </Badge>
            */}
          </Box>

          {searchMessage && (
            <Typography variant="body2" >
              {searchMessage}
            </Typography>
          )}

          {results.length === 0 ? (
            <Typography textAlign="center">
              Nenhuma foto encontrada. Tente novamente com outra imagem.
            </Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                gap: 2,
              }}
            >
              {results.map((item, idx) => (
                <Box
                  key={idx}
                  onClick={() => handlePhotoClick(item)}
                  sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    background: "#fff",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "scale(1.02)",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                    },
                  }}
                >
                  <img
                    src={item.url}
                    alt={item.label || `Foto ${idx + 1}`}
                    style={{
                      width: "100%",
                      display: "block",
                      aspectRatio: "3 / 4",
                      objectFit: "cover",
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}

          <Button
            variant="contained"
            size="large"
            fullWidth
            sx={{ background: "#5a3cf1", borderRadius: 2, py: 1.5, mt: 1 }}
            onClick={() => {
              setResults([]);
              setSearchMessage(null);
              setStage("intro");
            }}
          >
            Procurar novamente
          </Button>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {stage === "camera" && renderCamera()}
      {stage === "results" && renderResults()}
      {stage === "intro" && renderIntro()}

      {/* Modal da foto: visualizar e baixar */}
      <Dialog
        open={cartModalOpen}
        onClose={() => {
          setCartModalOpen(false);
          setSelectedPhoto(null);
        }}
        maxWidth="sm"
        fullWidth
        slotProps={{
          backdrop: {},
          root: {
            sx: {
              zIndex: 1600,
            },
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
          Foto
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
                  src={selectedPhoto.url}
                  alt={selectedPhoto.label || "Foto selecionada"}
                  style={{
                    width: "100%",
                    display: "block",
                    aspectRatio: "3 / 4",
                    objectFit: "cover",
                  }}
                />
              </Box>
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
              setCartModalOpen(false);
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
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "#4a2cd0",
              },
            }}
          >
            Baixar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
