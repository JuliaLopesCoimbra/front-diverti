"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Paper,
  IconButton,
} from "@mui/material";
import { ArrowBackIos, Close, NavigateBefore, NavigateNext } from "@mui/icons-material";
import { updateNews, getNewsDetails, NewsDetailsResponse } from "@/app/services/news/newsService";
import { useToast } from "@/app/context/ToastContext";
import { useAuth } from "@/app/context/AuthContext";
import { getEvents, EventResponse } from "@/app/services/events/eventService";

function EditNewsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canCreatePost, isColunista } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]); // URLs das imagens existentes
  const [removedExistingImages, setRemovedExistingImages] = useState<Set<number>>(new Set()); // Índices das imagens existentes removidas
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [eventId, setEventId] = useState<number | null>(null);
  const [newsId, setNewsId] = useState<number | null>(null);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [news, setNews] = useState<NewsDetailsResponse | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (!canCreatePost) {
      router.push("/pages/user/home");
      return;
    }

    // Pega newsId e eventId da URL
    const newsIdParam = searchParams.get("newsId");
    const eventIdParam = searchParams.get("eventId");
    if (newsIdParam) {
      const id = parseInt(newsIdParam, 10);
      setNewsId(id);
      if (eventIdParam) {
        const eventId = parseInt(eventIdParam, 10);
        setEventId(eventId);
        loadNews(eventId, id);
      } else {
        // Se não tiver eventId, tenta carregar primeiro para obter o event_id
        loadNewsWithoutEventId(id);
      }
    } else {
      showToast("ID da notícia não fornecido", "error");
      router.back();
    }

    // Carrega eventos
    const loadEvents = async () => {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (error) {
        console.error("Erro ao carregar eventos", error);
      } finally {
        setLoadingEvents(false);
      }
    };

    loadEvents();
  }, [canCreatePost, router, searchParams, showToast]);

  const loadNewsWithoutEventId = async (id: number) => {
    // Primeiro tenta obter o event_id usando o endpoint básico
    // Mas como não temos esse endpoint no front, vamos exigir que o eventId seja passado
    showToast("Evento não encontrado. Por favor, acesse a página através do evento.", "error");
    router.back();
  };

  const loadNews = async (eventId: number, id: number) => {
    setLoadingNews(true);
    try {
      const data = await getNewsDetails(id, eventId);
      setNews(data);
      setTitle(data.title);
      setContent(data.content);
      setEventId(data.event_id);

      // Carrega as imagens existentes
      if (data.images && data.images.length > 0) {
        const sortedImages = [...data.images].sort((a, b) => a.image_order - b.image_order);
        const imageUrls = sortedImages.map((img) => img.image_url);
        setExistingImages(imageUrls);
        setImagePreviews(imageUrls);
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Erro ao carregar notícia",
        "error"
      );
      router.back();
    } finally {
      setLoadingNews(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      
      // Limita a 5 imagens no total (existentes não removidas + novas)
      // existingImages.length - removedExistingImages.size = imagens existentes que permanecem
      const remainingExisting = existingImages.length - removedExistingImages.size;
      const totalImages = remainingExisting + images.length;
      const availableSlots = 5 - totalImages;
      const filesToAdd = fileArray.slice(0, availableSlots);
      
      if (filesToAdd.length === 0) {
        showToast("Máximo de 5 imagens permitidas", "error");
        return;
      }
      
      const newImages = [...images, ...filesToAdd];
      setImages(newImages);
      
      // Cria previews das novas imagens
      filesToAdd.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    // Calcula quantas imagens existentes temos (que vieram do backend)
    const existingImagesCount = existingImages.length;
    
    if (index < existingImagesCount) {
      // Remove uma imagem existente (que veio do backend)
      setRemovedExistingImages((prev) => new Set([...prev, index]));
      const newPreviews = imagePreviews.filter((_, i) => i !== index);
      setImagePreviews(newPreviews);
    } else {
      // Remove uma imagem nova (que foi adicionada pelo usuário)
      const newImageIndex = index - existingImagesCount;
      const newImages = images.filter((_, i) => i !== newImageIndex);
      setImages(newImages);
      const newPreviews = imagePreviews.filter((_, i) => i !== index);
      setImagePreviews(newPreviews);
    }
    
    // Ajusta o índice atual se necessário
    const newTotal = imagePreviews.length - 1;
    if (currentImageIndex >= newTotal && newTotal > 0) {
      setCurrentImageIndex(newTotal - 1);
    } else if (newTotal === 0) {
      setCurrentImageIndex(0);
    }
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? imagePreviews.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === imagePreviews.length - 1 ? 0 : prev + 1));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && imagePreviews.length > 1) {
      handleNextImage();
    }
    if (isRightSwipe && imagePreviews.length > 1) {
      handlePreviousImage();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      showToast("Título e conteúdo são obrigatórios", "error");
      return;
    }

    if (imagePreviews.length === 0 && images.length === 0) {
      showToast("Pelo menos uma imagem é obrigatória", "error");
      return;
    }

    if (!eventId || !newsId) {
      showToast("Erro: evento ou notícia não encontrado", "error");
      return;
    }

    setLoading(true);

    try {
      // Se houver remoções de imagens existentes, precisa substituir todas
      // Se não houver remoções, apenas adiciona as novas às existentes
      const hasRemovals = removedExistingImages.size > 0;
      
      if (hasRemovals && images.length === 0) {
        // Se removeu imagens mas não adicionou novas, precisa adicionar pelo menos uma
        showToast("Você precisa manter pelo menos uma imagem ou adicionar novas", "error");
        return;
      }
      
      await updateNews(eventId, newsId, {
        title: title.trim(),
        content: content.trim(),
        images: images.length > 0 ? images : undefined,
        replace_all: hasRemovals, // Se removeu alguma, substitui todas
      });

      // Verifica se é colunista editando um post aprovado
      // Se for, redireciona para a lista de pending
      if (isColunista && news?.status === "approved") {
        showToast("Notícia atualizada! Post enviado para aprovação novamente.", "success");
        const redirectUrl = eventId 
          ? `/pages/admin/pending-posts?eventId=${eventId}`
          : "/pages/admin/pending-posts";
        router.push(redirectUrl);
      } else {
        showToast("Notícia atualizada com sucesso!", "success");
        // Inclui o eventId na URL ao redirecionar
        const redirectUrl = eventId 
          ? `/pages/news/${newsId}?eventId=${eventId}`
          : `/pages/news/${newsId}`;
        router.push(redirectUrl);
      }
    } catch (error: any) {
      const message =
        error.response?.data?.detail || "Erro ao atualizar notícia";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loadingNews || loadingEvents) {
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
            Editar publicaçãoo
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
                      Este post está sendo editado no evento:{" "}
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
                    disabled={loading || (imagePreviews.length + images.length) >= 5}
                  />
                  <label htmlFor="image-upload">
                    <Button
                      component="span"
                      disabled={loading || (imagePreviews.length + images.length) >= 5}
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
                      {(imagePreviews.length + images.length) > 0 
                        ? `Adicionar fotos (${imagePreviews.length + images.length}/5)` 
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
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Título */}
                  <TextField
                    fullWidth
                    placeholder="Título"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                    variant="standard"
                    sx={{
                      mt: 3,
                      "& .MuiInput-underline:before": {
                        borderBottomColor: "rgba(255,255,255,0.2)",
                      },
                      "& .MuiInput-underline:hover:before": {
                        borderBottomColor: "rgba(255,255,255,0.4)",
                      },
                      "& .MuiInput-underline:after": {
                        borderBottomColor: "rgba(255,255,255,0.6)",
                      },
                      "& input": {
                        color: "#fff",
                        fontSize: "1.5rem",
                        fontWeight: 500,
                        paddingBottom: 1,
                      },
                      "& input::placeholder": {
                        color: "rgba(255,255,255,0.5)",
                        opacity: 1,
                      },
                    }}
                  />

                  {/* Conteúdo */}
                  <TextField
                    fullWidth
                    placeholder="Escreva uma legenda..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={loading}
                    multiline
                    rows={8}
                    variant="standard"
                    sx={{
                      mt: 2,
                      "& .MuiInput-underline:before": {
                        borderBottomColor: "rgba(255,255,255,0.2)",
                      },
                      "& .MuiInput-underline:hover:before": {
                        borderBottomColor: "rgba(255,255,255,0.4)",
                      },
                      "& .MuiInput-underline:after": {
                        borderBottomColor: "rgba(255,255,255,0.6)",
                      },
                      "& textarea": {
                        color: "#fff",
                        fontSize: "0.9375rem",
                        lineHeight: 1.5,
                        paddingBottom: 1,
                      },
                      "& textarea::placeholder": {
                        color: "rgba(255,255,255,0.5)",
                        opacity: 1,
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
                  disabled={loading || !title.trim() || !content.trim() || (imagePreviews.length === 0 && images.length === 0) || !eventId || !newsId}
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
                    "Salvar"
                  )}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}

export default function EditNewsPage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <EditNewsPageContent />
    </Suspense>
  );
}
