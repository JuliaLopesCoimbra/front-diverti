"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { updateNews, NewsDetailsResponse } from "@/app/services/news/newsService";
import { useToast } from "@/app/context/ToastContext";

interface Props {
  open: boolean;
  eventId: number;
  news: NewsDetailsResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditNewsModal({
  open,
  eventId,
  news,
  onClose,
  onSuccess,
}: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Preenche os campos quando a news é carregada
  useEffect(() => {
    if (news && open) {
      setTitle(news.title);
      setContent(news.content);
      setImagePreview(news.images[0]?.image_url || null);
      setImage(null); // Reset da nova imagem
    }
  }, [news, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!news) return;

    if (!title.trim()) {
      showToast("O título é obrigatório", "error");
      return;
    }

    if (!content.trim()) {
      showToast("O conteúdo é obrigatório", "error");
      return;
    }

    setLoading(true);

    try {
      await updateNews(eventId, news.id, {
        title: title.trim(),
        content: content.trim(),
        images: image ? [image] : undefined,
      });

      showToast("Notícia atualizada com sucesso!", "success");
      
      // Limpa o formulário
      setImage(null);
      
      onSuccess();
      onClose();
    } catch (error: any) {
      const message =
        error.response?.data?.detail || "Erro ao atualizar notícia";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setImage(null);
      onClose();
    }
  };

  if (!news) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {},
        root: {
          sx: {
            zIndex: 1600,
          },
        },
      }}
      PaperProps={{
        sx: {
          backgroundColor: "#1a1a1a",
          color: "#fff",
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          pb: 2,
          fontWeight: 600,
        }}
      >
        Editar Notícia
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ minWidth: "auto", p: 0.5, color: "#fff" }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Título */}
            <TextField
              label="Título"
              value={title}
              onChange={(e) => {
                const newValue = e.target.value;
                if (newValue.length <= 100) {
                  setTitle(newValue);
                }
              }}
              required
              fullWidth
              disabled={loading}
              inputProps={{
                maxLength: 100,
              }}
              helperText={`${title.length}/100 caracteres`}
              FormHelperTextProps={{
                sx: {
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "0.875rem",
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.1)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#ffc91f",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255,255,255,0.7)",
                  "&.Mui-focused": {
                    color: "#ffc91f",
                  },
                },
                "& .MuiInputBase-input": {
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                },
              }}
            />

            {/* Conteúdo */}
            <TextField
              label="Conteúdo"
              value={content}
              onChange={(e) => {
                const newValue = e.target.value;
                if (newValue.length <= 2000) {
                  setContent(newValue);
                }
              }}
              required
              fullWidth
              multiline
              rows={6}
              disabled={loading}
              inputProps={{
                maxLength: 2000,
              }}
              helperText={`${content.length}/2000 caracteres`}
              FormHelperTextProps={{
                sx: {
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "0.875rem",
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.1)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#ffc91f",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255,255,255,0.7)",
                  "&.Mui-focused": {
                    color: "#ffc91f",
                  },
                },
                "& .MuiInputBase-input": {
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                },
              }}
            />

            {/* Upload de imagem */}
            <Box>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="edit-image-upload"
                type="file"
                onChange={handleImageChange}
                disabled={loading}
              />
              <label htmlFor="edit-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  disabled={loading}
                  fullWidth
                  sx={{
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    py: 1.5,
                    "&:hover": {
                      borderColor: "#ffc91f",
                      backgroundColor: "rgba(255,201,31,0.1)",
                    },
                  }}
                >
                  {image ? "Alterar Imagem" : "Trocar Imagem (Opcional)"}
                </Button>
              </label>

              {imagePreview && (
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Preview"
                  sx={{
                    width: "100%",
                    maxHeight: "200px",
                    objectFit: "cover",
                    borderRadius: 1,
                    mt: 2,
                  }}
                />
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            p: 2,
            gap: 1,
          }}
        >
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{
              color: "rgba(255,255,255,0.7)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.05)",
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !title.trim() || !content.trim()}
            sx={{
              backgroundColor: "rgb(255, 31, 33)",
              color: "#fff",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "rgb(220, 20, 22)",
              },
              "&:disabled": {
                backgroundColor: "rgba(255,201,31,0.3)",
                color: "rgba(0,0,0,0.3)",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "#fff" }} />
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}


