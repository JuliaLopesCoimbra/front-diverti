"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Box, CircularProgress, Typography } from "@mui/material";
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

    setUploading(true);
    try {
      const updatedProfile = await updateProfilePhoto(file);
      setProfile(updatedProfile);
      showToast("Foto de perfil atualizada com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao atualizar foto:", error);
      showToast("Erro ao atualizar foto de perfil", "error");
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
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 32px",
        }}
      >
        {/* LOGO + TEXTO */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image
            src="/logo/logon1.png"
            alt="Camarote N1"
            width={60}
            height={60}
          />
          <strong style={{ fontSize: 22, color: "white" }}>Camarote N1</strong>
        </div>
        <Button
          onClick={() => router.back()}
          sx={{
            color: "white",
            textTransform: "none",
            fontWeight: 500,
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.1)",
            },
          }}
        >
          Voltar
        </Button>
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
            mb: 4,
            cursor: "pointer",
            "&:hover .camera-overlay": {
              opacity: 1,
            },
          }}
          onClick={handlePhotoClick}
        >
          <Box
            sx={{
              width: 200,
              height: 200,
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
                width={200}
                height={200}
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
                <PersonIcon sx={{ fontSize: 80, color: "white" }} />
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
                <CameraAltIcon sx={{ fontSize: 40, color: "#FFD600" }} />
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
            maxWidth: 700,
            padding: "30px",
            alignSelf: "flex-start",
            color: "white",
          }}
        >
          {/* Nome */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <PersonIcon style={{ color: "yellow" }} />
            <p style={{ margin: 0, fontSize: 15 }}>
              {profile.name || "Não informado"}
            </p>
          </Box>

          {/* Email */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <EmailIcon style={{ color: "yellow" }} />
            <p style={{ margin: 0, fontSize: 15 }}>
              {profile.email}
            </p>
          </Box>

          {/* Status de Verificação */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <VerifiedUserIcon style={{ color: "yellow" }} />
            <p style={{ margin: 0, fontSize: 15 }}>
              {profile.is_email_verified ? "Email verificado" : "Email não verificado"}
            </p>
          </Box>

          {/* Data de Criação */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <CalendarTodayIcon style={{ color: "yellow" }} />
            <p style={{ margin: 0, fontSize: 15 }}>
              Membro desde {formatDate(profile.created_at)}
            </p>
          </Box>

          {/* Último Login */}
          {profile.last_login && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarTodayIcon style={{ color: "yellow" }} />
              <p style={{ margin: 0, fontSize: 15 }}>
                Último acesso {formatDate(profile.last_login)}
              </p>
            </Box>
          )}
        </Box>
      </main>
    </div>
  );
}

