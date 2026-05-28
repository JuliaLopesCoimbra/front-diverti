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
  Avatar,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import {
  createLineupItem,
  updateLineupItem,
  getLineupItem,
  notifyLineupUpdated,
  CreateLineupItemData,
  UpdateLineupItemData,
} from "@/app/services/lineup/lineupService";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import NotifyLineupModal from "./NotifyLineupModal";

interface CreateLineupItemFormProps {
  eventId: number;
  lineupItemId?: number; // Se fornecido, está editando
  onSuccess?: () => void;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object") {
    const apiError = error as {
      message?: string;
      response?: { data?: { detail?: string } };
    };
    return apiError.response?.data?.detail || apiError.message || fallback;
  }

  return fallback;
};

const focusedInputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#fff",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.2)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.3)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#ffffff",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.7)",
    "&.Mui-focused": {
      color: "#ffffff",
    },
  },
};

export default function CreateLineupItemForm({
  eventId,
  lineupItemId,
  onSuccess,
}: CreateLineupItemFormProps) {
  const [artistName, setArtistName] = useState("");
  const [performanceTime, setPerformanceTime] = useState("");
  const [performanceEndTime, setPerformanceEndTime] = useState("");
  const [stage, setStage] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [artistImage, setArtistImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();
  const isEditing = !!lineupItemId;

  useEffect(() => {
    if (isEditing && lineupItemId) {
      const fetchData = async () => {
        try {
          setLoadingData(true);
          const item = await getLineupItem(lineupItemId);
          setArtistName(item.artist_name);
          setPerformanceTime(item.performance_time.substring(0, 5)); // HH:mm
          setPerformanceEndTime(item.performance_end_time ? item.performance_end_time.substring(0, 5) : ""); // HH:mm
          setStage(item.stage || "");
          setEventDate(item.event_date || ""); // YYYY-MM-DD
          setDescription(item.description || "");
          if (item.artist_image_url) {
            setPreview(item.artist_image_url);
          }
        } catch (err) {
          console.error("Erro ao buscar item:", err);
          showToast("Erro ao carregar dados do artista", "error");
        } finally {
          setLoadingData(false);
        }
      };
      fetchData();
    }
  }, [lineupItemId, isEditing, showToast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        showToast("A imagem é muito grande. Máximo de 5MB.", "error");
        return;
      }
      setArtistImage(file);
      setRemoveImage(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setRemoveImage(true);
    setPreview(null);
    setArtistImage(null);
  };

  const handleSubmit = async () => {
    if (!artistName.trim() || !performanceTime) {
      showToast("Preencha todos os campos obrigatórios", "error");
      return;
    }

    // Abre o modal de confirmação antes de salvar
    setNotifyModalOpen(true);
  };

  const handleConfirmSubmit = async (shouldNotify: boolean) => {
    setNotifyModalOpen(false);
    setLoading(true);
    
    try {
      if (isEditing && lineupItemId) {
        const data: UpdateLineupItemData = {
          artist_name: artistName,
          performance_time: performanceTime,
          performance_end_time: performanceEndTime || undefined,
          stage: stage || undefined,
          event_date: eventDate || undefined,
          artist_image: artistImage || undefined,
          remove_image: removeImage,
          description: description || undefined,
        };
        await updateLineupItem(lineupItemId, data);
        showToast("Artista atualizado com sucesso!", "success");
      } else {
        const data: CreateLineupItemData = {
          event_id: eventId,
          artist_name: artistName,
          performance_time: performanceTime,
          performance_end_time: performanceEndTime || undefined,
          stage: stage || undefined,
          event_date: eventDate || undefined,
          artist_image: artistImage || undefined,
          description: description || undefined,
        };
        await createLineupItem(data);
        showToast("Artista criado com sucesso!", "success");
      }

      // Se o usuário marcou o checkbox, envia a notificação
      if (shouldNotify) {
        try {
          await notifyLineupUpdated(eventId);
          showToast("Notificações enviadas com sucesso!", "success");
        } catch (notifyErr) {
          console.error("Erro ao enviar notificações:", notifyErr);
          // Não quebra o fluxo se a notificação falhar
          showToast("Artista salvo, mas houve um erro ao enviar notificações", "warning");
        }
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/pages/admin/events/${eventId}/lineup`);
      }
    } catch (err) {
      console.error("Erro ao salvar artista:", err);
      showToast(getErrorMessage(err, "Erro ao salvar artista"), "error");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
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
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 3,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <IconButton
          onClick={() => router.push(`/pages/admin/events/${eventId}/lineup`)}
          sx={{ color: "#fff" }}
        >
          <ArrowBackIosIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>
          {isEditing ? "Editar Artista" : "Adicionar Artista"}
        </Typography>
      </Box>

      {/* Form */}
      <Box
        sx={{
          flex: 1,
          p: 3,
          maxWidth: 800,
          mx: "auto",
          width: "100%",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: 3,
            p: 4,
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Nome do Artista */}
            <TextField
              fullWidth
              label="Nome do Artista"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              required
              sx={focusedInputSx}
            />

            {/* Horário de Início */}
            <TextField
              fullWidth
              label="Horário de Início (HH:mm)"
              type="time"
              value={performanceTime}
              onChange={(e) => setPerformanceTime(e.target.value)}
              required
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                step: 300, // 5 minutos
              }}
              sx={{
                ...focusedInputSx,
                "& .MuiOutlinedInput-root": {
                  ...focusedInputSx["& .MuiOutlinedInput-root"],
                  "& input": {
                    "&::-webkit-calendar-picker-indicator": {
                      filter: "invert(1)",
                      cursor: "pointer",
                    },
                  },
                },
              }}
            />

            {/* Horário de Término */}
            <TextField
              fullWidth
              label="Horário de Término (HH:mm)"
              type="time"
              value={performanceEndTime}
              onChange={(e) => setPerformanceEndTime(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                step: 300, // 5 minutos
              }}
              sx={{
                ...focusedInputSx,
                "& .MuiOutlinedInput-root": {
                  ...focusedInputSx["& .MuiOutlinedInput-root"],
                  "& input": {
                    "&::-webkit-calendar-picker-indicator": {
                      filter: "invert(1)",
                      cursor: "pointer",
                    },
                  },
                },
              }}
            />

            {/* Palco */}
            <TextField
              fullWidth
              label="Palco"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              placeholder="Ex: Palco Principal, Palco 2, etc."
              sx={focusedInputSx}
            />

            {/* Data do Evento */}
            <TextField
              fullWidth
              label="Data do Evento"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                ...focusedInputSx,
                "& .MuiOutlinedInput-root": {
                  ...focusedInputSx["& .MuiOutlinedInput-root"],
                  "& input": {
                    "&::-webkit-calendar-picker-indicator": {
                      filter: "invert(1)",
                      cursor: "pointer",
                    },
                  },
                },
              }}
            />

            {/* Descrição */}
            <TextField
              fullWidth
              label="Descrição"
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={focusedInputSx}
            />

            {/* Foto do Artista */}
            <Box>
              <Typography sx={{ mb: 2, color: "rgba(255,255,255,0.7)" }}>
                Foto do Artista
              </Typography>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
                id="artist-image-input"
              />
              <label htmlFor="artist-image-input">
                <Button
                  variant="outlined"
                  component="span"
                  sx={{
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.2)",
                    mb: 2,
                    "&:hover": {
                      borderColor: "#ffc91f",
                    },
                  }}
                >
                  Selecionar Imagem
                </Button>
              </label>
              {preview && (
                <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                  <Avatar
                    src={preview}
                    alt="Preview"
                    sx={{
                      width: 150,
                      height: 150,
                      border: "3px solid rgba(255, 201, 31, 0.3)",
                    }}
                  />
                  <Button
                    size="small"
                    onClick={handleRemoveImage}
                    sx={{ color: "#ff3040" }}
                  >
                    Remover Imagem
                  </Button>
                </Box>
              )}
            </Box>

            {/* Botões */}
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button
                onClick={() => router.push(`/pages/admin/events/${eventId}/lineup`)}
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  borderColor: "rgba(255,255,255,0.2)",
                }}
                variant="outlined"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={loading}
                sx={{
                  flex: 1,
                  backgroundColor: "#ffffff",
                  color: "#fff",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "rgb(220, 20, 22)",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={20} sx={{ color: "#fff" }} />
                ) : isEditing ? (
                  "Atualizar"
                ) : (
                  "Criar"
                )}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Modal de Notificação */}
      <NotifyLineupModal
        open={notifyModalOpen}
        onClose={() => {
          setNotifyModalOpen(false);
        }}
        onConfirm={handleConfirmSubmit}
        loading={loading}
      />
    </Box>
  );
}


