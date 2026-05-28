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
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import CloseIcon from "@mui/icons-material/Close";
import ImageCarousel from "@/app/components/news/ImageCarousel";
import { createEvent, CreateEventData } from "@/app/services/events/eventAppService";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

interface CreateEventFormProps {
  onSuccess?: () => void;
}

export default function CreateEventForm({ onSuccess }: CreateEventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mapImages, setMapImages] = useState<File[]>([]);
  const [mapImagePreviews, setMapImagePreviews] = useState<string[]>([]);
  const [eventDates, setEventDates] = useState("");
  const [spotifyPlaylistUrl, setSpotifyPlaylistUrl] = useState("");
  const [vanArrivalTimeStart, setVanArrivalTimeStart] = useState("");
  const [vanArrivalTimeEnd, setVanArrivalTimeEnd] = useState("");
  const [vanDepartureTimeStart, setVanDepartureTimeStart] = useState("");
  const [vanDepartureTimeEnd, setVanDepartureTimeEnd] = useState("");
  const [meetingPointLocation, setMeetingPointLocation] = useState("");
  const [meetingPointSchedule, setMeetingPointSchedule] = useState<Array<{
    days: number[];
    start_time: string;
    end_time: string;
  }>>([]);
  const [daysInputValues, setDaysInputValues] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validação de tamanho: máximo 5MB por imagem
      const maxSizePerImage = 5 * 1024 * 1024; // 5MB
      
      if (file.size > maxSizePerImage) {
        showToast("A imagem é muito grande. Máximo de 5MB por imagem.", "error");
        return;
      }
      
      setBannerImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMapImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Validação: máximo de 5 imagens
    const totalImages = mapImages.length + files.length;
    if (totalImages > 5) {
      showToast("Máximo de 5 imagens do mapa permitidas", "error");
      return;
    }
    
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    
    Array.from(files).forEach((file) => {
      // Validação de tamanho: máximo 5MB por imagem
      const maxSizePerImage = 5 * 1024 * 1024; // 5MB
      
      if (file.size > maxSizePerImage) {
        showToast(`A imagem ${file.name} é muito grande. Máximo de 5MB por imagem.`, "error");
        return;
      }
      
      newFiles.push(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === newFiles.length) {
          setMapImages([...mapImages, ...newFiles]);
          setMapImagePreviews([...mapImagePreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveMapImage = (index: number) => {
    const newImages = mapImages.filter((_, i) => i !== index);
    const newPreviews = mapImagePreviews.filter((_, i) => i !== index);
    setMapImages(newImages);
    setMapImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast("O título é obrigatório", "error");
      return;
    }

    // Validação de datas: não permitir datas no passado
    if (startsAt) {
      const startDate = new Date(startsAt);
      const now = new Date();
      if (startDate <= now) {
        showToast("A data de início deve ser no futuro", "error");
        return;
      }
    }

    if (endsAt) {
      const endDate = new Date(endsAt);
      const now = new Date();
      if (endDate <= now) {
        showToast("A data de término deve ser no futuro", "error");
        return;
      }
    }

    // Validação: data de término deve ser após data de início
    if (startsAt && endsAt) {
      const startDate = new Date(startsAt);
      const endDate = new Date(endsAt);
      if (endDate <= startDate) {
        showToast("A data de término deve ser posterior à data de início", "error");
        return;
      }
    }

    setLoading(true);

    try {
      const data: CreateEventData = {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        starts_at: startsAt || undefined,
        ends_at: endsAt || undefined,
        event_dates: eventDates.trim() || undefined,
        van_arrival_time_start: vanArrivalTimeStart || undefined,
        van_arrival_time_end: vanArrivalTimeEnd || undefined,
        van_departure_time_start: vanDepartureTimeStart || undefined,
        van_departure_time_end: vanDepartureTimeEnd || undefined,
        meeting_point_location: meetingPointLocation.trim() || undefined,
        meeting_point_schedule: meetingPointSchedule.length > 0 ? meetingPointSchedule : undefined,
        banner_image: bannerImage || undefined,
        map_images: mapImages.length > 0 ? mapImages : undefined,
        spotify_playlist_url: spotifyPlaylistUrl.trim() || undefined,
      };

      await createEvent(data);
      showToast("Evento criado com sucesso!", "success");
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/pages/user/home");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Erro ao criar evento", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
        sx={{
          ...dashboardBackgroundSx,
          minHeight: "100vh",
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
          gap: 2,
          p: 3,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <IconButton
          onClick={() => router.push("/pages/user/home")}
          size="medium"
          sx={{ color: "#fff", fontSize: "1.5rem" }}
        >
          <ArrowBackIosIcon fontSize="inherit" />
        </IconButton>
        <Typography variant="h3" fontWeight={700} sx={{ color: "#fff", fontSize: { xs: "1.3rem", sm: "2rem" } }}>
          Criar Novo Evento
        </Typography>
      </Box>

      {/* Formulário */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          flex: 1,
          p: { xs: 3, sm: 4 },
          maxWidth: 800,
          width: "100%",
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            borderRadius: 3,
            p: { xs: 3, sm: 4 },
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <TextField
            fullWidth
            label="Título *"
            value={title}
            onChange={(e) => {
              if (e.target.value.length <= 100) {
                setTitle(e.target.value);
              }
            }}
            disabled={loading}
            required
            inputProps={{ maxLength: 100 }}
            helperText={`${title.length}/100 caracteres`}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: "1.1rem",
                padding: "4px 0",
                "& input": {
                  padding: "14px 16px",
                  fontSize: "1.1rem",
                },
                "& fieldset": {
                  borderColor: "rgba(255,255,255,0.1)",
                  borderWidth: "2px",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#ffc91f",
                  borderWidth: "2px",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255,255,255,0.7)",
                fontSize: "1.1rem",
                "&.Mui-focused": {
                  color: "#ffc91f",
                },
              },
              "& .MuiFormHelperText-root": {
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.95rem",
                marginTop: "6px",
              },
            }}
          />

          <TextField
            fullWidth
            label="Descrição"
            value={description}
            onChange={(e) => {
              if (e.target.value.length <= 200) {
                setDescription(e.target.value);
              }
            }}
            multiline
            rows={4}
            disabled={loading}
            inputProps={{ maxLength: 200 }}
            helperText={`${description.length}/200 caracteres`}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: "1.1rem",
                "& textarea": {
                  padding: "14px 16px",
                  fontSize: "1.1rem",
                  lineHeight: "1.6",
                },
                "& fieldset": {
                  borderColor: "rgba(255,255,255,0.1)",
                  borderWidth: "2px",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#ffc91f",
                  borderWidth: "2px",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255,255,255,0.7)",
                fontSize: "1.1rem",
                "&.Mui-focused": {
                  color: "#ffc91f",
                },
              },
              "& .MuiFormHelperText-root": {
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.95rem",
                marginTop: "6px",
              },
            }}
          />

          <TextField
            fullWidth
            label="Localização"
            value={location}
            onChange={(e) => {
              if (e.target.value.length <= 200) {
                setLocation(e.target.value);
              }
            }}
            disabled={loading}
            inputProps={{ maxLength: 200 }}
            helperText={`${location.length}/200 caracteres`}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: "1.1rem",
                padding: "4px 0",
                "& input": {
                  padding: "14px 16px",
                  fontSize: "1.1rem",
                },
                "& fieldset": {
                  borderColor: "rgba(255,255,255,0.1)",
                  borderWidth: "2px",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#ffc91f",
                  borderWidth: "2px",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255,255,255,0.7)",
                fontSize: "1.1rem",
                "&.Mui-focused": {
                  color: "#ffc91f",
                },
              },
              "& .MuiFormHelperText-root": {
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.95rem",
                marginTop: "6px",
              },
            }}
          />

          <TextField
            fullWidth
            label="Data de Início"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            disabled={loading}
            inputProps={{
              min: new Date().toISOString().slice(0, 16),
            }}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: "1.1rem",
                padding: "4px 0",
                "& input": {
                  padding: "14px 16px",
                  fontSize: "1.1rem",
                  "&::-webkit-calendar-picker-indicator": {
                    filter: "invert(1)",
                    cursor: "pointer",
                  },
                  "&::-webkit-datetime-edit": {
                    color: "#fff",
                  },
                },
                "& fieldset": {
                  borderColor: "rgba(255,255,255,0.1)",
                  borderWidth: "2px",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#ffc91f",
                  borderWidth: "2px",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255,255,255,0.7)",
                fontSize: "1.1rem",
                "&.Mui-focused": {
                  color: "#ffc91f",
                },
              },
            }}
          />

          <TextField
            fullWidth
            label="Data de Término"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            disabled={loading}
            inputProps={{
              min: startsAt || new Date().toISOString().slice(0, 16),
            }}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: "1.1rem",
                padding: "4px 0",
                "& input": {
                  padding: "14px 16px",
                  fontSize: "1.1rem",
                  "&::-webkit-calendar-picker-indicator": {
                    filter: "invert(1)",
                    cursor: "pointer",
                  },
                  "&::-webkit-datetime-edit": {
                    color: "#fff",
                  },
                },
                "& fieldset": {
                  borderColor: "rgba(255,255,255,0.1)",
                  borderWidth: "2px",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#ffc91f",
                  borderWidth: "2px",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255,255,255,0.7)",
                fontSize: "1.1rem",
                "&.Mui-focused": {
                  color: "#ffc91f",
                },
              },
            }}
          />

          <TextField
            fullWidth
            label="Dias do Evento"
            value={eventDates}
            onChange={(e) => {
              if (e.target.value.length <= 200) {
                setEventDates(e.target.value);
              }
            }}
            disabled={loading}
            placeholder="Ex: 2024-01-09,2024-01-10,2024-01-20,2024-01-21"
            inputProps={{ maxLength: 200 }}
            helperText={`Separe múltiplas datas por vírgula (formato: YYYY-MM-DD,YYYY-MM-DD) - ${eventDates.length}/200 caracteres`}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: "0.9rem",
                padding: "4px 0",
                "& input": {
                  padding: "14px 16px",
                  fontSize: "0.9rem",
                },
                "& fieldset": {
                  borderColor: "rgba(255,255,255,0.1)",
                  borderWidth: "2px",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#ffc91f",
                  borderWidth: "2px",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.9rem",
                "&.Mui-focused": {
                  color: "#ffc91f",
                },
              },
              "& .MuiFormHelperText-root": {
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.8rem",
                marginTop: "6px",
                wordWrap: "break-word",
                overflowWrap: "break-word",
                whiteSpace: "normal",
                maxWidth: "100%",
                lineHeight: 1.4,
              },
            }}
          />

          <Box>
            <Typography variant="body1" sx={{ mb: 2, color: "rgba(255,255,255,0.9)", fontSize: "1.1rem", fontWeight: 500 }}>
              Horários das Vans
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              label="Horário de Início da Ida"
              type="time"
              value={vanArrivalTimeStart}
              onChange={(e) => setVanArrivalTimeStart(e.target.value)}
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: "1.1rem",
                  padding: "4px 0",
                  "& input": {
                    padding: "14px 16px",
                    fontSize: "1.1rem",
                    "&::-webkit-calendar-picker-indicator": {
                      filter: "invert(1)",
                      cursor: "pointer",
                    },
                    "&::-webkit-datetime-edit": {
                      color: "#fff",
                    },
                  },
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.1)",
                    borderWidth: "2px",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.3)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#ffc91f",
                    borderWidth: "2px",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "1.1rem",
                  "&.Mui-focused": {
                    color: "#ffc91f",
                  },
                },
              }}
            />
            <TextField
              fullWidth
              label="Horário de Fim da Ida"
              type="time"
              value={vanArrivalTimeEnd}
              onChange={(e) => setVanArrivalTimeEnd(e.target.value)}
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: "1.1rem",
                  padding: "4px 0",
                  "& input": {
                    padding: "14px 16px",
                    fontSize: "1.1rem",
                    "&::-webkit-calendar-picker-indicator": {
                      filter: "invert(1)",
                      cursor: "pointer",
                    },
                    "&::-webkit-datetime-edit": {
                      color: "#fff",
                    },
                  },
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.1)",
                    borderWidth: "2px",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.3)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#ffc91f",
                    borderWidth: "2px",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "1.1rem",
                  "&.Mui-focused": {
                    color: "#ffc91f",
                  },
                },
              }}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              label="Horário de Início da Volta"
              type="time"
              value={vanDepartureTimeStart}
              onChange={(e) => setVanDepartureTimeStart(e.target.value)}
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: "1.1rem",
                  padding: "4px 0",
                  "& input": {
                    padding: "14px 16px",
                    fontSize: "1.1rem",
                    "&::-webkit-calendar-picker-indicator": {
                      filter: "invert(1)",
                      cursor: "pointer",
                    },
                    "&::-webkit-datetime-edit": {
                      color: "#fff",
                    },
                  },
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.1)",
                    borderWidth: "2px",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.3)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#ffc91f",
                    borderWidth: "2px",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "1.1rem",
                  "&.Mui-focused": {
                    color: "#ffc91f",
                  },
                },
              }}
            />
            <TextField
              fullWidth
              label="Horário de Fim da Volta"
              type="time"
              value={vanDepartureTimeEnd}
              onChange={(e) => setVanDepartureTimeEnd(e.target.value)}
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: "1.1rem",
                  padding: "4px 0",
                  "& input": {
                    padding: "14px 16px",
                    fontSize: "1.1rem",
                    "&::-webkit-calendar-picker-indicator": {
                      filter: "invert(1)",
                      cursor: "pointer",
                    },
                    "&::-webkit-datetime-edit": {
                      color: "#fff",
                    },
                  },
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.1)",
                    borderWidth: "2px",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.3)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#ffc91f",
                    borderWidth: "2px",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "1.1rem",
                  "&.Mui-focused": {
                    color: "#ffc91f",
                  },
                },
              }}
            />
          </Box>

          <Box>
            <Typography variant="body1" sx={{ mb: 2, color: "rgba(255,255,255,0.9)", fontSize: "1.1rem", fontWeight: 500 }}>
              Meeting Point
            </Typography>
            
            <TextField
              fullWidth
              label="Local do Meeting Point"
              value={meetingPointLocation}
              onChange={(e) => {
                if (e.target.value.length <= 255) {
                  setMeetingPointLocation(e.target.value);
                }
              }}
              disabled={loading}
              inputProps={{ maxLength: 255 }}
              helperText={`${meetingPointLocation.length}/255 caracteres`}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: "1.1rem",
                  padding: "4px 0",
                  "& input": {
                    padding: "14px 16px",
                    fontSize: "1.1rem",
                  },
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.1)",
                    borderWidth: "2px",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.3)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#ffc91f",
                    borderWidth: "2px",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "1.1rem",
                  "&.Mui-focused": {
                    color: "#ffc91f",
                  },
                },
                "& .MuiFormHelperText-root": {
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "0.95rem",
                  marginTop: "6px",
                },
              }}
            />

            <Typography variant="body2" sx={{ mb: 2, color: "rgba(255,255,255,0.7)", fontSize: "0.95rem" }}>
              Horários de Funcionamento
            </Typography>

            {meetingPointSchedule.map((schedule, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                    Grupo {index + 1}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      const newSchedule = meetingPointSchedule.filter((_, i) => i !== index);
                      setMeetingPointSchedule(newSchedule);
                      // Limpa o valor do input removido e reindexa os demais
                      setDaysInputValues(prev => {
                        const newValues: { [key: number]: string } = {};
                        Object.keys(prev).forEach(key => {
                          const keyNum = parseInt(key);
                          if (keyNum < index) {
                            newValues[keyNum] = prev[keyNum];
                          } else if (keyNum > index) {
                            newValues[keyNum - 1] = prev[keyNum];
                          }
                        });
                        return newValues;
                      });
                    }}
                    sx={{ color: "#ff6b6b" }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <TextField
                  fullWidth
                  label="Dias (separados por vírgula, ex: 13,14,20)"
                  value={daysInputValues[index] !== undefined ? daysInputValues[index] : schedule.days.join(",")}
                  onChange={(e) => {
                    const daysStr = e.target.value;
                    // Permite apenas números e vírgulas
                    const sanitized = daysStr.replace(/[^0-9,]/g, '');
                    
                    // Atualiza o valor do input imediatamente
                    setDaysInputValues(prev => ({
                      ...prev,
                      [index]: sanitized
                    }));
                    
                    // Processa os números válidos
                    const parts = sanitized.split(",");
                    const days = parts
                      .map(d => d.trim())
                      .filter(d => d !== "") // Remove strings vazias
                      .map(d => parseInt(d))
                      .filter(d => !isNaN(d) && d >= 1 && d <= 31);
                    
                    // Atualiza o schedule apenas com números válidos
                    const newSchedule = [...meetingPointSchedule];
                    newSchedule[index].days = days;
                    setMeetingPointSchedule(newSchedule);
                  }}
                  onBlur={() => {
                    // Limpa o valor do input quando perde o foco, usando apenas os dias válidos
                    setDaysInputValues(prev => {
                      const newValues = { ...prev };
                      delete newValues[index];
                      return newValues;
                    });
                  }}
                  disabled={loading}
                  placeholder="13,14,20"
                  inputProps={{
                    inputMode: "numeric",
                    pattern: "[0-9,]*"
                  }}
                  sx={{
                    mb: 2,
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "rgba(255,255,255,0.05)",
                      color: "#fff",
                      "& fieldset": {
                        borderColor: "rgba(255,255,255,0.1)",
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

                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Horário de Início"
                    type="time"
                    value={schedule.start_time}
                    onChange={(e) => {
                      const newSchedule = [...meetingPointSchedule];
                      newSchedule[index].start_time = e.target.value;
                      setMeetingPointSchedule(newSchedule);
                    }}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "rgba(255,255,255,0.05)",
                        color: "#fff",
                        "& fieldset": {
                          borderColor: "rgba(255,255,255,0.1)",
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
                  <TextField
                    fullWidth
                    label="Horário de Fim"
                    type="time"
                    value={schedule.end_time}
                    onChange={(e) => {
                      const newSchedule = [...meetingPointSchedule];
                      newSchedule[index].end_time = e.target.value;
                      setMeetingPointSchedule(newSchedule);
                    }}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "rgba(255,255,255,0.05)",
                        color: "#fff",
                        "& fieldset": {
                          borderColor: "rgba(255,255,255,0.1)",
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
                </Box>
              </Paper>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                const newIndex = meetingPointSchedule.length;
                setMeetingPointSchedule([
                  ...meetingPointSchedule,
                  { days: [], start_time: "", end_time: "" }
                ]);
                // Inicializa o valor do input para o novo grupo
                setDaysInputValues(prev => ({
                  ...prev,
                  [newIndex]: ""
                }));
              }}
              disabled={loading}
              fullWidth
              sx={{
                borderColor: "rgba(255,255,255,0.2)",
                borderWidth: "2px",
                color: "#fff",
                py: 1.5,
                fontSize: "1.05rem",
                fontWeight: 500,
                textTransform: "none",
                mb: 2,
                "&:hover": {
                  borderColor: "#ffc91f",
                  borderWidth: "2px",
                  backgroundColor: "rgba(255,201,31,0.1)",
                },
              }}
            >
              Adicionar Grupo de Horários
            </Button>
          </Box>

          <Box>
            <Typography variant="body1" sx={{ mb: 2, color: "rgba(255,255,255,0.9)", fontSize: "1.1rem", fontWeight: 500 }}>
              Banner do Evento
            </Typography>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="banner-image-upload"
              type="file"
              onChange={handleImageChange}
              disabled={loading}
            />
            <label htmlFor="banner-image-upload">
              <Button
                variant="outlined"
                component="span"
                disabled={loading}
                fullWidth
                sx={{
                  borderColor: "rgba(255,255,255,0.2)",
                  borderWidth: "2px",
                  color: "#fff",
                  py: 2,
                  fontSize: "1.05rem",
                  fontWeight: 500,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#ffc91f",
                    borderWidth: "2px",
                    backgroundColor: "rgba(255,201,31,0.1)",
                  },
                }}
              >
                {preview ? "Alterar Imagem" : "Selecionar Imagem"}
              </Button>
            </label>
            {preview && (
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Box
                  component="img"
                  src={preview}
                  alt="Preview Banner"
                  sx={{
                    maxWidth: "100%",
                    maxHeight: 300,
                    objectFit: "contain",
                    borderRadius: 2,
                    margin: "0 auto",
                  }}
                />
              </Box>
            )}
          </Box>

          <Box>
            <Typography variant="body1" sx={{ mb: 2, color: "rgba(255,255,255,0.9)", fontSize: "1.1rem", fontWeight: 500 }}>
              Mapa do Evento (máximo 5 imagens)
            </Typography>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="map-image-upload"
              type="file"
              multiple
              onChange={handleMapImageChange}
              disabled={loading || mapImages.length >= 5}
            />
            <label htmlFor="map-image-upload">
              <Button
                variant="outlined"
                component="span"
                disabled={loading || mapImages.length >= 5}
                fullWidth
                sx={{
                  borderColor: "rgba(255,255,255,0.2)",
                  borderWidth: "2px",
                  color: "#fff",
                  py: 2,
                  fontSize: "1.05rem",
                  fontWeight: 500,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#ffc91f",
                    borderWidth: "2px",
                    backgroundColor: "rgba(255,201,31,0.1)",
                  },
                  "&:disabled": {
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.3)",
                  },
                }}
              >
                {mapImages.length > 0 ? `Adicionar mais imagens (${mapImages.length}/5)` : "Selecionar Imagens do Mapa"}
              </Button>
            </label>
            {mapImagePreviews.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 2, color: "rgba(255,255,255,0.7)", fontSize: "0.9rem" }}>
                  {mapImages.length} imagem(ns) selecionada(s)
                </Typography>
                <ImageCarousel
                  images={mapImagePreviews}
                  onRemove={handleRemoveMapImage}
                  showRemoveButton={true}
                  disabled={loading}
                />
              </Box>
            )}
          </Box>

          <TextField
            fullWidth
            label="Link do Iframe da Playlist Spotify"
            value={spotifyPlaylistUrl}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                setSpotifyPlaylistUrl(e.target.value);
              }
            }}
            disabled={loading}
            placeholder="Ex: https://open.spotify.com/embed/playlist/7yhX7bo1ytC94v3alLA5Tp?utm_source=generator"
            inputProps={{ maxLength: 500 }}
            helperText={`Cole aqui o link completo do iframe da playlist do Spotify - ${spotifyPlaylistUrl.length}/500 caracteres`}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: "0.9rem",
                padding: "4px 0",
                "& input": {
                  padding: "14px 16px",
                  fontSize: "0.9rem",
                },
                "& fieldset": {
                  borderColor: "rgba(255,255,255,0.1)",
                  borderWidth: "2px",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#ffc91f",
                  borderWidth: "2px",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.9rem",
                "&.Mui-focused": {
                  color: "#ffc91f",
                },
              },
              "& .MuiFormHelperText-root": {
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.8rem",
                marginTop: "6px",
                wordWrap: "break-word",
                overflowWrap: "break-word",
                whiteSpace: "normal",
                maxWidth: "100%",
                lineHeight: 1.4,
              },
            }}
          />
        </Paper>

        <Box sx={{ display: "flex", gap: 2, mt: 3, mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => router.push("/pages/user/home")}
            disabled={loading}
            sx={{
              flex: 1,
              borderRadius: "999px",
              borderColor: "rgba(255,255,255,0.2)",
              borderWidth: "2px",
              color: "rgba(255,255,255,0.9)",
              py: 1.5,
              fontSize: "1.05rem",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                borderColor: "rgba(255,255,255,0.4)",
                borderWidth: "2px",
                backgroundColor: "rgba(255,255,255,0.05)",
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !title.trim()}
            sx={{
              flex: 1,
              borderRadius: "999px",
              backgroundColor: "#ffffff",
              color: "#fff",
              fontWeight: 600,
              py: 1.5,
              fontSize: "1.05rem",
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
            ) : (
              "Criar Evento"
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}


