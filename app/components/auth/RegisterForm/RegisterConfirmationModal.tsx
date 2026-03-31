import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { formatCPF } from "@/app/utils/registerValidators";

interface RegisterConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  email: string;
  cpf: string;
  loading: boolean;
}

const RegisterConfirmationModal: React.FC<RegisterConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  email,
  cpf,
  loading,
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
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#fff",
        },
      }}
    >
      <DialogTitle sx={{ color: "rgb(255, 120, 122)", fontWeight: 600, fontSize: "1.25rem", pb: 1 }}>
        Confirmação
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 1 }}>
          Tem certeza que esse é seu email?<br />
          
        </Typography>
        
        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.5)", mb: 1, fontSize: "0.8rem" }}>
          Email
        </Typography>
        <Typography variant="body1" sx={{ color: "#fff", mb: 2, wordBreak: "break-word" }}>
          {email}
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 1 }}>
       
          Tem certeza que esse é seu CPF?
        </Typography>
        
        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.5)", mb: 1, fontSize: "0.8rem" }}>
          CPF
        </Typography>
        <Typography variant="body1" sx={{ color: "#fff", mb: 3 }}>
          {formatCPF(cpf)}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "rgb(255, 120, 122)",
            fontSize: "0.85rem",
            textAlign: "center",
          }}
        >
          Após o cadastro, você receberá um email de confirmação na sua caixa de entrada
        </Typography>
      </DialogContent>
      <DialogActions sx={{ padding: "16px 24px", gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            color: "rgba(255, 255, 255, 0.7)",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          Editar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          sx={{
            backgroundColor: "rgb(255, 31, 33)",
            color: "#fff",
            fontWeight: 600,
            textTransform: "none",
            "&:hover": {
              backgroundColor: "rgb(220, 20, 22)",
            },
            "&:disabled": {
              backgroundColor: "rgba(255, 31, 33, 0.45)",
              color: "rgba(255, 255, 255, 0.7)",
            },
          }}
        >
          {loading ? "Cadastrando..." : "Cadastrar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegisterConfirmationModal;


