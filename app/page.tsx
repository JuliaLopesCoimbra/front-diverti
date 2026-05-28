"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Button,
  TextField,
  Typography,
  Box,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff, Email, Google, Facebook } from "@mui/icons-material";
import { loginUser, resendVerificationEmail } from "@/app/services/auth/authService";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

interface LoginData {
  email: string;
  password: string;
  remember_me?: boolean;
}

const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "#fff",
    borderRadius: "14px",
    transition: "all 0.25s ease",
    "& fieldset": { borderColor: "rgba(255,255,255,0.18)", borderWidth: "1.5px" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.38)" },
    "&.Mui-focused fieldset": { borderColor: "#ffffff", borderWidth: "2px" },
    "&.Mui-focused": { backgroundColor: "rgba(255,255,255,0.09)" },
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 1000px rgba(15,15,15,0.95) inset",
      WebkitTextFillColor: "#fff",
      transition: "background-color 9999s ease-in-out 0s",
    },
    "& input:-webkit-autofill:focus": {
      WebkitBoxShadow: "0 0 0 1000px rgba(15,15,15,0.95) inset",
      WebkitTextFillColor: "#fff",
    },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)", fontSize: 14 },
  "& .MuiInputLabel-root.Mui-focused": { color: "rgba(255,255,255,0.85)" },
};

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [mounted, setMounted] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const id = setInterval(() => setCooldownSeconds((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldownSeconds]);

  const handleLogin = async () => {
    setLoading(true);
    setShowResendEmail(false);
    try {
      const loginData: LoginData = { email, password };
      const response = await loginUser(loginData);
      setShowForgotPassword(false);
      showToast("Login realizado com sucesso!", "success");
      const { access_token, refresh_token } = response;
      login(access_token, refresh_token);
      localStorage.setItem("access_token", access_token);
      document.cookie = `refresh_token=${refresh_token}; path=/; secure`;
      router.push("/pages/user/home");
    } catch (err: unknown) {
      setShowForgotPassword(true);
      if (err instanceof Error) {
        if (err.message === "PROFILE_COMPLETION_REQUIRED" && (err as any).tempToken) {
          router.push(`/pages/auth/complete-profile?temp_token=${(err as any).tempToken}&requires_profile_completion=true`);
          return;
        }
        if (err.message === "AGE_VERIFICATION_REQUIRED" && (err as any).tempToken) {
          router.push(`/pages/auth/age-verification?temp_token=${(err as any).tempToken}&requires_age_verification=true`);
          return;
        }
        const msg = err.message.toLowerCase();
        if (
          msg.includes("confirme seu e-mail") ||
          msg.includes("confirme seu email") ||
          msg.includes("email não confirmado")
        ) {
          setShowResendEmail(true);
        }
        showToast(err.message, "error");
      } else {
        showToast("Erro ao fazer login. Tente novamente.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      showToast("Por favor, insira seu email primeiro", "error");
      return;
    }
    if (cooldownSeconds > 0) return;
    setResendLoading(true);
    try {
      await resendVerificationEmail(email);
      setCooldownSeconds(60);
      showToast("Email de verificação reenviado! Verifique também sua pasta de spam.", "success");
    } catch (err: unknown) {
      if (err instanceof Error) {
        const match = err.message.match(/(\d+)\s*segundos?/i);
        if (match) setCooldownSeconds(parseInt(match[1]));
        showToast(err.message, "error");
      } else {
        showToast("Erro ao reenviar email. Tente novamente.", "error");
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && email && password && !loading) handleLogin();
  };

  return (
    <Box
      sx={{
        ...dashboardBackgroundSx,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100svh",
        padding: { xs: "20px", md: "40px" },
        position: "relative",
        "&::before": {
          content: '""',
          position: "fixed",
          inset: 0,
          background:
            "linear-gradient(170deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)",
          zIndex: 0,
          pointerEvents: "none",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: { xs: "100%", sm: "400px" },
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(28px)",
          transition: "opacity 0.55s ease, transform 0.55s ease",
        }}
      >
        {/* Logo */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3.5 }}>
          <Box
            sx={{
              filter:
                "drop-shadow(0 0 18px rgba(255,31,33,0.5)) drop-shadow(0 0 40px rgba(255,31,33,0.2))",
            }}
          >
            <Image
              src="/logo/logo-circuito.png"
              alt="Circuito Sertanejo"
              width={220}
              height={80}
              style={{ objectFit: "contain" }}
              priority
            />
          </Box>
        </Box>

        {/* Card */}
        <Box
          sx={{
            backgroundColor: "rgba(8,8,8,0.62)",
            backdropFilter: "blur(30px)",
            WebkitBackdropFilter: "blur(30px)",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow:
              "0 28px 72px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)",
            padding: { xs: "28px 22px 32px", md: "36px 32px 40px" },
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: "15%",
              width: "70%",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(255,31,33,0.65), transparent)",
            },
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: "#fff",
              fontWeight: 700,
              textAlign: "center",
              mb: 0.5,
              fontSize: { xs: "20px", md: "22px" },
              letterSpacing: "-0.3px",
            }}
          >
            Bem-vindo de volta
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.45)",
              textAlign: "center",
              fontSize: { xs: "13px", md: "14px" },
              mb: 3,
            }}
          >
            Entre com suas credenciais para continuar
          </Typography>

          <TextField
            fullWidth
            label="E-mail"
            type="email"
            variant="outlined"
            margin="dense"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            inputProps={{ autoCapitalize: "none", autoCorrect: "off", spellCheck: false }}
            sx={inputSx}
          />

          <TextField
            fullWidth
            label="Senha"
            variant="outlined"
            margin="dense"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((p) => !p)}
                    edge="end"
                    sx={{ color: "rgba(255,255,255,0.45)", "&:hover": { color: "#fff" } }}
                  >
                    {showPassword ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ ...inputSx, mt: 1.5 }}
          />

          {showForgotPassword && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 13,
                  cursor: "pointer",
                  fontWeight: 500,
                  transition: "color 0.2s",
                  "&:hover": { color: "#fff", textDecoration: "underline" },
                }}
                onClick={() => router.push("/pages/auth/forgot-password")}
              >
                Esqueceu a senha?
              </Typography>
            </Box>
          )}

          {/* Reenvio de email */}
          {showResendEmail && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: "rgba(255,204,1,0.08)",
                borderRadius: "12px",
                border: "1px solid rgba(255,204,1,0.25)",
              }}
            >
              <Typography sx={{ color: "rgba(255,255,255,0.85)", mb: 1.5, fontSize: 13 }}>
                Seu email ainda não foi confirmado. Reenvie o email de verificação.
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Email fontSize="small" />}
                onClick={handleResendEmail}
                disabled={resendLoading || cooldownSeconds > 0}
                sx={{
                  color: "#ffcc01",
                  borderColor: "rgba(255,204,1,0.5)",
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: 13,
                  py: 1,
                  "&:hover": { backgroundColor: "rgba(255,204,1,0.1)" },
                  "&.Mui-disabled": {
                    color: "rgba(255,204,1,0.35)",
                    borderColor: "rgba(255,204,1,0.2)",
                  },
                }}
              >
                {resendLoading
                  ? "Enviando..."
                  : cooldownSeconds > 0
                  ? `Aguarde ${cooldownSeconds}s`
                  : "Reenviar email de verificação"}
              </Button>
            </Box>
          )}

          {/* Botão Entrar */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleLogin}
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.6,
              borderRadius: "14px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: "0.2px",
              backgroundColor: "#ffffff",
              color: "#111111",
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              transition: "all 0.25s ease",
              "&:hover": {
                backgroundColor: "#e8e8e8",
                boxShadow: "0 6px 32px rgba(0,0,0,0.2)",
                transform: "translateY(-2px)",
              },
              "&:active": { transform: "translateY(0)", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" },
              "&.Mui-disabled": {
                backgroundColor: "rgba(255,255,255,0.25)",
                color: "rgba(0,0,0,0.4)",
                boxShadow: "none",
              },
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>

          {/* Continuar sem login */}
          <Button
            fullWidth
            variant="text"
            onClick={() => router.push("/pages/events")}
            sx={{
              mt: 1.5,
              py: 1.2,
              borderRadius: "14px",
              textTransform: "none",
              fontWeight: 500,
              fontSize: 14,
              color: "rgba(255,255,255,0.4)",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.7)",
              },
            }}
          >
            Continuar sem login
          </Button>

          {/* Divisor */}
          <Typography
            sx={{
              mt: 3,
              mb: 1.5,
              textAlign: "center",
              color: "rgba(255,255,255,0.3)",
              fontSize: 12,
              position: "relative",
              "&::before, &::after": {
                content: '""',
                position: "absolute",
                top: "50%",
                width: "35%",
                height: "1px",
                backgroundColor: "rgba(255,255,255,0.12)",
              },
              "&::before": { left: 0 },
              "&::after": { right: 0 },
            }}
          >
            ou entre com
          </Typography>

          {/* Botões sociais desabilitados */}
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Google fontSize="small" />}
              disabled
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: 13,
                py: 1.2,
                borderColor: "rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.3)",
                backgroundColor: "rgba(255,255,255,0.04)",
                "&.Mui-disabled": {
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.25)",
                  backgroundColor: "rgba(255,255,255,0.03)",
                },
              }}
            >
              Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Facebook fontSize="small" />}
              disabled
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: 13,
                py: 1.2,
                borderColor: "rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.3)",
                backgroundColor: "rgba(255,255,255,0.04)",
                "&.Mui-disabled": {
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.25)",
                  backgroundColor: "rgba(255,255,255,0.03)",
                },
              }}
            >
              Facebook
            </Button>
          </Box>

          {/* Rodapé */}
          <Box
            sx={{
              mt: 3,
              pt: 2.5,
              borderTop: "1px solid rgba(255,255,255,0.07)",
              textAlign: "center",
            }}
          >
            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
              Não tem uma conta?{" "}
              <Box
                component="span"
                sx={{
                  color: "rgba(255,255,255,0.6)",
                  fontWeight: 600,
                  cursor: "default",
                  userSelect: "none",
                }}
              >
                Cadastre-se aqui
              </Box>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginForm;
