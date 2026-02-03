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
import CloseIcon from "@mui/icons-material/Close";
import { createEvent, CreateEventData } from "@/app/services/events/eventAppService";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";

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
  const [lineUp, setLineUp] = useState("");
  const [eventDates, setEventDates] = useState("");
  const [spotifyPlaylistUrl, setSpotifyPlaylistUrl] = useState("");
  const [vanArrivalTimeStart, setVanArrivalTimeStart] = useState("");
  const [vanArrivalTimeEnd, setVanArrivalTimeEnd] = useState("");
  const [vanDepartureTimeStart, setVanDepartureTimeStart] = useState("");
  const [vanDepartureTimeEnd, setVanDepartureTimeEnd] = useState("");
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
        banner_image: bannerImage || undefined,
        map_images: mapImages.length > 0 ? mapImages : undefined,
        line_up: lineUp.trim() || undefined,
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
        minHeight: "100vh",
        backgroundImage: "url(/background/dashboard.png)",
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
                <Typography variant="body2" sx={{ mb: 1, color: "rgba(255,255,255,0.7)", fontSize: "0.9rem" }}>
                  {mapImages.length} imagem(ns) selecionada(s)
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {mapImagePreviews.map((preview, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: "relative",
                        width: "150px",
                        height: "150px",
                        borderRadius: 2,
                        overflow: "hidden",
                        border: "2px solid rgba(255,255,255,0.2)",
                      }}
                    >
                      <Box
                        component="img"
                        src={preview}
                        alt={`Preview Mapa ${index + 1}`}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <IconButton
                        onClick={() => handleRemoveMapImage(index)}
                        disabled={loading}
                        sx={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          backgroundColor: "rgba(0, 0, 0, 0.6)",
                          color: "#fff",
                          "&:hover": {
                            backgroundColor: "rgba(255, 0, 0, 0.8)",
                          },
                          width: 32,
                          height: 32,
                        }}
                        size="small"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          <TextField
            fullWidth
            label="Line Up (Programação do Show)"
            value={lineUp}
            onChange={(e) => {
              if (e.target.value.length <= 2000) {
                setLineUp(e.target.value);
              }
            }}
            multiline
            rows={6}
            disabled={loading}
            placeholder="Ex: 20:00 - Artista A&#10;21:30 - Artista B&#10;23:00 - Artista C"
            inputProps={{ maxLength: 2000 }}
            helperText={`${lineUp.length}/2000 caracteres`}
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
              backgroundColor: "#ffc91f",
              color: "#000",
              fontWeight: 600,
              py: 1.5,
              fontSize: "1.05rem",
              textTransform: "none",
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
              "Criar Evento"
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

