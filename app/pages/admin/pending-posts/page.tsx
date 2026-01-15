"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Button,
  Divider,
  Paper,
  IconButton,
} from "@mui/material";
import { ArrowBackIos } from "@mui/icons-material";
import { getPendingPosts, NewsResponse } from "@/app/services/news/newsService";
import { useToast } from "@/app/context/ToastContext";
import { useAuth } from "@/app/context/AuthContext";

function PendingPostsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdminMaster, isSubadmin } = useAuth();
  const [posts, setPosts] = useState<NewsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const isLoadingRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  const canApprovePosts = isAdminMaster || isSubadmin;
  const eventIdParam = searchParams.get("eventId");
  const eventId = eventIdParam ? parseInt(eventIdParam, 10) : undefined;

  useEffect(() => {
    if (!canApprovePosts) {
      router.push("/pages/user/home");
      return;
    }
    
    if (isLoadingRef.current) return;
    
    const loadPosts = async () => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setLoading(true);
      try {
        const data = await getPendingPosts(eventId);
        setPosts(data);
        
        // Se tiver apenas 1 post, redireciona direto para o detail (apenas uma vez)
        if (data.length === 1 && !hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          const redirectUrl = eventId 
            ? `/pages/admin/pending-posts/${data[0].id}?eventId=${eventId}`
            : `/pages/admin/pending-posts/${data[0].id}`;
          router.push(redirectUrl);
        }
      } catch (error: any) {
        showToast(
          error.response?.data?.detail || "Erro ao carregar posts pendentes",
          "error"
        );
      } finally {
        isLoadingRef.current = false;
        setLoading(false);
      }
    };

    loadPosts();
  }, [canApprovePosts, eventId]);

  const handlePostClick = (post: NewsResponse) => {
    // Usa o eventId da query string ou do próprio post
    const postEventId = post.event_id || eventId;
    const url = postEventId 
      ? `/pages/admin/pending-posts/${post.id}?eventId=${postEventId}`
      : `/pages/admin/pending-posts/${post.id}`;
    router.push(url);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url(/background/dashboard.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        padding: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <IconButton
            onClick={() => router.push("/pages/user/home")}
            sx={{
              color: "#fff",
              padding: 0.5,
              "&:hover": {
                backgroundColor: "transparent",
                opacity: 0.7,
              },
            }}
          >
            <ArrowBackIos sx={{ fontSize: 20 }} />
          </IconButton>
          <Typography variant="h6" sx={{ color: "white", fontWeight: 600, fontSize: "1rem" }}>
            Posts Pendentes de Aprovação
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#ffcc01" }} />
          </Box>
        ) : posts.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(20px)",
              borderRadius: 3,
              p: 4,
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Typography variant="h6" sx={{ color: "white", mb: 1 }}>
              Nenhum post pendente
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
              Todos os posts foram revisados.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {posts.map((post) => {
              const firstImage = post.images && post.images.length > 0 ? post.images[0] : null;
              const imageCount = post.images?.length || 0;
              
              return (
                <Card
                  key={post.id}
                  onClick={() => handlePostClick(post)}
                  sx={{
                    display: "flex",
                    gap: 2,
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: 0,
                    cursor: "pointer",
                    transition: "opacity 0.2s ease",
                    "&:hover": {
                      opacity: 0.8,
                    },
                  }}
                >
                  {firstImage && (
                    <Box sx={{ position: "relative", flexShrink: 0 }}>
                      <CardMedia
                        component="img"
                        image={firstImage.image_url}
                        alt={post.title}
                        sx={{
                          width: 100,
                          height: 100,
                          objectFit: "cover",
                          borderRadius: 1,
                        }}
                      />
                      {imageCount > 1 && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                            backdropFilter: "blur(10px)",
                            borderRadius: 1,
                            px: 1,
                            py: 0.5,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: "white",
                              fontSize: "0.7rem",
                              fontWeight: 600,
                            }}
                          >
                            {imageCount} imagens
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                  <CardContent sx={{ flex: 1, p: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <Typography
                      variant="body1"
                      sx={{
                        color: "white",
                        fontWeight: 500,
                        mb: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {post.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}
                    >
                      {formatDate(post.created_at)}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function PendingPostsPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "100vh",
            backgroundImage: "url(/background/dashboard.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress sx={{ color: "#ffcc01" }} />
        </Box>
      }
    >
      <PendingPostsContent />
    </Suspense>
  );
}
