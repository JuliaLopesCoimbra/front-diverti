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
  updateEvent,
  UpdateEventData,
  EventResponse,
  getEventById,
} from "@/app/services/events/eventAppService";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import ImageCarousel from "@/app/components/news/ImageCarousel";

interface EditEventFormProps {
  eventId: number;
  onSuccess?: () => void;
}

export default function EditEventForm({
  eventId,
  onSuccess,
}: EditEventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mapImages, setMapImages] = useState<File[]>([]);
  const [mapImagePreviews, setMapImagePreviews] = useState<string[]>([]);
  const [existingMapImages, setExistingMapImages] = useState<Array<{id: number; image_url: string; image_order: number}>>([]);
  const [replaceMapImages, setReplaceMapImages] = useState(false);
  const [lineUp, setLineUp] = useState("");
  const [eventDates, setEventDates] = useState("");
  const [spotifyPlaylistUrl, setSpotifyPlaylistUrl] = useState("");
  const [vanArrivalTimeStart, setVanArrivalTimeStart] = useState("");
  const [vanArrivalTimeEnd, setVanArrivalTimeEnd] = useState("");
  const [vanDepartureTimeStart, setVanDepartureTimeStart] = useState("");
  const [vanDepartureTimeEnd, setVanDepartureTimeEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoadingEvent(true);
        const event = await getEventById(eventId);
        setTitle(event.title);
        setDescription(event.description || "");
        setLocation(event.location || "");
        
        if (event.starts_at) {
          const startDateObj = new Date(event.starts_at);
          const startDateStr = new Date(startDateObj.getTime() - startDateObj.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setStartDate(startDateStr);
        }
        
        if (event.ends_at) {
          const endDateObj = new Date(event.ends_at);
          const endDateStr = new Date(endDateObj.getTime() - endDateObj.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setEndDate(endDateStr);
        }
        
        if (event.banner_image) {
          setPreview(event.banner_image);
        }
        
        // Carrega imagens do mapa existentes
        if (event.map_images && event.map_images.length > 0) {
          const sortedImages = [...event.map_images].sort((a, b) => a.image_order - b.image_order);
          setExistingMapImages(sortedImages);
          setMapImagePreviews(sortedImages.map(img => img.image_url));
        } else {
          setExistingMapImages([]);
          setMapImagePreviews([]);
        }
        
        if (event.line_up) {
          setLineUp(event.line_up);
        }
        
        if (event.spotify_playlist_url) {
          setSpotifyPlaylistUrl(event.spotify_playlist_url);
        }
        
        if (event.event_dates) {
          setEventDates(event.event_dates);
        } else {
          setEventDates("");
        }

        if (event.van_arrival_time_start) {
          // Formato time vem como "HH:mm:ss" ou "HH:mm", precisamos apenas "HH:mm"
          const timeStr = event.van_arrival_time_start.substring(0, 5);
          setVanArrivalTimeStart(timeStr);
        } else {
          setVanArrivalTimeStart("");
        }

        if (event.van_arrival_time_end) {
          const timeStr = event.van_arrival_time_end.substring(0, 5);
          setVanArrivalTimeEnd(timeStr);
        } else {
          setVanArrivalTimeEnd("");
        }

        if (event.van_departure_time_start) {
          const timeStr = event.van_departure_time_start.substring(0, 5);
          setVanDepartureTimeStart(timeStr);
        } else {
          setVanDepartureTimeStart("");
        }

        if (event.van_departure_time_end) {
          const timeStr = event.van_departure_time_end.substring(0, 5);
          setVanDepartureTimeEnd(timeStr);
        } else {
          setVanDepartureTimeEnd("");
        }
      } catch (err) {
        showToast("Erro ao carregar evento", "error");
        router.back();
      } finally {
        setLoadingEvent(false);
      }
    };

    loadEvent();
  }, [eventId, showToast, router]);

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
    
    // Validação: máximo de 5 imagens (incluindo existentes)
    const totalImages = existingMapImages.length + mapImages.length + files.length;
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
    // O índice do carrossel corresponde à ordem: primeiro as existentes, depois as novas
    if (index < existingMapImages.length) {
      // Remove imagem existente - marca para remoção no backend
      const newExisting = existingMapImages.filter((_, i) => i !== index);
      setExistingMapImages(newExisting);
      // Remove também do preview (que inclui existentes + novas)
      const newPreviews = mapImagePreviews.filter((_, i) => i !== index);
      setMapImagePreviews(newPreviews);
    } else {
      // Remove nova imagem (ainda não enviada)
      // O índice no carrossel menos o número de existentes = índice nas novas imagens
      const newImageIndex = index - existingMapImages.length;
      const newImages = mapImages.filter((_, i) => i !== newImageIndex);
      setMapImages(newImages);
      // Remove do preview (que inclui existentes + novas)
      const newPreviews = mapImagePreviews.filter((_, i) => i !== index);
      setMapImagePreviews(newPreviews);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast("O título é obrigatório", "error");
      return;
    }

    if (!description.trim()) {
      showToast("A descrição é obrigatória", "error");
      return;
    }

    if (!location.trim()) {
      showToast("A localização é obrigatória", "error");
      return;
    }

    if (!startDate) {
      showToast("A data de início é obrigatória", "error");
      return;
    }

    if (!endDate) {
      showToast("A data de término é obrigatória", "error");
      return;
    }

    // Validação de datas: não permitir datas no passado
    if (startDate) {
      const startDateObj = new Date(startDate);
      const now = new Date();
      if (startDateObj <= now) {
        showToast("A data de início deve ser no futuro", "error");
        return;
      }
    }

    if (endDate) {
      const endDateObj = new Date(endDate);
      const now = new Date();
      if (endDateObj <= now) {
        showToast("A data de término deve ser no futuro", "error");
        return;
      }
    }

    // Validação: data de término deve ser após data de início
    if (startDate && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      if (endDateObj <= startDateObj) {
        showToast("A data de término deve ser posterior à data de início", "error");
        return;
      }
    }

    setLoading(true);

    try {
      const data: UpdateEventData = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        start_date: startDate,
        end_date: endDate,
        event_dates: eventDates.trim() || undefined,
        van_arrival_time_start: vanArrivalTimeStart || undefined,
        van_arrival_time_end: vanArrivalTimeEnd || undefined,
        van_departure_time_start: vanDepartureTimeStart || undefined,
        van_departure_time_end: vanDepartureTimeEnd || undefined,
        banner_image: bannerImage || undefined,
        map_images: mapImages.length > 0 ? mapImages : undefined,
        replace_map_images: replaceMapImages,
        line_up: lineUp.trim() || undefined,
        spotify_playlist_url: spotifyPlaylistUrl.trim() || undefined,
      };

      await updateEvent(eventId, data);
      showToast("Evento atualizado com sucesso!", "success");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/pages/admin/events/${eventId}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Erro ao atualizar evento", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingEvent) {
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
        backgroundImage: "url(/background/dashboard.png)",
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
          gap: { xs: 1.5, md: 2, lg: 2.5 },
          p: { xs: 2, md: 3, lg: 4 },
          py: { xs: 2, md: 3, lg: 3.5 },
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
          sx={{ 
            color: "#fff",
            fontSize: { xs: "1.2rem", md: "1.5rem", lg: "1.8rem" },
            "& svg": {
              fontSize: { xs: "1.2rem", md: "1.5rem", lg: "1.8rem" }
            }
          }}
        >
          <ArrowBackIosIcon />
        </IconButton>
        <Typography 
          fontWeight={700} 
          sx={{ 
            color: "#fff", 
            fontSize: { xs: "1.2rem", md: "1.5rem", lg: "1.8rem" } 
          }}
        >
          Editar Evento
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
            label="Título *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            label="Descrição *"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={4}
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
            label="Localização *"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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
            label="Data de Início *"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={loading}
            required
            inputProps={{
              min: new Date().toISOString().slice(0, 16),
            }}
            InputLabelProps={{
              shrink: true,
            }}
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
            label="Data de Término *"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={loading}
            required
            inputProps={{
              min: startDate || new Date().toISOString().slice(0, 16),
            }}
            InputLabelProps={{
              shrink: true,
            }}
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
            label="Dias do Evento"
            value={eventDates}
            onChange={(e) => setEventDates(e.target.value)}
            disabled={loading}
            placeholder="Ex: 2024-01-09,2024-01-10,2024-01-20,2024-01-21"
            helperText="Separe múltiplas datas por vírgula (formato: YYYY-MM-DD,YYYY-MM-DD)"
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
                "&::placeholder": {
                  color: "rgba(255,255,255,0.4)",
                  opacity: 1,
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255,255,255,0.6)",
                "&.Mui-focused": {
                  color: "#ffc91f",
                },
              },
              "& .MuiFormHelperText-root": {
                color: "rgba(255,255,255,0.5)",
              },
            }}
          />

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
              label="Horário de Fim da Ida"
              type="time"
              value={vanArrivalTimeEnd}
              onChange={(e) => setVanArrivalTimeEnd(e.target.value)}
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
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
              label="Horário de Fim da Volta"
              type="time"
              value={vanDepartureTimeEnd}
              onChange={(e) => setVanDepartureTimeEnd(e.target.value)}
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
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
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 1.5, color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
              Banner do Evento
            </Typography>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="banner-image-upload-edit"
              type="file"
              onChange={handleImageChange}
              disabled={loading}
            />
            <label htmlFor="banner-image-upload-edit">
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

          <Box>
            <Typography variant="body2" sx={{ mb: 1.5, color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
              Mapa do Evento (máximo 5 imagens)
            </Typography>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="map-image-upload-edit"
              type="file"
              multiple
              onChange={handleMapImageChange}
              disabled={loading || (existingMapImages.length + mapImages.length) >= 5}
            />
            <label htmlFor="map-image-upload-edit">
              <Button
                variant="outlined"
                component="span"
                disabled={loading || (existingMapImages.length + mapImages.length) >= 5}
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
                  "&:disabled": {
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.3)",
                  },
                }}
              >
                {(existingMapImages.length + mapImages.length) > 0 
                  ? `Adicionar mais imagens (${existingMapImages.length + mapImages.length}/5)` 
                  : "Selecionar Imagens do Mapa"}
              </Button>
            </label>
            
            {/* Checkbox para substituir todas as imagens */}
            {existingMapImages.length > 0 && (
              <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  id="replace-map-images"
                  checked={replaceMapImages}
                  onChange={(e) => setReplaceMapImages(e.target.checked)}
                  disabled={loading}
                  style={{ marginRight: 8, cursor: "pointer" }}
                />
                <label 
                  htmlFor="replace-map-images"
                  style={{ 
                    color: "rgba(255,255,255,0.7)", 
                    fontSize: "0.875rem",
                    cursor: "pointer"
                  }}
                >
                  Substituir todas as imagens existentes
                </label>
              </Box>
            )}
            
            {/* Exibe imagens existentes e novas em carrossel */}
            {(existingMapImages.length > 0 || mapImagePreviews.length > 0) && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1.5, color: "rgba(255,255,255,0.7)", fontSize: "0.9rem" }}>
                  {existingMapImages.length + mapImages.length} imagem(ns) {existingMapImages.length > 0 ? "(existentes + novas)" : "(novas)"}
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
            label="Line Up (Programação do Show)"
            value={lineUp}
            onChange={(e) => setLineUp(e.target.value)}
            multiline
            rows={6}
            disabled={loading}
            placeholder="Ex: 20:00 - Artista A&#10;21:30 - Artista B&#10;23:00 - Artista C"
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
                "&::placeholder": {
                  color: "rgba(255,255,255,0.4)",
                  opacity: 1,
                },
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
            label="Link do Iframe da Playlist Spotify"
            value={spotifyPlaylistUrl}
            onChange={(e) => setSpotifyPlaylistUrl(e.target.value)}
            disabled={loading}
            placeholder="Ex: https://open.spotify.com/embed/playlist/7yhX7bo1ytC94v3alLA5Tp?utm_source=generator"
            helperText="Cole aqui o link completo do iframe da playlist do Spotify"
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
                "&::placeholder": {
                  color: "rgba(255,255,255,0.4)",
                  opacity: 1,
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255,255,255,0.6)",
                "&.Mui-focused": {
                  color: "#ffc91f",
                },
              },
              "& .MuiFormHelperText-root": {
                color: "rgba(255,255,255,0.5)",
              },
            }}
          />
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
            disabled={loading || !title.trim() || !description.trim() || !location.trim() || !startDate || !endDate}
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
              "Salvar Alterações"
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

