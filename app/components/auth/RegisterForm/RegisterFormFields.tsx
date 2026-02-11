import React, { useState } from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Button,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff, CheckCircle } from "@mui/icons-material";
import { formatCPF } from "@/app/utils/registerValidators";
import { validatePassword } from "@/app/utils/passwordValidator";
import LgpdDataProtectionModal from "./LgpdDataProtectionModal";
import MarketingConsentModal from "./MarketingConsentModal";

interface RegisterFormFieldsProps {
  name: string;
  onNameChange: (value: string) => void;
  cpf: string;
  onCpfChange: (value: string) => void;
  birthDate: Date | null;
  onBirthDateChange: (date: Date | null) => void;
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  gender: "male" | "female" | "other" | "prefer_not_to_say" | "";
  onGenderChange: (value: "male" | "female" | "other" | "prefer_not_to_say" | "") => void;
  lgpdAccepted: boolean;
  onLgpdAcceptedChange: (value: boolean) => void;
  ageTermsAccepted: boolean;
  onAgeTermsAcceptedChange: (value: boolean) => void;
  marketingEmailAccepted: boolean;
  onMarketingEmailAcceptedChange: (value: boolean) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  passwordErrors: string[];
  onShowLgpdModal: () => void;
  shouldAnimate?: boolean;
}

const RegisterFormFields: React.FC<RegisterFormFieldsProps> = ({
  name,
  onNameChange,
  cpf,
  onCpfChange,
  birthDate,
  onBirthDateChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  gender,
  onGenderChange,
  lgpdAccepted,
  onLgpdAcceptedChange,
  ageTermsAccepted,
  onAgeTermsAcceptedChange,
  marketingEmailAccepted,
  onMarketingEmailAcceptedChange,
  showPassword,
  onToggleShowPassword,
  passwordErrors,
  onShowLgpdModal,
  shouldAnimate = false,
}) => {
  const [showLgpdDataProtectionModal, setShowLgpdDataProtectionModal] = useState(false);
  const [showMarketingConsentModal, setShowMarketingConsentModal] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const isPasswordValid = password.length > 0 && passwordErrors.length === 0;
  const isPasswordError = password.length > 0 && passwordErrors.length > 0;

  const passwordFieldBorderColor =
    isPasswordValid ? "#4caf50" : isPasswordError ? "#ff6b6b" : "rgba(255, 255, 255, 0.3)";

  const getMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setFullYear(today.getFullYear() - 18);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <>
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

      {/* Nome */}
      <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
        <TextField
          fullWidth
          label="Nome"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
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
            },
          }}
        />
      </Box>

      {/* CPF */}
      <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
        <TextField
          fullWidth
          label="CPF"
          value={cpf}
          onChange={(e) => {
            const formatted = formatCPF(e.target.value);
            if (formatted.replace(/\D/g, '').length <= 11) {
              onCpfChange(formatted);
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
            },
          }}
        />
      </Box>

      {/* Data de Nascimento */}
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
              if (!isNaN(date.getTime())) {
                onBirthDateChange(date);
              }
            } else {
              onBirthDateChange(null);
            }
          }}
          inputProps={{
            min: "1900-01-01",
            max: getMaxDate(),
          }}
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
              "& input::-webkit-calendar-picker-indicator": {
                filter: "invert(1)",
                cursor: "pointer",
                opacity: 0.7,
              },
            },
          }}
        />
      </Box>

      {/* Email */}
      <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
        <TextField
          fullWidth
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
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
            },
          }}
        />
      </Box>

      {/* Senha */}
      <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
        <TextField
          fullWidth
          label="Senha"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => {
            onPasswordChange(e.target.value);
            const validation = validatePassword(e.target.value);
            // Note: passwordErrors state should be managed in parent
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
                  onClick={onToggleShowPassword}
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
            },
          }}
        />
      </Box>

      {/* Confirmar Senha */}
      <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
        <TextField
          fullWidth
          label="Confirmar senha"
          type="password"
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
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
            },
          }}
        />
      </Box>

      {/* Sexo */}
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
            onChange={(e) => onGenderChange(e.target.value as typeof gender)}
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

      {/* LGPD Checkbox */}
      <Box className={shouldAnimate ? "slide-up-delay-3" : ""}>
        <FormControlLabel
          control={
            <Checkbox
              checked={lgpdAccepted}
              onChange={(e) => onLgpdAcceptedChange(e.target.checked)}
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
           Declaro que li e concordo com o tratamento dos meus dados pessoais para fins de cadastro no aplicativo.
            </Typography>
          }
          sx={{ mt: 3 }}
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
          <Button
            onClick={() => setShowLgpdDataProtectionModal(true)}
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
            Ler mais
          </Button>
        </Box>
      </Box>

   

      {/* Marketing Email Checkbox */}
      <Box className={shouldAnimate ? "slide-up-delay-3" : ""}>
        <FormControlLabel
          control={
            <Checkbox
              checked={marketingEmailAccepted}
              onChange={(e) => onMarketingEmailAcceptedChange(e.target.checked)}
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
          Autorizo o envio de promoções, ofertas e conteúdo de marketing.
            </Typography>
          }
          sx={{ mt: 1 }}
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
          <Button
            onClick={() => setShowMarketingConsentModal(true)}
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
            Ler mais
          </Button>
        </Box>
      </Box>
   {/* Age Terms Checkbox */}
   <Box className={shouldAnimate ? "slide-up-delay-3" : ""}>
        <FormControlLabel
          control={
            <Checkbox
              checked={ageTermsAccepted}
              onChange={(e) => onAgeTermsAcceptedChange(e.target.checked)}
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
      {/* Ler termos completos - após todos os checkboxes */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <Button
          onClick={onShowLgpdModal}
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

      {/* Modals */}
      <LgpdDataProtectionModal
        open={showLgpdDataProtectionModal}
        onClose={() => setShowLgpdDataProtectionModal(false)}
      />
      <MarketingConsentModal
        open={showMarketingConsentModal}
        onClose={() => setShowMarketingConsentModal(false)}
      />
    </>
  );
};

export default RegisterFormFields;

