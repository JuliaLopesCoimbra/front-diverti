"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  IconButton,
  Paper,
  Avatar,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import {
  getLineupItemsByEventAdmin,
  deleteLineupItem,
  LineupItemResponse,
} from "@/app/services/lineup/lineupService";
import {
  getParadeLineupItemsByEventAdmin,
  deleteParadeLineupItem,
  ParadeLineupItemResponse,
} from "@/app/services/paradeLineup/paradeLineupService";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import { getEventById } from "@/app/services/events/eventAppService";
import DeleteLineupItemModal from "@/app/components/admin/lineup/DeleteLineupItemModal";

export default function LineupManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.id);
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [lineupType, setLineupType] = useState<'shows' | 'parade'>('shows');
  const [lineupItems, setLineupItems] = useState<LineupItemResponse[]>([]);
  const [paradeLineupItems, setParadeLineupItems] = useState<ParadeLineupItemResponse[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<LineupItemResponse | ParadeLineupItemResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      router.push("/pages/user/home");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        if (lineupType === 'shows') {
          const [items, eventData] = await Promise.all([
            getLineupItemsByEventAdmin(eventId),
            getEventById(eventId),
          ]);
          setLineupItems(items);
          setEvent(eventData);
        } else {
          const [items, eventData] = await Promise.all([
            getParadeLineupItemsByEventAdmin(eventId),
            getEventById(eventId),
          ]);
          setParadeLineupItems(items);
          setEvent(eventData);
        }
      } catch (err: any) {
        console.error("Erro ao buscar dados:", err);
        showToast("Erro ao carregar lineup", "error");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchData();
    }
  }, [eventId, isAdmin, router, showToast, lineupType]);


  const handleDeleteClick = (item: LineupItemResponse | ParadeLineupItemResponse) => {
    setDeletingItem(item);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    setDeleting(true);
    try {
      if (lineupType === 'shows') {
        await deleteLineupItem((deletingItem as LineupItemResponse).id);
        showToast("Artista deletado com sucesso!", "success");
        const items = await getLineupItemsByEventAdmin(eventId);
        setLineupItems(items);
      } else {
        await deleteParadeLineupItem((deletingItem as ParadeLineupItemResponse).id);
        showToast("Escola de samba deletada com sucesso!", "success");
        const items = await getParadeLineupItemsByEventAdmin(eventId);
        setParadeLineupItems(items);
      }
      setDeleteModalOpen(false);
      setDeletingItem(null);
    } catch (err: any) {
      console.error("Erro ao deletar item:", err);
      throw err; // O modal vai tratar o erro
    } finally {
      setDeleting(false);
    }
  };

  const formatTime = (timeString: string): string => {
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          ...dashboardBackgroundSx,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
        ...dashboardBackgroundSx,
        color: "#fff",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          position: "relative",
        }}
      >
        <IconButton
          onClick={() => router.push(`/pages/admin/events/${eventId}`)}
          sx={{
            position: "absolute",
            left: 16,
            color: "#fff",
          }}
        >
          <ArrowBackIosIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>
          Gerenciar Line Up
        </Typography>
        {event && (
          <Typography sx={{ color: "rgba(255,255,255,0.7)", ml: 1 }}>
            - {event.title}
          </Typography>
        )}
      </Box>

      {/* Lista de Itens */}
      <Box sx={{ p: 3, position: "relative" }}>
        {/* Botões de Alternância */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 1, md: 1.5, lg: 2 },
            mb: 3,
            px: { xs: 1, sm: 2 },
            width: "100%",
          }}
        >
          <Button
            onClick={() => setLineupType('shows')}
            sx={{
              borderRadius: "999px",
              textTransform: "none",
              fontWeight: 600,
              lineHeight: 1.2,
              px: { xs: 1.5, md: 2, lg: 2.5 },
              minHeight: { xs: 40, md: 44, lg: 48 },
              height: { xs: 40, md: 44, lg: 48 },
              flex: 1,
              maxWidth: { xs: 200, md: 250 },
              fontSize: { xs: "0.875rem", md: "1rem", lg: "1.125rem" },
              // Ativo
              backgroundColor: lineupType === 'shows' ? "#ffc91f" : "transparent",
              color: lineupType === 'shows' ? "#000" : "#fff",
              border: `1px solid ${
                lineupType === 'shows' ? "#ffc91f" : "#fff"
              }`,
              "&:hover": {
                backgroundColor: lineupType === 'shows'
                  ? "#f5bf12"
                  : "rgba(255,255,255,0.1)",
                borderColor: lineupType === 'shows' ? "#f5bf12" : "#fff",
                fontWeight: 900,
              },
            }}
          >
            Line Up de Shows
          </Button>
          <Button
            onClick={() => setLineupType('parade')}
            sx={{
              borderRadius: "999px",
              textTransform: "none",
              fontWeight: 600,
              lineHeight: 1.2,
              px: { xs: 1.5, md: 2, lg: 2.5 },
              minHeight: { xs: 40, md: 44, lg: 48 },
              height: { xs: 40, md: 44, lg: 48 },
              flex: 1,
              maxWidth: { xs: 200, md: 250 },
              fontSize: { xs: "0.875rem", md: "1rem", lg: "1.125rem" },
              // Ativo
              backgroundColor: lineupType === 'parade' ? "#ffc91f" : "transparent",
              color: lineupType === 'parade' ? "#000" : "#fff",
              border: `1px solid ${
                lineupType === 'parade' ? "#ffc91f" : "#fff"
              }`,
              "&:hover": {
                backgroundColor: lineupType === 'parade'
                  ? "#f5bf12"
                  : "rgba(255,255,255,0.1)",
                borderColor: lineupType === 'parade' ? "#f5bf12" : "#fff",
                fontWeight: 900,
              },
            }}
          >
            Line Up de Desfile
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
            position: "relative",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "#fff",
              fontWeight: 100,
            }}
          >
            {lineupType === 'shows' ? 'Artistas que farão parte do Line Up' : 'Escolas de Samba que farão parte do Line Up de Desfile'}
          </Typography>
          <IconButton
            onClick={() => {
              if (lineupType === 'shows') {
                router.push(`/pages/admin/events/${eventId}/lineup/create`);
              } else {
                router.push(`/pages/admin/events/${eventId}/parade-lineup/create`);
              }
            }}
            sx={{
              backgroundColor: "#ffc91f",
              color: "#000",
              width: 48,
              height: 48,
              "&:hover": {
                backgroundColor: "#e6b800",
              },
            }}
          >
            <AddIcon />
          </IconButton>
        </Box>
        {lineupType === 'shows' ? (
          lineupItems.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                p: 4,
                textAlign: "center",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <MusicNoteIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.3)", mb: 2 }} />
              <Typography sx={{ color: "rgba(255,255,255,0.7)", mb: 2 }}>
                Nenhum artista cadastrado no lineup ainda.
              </Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {lineupItems.map((item) => (
              <Paper
                key={item.id}
                elevation={0}
                sx={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  p: 3,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 3,
                  position: "relative",
                }}
              >
                  <IconButton
                    onClick={() => handleDeleteClick(item)}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      color: "#ff3040",
                      "&:hover": {
                        backgroundColor: "rgba(255, 48, 64, 0.1)",
                      },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                <IconButton
                  onClick={() => router.push(`/pages/admin/events/${eventId}/lineup/${item.id}/edit`)}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 48,
                    color: "#ffc91f",
                    "&:hover": {
                      backgroundColor: "rgba(255, 201, 31, 0.1)",
                    },
                  }}
                >
                  <EditIcon />
                </IconButton>

                {/* Foto do Artista - Esquerda */}
                {item.artist_image_url ? (
                  <Avatar
                    src={item.artist_image_url}
                    alt={item.artist_name}
                    sx={{
                      width: 100,
                      height: 100,
                      border: "3px solid rgba(255, 201, 31, 0.3)",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      backgroundColor: "rgba(255, 201, 31, 0.2)",
                      border: "3px solid rgba(255, 201, 31, 0.3)",
                      flexShrink: 0,
                    }}
                  >
                    <MusicNoteIcon sx={{ fontSize: "2.5rem" }} />
                  </Avatar>
                )}

                {/* Informações - Direita */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    flex: 1,
                    pr: 8, // Padding para evitar sobreposição com os ícones
                    minWidth: 0, // Permite que o texto seja truncado
                  }}
                >
                  {/* Nome do Artista */}
                  <Typography
                    sx={{
                      color: "#fff",
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.artist_name}
                  </Typography>

                  {/* Horário */}
                  <Typography
                    sx={{
                      color: "#ffc91f",
                      fontSize: "1rem",
                      fontWeight: 500,
                    }}
                  >
                    {formatTime(item.performance_time)}
                  </Typography>

                  {/* Ordem */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    Ordem: {item.display_order}
                  </Typography>
                </Box>
              </Paper>
              ))}
            </Box>
          )
        ) : (
          paradeLineupItems.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                p: 4,
                textAlign: "center",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <MusicNoteIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.3)", mb: 2 }} />
              <Typography sx={{ color: "rgba(255,255,255,0.7)", mb: 2 }}>
                Nenhuma escola de samba cadastrada no lineup de desfile ainda.
              </Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {paradeLineupItems.map((item) => (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 3,
                    p: 3,
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 3,
                    position: "relative",
                  }}
                >
                  <IconButton
                    onClick={() => handleDeleteClick(item)}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      color: "#ff3040",
                      "&:hover": {
                        backgroundColor: "rgba(255, 48, 64, 0.1)",
                      },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => router.push(`/pages/admin/events/${eventId}/parade-lineup/${item.id}/edit`)}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 48,
                      color: "#ffc91f",
                      "&:hover": {
                        backgroundColor: "rgba(255, 201, 31, 0.1)",
                      },
                    }}
                  >
                    <EditIcon />
                  </IconButton>

                  {item.samba_school_image_url ? (
                    <Avatar
                      src={item.samba_school_image_url}
                      alt={item.samba_school_name}
                      sx={{
                        width: 100,
                        height: 100,
                        border: "3px solid rgba(255, 201, 31, 0.3)",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <Avatar
                      sx={{
                        width: 100,
                        height: 100,
                        backgroundColor: "rgba(255, 201, 31, 0.2)",
                        border: "3px solid rgba(255, 201, 31, 0.3)",
                        flexShrink: 0,
                      }}
                    >
                      <MusicNoteIcon sx={{ fontSize: "2.5rem" }} />
                    </Avatar>
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      flex: 1,
                      pr: 8,
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#fff",
                        fontSize: "1.25rem",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.samba_school_name || 'Escola de Samba'}
                    </Typography>

                    <Typography
                      sx={{
                        color: "#ffc91f",
                        fontSize: "1rem",
                        fontWeight: 500,
                      }}
                    >
                      {formatTime(item.performance_time)}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      Ordem: {item.display_order}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          )
        )}
      </Box>

      {/* Modal de Exclusão */}
      {deletingItem && (
        <DeleteLineupItemModal
          open={deleteModalOpen}
          artistName={lineupType === 'shows' ? (deletingItem as LineupItemResponse).artist_name : (deletingItem as ParadeLineupItemResponse).samba_school_name || 'Escola de Samba'}
          onClose={() => {
            setDeleteModalOpen(false);
            setDeletingItem(null);
          }}
          onConfirm={handleDeleteConfirm}
          loading={deleting}
        />
      )}
    </Box>
  );
}

