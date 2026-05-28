"use client";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff, CheckCircle } from "@mui/icons-material";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import { firstAccess } from "@/app/services/auth/authAdminService";
import { validatePassword } from "@/app/utils/passwordValidator";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

function FirstAccessContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { showToast } = useToast();

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const handleFirstAccess = async () => {
    if (!token) {
      showToast("Token inválido.", "error");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      showToast(`Senha inválida: ${passwordValidation.errors.join(", ")}`, "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("As senhas não coincidem.", "error");
      return;
    }

    setLoading(true);

    try {
      await firstAccess({ token, password });
      showToast("Senha definida com sucesso! Você já pode acessar o sistema.", "success");

      setTimeout(() => {
        router.push("/pages/auth/login");
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Erro ao definir senha. Tente novamente.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          ...dashboardBackgroundSx,
          height: "100vh",
          padding: "20px",
          alignItems: "center",
        }}
      >
        <Typography sx={{ color: "#fff" }}>Token inválido.</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        ...dashboardBackgroundSx,
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
        <Typography variant="h5" sx={{ marginBottom: "20px" }}>
          Primeiro acesso
        </Typography>
        <Typography variant="body2" sx={{ marginBottom: "20px" }}>
          Defina sua senha para acessar o sistema como administrador.
        </Typography>

        {/* Senha */}
        <TextField
          fullWidth
          label="Senha"
          variant="outlined"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            const validation = validatePassword(e.target.value);
            setPasswordErrors(validation.errors);
          }}
          error={password.length > 0 && passwordErrors.length > 0}
          helperText={
            password.length > 0 && passwordErrors.length > 0
              ? passwordErrors.join(", ")
              : password.length > 0 && passwordErrors.length === 0
              ? "Senha aceita"
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
            sx: {
              color: password.length > 0 && passwordErrors.length === 0 ? "#4caf50" : "#ff6b6b",
              fontSize: "0.75rem",
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {password.length > 0 && passwordErrors.length === 0 ? (
                  <CheckCircle sx={{ color: "#4caf50", mr: 1 }} />
                ) : null}
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
            "& .MuiOutlinedInput-root": {
              backgroundColor: "transparent",
              color: "#fff",
              borderRadius: "14px",
              "& fieldset": {
                borderColor:
                  password.length > 0 && passwordErrors.length === 0
                    ? "#4caf50"
                    : password.length > 0 && passwordErrors.length > 0
                    ? "#ff6b6b"
                    : "#fff",
              },
              "&:hover fieldset": {
                borderColor:
                  password.length > 0 && passwordErrors.length === 0
                    ? "#4caf50"
                    : password.length > 0 && passwordErrors.length > 0
                    ? "#ff6b6b"
                    : "#fff",
              },
              "&.Mui-focused fieldset": {
                borderColor:
                  password.length > 0 && passwordErrors.length === 0
                    ? "#4caf50"
                    : password.length > 0 && passwordErrors.length > 0
                    ? "#ff6b6b"
                    : "#fff",
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

        {/* Confirmar senha */}
        <TextField
          fullWidth
          label="Confirmar senha"
          variant="outlined"
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmPassword.length > 0 && !passwordsMatch}
          helperText={
            confirmPassword.length > 0 && !passwordsMatch
              ? "As senhas não coincidem"
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
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  edge="end"
                  sx={{ color: "#fff" }}
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                borderColor: confirmPassword.length > 0 && !passwordsMatch ? "#ff6b6b" : "#fff",
              },
              "&:hover fieldset": {
                borderColor: confirmPassword.length > 0 && !passwordsMatch ? "#ff6b6b" : "#fff",
              },
              "&.Mui-focused fieldset": {
                borderColor: confirmPassword.length > 0 && !passwordsMatch ? "#ff6b6b" : "#fff",
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
            backgroundColor: "#ffffff",
            color: "#111111",
            fontWeight: 600,
            borderRadius: "14px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#e8e8e8",
            },
            "&.Mui-disabled": {
              backgroundColor: "rgba(255, 204, 1, 0.4)",
              color: "rgba(0,0,0,0.6)",
            },
          }}
          onClick={handleFirstAccess}
          disabled={loading}
        >
          {loading ? "Salvando..." : "Definir senha"}
        </Button>
      </Box>
    </Box>
  );
}

export default function FirstAccessPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            ...dashboardBackgroundSx,
            height: "100vh",
            padding: "20px",
            alignItems: "center",
          }}
        >
          <Typography sx={{ color: "#fff" }}>Carregando...</Typography>
        </Box>
      }
    >
      <FirstAccessContent />
    </Suspense>
  );
}


