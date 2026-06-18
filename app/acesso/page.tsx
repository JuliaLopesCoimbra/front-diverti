"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Button, TextField, Typography, Box, InputAdornment, IconButton, Chip,
} from "@mui/material";
import {
  Visibility, VisibilityOff, Email,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  MusicNote as MusicIcon,
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

const EVENTS = [
  { name: "Festa do Peão de Barretos",   city: "Barretos, SP",      date: "15 Ago 2026", attendees: "180 mil", hot: true  },
  { name: "Rodeio de Americana",          city: "Americana, SP",     date: "04 Jul 2026", attendees: "95 mil",  hot: false },
  { name: "Expogran Serra Gaúcha",        city: "Caxias do Sul, RS", date: "20 Set 2026", attendees: "60 mil",  hot: false },
];

const STATS = [
  { value: "50+",  label: "Eventos/ano" },
  { value: "2M+",  label: "Fãs cadastrados" },
  { value: "100%", label: "Gratuito" },
];

export default function AcessoPage() {
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
      showToast("Bem-vindo!", "success");
      const { access_token, refresh_token } = response;
      login(access_token, refresh_token);
      localStorage.setItem("circuito_access_token", access_token);
      document.cookie = `refresh_token=${refresh_token}; path=/; secure`;
      const { jwtDecode } = await import("jwt-decode");
      const decoded = jwtDecode<{ role: string }>(access_token);
      if (decoded.role === "admin_master") router.push("/pages/admin-master/home");
      else if (decoded.role === "admin") router.push("/pages/admin/home");
      else if (decoded.role === "patrocinador") router.push("/pages/patrocinador/home");
      else router.push("/pages/user/home");
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
        flexDirection: { xs: "column", md: "row" },
        alignItems: "stretch",
        position: "relative",
        "&::before": {
          content: '""',
          position: "fixed",
          inset: 0,
          background: "linear-gradient(170deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.65) 100%)",
          zIndex: 0,
          pointerEvents: "none",
        },
      }}
    >
      {/* ── Painel esquerdo: apresentação ─────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
          px: { xs: 3, sm: 4, md: 6, lg: 9 },
          pt: { xs: 4, md: 8 },
          pb: { xs: 5, md: 8 },
          position: "relative",
          zIndex: 1,
          order: { xs: 2, md: 1 },
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateX(0)" : "translateX(-24px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        {/* Logo — só no desktop (no mobile aparece acima do formulário) */}
        <Box sx={{ display: { xs: "none", md: "block" }, mb: 5 }}>
          <Image src="/logo/logo-circuito.png" alt="Circuito Sertanejo" width={160} height={56} style={{ objectFit: "contain" }} priority />
        </Box>

        <Chip
          label="Para fãs e frequentadores de eventos"
          size="small"
          sx={{ backgroundColor: "rgba(255,204,1,0.12)", color: "#ffcc01", fontWeight: 700, fontSize: "0.72rem", mb: 2, alignSelf: "flex-start", border: "1px solid rgba(255,204,1,0.25)" }}
        />

        <Typography
          variant="h3"
          sx={{ color: "#fff", fontWeight: 800, lineHeight: 1.2, mb: 1.5, fontSize: { xs: "1.5rem", sm: "1.8rem", md: "2rem", lg: "2.4rem" } }}
        >
          Sua entrada para os{" "}
          <Box component="span" sx={{ color: "#ffcc01" }}>maiores eventos</Box>{" "}
          sertanejos do Brasil
        </Typography>

        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: { xs: "0.88rem", md: "1rem" }, lineHeight: 1.7, mb: { xs: 3, md: 5 }, maxWidth: 480 }}>
          Acompanhe atrações, programação e novidades dos eventos que você ama, tudo em um só lugar.
        </Typography>

        {/* Stats */}
        <Box sx={{ display: "flex", gap: { xs: 3, md: 4 }, mb: { xs: 3, md: 5 } }}>
          {STATS.map((s) => (
            <Box key={s.label}>
              <Typography sx={{ color: "#ffcc01", fontWeight: 800, fontSize: { xs: "1.2rem", md: "1.5rem" }, lineHeight: 1 }}>{s.value}</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", mt: 0.3 }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* Próximos eventos */}
        <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", mb: 1.5 }}>
          Próximos eventos
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
          {EVENTS.map((ev) => (
            <Box
              key={ev.name}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: { xs: 1.5, md: 2 },
                borderRadius: 3,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: ev.hot ? "1px solid rgba(255,204,1,0.2)" : "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                  backgroundColor: ev.hot ? "rgba(255,204,1,0.12)" : "rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <MusicIcon sx={{ fontSize: 18, color: ev.hot ? "#ffcc01" : "rgba(255,255,255,0.3)" }} />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
                  <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: "0.8rem", md: "0.88rem" }, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ev.name}
                  </Typography>
                  {ev.hot && (
                    <Chip label="Em alta" size="small" sx={{ backgroundColor: "rgba(255,204,1,0.15)", color: "#ffcc01", fontWeight: 700, fontSize: "0.58rem", height: 17 }} />
                  )}
                </Box>
                <Box sx={{ display: "flex", gap: 1.5, mt: 0.2, flexWrap: "wrap" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                    <LocationIcon sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }} />
                    <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem" }}>{ev.city}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                    <CalendarIcon sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }} />
                    <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem" }}>{ev.date}</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, flexShrink: 0 }}>
                <PeopleIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }} />
                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem" }}>{ev.attendees}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Painel direito: formulário ────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: { xs: "100%", md: "460px" },
          flexShrink: 0,
          px: { xs: 3, md: 5 },
          pt: { xs: 5, md: 8 },
          pb: { xs: 4, md: 8 },
          position: "relative",
          zIndex: 1,
          order: { xs: 1, md: 2 },
          backgroundColor: { md: "rgba(0,0,0,0.35)" },
          backdropFilter: { md: "blur(20px)" },
          borderLeft: { md: "1px solid rgba(255,255,255,0.07)" },
          borderBottom: { xs: "1px solid rgba(255,255,255,0.07)", md: "none" },
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.55s ease 0.1s, transform 0.55s ease 0.1s",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: { xs: "100%", md: 380 }, pt: { xs: 0, md: 0 } }}>
          {/* Logo apenas no mobile */}
          <Box sx={{ display: { xs: "flex", md: "none" }, justifyContent: "center", mb: 3 }}>
            <Image src="/logo/logo-circuito.png" alt="Circuito Sertanejo" width={150} height={54} style={{ objectFit: "contain" }} priority />
          </Box>

          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mb: 0.5, fontSize: { xs: "20px", md: "22px" }, letterSpacing: "-0.3px" }}>
            Acessar minha conta
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: { xs: "13px", md: "14px" }, mb: 3.5 }}>
            Entre para acompanhar seus eventos favoritos
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
            sx={{ mt: 3.5, py: 1.6, borderRadius: "14px", textTransform: "none", fontWeight: 700, fontSize: 15, letterSpacing: "0.2px", backgroundColor: "#ffcc01", color: "#111111", boxShadow: "0 4px 24px rgba(255,204,1,0.2)", transition: "all 0.25s ease", "&:hover": { backgroundColor: "#e6b800", boxShadow: "0 6px 32px rgba(255,204,1,0.3)", transform: "translateY(-2px)" }, "&:active": { transform: "translateY(0)" }, "&.Mui-disabled": { backgroundColor: "rgba(255,204,1,0.25)", color: "rgba(0,0,0,0.35)", boxShadow: "none" } }}
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
