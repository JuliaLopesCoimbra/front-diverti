"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography, IconButton, useMediaQuery, useTheme } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { getProfile, updateProfilePhoto, ProfileResponse } from "@/app/services/profile/profileService";
import { useToast } from "@/app/context/ToastContext";

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        showToast("Erro ao carregar perfil", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [showToast]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valida se é imagem
    if (!file.type.startsWith("image/")) {
      showToast("Por favor, selecione uma imagem", "error");
      return;
    }

    // Validação de tamanho: máximo 5MB por imagem
    const maxSizePerImage = 5 * 1024 * 1024; // 5MB
    
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
      // Log detalhado do erro para debug
      console.error("Erro completo ao atualizar foto:", error);
      console.error("Response data:", error?.response?.data);
      console.error("Status code:", error?.response?.status);
      console.error("Error message:", error?.message);
      
      // Extrai mensagem de erro específica
      let errorMessage = "Erro ao atualizar foto de perfil";
      
      if (error?.response?.data?.detail) {
        // Erro do backend (FastAPI)
        errorMessage = error.response.data.detail;
      } else if (error?.response?.status === 413) {
        errorMessage = "A imagem é muito grande. Tente uma imagem menor.";
      } else if (error?.response?.status === 400) {
        errorMessage = error?.response?.data?.message || "Formato de imagem inválido";
      } else if (error?.response?.status === 401) {
        errorMessage = "Sessão expirada. Faça login novamente.";
      } else if (error?.response?.status === 500) {
        errorMessage = "Erro no servidor. Tente novamente mais tarde.";
      } else if (error?.message) {
        // Erro de rede ou outro
        errorMessage = `Erro de conexão: ${error.message}`;
      }
      
      showToast(errorMessage, "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f4f7fc",
          backgroundImage: "url(/background/dashboard.png)",
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
        style={{
          minHeight: "100vh",
          backgroundColor: "#f4f7fc",
          backgroundImage: "url(/background/dashboard.png)",
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
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f7fc",
        backgroundImage: "url(/background/dashboard.png)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Container centralizado para desktop */}
      <Box
        sx={{
          width: "100%",
          maxWidth: { xs: "100%", md: "800px" },
          margin: { xs: 0, md: "0 auto" },
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "16px",
          }}
        >
          {/* SETA DE VOLTAR */}
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
        </div>

        <main
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Foto de Perfil */}
          <Box
            sx={{
              position: "relative",
              mb: { xs: 4, md: 6 },
              cursor: "pointer",
              "&:hover .camera-overlay": {
                opacity: 1,
              },
            }}
            onClick={handlePhotoClick}
          >
            <Box
              sx={{
                width: { xs: 200, md: 250 },
                height: { xs: 200, md: 250 },
                borderRadius: "50%",
                overflow: "hidden",
                border: "4px solid #FFD600",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                position: "relative",
              }}
            >
              {profile.profile_photo ? (
                <Image
                  src={profile.profile_photo}
                  alt="Foto de perfil"
                  width={250}
                  height={250}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
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
                  }}
                >
                  <PersonIcon sx={{ fontSize: { xs: 80, md: 100 }, color: "white" }} />
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
                  backgroundColor: "rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
              >
                {uploading ? (
                  <CircularProgress sx={{ color: "#FFD600" }} size={40} />
                ) : (
                  <CameraAltIcon sx={{ fontSize: { xs: 40, md: 50 }, color: "#FFD600" }} />
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

          {/* Informações do Usuário */}
          <Box
            sx={{
              width: "100%",
              maxWidth: { xs: "100%", md: "600px" },
              padding: { xs: "30px", md: "40px" },
              color: "white",
              display: "flex",
              flexDirection: "column",
              alignItems: { xs: "flex-start", md: "flex-start" },
            }}
          >
            {/* Nome */}
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 }, mb: { xs: 2, md: 3 } }}>
              <PersonIcon sx={{ fontSize: { xs: 20, md: 28 }, color: "yellow" }} />
              <Typography sx={{ margin: 0, fontSize: { xs: 15, md: 22 }, fontWeight: { md: 500 } }}>
                {profile.name || "Não informado"}
              </Typography>
            </Box>

            {/* Email */}
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 }, mb: { xs: 2, md: 3 } }}>
              <EmailIcon sx={{ fontSize: { xs: 20, md: 28 }, color: "yellow" }} />
              <Typography sx={{ margin: 0, fontSize: { xs: 15, md: 22 }, fontWeight: { md: 500 } }}>
                {profile.email}
              </Typography>
            </Box>

            {/* Status de Verificação */}
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 }, mb: { xs: 2, md: 3 } }}>
              <VerifiedUserIcon sx={{ fontSize: { xs: 20, md: 28 }, color: "yellow" }} />
              <Typography sx={{ margin: 0, fontSize: { xs: 15, md: 22 }, fontWeight: { md: 500 } }}>
                {profile.is_email_verified ? "Email verificado" : "Email não verificado"}
              </Typography>
            </Box>

            {/* Data de Criação */}
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 }, mb: { xs: 2, md: 3 } }}>
              <CalendarTodayIcon sx={{ fontSize: { xs: 20, md: 28 }, color: "yellow" }} />
              <Typography sx={{ margin: 0, fontSize: { xs: 15, md: 22 }, fontWeight: { md: 500 } }}>
                Membro desde {formatDate(profile.created_at)}
              </Typography>
            </Box>

            {/* Último Login */}
            {profile.last_login && (
              <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 } }}>
                <CalendarTodayIcon sx={{ fontSize: { xs: 20, md: 28 }, color: "yellow" }} />
                <Typography sx={{ margin: 0, fontSize: { xs: 15, md: 22 }, fontWeight: { md: 500 } }}>
                  Último acesso {formatDate(profile.last_login)}
                </Typography>
              </Box>
            )}
          </Box>
        </main>
      </Box>
    </div>
  );
}

