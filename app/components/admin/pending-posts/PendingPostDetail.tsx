"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  CircularProgress,
  IconButton,
  Paper,
  Avatar,
  DialogContentText,
} from "@mui/material";
import {
  Close,
  CheckCircle,
  Cancel,
  ArrowBack,
} from "@mui/icons-material";
import {
  getNewsDetails,
  NewsDetailsResponse,
  approvePost,
  rejectPost,
} from "@/app/services/news/newsService";
import { useToast } from "@/app/context/ToastContext";

interface Props {
  postId: number;
  eventId?: number;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function PendingPostDetail({
  postId,
  eventId,
  open,
  onClose,
  onUpdate,
}: Props) {
  const [news, setNews] = useState<NewsDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const { showToast } = useToast();

  const loadNews = async () => {
    if (!eventId) {
      showToast("Evento não encontrado", "error");
      onClose();
      return;
    }
    setLoading(true);
    try {
      const data = await getNewsDetails(postId, eventId);
      setNews(data);
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Erro ao carregar post",
        "error"
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && postId) {
      loadNews();
    }
  }, [open, postId]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approvePost(postId);
      showToast("Post aprovado com sucesso!", "success");
      setConfirmApproveOpen(false);
      onClose();
      onUpdate();
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Erro ao aprovar post",
        "error"
      );
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await rejectPost(postId);
      showToast("Post recusado com sucesso!", "success");
      setConfirmRejectOpen(false);
      onClose();
      onUpdate();
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Erro ao recusar post",
        "error"
      );
    } finally {
      setRejecting(false);
    }
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
        open={open}
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton onClick={onClose} sx={{ color: "white" }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Post Pendente de Aprovação
              </Typography>
            </Box>
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
          ) : news ? (
            <Box>
              {/* Imagem */}
              {news.images && news.images.length > 0 && (
                <Box
                  component="img"
                  src={news.images[0].image_url}
                  alt={news.title}
                  sx={{
                    width: "100%",
                    maxHeight: 400,
                    objectFit: "cover",
                    borderRadius: 2,
                    mb: 3,
                  }}
                />
              )}

              {/* Título */}
              <Typography
                variant="h5"
                sx={{
                  color: "white",
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                {news.title}
              </Typography>

              {/* Autor */}
              {news.author && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <Avatar
                    src={news.author.profile_photo}
                    sx={{ width: 40, height: 40 }}
                  >
                    {news.author.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>
                      {news.author.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
                      {formatDate(news.created_at)}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", my: 2 }} />

              {/* Conteúdo */}
              <Typography
                variant="body1"
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                }}
              >
                {news.content}
              </Typography>
            </Box>
          ) : null}
        </DialogContent>
        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={onClose}
            sx={{
              color: "rgba(255,255,255,0.7)",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => setConfirmRejectOpen(true)}
            variant="contained"
            startIcon={<Cancel />}
            disabled={loading || rejecting}
            sx={{
              backgroundColor: "#ff4444",
              color: "white",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#cc0000",
              },
            }}
          >
            Recusar
          </Button>
          <Button
            onClick={() => setConfirmApproveOpen(true)}
            variant="contained"
            startIcon={<CheckCircle />}
            disabled={loading || approving}
            sx={{
              backgroundColor: "#4caf50",
              color: "white",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#45a049",
              },
            }}
          >
            Aprovar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmação - Aprovar */}
      <Dialog
        open={confirmApproveOpen}
        onClose={() => setConfirmApproveOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: "rgba(26, 26, 26, 0.95)",
            backdropFilter: "blur(20px)",
            color: "white",
            borderRadius: 3,
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CheckCircle sx={{ fontSize: 28, color: "#4caf50" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Aprovar Post
            </Typography>
          </Box>
        </DialogTitle>
        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", mx: 3 }} />
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.9)", fontSize: "1rem" }}>
            Tem certeza que deseja <strong style={{ color: "#4caf50" }}>aprovar</strong> este post?
            <br />
            <br />
            <Box
              component="span"
              sx={{
                display: "block",
                p: 2,
                mt: 2,
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                borderRadius: 2,
                border: "1px solid rgba(76, 175, 80, 0.2)",
              }}
            >
              O post será publicado e ficará visível no feed.
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setConfirmApproveOpen(false)}
            disabled={approving}
            sx={{
              color: "rgba(255,255,255,0.7)",
              textTransform: "none",
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleApprove}
            disabled={approving}
            variant="contained"
            startIcon={approving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <CheckCircle />}
            sx={{
              backgroundColor: "#4caf50",
              color: "white",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#45a049",
              },
            }}
          >
            {approving ? "Aprovando..." : "Aprovar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmação - Recusar */}
      <Dialog
        open={confirmRejectOpen}
        onClose={() => setConfirmRejectOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: "rgba(26, 26, 26, 0.95)",
            backdropFilter: "blur(20px)",
            color: "white",
            borderRadius: 3,
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Cancel sx={{ fontSize: 28, color: "#ff4444" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Recusar Post
            </Typography>
          </Box>
        </DialogTitle>
        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", mx: 3 }} />
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.9)", fontSize: "1rem" }}>
            Tem certeza que deseja <strong style={{ color: "#ff4444" }}>recusar</strong> este post?
            <br />
            <br />
            <Box
              component="span"
              sx={{
                display: "block",
                p: 2,
                mt: 2,
                backgroundColor: "rgba(255, 68, 68, 0.1)",
                borderRadius: 2,
                border: "1px solid rgba(255, 68, 68, 0.2)",
              }}
            >
              O post será recusado e não será publicado no feed.
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setConfirmRejectOpen(false)}
            disabled={rejecting}
            sx={{
              color: "rgba(255,255,255,0.7)",
              textTransform: "none",
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReject}
            disabled={rejecting}
            variant="contained"
            startIcon={rejecting ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <Cancel />}
            sx={{
              backgroundColor: "#ff4444",
              color: "white",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#cc0000",
              },
            }}
          >
            {rejecting ? "Recusando..." : "Recusar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

