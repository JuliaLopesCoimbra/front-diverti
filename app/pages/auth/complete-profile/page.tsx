"use client";
import React, { useState, useEffect, Suspense } from "react";
import {
  Button,
  TextField,
  Typography,
  Box,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/app/context/ToastContext";
import { useAuth } from "@/app/context/AuthContext";
import axios from "axios";
import { getApiUrl } from "@/app/utils/apiUrlHelper";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import LgpdModal from "@/app/components/auth/RegisterForm/LgpdModal";

const API_URL = getApiUrl();

// Função para formatar CPF
const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

function CompleteProfileContent() {
  const [cpf, setCpf] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "prefer_not_to_say" | "">("");
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [ageTermsAccepted, setAgeTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLgpdModal, setShowLgpdModal] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const { showToast } = useToast();
  const { login } = useAuth();

  useEffect(() => {
    const tempToken = params.get("temp_token");
    if (!tempToken) {
      router.push("/pages/auth/login");
    }
  }, [params, router]);

  const handleSubmit = async () => {
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

    setLoading(true);
    try {
      const tempToken = params.get("temp_token");
      const cpfClean = cpf.replace(/\D/g, ''); // Remove formatação do CPF

      const response = await axios.post<{
        access_token: string;
        refresh_token: string;
        token_type?: string;
      }>(
        `${API_URL}/auth/complete-profile`,
        {
          cpf: cpfClean,
          gender: gender as "male" | "female" | "other" | "prefer_not_to_say",
          lgpd_accepted: lgpdAccepted,
          age_terms_accepted: ageTermsAccepted,
        },
        {
          headers: {
            Authorization: `Bearer ${tempToken}`,
          },
        }
      );

      // Fazer login automaticamente com os tokens retornados
      const { access_token, refresh_token } = response.data;
      
      // Usar a função login do AuthContext
      login(access_token, refresh_token);
      
      // Salvar tokens
      localStorage.setItem("access_token", access_token);
      document.cookie = `refresh_token=${refresh_token}; path=/; secure`;

      showToast("Perfil completado com sucesso! Redirecionando...", "success");
      
      // Pequeno delay para garantir que o contexto seja atualizado
      setTimeout(() => {
        router.push("/pages/user/home");
      }, 100);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Erro ao completar perfil";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
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
            Complete seu Perfil
          </Typography>
          <Typography variant="body2" sx={{ mb: 4, color: "rgba(255, 255, 255, 0.8)" }}>
            Para continuar, precisamos de algumas informações adicionais.
          </Typography>

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
              mb: 3,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                borderRadius: "14px",
                "& fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#fff",
                },
                "& input": {
                  color: "#fff",
                },
              },
            }}
          />

          <FormControl
            fullWidth
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                borderRadius: "14px",
                "& fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#fff",
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
              <Typography 
                variant="body2" 
                sx={{ 
                  color: "rgba(255, 255, 255, 0.9)", 
                  fontSize: "0.875rem",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  whiteSpace: "normal",
                  maxWidth: "100%",
                  lineHeight: 1.4,
                }}
              >
                Aceito os termos de proteção de dados pessoais (LGPD)
              </Typography>
            }
            sx={{ mb: 1, width: "100%", maxWidth: "100%" }}
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
              <Typography 
                variant="body2" 
                sx={{ 
                  color: "rgba(255, 255, 255, 0.9)", 
                  fontSize: "0.875rem",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  whiteSpace: "normal",
                  maxWidth: "100%",
                  lineHeight: 1.4,
                }}
              >
                Confirmo que tenho 18 anos ou mais
              </Typography>
            }
            sx={{ mb: 1, width: "100%", maxWidth: "100%" }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
            <Button
              onClick={() => setShowLgpdModal(true)}
              sx={{
                textTransform: "none",
                color: "#ffcc01",
                fontSize: "0.7rem",
                textDecoration: "underline",
                padding: 0,
                minWidth: "auto",
                "&:hover": {
                  textDecoration: "underline",
                  backgroundColor: "transparent",
                },
              }}
            >
              Ler termos completos
            </Button>
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !cpf || !gender || !lgpdAccepted || !ageTermsAccepted}
            sx={{
              backgroundColor: "#ffcc01",
              color: "#000",
              fontWeight: 700,
              padding: "14px",
              borderRadius: "14px",
              "&:hover": {
                backgroundColor: "#ffd633",
              },
              "&:disabled": {
                backgroundColor: "rgba(255, 204, 1, 0.5)",
              },
            }}
          >
            {loading ? "Completando..." : "Completar Perfil"}
          </Button>
        </Box>
      </Container>

      <LgpdModal
        open={showLgpdModal}
        onClose={() => setShowLgpdModal(false)}
      />
    </Box>
  );
}

export default function CompleteProfilePage() {
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
      <CompleteProfileContent />
    </Suspense>
  );
}

