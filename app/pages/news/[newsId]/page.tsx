"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Divider,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SendIcon from "@mui/icons-material/Send";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ReplyIcon from "@mui/icons-material/Reply";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import CloseIcon from "@mui/icons-material/Close";
import {
  getNewsDetails,
  NewsDetailsResponse,
  deleteNews,
  deactivatePost,
} from "@/app/services/news/newsService";
import {
  likeNews,
  unlikeNews,
  getLikesCount,
  didILike,
} from "@/app/services/likes/likeService";
import {
  createComment,
  listComments,
  createReply,
  listReplies,
  likeComment,
  unlikeComment,
  deleteComment,
  CommentResponse,
} from "@/app/services/comments/commentService";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import DeleteNewsModal from "@/app/components/admin/news/DeleteNewsModal";
import DeleteCommentModal from "@/app/components/comments/DeleteCommentModal";
import { getMe } from "@/app/services/auth/authService";
import { getProfile, ProfileResponse } from "@/app/services/profile/profileService";

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const newsId = Number(params.newsId);
  const { isAuthenticated, isAdmin, isAdminMaster, isSubadmin } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsDetailsResponse | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState<ProfileResponse | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [replies, setReplies] = useState<Record<number, CommentResponse[]>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [submittingReply, setSubmittingReply] = useState<Record<number, boolean>>({});
  const [likingComment, setLikingComment] = useState<Record<number, boolean>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<number, boolean>>({});
  const [deleteCommentModalOpen, setDeleteCommentModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{ id: number; content: string } | null>(null);
  const [deletingComment, setDeletingComment] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const loadNewsDetails = async () => {
    if (!newsId) return;

    setLoading(true);
    try {
      // getNewsDetails já retorna as informações de likes do backend
      const data = await getNewsDetails(newsId);
      setNews(data);

      // Busca dados do usuário logado
      if (isAuthenticated) {
        try {
          const profile = await getProfile();
          setCurrentUser(profile);
          if (isAdmin) {
            const me = await getMe();
            setIsAuthor(data.author?.id === me.id);
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário", error);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes da news", error);
      showToast("Erro ao carregar post", "error");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (newsId) {
      loadNewsDetails();
    }
  }, [newsId, isAuthenticated, isAdmin]);

  const handleLike = async () => {
    if (!isAuthenticated || !news || liking) return;

    setLiking(true);
    try {
      const wasLiked = news.likes.user_liked;

      if (wasLiked) {
        // Remove o like usando o endpoint específico
        await unlikeNews(newsId);
        
        // Atualiza o estado otimisticamente
        setNews({
          ...news,
          likes: {
            count: Math.max(0, news.likes.count - 1),
            user_liked: false,
          },
        });
        
        // Sincroniza com o servidor usando os endpoints de likes
        try {
          const [likeStatus, likesCount] = await Promise.all([
            didILike(newsId),
            getLikesCount(newsId),
          ]);
          setNews((prev) =>
            prev
              ? {
                  ...prev,
                  likes: {
                    count: likesCount.count,
                    user_liked: likeStatus.liked,
                  },
                }
              : null
          );
        } catch (syncError) {
          console.error("Erro ao sincronizar likes", syncError);
        }
      } else {
        // Adiciona o like usando o endpoint específico
        await likeNews(newsId);
        
        // Atualiza o estado otimisticamente
        setNews({
          ...news,
          likes: {
            count: news.likes.count + 1,
            user_liked: true,
          },
        });
        
        // Sincroniza com o servidor usando os endpoints de likes
        try {
          const [likeStatus, likesCount] = await Promise.all([
            didILike(newsId),
            getLikesCount(newsId),
          ]);
          setNews((prev) =>
            prev
              ? {
                  ...prev,
                  likes: {
                    count: likesCount.count,
                    user_liked: likeStatus.liked,
                  },
                }
              : null
          );
        } catch (syncError) {
          console.error("Erro ao sincronizar likes", syncError);
        }
      }
    } catch (error) {
      console.error("Erro ao curtir/descurtir", error);
      showToast("Erro ao processar curtida", "error");
      
      // Recarrega os dados em caso de erro usando os endpoints de likes
      try {
        const [likeStatus, likesCount] = await Promise.all([
          didILike(newsId),
          getLikesCount(newsId),
        ]);
        setNews((prev) =>
          prev
            ? {
                ...prev,
                likes: {
                  count: likesCount.count,
                  user_liked: likeStatus.liked,
                },
              }
            : null
        );
      } catch (reloadError) {
        console.error("Erro ao recarregar likes", reloadError);
      }
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async () => {
    if (!isAuthenticated || !commentText.trim() || submittingComment || !news) return;

    setSubmittingComment(true);
    try {
      // Cria o comentário usando o endpoint específico
      const newComment = await createComment(newsId, commentText.trim());
      
      // Atualiza os comentários localmente (otimisticamente)
      setNews({
        ...news,
        comments: [newComment, ...news.comments],
        comments_count: news.comments_count + 1,
      });

      setCommentText("");
      showToast("Comentário adicionado!", "success");
      
      // Recarrega os comentários do servidor para garantir sincronização
      try {
        const comments = await listComments(newsId);
        setNews((prev) =>
          prev
            ? {
                ...prev,
                comments: comments,
                comments_count: comments.length,
              }
            : null
        );
      } catch (syncError) {
        console.error("Erro ao sincronizar comentários", syncError);
        // Se falhar na sincronização, mantém o comentário adicionado otimisticamente
      }
    } catch (error: any) {
      console.error("Erro ao comentar", error);
      const message =
        error.response?.data?.detail || "Erro ao adicionar comentário";
      showToast(message, "error");
      
      // Em caso de erro, recarrega os comentários do servidor
      try {
        const comments = await listComments(newsId);
        setNews((prev) =>
          prev
            ? {
                ...prev,
                comments: comments,
                comments_count: comments.length,
              }
            : null
        );
      } catch (reloadError) {
        console.error("Erro ao recarregar comentários", reloadError);
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!news || !news.event_id) return;

    setDeleting(true);
    try {
      await deleteNews(news.event_id, news.id);
      showToast("Notícia excluída com sucesso!", "success");
      setDeleteModalOpen(false);
      router.back();
    } catch (error: any) {
      const message =
        error.response?.data?.detail || "Erro ao excluir notícia";
      showToast(message, "error");
      throw error; // Re-throw para o modal tratar
    } finally {
      setDeleting(false);
    }
  };


  const handleLikeComment = async (commentId: number, parentCommentId?: number | null) => {
    if (!isAuthenticated || !news || likingComment[commentId]) return;

    setLikingComment((prev) => ({ ...prev, [commentId]: true }));
    try {
      let comment: any = null;
      let wasLiked = false;

      // Verifica se é uma resposta (tem parent_comment_id) ou um comentário principal
      if (parentCommentId) {
        // É uma resposta
        const replyList = replies[parentCommentId] || [];
        comment = replyList.find((r) => r.id === commentId);
        wasLiked = comment?.likes.user_liked || false;

        if (wasLiked) {
          await unlikeComment(commentId);
          setReplies((prev) => ({
            ...prev,
            [parentCommentId]: (prev[parentCommentId] || []).map((r) =>
              r.id === commentId
                ? {
                    ...r,
                    likes: {
                      count: r.likes.count - 1,
                      user_liked: false,
                    },
                  }
                : r
            ),
          }));
        } else {
          await likeComment(commentId);
          setReplies((prev) => ({
            ...prev,
            [parentCommentId]: (prev[parentCommentId] || []).map((r) =>
              r.id === commentId
                ? {
                    ...r,
                    likes: {
                      count: r.likes.count + 1,
                      user_liked: true,
                    },
                  }
                : r
            ),
          }));
        }
      } else {
        // É um comentário principal
        comment = news.comments.find((c) => c.id === commentId);
        if (!comment) return;
        wasLiked = comment.likes.user_liked;

        if (wasLiked) {
          await unlikeComment(commentId);
          setNews({
            ...news,
            comments: news.comments.map((c) =>
              c.id === commentId
                ? {
                    ...c,
                    likes: {
                      count: c.likes.count - 1,
                      user_liked: false,
                    },
                  }
                : c
            ),
          });
        } else {
          await likeComment(commentId);
          setNews({
            ...news,
            comments: news.comments.map((c) =>
              c.id === commentId
                ? {
                    ...c,
                    likes: {
                      count: c.likes.count + 1,
                      user_liked: true,
                    },
                  }
                : c
            ),
          });
        }
      }
    } catch (error: any) {
      console.error("Erro ao curtir comentário", error);
      showToast("Erro ao processar curtida", "error");
    } finally {
      setLikingComment((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const toggleReplies = async (commentId: number) => {
    const isExpanded = expandedComments.has(commentId);
    
    if (isExpanded) {
      // Fechar respostas
      setExpandedComments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    } else {
      // Abrir e carregar respostas
      setExpandedComments((prev) => new Set(prev).add(commentId));
      
      if (!replies[commentId]) {
        setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));
        try {
          const fetchedReplies = await listReplies(newsId, commentId);
          setReplies((prev) => ({ ...prev, [commentId]: fetchedReplies }));
        } catch (error) {
          console.error("Erro ao carregar respostas", error);
          showToast("Erro ao carregar respostas", "error");
        } finally {
          setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
        }
      }
    }
  };

  const handleReply = async (commentId: number) => {
    if (!isAuthenticated || !replyTexts[commentId]?.trim() || submittingReply[commentId] || !news) return;

    setSubmittingReply((prev) => ({ ...prev, [commentId]: true }));
    try {
      const newReply = await createReply(newsId, commentId, replyTexts[commentId].trim());
      
      // Atualiza as respostas localmente
      setReplies((prev) => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), newReply],
      }));

      // Atualiza o contador de respostas no comentário principal
      setNews({
        ...news,
        comments: news.comments.map((c) =>
          c.id === commentId
            ? { ...c, replies_count: c.replies_count + 1 }
            : c
        ),
      });

      setReplyTexts((prev) => {
        const newTexts = { ...prev };
        delete newTexts[commentId];
        return newTexts;
      });
      setReplyingTo(null);
      showToast("Resposta adicionada!", "success");
      
      // Recarrega as respostas do servidor
      try {
        const fetchedReplies = await listReplies(newsId, commentId);
        setReplies((prev) => ({ ...prev, [commentId]: fetchedReplies }));
      } catch (syncError) {
        console.error("Erro ao sincronizar respostas", syncError);
      }
    } catch (error: any) {
      console.error("Erro ao responder", error);
      const message =
        error.response?.data?.detail || "Erro ao adicionar resposta";
      showToast(message, "error");
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleDeleteCommentClick = (commentId: number, commentContent: string) => {
    setCommentToDelete({ id: commentId, content: commentContent });
    setDeleteCommentModalOpen(true);
  };

  const handleDeleteCommentConfirm = async () => {
    if (!commentToDelete || !news) return;

    setDeletingComment(true);
    try {
      await deleteComment(commentToDelete.id);
      showToast("Comentário excluído com sucesso!", "success");
      setDeleteCommentModalOpen(false);
      setCommentToDelete(null);
      
      // Recarrega os comentários
      await loadNewsDetails();
    } catch (error: any) {
      console.error("Erro ao excluir comentário", error);
      const message = error.response?.data?.detail || "Erro ao excluir comentário";
      showToast(message, "error");
      throw error; // Re-throw para o modal tratar
    } finally {
      setDeletingComment(false);
    }
  };

  const handleDeactivate = async () => {
    if (!newsId) return;

    setDeactivating(true);
    try {
      await deactivatePost(newsId);
      showToast("Post desativado com sucesso!", "success");
      setDeactivateModalOpen(false);
      router.push("/pages/user/home");
    } catch (error: any) {
      console.error("Erro ao desativar post", error);
      const message = error.response?.data?.detail || "Erro ao desativar post";
      showToast(message, "error");
    } finally {
      setDeactivating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "agora";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d`;

    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
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

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#ffc91f" }} />
      </Box>
    );
  }

  if (!news) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#000",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography>Notícia não encontrada.</Typography>
        <IconButton onClick={() =>  router.push("/pages/user/home")} sx={{ color: "#fff" }}>
          <ArrowBackIosIcon />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        height: "100vh",
        overflowY: "auto",
        backgroundImage: "url(/background/dashboard.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Botão X para desativar (apenas admin master e subadmin) - Posicionado absolutamente */}
      {(isAdminMaster || isSubadmin) && (
        <IconButton
          onClick={() => setDeactivateModalOpen(true)}
          size="small"
          disabled={deactivating}
          sx={{
            color: "#ff3040",
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 1000,
           
            backdropFilter: "blur(10px)",
            width: 40,
            height: 40,
            "&:hover": {
              backgroundColor: "rgba(255, 48, 64, 0.3)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      )}

      {/* Header com botão de voltar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          position: "sticky",
          top: 0,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(10px)",
          zIndex: 10,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton
            onClick={() =>  router.push("/pages/user/home")}
            size="small"
            sx={{ color: "#fff" }}
          >
            <ArrowBackIosIcon />
          </IconButton>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              src={news.author?.profile_photo}
              sx={{ width: 40, height: 40 }}
            >
              {news.author?.name?.[0]?.toUpperCase() || "?"}
            </Avatar>
            <Box>
              <Typography fontWeight={600} fontSize={14}>
                {news.author?.name || "Autor desconhecido"}
              </Typography>
              <Typography fontSize={12} color="rgba(255,255,255,0.6)">
                {formatDate(news.created_at)}
              </Typography>
            </Box>
          </Box>
        </Box>
        {/* Botões de editar/excluir apenas para admin que é autor */}
        {isAuthor && isAdmin && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              onClick={() => router.push(`/pages/news/edit?newsId=${newsId}`)}
              size="small"
              disabled={deleting}
              sx={{ color: "#ffc91f" }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => setDeleteModalOpen(true)}
              size="small"
              disabled={deleting}
              sx={{ color: "#ff3040" }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Conteúdo */}
      <Box sx={{ pb: 2, flex: 1, overflowY: "auto" }}>
        {/* Carrossel de imagens */}
        {sortedImages.length > 0 && (
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
                  <NavigateBeforeIcon sx={{ fontSize: 20 }} />
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
                  <NavigateNextIcon sx={{ fontSize: 20 }} />
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
        )}

        {/* Conteúdo */}
        <Box sx={{ p: 2 }}>
          {/* Título */}
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ color: "#fff", mb: 1 }}
          >
            {news.title}
          </Typography>

          {/* Texto */}
          <Typography
            variant="body1"
            sx={{ color: "rgba(255,255,255,0.9)", mb: 2, whiteSpace: "pre-wrap" }}
          >
            {news.content}
          </Typography>

          {/* Ações (Curtir, Comentar) */}
          <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
            <IconButton
              onClick={handleLike}
              disabled={!isAuthenticated || liking}
              sx={{ color: news.likes.user_liked ? "#ff3040" : "#fff" }}
            >
              {news.likes.user_liked ? (
                <FavoriteIcon />
              ) : (
                <FavoriteBorderIcon />
              )}
            </IconButton>
            <IconButton sx={{ color: "#fff" }}>
              <ChatBubbleOutlineIcon />
            </IconButton>
          </Box>

          {/* Contagem de curtidas */}
          {news.likes.count > 0 && (
            <Typography
              fontWeight={600}
              fontSize={14}
              sx={{ color: "#fff", mb: 1.5 }}
            >
              {news.likes.count} {news.likes.count === 1 ? "curtida" : "curtidas"}
            </Typography>
          )}

          {/* Comentários */}
          <Box mt={2}>
            <Typography
              fontWeight={600}
              fontSize={14}
              sx={{ color: "#fff", mb: 1.5 }}
            >
              {news.comments_count > 0
                ? `${news.comments_count} ${
                    news.comments_count === 1 ? "comentário" : "comentários"
                  }`
                : "Nenhum comentário"}
            </Typography>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 1.5 }} />

            {/* Lista de comentários */}
            <Box
              sx={{
                maxHeight: "400px",
                overflowY: "auto",
                mb: 2,
                "&::-webkit-scrollbar": {
                  width: "6px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "3px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "3px",
                },
              }}
            >
              {news.comments.map((comment) => (
                <Box key={comment.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Avatar
                      src={comment.user.profile_photo}
                      sx={{ width: 32, height: 32 }}
                    >
                      {comment.user.name[0]?.toUpperCase()}
                    </Avatar>
                    <Box flex={1}>
                      <Paper
                        elevation={0}
                        sx={{
                          backgroundColor: "rgba(255,255,255,0.05)",
                          p: 1.5,
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          fontWeight={600}
                          fontSize={13}
                          sx={{ color: "#fff", mb: 0.5 }}
                        >
                          {comment.user.name}
                        </Typography>
                        <Typography
                          fontSize={14}
                          sx={{ color: "rgba(255,255,255,0.9)" }}
                        >
                          {comment.content}
                        </Typography>
                      </Paper>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, ml: 1 }}>
                        <Typography
                          fontSize={11}
                          sx={{
                            color: "rgba(255,255,255,0.5)",
                          }}
                        >
                          {formatDate(comment.created_at)}
                        </Typography>
                        {/* Botões de ação */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleLikeComment(comment.id)}
                            disabled={!isAuthenticated || likingComment[comment.id]}
                            sx={{
                              color: comment.likes.user_liked ? "#ff3040" : "rgba(255,255,255,0.5)",
                              padding: "4px",
                            }}
                          >
                            <FavoriteIcon fontSize="small" />
                          </IconButton>
                          {comment.likes.count > 0 && (
                            <Typography
                              fontSize={11}
                              sx={{ color: "rgba(255,255,255,0.5)", mr: 1 }}
                            >
                              {comment.likes.count}
                            </Typography>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => setReplyingTo(comment.id)}
                            disabled={!isAuthenticated}
                            sx={{
                              color: "rgba(255,255,255,0.5)",
                              padding: "4px",
                            }}
                          >
                            <ReplyIcon fontSize="small" />
                          </IconButton>
                          {comment.replies_count > 0 && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => toggleReplies(comment.id)}
                                sx={{
                                  color: "rgba(255,255,255,0.5)",
                                  padding: "4px",
                                }}
                              >
                                {expandedComments.has(comment.id) ? (
                                  <ExpandLessIcon fontSize="small" />
                                ) : (
                                  <ExpandMoreIcon fontSize="small" />
                                )}
                              </IconButton>
                              <Typography
                                fontSize={11}
                                sx={{ color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
                                onClick={() => toggleReplies(comment.id)}
                              >
                                {comment.replies_count} {comment.replies_count === 1 ? "resposta" : "respostas"}
                              </Typography>
                            </>
                          )}
                          {/* Botão de excluir - apenas para admin ou dono do comentário */}
                          {isAuthenticated && (isAdmin || comment.user.id === currentUser?.id) && (
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteCommentClick(comment.id, comment.content)}
                              sx={{
                                color: "rgba(255,255,255,0.5)",
                                padding: "4px",
                                ml: 0.5,
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                      
                      {/* Campo de resposta */}
                      {replyingTo === comment.id && isAuthenticated && (
                        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end", mt: 1, ml: 4 }}>
                          <Avatar
                            src={currentUser?.profile_photo || undefined}
                            sx={{ width: 28, height: 28 }}
                          >
                            {currentUser?.name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || "U"}
                          </Avatar>
                          <TextField
                            fullWidth
                            placeholder="Escreva uma resposta..."
                            value={replyTexts[comment.id] || ""}
                            onChange={(e) =>
                              setReplyTexts((prev) => ({
                                ...prev,
                                [comment.id]: e.target.value,
                              }))
                            }
                            onKeyPress={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleReply(comment.id);
                              }
                            }}
                            multiline
                            maxRows={3}
                            disabled={submittingReply[comment.id]}
                            size="small"
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                backgroundColor: "rgba(255,255,255,0.05)",
                                color: "#fff",
                                borderRadius: 2,
                                "& fieldset": {
                                  borderColor: "rgba(255,255,255,0.1)",
                                },
                                "&:hover fieldset": {
                                  borderColor: "rgba(255,255,255,0.2)",
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: "#ffc91f",
                                },
                              },
                              "& .MuiInputBase-input": {
                                color: "#fff",
                                fontSize: "13px",
                                "&::placeholder": {
                                  color: "rgba(255,255,255,0.5)",
                                  opacity: 1,
                                },
                              },
                            }}
                          />
                          <IconButton
                            onClick={() => handleReply(comment.id)}
                            disabled={!replyTexts[comment.id]?.trim() || submittingReply[comment.id]}
                            sx={{
                              color: replyTexts[comment.id]?.trim()
                                ? "#ffc91f"
                                : "rgba(255,255,255,0.3)",
                            }}
                          >
                            {submittingReply[comment.id] ? (
                              <CircularProgress size={16} sx={{ color: "#ffc91f" }} />
                            ) : (
                              <SendIcon fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyTexts((prev) => {
                                const newTexts = { ...prev };
                                delete newTexts[comment.id];
                                return newTexts;
                              });
                            }}
                            sx={{ color: "rgba(255,255,255,0.5)" }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}

                      {/* Lista de respostas */}
                      {expandedComments.has(comment.id) && (
                        <Box sx={{ mt: 1, ml: 4, borderLeft: "2px solid rgba(255,255,255,0.1)", pl: 2 }}>
                          {loadingReplies[comment.id] ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                              <CircularProgress size={20} sx={{ color: "#ffc91f" }} />
                            </Box>
                          ) : (
                            <>
                              {(replies[comment.id] || []).map((reply) => (
                                <Box key={reply.id} sx={{ mb: 1.5 }}>
                                  <Box sx={{ display: "flex", gap: 1 }}>
                                    <Avatar
                                      src={reply.user.profile_photo}
                                      sx={{ width: 24, height: 24 }}
                                    >
                                      {reply.user.name[0]?.toUpperCase()}
                                    </Avatar>
                                    <Box flex={1}>
                                      <Paper
                                        elevation={0}
                                        sx={{
                                          backgroundColor: "rgba(255,255,255,0.03)",
                                          p: 1,
                                          borderRadius: 1.5,
                                        }}
                                      >
                                        <Typography
                                          fontWeight={600}
                                          fontSize={12}
                                          sx={{ color: "#fff", mb: 0.3 }}
                                        >
                                          {reply.user.name}
                                        </Typography>
                                        <Typography
                                          fontSize={13}
                                          sx={{ color: "rgba(255,255,255,0.9)" }}
                                        >
                                          {reply.content}
                                        </Typography>
                                      </Paper>
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.3, ml: 0.5 }}>
                                        <Typography
                                          fontSize={10}
                                          sx={{ color: "rgba(255,255,255,0.4)" }}
                                        >
                                          {formatDate(reply.created_at)}
                                        </Typography>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleLikeComment(reply.id, comment.id)}
                                          disabled={!isAuthenticated || likingComment[reply.id]}
                                          sx={{
                                            color: reply.likes.user_liked ? "#ff3040" : "rgba(255,255,255,0.4)",
                                            padding: "2px",
                                          }}
                                        >
                                          <FavoriteIcon fontSize="small" />
                                        </IconButton>
                                        {reply.likes.count > 0 && (
                                          <Typography
                                            fontSize={10}
                                            sx={{ color: "rgba(255,255,255,0.4)" }}
                                          >
                                            {reply.likes.count}
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                  </Box>
                                </Box>
                              ))}
                              {(!replies[comment.id] || replies[comment.id].length === 0) && (
                                <Typography
                                  fontSize={12}
                                  sx={{ color: "rgba(255,255,255,0.5)", py: 1 }}
                                >
                                  Nenhuma resposta ainda
                                </Typography>
                              )}
                            </>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Campo de comentário */}
            {isAuthenticated && (
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                <Avatar
                  src={currentUser?.profile_photo || undefined}
                  sx={{ width: 36, height: 36 }}
                >
                  {currentUser?.name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || "U"}
                </Avatar>
                <TextField
                  fullWidth
                  placeholder="Adicione um comentário..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleComment();
                    }
                  }}
                  multiline
                  maxRows={4}
                  disabled={submittingComment}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "rgba(255,255,255,0.05)",
                      color: "#fff",
                      borderRadius: 2,
                      "& fieldset": {
                        borderColor: "rgba(255,255,255,0.1)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(255,255,255,0.2)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#ffc91f",
                      },
                    },
                    "& .MuiInputBase-input": {
                      color: "#fff",
                      "&::placeholder": {
                        color: "rgba(255,255,255,0.5)",
                        opacity: 1,
                      },
                    },
                  }}
                />
                <IconButton
                  onClick={handleComment}
                  disabled={!commentText.trim() || submittingComment}
                  sx={{
                    color: commentText.trim()
                      ? "#ffc91f"
                      : "rgba(255,255,255,0.3)",
                  }}
                >
                  {submittingComment ? (
                    <CircularProgress size={20} sx={{ color: "#ffc91f" }} />
                  ) : (
                    <SendIcon />
                  )}
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Modal de Exclusão */}
      {news && (
        <DeleteNewsModal
          open={deleteModalOpen}
          newsTitle={news.title}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}

      {/* Modal de Exclusão de Comentário */}
      {commentToDelete && (
        <DeleteCommentModal
          open={deleteCommentModalOpen}
          commentContent={commentToDelete.content}
          onClose={() => {
            setDeleteCommentModalOpen(false);
            setCommentToDelete(null);
          }}
          onConfirm={handleDeleteCommentConfirm}
          loading={deletingComment}
        />
      )}

      {/* Modal de Desativação de Post */}
      <Dialog
        open={deactivateModalOpen}
        onClose={() => !deactivating && setDeactivateModalOpen(false)}
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
            <CloseIcon sx={{ fontSize: 28, color: "#ff3040" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Desativar Post
            </Typography>
          </Box>
        </DialogTitle>
        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", mx: 3 }} />
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.9)", fontSize: "1rem" }}>
            Tem certeza que deseja <strong style={{ color: "#ff3040" }}>desativar</strong> este post?
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
              O post será desativado e não será mais visível no feed.
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setDeactivateModalOpen(false)}
            disabled={deactivating}
            sx={{
              color: "rgba(255,255,255,0.7)",
              textTransform: "none",
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeactivate}
            disabled={deactivating}
            variant="contained"
            startIcon={deactivating ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <CloseIcon />}
            sx={{
              backgroundColor: "#ff3040",
              color: "white",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#cc0000",
              },
            }}
          >
            {deactivating ? "Desativando..." : "Desativar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

