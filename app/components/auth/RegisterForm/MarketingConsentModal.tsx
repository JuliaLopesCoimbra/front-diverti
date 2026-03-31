import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from "@mui/material";

interface MarketingConsentModalProps {
  open: boolean;
  onClose: () => void;
}

const MarketingConsentModal: React.FC<MarketingConsentModalProps> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#fff",
          maxHeight: "90vh",
        },
      }}
    >
 
      <DialogContent>
        <Box
          sx={{
            color: "rgba(255, 255, 255, 0.9)",
            lineHeight: 1.8,
            fontSize: "0.9rem",
            maxHeight: "60vh",
            overflowY: "auto",
            padding: "8px",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(255, 31, 33, 0.5)",
              borderRadius: "4px",
              "&:hover": {
                background: "rgba(255, 31, 33, 0.7)",
              },
            },
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "rgb(255, 120, 122)" }}>
            2. Aceite para Envio de Comunicações, Promoções e Conteúdos de Marketing
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 2 }}>
            Ao marcar esta opção, você autoriza o envio de comunicações relacionadas a campanhas promocionais, ofertas, novidades e conteúdos informativos por e-mail, SMS, notificações push ou outros meios eletrônicos.
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 2 }}>
            A autorização poderá ser revogada a qualquer momento por meio das configurações do aplicativo ou pelo canal indicado nas comunicações recebidas.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: "16px 24px" }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: "rgb(255, 31, 33)",
            color: "#fff",
            fontWeight: 600,
            borderRadius: "14px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "rgb(220, 20, 22)",
            },
          }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MarketingConsentModal;


