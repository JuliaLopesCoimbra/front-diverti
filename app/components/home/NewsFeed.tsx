"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Skeleton,
  Button,
  Avatar,
} from "@mui/material";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import { useAuth } from "@/app/context/AuthContext";
import { useFeedCache } from "@/app/context/FeedCacheContext";
import { getEventNews, NewsResponse } from "@/app/services/news/newsService";
import { EventResponse } from "@/app/services/events/eventAppService";
import EmptyNews from "./EmptyNews";

const SPONSOR_ADS = [
  "/brahma/1.png", "/brahma/2.png", "/brahma/3.png", "/brahma/4.png", "/brahma/5.png",
  "/sicoob/1.png", "/sicoob/2.png", "/sicoob/3.png", "/sicoob/4.png", "/sicoob/5.png",
  "/globo/1.png",  "/globo/2.png",  "/globo/3.png",  "/globo/4.png",  "/globo/5.png",
  "/ballantines/1.png", "/ballantines/2.png", "/ballantines/3.png", "/ballantines/4.png", "/ballantines/5.png",
];
import { useRouter } from "next/navigation";
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
  const { isAdminMaster, isAdmin, authVersion } = useAuth();
  const router = useRouter();

  const { getCache, setCache } = useFeedCache();
  const cacheKey = `feed-event-${eventId}`;
  const [initialized, setInitialized] = useState(false);

  const [news, setNews] = useState<NewsResponse[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const canApprovePosts = isAdminMaster || isAdmin;
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
      
      // Flag para prevenir restauração se o usuário já fez scroll
      let userScrolled = false;
      let restoreCompleted = false;
      const timeouts: NodeJS.Timeout[] = [];
      
      // Detecta se o usuário fez scroll manualmente
      const handleUserScroll = () => {
        if (!restoreCompleted) {
          userScrolled = true;
        }
      };
      
      // Adiciona listener temporário para detectar scroll do usuário
      window.addEventListener('scroll', handleUserScroll, { passive: true, once: false });
      
      let attempts = 0;
      const maxAttempts = 10; // Reduzido de 20 para 10
      
      const attemptRestore = () => {
        if (userScrolled || restoreCompleted) return;
        
        attempts++;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'instant' as ScrollBehavior
        });
        
        const currentScroll = window.scrollY;
        const diff = Math.abs(currentScroll - targetPosition);
        
        if (diff < 10) {
          restoreCompleted = true;
          window.removeEventListener('scroll', handleUserScroll);
        } else if (attempts < maxAttempts && !userScrolled) {
          requestAnimationFrame(attemptRestore);
        } else {
          restoreCompleted = true;
          window.removeEventListener('scroll', handleUserScroll);
        }
      };
      
      // Aguarda um pouco antes de começar a restaurar
      const initialTimeout = setTimeout(() => {
        if (!userScrolled) {
          requestAnimationFrame(attemptRestore);
        }
      }, 100);
      timeouts.push(initialTimeout);
      
      // Reduzido para apenas alguns delays essenciais
      [200, 500].forEach(delay => {
        const timeout = setTimeout(() => {
          if (!userScrolled && !restoreCompleted) {
            window.scrollTo({
              top: targetPosition,
              behavior: 'instant' as ScrollBehavior
            });
            restoreCompleted = true;
            window.removeEventListener('scroll', handleUserScroll);
          }
        }, delay);
        timeouts.push(timeout);
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
            const currentScroll = window.scrollY;
            // Só reseta scroll se o usuário estiver no topo ou muito próximo
            const shouldReset = shouldResetScroll && currentScroll < 100;
            setCache(cacheKey, freshData, shouldReset ? 0 : currentScroll);
            
            if (shouldReset) {
              setTimeout(() => {
                // Só faz scroll para o topo se o usuário não estiver fazendo scroll
                if (window.scrollY < 100) {
                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                  });
                }
              }, 500);
            }
          }
        } catch (err) {
          console.error('Erro ao revalidar cache:', err);
        }
      })();
      
      // Cleanup: remove listeners e cancela timeouts
      return () => {
        window.removeEventListener('scroll', handleUserScroll);
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
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

  // Prefetch das páginas de news visíveis no feed
  useEffect(() => {
    news.forEach((item) => {
      router.prefetch(`/pages/news/${item.id}?eventId=${eventId}`);
    });
  }, [news, eventId, router]);

  const handleNewsClick = (newsItem: NewsResponse) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`news-preview-${newsItem.id}`, JSON.stringify(newsItem));
    }
    router.push(`/pages/news/${newsItem.id}?eventId=${eventId}`);
  };

  const handleUpdate = () => {
    loadNews(true);
  };

  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        pt: { xs: 1.5, md: 2 },
        maxWidth: { xs: "100%", md: "600px" },
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Botões de admin */}
      {canApprovePosts && isEventActive && (
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <PendingPostsNotification eventId={eventId} />
        </Box>
      )}

      {loading && news.length === 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
        </Box>
      )}

      {!loading && news.length === 0 && <EmptyNews />}

      {news.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {news.map((item, index) => (
            <Box key={item.id} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <PostCard item={item} onPress={() => handleNewsClick(item)} />
              <Box
                component="img"
                src={SPONSOR_ADS[index % SPONSOR_ADS.length]}
                alt="Anúncio"
                sx={{
                  width: "100%",
                  borderRadius: "18px",
                  display: "block",
                  objectFit: "cover",
                }}
              />
            </Box>
          ))}

          {loading && Array.from({ length: 2 }).map((_, i) => <PostSkeleton key={`sk-${i}`} />)}
        </Box>
      )}

      {hasMore && <div ref={loaderRef} />}
    </Box>
  );
}

