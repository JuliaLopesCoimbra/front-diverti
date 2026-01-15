"use client";
import { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/app/utils/apiUrlHelper";

const API_URL = getApiUrl();
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const { showToast } = useToast();
  const router = useRouter();

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
      await axios.post(`${API_URL}/auth/forgot-password`, { email });

      showToast(
        "Se o email existir, enviaremos um link para recuperação.",
        "success"
      );

      startCooldown();
    } catch {
      showToast(
        "Se o email existir, enviaremos um link para recuperação.",
        "success"
      );

      startCooldown();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        height: "100vh",
        backgroundImage: "url(/background/dashboard.png)",
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
        <Typography variant="h5" sx={{ marginBottom: "20px" }}>
          Recuperar senha
        </Typography>
        <Typography variant="body2" sx={{ marginBottom: "20px" }}>
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
            backgroundColor: "#ffcc01",
            color: "#000",
            fontWeight: 600,
            borderRadius: "14px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#e6b800",
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

        <Typography variant="body2" sx={{ marginTop: "20px", textAlign: "center" }}>
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
