"use client";
import { useState, useEffect } from "react";
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
  updateMusicLyrics,
  UpdateMusicLyricsData,
  MusicLyricsResponse,
  getMusicLyricsById,
} from "@/app/services/musicLyrics/musicLyricsService";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";

interface EditMusicLyricsFormProps {
  eventId: number;
  musicId: number;
  onSuccess?: () => void;
}

export default function EditMusicLyricsForm({
  eventId,
  musicId,
  onSuccess,
}: EditMusicLyricsFormProps) {
  const [songName, setSongName] = useState("");
  const [singer, setSinger] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMusic, setLoadingMusic] = useState(true);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loadMusic = async () => {
      try {
        setLoadingMusic(true);
        const music = await getMusicLyricsById(eventId, musicId);
        setSongName(music.song_name);
        setSinger(music.singer || "");
        setLyrics(music.lyrics);
        if (music.image_url) {
          setPreview(music.image_url);
        }
      } catch (err) {
        showToast("Erro ao carregar música/letra", "error");
        router.push("/pages/user/home");
      } finally {
        setLoadingMusic(false);
      }
    };

    loadMusic();
  }, [eventId, musicId, showToast, router]);

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
      const data: UpdateMusicLyricsData = {
        song_name: songName.trim(),
        singer: singer.trim() || undefined,
        lyrics: lyrics.trim(),
        image: image || undefined,
      };

      await updateMusicLyrics(eventId, musicId, data);
      showToast("Música/Letra atualizada com sucesso!", "success");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/pages/admin/music-lyrics/${eventId}/${musicId}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Erro ao atualizar música/letra", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingMusic) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#000",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress sx={{ color: "#ffc91f" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        height: "100vh",
        overflowY: "auto",
        backgroundColor: "#000",
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
          backgroundColor: "#000",
          zIndex: 10,
        }}
      >
        <IconButton
          onClick={() => router.push("/pages/user/home")}
          size="small"
          sx={{ color: "#fff" }}
        >
          <ArrowBackIosIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700} sx={{ color: "#fff" }}>
          Editar Música/Letra
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
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 2,
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            label="Nome da Música *"
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
            disabled={loading}
            required
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
            }}
          />

          <TextField
            fullWidth
            label="Cantor/Intérprete"
            value={singer}
            onChange={(e) => setSinger(e.target.value)}
            disabled={loading}
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
            }}
          />

          <Box>
            <Typography
              variant="body2"
              sx={{ mb: 1, color: "rgba(255,255,255,0.7)" }}
            >
              Imagem da Música
            </Typography>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="music-lyrics-image-upload-edit"
              type="file"
              onChange={handleImageChange}
              disabled={loading}
            />
            <label htmlFor="music-lyrics-image-upload-edit">
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
                {preview ? "Alterar Imagem" : "Trocar Imagem (Opcional)"}
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

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => router.push("/pages/user/home")}
            disabled={loading}
            sx={{
              flex: 1,
              borderColor: "rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.7)",
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
              "Salvar Alterações"
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}



