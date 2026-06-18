"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Skeleton,
  Divider,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { getMyPosts, getMyPendingPosts } from "@/app/services/myPosts/myPostsService";
import { NewsResponse } from "@/app/services/news/newsService";
import { EventResponse } from "@/app/services/events/eventAppService";

const LIMIT = 10;

// Função para formatar data relativa ou extensa (mesma do NewsFeed)
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // Se for menos de 24 horas, mostra relativo
  if (diffHours < 24) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) {
      return "há menos de 1 minuto";
    } else if (diffMinutes < 60) {
      return `há ${diffMinutes} ${diffMinutes === 1 ? "minuto" : "minutos"} atrás`;
    } else {
      const hours = Math.floor(diffHours);
      return `há ${hours} ${hours === 1 ? "hora" : "horas"} atrás`;
    }
  }

  // Se for mais de 24 horas, mostra data extensa
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface MyPostsProps {
  hideTitle?: boolean;
  currentEvent?: EventResponse | null;
}

type FilterStatus = "approved" | "pending" | "rejected" | "all";

export default function MyPosts({ hideTitle = false, currentEvent }: MyPostsProps) {
  const router = useRouter();
  const { isPatrocinador, isAdmin } = useAuth();
  const [posts, setPosts] = useState<NewsResponse[]>([]);
  const [pendingPosts, setPendingPosts] = useState<NewsResponse[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("approved");

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadPosts = async (reset = false) => {
    if (loading) return;

    setLoading(true);

    const nextOffset = reset ? 0 : offset;
    const eventId = currentEvent?.id;

    try {
      const data = await getMyPosts(eventId, LIMIT, nextOffset);

      setPosts((prev) => {
        const merged = reset ? data : [...prev, ...data];
        const unique = Array.from(
          new Map(merged.map((item) => [item.id, item])).values()
        );
        return unique;
      });

      setOffset(nextOffset + data.length);

      if (data.length < LIMIT) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Erro ao carregar meus posts", err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar posts pendentes quando necessário
  const loadPendingPosts = async () => {
    if (loadingPending || pendingPosts.length > 0) return;

    setLoadingPending(true);
    const eventId = currentEvent?.id;

    try {
      const data = await getMyPendingPosts(eventId, 100, 0); // Carrega todos os pendentes
      setPendingPosts(data);
    } catch (err) {
      console.error("Erro ao carregar posts pendentes", err);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    // Resetar estado quando o evento mudar
    setOffset(0);
    setHasMore(true);
    setPosts([]);
    setPendingPosts([]); // Resetar posts pendentes também
    loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEvent?.id]);

  // Carregar posts pendentes quando a tab for selecionada
  useEffect(() => {
    if (filterStatus === "pending" && isPatrocinador && pendingPosts.length === 0) {
      loadPendingPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, isPatrocinador]);

  // Filtrar posts baseado no status selecionado
  const filteredPosts = (() => {
    if (filterStatus === "pending") {
      return pendingPosts;
    }
    return posts.filter((post) => {
      if (filterStatus === "all") return true;
      return post.status === filterStatus;
    });
  })();

  // infinite scroll - apenas para posts aprovados
  useEffect(() => {
    if (!loaderRef.current || !hasMore || filterStatus !== "approved") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadPosts(false);
        }
      },
      { threshold: 1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, offset, filterStatus]);

  const handlePostClick = (post: NewsResponse) => {
    // Posts pendentes não podem ser abertos, mas rejeitados podem
    if (post.status === "pending") {
      return;
    }
    const eventIdParam = post.event_id ? `?eventId=${post.event_id}` : '';
    router.push(`/pages/news/${post.id}${eventIdParam}`);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: FilterStatus) => {
    setFilterStatus(newValue);
  };

  if (loading && posts.length === 0) {
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
          <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2, marginBottom: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: 2 }} />
        </Box>
      </Box>
    );
  }

  // Verificar se há posts (aprovados/rejeitados) ou se está carregando
  // Não mostrar mensagem vazia se ainda está carregando ou se há posts pendentes para carregar
  if (!loading && posts.length === 0 && filterStatus !== "pending") {
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
            Nenhum post encontrado
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
            Você ainda não postou nenhuma notícia.
          </Typography>
        </Box>
      </Box>
    );
  }

  // Verificar se há posts filtrados
  const hasFilteredPosts = filteredPosts.length > 0;

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
            Meus Posts
          </Typography>
        )}

        {/* Tabs de filtro */}
        <Box sx={{ marginBottom: 2, borderBottom: 1, borderColor: "rgba(255,255,255,0.1)" }}>
          <Tabs
            value={filterStatus}
            onChange={handleTabChange}
            sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: "#ffffff",
              },
              "& .MuiTab-root": {
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.875rem",
                fontWeight: 500,
                textTransform: "none",
                minHeight: 48,
                "&.Mui-selected": {
                  color: "#FFD600",
                },
                "&:hover": {
                  color: "rgba(255, 214, 0, 0.8)",
                },
              },
            }}
          >
            <Tab label={isAdmin ? "Postados" : "Aprovados"} value="approved" />
            {isPatrocinador && <Tab label="Pendentes" value="pending" />}
            <Tab label="Rejeitados" value="rejected" />
          </Tabs>
        </Box>

        {/* Conteúdo filtrado */}
        {!hasFilteredPosts && !loading && !loadingPending && (
          <Box textAlign="center" padding={4}>
            <Typography variant="body1" fontWeight={500} sx={{ color: "#fff", marginBottom: 1, fontSize: "0.9375rem" }}>
              {filterStatus === "approved" && "Nenhum post aprovado"}
              {filterStatus === "pending" && "Nenhum post pendente"}
              {filterStatus === "rejected" && "Nenhum post rejeitado"}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
              {filterStatus === "approved" && "Você ainda não tem posts aprovados."}
              {filterStatus === "pending" && "Você não tem posts aguardando aprovação."}
              {filterStatus === "rejected" && "Você não tem posts rejeitados."}
            </Typography>
          </Box>
        )}

        {/* Loading para posts pendentes */}
        {filterStatus === "pending" && loadingPending && (
          <Box textAlign="center" padding={4}>
            <CircularProgress size={24} sx={{ color: "#ffcc01" }} />
          </Box>
        )}

        <Box display="flex" flexDirection="column" gap={2}>
          {filteredPosts.map((post, index) => (
            <Box key={post.id}>
              <Card
                onClick={() => handlePostClick(post)}
                sx={{
                  display: "flex",
                  gap: 2,
                  backgroundColor: "transparent",
                  boxShadow: "none",
                  color: "#fff",
                  paddingBottom: 1,
                  cursor: post.status === "pending" ? "default" : "pointer",
                  transition: "opacity 0.2s",
                  opacity: post.status === "pending" ? 0.6 : post.status === "rejected" ? 0.7 : 1,
                  "&:hover": {
                    opacity: post.status === "pending" ? 0.6 : post.status === "rejected" ? 0.9 : 0.8,
                  },
                }}
              >
                {post.images && post.images.length > 0 && (
                  <CardMedia
                    component="img"
                    image={post.images[0].image_url}
                    alt={post.title}
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: 1,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                )}

                <CardContent sx={{ padding: 1, flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography fontWeight={500} sx={{ color: "#fff", fontSize: "0.9375rem", flex: 1 }}>
                      {post.title}
                    </Typography>
                    {post.status === "rejected" && (
                      <Chip
                        label="Rejeitado"
                        size="small"
                        sx={{
                          backgroundColor: "rgba(255, 48, 64, 0.2)",
                          color: "#ff3040",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          height: 20,
                          border: "1px solid rgba(255, 48, 64, 0.3)",
                          "& .MuiChip-label": {
                            padding: "0 8px",
                          },
                        }}
                      />
                    )}
                    {post.status === "pending" && (
                      <Chip
                        label="Pendente"
                        size="small"
                        sx={{
                          backgroundColor: "rgba(255, 193, 7, 0.2)",
                          color: "#FFC107",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          height: 20,
                          border: "1px solid rgba(255, 193, 7, 0.3)",
                          "& .MuiChip-label": {
                            padding: "0 8px",
                          },
                        }}
                      />
                    )}
                    {post.status === "approved" && (
                      <Chip
                        label="Aprovado"
                        size="small"
                        sx={{
                          backgroundColor: "rgba(76, 175, 80, 0.2)",
                          color: "#4CAF50",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          height: 20,
                          border: "1px solid rgba(76, 175, 80, 0.3)",
                          "& .MuiChip-label": {
                            padding: "0 8px",
                          },
                        }}
                      />
                    )}
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.6)", marginTop: 0.5, fontSize: "0.875rem" }}
                  >
                    {new Date(post.created_at).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Typography>
                </CardContent>
              </Card>

              {index !== posts.length - 1 && (
                <Divider
                  sx={{
                    borderColor: "rgba(255,255,255,0.15)",
                    marginTop: 2,
                  }}
                />
              )}
            </Box>
          ))}
        </Box>

        {hasMore && filterStatus === "approved" && (
          <Box
            ref={loaderRef}
            display="flex"
            justifyContent="center"
            padding={2}
          >
            {loading && <CircularProgress size={24} sx={{ color: "#ffcc01" }} />}
          </Box>
        )}
      </Box>
    </Box>
  );
}


