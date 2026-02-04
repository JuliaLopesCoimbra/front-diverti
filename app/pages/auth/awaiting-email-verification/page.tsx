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
      setCooldown(60); // 60 segundos de cooldown
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Erro ao reenviar email";
      showToast(errorMessage, "error");
      if (errorMessage.includes("Aguarde")) {
        // Extrair segundos do erro
        const match = errorMessage.match(/(\d+)\s+segundos/);
        if (match) {
          setCooldown(parseInt(match[1]));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = () => {
    // Verificar se o email foi verificado fazendo uma requisição
    // Por enquanto, apenas redireciona para login
    router.push("/pages/auth/login");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url(/background/dashboard.png)",
        backgroundSize: "cover",
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
              mb: 2,
              py: 1.5,
              borderRadius: "12px",
              backgroundColor: "#ffcc01",
              color: "#000",
              fontWeight: 600,
              fontSize: "16px",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#ffd633",
              },
              "&:disabled": {
                backgroundColor: "rgba(255, 204, 1, 0.5)",
                color: "rgba(0, 0, 0, 0.5)",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "#000" }} />
            ) : cooldown > 0 ? (
              `Aguarde ${cooldown}s para reenviar`
            ) : (
              "Reenviar Email de Verificação"
            )}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleCheckVerification}
            sx={{
              py: 1.5,
              borderRadius: "12px",
              borderColor: "rgba(255, 255, 255, 0.5)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "16px",
              textTransform: "none",
              "&:hover": {
                borderColor: "#fff",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            Já verifiquei meu email
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

