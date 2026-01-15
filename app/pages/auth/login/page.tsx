// /components/auth/LoginForm.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
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

interface LoginData {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [keepMeLoggedIn, setKeepMeLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const { showToast } = useToast();
  const router = useRouter();

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
      const loginData: LoginData = { email, password };
      const response = await loginUser(loginData);

      // sucesso → reseta tentativas
      setShowForgotPassword(false);
      setShowResendEmail(false);

      showToast("Login realizado com sucesso!", "success");

      const { access_token, refresh_token } = response;
      login(access_token, refresh_token);

      localStorage.setItem("access_token", access_token);

      // HttpOnly não funciona via JS, mas mantendo seu padrão atual
      document.cookie = `refresh_token=${refresh_token}; path=/; secure`;

      router.push("/pages/user/home");
    } catch (err: unknown) {
      setShowForgotPassword(true);

      if (err instanceof Error) {
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
          Login
        </Typography>
        <Typography variant="body2" sx={{ marginBottom: "20px" }}>
          Bem-vindo de volta. Entre com suas credenciais para acessar sua conta.
        </Typography>

        {/* Formulário de login */}
        <TextField
          fullWidth
          label="Endereço de e-mail"
          variant="outlined"
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
              backgroundColor: "transparent",
              color: "#fff",
              borderRadius: "14px",
              "& fieldset": {
                borderColor: "#fff",
              },
              "&:hover fieldset": {
                borderColor: "#fff",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#fff",
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

        <TextField
          fullWidth
          label="Senha"
          variant="outlined"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
              backgroundColor: "transparent",
              color: "#fff",
              borderRadius: "14px",
              "& fieldset": {
                borderColor: "#fff",
              },
              "&:hover fieldset": {
                borderColor: "#fff",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#fff",
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

        <Button
          fullWidth
          variant="contained"
          sx={{
            mt: 2,
            backgroundColor: "#ffcc01",
            color: "#000", // texto preto para contraste
            fontWeight: 600,
            borderRadius: "14px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#e6b800", // hover mais escuro
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

        {showResendEmail && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: "rgba(255, 204, 1, 0.1)",
              borderRadius: "14px",
              border: "1px solid rgba(255, 204, 1, 0.3)",
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
                borderRadius: "14px",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: "rgba(255, 204, 1, 0.1)",
                  borderColor: "#ffcc01",
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
            variant="body2"
            sx={{ mt: 2, color: "#1976d2", cursor: "pointer" }}
            onClick={() => router.push("/pages/auth/forgot-password")}
          >
            Esqueceu a senha?
          </Typography>
        )}
        <Typography
          sx={{
            mt: 3,
            mb: 1.5,
            textAlign: "center",
            color: "rgba(255,255,255,0.7)",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          ou logue com
        </Typography>
        {/* Exibição de erro */}
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
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
              borderColor: "#fff",
              backgroundColor: "transparent",
              borderRadius: "14px",
              textTransform: "none",
              "& .MuiSvgIcon-root": {
                color: "#fff",
              },
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.08)",
                borderColor: "#fff",
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
              borderColor: "#fff",
              backgroundColor: "transparent",
              borderRadius: "14px",
              textTransform: "none",
              "& .MuiSvgIcon-root": {
                color: "#fff",
              },
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.08)",
                borderColor: "#fff",
              },
            }}
          >
            Facebook
          </Button>
        </Box>

        <Typography variant="body2" sx={{ marginTop: "20px" }}>
          Não tem uma conta?{" "}
          <a href="/pages/auth/register" style={{ textDecoration: "none", color: "#ffcc01" }}>
            Cadastre-se aqui
          </a>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginForm;
