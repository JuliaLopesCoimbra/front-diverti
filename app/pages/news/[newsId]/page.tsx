"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  IconButton,
  Button,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import NewsDetailHeader from "@/app/components/news/NewsDetailHeader";
import NewsImageCarousel from "@/app/components/news/NewsImageCarousel";
import NewsActions from "@/app/components/news/NewsActions";
import NewsContent from "@/app/components/news/NewsContent";
import NewsLikeSection from "@/app/components/news/NewsLikeSection";
import CommentSection from "@/app/components/news/CommentSection";
import NewsDetailSkeleton from "@/app/components/news/NewsDetailSkeleton";
import DeactivatePostModal from "@/app/components/news/DeactivatePostModal";
import ReactivatePostModal from "@/app/components/news/ReactivatePostModal";
import { useCommentScroll } from "@/app/hooks/useCommentScroll";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import {
  getNewsDetails,
  NewsDetailsResponse,
  deleteNews,
  deactivatePost,
  approvePost,
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
  const searchParams = useSearchParams();
  const newsId = Number(params.newsId);
  const eventIdParam = searchParams.get("eventId");
  const eventId = eventIdParam ? parseInt(eventIdParam, 10) : null;
  const { isAuthenticated, isAdmin, isAdminMaster, isSubadmin, isColunista, canCreatePost } = useAuth();
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
  const [repliesOffset, setRepliesOffset] = useState<Record<number, number>>({});
  const [hasMoreReplies, setHasMoreReplies] = useState<Record<number, boolean>>({});
  const [loadingMoreReplies, setLoadingMoreReplies] = useState<Record<number, boolean>>({});
  const [deleteCommentModalOpen, setDeleteCommentModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{ id: number; content: string } | null>(null);
  const [deletingComment, setDeletingComment] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [commentsOffset, setCommentsOffset] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const COMMENTS_PER_PAGE = 20; // Carrega 20 comentários por vez
  const REPLIES_PER_PAGE = 5; // Carrega 5 respostas por vez

  const loadNewsDetails = async () => {
    if (!newsId) return;

    setLoading(true);
    try {
      let data: NewsDetailsResponse;
      
      // Se tiver eventId na URL, usa ele
      if (eventId) {
        data = await getNewsDetails(newsId, eventId);
      } else {
        // Se não tiver, tenta carregar sem eventId (endpoint unificado permite para posts aprovados)
        try {
          data = await getNewsDetails(newsId);
          // Se conseguir carregar e tiver event_id na resposta, atualiza a URL preservando o commentId se existir
          if (data.event_id) {
            const urlParams = new URLSearchParams(window.location.search);
            const commentId = urlParams.get("commentId");
            // Atualiza a URL preservando o commentId se existir
            // Usa window.history.replaceState para não causar re-render desnecessário
            const newUrl = commentId 
              ? `/pages/news/${newsId}?eventId=${data.event_id}&commentId=${commentId}`
              : `/pages/news/${newsId}?eventId=${data.event_id}`;
            window.history.replaceState({}, '', newUrl);
            // Força atualização do searchParams usando router.replace sem scroll
            // Isso garante que o Next.js detecte a mudança
            if (commentId) {
              router.replace(newUrl, { scroll: false });
            } else {
              router.replace(newUrl, { scroll: false });
            }
          }
        } catch (error: any) {
          // Se falhar, pode ser um post pendente que precisa do eventId ou post deletado
          if (error.response?.status === 404) {
            showToast("Este post não está mais disponível", "error");
            // Dispara evento para remover notificações relacionadas
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('notificationRemoved', {
                detail: { newsId: newsId, type: 'post_deleted' }
              }));
            }
            router.back();
            return;
          }
          showToast("Evento não encontrado. Por favor, acesse através do evento.", "error");
          router.back();
          return;
        }
      }
      
      // Os comentários sempre vêm do backend (primeiros 20)
      const initialComments = data.comments || [];
      setNews(data);
      
      // Configura paginação baseada nos comentários recebidos
      setHasMoreComments(data.comments_count > initialComments.length);
      setCommentsOffset(initialComments.length);

      // Busca dados do usuário logado em paralelo (otimização de performance)
      if (isAuthenticated) {
        try {
          // Faz chamadas paralelas para melhor performance
          const promises: Promise<any>[] = [getProfile()];
          if (canCreatePost) {
            promises.push(getMe());
          }
          
          const results = await Promise.all(promises);
          const profile = results[0];
          setCurrentUser(profile);
          
          // Verifica se é autor (para admin ou colunista)
          if (canCreatePost && results[1]) {
            const me = results[1];
            setIsAuthor(data.author?.id === me.id);
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário", error);
        }
      }
    } catch (error: any) {
      console.error("Erro ao carregar detalhes da news", error);
      
      // Se o post não foi encontrado (404), pode ter sido deletado
      if (error.response?.status === 404) {
        showToast("Este post não está mais disponível", "error");
        // Dispara evento para remover notificações relacionadas
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('notificationRemoved', {
            detail: { newsId: newsId, type: 'post_deleted' }
          }));
        }
      } else {
        showToast("Erro ao carregar post", "error");
      }
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

  // Controla animações quando a página carrega
  useEffect(() => {
    setShouldAnimate(true);
    const timer = setTimeout(() => {
      setShouldAnimate(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [newsId]);

  // Hook para scroll automático para comentários
  // Passa searchParams como dependência para garantir que o hook seja executado quando a URL mudar
  const commentIdFromUrl = searchParams.get("commentId");
  useCommentScroll({
    news,
    loading,
    newsId,
    expandedComments,
    replies,
    setExpandedComments,
    setReplies,
    setLoadingReplies,
    setRepliesOffset,
    setHasMoreReplies,
    REPLIES_PER_PAGE,
    commentIdFromUrl, // Força reexecução quando commentId mudar na URL
  });

  const handleLike = async () => {
    if (!isAuthenticated || !news || liking) return;

    // Bloqueia curtir se o post estiver pendente
    if (news.status === "pending") {
      showToast("Este post ainda não foi aprovado.", "error");
      return;
    }

    setLiking(true);
    const wasLiked = news.likes.user_liked;
    
    try {
      if (wasLiked) {
        // Remove o like usando o endpoint específico
        await unlikeNews(newsId);
        
        // Atualiza o estado otimisticamente (não precisa sincronizar - confia na resposta do servidor)
        setNews({
          ...news,
          likes: {
            count: Math.max(0, news.likes.count - 1),
            user_liked: false,
          },
        });
      } else {
        // Adiciona o like usando o endpoint específico
        await likeNews(newsId);
        
        // Atualiza o estado otimisticamente (não precisa sincronizar - confia na resposta do servidor)
        setNews({
          ...news,
          likes: {
            count: news.likes.count + 1,
            user_liked: true,
          },
        });
      }
    } catch (error) {
      console.error("Erro ao curtir/descurtir", error);
      showToast("Erro ao processar curtida", "error");
      
      // Em caso de erro, reverte o estado otimista
      setNews({
        ...news,
        likes: {
          count: wasLiked ? news.likes.count + 1 : Math.max(0, news.likes.count - 1),
          user_liked: wasLiked,
        },
      });
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async () => {
    if (!isAuthenticated || !commentText.trim() || submittingComment || !news) return;

    // Bloqueia comentar se o post estiver pendente ou rejeitado
    if (news.status === "pending" || news.status === "rejected") {
      showToast("Este post ainda não foi aprovado.", "error");
      return;
    }

    const commentContent = commentText.trim();
    setSubmittingComment(true);
    
    try {
      // Cria o comentário usando o endpoint específico
      const newComment = await createComment(newsId, commentContent);
      
      // Atualização otimista imediata - mostra o comentário na hora
      if (newComment) {
        setNews({
          ...news,
          comments: [newComment, ...news.comments],
          comments_count: news.comments_count + 1,
        });
        setCommentsOffset((prev) => prev + 1);
      }

      setCommentText("");
      showToast("Comentário adicionado!", "success");
      
      // Recarrega os comentários em background para garantir sincronização
      // Não bloqueia a UI - o comentário já está visível
      // O cache foi invalidado no backend antes de retornar, então podemos buscar imediatamente
      (async () => {
        try {
          // Recarrega apenas os comentários (mais rápido que recarregar tudo)
          const comments = await listComments(newsId, COMMENTS_PER_PAGE, 0);
          
          // Atualiza apenas se os comentários foram carregados com sucesso
          setNews((prev) => {
            if (!prev) return prev;
            // Verifica se o novo comentário já está na lista
            const hasNewComment = comments.some(c => c.id === newComment?.id);
            return {
              ...prev,
              comments: comments,
              comments_count: comments.length,
            };
          });
          setCommentsOffset(comments.length);
          setHasMoreComments(comments.length >= COMMENTS_PER_PAGE);
        } catch (syncError) {
          console.error("Erro ao sincronizar comentários em background", syncError);
          // Não mostra erro ao usuário - o comentário já está visível
        }
      })();
      
    } catch (error: any) {
      console.error("Erro ao comentar", error);
      const message =
        error.response?.data?.detail || "Erro ao adicionar comentário";
      showToast(message, "error");
      
      // Em caso de erro, tenta recarregar os comentários
      try {
        const comments = await listComments(newsId, COMMENTS_PER_PAGE, 0);
        setNews((prev) =>
          prev
            ? {
                ...prev,
                comments: comments,
                comments_count: comments.length,
              }
            : null
        );
        setCommentsOffset(comments.length);
      } catch (reloadError) {
        console.error("Erro ao recarregar comentários", reloadError);
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const loadMoreComments = async () => {
    if (!news || loadingMoreComments || !hasMoreComments) return;

    setLoadingMoreComments(true);
    try {
      const newComments = await listComments(newsId, COMMENTS_PER_PAGE, commentsOffset);
      
      if (newComments.length > 0) {
        setNews((prev) =>
          prev
            ? {
                ...prev,
                comments: [...prev.comments, ...newComments],
              }
            : null
        );
        setCommentsOffset((prev) => prev + newComments.length);
        setHasMoreComments(newComments.length >= COMMENTS_PER_PAGE && news.comments_count > commentsOffset + newComments.length);
      } else {
        setHasMoreComments(false);
      }
    } catch (error) {
      console.error("Erro ao carregar mais comentários", error);
      showToast("Erro ao carregar mais comentários", "error");
    } finally {
      setLoadingMoreComments(false);
    }
  };

  const handleDelete = async () => {
    if (!news || !news.event_id) return;

    setDeleting(true);
    try {
      const deletedNewsId = news.id;
      await deleteNews(news.event_id, news.id);
      showToast("Notícia excluída com sucesso!", "success");
      setDeleteModalOpen(false);
      
      // Dispara evento para remover notificações relacionadas
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notificationRemoved', {
          detail: { newsId: deletedNewsId, type: 'post_deleted' }
        }));
      }
      
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
          
          // Dispara evento para remover notificação da lista
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('notificationRemoved', {
              detail: { commentId, type: 'comment_like' }
            }));
          }
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
          
          // Dispara evento para remover notificação da lista
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('notificationRemoved', {
              detail: { commentId, type: 'comment_like' }
            }));
          }
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
      
      if (!replies[commentId] || replies[commentId].length === 0) {
        setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));
        try {
          // Carrega apenas as primeiras 5 respostas
          const fetchedReplies = await listReplies(newsId, commentId, REPLIES_PER_PAGE, 0);
          setReplies((prev) => ({ ...prev, [commentId]: fetchedReplies }));
          
          // Verifica se há mais respostas
          const comment = news?.comments.find(c => c.id === commentId);
          const totalReplies = comment?.replies_count || 0;
          setRepliesOffset((prev) => ({ ...prev, [commentId]: fetchedReplies.length }));
          setHasMoreReplies((prev) => ({ ...prev, [commentId]: totalReplies > fetchedReplies.length }));
        } catch (error) {
          console.error("Erro ao carregar respostas", error);
          showToast("Erro ao carregar respostas", "error");
        } finally {
          setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
        }
      }
    }
  };

  const handleStartReply = async (commentId: number) => {
    // Define o comentário que está sendo respondido
    setReplyingTo(commentId);
    
    // Expande as respostas se não estiverem expandidas
    if (!expandedComments.has(commentId)) {
      setExpandedComments((prev) => new Set(prev).add(commentId));
      
      // Carrega as respostas se ainda não foram carregadas
      if (!replies[commentId] || replies[commentId].length === 0) {
        setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));
        try {
          const fetchedReplies = await listReplies(newsId, commentId, REPLIES_PER_PAGE, 0);
          setReplies((prev) => ({ ...prev, [commentId]: fetchedReplies }));
          
          const comment = news?.comments.find(c => c.id === commentId);
          const totalReplies = comment?.replies_count || 0;
          setRepliesOffset((prev) => ({ ...prev, [commentId]: fetchedReplies.length }));
          setHasMoreReplies((prev) => ({ ...prev, [commentId]: totalReplies > fetchedReplies.length }));
        } catch (error) {
          console.error("Erro ao carregar respostas", error);
          showToast("Erro ao carregar respostas", "error");
        } finally {
          setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
        }
      }
    }
  };

  const loadMoreReplies = async (commentId: number) => {
    if (loadingMoreReplies[commentId] || !hasMoreReplies[commentId] || !news) return;

    setLoadingMoreReplies((prev) => ({ ...prev, [commentId]: true }));
    try {
      const currentOffset = repliesOffset[commentId] || 0;
      const newReplies = await listReplies(newsId, commentId, REPLIES_PER_PAGE, currentOffset);
      
      if (newReplies.length > 0) {
        setReplies((prev) => {
          const existingReplies = prev[commentId] || [];
          const existingIds = new Set(existingReplies.map(r => r.id));
          // Filtra apenas replies que ainda não existem
          const uniqueNewReplies = newReplies.filter(r => !existingIds.has(r.id));
          return {
            ...prev,
            [commentId]: [...existingReplies, ...uniqueNewReplies],
          };
        });
        
        const newOffset = currentOffset + newReplies.length;
        setRepliesOffset((prev) => ({ ...prev, [commentId]: newOffset }));
        
        // Verifica se há mais respostas
        const comment = news.comments.find(c => c.id === commentId);
        const totalReplies = comment?.replies_count || 0;
        setHasMoreReplies((prev) => ({ ...prev, [commentId]: totalReplies > newOffset }));
      } else {
        setHasMoreReplies((prev) => ({ ...prev, [commentId]: false }));
      }
    } catch (error) {
      console.error("Erro ao carregar mais respostas", error);
      showToast("Erro ao carregar mais respostas", "error");
    } finally {
      setLoadingMoreReplies((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleReply = async (commentId: number) => {
    if (!isAuthenticated || !replyTexts[commentId]?.trim() || submittingReply[commentId] || !news) return;

    setSubmittingReply((prev) => ({ ...prev, [commentId]: true }));
    try {
      const newReply = await createReply(newsId, commentId, replyTexts[commentId].trim());
      
      // Atualiza as respostas localmente (evita duplicatas)
      setReplies((prev) => {
        const existingReplies = prev[commentId] || [];
        // Verifica se a reply já existe antes de adicionar
        const replyExists = existingReplies.some(r => r.id === newReply.id);
        if (replyExists) {
          return prev; // Não adiciona se já existe
        }
        return {
          ...prev,
          [commentId]: [...existingReplies, newReply],
        };
      });

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
      
      // Recarrega as respostas do servidor (primeiras 5)
      try {
        const fetchedReplies = await listReplies(newsId, commentId, REPLIES_PER_PAGE, 0);
        setReplies((prev) => ({ ...prev, [commentId]: fetchedReplies }));
        setRepliesOffset((prev) => ({ ...prev, [commentId]: fetchedReplies.length }));
        const comment = news.comments.find(c => c.id === commentId);
        const totalReplies = comment?.replies_count || 0;
        setHasMoreReplies((prev) => ({ ...prev, [commentId]: totalReplies > fetchedReplies.length }));
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
      
      // Salva o ID antes de limpar o estado
      const deletedCommentId = commentToDelete.id;
      
      // Verifica se é um comentário principal ou um subcomentário (reply)
      const isMainComment = news.comments.some(c => c.id === deletedCommentId);
      let parentCommentId: number | null = null;
      
      if (isMainComment) {
        // Remove o comentário principal da lista
        setNews((prevNews) => {
          if (!prevNews) return prevNews;
          return {
            ...prevNews,
            comments: prevNews.comments.filter(c => c.id !== deletedCommentId),
            comments_count: Math.max(0, prevNews.comments_count - 1),
          };
        });
        
        // Remove também das replies se estiver carregado e fecha a expansão
        setReplies((prev) => {
          const newReplies = { ...prev };
          delete newReplies[deletedCommentId];
          return newReplies;
        });
        
        // Remove da lista de comentários expandidos
        setExpandedComments((prev) => {
          const newSet = new Set(prev);
          newSet.delete(deletedCommentId);
          return newSet;
        });
      } else {
        // É um subcomentário - remove das replies
        setReplies((prev) => {
          const newReplies = { ...prev };
          // Encontra em qual comentário principal está essa reply
          Object.keys(newReplies).forEach((key) => {
            const commentId = Number(key);
            const replyExists = newReplies[commentId]?.some(r => r.id === deletedCommentId);
            if (replyExists) {
              parentCommentId = commentId;
              newReplies[commentId] = newReplies[commentId].filter(
                r => r.id !== deletedCommentId
              );
            }
          });
          return newReplies;
        });
        
        // Atualiza o contador de replies no comentário principal
        if (parentCommentId !== null) {
          setNews((prevNews) => {
            if (!prevNews) return prevNews;
            return {
              ...prevNews,
              comments: prevNews.comments.map(c =>
                c.id === parentCommentId
                  ? { ...c, replies_count: Math.max(0, c.replies_count - 1) }
                  : c
              ),
            };
          });
        }
      }
      
      setCommentToDelete(null);
      
      // Dispara evento para remover notificações relacionadas a este comentário
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notificationRemoved', {
          detail: { commentId: deletedCommentId, type: 'comment_deleted' }
        }));
      }
      
      // Recarrega os dados do servidor para garantir sincronização
      await loadNewsDetails();
      
      // Se deletamos um comentário principal que tinha replies carregadas, recarrega os replies dos outros comentários
      if (isMainComment) {
        // Recarrega replies de todos os comentários que estão expandidos
        const expandedIds = Array.from(expandedComments);
        for (const commentId of expandedIds) {
          if (commentId !== deletedCommentId) {
            try {
              const fetchedReplies = await listReplies(newsId, commentId, REPLIES_PER_PAGE, 0);
              setReplies((prev) => ({ ...prev, [commentId]: fetchedReplies }));
              const comment = news?.comments.find(c => c.id === commentId);
              const totalReplies = comment?.replies_count || 0;
              setRepliesOffset((prev) => ({ ...prev, [commentId]: fetchedReplies.length }));
              setHasMoreReplies((prev) => ({ ...prev, [commentId]: totalReplies > fetchedReplies.length }));
            } catch (error) {
              console.error(`Erro ao recarregar replies do comentário ${commentId}`, error);
            }
          }
        }
      } else if (parentCommentId !== null) {
        // Se deletamos um reply, recarrega os replies do comentário pai
        try {
          const fetchedReplies = await listReplies(newsId, parentCommentId);
          setReplies((prev) => ({ ...prev, [parentCommentId as number]: fetchedReplies }));
        } catch (error) {
          console.error(`Erro ao recarregar replies do comentário ${parentCommentId}`, error);
        }
      }
    } catch (error: any) {
      console.error("Erro ao excluir comentário", error);
      const message = error.response?.data?.detail || "Erro ao excluir comentário";
      showToast(message, "error");
      throw error; // Re-throw para o modal tratar
    } finally {
      setDeletingComment(false);
    }
  };

  const handleReactivate = async () => {
    if (!news || reactivating) return;

    setReactivating(true);
    try {
      await approvePost(newsId);
      showToast("Post reativado com sucesso!", "success");
      setReactivateModalOpen(false);
      // Recarrega os dados para atualizar o status
      await loadNewsDetails();
    } catch (error: any) {
      console.error("Erro ao reativar post", error);
      showToast(
        error?.response?.data?.detail || "Erro ao reativar post",
        "error"
      );
    } finally {
      setReactivating(false);
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



  if (loading) {
    return <NewsDetailSkeleton />;
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
        <IconButton onClick={() => router.push("/pages/user/home")} sx={{ color: "#fff" }}>
          ←
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      id="news-content-scroll-container"
      sx={{
        minHeight: "100vh",
        ...dashboardBackgroundSx,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NewsActions
        newsId={newsId}
        eventId={eventId || news?.event_id || null}
        isAuthor={isAuthor}
        isAdmin={isAdmin}
        isAdminMaster={isAdminMaster}
        isSubadmin={isSubadmin}
        isColunista={isColunista}
        canDelete={Boolean(
          (isAuthor && (isAdmin || (isColunista && news?.status !== "rejected"))) || 
          ((isAdminMaster || isSubadmin) && news && news.author && news.approved_by_id && news.approved_by_id === news.author.id) ||
          // Admin e subadmin podem excluir posts rejeitados
          ((isAdminMaster || isSubadmin) && news?.status === "rejected")
        )}
        canDeactivate={Boolean((isAdminMaster || isSubadmin) && news?.status !== "rejected")}
        onDelete={() => setDeleteModalOpen(true)}
        onDeactivate={() => setDeactivateModalOpen(true)}
        deleting={deleting}
        deactivating={deactivating}
        postStatus={news?.status}
      />

      <Box className={shouldAnimate ? "slide-up-delay-1" : ""}>
        <NewsDetailHeader
          authorName={news.author?.name}
          authorPhoto={news.author?.profile_photo}
          createdAt={news.created_at}
        />
      </Box>

      <Box sx={{ pb: 2, flex: 1, overflowY: "auto" }}>
        {news.images && news.images.length > 0 && (
          <Box 
            className={shouldAnimate ? "slide-up-delay-2" : ""}
            sx={{ 
              px: { xs: 0, sm: 2 }, 
              maxWidth: { xs: "100%", sm: "600px", md: "700px" }, 
              margin: "0 auto", 
              width: "100%" 
            }}
          >
            <NewsImageCarousel images={news.images} alt={news.title} />
          </Box>
        )}

        <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
          <NewsContent title={news.title} content={news.content} />
        </Box>

        <Box sx={{ px: 2, maxWidth: { xs: "100%", sm: "600px", md: "700px" }, margin: "0 auto", width: "100%" }}>
          <Box className={shouldAnimate ? "slide-up-delay-3" : ""}>
            <NewsLikeSection
              likesCount={news.likes.count}
              userLiked={news.likes.user_liked}
              onLike={handleLike}
              disabled={!isAuthenticated || liking || news.status === "pending" || news.status === "rejected"}
              newsId={newsId}
            />
          </Box>

          <Box className={shouldAnimate ? "slide-up-delay-3" : ""}>
            <CommentSection
            news={news}
            isAuthenticated={isAuthenticated}
            isAdminMaster={isAdminMaster}
            isSubadmin={isSubadmin}
            currentUser={currentUser}
            commentText={commentText}
            submittingComment={submittingComment}
            expandedComments={expandedComments}
            replies={replies}
            replyingTo={replyingTo}
            replyTexts={replyTexts}
            submittingReply={submittingReply}
            likingComment={likingComment}
            loadingReplies={loadingReplies}
            loadingMoreReplies={loadingMoreReplies}
            repliesOffset={repliesOffset}
            hasMoreReplies={hasMoreReplies}
            hasMoreComments={hasMoreComments}
            loadingMoreComments={loadingMoreComments}
            onCommentTextChange={setCommentText}
            onCommentSubmit={handleComment}
            onLikeComment={handleLikeComment}
            onToggleReplies={toggleReplies}
            onStartReply={handleStartReply}
            onReplyTextChange={(commentId, text) => setReplyTexts(prev => ({ ...prev, [commentId]: text }))}
            onReplySubmit={handleReply}
            onCancelReply={(commentId) => {
              setReplyingTo(null);
              setReplyTexts(prev => {
                const newTexts = { ...prev };
                delete newTexts[commentId];
                return newTexts;
              });
            }}
            onDeleteComment={handleDeleteCommentClick}
            onLoadMoreReplies={loadMoreReplies}
            onLoadMoreComments={loadMoreComments}
          />
          </Box>
        </Box>
      </Box>

      {/* Botão de reativar para posts rejeitados (apenas admin/subadmin) - no final da página */}
      {news.status === "rejected" && (isAdminMaster || isSubadmin) && (
        <Box
          sx={{
            px: 2,
            pt: 3,
            pb: 4,
            display: "flex",
            justifyContent: "center",
            maxWidth: { xs: "100%", sm: "600px", md: "700px" },
            margin: "0 auto",
            width: "100%",
          }}
        >
          <Button
            variant="contained"
            onClick={() => setReactivateModalOpen(true)}
            sx={{
              backgroundColor: "#4CAF50",
              color: "#fff",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
              px: 4,
              py: 1.5,
              minWidth: "200px",
              "&:hover": {
                backgroundColor: "#45a049",
              },
            }}
            startIcon={<CheckCircleIcon />}
          >
            Reativar Post
          </Button>
        </Box>
      )}

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

      <DeactivatePostModal
        open={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        onConfirm={handleDeactivate}
        deactivating={deactivating}
      />

      <ReactivatePostModal
        open={reactivateModalOpen}
        onClose={() => setReactivateModalOpen(false)}
        onConfirm={handleReactivate}
        reactivating={reactivating}
      />
    </Box>
  );
}

