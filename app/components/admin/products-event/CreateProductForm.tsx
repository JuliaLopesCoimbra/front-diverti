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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Chip,
} from "@mui/material";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import AddPhotoAlternate from "@mui/icons-material/AddPhotoAlternate";
import { createProductEvent, CreateProductEventData, getProductsByEvent } from "@/app/services/productsEvent/productEventService";
import { getEvents, EventResponse } from "@/app/services/events/eventAppService";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import ImageCarousel from "@/app/components/news/ImageCarousel";

interface CreateProductFormProps {
  onSuccess?: () => void;
  eventId?: number;
}

export default function CreateProductForm({ onSuccess, eventId: initialEventId }: CreateProductFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [lastPieces, setLastPieces] = useState(false);
  const [eventId, setEventId] = useState<number | "">(initialEventId || "");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!initialEventId) {
      loadEvents();
    }
  }, [initialEventId]);

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const data = await getEvents(100, 0);
      setEvents(data);
    } catch (err) {
      showToast("Erro ao carregar eventos", "error");
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limite de 3 fotos
    const maxImages = 3;
    const currentCount = images.length;
    const remainingSlots = maxImages - currentCount;

    if (remainingSlots <= 0) {
      showToast("Você pode adicionar no máximo 3 fotos", "error");
      return;
    }

    // Limitar a quantidade de arquivos que podem ser adicionados
    const filesToAdd = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      showToast(`Você pode adicionar apenas mais ${remainingSlots} foto(s). Máximo de 3 fotos.`, "warning");
    }

    // Validação de tamanho: máximo 5MB por imagem
    const maxSizePerImage = 5 * 1024 * 1024; // 5MB
    const validFiles: File[] = [];
    
    filesToAdd.forEach((file) => {
      if (file.size > maxSizePerImage) {
        showToast(`A imagem ${file.name} é muito grande. Máximo de 5MB por imagem.`, "error");
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0) return;

    setImages((prev) => [...prev, ...validFiles]);
    
    // Criar previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      return newImages;
    });
    setPreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index);
      return newPreviews;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("O nome é obrigatório", "error");
      return;
    }

    if (!eventId) {
      showToast("Selecione um evento", "error");
      return;
    }

    setLoading(true);

    try {
      const data: CreateProductEventData = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: "0.00", // Preço padrão, não será exibido no front
        status: status,
        stock: 0, // Estoque padrão, não será exibido no front
        last_pieces: lastPieces,
        event_id: Number(eventId),
        images: images.length > 0 ? images : undefined,
      };

      await createProductEvent(data);
      showToast("Produto criado com sucesso!", "success");
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/pages/admin/events/${eventId}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Erro ao criar produto", "error");
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
      {/* Header */}
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
          onClick={() => router.back()}
          size="medium"
          sx={{ color: "#fff", fontSize: "1.5rem" }}
        >
          <ArrowBackIosIcon fontSize="inherit" />
        </IconButton>
        <Typography variant="h3" fontWeight={700} sx={{ color: "#fff", fontSize: { xs: "1.1rem", sm: "2rem" } }}>
          Criar Novo Produto
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
          {/* Upload de imagens - Primeiro campo */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <PhotoCamera sx={{ color: "#ffcc01", fontSize: 20 }} />
              <Typography
                variant="subtitle1"
                sx={{
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "1rem",
                }}
              >
                Fotos do Produto
              </Typography>
              {previews.length > 0 && (
                <Chip
                  label={`${previews.length}/3`}
                  size="small"
                  sx={{
                    backgroundColor: "rgba(255, 204, 1, 0.2)",
                    color: "#ffcc01",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    height: 20,
                  }}
                />
              )}
            </Box>

            <input
              accept="image/*"
              style={{ display: "none" }}
              id="image-upload"
              type="file"
              multiple
              onChange={handleImageChange}
              disabled={loading || previews.length >= 3}
            />

            {previews.length === 0 ? (
              <label htmlFor="image-upload">
                <Box
                  sx={{
                    border: "2px dashed rgba(255, 255, 255, 0.3)",
                    borderRadius: "16px",
                    padding: { xs: 4, sm: 6 },
                    textAlign: "center",
                    cursor: loading || previews.length >= 3 ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    "&:hover": {
                      borderColor: "rgba(255, 204, 1, 0.5)",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <PhotoCamera
                    sx={{
                      fontSize: 48,
                      color: "rgba(255, 255, 255, 0.4)",
                      mb: 2,
                    }}
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      color: "rgba(255, 255, 255, 0.8)",
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    Adicione suas fotos
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "0.875rem",
                    }}
                  >
                    Clique para selecionar ou arraste aqui
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255, 255, 255, 0.4)",
                      fontSize: "0.75rem",
                      mt: 1,
                      display: "block",
                    }}
                  >
                    Máximo 3 imagens • 5MB por imagem
                  </Typography>
                </Box>
              </label>
            ) : (
              <Box sx={{ mt: 2 }}>
                <ImageCarousel
                  images={previews}
                  onRemove={removeImage}
                  showRemoveButton={true}
                  disabled={loading}
                />

                {previews.length < 3 && (
                  <label htmlFor="image-upload" style={{ display: "block", marginTop: 16 }}>
                    <Button
                      component="span"
                      disabled={loading}
                      variant="outlined"
                      startIcon={<AddPhotoAlternate />}
                      fullWidth
                      sx={{
                        color: "rgba(255,255,255,0.9)",
                        borderColor: "rgba(255,255,255,0.3)",
                        textTransform: "none",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        padding: "10px 20px",
                        borderRadius: "12px",
                        transition: "all 0.3s ease",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        backdropFilter: "blur(10px)",
                        "&:hover": {
                          backgroundColor: "rgba(255,255,255,0.1)",
                          borderColor: "rgba(255, 204, 1, 0.5)",
                          color: "#ffcc01",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      Adicionar mais fotos ({previews.length}/3)
                    </Button>
                  </label>
                )}
              </Box>
            )}
          </Box>

          {!initialEventId && (
            <FormControl fullWidth>
              <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>Evento *</InputLabel>
              <Select
                value={eventId}
                onChange={(e) => setEventId(e.target.value as number)}
                disabled={loading || loadingEvents}
                required
                sx={{
                  color: "#fff",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.1)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.3)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#ffc91f",
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: "rgba(0, 0, 0, 0.9)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 2,
                      mt: 1,
                      "& .MuiMenuItem-root": {
                        color: "#fff",
                        "&:hover": {
                          backgroundColor: "rgba(255, 201, 31, 0.2)",
                        },
                        "&.Mui-selected": {
                          backgroundColor: "rgba(255, 201, 31, 0.3)",
                          color: "#ffc91f",
                          "&:hover": {
                            backgroundColor: "rgba(255, 201, 31, 0.4)",
                          },
                        },
                      },
                    },
                  },
                }}
              >
                {events.map((event) => (
                  <MenuItem key={event.id} value={event.id}>
                    {event.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            label="Nome *"
            value={name}
            onChange={(e) => {
              if (e.target.value.length <= 100) {
                setName(e.target.value);
              }
            }}
            disabled={loading}
            required
            inputProps={{ maxLength: 100 }}
            helperText={`${name.length}/100 caracteres`}
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
              "& .MuiFormHelperText-root": {
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.95rem",
                marginTop: "6px",
              },
            }}
          />

          <Paper
            elevation={0}
            onClick={() => !loading && setLastPieces(!lastPieces)}
            sx={{
              p: 2,
              cursor: loading ? "default" : "pointer",
              backgroundColor: lastPieces 
                ? "rgba(255, 201, 31, 0.15)" 
                : "rgba(255,255,255,0.05)",
              border: `2px solid ${lastPieces ? "#ffc91f" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 2,
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: 2,
              "&:hover": {
                backgroundColor: lastPieces 
                  ? "rgba(255, 201, 31, 0.2)" 
                  : "rgba(255,255,255,0.08)",
                borderColor: lastPieces ? "#ffc91f" : "rgba(255,255,255,0.2)",
                transform: "translateY(-2px)",
                boxShadow: lastPieces 
                  ? "0 4px 12px rgba(255, 201, 31, 0.3)" 
                  : "0 4px 12px rgba(0, 0, 0, 0.2)",
              },
            }}
          >
            <Checkbox
              checked={lastPieces}
              onChange={(e) => setLastPieces(e.target.checked)}
              disabled={loading}
              sx={{
                color: "#ffc91f",
                "&.Mui-checked": {
                  color: "#ffc91f",
                },
                "& .MuiSvgIcon-root": {
                  fontSize: "1.5rem",
                },
              }}
            />
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
              <LocalFireDepartmentIcon 
                sx={{ 
                  color: lastPieces ? "#ff6b35" : "rgba(255,255,255,0.4)",
                  fontSize: "2rem",
                  transition: "all 0.3s ease",
                }} 
              />
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: lastPieces ? "#ffc91f" : "rgba(255,255,255,0.9)",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    mb: 0.5,
                    transition: "all 0.3s ease",
                  }}
                >
                  Últimas Peças
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: lastPieces ? "rgba(255, 201, 31, 0.8)" : "rgba(255,255,255,0.6)",
                    fontSize: "0.875rem",
                    transition: "all 0.3s ease",
                  }}
                >
                  {lastPieces 
                    ? "Este produto será marcado como 'últimas peças' para todos os usuários" 
                    : "Marque para exibir a mensagem 'últimas peças' para este produto"}
                </Typography>
              </Box>
            </Box>
            {lastPieces && (
              <Chip
                label="Ativo"
                size="small"
                sx={{
                  backgroundColor: "#ffc91f",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  height: 24,
                }}
              />
            )}
          </Paper>

          <FormControl fullWidth>
            <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>Status</InputLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
              sx={{
                color: "#fff",
                backgroundColor: "rgba(255,255,255,0.05)",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.1)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ffc91f",
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: "rgba(0, 0, 0, 0.9)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 2,
                    mt: 1,
                    "& .MuiMenuItem-root": {
                      color: "#fff",
                      "&:hover": {
                        backgroundColor: "rgba(255, 201, 31, 0.2)",
                      },
                      "&.Mui-selected": {
                        backgroundColor: "rgba(255, 201, 31, 0.3)",
                        color: "#ffc91f",
                        "&:hover": {
                          backgroundColor: "rgba(255, 201, 31, 0.4)",
                        },
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="active">Ativo</MenuItem>
              <MenuItem value="inactive">Inativo</MenuItem>
            </Select>
          </FormControl>


          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              disabled={loading}
              sx={{
                flex: 1,
                borderRadius: "999px",
                borderColor: "rgba(255,255,255,0.2)",
                borderWidth: "2px",
                color: "rgba(255,255,255,0.9)",
                fontWeight: 600,
                fontSize: { xs: "0.875rem", sm: "1.1rem" },
                py: { xs: 1, sm: 1.5 },
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
              disabled={loading}
              sx={{
                flex: 1,
                borderRadius: "999px",
                backgroundColor: "#ffc91f",
                color: "#000",
                fontWeight: 700,
                fontSize: { xs: "0.875rem", sm: "1.1rem" },
                py: { xs: 1, sm: 1.5 },
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#ffd54f",
                },
                "&:disabled": {
                  backgroundColor: "rgba(255, 201, 31, 0.5)",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "#000" }} />
              ) : (
                "Criar Produto"
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

