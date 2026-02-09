"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Box,
  CircularProgress,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CakeIcon from "@mui/icons-material/Cake";
import WcIcon from "@mui/icons-material/Wc";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import { getProfile, updateProfilePhoto, updateProfile, ProfileResponse } from "@/app/services/profile/profileService";
import { useToast } from "@/app/context/ToastContext";

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [editingBirthDate, setEditingBirthDate] = useState(false);
  const [editingGender, setEditingGender] = useState(false);
  const [birthDateValue, setBirthDateValue] = useState("");
  const [genderValue, setGenderValue] = useState<"male" | "female" | "other" | "prefer_not_to_say" | "">("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função para extrair apenas a data (YYYY-MM-DD) sem problemas de timezone
  const extractDateOnly = (dateString: string): string => {
    if (!dateString) return "";
    // Se já está no formato YYYY-MM-DD, retorna direto
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // Se a string começa com YYYY-MM-DD (formato ISO), extrai os primeiros 10 caracteres
    const isoDateMatch = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoDateMatch) {
      return isoDateMatch[1];
    }
    // Fallback: tenta converter e usar UTC
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
      return "";
    } catch {
      return "";
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
        // Inicializa valores de edição
        if (data.birth_date) {
          setBirthDateValue(extractDateOnly(data.birth_date));
        }
        if (data.gender) {
          setGenderValue(data.gender as "male" | "female" | "other" | "prefer_not_to_say");
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        showToast("Erro ao carregar perfil", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [showToast]);

  // Controla animações quando a página carrega
  useEffect(() => {
    setShouldAnimate(true);
    const timer = setTimeout(() => {
      setShouldAnimate(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Por favor, selecione uma imagem", "error");
      return;
    }

    const maxSizePerImage = 5 * 1024 * 1024;
    if (file.size > maxSizePerImage) {
      showToast("A imagem é muito grande. Máximo de 5MB por imagem.", "error");
      return;
    }

    setUploading(true);
    try {
      const updatedProfile = await updateProfilePhoto(file);
      setProfile(updatedProfile);
      showToast("Foto de perfil atualizada com sucesso!", "success");
    } catch (error: any) {
      let errorMessage = "Erro ao atualizar foto de perfil";
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.response?.status === 413) {
        errorMessage = "A imagem é muito grande. Tente uma imagem menor.";
      } else if (error?.response?.status === 400) {
        errorMessage = error?.response?.data?.message || "Formato de imagem inválido";
      } else if (error?.response?.status === 401) {
        errorMessage = "Sessão expirada. Faça login novamente.";
      } else if (error?.response?.status === 500) {
        errorMessage = "Erro no servidor. Tente novamente mais tarde.";
      }
      showToast(errorMessage, "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveBirthDate = async () => {
    if (!birthDateValue) {
      showToast("Por favor, informe uma data de nascimento", "error");
      return;
    }

    setSaving(true);
    try {
      const updatedProfile = await updateProfile({
        birth_date: birthDateValue,
      });
      setProfile(updatedProfile);
      // Atualiza o valor do campo com a data retornada do servidor
      if (updatedProfile.birth_date) {
        setBirthDateValue(extractDateOnly(updatedProfile.birth_date));
      }
      setEditingBirthDate(false);
      showToast("Data de nascimento atualizada com sucesso!", "success");
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      showToast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelBirthDate = () => {
    if (profile?.birth_date) {
      setBirthDateValue(extractDateOnly(profile.birth_date));
    } else {
      setBirthDateValue("");
    }
    setEditingBirthDate(false);
  };

  const handleSaveGender = async () => {
    if (!genderValue) {
      showToast("Por favor, selecione um sexo", "error");
      return;
    }

    setSaving(true);
    try {
      const updatedProfile = await updateProfile({
        gender: genderValue,
      });
      setProfile(updatedProfile);
      setEditingGender(false);
      showToast("Sexo atualizado com sucesso!", "success");
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      showToast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelGender = () => {
    if (profile?.gender) {
      setGenderValue(profile.gender as "male" | "female" | "other" | "prefer_not_to_say");
    } else {
      setGenderValue("");
    }
    setEditingGender(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    
    // Extrai a data diretamente da string para evitar problemas de timezone
    const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1; // JavaScript months são 0-indexed
      const day = parseInt(dateMatch[3], 10);
      
      // Cria uma data local com os valores extraídos (sem timezone)
      const date = new Date(year, month, day);
      
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
    
    // Fallback para formato antigo
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatGender = (gender: string | null) => {
    if (!gender) return "Não informado";
    const genderMap: Record<string, string> = {
      male: "Masculino",
      female: "Feminino",
      other: "Outro",
      prefer_not_to_say: "Prefiro não informar",
    };
    return genderMap[gender] || gender;
  };

  // Função auxiliar para extrair mensagem de erro do backend
  const extractErrorMessage = (error: any): string => {
    // Tratar erros de validação do Pydantic (status 422)
    if (error?.response?.status === 422 && Array.isArray(error?.response?.data?.detail)) {
      const validationErrors = error.response.data.detail as Array<{ loc: string[]; msg: string; type: string }>;
      if (validationErrors.length > 0) {
        return validationErrors[0].msg;
      }
    }

    // Tratar outros tipos de erro
    const detailValue = error?.response?.data?.detail;
    
    if (typeof detailValue === 'string') {
      return detailValue;
    } else if (Array.isArray(detailValue) && detailValue.length > 0) {
      const firstError = detailValue[0];
      if (typeof firstError === 'object' && firstError !== null && 'msg' in firstError) {
        return firstError.msg;
      }
      return String(firstError);
    } else if (typeof detailValue === 'object' && detailValue !== null && 'msg' in detailValue) {
      return detailValue.msg;
    }

    // Fallback para outros tipos de erro
    return error?.response?.data?.message || error?.message || "Erro ao processar solicitação";
  };

  if (loading) {
    return (
      <div
        className="dashboard-page-background"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        <CircularProgress sx={{ color: "#ffc91f" }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        className="dashboard-page-background"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        <Typography>Erro ao carregar perfil</Typography>
      </div>
    );
  }

  return (
    <div
      className="dashboard-page-background"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "40px",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: { xs: "100%", md: "900px" },
          margin: { xs: 0, md: "0 auto" },
          display: "flex",
          flexDirection: "column",
          paddingX: { xs: "16px", md: "24px" },
        }}
      >
        {/* Header com botão voltar */}
        <Box className={shouldAnimate ? "slide-up-animation" : ""}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              padding: "16px",
            }}
          >
            <IconButton
              onClick={() => router.back()}
              sx={{
                color: "white",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              <ArrowBackIosIcon />
            </IconButton>
            <Typography
              sx={{
                fontSize: { xs: "20px", md: "24px" },
                fontWeight: 600,
                color: "white",
                ml: 1,
              }}
            >
              Meu Perfil
            </Typography>
          </Box>
        </Box>

        <main
          className={shouldAnimate ? "slide-up-delay-1" : ""}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          {/* Foto de Perfil */}
          <Box
            sx={{
              position: "relative",
              mb: { xs: 4, md: 5 },
              cursor: "pointer",
              "&:hover .camera-overlay": {
                opacity: 1,
              },
            }}
            onClick={handlePhotoClick}
          >
            <Box
              sx={{
                width: { xs: 150, md: 200 },
                height: { xs: 150, md: 200 },
                borderRadius: "50%",
                overflow: "hidden",
                border: "4px solid #FFD600",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                position: "relative",
                "& > span": {
                  width: "100% !important",
                  height: "100% !important",
                  display: "block !important",
                  borderRadius: "50% !important",
                  overflow: "hidden !important",
                },
                "& img": {
                  borderRadius: "50% !important",
                  objectFit: "cover !important",
                },
              }}
            >
              {profile.profile_photo ? (
                <Image
                  src={profile.profile_photo}
                  alt="Foto de perfil"
                  width={200}
                  height={200}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                  }}
                >
                  <PersonIcon sx={{ fontSize: { xs: 60, md: 80 }, color: "white" }} />
                </Box>
              )}
              <Box
                className="camera-overlay"
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0,
                  transition: "opacity 0.3s",
                  borderRadius: "50%",
                }}
              >
                {uploading ? (
                  <CircularProgress sx={{ color: "#FFD600" }} size={40} />
                ) : (
                  <CameraAltIcon sx={{ fontSize: { xs: 30, md: 40 }, color: "#FFD600" }} />
                )}
              </Box>
            </Box>
          </Box>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handlePhotoChange}
          />

          {/* Cards de Informações */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              paddingX: { xs: 0, md: 0 },
              paddingY: { xs: "20px", md: "40px" },
            }}
          >
            {/* Card Nome */}
            <Card
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <PersonIcon sx={{ fontSize: 28, color: "#FFD600" }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.7)", mb: 0.5 }}>
                      Nome
                    </Typography>
                    <Typography sx={{ fontSize: 18, fontWeight: 500, color: "white" }}>
                      {profile.name || "Não informado"}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Card Email */}
            <Card
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <EmailIcon sx={{ fontSize: 28, color: "#FFD600" }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.7)", mb: 0.5 }}>
                      Email
                    </Typography>
                    <Typography sx={{ fontSize: 18, fontWeight: 500, color: "white" }}>
                      {profile.email}
                    </Typography>
                  </Box>
                  {profile.is_email_verified && (
                    <VerifiedUserIcon sx={{ fontSize: 20, color: "#4CAF50" }} />
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Card Data de Nascimento - Editável */}
            <Card
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <CakeIcon sx={{ fontSize: 28, color: "#FFD600" }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.7)", mb: 1 }}>
                      Data de Nascimento
                    </Typography>
                    {editingBirthDate ? (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <TextField
                          type="date"
                          value={birthDateValue}
                          onChange={(e) => setBirthDateValue(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "rgba(255, 255, 255, 0.1)",
                              color: "white",
                              "& fieldset": {
                                borderColor: "rgba(255, 255, 255, 0.3)",
                              },
                              "&:hover fieldset": {
                                borderColor: "#FFD600",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "#FFD600",
                              },
                            },
                            "& .MuiInputBase-input": {
                              color: "white",
                            },
                          }}
                          inputProps={{
                            max: new Date().toISOString().split("T")[0],
                          }}
                        />
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            variant="contained"
                            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                            onClick={handleSaveBirthDate}
                            disabled={saving}
                            sx={{
                              backgroundColor: "#FFD600",
                              color: "#000",
                              "&:hover": {
                                backgroundColor: "#FFC107",
                              },
                              flex: 1,
                            }}
                          >
                            Salvar
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={handleCancelBirthDate}
                            disabled={saving}
                            sx={{
                              borderColor: "rgba(255,255,255,0.5)",
                              color: "white",
                              "&:hover": {
                                borderColor: "#FFD600",
                                backgroundColor: "rgba(255, 215, 0, 0.1)",
                              },
                              flex: 1,
                            }}
                          >
                            Cancelar
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography sx={{ fontSize: 18, fontWeight: 500, color: "white" }}>
                          {profile.birth_date ? formatDate(profile.birth_date) : "Não informado"}
                        </Typography>
                        <IconButton
                          onClick={() => setEditingBirthDate(true)}
                          sx={{
                            color: "#FFD600",
                            "&:hover": {
                              backgroundColor: "rgba(255, 215, 0, 0.1)",
                            },
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Card Sexo - Editável */}
            <Card
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <WcIcon sx={{ fontSize: 28, color: "#FFD600" }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.7)", mb: 1 }}>
                      Sexo
                    </Typography>
                    {editingGender ? (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <FormControl fullWidth>
                          <Select
                            value={genderValue}
                            onChange={(e) => setGenderValue(e.target.value as typeof genderValue)}
                            sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.1)",
                              color: "white",
                              "& .MuiSelect-select": {
                                color: "white",
                              },
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "rgba(255, 255, 255, 0.3)",
                              },
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#FFD600",
                              },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#FFD600",
                              },
                              "& .MuiSvgIcon-root": {
                                color: "white",
                              },
                            }}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                                  backdropFilter: "blur(10px)",
                                  border: "1px solid rgba(255, 255, 255, 0.1)",
                                  borderRadius: "14px",
                                  mt: 1,
                                  "& .MuiMenuItem-root": {
                                    color: "#fff",
                                    "&:hover": {
                                      backgroundColor: "rgba(255, 215, 0, 0.2)",
                                    },
                                    "&.Mui-selected": {
                                      backgroundColor: "rgba(255, 215, 0, 0.3)",
                                      color: "#FFD600",
                                      "&:hover": {
                                        backgroundColor: "rgba(255, 215, 0, 0.4)",
                                      },
                                    },
                                  },
                                },
                              },
                            }}
                          >
                            <MenuItem value="male">Masculino</MenuItem>
                            <MenuItem value="female">Feminino</MenuItem>
                            <MenuItem value="other">Outro</MenuItem>
                            <MenuItem value="prefer_not_to_say">Prefiro não informar</MenuItem>
                          </Select>
                        </FormControl>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            variant="contained"
                            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                            onClick={handleSaveGender}
                            disabled={saving}
                            sx={{
                              backgroundColor: "#FFD600",
                              color: "#000",
                              "&:hover": {
                                backgroundColor: "#FFC107",
                              },
                              flex: 1,
                            }}
                          >
                            Salvar
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={handleCancelGender}
                            disabled={saving}
                            sx={{
                              borderColor: "rgba(255,255,255,0.5)",
                              color: "white",
                              "&:hover": {
                                borderColor: "#FFD600",
                                backgroundColor: "rgba(255, 215, 0, 0.1)",
                              },
                              flex: 1,
                            }}
                          >
                            Cancelar
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography sx={{ fontSize: 18, fontWeight: 500, color: "white" }}>
                          {formatGender(profile.gender)}
                        </Typography>
                        <IconButton
                          onClick={() => setEditingGender(true)}
                          sx={{
                            color: "#FFD600",
                            "&:hover": {
                              backgroundColor: "rgba(255, 215, 0, 0.1)",
                            },
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Card Membro Desde */}
            <Card
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <CalendarTodayIcon sx={{ fontSize: 28, color: "white" }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.7)", mb: 0.5 }}>
                      Membro Desde
                    </Typography>
                    <Typography sx={{ fontSize: 18, fontWeight: 500, color: "white" }}>
                      {formatDate(profile.created_at)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Card Último Login */}
            {profile.last_login && (
              <Card
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "16px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <CalendarTodayIcon sx={{ fontSize: 28, color: "white" }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.7)", mb: 0.5 }}>
                        Último Acesso
                      </Typography>
                      <Typography sx={{ fontSize: 18, fontWeight: 500, color: "white" }}>
                        {formatDate(profile.last_login)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        </main>
      </Box>
    </div>
  );
}
