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
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import {
  createSambaSchool,
  CreateSambaSchoolData,
} from "@/app/services/sambaSchools/sambaSchoolService";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";

interface CreateSambaSchoolFormProps {
  eventId: number;
  onSuccess?: () => void;
}

export default function CreateSambaSchoolForm({
  eventId,
  onSuccess,
}: CreateSambaSchoolFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validação de tamanho: máximo 5MB
      const maxSizePerImage = 5 * 1024 * 1024; // 5MB
      
      if (file.size > maxSizePerImage) {
        showToast("A imagem é muito grande. Máximo de 5MB por imagem.", "error");
        return;
      }
      
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("O nome é obrigatório", "error");
      return;
    }

    setLoading(true);

    try {
      const data: CreateSambaSchoolData = {
        name: name.trim(),
        description: description.trim() || undefined,
        image: image || undefined,
      };

      await createSambaSchool(eventId, data);
      showToast("Escola de samba criada com sucesso!", "success");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/pages/admin/events/${eventId}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Erro ao criar escola de samba", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
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
          gap: 1.5,
          p: 2,
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
          sx={{ color: "#fff" }}
        >
          <ArrowBackIosIcon />
        </IconButton>
        <Typography fontWeight={700} sx={{ color: "#fff", fontSize: "1.2rem" }}>
          Criar Nova Escola de Samba
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
          {/* Upload de imagem - Primeiro campo */}
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
                Imagem da Escola de Samba
              </Typography>
              {preview && (
                <Chip
                  label="1/1"
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
              id="samba-school-image-upload"
              type="file"
              onChange={handleImageChange}
              disabled={loading}
            />

            {!preview ? (
              <label htmlFor="samba-school-image-upload">
                <Box
                  sx={{
                    border: "2px dashed rgba(255, 255, 255, 0.3)",
                    borderRadius: "16px",
                    padding: { xs: 4, sm: 6 },
                    textAlign: "center",
                    cursor: loading ? "not-allowed" : "pointer",
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
                    Adicione a imagem
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
                    Máximo 1 imagem • 5MB por imagem
                  </Typography>
                </Box>
              </label>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Box
                  component="img"
                  src={preview}
                  alt="Preview"
                  sx={{
                    width: "100%",
                    maxHeight: 400,
                    objectFit: "contain",
                    borderRadius: 2,
                    mb: 2,
                  }}
                />
                <label htmlFor="samba-school-image-upload" style={{ display: "block" }}>
                  <Button
                    component="span"
                    disabled={loading}
                    variant="outlined"
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
                    Alterar Imagem
                  </Button>
                </label>
              </Box>
            )}
          </Box>

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
            variant="standard"
            inputProps={{ maxLength: 100 }}
            helperText={`${name.length}/100 caracteres`}
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
              "& .MuiFormHelperText-root": {
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.875rem",
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
            variant="standard"
            inputProps={{ maxLength: 200 }}
            helperText={`${description.length}/200 caracteres`}
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
              "& .MuiFormHelperText-root": {
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.875rem",
              },
            }}
          />
        </Paper>

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
            disabled={loading || !name.trim()}
            sx={{
              flex: 1,
              borderRadius: "999px",
              backgroundColor: "rgb(255, 31, 33)",
              color: "#fff",
              fontWeight: 700,
              fontSize: { xs: "0.875rem", sm: "1.1rem" },
              py: { xs: 1, sm: 1.5 },
              textTransform: "none",
              "&:hover": {
                backgroundColor: "rgb(220, 20, 22)",
              },
              "&:disabled": {
                backgroundColor: "rgba(255, 31, 33, 0.5)",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "#fff" }} />
            ) : (
              "Criar Escola de Samba"
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}


