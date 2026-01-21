"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Skeleton,
  Divider,
  Avatar,
  Chip,
} from "@mui/material";
import { getLikedPosts } from "@/app/services/likes/likeService";
import { NewsDetailsResponse } from "@/app/services/news/newsService";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { useFeedCache } from "@/app/context/FeedCacheContext";
import BottomNav from "@/app/components/layout/BottomNav";
import { CircularProgress } from "@mui/material";
import HomeHeader from "@/app/components/home/HeaderHome";
import { EventResponse, getEvents } from "@/app/services/events/eventAppService";

const LIMIT = 5;
const STORAGE_KEY = "selectedEventId";

export default function LikedPostsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  
  // ===== CACHE DO FEED (Instagram/TikTok style) =====
  const { getCache, setCache } = useFeedCache();
  const cacheKey = "liked-posts";
  const [initialized, setInitialized] = useState(false);
  // ==================================================
  
  const [posts, setPosts] = useState<NewsDetailsResponse[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventResponse | null>(null);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadPosts = async (reset = false) => {
    if (loading || !isAuthenticated) return;

    setLoading(true);

    const nextOffset = reset ? 0 : offset;
    
    // Obtém o eventId do localStorage (evento selecionado no ambiente)
    const selectedEventId = localStorage.getItem("selectedEventId");
    const eventId = selectedEventId ? parseInt(selectedEventId, 10) : undefined;

    try {
      const data = await getLikedPosts(eventId, LIMIT, nextOffset);

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
    } catch (err: any) {
      console.error("Erro ao carregar posts curtidos", err);
      showToast(
        err.response?.data?.detail || "Erro ao carregar posts curtidos",
        "error"
      );
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Função para atualizar o evento atual baseado no localStorage
  const updateCurrentEventFromStorage = (eventsList: EventResponse[]) => {
    const savedEventId = localStorage.getItem(STORAGE_KEY);
    if (savedEventId) {
      const savedId = parseInt(savedEventId, 10);
      const savedEvent = eventsList.find((event) => event.id === savedId);
      if (savedEvent) {
        setCurrentEvent(savedEvent);
        return;
      }
    }
    // Se não encontrou evento salvo, usa o primeiro disponível
    if (eventsList.length > 0) {
      setCurrentEvent(eventsList[0]);
      localStorage.setItem(STORAGE_KEY, eventsList[0].id.toString());
    }
  };

  // Função para recarregar posts quando o evento muda
  const reloadPostsForEvent = useCallback(async (eventId: number) => {
    if (!isAuthenticated) return;
    setLoading(true);
    setPosts([]);
    setOffset(0);
    setHasMore(true);
    try {
      const data = await getLikedPosts(eventId, LIMIT, 0);
      setPosts(data);
      setOffset(data.length);
      setHasMore(data.length >= LIMIT);
    } catch (err: any) {
      console.error("Erro ao carregar posts curtidos", err);
      showToast(
        err.response?.data?.detail || "Erro ao carregar posts curtidos",
        "error"
      );
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [isAuthenticated, showToast]);

  // Função para lidar com seleção de evento
  const handleSelectEvent = useCallback((event: EventResponse) => {
    localStorage.setItem(STORAGE_KEY, event.id.toString());
    setCurrentEvent(event);
    reloadPostsForEvent(event.id);
  }, [reloadPostsForEvent]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/pages/auth/login");
      return;
    }

    // Carrega eventos para o header
    getEvents()
      .then((data) => {
        setEvents(data);
        updateCurrentEventFromStorage(data);
      })
      .catch((error) => {
        console.error("Erro ao carregar eventos", error);
      });

    setPosts([]);
    setOffset(0);
    setHasMore(true);
    loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Escuta mudanças no localStorage (quando o evento é alterado em outra aba/componente)
  useEffect(() => {
    if (!isAuthenticated || events.length === 0) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newEventId = parseInt(e.newValue, 10);
        const newEvent = events.find((event) => event.id === newEventId);
        if (newEvent && newEvent.id !== currentEvent?.id) {
          handleSelectEvent(newEvent);
        }
      }
    };

    // Escuta mudanças no localStorage de outras abas/janelas
    window.addEventListener("storage", handleStorageChange);

    // Também verifica mudanças na mesma aba (polling mais eficiente)
    const checkInterval = setInterval(() => {
      const savedEventId = localStorage.getItem(STORAGE_KEY);
      if (savedEventId) {
        const savedId = parseInt(savedEventId, 10);
        if (currentEvent?.id !== savedId) {
          const savedEvent = events.find((event) => event.id === savedId);
          if (savedEvent) {
            setCurrentEvent(savedEvent);
            reloadPostsForEvent(savedId);
          }
        }
      }
    }, 1000); // Verifica a cada 1 segundo (mais eficiente)

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(checkInterval);
    };
  }, [isAuthenticated, events, currentEvent?.id, handleSelectEvent, reloadPostsForEvent]);

  // ===== CACHE: Carregar dados ao montar =====
  useEffect(() => {
    if (!isAuthenticated || initialized) return;

    // Tenta carregar do cache
    const cached = getCache(cacheKey);
    
    if (cached && cached.data.length > 0) {
      // ✅ Dados encontrados no cache!
      setPosts(cached.data);
      setOffset(cached.data.length);
      setHasMore(cached.data.length >= LIMIT);
      setInitialized(true);
      setInitialLoading(false);
      
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
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ===== CACHE: Salvar scroll position ULTRA ROBUSTO =====
  const lastScrollPositionRef = useRef(0);
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
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
  }, [posts, cacheKey, setCache, isAuthenticated]);

  // infinite scroll
  useEffect(() => {
    if (!loaderRef.current || !hasMore || !isAuthenticated) return;

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
  }, [hasMore, offset, isAuthenticated]);

  const handlePostClick = (post: NewsDetailsResponse) => {
    const eventIdParam = post.event_id ? `?eventId=${post.event_id}` : '';
    router.push(`/pages/news/${post.id}${eventIdParam}`);
  };

  // Função para formatar data relativa ou extensa (mesma do NewsFeed)
  const formatDate = (dateString: string): string => {
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
  };

  if (initialLoading) {
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

  if (!currentEvent) {
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

  return (
    <>
      <Box
        style={{
          minHeight: "100vh",
          paddingBottom: "72px",
          backgroundColor: "#f4f7fc",
          backgroundImage: "url(/background/dashboard.png)",
        }}
      >
        {/* Header com nome, foto e data */}
        {currentEvent && (
          <HomeHeader
            event={currentEvent}
            events={events}
            currentEvent={currentEvent}
            onSelectEvent={handleSelectEvent}
          />
        )}

        {/* Container centralizado para desktop */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          {/* Container interno com largura máxima */}
          <Box
            sx={{
              width: "100%",
              maxWidth: { xs: "100%", sm: "100%", md: "600px", lg: "700px" },
            }}
          >
            {/* Título da página */}
            <Box
              sx={{
                paddingX: 3,
                paddingY: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: "#fff",
                    mb: 0.5,
                    fontSize: { xs: "1.5rem", sm: "1.75rem" },
                  }}
                >
                  Posts curtidos por mim
                </Typography>
                {posts.length > 0 && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "0.875rem",
                    }}
                  >
                    {posts.length} {posts.length === 1 ? "post curtido" : "posts curtidos"}
                  </Typography>
                )}
              </Box>
              {posts.length > 0 && (
                <Chip
                  label={posts.length}
                  sx={{
                    backgroundColor: "#ffc91f",
                    color: "#000",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    height: "32px",
                  }}
                />
              )}
            </Box>

            <Box paddingX={2} paddingBottom={2}>
              {/* LOADING INICIAL */}
              {loading && posts.length === 0 && (
                <Box display="flex" flexDirection="column" gap={2} paddingX={2}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <PostItemSkeleton key={i} />
                  ))}
                </Box>
              )}

              {/* SEM POSTS */}
              {!loading && posts.length === 0 && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "50vh",
                    gap: 3,
                    padding: 4,
                  }}
                >
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      backgroundColor: "rgba(255,201,31,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "4rem",
                      mb: 2,
                    }}
                  >
                    ❤️
                  </Box>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{ 
                      color: "#fff", 
                      textAlign: "center",
                      mb: 1,
                    }}
                  >
                    Você ainda não curtiu nenhum post
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ 
                      color: "rgba(255,255,255,0.6)", 
                      textAlign: "center",
                      maxWidth: "400px",
                    }}
                  >
                    Os posts que você curtir aparecerão aqui. Comece a explorar e curta os posts que mais gostar!
                  </Typography>
                </Box>
              )}

              {/* LISTA DE POSTS */}
              {posts.length > 0 && (
                <Box display="flex" flexDirection="column" gap={2}>
                  {posts.map((item, index) => (
                    <Card
                      key={item.id}
                      onClick={() => handlePostClick(item)}
                      sx={{
                        display: "flex",
                        gap: 2,
                        backgroundColor: "rgba(255,255,255,0.08)",
                        backdropFilter: "blur(10px)",
                        borderRadius: 3,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        color: "#fff",
                        padding: 2,
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        border: "1px solid rgba(255,255,255,0.1)",
                        "&:hover": {
                          transform: "translateY(-4px)",
                         
                        
                        },
                      }}
                    >
                      {/* Foto com borda arredondada */}
                      {item.images && item.images.length > 0 ? (
                        <CardMedia
                          component="img"
                          image={item.images[0].image_url}
                          alt={item.title}
                          sx={{
                            width: { xs: 100, sm: 120 },
                            height: { xs: 100, sm: 120 },
                            minWidth: { xs: 100, sm: 120 },
                            borderRadius: 2,
                            objectFit: "cover",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: { xs: 100, sm: 120 },
                            height: { xs: 100, sm: 120 },
                            minWidth: { xs: 100, sm: 120 },
                            borderRadius: 2,
                            backgroundColor: "rgba(255,255,255,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                          }}
                        >
                          <Typography
                            variant="h4"
                            sx={{ color: "rgba(255,255,255,0.3)" }}
                          >
                            📷
                          </Typography>
                        </Box>
                      )}

                      {/* Conteúdo */}
                      <CardContent 
                        sx={{ 
                          padding: 0, 
                          flex: 1, 
                          display: "flex", 
                          flexDirection: "column", 
                          justifyContent: "space-between",
                          gap: 1,
                        }}
                      >
                        {/* Título */}
                        <Typography
                          fontWeight={700}
                          fontSize={{ xs: 16, sm: 18 }}
                          sx={{
                            color: "#fff",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            lineHeight: 1.4,
                          }}
                        >
                          {item.title}
                        </Typography>

                        {/* Autor e tempo */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            mt: 1,
                          }}
                        >
                          {item.author && (
                            <>
                              <Avatar
                                src={item.author.profile_photo}
                                sx={{
                                  width: 24,
                                  height: 24,
                                  border: "2px solid rgba(255,255,255,0.2)",
                                }}
                              >
                                {item.author.name?.[0]?.toUpperCase() || "?"}
                              </Avatar>
                              <Typography
                                fontSize={13}
                                fontWeight={500}
                                sx={{ color: "rgba(255,255,255,0.8)" }}
                              >
                                {item.author.name || "Autor desconhecido"}
                              </Typography>
                              <Typography
                                fontSize={12}
                                sx={{ color: "rgba(255,255,255,0.5)" }}
                              >
                                •
                              </Typography>
                            </>
                          )}
                          <Typography
                            fontSize={13}
                            sx={{ color: "rgba(255,255,255,0.7)" }}
                          >
                            {formatDate(item.created_at)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Skeleton ao carregar mais */}
                  {loading &&
                    Array.from({ length: 2 }).map((_, i) => (
                      <PostItemSkeleton key={`skeleton-${i}`} />
                    ))}
                </Box>
              )}

              {hasMore && <div ref={loaderRef} />}
            </Box>
          </Box>
        </Box>
      </Box>
      <BottomNav />
    </>
  );
}

/* ---------------- SKELETONS ---------------- */

function PostItemSkeleton() {
  return (
    <Card
      sx={{
        display: "flex",
        gap: 2,
        backgroundColor: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        borderRadius: 3,
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        padding: 2,
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <Skeleton
        variant="rectangular"
        sx={{ 
          width: { xs: 100, sm: 120 },
          height: { xs: 100, sm: 120 },
          bgcolor: "rgba(255,255,255,0.1)", 
          borderRadius: 2,
          flexShrink: 0,
        }}
      />

      <CardContent 
        sx={{ 
          padding: 0, 
          flex: 1, 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Skeleton 
          height={24} 
          width="90%" 
          sx={{ 
            bgcolor: "rgba(255,255,255,0.1)", 
            borderRadius: 1,
            mb: 1,
          }} 
        />  
        <Skeleton 
          height={20} 
          width="70%" 
          sx={{ 
            bgcolor: "rgba(255,255,255,0.1)", 
            borderRadius: 1,
          }} 
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1 }}>
          <Skeleton
            variant="circular"
            width={24}
            height={24}
            sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
          />
          <Skeleton height={16} width="30%" sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1 }} />
          <Skeleton height={16} width="20%" sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1 }} />
        </Box>
      </CardContent>
    </Card>
  );
}

