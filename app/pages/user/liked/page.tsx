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
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

const LIMIT = 5;
const STORAGE_KEY = "selectedEventId";

export default function LikedPostsPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();
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
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventResponse | null>(null);
  const [mounted, setMounted] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(true);

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
    // Se não encontrou evento salvo, usa o primeiro disponível (preferencialmente ativo)
    const activeEvent = eventsList.find((event) => event.is_active);
    const selectedEvent = activeEvent || (eventsList.length > 0 ? eventsList[0] : null);
    if (selectedEvent) {
      setCurrentEvent(selectedEvent);
      localStorage.setItem(STORAGE_KEY, selectedEvent.id.toString());
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

  // Função para verificar e atualizar eventos (similar à página home)
  const checkAndUpdateEvents = useCallback(async () => {
    try {
      const data = await getEvents();
      setEvents(data);
      
      if (currentEvent?.id) {
        const updatedEvent = data.find((event) => event.id === currentEvent.id);
        
        // Se o evento não foi encontrado (foi deletado), troca para um ativo
        if (!updatedEvent) {
          const activeEvent = data.find((event) => event.is_active);
          if (activeEvent) {
            setCurrentEvent(activeEvent);
            localStorage.setItem(STORAGE_KEY, activeEvent.id.toString());
            reloadPostsForEvent(activeEvent.id);
          } else if (data.length > 0) {
            // Se não há eventos ativos, usa o primeiro disponível
            setCurrentEvent(data[0]);
            localStorage.setItem(STORAGE_KEY, data[0].id.toString());
            reloadPostsForEvent(data[0].id);
          } else {
            // Não há eventos disponíveis
            setCurrentEvent(null);
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        // Se o evento atual foi desativado e o usuário NÃƒO é admin/subadmin, troca para um ativo
        else if (!updatedEvent.is_active && !isAdmin) {
          const activeEvent = data.find((event) => event.is_active);
          if (activeEvent) {
            setCurrentEvent(activeEvent);
            localStorage.setItem(STORAGE_KEY, activeEvent.id.toString());
            reloadPostsForEvent(activeEvent.id);
          }
        } else if (updatedEvent && updatedEvent.id !== currentEvent.id) {
          // Atualiza o evento atual com os dados mais recentes
          setCurrentEvent(updatedEvent);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar eventos:", error);
    }
  }, [currentEvent, reloadPostsForEvent, isAdmin]);

  // Função para lidar com seleção de evento
  const handleSelectEvent = useCallback((event: EventResponse) => {
    localStorage.setItem(STORAGE_KEY, event.id.toString());
    setCurrentEvent(event);
    reloadPostsForEvent(event.id);
  }, [reloadPostsForEvent]);

  // Marca como montado no cliente para evitar problemas de hidratação
  useEffect(() => {
    setMounted(true);
  }, []);

  // Controla animações quando a página carrega
  useEffect(() => {
    setShouldAnimate(true);
    const timer = setTimeout(() => {
      setShouldAnimate(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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

    // Só carrega posts se não houver cache (o cache será verificado no outro useEffect)
    // Não carrega aqui, será carregado no useEffect do cache se não houver cache
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
      // Verifica se o evento atual ainda existe (não foi deletado)
      if (currentEvent?.id) {
        const eventStillExists = events.find((event) => event.id === currentEvent.id);
        if (!eventStillExists) {
          checkAndUpdateEvents();
        }
      }
    }, 1000); // Verifica a cada 1 segundo (mais eficiente)

    // Verifica quando a página/aba fica visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndUpdateEvents();
      }
    };

    // Verifica quando a janela ganha foco
    const handleFocus = () => {
      checkAndUpdateEvents();
    };

    // Adiciona listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(checkInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, events, currentEvent?.id, handleSelectEvent, reloadPostsForEvent, checkAndUpdateEvents]);

  // ===== CACHE: Carregar dados ao montar =====
  useEffect(() => {
    if (!isAuthenticated || initialized) return;

    // Tenta carregar do cache
    const cached = getCache(cacheKey);
    
    if (cached && cached.data.length > 0) {
      // Mostra skeleton primeiro, depois carrega dados do cache
      setIsRevalidating(true);
      
      // Aguarda um pouco antes de mostrar dados do cache para exibir skeleton
      setTimeout(() => {
        setPosts(cached.data);
        setOffset(cached.data.length);
        setHasMore(cached.data.length >= LIMIT);
        setInitialLoading(false);
        setIsRevalidating(false);
        
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
      }, 400); // Delay para mostrar skeleton
      
      // Revalida cache em background
      (async () => {
        try {
          const limit = Math.max(cached.data.length, LIMIT * 3);
          const freshData = await getLikedPosts(currentEvent?.id, limit, 0);
          
          const cachedIds = cached.data.map((p: NewsDetailsResponse) => p.id).sort().join(',');
          const freshIds = freshData.map((p: NewsDetailsResponse) => p.id).sort().join(',');
          
          if (cachedIds !== freshIds || cached.data.length !== freshData.length) {
            setPosts([...freshData]);
            setOffset(freshData.length);
            setHasMore(freshData.length >= limit);
            
            const hasNewItems = freshData.length > cached.data.length;
            const hasRemovedItems = freshData.length < cached.data.length;
            
            if (hasNewItems) {
              setCache(cacheKey, freshData, 0);
              setTimeout(() => {
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }, 500);
            } else if (hasRemovedItems) {
              const targetPosition = cached.scrollPosition;
              const safeScrollPosition = Math.min(targetPosition, document.documentElement.scrollHeight - window.innerHeight);
              setCache(cacheKey, freshData, safeScrollPosition);
            } else {
              setCache(cacheKey, freshData, cached.scrollPosition);
            }
          } else {
            const contentChanged = JSON.stringify(cached.data) !== JSON.stringify(freshData);
            if (contentChanged) {
              setPosts([...freshData]);
            }
            setCache(cacheKey, freshData, cached.scrollPosition);
          }
        } catch (err) {
          console.error('Erro ao revalidar cache:', err);
        } finally {
          setInitialized(true);
        }
      })();
    } else {
      // Não há cache, carrega posts normalmente
      setInitialized(true);
      setPosts([]);
      setOffset(0);
      setHasMore(true);
      loadPosts(true);
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

  // Evita problemas de hidratação: só renderiza conteúdo específico do cliente após montagem
  if (!mounted) {
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

  // Se não há evento ainda, mostra skeleton dentro do layout
  if (!currentEvent) {
    return (
      <>
        <Box
          style={{
            minHeight: "100vh",
            ...dashboardBackgroundSx,
            paddingBottom: "88px",
          }}
        >
          <Box
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
                maxWidth: { xs: "100%", sm: "100%", md: "600px", lg: "700px" },
              }}
            >
              <Box
                sx={{
                  paddingX: 3,
                  paddingY: 3,
                }}
              >
                <Skeleton
                  variant="text"
                  width={200}
                  height={40}
                  sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 2 }}
                />
              </Box>
              <Box paddingX={2} paddingBottom={2}>
                <Box display="flex" flexDirection="column" gap={2} paddingX={2}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <PostItemSkeleton key={i} />
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Box
        style={{
          minHeight: "100vh",
          ...dashboardBackgroundSx,
          paddingBottom: "88px",
        }}
      >
        {/* Header com nome, foto e data */}
        {currentEvent && (
          <Box className={shouldAnimate ? "slide-up-animation" : ""}>
            <HomeHeader
              event={currentEvent}
              events={events}
              currentEvent={currentEvent}
              onSelectEvent={handleSelectEvent}
            />
          </Box>
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
              className={shouldAnimate ? "slide-up-delay-1" : ""}
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
                    fontSize: { xs: "1.25rem", sm: "1.75rem" },
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
                    backgroundColor: "rgb(255, 31, 33)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    height: "32px",
                  }}
                />
              )}
            </Box>

            <Box paddingX={2} paddingBottom={2}>
              {/* LOADING INICIAL OU REVALIDAÃ‡ÃƒO */}
              {(initialLoading || isRevalidating || (loading && posts.length === 0)) && (
                <Box display="flex" flexDirection="column" gap={2} paddingX={2}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <PostItemSkeleton key={i} />
                  ))}
                </Box>
              )}

              {/* SEM POSTS */}
              {!initialLoading && !isRevalidating && !loading && posts.length === 0 && (
                <Box
                  className={shouldAnimate ? "slide-up-delay-2" : ""}
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
              {!initialLoading && !isRevalidating && posts.length > 0 && !loading && (
                <Box display="flex" flexDirection="column" gap={2} className={shouldAnimate ? "slide-up-delay-2" : ""}>
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
                            ðŸ“·
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
                                â€¢
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


