"use client";
import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  IconButton,
  Paper,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import {
  createMusicLyrics,
  CreateMusicLyricsData,
} from "@/app/services/musicLyrics/musicLyricsService";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";

interface CreateMusicLyricsFormProps {
  eventId: number;
  onSuccess?: () => void;
}

export default function CreateMusicLyricsForm({
  eventId,
  onSuccess,
}: CreateMusicLyricsFormProps) {
  const [songName, setSongName] = useState("");
  const [singer, setSinger] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

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

      await createMusicLyrics(eventId, data);
      showToast("Música/Letra criada com sucesso!", "success");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/pages/admin/events/${eventId}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Erro ao criar música/letra", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        height: "100vh",
        overflowY: "auto",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header com botão de voltar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 2,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          position: "sticky",
          top: 0,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(10px)",
          zIndex: 10,
        }}
      >
        <IconButton
          onClick={() => router.back()}
          size="small"
          sx={{ color: "#fff" }}
        >
          <ArrowBackIosIcon />
        </IconButton>
        <Typography fontWeight={700} sx={{ color: "#fff", fontSize: "1.2rem" }}>
          Criar Nova Música/Letra
        </Typography>
      </Box>

      {/* Formulário */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          flex: 1,
          p: 3,
          maxWidth: 700,
          width: "100%",
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: 3,
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
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
                fontSize: "1rem",
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
                fontSize: "1rem",
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
            rows={8}
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
                fontSize: "1rem",
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
              id="music-lyrics-image-upload"
              type="file"
              onChange={handleImageChange}
              disabled={loading}
            />
            <label htmlFor="music-lyrics-image-upload">
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
        </Paper>

        <Box display="flex" gap={2} mt={2}>
          <Button
            variant="outlined"
            onClick={() => router.back()}
            disabled={loading}
            sx={{
              flex: 1,
              borderColor: "rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.7)",
              textTransform: "none",
              borderRadius: "14px",
              py: 1.5,
              "&:hover": {
                borderColor: "rgba(255,255,255,0.3)",
                backgroundColor: "rgba(255,255,255,0.05)",
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !songName.trim() || !lyrics.trim()}
            sx={{
              flex: 1,
              backgroundColor: "#ffc91f",
              color: "#000",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "14px",
              py: 1.5,
              "&:hover": {
                backgroundColor: "#e6b800",
              },
              "&:disabled": {
                backgroundColor: "rgba(255,201,31,0.3)",
                color: "rgba(0,0,0,0.3)",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "#000" }} />
            ) : (
              "Criar Música/Letra"
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

