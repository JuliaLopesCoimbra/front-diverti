"use client";
import React, { useState } from "react";
import {
  Button,
  TextField,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  Container,
} from "@mui/material";
import { Visibility, VisibilityOff, ArrowBack } from "@mui/icons-material";
import { registerUser } from "@/app/services/auth/authService";
import { useToast } from "@/app/context/ToastContext";
import RegisterSuccess from "@/app/components/auth/RegisterSuccess";
import { useRouter } from "next/navigation";
import { validatePassword } from "@/app/utils/passwordValidator";

const RegisterForm: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
const router = useRouter();

  const { showToast } = useToast();

  const passwordsMatch = password === confirmPassword;

  const handleRegister = async () => {
    if (!passwordsMatch) {
      showToast("As senhas não conferem", "error");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      showToast(`Senha inválida: ${passwordValidation.errors.join(", ")}`, "error");
      return;
    }

    setLoading(true);
    try {
      await registerUser({ name, email, password });

      showToast(
        "Cadastro realizado! Verifique seu e-mail para confirmar a conta.",
        "success"
      );

      setRegistered(true); 
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Erro ao realizar cadastro", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      color: "#fff",
      borderRadius: "14px",
      transition: "all 0.3s ease",

      "& fieldset": {
        borderColor: "rgba(255, 255, 255, 0.3)",
        borderWidth: "1.5px",
      },
      "&:hover fieldset": {
        borderColor: "rgba(255, 255, 255, 0.5)",
      },
      "&.Mui-focused": {
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        "& fieldset": {
          borderColor: "#fff",
          borderWidth: "2px",
        },
      },
      "& input:-webkit-autofill": {
        WebkitBoxShadow: "0 0 0 1000px rgba(255, 255, 255, 0.1) inset",
        WebkitTextFillColor: "#fff",
        transition: "background-color 9999s ease-in-out 0s",
      },
      "& input:-webkit-autofill:hover": {
        WebkitBoxShadow: "0 0 0 1000px rgba(255, 255, 255, 0.15) inset",
        WebkitTextFillColor: "#fff",
      },
      "& input:-webkit-autofill:focus": {
        WebkitBoxShadow: "0 0 0 1000px rgba(255, 255, 255, 0.15) inset",
        WebkitTextFillColor: "#fff",
      },
    },
  };


  const labelStyle = {
    shrink: true,
    sx: {
      color: "#fff",
      fontSize: 13,
      transform: "translate(14px, -9px) scale(1)",
      "&.Mui-focused": { color: "#fff" },
    },
  };
if (registered) {
  return <RegisterSuccess email={email} />;
}

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url(/background/dashboard.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          width: "100%",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: 2,
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          backdropFilter: "blur(10px)",
        }}
      >
        <IconButton
          onClick={() => router.push("/pages/auth/login")}
          sx={{
            color: "#fff",
            padding: "8px",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          <ArrowBack sx={{ fontSize: 24 }} />
        </IconButton>
        <Typography
          variant="h5"
          sx={{
            color: "#fff",
            fontWeight: 600,
            fontSize: "1.5rem",
          }}
        >
          Criar conta
        </Typography>
      </Box>

      {/* Form Container */}
      <Container
        maxWidth="sm"
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 450,
            color: "#fff",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "40px 32px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Typography
            variant="body1"
            sx={{
              mb: 4,
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "0.95rem",
              lineHeight: 1.6,
            }}
          >
            Preencha os dados abaixo para criar sua conta.
          </Typography>

          <TextField
            fullWidth
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            InputLabelProps={labelStyle}
            sx={inputStyle}
          />

          <TextField
            fullWidth
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputLabelProps={labelStyle}
            sx={{ mt: 3, ...inputStyle }}
          />

          <TextField
            fullWidth
            label="Senha"
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
                : password.length > 0
                ? "A senha deve ter: mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial"
                : ""
            }
            InputLabelProps={labelStyle}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            FormHelperTextProps={{ sx: { color: "#ff6b6b", fontSize: "0.75rem" } }}
            sx={{ mt: 3, ...inputStyle }}
          />

          <TextField
            fullWidth
            label="Confirmar senha"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={Boolean(confirmPassword && !passwordsMatch)}
            helperText={
              confirmPassword && !passwordsMatch ? "As senhas não conferem" : ""
            }
            InputLabelProps={labelStyle}
            FormHelperTextProps={{ sx: { color: "#ff6b6b" } }}
            sx={{ mt: 3, ...inputStyle }}
          />

          <Button
            fullWidth
            variant="contained"
            sx={{
              mt: 4,
              mb: 2,
              backgroundColor: "#ffcc01",
              color: "#000",
              fontWeight: 700,
              fontSize: "1rem",
              padding: "14px",
              borderRadius: "14px",
              textTransform: "none",
              boxShadow: "0 4px 14px rgba(255, 204, 1, 0.3)",
              "&:hover": {
                backgroundColor: "#ffd633",
                boxShadow: "0 6px 20px rgba(255, 204, 1, 0.4)",
                transform: "translateY(-1px)",
              },
              "&:disabled": {
                backgroundColor: "rgba(255, 204, 1, 0.5)",
                color: "rgba(0, 0, 0, 0.5)",
              },
              transition: "all 0.3s ease",
            }}
            disabled={loading}
            onClick={handleRegister}
          >
            {loading ? "Criando conta..." : "Cadastrar"}
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default RegisterForm;
