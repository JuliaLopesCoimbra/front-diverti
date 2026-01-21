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
import PendingPostsNotification from "@/app/components/admin/pending-posts/PendingPostsNotification";
import AdBanner from "../ads/AdBanner";

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
  
  const { getCache, setCache } = useFeedCache();
  const cacheKey = `feed-event-${eventId}`;
  const [initialized, setInitialized] = useState(false);
  
  const [news, setNews] = useState<NewsResponse[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loaderRef = useRef<HTMLDivElement | null>(null);
  
  const canApprovePosts = isAdminMaster || isSubadmin;
  const isEventActive = event ? event.is_active === true : true;

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

  useEffect(() => {
    if (initialized) {
      setNews([]);
      setOffset(0);
      setHasMore(true);
      setInitialized(false);
      return;
    }

    const cached = getCache(cacheKey);
    
    if (cached && cached.data.length > 0) {
      setNews(cached.data);
      setOffset(cached.data.length);
      setHasMore(cached.data.length >= LIMIT);
      setInitialized(true);
      
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
      
      (async () => {
        try {
          const limit = cached.data.length + (LIMIT * 3);
          const freshData = await getEventNews(eventId, limit, 0);
          
          const cachedIds = cached.data.map((n: NewsResponse) => n.id).sort().join(',');
          const freshIds = freshData.map((n: NewsResponse) => n.id).sort().join(',');
          
          if (cachedIds !== freshIds || cached.data.length !== freshData.length) {
            setNews(freshData);
            setOffset(freshData.length);
            setHasMore(freshData.length >= limit);
            const shouldResetScroll = freshData.length > cached.data.length;
            setCache(cacheKey, freshData, shouldResetScroll ? 0 : targetPosition);
            
            if (shouldResetScroll) {
              setTimeout(() => {
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }, 500);
            }
          }
        } catch (err) {
          console.error('Erro ao revalidar cache:', err);
        }
      })();
    } else {
      setNews([]);
      setOffset(0);
      setHasMore(true);
      loadNews(true);
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const lastScrollPositionRef = useRef(0);
  
  useEffect(() => {
    let throttleTimeout: NodeJS.Timeout | null = null;
    const THROTTLE_MS = 400;
    
    const updateScrollPosition = () => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      lastScrollPositionRef.current = currentScroll;
      
      if (throttleTimeout) clearTimeout(throttleTimeout);
      
      throttleTimeout = setTimeout(() => {
        if (news.length > 0) {
          setCache(cacheKey, news, currentScroll);
        }
      }, THROTTLE_MS);
    };
    
    const handleScroll = () => {
      updateScrollPosition();
    };
    
    const handlePageHide = () => {
      if (news.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, news, finalScroll);
      }
    };
    
    const handleBeforeUnload = () => {
      if (news.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, news, finalScroll);
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden && news.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, news, finalScroll);
      }
    };
    
    const handleBlur = () => {
      if (news.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, news, finalScroll);
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
      
      if (news.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, news, finalScroll);
      }
    };
  }, [news, cacheKey, setCache]);

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
    loadNews(true);
  };

  return (
    <Box 
      padding={{ xs: 2, md: 3, lg: 4 }}
      key={authVersion}
      sx={{
        maxWidth: { xs: "100%", md: "800px", lg: "900px" },
        margin: { xs: 0, md: "0 auto" },
        width: { xs: "100%", md: "100%" },
      }}
    >
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

      {loading && news.length === 0 && <FeaturedNewsSkeleton />}

      {!loading && news.length === 0 && <EmptyNews />}

      {news.length > 0 && (
        <>
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
              <CardContent sx={{ padding: { xs: 2, md: 2.5, lg: 3 } }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ 
                    color: "#fff",
                    fontSize: { xs: "1.25rem", md: "1.5rem", lg: "1.75rem" },
                  }}
                >
                  {featured.title}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ 
                    color: "rgba(255,255,255,0.7)", 
                    marginTop: 1,
                    fontSize: { xs: "0.875rem", md: "1rem", lg: "1.125rem" },
                  }}
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
                        width: { xs: 100, md: 120, lg: 140 },
                        height: { xs: 100, md: 120, lg: 140 },
                        borderRadius: 1,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <CardContent sx={{ padding: { xs: 1, md: 1.5, lg: 2 } }}>
                    <Typography 
                      fontWeight={600} 
                      sx={{ 
                        color: "#fff",
                        fontSize: { xs: "0.875rem", md: "1rem", lg: "1.125rem" },
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      sx={{ 
                        color: "rgba(255,255,255,0.6)",
                        fontSize: { xs: 12, md: 13, lg: 14 },
                      }}
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
                    <AdBanner />
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
