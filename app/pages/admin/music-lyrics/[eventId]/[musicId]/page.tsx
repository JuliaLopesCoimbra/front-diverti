"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Paper,
  Divider,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  getMusicLyricsById,
  MusicLyricsResponse,
  deleteMusicLyrics,
} from "@/app/services/musicLyrics/musicLyricsService";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import DeleteMusicLyricsModal from "@/app/components/admin/music-lyrics/DeleteMusicLyricsModal";

export default function MusicLyricsDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.eventId);
  const musicId = Number(params.musicId);
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [music, setMusic] = useState<MusicLyricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!eventId || !musicId) return;

    const fetchMusic = async () => {
      try {
        const data = await getMusicLyricsById(eventId, musicId);
        setMusic(data);
      } catch (err) {
        console.error("Erro ao buscar música/letra", err);
        showToast("Erro ao carregar música/letra", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchMusic();
  }, [eventId, musicId, showToast]);

  const handleDelete = async () => {
    if (!music) return;

    setDeleting(true);
    try {
      await deleteMusicLyrics(eventId, musicId);
      showToast("Música/Letra excluída com sucesso!", "success");
      setDeleteModalOpen(false);
      router.push(`/pages/admin/events/${eventId}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Erro ao excluir música/letra", "error");
      }
      throw err; // Re-throw para o modal tratar
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
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

  if (!music) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#000",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography>Música/Letra não encontrada.</Typography>
        <IconButton
          onClick={() => router.push("/pages/user/home")}
          sx={{ color: "#fff" }}
        >
          <ArrowBackIosIcon />
        </IconButton>
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
          justifyContent: "space-between",
          p: 2,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          position: "sticky",
          top: 0,
          backgroundColor: "#000",
          zIndex: 10,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton
            onClick={() => router.push("/pages/user/home")}
            size="small"
            sx={{ color: "#fff" }}
          >
            <ArrowBackIosIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={700} sx={{ color: "#fff" }}>
            Detalhes da Música/Letra
          </Typography>
        </Box>

        {/* BOTÕES ADMIN */}
        {isAdmin && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              onClick={() =>
                router.push(
                  `/pages/admin/music-lyrics/${eventId}/${musicId}/edit`
                )
              }
              sx={{ color: "#ffc91f" }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={() => setDeleteModalOpen(true)}
              disabled={deleting}
              sx={{ color: "#ff3040" }}
            >
              {deleting ? (
                <CircularProgress size={20} sx={{ color: "#ff3040" }} />
              ) : (
                <DeleteIcon />
              )}
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Conteúdo */}
      <Box sx={{ p: 3, flex: 1 }}>
        {/* Imagem */}
        {music.image_url && (
          <Box mb={3} display="flex" justifyContent="center">
            <Box
              component="img"
              src={music.image_url}
              alt={music.song_name}
              sx={{
                width: 280,
                height: 280,
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          </Box>
        )}

        {/* Card Principal */}
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 2,
            p: 3,
            maxWidth: 900,
            mx: "auto",
          }}
        >
          {/* TÍTULO */}
          <Typography variant="h4" fontWeight={700} sx={{ color: "#fff", mb: 2 }}>
            {music.song_name}
          </Typography>

          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.1)" }} />

          {/* CANTOR */}
          {music.singer && (
            <Box mb={3}>
              <Typography fontWeight={600} mb={1} sx={{ color: "#ffc91f" }}>
                Cantor/Intérprete
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.9)" }}>
                {music.singer}
              </Typography>
            </Box>
          )}

          {/* LETRA */}
          <Box mb={3}>
            <Typography fontWeight={600} mb={1} sx={{ color: "#ffc91f" }}>
              Letra da Música
            </Typography>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.9)",
                whiteSpace: "pre-wrap",
                lineHeight: 1.8,
              }}
            >
              {music.lyrics}
            </Typography>
          </Box>

          {/* DATA DE CRIAÇÃO */}
          <Box>
            <Typography fontWeight={600} mb={1} sx={{ color: "#ffc91f" }}>
              Data de Criação
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.9)" }}>
              {new Date(music.created_at).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Modal de Exclusão */}
      {music && (
        <DeleteMusicLyricsModal
          open={deleteModalOpen}
          songName={music.song_name}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </Box>
  );
}



