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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import {
  createParadeLineupItem,
  updateParadeLineupItem,
  getParadeLineupItem,
  CreateParadeLineupItemData,
  UpdateParadeLineupItemData,
} from "@/app/services/paradeLineup/paradeLineupService";
import { getSambaSchoolsByEvent, SambaSchoolResponse } from "@/app/services/sambaSchools/sambaSchoolService";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";

interface CreateParadeLineupItemFormProps {
  eventId: number;
  paradeLineupItemId?: number; // Se fornecido, está editando
  onSuccess?: () => void;
}

export default function CreateParadeLineupItemForm({
  eventId,
  paradeLineupItemId,
  onSuccess,
}: CreateParadeLineupItemFormProps) {
  const [sambaSchoolId, setSambaSchoolId] = useState<number | "">("");
  const [performanceTime, setPerformanceTime] = useState("");
  const [performanceEndTime, setPerformanceEndTime] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [originalDisplayOrder, setOriginalDisplayOrder] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [sambaSchools, setSambaSchools] = useState<SambaSchoolResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();
  const isEditing = !!paradeLineupItemId;

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoadingSchools(true);
        const schools = await getSambaSchoolsByEvent(eventId, 100, 0);
        setSambaSchools(schools);
      } catch (err: any) {
        console.error("Erro ao buscar escolas de samba:", err);
        showToast("Erro ao carregar escolas de samba", "error");
      } finally {
        setLoadingSchools(false);
      }
    };

    fetchSchools();
  }, [eventId, showToast]);

  useEffect(() => {
    if (isEditing && paradeLineupItemId) {
      const fetchData = async () => {
        try {
          setLoadingData(true);
          const item = await getParadeLineupItem(paradeLineupItemId);
          setSambaSchoolId(item.samba_school_id);
          setPerformanceTime(item.performance_time.substring(0, 5)); // HH:mm
          setPerformanceEndTime(item.performance_end_time ? item.performance_end_time.substring(0, 5) : ""); // HH:mm
          setEventDate(item.event_date || ""); // YYYY-MM-DD
          setDisplayOrder(item.display_order ?? 0);
          setOriginalDisplayOrder(item.display_order ?? 0);
          setDescription(item.description || "");
        } catch (err: any) {
          console.error("Erro ao buscar item:", err);
          showToast("Erro ao carregar dados do item", "error");
        } finally {
          setLoadingData(false);
        }
      };
      fetchData();
    }
  }, [paradeLineupItemId, isEditing, showToast]);

  const handleSubmit = async () => {
    if (!sambaSchoolId || !performanceTime) {
      showToast("Preencha todos os campos obrigatórios", "error");
      return;
    }

    setLoading(true);
    
    try {
      if (isEditing && paradeLineupItemId) {
        const data: UpdateParadeLineupItemData = {
          samba_school_id: sambaSchoolId as number,
          performance_time: performanceTime,
          performance_end_time: performanceEndTime || undefined,
          event_date: eventDate || undefined,
          // Só envia display_order se foi alterado
          display_order: displayOrder !== originalDisplayOrder ? displayOrder : undefined,
          description: description || undefined,
        };
        await updateParadeLineupItem(paradeLineupItemId, data);
        showToast("Item atualizado com sucesso!", "success");
      } else {
        const data: CreateParadeLineupItemData = {
          event_id: eventId,
          samba_school_id: sambaSchoolId as number,
          performance_time: performanceTime,
          performance_end_time: performanceEndTime || undefined,
          event_date: eventDate || undefined,
          display_order: displayOrder,
          description: description || undefined,
        };
        await createParadeLineupItem(data);
        showToast("Item criado com sucesso!", "success");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/pages/admin/events/${eventId}/lineup`);
      }
    } catch (err: any) {
      console.error("Erro ao salvar item:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Erro ao salvar item";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData || loadingSchools) {
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
          {isEditing ? "Editar Item do Line Up de Desfile" : "Adicionar Item ao Line Up de Desfile"}
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
            {/* Escola de Samba */}
            <FormControl fullWidth required>
              <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>Escola de Samba</InputLabel>
              <Select
                value={sambaSchoolId}
                onChange={(e) => setSambaSchoolId(e.target.value as number)}
                disabled={loading || loadingSchools}
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
                {sambaSchools.map((school) => (
                  <MenuItem key={school.id} value={school.id}>
                    {school.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
    </Box>
  );
}



