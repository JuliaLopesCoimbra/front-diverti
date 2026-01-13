"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
} from "@mui/material";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SchoolIcon from '@mui/icons-material/School';
import { 
  getEventById, 
  EventResponse, 
  deleteEvent 
} from "@/app/services/events/eventService";
import {
  getSambaSchoolsByEvent,
  SambaSchoolResponse,
} from "@/app/services/sambaSchools/sambaSchoolService";
import {
  getMusicLyricsByEvent,
  MusicLyricsResponse,
} from "@/app/services/musicLyrics/musicLyricsService";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import DeleteEventModal from "@/app/components/admin/events/DeleteEventModal";
import { formatEventDates } from "@/app/utils/eventDateFormatter";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.id);
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState<EventResponse | null>(null);
  const [schools, setSchools] = useState<SambaSchoolResponse[]>([]);
  const [musics, setMusics] = useState<MusicLyricsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
      try {
        const data = await getEventById(eventId);
        setEvent(data);
      } catch (err) {
        console.error("Erro ao buscar evento", err);
        showToast("Erro ao carregar evento", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, showToast]);

  useEffect(() => {
    if (!eventId) return;

    const fetchSchoolsAndMusics = async () => {
      try {
        setLoadingSchools(true);
        const [schoolsData, musicsData] = await Promise.all([
          getSambaSchoolsByEvent(eventId),
          getMusicLyricsByEvent(eventId),
        ]);
        setSchools(schoolsData);
        setMusics(musicsData);
      } catch (err) {
        console.error("Erro ao buscar escolas e músicas", err);
      } finally {
        setLoadingSchools(false);
      }
    };

    fetchSchoolsAndMusics();
  }, [eventId]);

  const handleDelete = async () => {
    if (!event) return;

    setDeleting(true);
    try {
      await deleteEvent(eventId);
      showToast("Evento excluído com sucesso!", "success");
      setDeleteModalOpen(false);
      router.push("/pages/user/home");
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Erro ao excluir evento", "error");
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

  if (!event) {
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
        <Typography>Evento não encontrado.</Typography>
        <IconButton onClick={() => router.push("/pages/user/home")} sx={{ color: "#fff" }}>
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
        backgroundImage: "url(/background/dashboard.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
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
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(10px)",
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
          <Typography  fontWeight={700} sx={{ color: "#fff", fontSize: "1.2rem" }}>
            Detalhes do Evento
          </Typography>
        </Box>

        {/* BOTÕES ADMIN */}
        {isAdmin && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              onClick={() => router.push(`/pages/admin/events/${eventId}/edit`)}
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
        {/* Banner */}
        {event.banner_image && (
          <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
            <Box
              component="img"
              src={event.banner_image}
              alt={event.title}
              sx={{
                width: 200,
                height: 200,
                objectFit: "cover",
                borderRadius: "50%",
                border: "3px solid rgba(255, 201, 31, 0.3)",
              }}
            />
          </Box>
        )}

        {/* Card Principal */}
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: 3,
            p: 3,
            maxWidth: 900,
            mx: "auto",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* TÍTULO + STATUS */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography variant="h4" fontWeight={700} sx={{ color: "#fff" }}>
              {event.title}
            </Typography>

            <Chip
              label={event.is_active ? "Ativo" : "Inativo"}
              sx={{
                backgroundColor: event.is_active
                  ? "rgba(46, 204, 113, 0.2)"
                  : "rgba(158, 158, 158, 0.2)",
                color: event.is_active ? "#2ecc71" : "#9e9e9e",
                fontWeight: 600,
                border: `1px solid ${event.is_active ? "rgba(46, 204, 113, 0.3)" : "rgba(158, 158, 158, 0.3)"}`,
              }}
            />
          </Box>

          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.1)" }} />

          {/* DESCRIÇÃO */}
          <Box sx={{ mb: 3 }}>
            <Typography fontWeight={600} mb={1.5} sx={{ color: "#ffc91f", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Descrição
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
              {event.description || "Sem descrição"}
            </Typography>
          </Box>

          {/* LOCALIZAÇÃO */}
          {event.location && (
            <Box sx={{ mb: 3 }}>
              <Typography fontWeight={600} mb={1.5} sx={{ color: "#ffc91f", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Localização
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                {event.location}
              </Typography>
            </Box>
          )}

          {/* DATAS */}
          <Box sx={{ mb: 3 }}>
            <Typography fontWeight={600} mb={1.5} sx={{ color: "#ffc91f", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Datas do Evento
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: "1rem", lineHeight: 1.6 }}>
              {formatEventDates(event)}
            </Typography>
          </Box>

          {/* HORÁRIOS */}
          {event.starts_at && event.ends_at && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <Box>
                <Typography fontWeight={600} mb={1.5} sx={{ color: "#ffc91f", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Horário de Início
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                  {new Date(event.starts_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Box>

              <Box>
                <Typography fontWeight={600} mb={1.5} sx={{ color: "#ffc91f", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Horário de Término
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                  {new Date(event.ends_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>

        {/* AÇÕES ADMIN - CRIAR ESCOLA DE SAMBA E MÚSICA/LETRA */}
        {isAdmin && (
          <Box
            sx={{
              maxWidth: 900,
              mx: "auto",
              mt: 3,
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="contained"
              startIcon={<SchoolIcon />}
              onClick={() => router.push(`/pages/admin/samba-schools/create/${eventId}`)}
              sx={{
                flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 8px)" },
                backgroundColor: "#ffc91f",
                color: "#000",
                fontWeight: 600,
                py: 1.5,
                borderRadius: "14px",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#e6b800",
                },
              }}
            >
              Adicionar Escola de Samba
            </Button>
            <Button
              variant="contained"
              startIcon={<MusicNoteIcon />}
              onClick={() => router.push(`/pages/admin/music-lyrics/create/${eventId}`)}
              sx={{
                flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 8px)" },
                backgroundColor: "#ffc91f",
                color: "#000",
                fontWeight: 600,
                py: 1.5,
                borderRadius: "14px",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#e6b800",
                },
              }}
            >
              Adicionar Música/Letra
            </Button>
          </Box>
        )}

        {/* LISTA DE ESCOLAS DE SAMBA */}
        <Box
          sx={{
            maxWidth: 900,
            mx: "auto",
            mt: 4,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight={700} sx={{ color: "#fff" }}>
              <SchoolIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              Escolas de Samba
            </Typography>
          </Box>

          {loadingSchools ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress sx={{ color: "#ffc91f" }} />
            </Box>
          ) : schools.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                p: 3,
                textAlign: "center",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
                Nenhuma escola de samba cadastrada.
              </Typography>
            </Paper>
          ) : (
            schools.map((school) => (
              <Paper
                key={school.id}
                elevation={0}
                sx={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  p: 2,
                  mb: 2,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    transform: "translateY(-2px)",
                    border: "1px solid rgba(255, 201, 31, 0.3)",
                  },
                }}
                onClick={() =>
                  router.push(
                    `/pages/admin/samba-schools/${eventId}/${school.id}`
                  )
                }
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {school.image_url && (
                    <Box
                      component="img"
                      src={school.image_url}
                      alt={school.name}
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      sx={{ color: "#fff", mb: 0.5 }}
                    >
                      {school.name}
                    </Typography>
                    {school.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(255,255,255,0.7)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {school.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))
          )}
        </Box>

        {/* LISTA DE MÚSICAS/LETRAS */}
        <Box
          sx={{
            maxWidth: 900,
            mx: "auto",
            mt: 4,
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight={700} sx={{ color: "#fff" }}>
              <MusicNoteIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              Músicas/Letras
            </Typography>
          </Box>

          {loadingSchools ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress sx={{ color: "#ffc91f" }} />
            </Box>
          ) : musics.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                p: 3,
                textAlign: "center",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
                Nenhuma música/letra cadastrada.
              </Typography>
            </Paper>
          ) : (
            musics.map((music) => (
              <Paper
                key={music.id}
                elevation={0}
                sx={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  p: 2,
                  mb: 2,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    transform: "translateY(-2px)",
                    border: "1px solid rgba(255, 201, 31, 0.3)",
                  },
                }}
                onClick={() =>
                  router.push(
                    `/pages/admin/music-lyrics/${eventId}/${music.id}`
                  )
                }
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {music.image_url && (
                    <Box
                      component="img"
                      src={music.image_url}
                      alt={music.song_name}
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      sx={{ color: "#fff", mb: 0.5 }}
                    >
                      {music.song_name}
                    </Typography>
                    {music.singer && (
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.7)", mb: 0.5 }}
                      >
                        Cantor: {music.singer}
                      </Typography>
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255,255,255,0.6)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {music.lyrics}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ))
          )}
        </Box>
      </Box>

      {/* Modal de Exclusão */}
      {event && (
        <DeleteEventModal
          open={deleteModalOpen}
          eventTitle={event.title}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </Box>
  );
}
