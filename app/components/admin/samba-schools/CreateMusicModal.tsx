"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from "@mui/material";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import {
  createMusicLyricsForSambaSchool,
  updateMusicLyricsForSambaSchool,
  CreateMusicLyricsData,
  MusicLyricsResponse,
} from "@/app/services/musicLyrics/musicLyricsService";
import { useToast } from "@/app/context/ToastContext";

interface CreateMusicModalProps {
  open: boolean;
  onClose: () => void;
  sambaSchoolId: number;
  onSuccess?: () => void;
  existingMusic?: MusicLyricsResponse | null;
}

export default function CreateMusicModal({
  open,
  onClose,
  sambaSchoolId,
  onSuccess,
  existingMusic,
}: CreateMusicModalProps) {
  const [songName, setSongName] = useState("");
  const [singer, setSinger] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const isEditMode = !!existingMusic;

  // Carregar dados da música existente se estiver editando
  useEffect(() => {
    if (open && existingMusic) {
      setSongName(existingMusic.song_name);
      setSinger(existingMusic.singer || "");
      setLyrics(existingMusic.lyrics);
      if (existingMusic.image_url) {
        setPreview(existingMusic.image_url);
      }
    }
  }, [open, existingMusic]);

  // Resetar formulário quando fechar
  useEffect(() => {
    if (!open) {
      setSongName("");
      setSinger("");
      setLyrics("");
      setImage(null);
      setPreview(null);
    }
  }, [open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!songName.trim()) {
      showToast("O nome da música é obrigatório", "error");
      return;
    }

    if (!lyrics.trim()) {
      showToast("A letra da música é obrigatória", "error");
      return;
    }

    setLoading(true);

    try {
      const data: CreateMusicLyricsData = {
        song_name: songName.trim(),
        singer: singer.trim() || undefined,
        lyrics: lyrics.trim(),
        image: image || undefined,
      };

      if (isEditMode && existingMusic) {
        await updateMusicLyricsForSambaSchool(
          sambaSchoolId,
          existingMusic.id,
          data
        );
        showToast("Música/Letra atualizada com sucesso!", "success");
      } else {
        await createMusicLyricsForSambaSchool(sambaSchoolId, data);
        showToast("Música/Letra criada com sucesso!", "success");
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail || "Erro ao salvar música/letra";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
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
          alignItems: "center",
          gap: 2,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          pb: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: "rgba(255, 201, 31, 0.1)",
          }}
        >
          <MusicNoteIcon sx={{ color: "#ffc91f", fontSize: 28 }} />
        </Box>
        <Typography fontWeight={600} sx={{ fontSize: "1.25rem" }}>
          {isEditMode ? "Editar Música/Letra" : "Adicionar Música/Letra"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            <TextField
              fullWidth
              label="Nome da Música *"
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              disabled={loading}
              required
              variant="standard"
              sx={{
                "& .MuiInput-underline:before": {
                  borderBottomColor: "rgba(255,255,255,0.2)",
                },
                "& .MuiInput-underline:hover:before": {
                  borderBottomColor: "rgba(255,255,255,0.3)",
                },
                "& .MuiInput-underline:after": {
                  borderBottomColor: "#ffc91f",
                },
                "& .MuiInputBase-input": {
                  color: "#fff",
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255,255,255,0.6)",
                  "&.Mui-focused": {
                    color: "#ffc91f",
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Cantor/Intérprete"
              value={singer}
              onChange={(e) => setSinger(e.target.value)}
              disabled={loading}
              variant="standard"
              sx={{
                "& .MuiInput-underline:before": {
                  borderBottomColor: "rgba(255,255,255,0.2)",
                },
                "& .MuiInput-underline:hover:before": {
                  borderBottomColor: "rgba(255,255,255,0.3)",
                },
                "& .MuiInput-underline:after": {
                  borderBottomColor: "#ffc91f",
                },
                "& .MuiInputBase-input": {
                  color: "#fff",
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255,255,255,0.6)",
                  "&.Mui-focused": {
                    color: "#ffc91f",
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Letra da Música *"
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              multiline
              rows={6}
              disabled={loading}
              required
              variant="standard"
              sx={{
                "& .MuiInput-underline:before": {
                  borderBottomColor: "rgba(255,255,255,0.2)",
                },
                "& .MuiInput-underline:hover:before": {
                  borderBottomColor: "rgba(255,255,255,0.3)",
                },
                "& .MuiInput-underline:after": {
                  borderBottomColor: "#ffc91f",
                },
                "& .MuiInputBase-input": {
                  color: "#fff",
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255,255,255,0.6)",
                  "&.Mui-focused": {
                    color: "#ffc91f",
                  },
                },
              }}
            />

            <Box>
              <Typography
                variant="body2"
                sx={{ mb: 1.5, color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}
              >
                Imagem da Música
              </Typography>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="music-image-upload-modal"
                type="file"
                onChange={handleImageChange}
                disabled={loading}
              />
              <label htmlFor="music-image-upload-modal">
                <Button
                  variant="outlined"
                  component="span"
                  disabled={loading}
                  fullWidth
                  sx={{
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    py: 1.5,
                    textTransform: "none",
                    borderRadius: "14px",
                    "&:hover": {
                      borderColor: "#ffc91f",
                      backgroundColor: "rgba(255,201,31,0.1)",
                    },
                  }}
                >
                  {preview ? "Alterar Imagem" : "Selecionar Imagem"}
                </Button>
              </label>
              {preview && (
                <Box
                  component="img"
                  src={preview}
                  alt="Preview"
                  sx={{
                    mt: 2,
                    maxWidth: "100%",
                    maxHeight: 200,
                    objectFit: "contain",
                    borderRadius: 2,
                  }}
                />
              )}
            </Box>
          </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2.5,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            color: "rgba(255,255,255,0.7)",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.05)",
            },
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !songName.trim() || !lyrics.trim()}
          sx={{
            backgroundColor: "rgb(255, 31, 33)",
            color: "#fff",
            fontWeight: 600,
            textTransform: "none",
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
            <CircularProgress size={24} sx={{ color: "#fff" }} />
          ) : isEditMode ? (
            "Atualizar"
          ) : (
            "Adicionar"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


