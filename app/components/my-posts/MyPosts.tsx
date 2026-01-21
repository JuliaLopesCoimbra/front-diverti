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
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useFeedCache } from "@/app/context/FeedCacheContext";
import { getMyPosts } from "@/app/services/myPosts/myPostsService";
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
  statusFilter?: "approved" | "pending" | "rejected";
}

export default function MyPosts({ hideTitle = false, currentEvent, statusFilter = "approved" }: MyPostsProps) {
  const router = useRouter();
  
  // ===== CACHE DO FEED (Instagram/TikTok style) =====
  const { getCache, setCache } = useFeedCache();
  const cacheKey = `my-posts-event-${currentEvent?.id || 'all'}`;
  const [initialized, setInitialized] = useState(false);
  // ==================================================
  
  const [posts, setPosts] = useState<NewsResponse[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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

  // ===== CACHE: Carregar dados ao montar/trocar evento =====
  useEffect(() => {
    if (initialized) {
      // Se já inicializou, é uma troca de evento - limpa tudo
      setPosts([]);
      setOffset(0);
      setHasMore(true);
      setInitialized(false);
      return;
    }

    // Tenta carregar do cache
    const cached = getCache(cacheKey);
    
    if (cached && cached.data.length > 0) {
      // ✅ Dados encontrados no cache!
      setPosts(cached.data);
      setOffset(cached.data.length);
      setHasMore(cached.data.length >= LIMIT);
      setInitialized(true);
      
      // Restaura posição do scroll
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
    } else {
      // ❌ Sem cache - carrega da API
      setPosts([]);
      setOffset(0);
      setHasMore(true);
      loadPosts(true);
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEvent?.id]);

  // ===== CACHE: Salvar scroll position ULTRA ROBUSTO =====
  const lastScrollPositionRef = useRef(0);
  
  useEffect(() => {
    let throttleTimeout: NodeJS.Timeout | null = null;
    const THROTTLE_MS = 400; // Otimizado para performance
    
    const updateScrollPosition = () => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      lastScrollPositionRef.current = currentScroll;
      
      if (throttleTimeout) clearTimeout(throttleTimeout);
      
      throttleTimeout = setTimeout(() => {
        if (posts.length > 0) {
          setCache(cacheKey, posts, currentScroll);
        }
      }, THROTTLE_MS);
    };
    
    const handleScroll = () => {
      updateScrollPosition();
    };
    
    const handlePageHide = () => {
      if (posts.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, posts, finalScroll);
      }
    };
    
    const handleBeforeUnload = () => {
      if (posts.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, posts, finalScroll);
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden && posts.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, posts, finalScroll);
      }
    };
    
    const handleBlur = () => {
      if (posts.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, posts, finalScroll);
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
      
      if (posts.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, posts, finalScroll);
      }
    };
  }, [posts, cacheKey, setCache]);

  // infinite scroll
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;

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
  }, [hasMore, offset]);

  const handlePostClick = (post: NewsResponse) => {
    // Posts rejeitados não podem ser abertos
    if (post.status === "rejected") {
      return;
    }
    const eventIdParam = post.event_id ? `?eventId=${post.event_id}` : '';
    router.push(`/pages/news/${post.id}${eventIdParam}`);
  };

  // Filtrar posts baseado no statusFilter
  const filteredPosts = posts.filter(post => post.status === statusFilter);

  if (loading && posts.length === 0) {
    return (
      <Box padding={2}>
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2, marginBottom: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!loading && filteredPosts.length === 0) {
    const statusLabels: Record<string, string> = {
      approved: "aprovados",
      pending: "pendentes",
      rejected: "rejeitados"
    };
    
    return (
      <Box padding={2} textAlign="center">
        <Typography variant="body1" fontWeight={500} sx={{ color: "#fff", marginBottom: 1, fontSize: "0.9375rem" }}>
          Nenhum post {statusLabels[statusFilter]} encontrado
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
          Você ainda não tem posts {statusLabels[statusFilter]}.
        </Typography>
      </Box>
    );
  }

  return (
    <Box padding={2}>
      {!hideTitle && (
        <Typography
          variant="h6"
          fontWeight={500}
          sx={{ color: "#fff", marginBottom: 2, fontSize: "1rem" }}
        >
          Meus Posts
        </Typography>
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
                cursor: post.status === "rejected" ? "default" : "pointer",
                transition: "opacity 0.2s",
                opacity: post.status === "rejected" ? 0.6 : 1,
                "&:hover": {
                  opacity: post.status === "rejected" ? 0.6 : 0.8,
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
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.6)", marginTop: 0.5, fontSize: "0.875rem" }}
                >
                  {formatDate(post.created_at)}
                </Typography>
              </CardContent>
            </Card>

            {index !== filteredPosts.length - 1 && (
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

      {hasMore && (
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
  );
}

