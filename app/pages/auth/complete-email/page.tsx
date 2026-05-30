"use client";
import React, { useState, useEffect, Suspense } from "react";
import {
  Button,
  TextField,
  Typography,
  Box,
  Container,
  CircularProgress,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/app/context/ToastContext";
import { useAuth } from "@/app/context/AuthContext";
import axios from "axios";
import { getApiUrl } from "@/app/utils/apiUrlHelper";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

const API_URL = getApiUrl();

function CompleteEmailContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const { showToast } = useToast();
  const { login } = useAuth();

  useEffect(() => {
    const tempToken = params.get("temp_token");
    const name = params.get("name");
    if (!tempToken) {
      router.push("/pages/auth/login");
    }
    // Preencher nome se disponível
    if (name) {
      // Não precisamos fazer nada com o nome aqui, mas podemos usar para contexto
    }
  }, [params, router]);

  const handleSubmit = async () => {
    if (!email || !email.includes("@")) {
      showToast("Por favor, informe um email válido", "error");
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("Por favor, informe um email válido", "error");
      return;
    }

    setLoading(true);
    try {
      const tempToken = params.get("temp_token");

      const response = await axios.post<{
        access_token?: string;
        refresh_token?: string;
        token_type?: string;
        requires_age_verification?: boolean;
        requires_profile_completion?: boolean;
        requires_email_verification?: boolean;
        temp_token?: string;
        email?: string;
        message?: string;
      }>(
        `${API_URL}/auth/complete-email`,
        {
          email: email.trim().toLowerCase(),
        },
        {
          headers: {
            Authorization: `Bearer ${tempToken}`,
          },
        }
      );

      // Se precisa verificar email, redirecionar para página de aguardando verificação
      if (response.data.requires_email_verification) {
        const emailParam = response.data.email || email;
        const params = new URLSearchParams({
          email: emailParam,
          temp_token: response.data.temp_token || ""
        });
        setTimeout(() => {
          router.push(`/pages/auth/awaiting-email-verification?${params.toString()}`);
        }, 100);
        return;
      }

      // Verificar se precisa completar outras etapas
      if (response.data.requires_age_verification && response.data.temp_token) {
        showToast("Email cadastrado! Agora precisamos verificar sua idade.", "success");
        const params = new URLSearchParams({
          temp_token: response.data.temp_token,
          requires_age_verification: "true"
        });
        setTimeout(() => {
          router.push(`/pages/auth/age-verification?${params.toString()}`);
        }, 100);
        return;
      }

      if (response.data.requires_profile_completion && response.data.temp_token) {
        showToast("Email cadastrado! Agora complete seu perfil.", "success");
        const params = new URLSearchParams({
          temp_token: response.data.temp_token,
          requires_profile_completion: "true"
        });
        setTimeout(() => {
          router.push(`/pages/auth/complete-profile?${params.toString()}`);
        }, 100);
        return;
      }

      // Se chegou aqui, tem tokens finais
      if (response.data.access_token && response.data.refresh_token) {
        // Fazer login automaticamente com os tokens retornados
        const { access_token, refresh_token } = response.data;
        
        // Usar a função login do AuthContext
        login(access_token, refresh_token);
        
        // Salvar tokens
        localStorage.setItem("circuito_access_token", access_token);
        document.cookie = `refresh_token=${refresh_token}; path=/; secure`;

        showToast("Email cadastrado com sucesso! Redirecionando...", "success");
        
        setTimeout(() => {
          router.push("/pages/user/home");
        }, 100);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Erro ao cadastrar email";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleSubmit();
    }
  };

  return (
    <Box
      sx={{
        ...dashboardBackgroundSx,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "40px 32px",
            color: "#fff",
          }}
        >
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Informe seu Email
          </Typography>
          <Typography variant="body2" sx={{ mb: 4, color: "rgba(255, 255, 255, 0.8)" }}>
            O Facebook não retornou seu email. Por favor, informe um email válido para continuar.
          </Typography>

          <TextField
            fullWidth
            label="Endereço de e-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoFocus
            inputProps={{
              autoCapitalize: "none",
              autoCorrect: "off",
              spellCheck: false,
            }}
            InputLabelProps={{
              shrink: true,
              sx: {
                color: "#fff",
                fontSize: 13,
                transform: "translate(14px, -9px) scale(1)",
                "&.Mui-focused": {
                  color: "#fff",
                },
              },
            }}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "#fff",
                borderRadius: "12px",
                transition: "all 0.2s ease",
                "& fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  borderWidth: "1.5px",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#ffcc01",
                  borderWidth: "2px",
                },
                "&.Mui-focused": {
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                },
                "& input:-webkit-autofill": {
                  WebkitBoxShadow: "0 0 0 1000px rgba(255, 255, 255, 0.05) inset",
                  WebkitTextFillColor: "#fff",
                  transition: "background-color 9999s ease-in-out 0s",
                },
                "& input:-webkit-autofill:focus": {
                  WebkitBoxShadow: "0 0 0 1000px rgba(255, 255, 255, 0.08) inset",
                  WebkitTextFillColor: "#fff",
                },
              },
            }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !email}
            sx={{
              mt: 2,
              py: 1.5,
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              color: "#111111",
              fontWeight: 600,
              fontSize: "16px",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#e8e8e8",
              },
              "&:disabled": {
                backgroundColor: "rgba(255, 204, 1, 0.5)",
                color: "rgba(0, 0, 0, 0.5)",
              },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Continuar"}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export default function CompleteEmailPage() {
  return (
    <Suspense fallback={
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    }>
      <CompleteEmailContent />
    </Suspense>
  );
}


