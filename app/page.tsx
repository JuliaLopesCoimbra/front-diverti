"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Button, TextField, Typography, Box, InputAdornment, IconButton, Chip,
} from "@mui/material";
import {
  Visibility, VisibilityOff, Email,
  BarChart as ChartIcon, LocationOn as LocationIcon,
  People as PeopleIcon, Campaign as CampaignIcon,
} from "@mui/icons-material";
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

const FEATURES = [
  { icon: <CampaignIcon sx={{ fontSize: 20 }} />, title: "Campanhas segmentadas", desc: "CPC e CPV com controle total de orçamento e duração" },
  { icon: <PeopleIcon    sx={{ fontSize: 20 }} />, title: "Público qualificado",   desc: "Segmentação por hobbies, profissão, idade e gênero" },
  { icon: <LocationIcon  sx={{ fontSize: 20 }} />, title: "Geolocalização",         desc: "Anuncie para quem está próximo ao evento" },
  { icon: <ChartIcon     sx={{ fontSize: 20 }} />, title: "Dashboard em tempo real",desc: "Métricas de cliques, views e investimento por campanha" },
];

const STATS = [
  { value: "5+",  label: "Marcas parceiras" },
  { value: "20+", label: "Campanhas ativas" },
  { value: "1M+", label: "Interações geradas" },
];

