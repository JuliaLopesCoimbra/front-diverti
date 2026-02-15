// /components/auth/LoginForm.tsx
"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Button,
  TextField,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
  Skeleton,
} from "@mui/material";
import {
  Google,
  Facebook,
  Visibility,
  VisibilityOff,
  Email,
} from "@mui/icons-material";
import { loginUser, resendVerificationEmail } from "@/app/services/auth/authService";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  initGoogleLogin,
  initFacebookLogin,
} from "@/app/services/auth/authService";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

interface LoginData {
  email: string;
  password: string;
  remember_me?: boolean;
}

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [keepMeLoggedIn, setKeepMeLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  const { login } = useAuth();

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(true);

  const { showToast } = useToast();
  const router = useRouter();

  // Simula o carregamento inicial da página
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 500); // 500ms de delay para mostrar o skeleton

    return () => clearTimeout(timer);
  }, []);

  // Controla animações quando a página carrega
  useEffect(() => {
    if (!isInitialLoading) {
      setShouldAnimate(true);
      const timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoading]);

  // Efeito para o cooldown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (cooldownSeconds > 0) {
      interval = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldownSeconds]);

  const handleLogin = async () => {
    setLoading(true);
    setShowResendEmail(false);

    try {
      const loginData: LoginData = { 
        email, 
        password,
        remember_me: keepMeLoggedIn
      };
      const response = await loginUser(loginData);

      // sucesso → reseta tentativas
      setShowForgotPassword(false);
      setShowResendEmail(false);

      showToast("Login realizado com sucesso!", "success");

      const { access_token, refresh_token } = response;
      login(access_token, refresh_token);

      localStorage.setItem("access_token", access_token);

      // Se remember_me estiver marcado, cookie expira em 90 dias
      // Caso contrário, cookie de sessão (expira quando fechar navegador)
      const cookieOptions = keepMeLoggedIn
        ? `refresh_token=${refresh_token}; path=/; secure; max-age=${90 * 24 * 60 * 60}` // 90 dias
        : `refresh_token=${refresh_token}; path=/; secure`; // Sessão

      document.cookie = cookieOptions;

      router.push("/pages/user/home");
    } catch (err: unknown) {
      setShowForgotPassword(true);

      if (err instanceof Error) {
        // Verificar se precisa completar perfil
        if (err.message === "PROFILE_COMPLETION_REQUIRED" && (err as any).tempToken) {
          const tempToken = (err as any).tempToken;
          // Redirecionar para página de completar perfil
          router.push(`/pages/auth/complete-profile?temp_token=${tempToken}&requires_profile_completion=true`);
          return;
        }
        
        // Verificar se precisa verificar idade
        if (err.message === "AGE_VERIFICATION_REQUIRED" && (err as any).tempToken) {
          const tempToken = (err as any).tempToken;
          // Redirecionar para página de verificação de idade
          router.push(`/pages/auth/age-verification?temp_token=${tempToken}&requires_age_verification=true`);
          return;
        }

        const errorMessage = err.message.toLowerCase();
        // Verifica se o erro é de email não confirmado
        if (
          errorMessage.includes("confirme seu e-mail") ||
          errorMessage.includes("confirme seu email") ||
          errorMessage.includes("email não confirmado")
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

    if (cooldownSeconds > 0) {
      return;
    }

    setResendLoading(true);
    try {
      await resendVerificationEmail(email);
      setCooldownSeconds(60); // 1 minuto de cooldown
      showToast("Email de verificação reenviado! Verifique também sua pasta de spam.", "success");
    } catch (err: unknown) {
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase();
        // Se o erro contém informações sobre cooldown, extrair os segundos
        const cooldownMatch = err.message.match(/(\d+)\s*segundos?/i);
        if (cooldownMatch) {
          const seconds = parseInt(cooldownMatch[1]);
          setCooldownSeconds(seconds);
        }
        showToast(err.message, "error");
      } else {
        showToast("Erro ao reenviar email. Tente novamente.", "error");
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && email && password && !loading) {
      handleLogin();
    }
  };

  // Skeleton component
  if (isInitialLoading) {
    return (
      <Box
        sx={{
          ...dashboardBackgroundSx,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: { xs: "20px", md: "40px" },
        }}
      >
        <Box
          sx={{
            padding: { xs: "30px", md: "40px" },
            color: "white",
            width: "100%",
            maxWidth: { xs: "100%", md: "450px" },
            textAlign: "left",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(20px)",
            borderRadius: { xs: "16px", md: "24px" },
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Título Skeleton */}
          <Skeleton
            variant="text"
            width="40%"
            height={40}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.1)",
              marginBottom: { xs: "16px", md: "20px" },
              marginX: "auto",
            }}
          />
          
          {/* Subtítulo Skeleton */}
          <Skeleton
            variant="text"
            width="80%"
            height={20}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.1)",
              marginBottom: { xs: "24px", md: "28px" },
              marginX: "auto",
            }}
          />

          {/* Campo Email Skeleton */}
          <Skeleton
            variant="rectangular"
            width="100%"
            height={56}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              marginBottom: 2,
            }}
          />

          {/* Campo Senha Skeleton */}
          <Skeleton
            variant="rectangular"
            width="100%"
            height={56}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              marginBottom: { xs: 2, md: 3 },
            }}
          />

          {/* Botão Skeleton */}
          <Skeleton
            variant="rectangular"
            width="100%"
            height={48}
            sx={{
              bgcolor: "rgba(255, 204, 1, 0.2)",
              borderRadius: "12px",
              marginBottom: 2,
            }}
          />

          {/* Divisor Skeleton */}
          <Box sx={{ display: "flex", alignItems: "center", marginY: 2 }}>
            <Skeleton
              variant="text"
              width="30%"
              height={1}
              sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
            />
            <Skeleton
              variant="text"
              width="40%"
              height={20}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.1)",
                marginX: 2,
              }}
            />
            <Skeleton
              variant="text"
              width="30%"
              height={1}
              sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
            />
          </Box>

          {/* Botões Social Skeleton */}
          <Box
            sx={{
              display: "flex",
              gap: { xs: 1.5, md: 2 },
              marginBottom: 2,
            }}
          >
            <Skeleton
              variant="rectangular"
              width="50%"
              height={44}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
              }}
            />
            <Skeleton
              variant="rectangular"
              width="50%"
              height={44}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
              }}
            />
          </Box>

          {/* Link Cadastro Skeleton */}
          <Skeleton
            variant="text"
            width="60%"
            height={20}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.1)",
              marginX: "auto",
              marginTop: { xs: "20px", md: "24px" },
            }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        ...dashboardBackgroundSx,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: { xs: "20px", md: "40px" },
      }}
    >
      <Box
        className={shouldAnimate ? "slide-up-animation" : ""}
        sx={{
          padding: { xs: "30px", md: "40px" },
          color: "white",
          width: "100%",
          maxWidth: { xs: "100%", md: "450px" },
          textAlign: "left",
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)",
          borderRadius: { xs: "16px", md: "24px" },
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          },
        }}
      >
        <Box
          className={shouldAnimate ? "slide-up-delay-1" : ""}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: { xs: "16px", md: "20px" },
          }}
        >
          <Image
            src="/logo/logo-n1.png"
            alt="Camarote N1"
            width={80}
            height={80}
            style={{ marginBottom: "16px" }}
          />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "24px", md: "28px" },
              textAlign: "center",
            }}
          >
            Login
          </Typography>
        </Box>
        <Typography
          className={shouldAnimate ? "slide-up-delay-1" : ""}
          variant="body2"
          sx={{
            marginBottom: { xs: "24px", md: "28px" },
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.85)",
            fontSize: { xs: "13px", md: "14px" },
          }}
        >
          Bem-vindo de volta. Entre com suas credenciais para acessar sua conta.
        </Typography>

        {/* Formulário de login */}
        <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
          <TextField
          fullWidth
          label="Endereço de e-mail"
          variant="outlined"
          margin="normal"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          inputProps={{
            autoCapitalize: "none",
            autoCorrect: "off",
            spellCheck: false,
          }}
          InputLabelProps={{
            shrink: true, // ✅ fixa o label em cima
            sx: {
              color: "#fff",
              fontSize: 13,
              transform: "translate(14px, -9px) scale(1)", // canto superior esquerdo
              "&.Mui-focused": {
                color: "#fff",
              },
            },
          }}
          sx={{
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

        <TextField
          fullWidth
          label="Senha"
          variant="outlined"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          error={Boolean(password && password.length < 6)}
          helperText={
            password && password.length < 6
              ? "A senha deve ter no mínimo 6 caracteres"
              : ""
          }
          InputLabelProps={{
            shrink: true,
            sx: {
              color: "#fff",
              fontSize: 13,
              transform: "translate(14px, -9px) scale(1)",
              "&.Mui-focused": { color: "#fff" },
            },
          }}
          FormHelperTextProps={{
            sx: { color: "#ff6b6b", fontSize: 12 },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                  sx={{ color: "#fff" }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            mt: 2,
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
              "&.Mui-error fieldset": {
                borderColor: "#ff6b6b",
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
        </Box>

        {/* Checkbox para manter-me conectado */}
        <FormControlLabel
          control={
            <Checkbox
              checked={keepMeLoggedIn}
              onChange={(e) => setKeepMeLoggedIn(e.target.checked)}
              sx={{
                color: "#ffcc01", // cor quando desmarcado
                "&.Mui-checked": {
                  color: "#ffcc01", // cor quando marcado
                },
                "&:hover": {
                  backgroundColor: "rgba(255, 204, 1, 0.08)", // hover suave
                },
              }}
            />
          }
          label="Mantenha-me conectado"
          sx={{
            color: "#fff", // texto branco
            "& .MuiFormControlLabel-label": {
              fontSize: 14, // opcional
            },
          }}
        />

        <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
          <Button
          fullWidth
          variant="contained"
          sx={{
            mt: { xs: 2, md: 3 },
            mb: 1,
            backgroundColor: "#ffcc01",
            color: "#000",
            fontWeight: 700,
            borderRadius: "12px",
            textTransform: "none",
            fontSize: { xs: "15px", md: "16px" },
            padding: { xs: "12px", md: "14px" },
            boxShadow: "0 4px 12px rgba(255, 204, 1, 0.3)",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "#e6b800",
              transform: "translateY(-2px)",
              boxShadow: "0 6px 16px rgba(255, 204, 1, 0.4)",
            },
            "&.Mui-disabled": {
              backgroundColor: "rgba(255, 204, 1, 0.4)",
              color: "rgba(0,0,0,0.6)",
            },
          }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Carregando..." : "Continuar"}
        </Button>
        </Box>

        {/* Botão Continuar sem login */}
        <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
          <Button
          fullWidth
          variant="outlined"
          sx={{
            mt: 1,
            mb: 1,
            color: "#fff",
            borderColor: "rgba(255, 255, 255, 0.3)",
            backgroundColor: "transparent",
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 600,
            fontSize: { xs: "14px", md: "15px" },
            padding: { xs: "12px", md: "14px" },
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderColor: "rgba(255, 255, 255, 0.5)",
              transform: "translateY(-2px)",
            },
          }}
          onClick={() => router.push("/pages/events")}
        >
          Continuar sem login
        </Button>
        </Box>

        {showResendEmail && (
          <Box
            className={shouldAnimate ? "slide-up-delay-3" : ""}
            sx={{
              mt: 2,
              p: { xs: 2, md: 2.5 },
              backgroundColor: "rgba(255, 204, 1, 0.12)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 204, 1, 0.4)",
              backdropFilter: "blur(10px)",
              transition: "all 0.2s ease",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#fff",
                mb: 1.5,
                fontSize: 14,
              }}
            >
              Seu email ainda não foi confirmado. Clique no botão abaixo para reenviar o email de verificação.
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Email />}
              onClick={handleResendEmail}
              disabled={resendLoading || cooldownSeconds > 0}
              sx={{
                color: "#ffcc01",
                borderColor: "#ffcc01",
                backgroundColor: "transparent",
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "13px", md: "14px" },
                padding: { xs: "10px", md: "12px" },
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(255, 204, 1, 0.15)",
                  borderColor: "#ffcc01",
                  transform: "translateY(-2px)",
                },
                "&.Mui-disabled": {
                  color: "rgba(255, 204, 1, 0.5)",
                  borderColor: "rgba(255, 204, 1, 0.3)",
                },
              }}
            >
              {resendLoading
                ? "Enviando..."
                : cooldownSeconds > 0
                ? `Aguarde ${cooldownSeconds}s`
                : "Reenviar email de verificação"}
            </Button>
            {cooldownSeconds === 0 && (
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: 12,
                  textAlign: "center",
                  fontStyle: "italic",
                }}
              >
                Verifique também sua pasta de spam
              </Typography>
            )}
          </Box>
        )}

        {showForgotPassword && (
          <Typography
            className={shouldAnimate ? "slide-up-delay-3" : ""}
            variant="body2"
            sx={{
              mt: 2,
              color: "#ffcc01",
              cursor: "pointer",
              textAlign: "center",
              fontSize: { xs: "13px", md: "14px" },
              fontWeight: 500,
              transition: "all 0.2s ease",
              "&:hover": {
                color: "#e6b800",
                textDecoration: "underline",
              },
            }}
            onClick={() => router.push("/pages/auth/forgot-password")}
          >
            Esqueceu a senha?
          </Typography>
        )}
        <Typography
          className={shouldAnimate ? "slide-up-delay-3" : ""}
          sx={{
            mt: { xs: 3, md: 3.5 },
            mb: 1.5,
            textAlign: "center",
            color: "rgba(255,255,255,0.7)",
            fontSize: { xs: 12, md: 13 },
            fontWeight: 500,
            position: "relative",
            "&::before, &::after": {
              content: '""',
              position: "absolute",
              top: "50%",
              width: "30%",
              height: "1px",
              backgroundColor: "rgba(255,255,255,0.2)",
            },
            "&::before": {
              left: 0,
            },
            "&::after": {
              right: 0,
            },
          }}
        >
          ou logue com
        </Typography>
        <Box
          className={shouldAnimate ? "slide-up-delay-3" : ""}
          sx={{
            display: "flex",
            gap: { xs: 1.5, md: 2 },
            mt: 2,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<Google />}
            onClick={async () => {
              try {
                const url = await initGoogleLogin();
                window.location.href = url;
              } catch {
                showToast("Erro ao iniciar login com Google", "error");
              }
            }}
            sx={{
              flex: 1,
              color: "#fff",
              borderColor: "rgba(255, 255, 255, 0.3)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: { xs: "13px", md: "14px" },
              padding: { xs: "10px", md: "12px" },
              transition: "all 0.2s ease",
              "& .MuiSvgIcon-root": {
                color: "#fff",
              },
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.12)",
                borderColor: "rgba(255, 255, 255, 0.5)",
                transform: "translateY(-2px)",
              },
            }}
          >
            Google
          </Button>

          <Button
            variant="outlined"
            startIcon={<Facebook />}
            onClick={async () => {
              try {
                const url = await initFacebookLogin();
                window.location.href = url;
              } catch {
                showToast("Erro ao iniciar login com Facebook", "error");
              }
            }}
            sx={{
              flex: 1,
              color: "#fff",
              borderColor: "rgba(255, 255, 255, 0.3)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: { xs: "13px", md: "14px" },
              padding: { xs: "10px", md: "12px" },
              transition: "all 0.2s ease",
              "& .MuiSvgIcon-root": {
                color: "#fff",
              },
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.12)",
                borderColor: "rgba(255, 255, 255, 0.5)",
                transform: "translateY(-2px)",
              },
            }}
          >
            Facebook
          </Button>
        </Box>

        {/* <Typography
          className={shouldAnimate ? "slide-up-delay-3" : ""}
          variant="body2"
          sx={{
            marginTop: { xs: "20px", md: "24px" },
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.85)",
            fontSize: { xs: "13px", md: "14px" },
          }}
        >
          Não tem uma conta?{" "}
          <a
            href="/pages/auth/register"
            style={{
              textDecoration: "none",
              color: "#ffcc01",
              fontWeight: 600,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#e6b800";
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#ffcc01";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            Cadastre-se aqui 
          </a>
        </Typography> */}
      </Box>
    </Box>
  );
};

export default LoginForm;
