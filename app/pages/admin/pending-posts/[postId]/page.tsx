"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Divider,
  CircularProgress,
  IconButton,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import {
  ArrowBackIos,
  CheckCircle,
  Cancel,
  NavigateBefore,
  NavigateNext,
} from "@mui/icons-material";
import {
  getNewsDetails,
  NewsDetailsResponse,
  approvePost,
  rejectPost,
} from "@/app/services/news/newsService";
import { useToast } from "@/app/context/ToastContext";
import { useAuth } from "@/app/context/AuthContext";

export default function PendingPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = Number(params.postId);
  const { isAdminMaster, isSubadmin } = useAuth();
  const eventIdParam = searchParams.get("eventId");
  const eventId = eventIdParam ? parseInt(eventIdParam, 10) : undefined;
  const [news, setNews] = useState<NewsDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const { showToast } = useToast();
  const hasRedirected = useRef(false);
  const isLoadingRef = useRef(false);

  const canApprovePosts = isAdminMaster || isSubadmin;

  // Reset flags quando postId mudar
  useEffect(() => {
    hasRedirected.current = false;
    isLoadingRef.current = false;
    setNews(null);
    setLoading(true);
  }, [postId]);

  // useEffect principal para carregar os dados
  useEffect(() => {
    // Verifica permissões primeiro
    if (!canApprovePosts) {
      router.push("/pages/user/home");
      return;
    }

    // Guard clauses: evita execução desnecessária
    // Não verifica 'news' aqui porque ele é resetado quando postId muda
    if (!postId || isLoadingRef.current || hasRedirected.current) {
      return;
    }

    // Função interna para evitar dependências problemáticas
    const loadNews = async () => {
      // Verificação dupla para garantir que não está carregando
      if (isLoadingRef.current || hasRedirected.current) return;

      isLoadingRef.current = true;
      setLoading(true);
      
      try {
        let data: NewsDetailsResponse;
        let finalEventId = eventId;
        
        // Se não tiver eventId na URL, tenta carregar sem ele primeiro
        // O endpoint retornará o event_id na resposta, então podemos usar depois
        if (!finalEventId) {
          // Tenta carregar sem eventId (endpoint unificado permite para posts aprovados)
          // Mas para posts pendentes, precisamos do eventId
          try {
            data = await getNewsDetails(postId);
            // Se conseguir carregar, pega o event_id da resposta
            if (data.event_id) {
              finalEventId = data.event_id;
              // Atualiza a URL com o eventId para manter consistência
              const newUrl = `/pages/admin/pending-posts/${postId}?eventId=${data.event_id}`;
              window.history.replaceState({}, '', newUrl);
            }
          } catch (error: any) {
            // Se falhar, pode ser porque é um post pendente que precisa do eventId
            showToast("Evento não encontrado. Por favor, acesse através da lista de posts pendentes.", "error");
            const redirectUrl = "/pages/admin/pending-posts";
            hasRedirected.current = true;
            router.push(redirectUrl);
            return;
          }
        } else {
          // Se tiver eventId, usa ele diretamente
          data = await getNewsDetails(postId, finalEventId);
        }
        
        setNews(data);
      } catch (error: any) {
        // Evita múltiplos redirecionamentos
        if (hasRedirected.current) return;
        
        hasRedirected.current = true;
        showToast(
          error.response?.data?.detail || "Erro ao carregar post",
          "error"
        );
        const redirectUrl = eventId 
          ? `/pages/admin/pending-posts?eventId=${eventId}`
          : "/pages/admin/pending-posts";
        router.push(redirectUrl);
      } finally {
        isLoadingRef.current = false;
        setLoading(false);
      }
    };

    loadNews();
    // Dependências mínimas: só postId e eventId (valores primitivos)
    // canApprovePosts é derivado de isAdminMaster/isSubadmin, então é estável
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, eventId]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approvePost(postId);
      showToast("Post aprovado com sucesso!", "success");
      setConfirmApproveOpen(false);
      const redirectUrl = eventId 
        ? `/pages/admin/pending-posts?eventId=${eventId}`
        : "/pages/admin/pending-posts";
      router.push(redirectUrl);
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Erro ao aprovar post",
        "error"
      );
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await rejectPost(postId);
      showToast("Post recusado com sucesso!", "success");
      setConfirmRejectOpen(false);
      const redirectUrl = eventId 
        ? `/pages/admin/pending-posts?eventId=${eventId}`
        : "/pages/admin/pending-posts";
      router.push(redirectUrl);
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Erro ao recusar post",
        "error"
      );
    } finally {
      setRejecting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const images = news?.images || [];
  const sortedImages = [...images].sort((a, b) => a.image_order - b.image_order);

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && sortedImages.length > 1) {
      handleNextImage();
    }
    if (isRightSwipe && sortedImages.length > 1) {
      handlePreviousImage();
    }
  };

  useEffect(() => {
    if (news && images.length > 0) {
      setCurrentImageIndex(0);
    }
  }, [news, images.length]);

  return (
    <>
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
              onClick={() => {
                router.push("/pages/user/home");
              }}
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
              Post Pendente de Aprovação
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress sx={{ color: "#ffcc01" }} />
            </Box>
          ) : news ? (
            <Paper
              elevation={0}
              sx={{
                backgroundColor: "transparent",
                overflow: "hidden",
              }}
            >
              {/* Carrossel de imagens */}
              {sortedImages.length > 0 && (
                <Box sx={{ mb: 3 }}>
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
                      src={sortedImages[currentImageIndex]?.image_url}
                      alt={news.title}
                      sx={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />

                    {/* Botões de navegação (apenas se tiver mais de 1 imagem) */}
                    {sortedImages.length > 1 && (
                      <>
                        <IconButton
                          onClick={handlePreviousImage}
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
                    {sortedImages.length > 1 && (
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
                        {sortedImages.map((_, index) => (
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

              <Box>
                {/* Título */}
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    fontWeight: 600,
                    mb: 2,
                    fontSize: "1.25rem",
                  }}
                >
                  {news.title}
                </Typography>

                {/* Autor */}
                {news.author && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                    <Avatar
                      src={news.author.profile_photo}
                      sx={{ width: 40, height: 40 }}
                    >
                      {news.author.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ color: "white", fontWeight: 500 }}>
                        {news.author.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>
                        {formatDate(news.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Conteúdo */}
                <Typography
                  variant="body1"
                  sx={{
                    color: "rgba(255,255,255,0.9)",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    mb: 4,
                    fontSize: "0.9375rem",
                  }}
                >
                  {news.content}
                </Typography>

                {/* Botões de ação */}
                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 4 }}>
                  <Button
                    onClick={() => router.push("/pages/user/home")}
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
                    onClick={() => setConfirmRejectOpen(true)}
                    variant="contained"
                    disabled={rejecting}
                    sx={{
                      backgroundColor: "#ff4444",
                      color: "white",
                      textTransform: "none",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      px: 3,
                      borderRadius: "14px",
                      "&:hover": {
                        backgroundColor: "#cc0000",
                      },
                      "&:disabled": {
                        backgroundColor: "rgba(255, 68, 68, 0.3)",
                        color: "rgba(255, 255, 255, 0.5)",
                      },
                    }}
                  >
                    {rejecting ? (
                      <CircularProgress size={16} sx={{ color: "#fff" }} />
                    ) : (
                      "Recusar"
                    )}
                  </Button>
                  <Button
                    onClick={() => setConfirmApproveOpen(true)}
                    variant="contained"
                    disabled={approving}
                    sx={{
                      backgroundColor: "#ffcc01",
                      color: "#000",
                      textTransform: "none",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      px: 3,
                      borderRadius: "14px",
                      "&:hover": {
                        backgroundColor: "#e6b800",
                      },
                      "&:disabled": {
                        backgroundColor: "rgba(255, 201, 31, 0.3)",
                        color: "rgba(0, 0, 0, 0.3)",
                      },
                    }}
                  >
                    {approving ? (
                      <CircularProgress size={16} sx={{ color: "#000" }} />
                    ) : (
                      "Aprovar"
                    )}
                  </Button>
                </Box>
              </Box>
            </Paper>
          ) : null}
        </Box>
      </Box>

      {/* Modal de confirmação - Aprovar */}
      <Dialog
        open={confirmApproveOpen}
        onClose={() => setConfirmApproveOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: "rgba(26, 26, 26, 0.95)",
            backdropFilter: "blur(20px)",
            color: "white",
            borderRadius: 3,
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CheckCircle sx={{ fontSize: 28, color: "#4caf50" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Aprovar Post
            </Typography>
          </Box>
        </DialogTitle>
        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", mx: 3 }} />
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.9)", fontSize: "1rem" }}>
            Tem certeza que deseja <strong style={{ color: "#4caf50" }}>aprovar</strong> este post?
            <br />
            <br />
            <Box
              component="span"
              sx={{
                display: "block",
                p: 2,
                mt: 2,
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                borderRadius: 2,
                border: "1px solid rgba(76, 175, 80, 0.2)",
              }}
            >
              O post será publicado e ficará visível no feed.
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setConfirmApproveOpen(false)}
            disabled={approving}
            sx={{
              color: "rgba(255,255,255,0.7)",
              textTransform: "none",
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleApprove}
            disabled={approving}
            variant="contained"
            startIcon={approving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <CheckCircle />}
            sx={{
              backgroundColor: "#4caf50",
              color: "white",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#45a049",
              },
            }}
          >
            {approving ? "Aprovando..." : "Aprovar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmação - Recusar */}
      <Dialog
        open={confirmRejectOpen}
        onClose={() => setConfirmRejectOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: "rgba(26, 26, 26, 0.95)",
            backdropFilter: "blur(20px)",
            color: "white",
            borderRadius: 3,
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Cancel sx={{ fontSize: 28, color: "#ff4444" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Recusar Post
            </Typography>
          </Box>
        </DialogTitle>
        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", mx: 3 }} />
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.9)", fontSize: "1rem" }}>
            Tem certeza que deseja <strong style={{ color: "#ff4444" }}>recusar</strong> este post?
            <br />
            <br />
            <Box
              component="span"
              sx={{
                display: "block",
                p: 2,
                mt: 2,
                backgroundColor: "rgba(255, 68, 68, 0.1)",
                borderRadius: 2,
                border: "1px solid rgba(255, 68, 68, 0.2)",
              }}
            >
              O post será recusado e não será publicado no feed.
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setConfirmRejectOpen(false)}
            disabled={rejecting}
            sx={{
              color: "rgba(255,255,255,0.7)",
              textTransform: "none",
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReject}
            disabled={rejecting}
            variant="contained"
            startIcon={rejecting ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <Cancel />}
            sx={{
              backgroundColor: "#ff4444",
              color: "white",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#cc0000",
              },
            }}
          >
            {rejecting ? "Recusando..." : "Recusar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

