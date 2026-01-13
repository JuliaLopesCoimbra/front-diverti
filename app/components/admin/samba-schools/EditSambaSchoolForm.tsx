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
  updateSambaSchool,
  UpdateSambaSchoolData,
  SambaSchoolResponse,
  getSambaSchoolById,
} from "@/app/services/sambaSchools/sambaSchoolService";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";

interface EditSambaSchoolFormProps {
  eventId: number;
  schoolId: number;
  onSuccess?: () => void;
}

export default function EditSambaSchoolForm({
  eventId,
  schoolId,
  onSuccess,
}: EditSambaSchoolFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSchool, setLoadingSchool] = useState(true);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loadSchool = async () => {
      try {
        setLoadingSchool(true);
        const school = await getSambaSchoolById(eventId, schoolId);
        setName(school.name);
        setDescription(school.description || "");
        if (school.image_url) {
          setPreview(school.image_url);
        }
      } catch (err) {
        showToast("Erro ao carregar escola de samba", "error");
        router.push("/pages/user/home");
      } finally {
        setLoadingSchool(false);
      }
    };

    loadSchool();
  }, [eventId, schoolId, showToast, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      const data: UpdateSambaSchoolData = {
        name: name.trim(),
        description: description.trim() || undefined,
        image: image || undefined,
      };

      await updateSambaSchool(eventId, schoolId, data);
      showToast("Escola de samba atualizada com sucesso!", "success");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/pages/admin/samba-schools/${eventId}/${schoolId}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Erro ao atualizar escola de samba", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingSchool) {
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
          Editar Escola de Samba
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
            label="Nome *"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={4}
            disabled={loading}
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

          <Box>
            <Typography
              variant="body2"
              sx={{ mb: 1.5, color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}
            >
              Imagem da Escola de Samba
            </Typography>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="samba-school-image-upload-edit"
              type="file"
              onChange={handleImageChange}
              disabled={loading}
            />
            <label htmlFor="samba-school-image-upload-edit">
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
        </Paper>

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
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
            disabled={loading || !name.trim()}
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