export default function LoginForm() {
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
      localStorage.setItem("circuito_access_token", access_token);
      document.cookie = `refresh_token=${refresh_token}; path=/; secure`;
      const { jwtDecode } = await import("jwt-decode");
      const decoded = jwtDecode<{ role: string }>(access_token);
      if (decoded.role === "admin_master") {
        router.push("/pages/admin-master/home");
      } else if (decoded.role === "admin") {
        router.push("/pages/admin/home");
      } else if (decoded.role === "patrocinador") {
        router.push("/pages/patrocinador/home");
      } else {
        router.push("/pages/user/home");
      }
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
        if (msg.includes("confirme seu e-mail") || msg.includes("confirme seu email") || msg.includes("email não confirmado")) {
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
    if (!email) { showToast("Por favor, insira seu email primeiro", "error"); return; }
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
        minHeight: "100svh",
        display: "flex",
        alignItems: "stretch",
        position: "relative",
        "&::before": {
          content: '""',
          position: "fixed",
          inset: 0,
          background: "linear-gradient(170deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.65) 100%)",
          zIndex: 0,
          pointerEvents: "none",
        },
      }}
    >
      {/* ── Left panel: apresentação ─────────────────────────────────────── */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
          px: { md: 6, lg: 9 },
          py: 8,
          position: "relative",
          zIndex: 1,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateX(0)" : "translateX(-24px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        {/* Logo */}
        <Box sx={{ mb: 5 }}>
          <Image
            src="/logo/logo-circuito.png"
            alt="Circuito Sertanejo"
            width={180}
            height={64}
            style={{ objectFit: "contain" }}
            priority
          />
        </Box>

        {/* Tagline */}
        <Chip
          label="Plataforma de mídia para eventos sertanejos"
          size="small"
          sx={{ backgroundColor: "rgba(255,204,1,0.12)", color: "#ffcc01", fontWeight: 700, fontSize: "0.72rem", mb: 2.5, alignSelf: "flex-start", border: "1px solid rgba(255,204,1,0.25)" }}
        />
        <Typography variant="h3" sx={{ color: "#fff", fontWeight: 800, lineHeight: 1.2, mb: 1.5, fontSize: { md: "2rem", lg: "2.5rem" } }}>
          Conecte sua marca ao{" "}
          <Box component="span" sx={{ color: "#ffcc01" }}>público sertanejo</Box>
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem", lineHeight: 1.7, mb: 5, maxWidth: 480 }}>
          Gerencie campanhas de anúncios em eventos, acompanhe métricas em tempo real e alcance o público certo com segmentação inteligente.
        </Typography>

        {/* Features */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mb: 6 }}>
          {FEATURES.map((f) => (
            <Box key={f.title} sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, backgroundColor: "rgba(255,204,1,0.1)", border: "1px solid rgba(255,204,1,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffcc01", flexShrink: 0 }}>
                {f.icon}
              </Box>
              <Box>
                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.3 }}>{f.title}</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", lineHeight: 1.5 }}>{f.desc}</Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Stats */}
        <Box sx={{ display: "flex", gap: 4 }}>
          {STATS.map((s) => (
            <Box key={s.label}>
              <Typography sx={{ color: "#ffcc01", fontWeight: 800, fontSize: "1.6rem", lineHeight: 1 }}>{s.value}</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", mt: 0.4 }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Right panel: formulário ───────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: { xs: "100%", md: "460px" },
          flexShrink: 0,
          px: { xs: 3, md: 5 },
          py: { xs: 5, md: 8 },
          position: "relative",
          zIndex: 1,
          backgroundColor: { md: "rgba(0,0,0,0.35)" },
          backdropFilter: { md: "blur(20px)" },
          borderLeft: { md: "1px solid rgba(255,255,255,0.07)" },
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.55s ease 0.1s, transform 0.55s ease 0.1s",
        }}
      >
        {/* Logo mobile */}
        <Box sx={{ display: { xs: "flex", md: "none" }, justifyContent: "center", mb: 4 }}>
          <Image src="/logo/logo-circuito.png" alt="Circuito Sertanejo" width={180} height={64} style={{ objectFit: "contain" }} priority />
        </Box>

        <Box sx={{ width: "100%", maxWidth: 380 }}>
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mb: 0.5, fontSize: { xs: "20px", md: "22px" }, letterSpacing: "-0.3px" }}>
            Bem-vindo de volta
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: { xs: "13px", md: "14px" }, mb: 3.5 }}>
            Entre com suas credenciais para continuar
          </Typography>

          <TextField
            fullWidth label="E-mail" type="email" variant="outlined" margin="dense"
            value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown}
            inputProps={{ autoCapitalize: "none", autoCorrect: "off", spellCheck: false }}
            sx={inputSx}
          />

          <TextField
            fullWidth label="Senha" variant="outlined" margin="dense"
            type={showPassword ? "text" : "password"}
            value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((p) => !p)} edge="end" sx={{ color: "rgba(255,255,255,0.45)", "&:hover": { color: "#fff" } }}>
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ ...inputSx, mt: 1.5 }}
          />

          {showForgotPassword && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
              <Typography
                sx={{ color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer", fontWeight: 500, transition: "color 0.2s", "&:hover": { color: "#fff", textDecoration: "underline" } }}
                onClick={() => router.push("/pages/auth/forgot-password")}
              >
                Esqueceu a senha?
              </Typography>
            </Box>
          )}

          {showResendEmail && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: "rgba(255,204,1,0.08)", borderRadius: "12px", border: "1px solid rgba(255,204,1,0.25)" }}>
              <Typography sx={{ color: "rgba(255,255,255,0.85)", mb: 1.5, fontSize: 13 }}>
                Seu email ainda não foi confirmado. Reenvie o email de verificação.
              </Typography>
              <Button
                fullWidth variant="outlined" startIcon={<Email fontSize="small" />}
                onClick={handleResendEmail} disabled={resendLoading || cooldownSeconds > 0}
                sx={{ color: "#ffcc01", borderColor: "rgba(255,204,1,0.5)", borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, py: 1, "&:hover": { backgroundColor: "rgba(255,204,1,0.1)" }, "&.Mui-disabled": { color: "rgba(255,204,1,0.35)", borderColor: "rgba(255,204,1,0.2)" } }}
              >
                {resendLoading ? "Enviando..." : cooldownSeconds > 0 ? `Aguarde ${cooldownSeconds}s` : "Reenviar email de verificação"}
              </Button>
            </Box>
          )}

          <Button
            fullWidth variant="contained" onClick={handleLogin} disabled={loading}
            sx={{ mt: 3.5, py: 1.6, borderRadius: "14px", textTransform: "none", fontWeight: 700, fontSize: 15, letterSpacing: "0.2px", backgroundColor: "#ffffff", color: "#111111", boxShadow: "0 4px 24px rgba(0,0,0,0.15)", transition: "all 0.25s ease", "&:hover": { backgroundColor: "#e8e8e8", boxShadow: "0 6px 32px rgba(0,0,0,0.2)", transform: "translateY(-2px)" }, "&:active": { transform: "translateY(0)", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }, "&.Mui-disabled": { backgroundColor: "rgba(255,255,255,0.25)", color: "rgba(0,0,0,0.4)", boxShadow: "none" } }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>

          <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: 11, textAlign: "center", mt: 3 }}>
            © 2026 Circuito Sertanejo · Todos os direitos reservados
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
