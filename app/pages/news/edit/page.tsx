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
  Chip,
  Fade,
  Slide,
} from "@mui/material";
import { 
  ArrowBackIos, 
  Close, 
  NavigateBefore, 
  NavigateNext, 
  PhotoCamera, 
  AddPhotoAlternate,
  Event,
  Title as TitleIcon,
  Description,
} from "@mui/icons-material";
import { updateNews, getNewsDetails, NewsDetailsResponse } from "@/app/services/news/newsService";
import { useToast } from "@/app/context/ToastContext";
import { useAuth } from "@/app/context/AuthContext";
import { getEvents, EventResponse } from "@/app/services/events/eventAppService";

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
      
      // Validação de tamanho: máximo 5MB por imagem
      const maxSizePerImage = 5 * 1024 * 1024; // 5MB
      const invalidFiles = fileArray.filter(file => file.size > maxSizePerImage);
      
      if (invalidFiles.length > 0) {
        showToast("Algumas imagens são muito grandes. Máximo de 5MB por imagem.", "error");
        return;
      }
      
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
      
      // Validação de tamanho total: máximo 20MB total
      const currentTotalSize = images.reduce((sum, img) => sum + img.size, 0);
      const newFilesTotalSize = filesToAdd.reduce((sum, file) => sum + file.size, 0);
      const maxTotalSize = 20 * 1024 * 1024; // 20MB
      
      if (currentTotalSize + newFilesTotalSize > maxTotalSize) {
        showToast("O tamanho total das imagens excede 20MB. Reduza o número ou tamanho das imagens.", "error");
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

  const selectedEvent = events.find((e) => e.id === eventId);
  const totalImagesCount = imagePreviews.length;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url(/background/dashboard.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        padding: { xs: 2, sm: 3, md: 4 },
        pb: { xs: 10, sm: 4 },
      }}
    >
      <Box sx={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header com design melhorado */}
        <Fade in timeout={400}>
          <Box 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 2, 
              mb: 4,
              position: "relative",
            }}
          >
            <IconButton
              onClick={() => router.back()}
              sx={{
                color: "#fff",
                padding: 1.5,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateX(-4px)",
                },
              }}
            >
              <ArrowBackIos sx={{ fontSize: 18 }} />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: "#fff", 
                  fontWeight: 700, 
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                  letterSpacing: "-0.02em",
                }}
              >
                Editar Publicação
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: "rgba(255,255,255,0.7)", 
                  fontSize: "0.875rem",
                  mt: 0.5,
                }}
              >
                Atualize suas fotos e informações
              </Typography>
            </Box>
          </Box>
        </Fade>

        {/* Badge do Evento */}
        {eventId && selectedEvent && (
          <Slide direction="down" in timeout={500}>
            <Box sx={{ mb: 3 }}>
              <Chip
                icon={<Event sx={{ fontSize: 16, color: "#ffcc01 !important" }} />}
                label={
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>
                    {selectedEvent.title}
                  </Typography>
                }
                sx={{
                  backgroundColor: "rgba(255, 204, 1, 0.15)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 204, 1, 0.3)",
                  color: "#ffcc01",
                  fontWeight: 600,
                  padding: "8px 4px",
                  height: "auto",
                  "& .MuiChip-icon": {
                    color: "#ffcc01",
                  },
                }}
              />
            </Box>
          </Slide>
        )}

        {/* Form Container com Glassmorphism */}
        <Fade in timeout={600}>
          <Paper
            elevation={0}
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            }}
          >
            <form onSubmit={handleSubmit}>
              <Box sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                {/* Seção de Upload de Imagens */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <PhotoCamera sx={{ color: "#ffcc01", fontSize: 20 }} />
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        color: "#fff", 
                        fontWeight: 600,
                        fontSize: "1rem",
                      }}
                    >
                      Fotos
                    </Typography>
                    {totalImagesCount > 0 && (
                      <Chip
                        label={`${totalImagesCount}/5`}
                        size="small"
                        sx={{
                          backgroundColor: "rgba(255, 204, 1, 0.2)",
                          color: "#ffcc01",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          height: 20,
                        }}
                      />
                    )}
                  </Box>

                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="image-upload"
                    type="file"
                    multiple
                    onChange={handleImageChange}
                    disabled={loading || totalImagesCount >= 5}
                  />
                  
                  {imagePreviews.length === 0 ? (
                    <label htmlFor="image-upload">
                      <Box
                        sx={{
                          border: "2px dashed rgba(255, 255, 255, 0.3)",
                          borderRadius: "16px",
                          padding: { xs: 4, sm: 6 },
                          textAlign: "center",
                          cursor: loading || totalImagesCount >= 5 ? "not-allowed" : "pointer",
                          transition: "all 0.3s ease",
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          "&:hover": {
                            borderColor: "rgba(255, 204, 1, 0.5)",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        <PhotoCamera 
                          sx={{ 
                            fontSize: 48, 
                            color: "rgba(255, 255, 255, 0.4)",
                            mb: 2,
                          }} 
                        />
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: "rgba(255, 255, 255, 0.8)",
                            fontWeight: 600,
                            mb: 1,
                          }}
                        >
                          Adicione suas fotos
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: "rgba(255, 255, 255, 0.5)",
                            fontSize: "0.875rem",
                          }}
                        >
                          Clique para selecionar ou arraste aqui
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: "rgba(255, 255, 255, 0.4)",
                            fontSize: "0.75rem",
                            mt: 1,
                            display: "block",
                          }}
                        >
                          Máximo 5 imagens • 5MB por imagem • 20MB total
                        </Typography>
                      </Box>
                    </label>
                  ) : (
                    <Box sx={{ mt: 2 }}>
                      {/* Carrossel de imagens melhorado */}
                      <Box
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                        sx={{
                          position: "relative",
                          width: "100%",
                          borderRadius: "16px",
                          overflow: "hidden",
                          backgroundColor: "rgba(0, 0, 0, 0.2)",
                          touchAction: "pan-y",
                          userSelect: "none",
                          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                        }}
                      >
                        {/* Imagem atual */}
                        <Fade in key={currentImageIndex} timeout={300}>
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
                        </Fade>

                        {/* Botão de remover melhorado */}
                        <IconButton
                          onClick={() => handleRemoveImage(currentImageIndex)}
                          disabled={loading}
                          sx={{
                            position: "absolute",
                            top: 16,
                            right: 16,
                            backgroundColor: "rgba(0, 0, 0, 0.4)",
                            backdropFilter: "blur(10px)",
                            color: "#fff",
                            width: 40,
                            height: 40,
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              backgroundColor: "rgba(220, 38, 38, 0.8)",
                              transform: "scale(1.1)",
                            },
                            zIndex: 2,
                          }}
                        >
                          <Close sx={{ fontSize: 20 }} />
                        </IconButton>

                        {/* Botões de navegação melhorados */}
                        {imagePreviews.length > 1 && (
                          <>
                            <IconButton
                              onClick={handlePreviousImage}
                              disabled={loading}
                              sx={{
                                position: "absolute",
                                left: 16,
                                top: "50%",
                                transform: "translateY(-50%)",
                                backgroundColor: "rgba(0, 0, 0, 0.4)",
                                backdropFilter: "blur(10px)",
                                color: "#fff",
                                width: 44,
                                height: 44,
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                                  transform: "translateY(-50%) scale(1.1)",
                                },
                                zIndex: 2,
                              }}
                            >
                              <NavigateBefore sx={{ fontSize: 24 }} />
                            </IconButton>
                            <IconButton
                              onClick={handleNextImage}
                              disabled={loading}
                              sx={{
                                position: "absolute",
                                right: 16,
                                top: "50%",
                                transform: "translateY(-50%)",
                                backgroundColor: "rgba(0, 0, 0, 0.4)",
                                backdropFilter: "blur(10px)",
                                color: "#fff",
                                width: 44,
                                height: 44,
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                                  transform: "translateY(-50%) scale(1.1)",
                                },
                                zIndex: 2,
                              }}
                            >
                              <NavigateNext sx={{ fontSize: 24 }} />
                            </IconButton>
                          </>
                        )}

                        {/* Indicadores de página melhorados */}
                        {imagePreviews.length > 1 && (
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 16,
                              left: "50%",
                              transform: "translateX(-50%)",
                              display: "flex",
                              gap: 1,
                              zIndex: 2,
                              backgroundColor: "rgba(0, 0, 0, 0.4)",
                              backdropFilter: "blur(10px)",
                              padding: "6px 12px",
                              borderRadius: "20px",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                            }}
                          >
                            {imagePreviews.map((_, index) => (
                              <Box
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                sx={{
                                  width: index === currentImageIndex ? 24 : 8,
                                  height: 8,
                                  borderRadius: "4px",
                                  backgroundColor:
                                    index === currentImageIndex
                                      ? "#ffcc01"
                                      : "rgba(255, 255, 255, 0.4)",
                                  cursor: "pointer",
                                  transition: "all 0.3s ease",
                                  "&:hover": {
                                    backgroundColor:
                                      index === currentImageIndex
                                        ? "#ffcc01"
                                        : "rgba(255, 255, 255, 0.6)",
                                  },
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>

                      {/* Botão para adicionar mais fotos */}
                      {totalImagesCount < 5 && (
                        <label htmlFor="image-upload" style={{ display: "block", marginTop: 16 }}>
                          <Button
                            component="span"
                            disabled={loading}
                            variant="outlined"
                            startIcon={<AddPhotoAlternate />}
                            fullWidth
                            sx={{
                              color: "rgba(255,255,255,0.9)",
                              borderColor: "rgba(255,255,255,0.3)",
                              textTransform: "none",
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              padding: "10px 20px",
                              borderRadius: "12px",
                              transition: "all 0.3s ease",
                              backgroundColor: "rgba(255,255,255,0.05)",
                              backdropFilter: "blur(10px)",
                              "&:hover": {
                                backgroundColor: "rgba(255,255,255,0.1)",
                                borderColor: "rgba(255, 204, 1, 0.5)",
                                color: "#ffcc01",
                                transform: "translateY(-2px)",
                              },
                            }}
                          >
                            Adicionar mais fotos ({totalImagesCount}/5)
                          </Button>
                        </label>
                      )}
                    </Box>
                  )}
                </Box>

                {/* Seção de Título */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <TitleIcon sx={{ color: "#ffcc01", fontSize: 20 }} />
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        color: "#fff", 
                        fontWeight: 600,
                        fontSize: "1rem",
                      }}
                    >
                      Título
                    </Typography>
                  </Box>
                  <TextField
                    placeholder="Dê um título à sua publicação..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    fullWidth
                    disabled={loading}
                    sx={{
                      "& .MuiInputBase-root": {
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        backdropFilter: "blur(10px)",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: "rgba(255, 255, 255, 0.2)",
                        },
                        "&.Mui-focused": {
                          borderColor: "#ffcc01",
                          backgroundColor: "rgba(255, 255, 255, 0.08)",
                        },
                      },
                      "& .MuiInputBase-input": {
                        color: "#fff",
                        fontSize: "1.125rem",
                        fontWeight: 500,
                        "&::placeholder": {
                          color: "rgba(255,255,255,0.4)",
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Box>

                {/* Seção de Conteúdo */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <Description sx={{ color: "#ffcc01", fontSize: 20 }} />
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        color: "#fff", 
                        fontWeight: 600,
                        fontSize: "1rem",
                      }}
                    >
                      Legenda
                    </Typography>
                  </Box>
                  <TextField
                    placeholder="Conte sua história, compartilhe seus momentos..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    fullWidth
                    multiline
                    minRows={5}
                    maxRows={12}
                    disabled={loading}
                    sx={{
                      "& .MuiInputBase-root": {
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        backdropFilter: "blur(10px)",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: "rgba(255, 255, 255, 0.2)",
                        },
                        "&.Mui-focused": {
                          borderColor: "#ffcc01",
                          backgroundColor: "rgba(255, 255, 255, 0.08)",
                        },
                      },
                      "& .MuiInputBase-input": {
                        color: "#fff",
                        fontSize: "1rem",
                        lineHeight: 1.6,
                        "&::placeholder": {
                          color: "rgba(255,255,255,0.4)",
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Box>

                {/* Actions melhoradas */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    mt: 5,
                    pt: 4,
                    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
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
                      padding: "10px 24px",
                      borderRadius: "12px",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
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
                      fontWeight: 700,
                      borderRadius: "12px",
                      textTransform: "none",
                      fontSize: "0.875rem",
                      padding: "12px 32px",
                      boxShadow: "0 4px 16px rgba(255, 204, 1, 0.3)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        backgroundColor: "#e6b800",
                        transform: "translateY(-2px)",
                        boxShadow: "0 6px 20px rgba(255, 204, 1, 0.4)",
                      },
                      "&:active": {
                        transform: "translateY(0)",
                      },
                      "&:disabled": {
                        backgroundColor: "rgba(255, 201, 31, 0.3)",
                        color: "rgba(0, 0, 0, 0.3)",
                        boxShadow: "none",
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={20} sx={{ color: "#000" }} />
                    ) : (
                      "Salvar Alterações"
                    )}
                  </Button>
                </Box>
              </Box>
            </form>
          </Paper>
        </Fade>
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
