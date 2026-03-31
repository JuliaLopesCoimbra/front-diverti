"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { inviteAdmin, resendAdminInvite } from "@/app/services/auth/authAdminService";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

export default function InviteAdminPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [lastInvitedEmail, setLastInvitedEmail] = useState<string | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(cooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleInvite = async () => {
    if (!name.trim() || !email.trim()) {
      showToast("Preencha todos os campos", "error");
      return;
    }

    setLoading(true);

    try {
      await inviteAdmin({ name: name.trim(), email: email.trim() });
      showToast("Convite enviado com sucesso!", "success");
      setLastInvitedEmail(email.trim());
      setCooldown(60); // 1 minuto de cooldown
      setName("");
      setEmail("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Erro ao enviar convite", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!lastInvitedEmail) {
      showToast("Nenhum email foi convidado ainda", "error");
      return;
    }

    if (cooldown > 0) {
      showToast(`Aguarde ${cooldown} segundos para reenviar`, "warning");
      return;
    }

    setLoading(true);

    try {
      await resendAdminInvite({ email: lastInvitedEmail });
      showToast("Convite reenviado com sucesso!", "success");
      setCooldown(60); // 1 minuto de cooldown
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Erro ao reenviar convite", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        ...dashboardBackgroundSx,
        height: "100vh",
        padding: "20px",
        position: "relative",
      }}
    >
      <Button
        onClick={() => router.back()}
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          minWidth: "auto",
          padding: "6px",
          color: "#fff",
          borderRadius: "50%",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.1)",
          },
        }}
      >
        <ArrowBackIcon />
      </Button>

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
          Convidar Administrador
        </Typography>
        <Typography variant="body2" sx={{ marginBottom: "20px" }}>
          Preencha os dados abaixo para convidar um novo administrador.
        </Typography>

        <TextField
          fullWidth
          label="Nome"
          variant="outlined"
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          InputLabelProps={{
            shrink: true,
            sx: {
              color: "#fff",
              fontSize: 13,
              transform: "translate(14px, -9px) scale(1)",
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
          label="E-mail"
          type="email"
          variant="outlined"
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          InputLabelProps={{
            shrink: true,
            sx: {
              color: "#fff",
              fontSize: 13,
              transform: "translate(14px, -9px) scale(1)",
              "&.Mui-focused": {
                color: "#fff",
              },
            },
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
          onClick={handleInvite}
          disabled={loading || cooldown > 0}
          sx={{
            mt: 2,
            backgroundColor: "rgb(255, 31, 33)",
            color: "#fff",
            fontWeight: 600,
            borderRadius: "14px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "rgb(220, 20, 22)",
            },
            "&.Mui-disabled": {
              backgroundColor: "rgba(255, 204, 1, 0.4)",
              color: "rgba(0,0,0,0.6)",
            },
          }}
        >
          {loading ? "Enviando..." : cooldown > 0 ? `Aguarde ${cooldown}s` : "Enviar convite"}
        </Button>

        {lastInvitedEmail && cooldown > 0 && (
          <Alert 
            severity="info" 
            sx={{ 
              mt: 2,
              backgroundColor: "rgba(33, 150, 243, 0.1)",
              color: "#fff",
              "& .MuiAlert-icon": {
                color: "#2196f3",
              },
            }}
          >
            Convite enviado para {lastInvitedEmail}. Aguarde {cooldown} segundos para reenviar.
          </Alert>
        )}

        {lastInvitedEmail && cooldown === 0 && (
          <Button
            fullWidth
            variant="outlined"
            onClick={handleResend}
            disabled={loading}
            sx={{
              mt: 2,
              color: "#fff",
              borderColor: "#fff",
              borderRadius: "14px",
              textTransform: "none",
              "&:hover": {
                borderColor: "#fff",
                backgroundColor: "rgba(255,255,255,0.08)",
              },
            }}
          >
            Reenviar convite para {lastInvitedEmail}
          </Button>
        )}
      </Box>
    </Box>
  );
}


