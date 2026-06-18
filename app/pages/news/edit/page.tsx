"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Fade,
} from "@mui/material";
import { updateNews, getNewsDetails, NewsDetailsResponse } from "@/app/services/news/newsService";
import { useToast } from "@/app/context/ToastContext";
import { useAuth } from "@/app/context/AuthContext";
import { getEvents, EventResponse } from "@/app/services/events/eventAppService";
import NewsHeader from "@/app/components/news/NewsHeader";
import EventBadge from "@/app/components/news/EventBadge";
import ImageUploadSection from "@/app/components/news/ImageUploadSection";
import NewsFormFields from "@/app/components/news/NewsFormFields";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

function EditNewsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canCreatePost, isPatrocinador } = useAuth();
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
  const [eventId, setEventId] = useState<number | null>(null);
  const [newsId, setNewsId] = useState<number | null>(null);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [news, setNews] = useState<NewsDetailsResponse | null>(null);

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

      // Verifica se é patrocinador editando um post aprovado
      // Se for, redireciona para a lista de pending
      if (isPatrocinador && news?.status === "approved") {
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
          ...dashboardBackgroundSx,
          minHeight: "100vh",
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
        ...dashboardBackgroundSx,
        minHeight: "100vh",
        padding: { xs: 2, sm: 3, md: 4 },
        pb: { xs: 10, sm: 4 },
      }}
    >
      <Box sx={{ maxWidth: "900px", margin: "0 auto" }}>
        <NewsHeader
          title="Editar Publicação"
          subtitle="Atualize suas fotos e informações"
        />

        {eventId && selectedEvent && (
          <EventBadge eventTitle={selectedEvent.title} />
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
                <ImageUploadSection
                  images={images}
                  imagePreviews={imagePreviews}
                  onImageChange={handleImageChange}
                  onRemoveImage={handleRemoveImage}
                  loading={loading}
                  maxImages={5}
                  existingImagesCount={existingImages.length}
                />

                <NewsFormFields
                  title={title}
                  content={content}
                  onTitleChange={setTitle}
                  onContentChange={setContent}
                  loading={loading}
                />

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
                      backgroundColor: "#ffffff",
                      color: "#fff",
                      fontWeight: 700,
                      borderRadius: "12px",
                      textTransform: "none",
                      fontSize: "0.875rem",
                      padding: "12px 32px",
                      boxShadow: "0 4px 16px rgba(255, 204, 1, 0.3)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        backgroundColor: "rgb(220, 20, 22)",
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
                      <CircularProgress size={20} sx={{ color: "#fff" }} />
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
...dashboardBackgroundSx,
            minHeight: "100vh",
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

