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
import MusicNoteIcon from "@mui/icons-material/MusicNote";
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

export default function CreateLineupItemForm({
  eventId,
  lineupItemId,
  onSuccess,
}: CreateLineupItemFormProps) {
  const [artistName, setArtistName] = useState("");
  const [performanceTime, setPerformanceTime] = useState("");
  const [displayOrder, setDisplayOrder] = useState<number | undefined>(undefined);
  const [originalDisplayOrder, setOriginalDisplayOrder] = useState<number | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [artistImage, setArtistImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
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
          setDisplayOrder(item.display_order);
          setOriginalDisplayOrder(item.display_order);
          setDescription(item.description || "");
          if (item.artist_image_url) {
            setPreview(item.artist_image_url);
          }
        } catch (err: any) {
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
    setPendingSubmit(true);
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
          // Só envia display_order se foi alterado
          display_order: displayOrder !== originalDisplayOrder ? displayOrder : undefined,
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
          display_order: displayOrder,
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
        } catch (notifyErr: any) {
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
    } catch (err: any) {
      console.error("Erro ao salvar artista:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Erro ao salvar artista";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
      setPendingSubmit(false);
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
              sx={{
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

            {/* Horário */}
            <TextField
              fullWidth
              label="Horário (HH:mm)"
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
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  "& input": {
                    "&::-webkit-calendar-picker-indicator": {
                      filter: "invert(1)",
                      cursor: "pointer",
                    },
                  },
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.3)",
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

            {/* Ordem de Exibição */}
            <TextField
              fullWidth
              label="Ordem de Exibição"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              sx={{
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

            {/* Descrição */}
            <TextField
              fullWidth
              label="Descrição"
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{
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
                  backgroundColor: "#ffc91f",
                  color: "#000",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "#e6b800",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={20} sx={{ color: "#000" }} />
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
          setPendingSubmit(false);
        }}
        onConfirm={handleConfirmSubmit}
        loading={loading}
      />
    </Box>
  );
}

