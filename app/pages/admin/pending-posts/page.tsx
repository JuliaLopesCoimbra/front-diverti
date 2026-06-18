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
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

function PendingPostsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdminMaster, isAdmin } = useAuth();
  const [posts, setPosts] = useState<NewsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const isLoadingRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  const canApprovePosts = isAdminMaster || isAdmin;
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
        ...dashboardBackgroundSx,
        padding: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: { xs: "100%", md: "800px", lg: "1000px" }, margin: "0 auto" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 2, md: 2.5, lg: 3 }, mb: { xs: 4, md: 5, lg: 6 } }}>
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
            <ArrowBackIos sx={{ fontSize: { xs: 20, md: 24, lg: 28 } }} />
          </IconButton>
          <Typography 
            variant="h6" 
            sx={{ 
              color: "white", 
              fontWeight: 600, 
              fontSize: { xs: "1rem", md: "1.25rem", lg: "1.5rem" },
            }}
          >
            Posts Pendentes de Aprovação
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: { xs: 8, md: 10, lg: 12 } }}>
            <CircularProgress 
              sx={{ 
                color: "#ffcc01",
                width: { xs: 40, md: 50, lg: 60 },
                height: { xs: 40, md: 50, lg: 60 },
              }} 
            />
          </Box>
        ) : posts.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(20px)",
              borderRadius: { xs: 3, md: 4 },
              p: { xs: 4, md: 5, lg: 6 },
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                color: "white", 
                mb: 1,
                fontSize: { xs: "1.25rem", md: "1.5rem", lg: "1.75rem" },
              }}
            >
              Nenhum post pendente
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: "rgba(255,255,255,0.7)",
                fontSize: { xs: "0.875rem", md: "1rem", lg: "1.125rem" },
              }}
            >
              Todos os posts foram revisados.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5, lg: 3 } }}>
            {posts.map((post) => {
              const firstImage = post.images && post.images.length > 0 ? post.images[0] : null;
              const imageCount = post.images?.length || 0;
              
              return (
                <Card
                  key={post.id}
                  onClick={() => handlePostClick(post)}
                  sx={{
                    display: "flex",
                    gap: { xs: 2, md: 2.5, lg: 3 },
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: { xs: 2, md: 2.5, lg: 3 },
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    padding: { xs: 0, md: 0.5, lg: 1 },
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderColor: "#ffcc01",
                      transform: "translateX(4px)",
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
                          width: { xs: 100, md: 160, lg: 200 },
                          height: { xs: 100, md: 160, lg: 200 },
                          objectFit: "cover",
                          borderRadius: { xs: 1, md: 1.5, lg: 2 },
                        }}
                      />
                      {imageCount > 1 && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: { xs: 8, md: 12, lg: 16 },
                            right: { xs: 8, md: 12, lg: 16 },
                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                            backdropFilter: "blur(10px)",
                            borderRadius: { xs: 1, md: 1.5 },
                            px: { xs: 1, md: 1.5, lg: 2 },
                            py: { xs: 0.5, md: 0.75, lg: 1 },
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: "white",
                              fontSize: { xs: "0.7rem", md: "0.875rem", lg: "1rem" },
                              fontWeight: 600,
                            }}
                          >
                            {imageCount} imagens
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                  <CardContent sx={{ flex: 1, p: { xs: 0, md: 1, lg: 1.5 }, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <Typography
                      variant="body1"
                      sx={{
                        color: "white",
                        fontWeight: 500,
                        mb: { xs: 0.5, md: 1, lg: 1.5 },
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        fontSize: { xs: "0.875rem", md: "1.125rem", lg: "1.25rem" },
                      }}
                    >
                      {post.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ 
                        color: "rgba(255,255,255,0.5)", 
                        fontSize: { xs: "0.75rem", md: "0.875rem", lg: "1rem" },
                      }}
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
            ...dashboardBackgroundSx,
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
