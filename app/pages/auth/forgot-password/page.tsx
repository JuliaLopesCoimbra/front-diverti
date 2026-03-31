"use client";
import { useState, useEffect } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/app/utils/apiUrlHelper";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

const API_URL = getApiUrl();

interface ForgotPasswordResponse {
  message?: string;
}

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [mounted, setMounted] = useState(false);

  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const startCooldown = () => {
    setCooldown(60);

    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async () => {
    if (cooldown > 0) return;

    if (!isValidEmail(email)) {
      setEmailError(true);
      showToast("Informe um e-mail válido.", "error");
      return;
    }

    setEmailError(false);
    setLoading(true);

    try {
      const response = await axios.post<ForgotPasswordResponse>(`${API_URL}/auth/forgot-password`, { email });

      showToast(
        response.data.message || "Email de recuperação enviado com sucesso! Verifique sua caixa de entrada.",
        "success"
      );

      startCooldown();
    } catch (error: any) {
      if (error.response?.status === 404) {
        showToast(
          "Email não encontrado. Verifique se o email está correto.",
          "error"
        );
      } else if (error.response?.status === 429) {
        showToast(
          "Muitas tentativas. Tente novamente em 1 hora.",
          "error"
        );
      } else {
        showToast(
          error.response?.data?.detail || "Erro ao enviar email. Tente novamente.",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        ...dashboardBackgroundSx,
        justifyContent: "center",
        height: "100vh",
        padding: "20px",
      }}
    >
      <Box
        sx={{
          padding: "30px",
          color: "white",
          width: "100%",
          maxWidth: "400px",
          textAlign: "left",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            marginBottom: "20px",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(-20px)",
            transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
          }}
        >
          Recuperar senha
        </Typography>
        <Typography
          variant="body2"
          sx={{
            marginBottom: "20px",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(-20px)",
            transition: "opacity 0.6s ease-out 0.1s, transform 0.6s ease-out 0.1s",
          }}
        >
          Informe seu e-mail para receber o link de redefinição.
        </Typography>

        <TextField
          fullWidth
          label="Endereço de e-mail"
          variant="outlined"
          margin="normal"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(false);
          }}
          error={emailError}
          helperText={emailError ? "Digite um e-mail válido" : ""}
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
          FormHelperTextProps={{
            sx: { color: "#ff6b6b", fontSize: 12 },
          }}
          sx={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(-20px)",
            transition: "opacity 0.6s ease-out 0.2s, transform 0.6s ease-out 0.2s",
            "& .MuiOutlinedInput-root": {
              backgroundColor: "transparent",
              color: "#fff",
              borderRadius: "14px",
              "& fieldset": {
                borderColor: emailError ? "#ff6b6b" : "#fff",
              },
              "&:hover fieldset": {
                borderColor: emailError ? "#ff6b6b" : "#fff",
              },
              "&.Mui-focused fieldset": {
                borderColor: emailError ? "#ff6b6b" : "#fff",
              },
              "&.Mui-error fieldset": {
                borderColor: "#ff6b6b",
              },
              "& input:-webkit-autofill": {
                WebkitBoxShadow: "0 0 0 1000px transparent inset",
                WebkitTextFillColor: "#fff",
                transition: "background-color 9999s ease-in-out 0s",
              },
              "& input:-webkit-autofill:focus": {
                WebkitBoxShadow: "0 0 0 1000px transparent inset",
                WebkitTextFillColor: "#fff",
              },
            },
          }}
        />

        <Button
          fullWidth
          variant="contained"
          sx={{
            mt: 2,
            backgroundColor: "rgb(255, 31, 33)",
            color: "#fff",
            fontWeight: 600,
            borderRadius: "14px",
            textTransform: "none",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(-20px)",
            transition: "opacity 0.6s ease-out 0.3s, transform 0.6s ease-out 0.3s",
            "&:hover": {
              backgroundColor: "rgb(220, 20, 22)",
            },
            "&.Mui-disabled": {
              backgroundColor: "rgba(255, 204, 1, 0.4)",
              color: "rgba(0,0,0,0.6)",
            },
          }}
          onClick={handleSubmit}
          disabled={loading || cooldown > 0}
        >
          {loading
            ? "Enviando..."
            : cooldown > 0
            ? `Aguarde ${cooldown}s`
            : "Enviar link"}
        </Button>

        <Typography
          variant="body2"
          sx={{
            marginTop: "20px",
            textAlign: "center",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(-20px)",
            transition: "opacity 0.6s ease-out 0.4s, transform 0.6s ease-out 0.4s",
          }}
        >
          Lembrou sua senha?{" "}
          <a
            href="/pages/auth/login"
            style={{ textDecoration: "none", color: "#ffcc01" }}
          >
            Voltar ao login
          </a>
        </Typography>
      </Box>
    </Box>
  );
}

