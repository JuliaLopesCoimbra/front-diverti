"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Button,
  TextField,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  Container,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Visibility, VisibilityOff, ArrowBack, CheckCircle } from "@mui/icons-material";
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { registerUser } from "@/app/services/auth/authService";
import { useToast } from "@/app/context/ToastContext";
import RegisterSuccess from "@/app/components/auth/RegisterSuccess";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import { useRouter } from "next/navigation";
import { validatePassword } from "@/app/utils/passwordValidator";

// Função para formatar CPF
const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

const RegisterForm: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [cpf, setCpf] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "prefer_not_to_say" | "">("");
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [ageTermsAccepted, setAgeTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const passwordsMatch = password === confirmPassword;

  const handleRegister = async () => {
    if (!birthDate) {
      showToast("Por favor, informe sua data de nascimento", "error");
      return;
    }

    // Validar idade no frontend
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear() - 
      (today.getMonth() < birthDate.getMonth() || 
       (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);
    
    if (age < 18) {
      showToast("Você deve ter pelo menos 18 anos para se cadastrar", "error");
      return;
    }

    if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
      showToast("Por favor, informe um CPF válido", "error");
      return;
    }

    if (!gender) {
      showToast("Por favor, informe seu sexo", "error");
      return;
    }

    if (!lgpdAccepted) {
      showToast("Você deve aceitar os termos LGPD para continuar", "error");
      return;
    }

    if (!ageTermsAccepted) {
      showToast("Você deve aceitar os termos de maioridade para continuar", "error");
      return;
    }

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
      const formattedDate = birthDate.toISOString().split('T')[0];
      const cpfClean = cpf.replace(/\D/g, ''); // Remove formatação do CPF
      
      await registerUser({ 
        name, 
        email, 
        password,
        birth_date: formattedDate,
        cpf: cpfClean,
        gender: gender as "male" | "female" | "other" | "prefer_not_to_say",
        lgpd_accepted: lgpdAccepted,
        age_terms_accepted: ageTermsAccepted
      });

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

  const isPasswordValid = password.length > 0 && passwordErrors.length === 0;
  const isPasswordError = password.length > 0 && passwordErrors.length > 0;

  const passwordFieldBorderColor = useMemo(() => {
    if (isPasswordValid) return "#4caf50";
    if (isPasswordError) return "#ff6b6b";
    return "rgba(255, 255, 255, 0.3)";
  }, [isPasswordValid, isPasswordError]);

  if (registered) {
    return <RegisterSuccess email={email} />;
  }

  // Skeleton enquanto o componente está montando
  if (!mounted) {
    return (
      <Box
        suppressHydrationWarning
        sx={{
          ...dashboardBackgroundSx,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header Skeleton */}
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
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
          />
          <Skeleton
            variant="text"
            width={150}
            height={32}
            sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
          />
        </Box>

        {/* Form Container Skeleton */}
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
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              padding: "40px 32px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Skeleton
              variant="text"
              width="80%"
              height={24}
              sx={{ mb: 4, bgcolor: "rgba(255, 255, 255, 0.1)" }}
            />

            {/* Input Skeletons */}
            {[1, 2, 3, 4, 5].map((index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                height={56}
                sx={{
                  mt: index === 1 ? 0 : 3,
                  borderRadius: "14px",
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                }}
              />
            ))}

            {/* Button Skeleton */}
            <Skeleton
              variant="rectangular"
              height={48}
              sx={{
                mt: 4,
                mb: 2,
                borderRadius: "14px",
                bgcolor: "rgba(255, 255, 255, 0.1)",
              }}
            />
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box
        suppressHydrationWarning
        sx={{
          ...dashboardBackgroundSx,
          minHeight: "100vh",
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
            InputLabelProps={{
              shrink: true,
              sx: {
                color: "#fff",
                fontSize: 13,
                transform: "translate(14px, -9px) scale(1)",
                "&.Mui-focused": { color: "#fff" },
              },
            }}
            sx={{
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
            }}
          />

          <TextField
            fullWidth
            label="CPF"
            value={cpf}
            onChange={(e) => {
              const formatted = formatCPF(e.target.value);
              if (formatted.replace(/\D/g, '').length <= 11) {
                setCpf(formatted);
              }
            }}
            placeholder="000.000.000-00"
            InputLabelProps={{
              shrink: true,
              sx: {
                color: "#fff",
                fontSize: 13,
                transform: "translate(14px, -9px) scale(1)",
                "&.Mui-focused": { color: "#fff" },
              },
            }}
            sx={{
              mt: 3,
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
            }}
          />

<TextField
  fullWidth
  label="Data de Nascimento"
  type="date"
  value={birthDate ? birthDate.toISOString().split('T')[0] : ""}
  onChange={(e) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    setBirthDate(date);
  }}
  InputLabelProps={{
    shrink: true, // Mantém o label no topo para não sobrepor o seletor nativo
    sx: {
      color: "#fff",
      fontSize: 13,
      transform: "translate(14px, -9px) scale(1)",
      "&.Mui-focused": { color: "#fff" },
    },
  }}
  sx={{
    mt: 3,
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
      // Estiliza o ícone do calendário nativo do navegador para ficar branco/claro
      "& input::-webkit-calendar-picker-indicator": {
        filter: "invert(1)",
        cursor: "pointer",
        opacity: 0.7,
      },
    },
  }}
/>
          <TextField
            fullWidth
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputLabelProps={{
              shrink: true,
              sx: {
                color: "#fff",
                fontSize: 13,
                transform: "translate(14px, -9px) scale(1)",
                "&.Mui-focused": { color: "#fff" },
              },
            }}
            sx={{
              mt: 3,
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
            }}
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
            error={isPasswordError}
            helperText={
              isPasswordError
                ? passwordErrors.join(", ")
                : isPasswordValid
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
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {isPasswordValid ? (
                    <CheckCircle sx={{ color: "#4caf50", mr: 1 }} />
                  ) : null}
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
            FormHelperTextProps={{
              sx: {
                color: isPasswordValid ? "#4caf50" : "#ff6b6b",
                fontSize: "0.75rem",
              },
            }}
            sx={{
              mt: 3,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                borderRadius: "14px",
                transition: "all 0.3s ease",
                "& fieldset": {
                  borderColor: passwordFieldBorderColor,
                  borderWidth: "1.5px",
                },
                "&:hover fieldset": {
                  borderColor: passwordFieldBorderColor,
                },
                "&.Mui-focused": {
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  "& fieldset": {
                    borderColor: passwordFieldBorderColor,
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
            }}
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
            InputLabelProps={{
              shrink: true,
              sx: {
                color: "#fff",
                fontSize: 13,
                transform: "translate(14px, -9px) scale(1)",
                "&.Mui-focused": { color: "#fff" },
              },
            }}
            FormHelperTextProps={{ sx: { color: "#ff6b6b" } }}
            sx={{
              mt: 3,
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
            }}
          />

          <FormControl
            fullWidth
            sx={{
              mt: 3,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                borderRadius: "14px",
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
              },
              "& .MuiInputLabel-root": {
                color: "#fff",
                fontSize: 13,
                transform: "translate(14px, -9px) scale(1)",
                "&.Mui-focused": { color: "#fff" },
              },
              "& .MuiSelect-icon": {
                color: "rgba(255, 255, 255, 0.7)",
              },
            }}
          >
            <InputLabel>Sexo</InputLabel>
            <Select
              value={gender}
              onChange={(e) => setGender(e.target.value as typeof gender)}
              label="Sexo"
              sx={{
                color: "#fff",
                "& .MuiSelect-select": {
                  color: "#fff",
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: "rgba(0, 0, 0, 0.9)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "14px",
                    mt: 1,
                    "& .MuiMenuItem-root": {
                      color: "#fff",
                      "&:hover": {
                        backgroundColor: "rgba(255, 204, 1, 0.2)",
                      },
                      "&.Mui-selected": {
                        backgroundColor: "rgba(255, 204, 1, 0.3)",
                        color: "#ffcc01",
                        "&:hover": {
                          backgroundColor: "rgba(255, 204, 1, 0.4)",
                        },
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="male">Masculino</MenuItem>
              <MenuItem value="female">Feminino</MenuItem>
              <MenuItem value="other">Outro</MenuItem>
              <MenuItem value="prefer_not_to_say">Prefiro não informar</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={lgpdAccepted}
                onChange={(e) => setLgpdAccepted(e.target.checked)}
                sx={{
                  color: "rgba(255, 255, 255, 0.7)",
                  "&.Mui-checked": {
                    color: "#ffcc01",
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.875rem" }}>
                Aceito os termos de proteção de dados pessoais (LGPD)
              </Typography>
            }
            sx={{ mt: 3 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={ageTermsAccepted}
                onChange={(e) => setAgeTermsAccepted(e.target.checked)}
                sx={{
                  color: "rgba(255, 255, 255, 0.7)",
                  "&.Mui-checked": {
                    color: "#ffcc01",
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.875rem" }}>
                Confirmo que tenho 18 anos ou mais
              </Typography>
            }
            sx={{ mt: 1 }}
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
            disabled={loading || !birthDate || !cpf || !gender || !lgpdAccepted || !ageTermsAccepted}
            onClick={handleRegister}
          >
            {loading ? "Criando conta..." : "Cadastrar"}
          </Button>
        </Box>
      </Container>
    </Box>
    </LocalizationProvider>
  );
};

export default RegisterForm;
