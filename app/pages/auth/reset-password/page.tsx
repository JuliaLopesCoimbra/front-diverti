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
import axios from "axios";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import { validatePassword } from "@/app/utils/passwordValidator";
import { getApiUrl } from "@/app/utils/apiUrlHelper";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

const API_URL = getApiUrl();

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const router = useRouter();

  const [new_password, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { showToast } = useToast();

  const passwordsMatch =
    new_password.length > 0 &&
    confirmPassword.length > 0 &&
    new_password === confirmPassword;

  const handleReset = async () => {
    const passwordValidation = validatePassword(new_password);
    if (!passwordValidation.isValid) {
      showToast(`Senha inválida: ${passwordValidation.errors.join(", ")}`, "error");
      return;
    }

    if (new_password !== confirmPassword) {
      showToast("As senhas não coincidem.", "error");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        token,
        new_password,
      });

      showToast("Senha redefinida com sucesso!", "success");

      setTimeout(() => {
        router.push("/pages/auth/login");
      }, 1500);
    } catch {
      showToast("Token inválido ou expirado.", "error");
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
        ...dashboardBackgroundSx,
        display: "flex",
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
        <Typography variant="h5" sx={{ marginBottom: "20px" }}>
          Redefinir senha
        </Typography>
        <Typography variant="body2" sx={{ marginBottom: "20px" }}>
          Digite sua nova senha abaixo.
        </Typography>

        {/* Nova senha */}
        <TextField
          fullWidth
          label="Nova senha"
          variant="outlined"
          type={showPassword ? "text" : "password"}
          value={new_password}
          onChange={(e) => {
            setNewPassword(e.target.value);
            const validation = validatePassword(e.target.value);
            setPasswordErrors(validation.errors);
          }}
          error={new_password.length > 0 && passwordErrors.length > 0}
          helperText={
            new_password.length > 0 && passwordErrors.length > 0
              ? passwordErrors.join(", ")
              : new_password.length > 0 && passwordErrors.length === 0
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
              color: new_password.length > 0 && passwordErrors.length === 0 ? "#4caf50" : "#ff6b6b",
              fontSize: "0.75rem",
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {new_password.length > 0 && passwordErrors.length === 0 ? (
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
                  new_password.length > 0 && passwordErrors.length === 0
                    ? "#4caf50"
                    : new_password.length > 0 && passwordErrors.length > 0
                    ? "#ff6b6b"
                    : "#fff",
              },
              "&:hover fieldset": {
                borderColor:
                  new_password.length > 0 && passwordErrors.length === 0
                    ? "#4caf50"
                    : new_password.length > 0 && passwordErrors.length > 0
                    ? "#ff6b6b"
                    : "#fff",
              },
              "&.Mui-focused fieldset": {
                borderColor:
                  new_password.length > 0 && passwordErrors.length === 0
                    ? "#4caf50"
                    : new_password.length > 0 && passwordErrors.length > 0
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
          label="Confirmar nova senha"
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
          onClick={handleReset}
          disabled={loading}
        >
          {loading ? "Salvando..." : "Redefinir senha"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            ...dashboardBackgroundSx,
            display: "flex",
            justifyContent: "center",
            height: "100vh",
            padding: "20px",
            alignItems: "center",
          }}
        >
          <Typography sx={{ color: "#fff" }}>Carregando...</Typography>
        </Box>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

