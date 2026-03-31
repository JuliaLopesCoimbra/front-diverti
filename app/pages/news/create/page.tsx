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
import { createNews } from "@/app/services/news/newsService";
import { useToast } from "@/app/context/ToastContext";
import { useAuth } from "@/app/context/AuthContext";
import { getEvents, EventResponse } from "@/app/services/events/eventAppService";
import NewsHeader from "@/app/components/news/NewsHeader";
import EventBadge from "@/app/components/news/EventBadge";
import ImageUploadSection from "@/app/components/news/ImageUploadSection";
import NewsFormFields from "@/app/components/news/NewsFormFields";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

function CreateNewsPageContent() {
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
  const [eventId, setEventId] = useState<number | null>(null);
  const [events, setEvents] = useState<EventResponse[]>([]);

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
      
      // Validação de tamanho: máximo 5MB por imagem
      const maxSizePerImage = 5 * 1024 * 1024; // 5MB
      const invalidFiles = fileArray.filter(file => file.size > maxSizePerImage);
      
      if (invalidFiles.length > 0) {
        showToast("Algumas imagens são muito grandes. Máximo de 5MB por imagem.", "error");
        return;
      }
      
      // Limita a 5 imagens
      const filesToAdd = fileArray.slice(0, 5 - images.length);
      
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
          ...dashboardBackgroundSx,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "primary.main" }} />
      </Box>
    );
  }

  const selectedEvent = events.find((e) => e.id === eventId);

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
          title="Nova Publicação"
          subtitle="Compartilhe suas melhores fotos e momentos"
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
                    gap: 2,
                    mt: 5,
                    pt: 4,
                    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => router.back()}
                    disabled={loading}
                    sx={{
                      flex: 1,
                      borderRadius: "999px",
                      borderColor: "rgba(255,255,255,0.2)",
                      borderWidth: "2px",
                      color: "rgba(255,255,255,0.9)",
                      fontWeight: 600,
                      fontSize: { xs: "0.875rem", sm: "1.1rem" },
                      py: { xs: 1, sm: 1.5 },
                      textTransform: "none",
                      "&:hover": {
                        borderColor: "rgba(255,255,255,0.4)",
                        borderWidth: "2px",
                        backgroundColor: "rgba(255,255,255,0.05)",
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
                      flex: 1,
                      borderRadius: "999px",
                      backgroundColor: "rgb(255, 31, 33)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: { xs: "0.875rem", sm: "1.1rem" },
                      py: { xs: 1, sm: 1.5 },
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: "rgb(220, 20, 22)",
                      },
                      "&:disabled": {
                        backgroundColor: "rgba(255, 31, 33, 0.5)",
                        color: "rgba(0, 0, 0, 0.3)",
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: "#fff" }} />
                    ) : (
                      "Publicar"
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

export default function CreateNewsPage() {
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
          <CircularProgress sx={{ color: "primary.main" }} />
        </Box>
      }
    >
      <CreateNewsPageContent />
    </Suspense>
  );
}

