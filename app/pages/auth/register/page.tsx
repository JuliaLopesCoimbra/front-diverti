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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Visibility, VisibilityOff, ArrowBack, CheckCircle } from "@mui/icons-material";
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { registerUser, updateEmailByCpf } from "@/app/services/auth/authService";
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

// Função para validar nome completo (nome e sobrenome)
const validateFullName = (name: string): boolean => {
  if (!name || name.trim().length === 0) return false;
  
  // Remover espaços extras
  const trimmedName = name.trim();
  
  // Verificar se tem pelo menos 3 caracteres
  if (trimmedName.length < 3) return false;
  
  // Verificar se tem pelo menos nome e sobrenome (2 palavras)
  const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);
  if (nameParts.length < 2) return false;
  
  // Verificar se cada parte tem pelo menos 2 caracteres
  for (const part of nameParts) {
    if (part.length < 2) return false;
  }
  
  // Verificar se não contém caracteres inválidos (apenas letras, espaços, hífens e acentos)
  const validNameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!validNameRegex.test(trimmedName)) return false;
  
  // Verificar se não contém caracteres especiais como @, números, etc.
  if (/[@#$%^&*()_+=\[\]{}|\\:";'<>?,.\/0-9]/.test(trimmedName)) return false;
  
  return true;
};

// Função para validar TLD do email
const validateEmailTLD = (email: string): boolean => {
  if (!email || !email.includes('@')) return false;
  
  const domain = email.split('@')[1];
  if (!domain || !domain.includes('.')) return false;
  
  const parts = domain.split('.');
  const tld = parts[parts.length - 1].toLowerCase();
  
  // Verificar se o TLD tem pelo menos 2 caracteres e contém apenas letras
  if (tld.length < 2 || !/^[a-z]+$/.test(tld)) return false;
  
  // Lista de TLDs válidos comuns
  const validTLDs = [
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'br', 'co', 'uk', 'us', 'ca', 'au', 'de', 'fr', 'it', 'es', 'pt',
    'nl', 'be', 'ch', 'at', 'se', 'no', 'dk', 'fi', 'pl', 'cz', 'ie', 'gr', 'ru', 'jp', 'cn', 'in', 'kr', 'mx', 'ar',
    'cl', 'pe', 've', 'ec', 'uy', 'py', 'bo', 'cr', 'pa', 'do', 'gt', 'hn', 'ni', 'sv', 'info', 'biz', 'name', 'pro',
    'io', 'dev', 'tech', 'online', 'site', 'website', 'xyz', 'app', 'cloud', 'store', 'shop', 'blog', 'news', 'tv',
    'me', 'cc', 'ws', 'mobi', 'asia', 'tel', 'jobs', 'travel', 'cat', 'eu', 'ac', 'ad', 'ae', 'af', 'ag', 'ai', 'al',
    'am', 'ao', 'aq', 'as', 'aw', 'ax', 'az', 'ba', 'bb', 'bd', 'bf', 'bg', 'bh', 'bi', 'bj', 'bm', 'bn', 'bs', 'bt',
    'bv', 'bw', 'by', 'bz', 'cd', 'cf', 'cg', 'ci', 'ck', 'cm', 'cu', 'cv', 'cw', 'cx', 'cy', 'dj', 'dm', 'dz', 'ee',
    'eg', 'eh', 'er', 'et', 'fj', 'fk', 'fm', 'fo', 'ga', 'gb', 'gd', 'ge', 'gf', 'gg', 'gh', 'gi', 'gl', 'gm', 'gn',
    'gp', 'gq', 'gs', 'gu', 'gw', 'gy', 'hk', 'hm', 'hr', 'ht', 'hu', 'id', 'il', 'im', 'iq', 'ir', 'is', 'je', 'jm',
    'jo', 'ke', 'kg', 'kh', 'ki', 'km', 'kn', 'kp', 'kw', 'ky', 'kz', 'la', 'lb', 'lc', 'li', 'lk', 'lr', 'ls', 'lt',
    'lu', 'lv', 'ly', 'ma', 'mc', 'md', 'mf', 'mg', 'mh', 'mk', 'ml', 'mm', 'mn', 'mo', 'mp', 'mq', 'mr', 'ms', 'mt',
    'mu', 'mv', 'mw', 'my', 'mz', 'na', 'nc', 'ne', 'nf', 'ng', 'np', 'nr', 'nu', 'nz', 'om', 'pf', 'pg', 'ph', 'pk',
    'pm', 'pn', 'pr', 'ps', 'pw', 'qa', 're', 'ro', 'rs', 'rw', 'sa', 'sb', 'sc', 'sd', 'sg', 'sh', 'si', 'sj', 'sk',
    'sl', 'sm', 'sn', 'so', 'sr', 'ss', 'st', 'sx', 'sy', 'sz', 'tc', 'td', 'tf', 'tg', 'th', 'tj', 'tk', 'tl', 'tm',
    'tn', 'to', 'tr', 'tt', 'tw', 'tz', 'ua', 'ug', 'um', 'uz', 'va', 'vc', 'vg', 'vi', 'vn', 'vu', 'wf', 'ye',
    'yt', 'za', 'zm', 'zw'
  ];
  
  // Verificar TLD de dois níveis (ex: com.br, co.uk)
  if (parts.length >= 2) {
    const twoLevelTLD = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`.toLowerCase();
    const twoLevelValidTLDs = ['com.br', 'com.mx', 'com.ar', 'com.co', 'org.br', 'net.br', 'gov.br', 'edu.br', 'co.uk', 'com.au'];
    if (twoLevelValidTLDs.includes(twoLevelTLD)) return true;
  }
  
  return validTLDs.includes(tld);
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
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [showEmailUpdateModal, setShowEmailUpdateModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const router = useRouter();

  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Controla animações quando a página carrega
  useEffect(() => {
    if (mounted) {
      setShouldAnimate(true);
      const timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  const passwordsMatch = password === confirmPassword;

  const handleRegister = async () => {
    // Validar nome completo
    if (!name || name.trim().length === 0) {
      showToast("Por favor, informe seu nome completo", "error");
      return;
    }

    if (!validateFullName(name)) {
      showToast("Por favor, informe um nome completo válido (nome e sobrenome, sem caracteres especiais)", "error");
      return;
    }

    if (!birthDate) {
      showToast("Por favor, informe sua data de nascimento", "error");
      return;
    }

    // Validar se a data é válida
    if (isNaN(birthDate.getTime())) {
      showToast("Data de nascimento inválida. Por favor, informe uma data válida.", "error");
      return;
    }

    // Validar se a data não é muito antiga (antes de 1900)
    if (birthDate.getFullYear() < 1900) {
      showToast("Data de nascimento inválida. Por favor, informe uma data válida.", "error");
      return;
    }

    // Validar se a data não é no futuro
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (birthDate > today) {
      showToast("Data de nascimento não pode ser no futuro.", "error");
      return;
    }

    // Validar idade no frontend
    const age = today.getFullYear() - birthDate.getFullYear() - 
      (today.getMonth() < birthDate.getMonth() || 
       (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);
    
    if (age < 18) {
      showToast("Você deve ter pelo menos 18 anos para se cadastrar", "error");
      return;
    }

    // Validar idade máxima razoável (por exemplo, 150 anos)
    if (age > 150) {
      showToast("Data de nascimento inválida. Por favor, informe uma data válida.", "error");
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

    // Validar email e TLD
    if (!email || !email.includes('@')) {
      showToast("Por favor, informe um email válido", "error");
      return;
    }

    if (!validateEmailTLD(email)) {
      showToast("Email inválido. Por favor, informe um email com extensão válida (ex: .com, .br, .org)", "error");
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
        // Verificar se é o erro de email não verificado
        if ((err as any).needsEmailUpdate) {
          setNewEmail(email); // Preencher com o email que o usuário digitou
          setShowEmailUpdateModal(true);
        } else {
          showToast(err.message, "error");
        }
      } else {
        showToast("Erro ao realizar cadastro", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      showToast("Por favor, informe um email válido", "error");
      return;
    }

    setUpdatingEmail(true);
    try {
      const cpfClean = cpf.replace(/\D/g, ''); // Remove formatação do CPF
      await updateEmailByCpf(cpfClean, newEmail);

      showToast(
        "Email atualizado! Verifique sua caixa de entrada para confirmar o novo email.",
        "success"
      );

      setShowEmailUpdateModal(false);
      setEmail(newEmail);
      setRegistered(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Erro ao atualizar email", "error");
      }
    } finally {
      setUpdatingEmail(false);
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
        className={shouldAnimate ? "slide-up-animation" : ""}
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
          className={shouldAnimate ? "slide-up-delay-1" : ""}
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
            className={shouldAnimate ? "slide-up-delay-2" : ""}
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

          <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
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
          </Box>

          <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
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
          </Box>

          <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
            <TextField
              fullWidth
              label="Data de Nascimento"
  type="date"
  value={birthDate ? birthDate.toISOString().split('T')[0] : ""}
  onChange={(e) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const date = new Date(dateValue);
      // Apenas atualizar o estado se a data for válida, sem mostrar erro durante a digitação
      if (!isNaN(date.getTime())) {
        setBirthDate(date);
      }
    } else {
      setBirthDate(null);
    }
  }}
  inputProps={{
    min: "1900-01-01",
    max: (() => {
      const today = new Date();
      const maxDate = new Date(today);
      maxDate.setFullYear(today.getFullYear() - 18);
      return maxDate.toISOString().split('T')[0];
    })(),
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
          </Box>

          <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
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
          </Box>

          <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
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
          </Box>

          <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
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
          </Box>

          <Box className={shouldAnimate ? "slide-up-delay-3" : ""}>
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
          </Box>

          <Box className={shouldAnimate ? "slide-up-delay-3" : ""}>
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
          </Box>

          <Box className={shouldAnimate ? "slide-up-delay-3" : ""}>
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
          </Box>

          <Box className={shouldAnimate ? "slide-up-delay-3" : ""}>
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
        </Box>
      </Container>

      {/* Modal para atualizar email */}
      <Dialog
        open={showEmailUpdateModal}
        onClose={() => setShowEmailUpdateModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#fff",
          },
        }}
      >
        <DialogTitle sx={{ color: "#fff", fontWeight: 600, fontSize: "1.5rem" }}>
          Atualizar Email
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 3 }}>
            Este CPF já foi cadastrado, mas o email ainda não foi verificado. 
            Por favor, informe o email correto para receber o código de verificação.
          </Typography>
          <TextField
            fullWidth
            label="Email correto"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            disabled={updatingEmail}
            sx={{
              mt: 2,
              "& .MuiOutlinedInput-root": {
                color: "#fff",
                "& fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#ffcc01",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255, 255, 255, 0.7)",
                "&.Mui-focused": {
                  color: "#ffcc01",
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ padding: "16px 24px", gap: 2 }}>
          <Button
            onClick={() => setShowEmailUpdateModal(false)}
            disabled={updatingEmail}
            sx={{
              color: "rgba(255, 255, 255, 0.7)",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpdateEmail}
            disabled={updatingEmail || !newEmail}
            variant="contained"
            sx={{
              backgroundColor: "#ffcc01",
              color: "#000",
              fontWeight: 600,
              borderRadius: "14px",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#e6b800",
              },
              "&:disabled": {
                backgroundColor: "rgba(255, 204, 1, 0.5)",
                color: "rgba(0, 0, 0, 0.5)",
              },
            }}
          >
            {updatingEmail ? "Atualizando..." : "Atualizar e Enviar Código"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </LocalizationProvider>
  );
};

export default RegisterForm;
