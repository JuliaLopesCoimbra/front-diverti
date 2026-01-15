"use client";

import { useEffect, useRef, useState } from "react";
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
} from "@mui/material";
import { getLikedPosts } from "@/app/services/likes/likeService";
import { NewsDetailsResponse } from "@/app/services/news/newsService";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import BottomNav from "@/app/components/layout/BottomNav";
import { CircularProgress } from "@mui/material";
import HomeHeader from "@/app/components/home/HeaderHome";
import { EventResponse, getEvents } from "@/app/services/events/eventService";

const LIMIT = 5;

export default function LikedPostsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/pages/auth/login");
      return;
    }

    // Carrega eventos para o header
    getEvents()
      .then((data) => {
        setEvents(data);
        if (data.length > 0) {
          setCurrentEvent(data[0]);
        }
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "agora";
    if (diffInSeconds < 3600)
      return `há ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400)
      return `há ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800)
      return `há ${Math.floor(diffInSeconds / 86400)}d`;

    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
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
            onSelectEvent={setCurrentEvent}
          />
        )}

        {/* Título da página */}
        <Box
          sx={{
            paddingX: 2,
            paddingY: 1.5,
           
          }}
        >
    
        </Box>

        <Box padding={2}>
          {/* LOADING INICIAL */}
          {loading && posts.length === 0 && (
            <Box display="flex" flexDirection="column" gap={1}>
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
                gap: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: "rgba(255,255,255,0.7)", textAlign: "center" }}
              >
                Você ainda não curtiu nenhum post
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.5)", textAlign: "center" }}
              >
                Os posts que você curtir aparecerão aqui
              </Typography>
            </Box>
          )}

          {/* LISTA DE POSTS */}
          {posts.length > 0 && (
            <Box display="flex" flexDirection="column" gap={0}>
              {posts.map((item, index) => (
                <Box key={item.id}>
                  <Card
                    onClick={() => handlePostClick(item)}
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      backgroundColor: "transparent",
                      boxShadow: "none",
                      color: "#fff",
                      paddingY: 1.5,
                      cursor: "pointer",
                      transition: "opacity 0.2s",
                      "&:hover": {
                        opacity: 0.8,
                        backgroundColor: "rgba(255,255,255,0.05)",
                      },
                    }}
                  >
                    {/* Foto pequena */}
                    {item.images && item.images.length > 0 ? (
                      <CardMedia
                        component="img"
                        image={item.images[0].image_url}
                        alt={item.title}
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 1,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 1,
                          backgroundColor: "rgba(255,255,255,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ color: "rgba(255,255,255,0.3)" }}
                        >
                          📷
                        </Typography>
                      </Box>
                    )}

                    {/* Conteúdo */}
                    <CardContent sx={{ padding: 0, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      {/* Título */}
                      <Typography
                        fontWeight={600}
                        fontSize={15}
                        sx={{
                          color: "#fff",
                          mb: 0.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.title}
                      </Typography>

                      {/* Autor e tempo */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        {item.author && (
                          <>
                            <Avatar
                              src={item.author.profile_photo}
                              sx={{
                                width: 20,
                                height: 20,
                              }}
                            >
                              {item.author.name?.[0]?.toUpperCase() || "?"}
                            </Avatar>
                            <Typography
                              fontSize={12}
                              sx={{ color: "rgba(255,255,255,0.6)" }}
                            >
                              {item.author.name || "Autor desconhecido"}
                            </Typography>
                            <Typography
                              fontSize={12}
                              sx={{ color: "rgba(255,255,255,0.4)" }}
                            >
                              •
                            </Typography>
                          </>
                        )}
                        <Typography
                          fontSize={12}
                          sx={{ color: "rgba(255,255,255,0.6)" }}
                        >
                          {formatTimeAgo(item.created_at)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Linha separadora */}
                  {index !== posts.length - 1 && (
                    <Divider
                      sx={{
                        borderColor: "rgba(255,255,255,0.15)",
                        marginY: 0.5,
                      }}
                    />
                  )}
                </Box>
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
      <BottomNav />
    </>
  );
}

/* ---------------- SKELETONS ---------------- */

function PostItemSkeleton() {
  return (
    <Box>
      <Card
        sx={{
          display: "flex",
          gap: 1.5,
          backgroundColor: "transparent",
          boxShadow: "none",
          paddingY: 1.5,
        }}
      >
        <Skeleton
          variant="rectangular"
          width={80}
          height={80}
          sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1 }}
        />

        <CardContent sx={{ padding: 0, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Skeleton height={18} width="90%" sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 1 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Skeleton
              variant="circular"
              width={20}
              height={20}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
            <Skeleton height={14} width="30%" sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
            <Skeleton height={14} width="20%" sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
          </Box>
        </CardContent>
      </Card>
      <Divider
        sx={{
          borderColor: "rgba(255,255,255,0.15)",
          marginY: 0.5,
        }}
      />
    </Box>
  );
}

