"use client";
import React, { useState, useEffect } from "react";
import { Button, Box, Container } from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { registerUser, updateEmailByCpf } from "@/app/services/auth/authService";
import { useToast } from "@/app/context/ToastContext";
import RegisterSuccess from "@/app/components/auth/RegisterSuccess";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import { validateFullName, validateEmailTLD } from "@/app/utils/registerValidators";
import { validatePassword } from "@/app/utils/passwordValidator";
import RegisterHeader from "@/app/components/auth/RegisterForm/RegisterHeader";
import RegisterSkeleton from "@/app/components/auth/RegisterForm/RegisterSkeleton";
import RegisterFormFields from "@/app/components/auth/RegisterForm/RegisterFormFields";
import LgpdModal from "@/app/components/auth/RegisterForm/LgpdModal";
import EmailUpdateModal from "@/app/components/auth/RegisterForm/EmailUpdateModal";

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
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [showEmailUpdateModal, setShowEmailUpdateModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [showLgpdModal, setShowLgpdModal] = useState(false);

  const { showToast } = useToast();

  // Controla animações quando a página carrega (apenas no cliente)
  useEffect(() => {
    setShouldAnimate(true);
    const timer = setTimeout(() => {
      setShouldAnimate(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const validation = validatePassword(value);
    setPasswordErrors(validation.errors);
  };

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

    if (password !== confirmPassword) {
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

  if (registered) {
    return <RegisterSuccess email={email} />;
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
        <RegisterHeader shouldAnimate={shouldAnimate} />

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
            <RegisterFormFields
              name={name}
              onNameChange={setName}
              cpf={cpf}
              onCpfChange={setCpf}
              birthDate={birthDate}
              onBirthDateChange={setBirthDate}
              email={email}
              onEmailChange={setEmail}
              password={password}
              onPasswordChange={handlePasswordChange}
              confirmPassword={confirmPassword}
              onConfirmPasswordChange={setConfirmPassword}
              gender={gender}
              onGenderChange={setGender}
              lgpdAccepted={lgpdAccepted}
              onLgpdAcceptedChange={setLgpdAccepted}
              ageTermsAccepted={ageTermsAccepted}
              onAgeTermsAcceptedChange={setAgeTermsAccepted}
              showPassword={showPassword}
              onToggleShowPassword={() => setShowPassword((prev) => !prev)}
              passwordErrors={passwordErrors}
              onShowLgpdModal={() => setShowLgpdModal(true)}
              shouldAnimate={shouldAnimate}
            />

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

        <EmailUpdateModal
          open={showEmailUpdateModal}
          onClose={() => setShowEmailUpdateModal(false)}
          email={newEmail}
          onEmailChange={setNewEmail}
          onUpdate={handleUpdateEmail}
          updating={updatingEmail}
        />

        <LgpdModal
          open={showLgpdModal}
          onClose={() => setShowLgpdModal(false)}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default RegisterForm;
