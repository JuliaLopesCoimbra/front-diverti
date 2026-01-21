"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Button,
  Divider,
  Paper,
  IconButton,
} from "@mui/material";
import { Close, CheckCircle, Cancel } from "@mui/icons-material";
import { getPendingPosts, NewsResponse } from "@/app/services/news/newsService";
import { useToast } from "@/app/context/ToastContext";
import PendingPostDetail from "./PendingPostDetail";

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  eventId?: number;
}

export default function PendingPostsList({ open, onClose, onUpdate, eventId }: Props) {
  const [posts, setPosts] = useState<NewsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const { showToast } = useToast();

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await getPendingPosts(eventId);
      setPosts(data);
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Erro ao carregar posts pendentes",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadPosts();
      setSelectedPostId(null);
    }
  }, [open, eventId]);

  // Se tiver apenas 1 post, abre direto o detail
  useEffect(() => {
    if (posts.length === 1 && !selectedPostId && !loading) {
      setSelectedPostId(posts[0].id);
    }
  }, [posts, selectedPostId, loading]);

  const handlePostClick = (postId: number) => {
    setSelectedPostId(postId);
  };

  const handleCloseDetail = () => {
    setSelectedPostId(null);
    loadPosts();
    onUpdate();
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
    <>
      <Dialog
        open={open && selectedPostId === null}
        onClose={onClose}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "rgba(26, 26, 26, 0.95)",
            backdropFilter: "blur(20px)",
            color: "white",
            borderRadius: { xs: 3, md: 4 },
            border: "1px solid rgba(255, 255, 255, 0.1)",
            maxHeight: "90vh",
            width: { xs: "90%", sm: "80%", md: "700px", lg: "900px" },
            maxWidth: { xs: "100%", md: "700px", lg: "900px" },
            margin: "auto",
          },
        }}
      >
        <DialogTitle sx={{ padding: { xs: 2, md: 3, lg: 3.5 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: "1.25rem", md: "1.5rem", lg: "1.75rem" },
              }}
            >
              Posts Pendentes de Aprovação
            </Typography>
            <IconButton 
              onClick={onClose} 
              sx={{ 
                color: "white",
                fontSize: { xs: "1.5rem", md: "1.75rem", lg: "2rem" },
              }}
            >
              <Close sx={{ fontSize: "inherit" }} />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />
        <DialogContent sx={{ padding: { xs: 2, md: 3, lg: 4 } }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: { xs: 4, md: 6, lg: 8 } }}>
              <CircularProgress 
                sx={{ 
                  color: "#ffcc01",
                  width: { xs: 40, md: 50, lg: 60 },
                  height: { xs: 40, md: 50, lg: 60 },
                }} 
              />
            </Box>
          ) : posts.length === 0 ? (
            <Box sx={{ textAlign: "center", py: { xs: 4, md: 6, lg: 8 } }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: "rgba(255,255,255,0.7)",
                  fontSize: { xs: "1rem", md: "1.125rem", lg: "1.25rem" },
                }}
              >
                Nenhum post pendente de aprovação
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5, lg: 3 }, mt: { xs: 2, md: 3 } }}>
              {posts.map((post) => (
                <Card
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  sx={{
                    display: "flex",
                    gap: { xs: 2, md: 2.5, lg: 3 },
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: { xs: 2, md: 2.5, lg: 3 },
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderColor: "#ffcc01",
                      transform: "translateX(4px)",
                    },
                  }}
                >
                  {post.images && post.images.length > 0 && (
                    <CardMedia
                      component="img"
                      image={post.images[0].image_url}
                      alt={post.title}
                      sx={{
                        width: { xs: 120, md: 160, lg: 200 },
                        height: { xs: 120, md: 160, lg: 200 },
                        objectFit: "cover",
                        flexShrink: 0,
                        borderRadius: { xs: 1, md: 1.5, lg: 2 },
                      }}
                    />
                  )}
                  <CardContent sx={{ flex: 1, p: { xs: 2, md: 2.5, lg: 3 } }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "white",
                        fontWeight: 600,
                        mb: { xs: 1, md: 1.5 },
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        fontSize: { xs: "1rem", md: "1.25rem", lg: "1.5rem" },
                      }}
                    >
                      {post.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ 
                        color: "rgba(255,255,255,0.6)",
                        fontSize: { xs: "0.75rem", md: "0.875rem", lg: "1rem" },
                      }}
                    >
                      {formatDate(post.created_at)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {selectedPostId && (
        <PendingPostDetail
          postId={selectedPostId}
          eventId={eventId}
          open={selectedPostId !== null}
          onClose={handleCloseDetail}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}

