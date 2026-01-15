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
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "rgba(26, 26, 26, 0.95)",
            backdropFilter: "blur(20px)",
            color: "white",
            borderRadius: 3,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Posts Pendentes de Aprovação
            </Typography>
            <IconButton onClick={onClose} sx={{ color: "white" }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />
        <DialogContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress sx={{ color: "#ffcc01" }} />
            </Box>
          ) : posts.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
                Nenhum post pendente de aprovação
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
              {posts.map((post) => (
                <Card
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  sx={{
                    display: "flex",
                    gap: 2,
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
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
                        width: 120,
                        height: 120,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <CardContent sx={{ flex: 1, p: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "white",
                        fontWeight: 600,
                        mb: 1,
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
                      sx={{ color: "rgba(255,255,255,0.6)" }}
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