/* ---------- Card individual de post ---------- */
function PostCard({ item, onPress }: { item: NewsResponse; onPress: () => void }) {
  const hasImage = item.images && item.images.length > 0;

  return (
    <Box
      sx={{
        borderRadius: "18px",
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        cursor: "pointer",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        },
        "&:active": { transform: "scale(0.99)" },
      }}
    >
      {/* Header do post */}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1.2, px: 1.5, pt: 1.5, pb: hasImage ? 1 : 0 }}
        onClick={onPress}
      >
        <Avatar
          src={item.author?.profile_photo || undefined}
          alt={item.author?.name || "Autor"}
          sx={{ width: 36, height: 36, bgcolor: "rgba(255,255,255,0.15)", fontSize: 14, fontWeight: 700, flexShrink: 0 }}
        >
          {!item.author?.profile_photo && (item.author?.name?.[0] || "?").toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: 13, lineHeight: 1.2 }} noWrap>
            {item.author?.name || "Autor desconhecido"}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 1.2 }}>
            {formatDate(item.created_at)}
          </Typography>
        </Box>
      </Box>

      {/* Imagem */}
      {hasImage && (
        <Box onClick={onPress} sx={{ position: "relative", width: "100%", aspectRatio: "3/4", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.images[0].image_url}
            alt={item.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </Box>
      )}

      {/* Rodapé: título + ações */}
      <Box sx={{ display: "flex", alignItems: "stretch", px: 1.5, pt: 1.2, pb: 1.5, gap: 1 }}>
        {/* Título */}
        <Box sx={{ flex: 1, minWidth: 0 }} onClick={onPress}>
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 700,
              fontSize: { xs: 14, md: 15 },
              lineHeight: 1.4,
              wordBreak: "break-word",
            }}
          >
            {item.title}
          </Typography>
          {item.content && (
            <Typography
              sx={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 12,
                mt: 0.4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.content}
            </Typography>
          )}
        </Box>

        {/* Ações — lateral direita */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.8,
            pl: 1,
            borderLeft: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <Box
            onClick={onPress}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.3,
              cursor: "pointer",
              "&:hover svg": { color: "#ff4d6d" },
              "&:active": { transform: "scale(0.88)" },
              transition: "transform 0.15s",
            }}
          >
            <FavoriteBorderRoundedIcon sx={{ fontSize: 22, color: "rgba(255,255,255,0.55)", transition: "color 0.2s" }} />
          </Box>
          <Box
            onClick={onPress}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.3,
              cursor: "pointer",
              "&:hover svg": { color: "#60a5fa" },
              "&:active": { transform: "scale(0.88)" },
              transition: "transform 0.15s",
            }}
          >
            <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 21, color: "rgba(255,255,255,0.55)", transition: "color 0.2s" }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* ---------- Skeleton ---------- */
function PostSkeleton() {
  return (
    <Box sx={{ borderRadius: "18px", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, p: 1.5 }}>
        <Skeleton variant="circular" width={36} height={36} sx={{ bgcolor: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="40%" height={14} sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
          <Skeleton variant="text" width="25%" height={12} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
        </Box>
      </Box>
      <Skeleton variant="rectangular" sx={{ width: "100%", aspectRatio: "4/3", bgcolor: "rgba(255,255,255,0.08)" }} />
      <Box sx={{ p: 1.5 }}>
        <Skeleton variant="text" width="80%" height={18} sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
        <Skeleton variant="text" width="55%" height={14} sx={{ bgcolor: "rgba(255,255,255,0.06)", mt: 0.5 }} />
      </Box>
    </Box>
  );
}

