"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Skeleton,
  Button,
  Divider,
  Avatar,
} from "@mui/material";
import { useAuth } from "@/app/context/AuthContext";
import { useFeedCache } from "@/app/context/FeedCacheContext";
import { getEventNews, NewsResponse } from "@/app/services/news/newsService";
import { EventResponse } from "@/app/services/events/eventAppService";
import EmptyNews from "./EmptyNews";
import { useRouter } from "next/navigation";
import CTVAd from "@/app/components/ads/CTVAd";
import PendingPostsNotification from "@/app/components/admin/pending-posts/PendingPostsNotification";

interface Props {
  eventId: number;
  event?: EventResponse;
}

const LIMIT = 5;

// Função para formatar data relativa ou extensa
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

export default function NewsFeed({ eventId, event }: Props) {
  const { isAdmin, isAdminMaster, isSubadmin, canCreatePost, authVersion } = useAuth();
  const router = useRouter();
  
  // ===== CACHE DO FEED (Instagram/TikTok style) =====
  const { getCache, setCache } = useFeedCache();
  const cacheKey = `feed-event-${eventId}`;
  const [initialized, setInitialized] = useState(false);
  // ==================================================
  
  const [news, setNews] = useState<NewsResponse[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loaderRef = useRef<HTMLDivElement | null>(null);
  
  const canApprovePosts = isAdminMaster || isSubadmin;
  // Evento está ativo apenas se existir e is_active for explicitamente true
  const isEventActive = event ? event.is_active === true : true; // Default true se não tiver info (para não quebrar)

  const loadNews = async (reset = false) => {
    if (loading) return;

    setLoading(true);

    const nextOffset = reset ? 0 : offset;

    try {
      const data = await getEventNews(eventId, LIMIT, nextOffset);

      setNews((prev) => {
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
      console.error("Erro ao carregar notícias", err);
    } finally {
      setLoading(false);
    }
  };

  // ===== CACHE: Carregar dados ao montar/trocar evento =====
  useEffect(() => {
    if (initialized) {
      // Se já inicializou, é uma troca de evento - limpa tudo
      setNews([]);
      setOffset(0);
      setHasMore(true);
      setInitialized(false);
      return;
    }

    // Tenta carregar do cache
    const cached = getCache(cacheKey);
    
    if (cached && cached.data.length > 0) {
      // ✅ Dados encontrados no cache!
      setNews(cached.data);
      setOffset(cached.data.length);
      setHasMore(cached.data.length >= LIMIT);
      setInitialized(true);
      
      // Restaura posição do scroll ULTRA AGRESSIVO (igual Instagram/TikTok)
      const targetPosition = cached.scrollPosition;
      
      // Desabilita scroll restoration do navegador
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      
      // MÚLTIPLAS tentativas até conseguir
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
      
      // Inicia tentativas
      requestAnimationFrame(attemptRestore);
      
      // Backup com timeouts também
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
      setNews([]);
      setOffset(0);
      setHasMore(true);
      loadNews(true);
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // ===== CACHE: Salvar scroll position ULTRA ROBUSTO =====
  // Usa ref para sempre ter o último valor do scroll (não depende de timing)
  const lastScrollPositionRef = useRef(0);
  
  useEffect(() => {
    // Throttle para não salvar em todo scroll (performance)
    let throttleTimeout: NodeJS.Timeout | null = null;
    const THROTTLE_MS = 300;
    
    const updateScrollPosition = () => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      lastScrollPositionRef.current = currentScroll;
      
      // Salva imediatamente no cache (localStorage) - throttled
      if (throttleTimeout) clearTimeout(throttleTimeout);
      
      throttleTimeout = setTimeout(() => {
        if (news.length > 0) {
          setCache(cacheKey, news, currentScroll);
        }
      }, THROTTLE_MS);
    };
    
    // === MULTIPLATAFORMA: Todos os eventos possíveis ===
    
    // 1. SCROLL - atualiza a posição continuamente
    const handleScroll = () => {
      updateScrollPosition();
    };
    
    // 2. PAGEHIDE - funciona melhor que beforeunload em mobile (iOS/Android)
    const handlePageHide = () => {
      if (news.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, news, finalScroll);
      }
    };
    
    // 3. BEFOREUNLOAD - desktop browsers
    const handleBeforeUnload = () => {
      if (news.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, news, finalScroll);
      }
    };
    
    // 4. VISIBILITYCHANGE - quando aba fica oculta (mobile/desktop)
    const handleVisibilityChange = () => {
      if (document.hidden && news.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, news, finalScroll);
      }
    };
    
    // 5. BLUR - quando window perde foco
    const handleBlur = () => {
      if (news.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, news, finalScroll);
      }
    };
    
    // Registra todos os listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    
    // Salva periodicamente em idle (quando navegador está ocioso)
    let idleCallbackId: number | null = null;
    
    const scheduleIdleSave = () => {
      if ('requestIdleCallback' in window) {
        idleCallbackId = requestIdleCallback(() => {
          if (news.length > 0) {
            const currentScroll = lastScrollPositionRef.current;
            setCache(cacheKey, news, currentScroll);
          }
          scheduleIdleSave(); // Agenda próximo
        }, { timeout: 5000 });
      }
    };
    
    scheduleIdleSave();
    
    // CLEANUP: Remove todos os listeners
    return () => {
      if (throttleTimeout) clearTimeout(throttleTimeout);
      if (idleCallbackId) cancelIdleCallback(idleCallbackId);
      
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      
      // ÚLTIMO salvamento antes de desmontar (usa o ref!)
      if (news.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, news, finalScroll);
      }
    };
  }, [news, cacheKey, setCache]);

  // infinite scroll
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNews(false);
        }
      },
      { threshold: 1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, offset]);

  const [featured, ...others] = news;

  const handleNewsClick = (newsId: number) => {
    router.push(`/pages/news/${newsId}?eventId=${eventId}`);
  };

  const handleUpdate = () => {
    // Recarrega as news após atualização (curtir/comentar)
    loadNews(true);
  };

  return (
    <Box padding={2} key={authVersion}>
          {/* AÇÕES ADMIN — SEMPRE NO TOPO */}
      {canCreatePost && isEventActive && (
        <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2} marginBottom={2}>
          {canApprovePosts && isEventActive && <PendingPostsNotification eventId={eventId} />}
          <Button
            variant="contained"
            onClick={() => router.push(`/pages/news/create?eventId=${eventId}`)}
            sx={{
              backgroundColor: "#ffcc01",
              color: "#000",
              fontWeight: 600,
              borderRadius: "14px",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#e6b800",
              },
            }}
          >
            + Adicionar post
          </Button>
        </Box>
      )}

      {/* LOADING INICIAL */}
      {loading && news.length === 0 && <FeaturedNewsSkeleton />}

      {/* SEM NOTÍCIAS */}
      {!loading && news.length === 0 && <EmptyNews />}

      {/* FEED NORMAL */}
      {news.length > 0 && (
        <>
          {/* NOTÍCIA PRINCIPAL */}
          {featured && (
            <Card
              onClick={() => handleNewsClick(featured.id)}
              sx={{
                backgroundColor: "transparent",
                boxShadow: "none",
                color: "#fff",
                cursor: "pointer",
                transition: "opacity 0.2s",
                "&:hover": {
                  opacity: 0.8,
                },
              }}
            >
              {featured.images && featured.images.length > 0 && (
                <CardMedia
                  component="img"
                  image={featured.images[0].image_url}
                  alt={featured.title}
                  sx={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    objectFit: "cover",
                  }}
                />
              )}
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ color: "#fff" }}
                >
                  {featured.title}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.7)", marginTop: 1 }}
                >
                  {formatDate(featured.created_at)}
                </Typography>

                {featured.author && (
                  <Box display="flex" alignItems="center" gap={1} marginTop={1}>
                    <Avatar
                      src={featured.author.profile_photo || undefined}
                      alt={featured.author.name || "Autor"}
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: "rgba(255,255,255,0.2)",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}
                    >
                      {featured.author.name || "Autor desconhecido"}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
          <Divider
            sx={{
              borderColor: "rgba(255,255,255,0.35)",
              borderWidth: "1px",
              marginY: 1.5,
            }}
          />
          <Box display="flex" flexDirection="column">
            {others.map((item, index) => (
              <Box key={item.id}>
                <Card
                  onClick={() => handleNewsClick(item.id)}
                  sx={{
                    display: "flex",
                    gap: 2,
                    backgroundColor: "transparent",
                    boxShadow: "none",
                    color: "#fff",
                    paddingBottom: 1,
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                    "&:hover": {
                      opacity: 0.8,
                    },
                  }}
                >
                  {item.images && item.images.length > 0 && (
                    <CardMedia
                      component="img"
                      image={item.images[0].image_url}
                      alt={item.title}
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: 1,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <CardContent sx={{ padding: 1 }}>
                    <Typography fontWeight={600} sx={{ color: "#fff" }}>
                      {item.title}
                    </Typography>

                    <Typography
                      fontSize={12}
                      sx={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      {formatDate(item.created_at)}
                    </Typography>

                    {item.author && (
                      <Box display="flex" alignItems="center" gap={1} marginTop={0.5}>
                        <Avatar
                          src={item.author.profile_photo || undefined}
                          alt={item.author.name || "Autor"}
                          sx={{
                            width: 20,
                            height: 20,
                            bgcolor: "rgba(255,255,255,0.2)",
                          }}
                        />
                        <Typography
                          fontSize={11}
                          sx={{ color: "rgba(255,255,255,0.6)" }}
                        >
                          {item.author.name || "Autor desconhecido"}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Linha separadora */}
                {index !== others.length - 1 && (
                  <Divider
                    sx={{
                      borderColor: "rgba(255,255,255,0.15)",
                      marginY: 1,
                    }}
                  />
                )}

                {/* CTVAd a cada 3 posts */}
                {(index + 1) % 3 === 0 && index !== others.length - 1 && (
                  <>
                    <CTVAd />
                    <Divider
                      sx={{
                        borderColor: "rgba(255,255,255,0.15)",
                        marginY: 1,
                      }}
                    />
                  </>
                )}
              </Box>
            ))}

            {/* Skeleton ao carregar mais */}
            {loading &&
              Array.from({ length: 2 }).map((_, i) => (
                <NewsItemSkeleton key={i} />
              ))}
          </Box>
        </>
      )}

      {hasMore && <div ref={loaderRef} />}
    </Box>
  );
}

/* ---------------- SKELETONS ---------------- */

function FeaturedNewsSkeleton() {
  return (
    <Card
      sx={{
        marginBottom: 3,
        backgroundColor: "#0f0f0f",
        borderRadius: 2,
      }}
    >
      <Skeleton
        variant="rectangular"
        sx={{
          width: "100%",
          aspectRatio: "1 / 1",
          bgcolor: "#2a2a2a",
        }}
      />

      <CardContent>
        <Skeleton height={28} width="80%" sx={{ bgcolor: "#2a2a2a" }} />

        <Skeleton
          height={18}
          width="40%"
          sx={{ bgcolor: "#2a2a2a", marginTop: 1 }}
        />
      </CardContent>
    </Card>
  );
}

function NewsItemSkeleton() {
  return (
    <Card
      sx={{
        display: "flex",
        gap: 2,
        padding: 1,
        backgroundColor: "#0f0f0f",
        borderRadius: 2,
      }}
    >
      <Skeleton
        variant="rectangular"
        width={100}
        height={100}
        sx={{ bgcolor: "#2a2a2a", borderRadius: 1 }}
      />

      <CardContent sx={{ padding: 1, width: "100%" }}>
        <Skeleton height={20} width="90%" sx={{ bgcolor: "#2a2a2a" }} />

        <Skeleton
          height={14}
          width="40%"
          sx={{ bgcolor: "#2a2a2a", marginTop: 1 }}
        />
      </CardContent>
    </Card>
  );
}
