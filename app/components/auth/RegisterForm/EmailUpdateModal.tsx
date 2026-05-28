import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from "@mui/material";

interface EmailUpdateModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
  onEmailChange: (email: string) => void;
  onUpdate: () => void;
  updating: boolean;
}

const EmailUpdateModal: React.FC<EmailUpdateModalProps> = ({
  open,
  onClose,
  email,
  onEmailChange,
  onUpdate,
  updating,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
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
      <DialogTitle sx={{ color: "rgb(255, 120, 122)", fontWeight: 600, fontSize: "1.5rem" }}>
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
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={updating}
          sx={{
            mt: 2,
            "& .MuiOutlinedInput-root": {
              color: "#fff",
              "& fieldset": {
                borderColor: "rgba(255, 255, 255, 0.3)",
              },
              "&:hover fieldset": {
                borderColor: "rgba(255, 31, 33, 0.6)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#ffffff",
              },
            },
            "& .MuiInputLabel-root": {
              color: "rgba(255, 120, 122, 0.95)",
              "&.Mui-focused": {
                color: "#ffffff",
              },
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ padding: "16px 24px", gap: 2 }}>
        <Button
          onClick={onClose}
          disabled={updating}
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
          onClick={onUpdate}
          disabled={updating || !email}
          variant="contained"
          sx={{
            backgroundColor: "#ffffff",
            color: "#111111",
            fontWeight: 600,
            borderRadius: "14px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#e8e8e8",
            },
            "&:disabled": {
              backgroundColor: "rgba(255, 31, 33, 0.45)",
              color: "rgba(255, 255, 255, 0.7)",
            },
          }}
        >
          {updating ? "Atualizando..." : "Atualizar e Enviar Código"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailUpdateModal;


