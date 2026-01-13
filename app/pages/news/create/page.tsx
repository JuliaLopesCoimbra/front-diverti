"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Paper,
  IconButton,
  Divider,
} from "@mui/material";
import { ArrowBackIos, Close, NavigateBefore, NavigateNext } from "@mui/icons-material";
import { createNews } from "@/app/services/news/newsService";
import { useToast } from "@/app/context/ToastContext";
import { useAuth } from "@/app/context/AuthContext";
import { getEvents, EventResponse } from "@/app/services/events/eventService";

export default function CreateNewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canCreatePost } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [eventId, setEventId] = useState<number | null>(null);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (!canCreatePost) {
      router.push("/pages/user/home");
      return;
    }

    // Carrega eventos
    const loadEvents = async () => {
      try {
        const data = await getEvents();
        setEvents(data);

        // Tenta pegar eventId da URL
        const eventIdParam = searchParams.get("eventId");
        if (eventIdParam) {
          const id = parseInt(eventIdParam, 10);
          if (data.find((e) => e.id === id)) {
            setEventId(id);
            setLoadingEvents(false);
            return;
          }
        }

        // Tenta pegar do localStorage
        const savedEventId = localStorage.getItem("selectedEventId");
        if (savedEventId) {
          const id = parseInt(savedEventId, 10);
          const savedEvent = data.find((e) => e.id === id);
          if (savedEvent) {
            setEventId(id);
            setLoadingEvents(false);
            return;
          }
        }

        // Usa o primeiro evento disponível
        if (data.length > 0) {
          setEventId(data[0].id);
        }
      } catch (error) {
        console.error("Erro ao carregar eventos", error);
        showToast("Erro ao carregar eventos", "error");
      } finally {
        setLoadingEvents(false);
      }
    };

    loadEvents();
  }, [canCreatePost, router, searchParams, showToast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      
      // Limita a 5 imagens
      const filesToAdd = fileArray.slice(0, 5 - images.length);
      
      if (filesToAdd.length === 0) {
        showToast("Máximo de 5 imagens permitidas", "error");
        return;
      }
      
      const newImages = [...images, ...filesToAdd];
      setImages(newImages);
      
      // Cria previews para todas as imagens
      const newPreviews: string[] = [];
      let loadedCount = 0;
      
      newImages.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          loadedCount++;
          if (loadedCount === newImages.length) {
            setImagePreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
    
    // Ajusta o índice atual se necessário
    if (currentImageIndex >= newImages.length && newImages.length > 0) {
      setCurrentImageIndex(newImages.length - 1);
    } else if (newImages.length === 0) {
      setCurrentImageIndex(0);
    }
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : imagePreviews.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < imagePreviews.length - 1 ? prev + 1 : 0));
  };

  // Funções para touch/swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && imagePreviews.length > 1) {
      handleNextImage();
    }
    if (isRightSwipe && imagePreviews.length > 1) {
      handlePreviousImage();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventId) {
      showToast("Selecione um evento", "error");
      return;
    }

    if (!title.trim()) {
      showToast("O título é obrigatório", "error");
      return;
    }

    if (!content.trim()) {
      showToast("O conteúdo é obrigatório", "error");
      return;
    }

    if (images.length === 0) {
      showToast("Pelo menos uma imagem é obrigatória", "error");
      return;
    }

    if (images.length > 5) {
      showToast("Máximo de 5 imagens permitidas", "error");
      return;
    }

    setLoading(true);

    try {
      await createNews(eventId, {
        title: title.trim(),
        content: content.trim(),
        images,
        event_id: eventId,
      });

      showToast("Notícia criada com sucesso!", "success");
      router.push("/pages/user/home");
    } catch (error: any) {
      const message =
        error.response?.data?.detail || "Erro ao criar notícia";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loadingEvents) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundImage: "url(/background/dashboard.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#ffcc01" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url(/background/dashboard.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        padding: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <IconButton
            onClick={() => router.back()}
            sx={{
              color: "#fff",
              padding: 0.5,
              "&:hover": {
                backgroundColor: "transparent",
                opacity: 0.7,
              },
            }}
          >
            <ArrowBackIos sx={{ fontSize: 20 }} />
          </IconButton>
          <Typography variant="h6" sx={{ color: "white", fontWeight: 600, fontSize: "1rem" }}>
            Nova publicação
          </Typography>
        </Box>

        {/* Form */}
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "transparent",
            overflow: "hidden",
          }}
        >
          <form onSubmit={handleSubmit}>
            <Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Upload de imagens */}
                <Box>
                  {/* Texto do evento */}
                  {eventId && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255,255,255,0.6)",
                        fontSize: "0.75rem",
                        mb: 1.5,
                      }}
                    >
                      Este post está sendo criado no evento:{" "}
                      <Box component="span" sx={{ fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                        {events.find((e) => e.id === eventId)?.title || "Carregando..."}
                      </Box>
                    </Typography>
                  )}

                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="image-upload"
                    type="file"
                    multiple
                    onChange={handleImageChange}
                    disabled={loading || images.length >= 5}
                  />
                  <label htmlFor="image-upload">
                    <Button
                      component="span"
                      disabled={loading || images.length >= 5}
                      sx={{
                        color: "rgba(255,255,255,0.9)",
                        textTransform: "none",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        padding: 0,
                        minWidth: "auto",
                        "&:hover": {
                          backgroundColor: "transparent",
                          color: "#fff",
                        },
                        "&:disabled": {
                          color: "rgba(255,255,255,0.5)",
                        },
                      }}
                    >
                      {images.length > 0 
                        ? `Adicionar fotos (${images.length}/5)` 
                        : "Selecionar fotos"}
                    </Button>
                  </label>

                  {imagePreviews.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      {/* Carrossel de imagens */}
                      <Box
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                        sx={{
                          position: "relative",
                          width: "100%",
                          borderRadius: 0,
                          overflow: "hidden",
                          backgroundColor: "transparent",
                          touchAction: "pan-y",
                          userSelect: "none",
                        }}
                      >
                        {/* Imagem atual */}
                        <Box
                          component="img"
                          src={imagePreviews[currentImageIndex]}
                          alt={`Preview ${currentImageIndex + 1}`}
                          sx={{
                            width: "100%",
                            aspectRatio: "1 / 1",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />

                        {/* Botão de remover */}
                        <IconButton
                          onClick={() => handleRemoveImage(currentImageIndex)}
                          disabled={loading}
                          sx={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            color: "#fff",
                            width: 32,
                            height: 32,
                            "&:hover": {
                              backgroundColor: "rgba(0, 0, 0, 0.7)",
                            },
                            zIndex: 2,
                          }}
                        >
                          <Close sx={{ fontSize: 18 }} />
                        </IconButton>

                        {/* Botões de navegação (apenas se tiver mais de 1 imagem) */}
                        {imagePreviews.length > 1 && (
                          <>
                            <IconButton
                              onClick={handlePreviousImage}
                              disabled={loading}
                              sx={{
                                position: "absolute",
                                left: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                backgroundColor: "rgba(0, 0, 0, 0.5)",
                                color: "#fff",
                                width: 32,
                                height: 32,
                                "&:hover": {
                                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                                },
                                zIndex: 2,
                              }}
                            >
                              <NavigateBefore sx={{ fontSize: 20 }} />
                            </IconButton>
                            <IconButton
                              onClick={handleNextImage}
                              disabled={loading}
                              sx={{
                                position: "absolute",
                                right: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                backgroundColor: "rgba(0, 0, 0, 0.5)",
                                color: "#fff",
                                width: 32,
                                height: 32,
                                "&:hover": {
                                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                                },
                                zIndex: 2,
                              }}
                            >
                              <NavigateNext sx={{ fontSize: 20 }} />
                            </IconButton>
                          </>
                        )}

                        {/* Indicadores de página (dots) */}
                        {imagePreviews.length > 1 && (
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 12,
                              left: "50%",
                              transform: "translateX(-50%)",
                              display: "flex",
                              gap: 0.75,
                              zIndex: 2,
                            }}
                          >
                            {imagePreviews.map((_, index) => (
                              <Box
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  backgroundColor:
                                    index === currentImageIndex
                                      ? "#fff"
                                      : "rgba(255, 255, 255, 0.4)",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  "&:hover": {
                                    backgroundColor:
                                      index === currentImageIndex
                                        ? "#fff"
                                        : "rgba(255, 255, 255, 0.6)",
                                  },
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Título */}
                <TextField
                  placeholder="Escreva um título..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  fullWidth
                  disabled={loading}
                  variant="standard"
                  sx={{
                    "& .MuiInput-root": {
                      color: "#fff",
                      fontSize: "1.25rem",
                      fontWeight: 400,
                      "&::before": {
                        borderBottom: "none",
                      },
                      "&::after": {
                        borderBottom: "none",
                      },
                      "&:hover::before": {
                        borderBottom: "none",
                      },
                    },
                    "& .MuiInput-input": {
                      padding: 0,
                      "&::placeholder": {
                        color: "rgba(255,255,255,0.5)",
                        opacity: 1,
                        fontSize: "1.25rem",
                      },
                    },
                  }}
                />

                {/* Conteúdo */}
                <TextField
                  placeholder="Escreva uma legenda..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={12}
                  disabled={loading}
                  variant="standard"
                  sx={{
                    "& .MuiInput-root": {
                      color: "#fff",
                      fontSize: "1rem",
                      fontWeight: 400,
                      "&::before": {
                        borderBottom: "none",
                      },
                      "&::after": {
                        borderBottom: "none",
                      },
                      "&:hover::before": {
                        borderBottom: "none",
                      },
                    },
                    "& .MuiInput-input": {
                      padding: 0,
                      lineHeight: 1.5,
                      "&::placeholder": {
                        color: "rgba(255,255,255,0.5)",
                        opacity: 1,
                        fontSize: "1rem",
                      },
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Actions */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                mt: 4,
              }}
            >
              <Button
                onClick={() => router.back()}
                disabled={loading}
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  textTransform: "none",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "transparent",
                    color: "rgba(255,255,255,0.9)",
                  },
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !title.trim() || !content.trim() || images.length === 0 || !eventId}
                sx={{
                  backgroundColor: "#ffcc01",
                  color: "#000",
                  fontWeight: 600,
                  borderRadius: "14px",
                  textTransform: "none",
                  px: 3,
                  "&:hover": {
                    backgroundColor: "#e6b800",
                  },
                  "&:disabled": {
                    backgroundColor: "rgba(255, 201, 31, 0.3)",
                    color: "rgba(0, 0, 0, 0.3)",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={20} sx={{ color: "#000" }} />
                ) : (
                  "Compartilhar"
                )}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}


