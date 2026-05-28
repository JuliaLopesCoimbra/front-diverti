"use client";
import React, { useState, useEffect, Suspense } from "react";
import {
  Button,
  Typography,
  Box,
  Container,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/app/context/ToastContext";
import { verifyAge } from "@/app/services/auth/authService";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

function AgeVerificationContent() {
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const { showToast } = useToast();

  useEffect(() => {
    const tempToken = params.get("temp_token");
    if (!tempToken) {
      router.push("/pages/auth/login");
    }
  }, [params, router]);

  const handleSubmit = async () => {
    if (!birthDate) {
      showToast("Por favor, informe sua data de nascimento", "error");
      return;
    }

    if (!confirmed) {
      showToast("Você deve confirmar que é maior de idade", "error");
      return;
    }

    // Validar idade
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear() - 
      (today.getMonth() < birthDate.getMonth() || 
       (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);
    
    if (age < 18) {
      showToast("Você deve ter pelo menos 18 anos para usar este serviço", "error");
      return;
    }

    setLoading(true);
    try {
      const tempToken = params.get("temp_token");
      const formattedDate = birthDate.toISOString().split('T')[0];

      const result = await verifyAge(formattedDate, true, tempToken || undefined);

      showToast("Idade verificada com sucesso!", "success");
      
      setTimeout(() => {
        // Se precisa completar perfil, redireciona para complete-profile
        if (result.requires_profile_completion && result.temp_token) {
          router.push(
            `/pages/auth/complete-profile?temp_token=${result.temp_token}&requires_profile_completion=true`
          );
        } else {
          // Se não precisa completar perfil, redireciona para login
          router.push("/pages/auth/login");
        }
      }, 1500);
    } catch (err: any) {
      showToast(
        err.message || "Erro ao verificar idade",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box
        sx={{
          ...dashboardBackgroundSx,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <Container maxWidth="sm">
          <Box
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              padding: "40px 32px",
              color: "#fff",
            }}
          >
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Confirmação de Idade
            </Typography>
            <Typography variant="body2" sx={{ mb: 4, color: "rgba(255, 255, 255, 0.8)" }}>
              Para continuar, precisamos confirmar que você é maior de idade (18 anos ou mais).
            </Typography>

            <DatePicker
              label="Data de Nascimento"
              value={birthDate}
              onChange={(newValue) => setBirthDate(newValue)}
              maxDate={new Date()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: {
                    mb: 3,
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      color: "#fff !important",
                      "& input": {
                        color: "#fff !important",
                        WebkitTextFillColor: "#fff !important",
                        "&::placeholder": {
                          color: "rgba(255, 255, 255, 0.5) !important",
                          opacity: 1,
                        },
                      },
                      "& .MuiInputBase-input": {
                        color: "#fff !important",
                        WebkitTextFillColor: "#fff !important",
                      },
                      "& fieldset": {
                        borderColor: "rgba(255, 255, 255, 0.3) !important",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(255, 255, 255, 0.5) !important",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#fff !important",
                      },
                      "& input:-webkit-autofill": {
                        WebkitBoxShadow: "0 0 0 1000px rgba(255, 255, 255, 0.1) inset !important",
                        WebkitTextFillColor: "#fff !important",
                        transition: "background-color 9999s ease-in-out 0s",
                      },
                      "& input:-webkit-autofill:hover": {
                        WebkitBoxShadow: "0 0 0 1000px rgba(255, 255, 255, 0.15) inset !important",
                        WebkitTextFillColor: "#fff !important",
                      },
                      "& input:-webkit-autofill:focus": {
                        WebkitBoxShadow: "0 0 0 1000px rgba(255, 255, 255, 0.15) inset !important",
                        WebkitTextFillColor: "#fff !important",
                      },
                    },
                  },
                  InputLabelProps: {
                    shrink: true,
                    sx: { 
                      color: "#fff",
                      fontSize: 13,
                      transform: "translate(14px, -9px) scale(1)",
                      "&.Mui-focused": { color: "#fff" },
                    },
                  },
                  InputProps: {
                    sx: {
                      color: "#fff !important",
                      "& input": {
                        color: "#fff !important",
                        WebkitTextFillColor: "#fff !important",
                      },
                    },
                  },
                },
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  sx={{
                    color: "#ffffff",
                    "&.Mui-checked": {
                      color: "#ffffff",
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: "#fff" }}>
                  Confirmo que tenho 18 anos ou mais
                </Typography>
              }
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || !confirmed || !birthDate}
              sx={{
                backgroundColor: "#ffffff",
                color: "#111111",
                fontWeight: 700,
                padding: "14px",
                borderRadius: "14px",
                "&:hover": {
                  backgroundColor: "#e8e8e8",
                },
                "&:disabled": {
                  backgroundColor: "rgba(255, 31, 33, 0.5)",
                },
              }}
            >
              {loading ? "Verificando..." : "Confirmar e Continuar"}
            </Button>
          </Box>
        </Container>
      </Box>
    </LocalizationProvider>
  );
}

export default function AgeVerificationPage() {
  return (
    <Suspense
      fallback={
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="100vh"
          gap={2}
        >
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary">
            Carregando...
          </Typography>
        </Box>
      }
    >
      <AgeVerificationContent />
    </Suspense>
  );
}


