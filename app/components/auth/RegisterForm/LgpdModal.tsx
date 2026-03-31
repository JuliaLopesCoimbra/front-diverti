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

interface LgpdModalProps {
  open: boolean;
  onClose: () => void;
}

const LgpdModal: React.FC<LgpdModalProps> = ({ open, onClose }) => {
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
      <DialogTitle sx={{ color: "#fff", fontWeight: 600, fontSize: "1.5rem", textAlign: "center" }}>
        TERMO DE CONSENTIMENTO PARA TRATAMENTO DE DADOS PESSOAIS
      </DialogTitle>
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
          <Typography variant="body1" paragraph sx={{ fontWeight: 500, mb: 2 }}>
            A HOLDING CLUBE, Inscrita no CNPJ: 07.900.154/0001-89 com endereço profissional a Rua Purpurina, 400 – Vila Madalena - Centro, CEP 05433-000, cidade de SÃO PAULO, estado de SÃO PAULO doravante denominado(a) CONTROLADORA.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "rgb(255, 120, 122)" }}>
            1. Aceite para Tratamento de Dados Pessoais
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 2 }}>
            Ao realizar o cadastro no aplicativo, você declara que leu e concorda com o tratamento dos seus dados pessoais fornecidos, incluindo: nome, sexo, CPF, e-mail, data de nascimento e Reconhecimento Facial para a finalidade específica de realização de cadastro e gestão da sua conta, conforme a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD).
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 2 }}>
            O tratamento poderá envolver coleta, armazenamento, utilização, acesso e demais operações necessárias à execução das funcionalidades do aplicativo, sendo adotadas medidas técnicas e administrativas adequadas para garantir a segurança e proteção das informações.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, mt: 4, mb: 2, color: "rgb(255, 120, 122)" }}>
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

export default LgpdModal;


