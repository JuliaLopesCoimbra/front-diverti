"use client";
import React, { useState, useEffect, Suspense } from "react";
import {
  Button,
  Typography,
  Box,
  Container,
  CircularProgress,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/app/context/ToastContext";
import { resendVerificationEmail } from "@/app/services/auth/authService";
import { getApiUrl } from "@/app/utils/apiUrlHelper";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

const API_URL = getApiUrl();

function AwaitingEmailVerificationContent() {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();
  const params = useSearchParams();
  const { showToast } = useToast();

  const email = params.get("email") || "";

  useEffect(() => {
    if (!email) {
      router.push("/pages/auth/login");
    }
  }, [email, router]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (cooldown > 0 || !email) return;

    setLoading(true);
    try {
      await resendVerificationEmail(email);
      showToast("Email de verificação reenviado com sucesso!", "success");
      setCooldown(60); // 60 segundos (1 minuto) de cooldown
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Erro ao reenviar email";
      showToast(errorMessage, "error");
      if (errorMessage.includes("Aguarde")) {
        // Extrair segundos do erro, mas garantir pelo menos 60 segundos
        const match = errorMessage.match(/(\d+)\s+segundos/);
        if (match) {
          const seconds = parseInt(match[1]);
          setCooldown(Math.max(60, seconds)); // Garantir pelo menos 1 minuto
        } else {
          setCooldown(60); // Se não conseguir extrair, usar 60 segundos
        }
      } else {
        // Se houver erro, ainda aplicar cooldown de 1 minuto
        setCooldown(60);
      }
    } finally {
      setLoading(false);
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
            textAlign: "center",
          }}
        >
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Verifique seu Email
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 3, color: "rgba(255, 255, 255, 0.8)" }}>
            Enviamos um email de verificação para:
          </Typography>

          <Typography 
            variant="body1" 
            sx={{ 
              mb: 4, 
              fontWeight: 600,
              color: "#ffcc01",
              wordBreak: "break-all"
            }}
          >
            {email}
          </Typography>

          <Typography variant="body2" sx={{ mb: 4, color: "rgba(255, 255, 255, 0.8)" }}>
            Clique no link que enviamos para verificar seu email e continuar.
            <br />
            <br />
            Não recebeu o email? Verifique sua caixa de spam ou clique no botão abaixo para reenviar.
          </Typography>

          <Button
            fullWidth
            variant="contained"
            onClick={handleResendEmail}
            disabled={loading || cooldown > 0}
            sx={{
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
            {loading ? (
              <CircularProgress size={24} sx={{ color: "#fff" }} />
            ) : cooldown > 0 ? (
              `Aguarde ${cooldown}s para reenviar`
            ) : (
              "Reenviar Email de Verificação"
            )}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export default function AwaitingEmailVerificationPage() {
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
      <AwaitingEmailVerificationContent />
    </Suspense>
  );
}


