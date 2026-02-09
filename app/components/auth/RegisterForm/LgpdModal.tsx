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
              background: "rgba(255, 204, 1, 0.5)",
              borderRadius: "4px",
              "&:hover": {
                background: "rgba(255, 204, 1, 0.7)",
              },
            },
          }}
        >
          <Typography variant="body1" paragraph sx={{ fontWeight: 500, mb: 2 }}>
            A HOLDING CLUBE, Inscrita no CNPJ: 07.900.154/0001-89 com endereço profissional a Rua Purpurina, 400 – Vila Madalena - Centro, CEP 05433-000, cidade de SÃO PAULO, estado de SÃO PAULO doravante denominado(a) CONTROLADORA.
          </Typography>

          <Typography variant="body1" paragraph sx={{ mb: 2 }}>
            Este termo de consentimento foi elaborado em conformidade com a lei geral de proteção de dados. Consoante ao artigo 5º inciso XII da Lei 13.709, este documento viabiliza a manifestação livre, informada e inequívoca, pela qual o titular/ responsável concorda com o tratamento de seus dados pessoais e os dados do menor sob os seus cuidados, para as finalidades a seguir determinadas:
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1, color: "#ffcc01" }}>
            PARÁGRAFO PRIMEIRO - DO CONSENTIMENTO
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 2 }}>
            Ao assinar este termo o TITULAR concorda que a CONTROLADORA, proceda com o tratamento de seus dados.
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 2 }}>
            Entende-se por tratamento de acordo com o artigo 5º inciso X, a coleta, produção, recepção, classificação, utilização, acesso, reprodução, transmissão, distribuição, processamento, arquivamento, armazenamento, eliminação, avaliação ou controle da informação, modificação, comunicação, transferência, difusão ou extração.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1, color: "#ffcc01" }}>
            PARÁGRAFO SEGUNDO - DADOS PESSOAIS
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 2 }}>
            Poderão ser tratados mediante anuência expressa do titular/ responsável os seguintes dados pessoais, pelo(a) controlador(a):
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <Typography component="li" variant="body1" paragraph>
              Nome, Sexo, CPF, e-mail, Data de Nascimento.
            </Typography>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1, color: "#ffcc01" }}>
            PARÁGRAFO TERCEIRO - FINALIDADE DO TRATAMENTO
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 2 }}>
            Em atendimento ao artigo 8º §4 este termo guarda finalidade determinada, sendo que os dados serão utilizados especificamente para fins de:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <Typography component="li" variant="body1" paragraph>
              Cadastro.
            </Typography>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1, color: "#ffcc01" }}>
            PARÁGRAFO QUARTO - SEGURANÇA DOS DADOS
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 2 }}>
            A Controladora responsabiliza-se pela manutenção de medidas de segurança, técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou qualquer forma de tratamento inadequado ou ilícito.
          </Typography>

          <Typography variant="body1" paragraph sx={{ mt: 4, mb: 1 }}>
            Local, data.
          </Typography>

          <Box sx={{ mt: 4, mb: 2 }}>
            <Typography variant="body1" paragraph sx={{ mb: 3 }}>
              _________________________________
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
              CONTROLADORA
            </Typography>
          </Box>

          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="body1" paragraph sx={{ mb: 3 }}>
              _________________________________
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
              TITULAR
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: "16px 24px" }}>
        <Button
          onClick={onClose}
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
          }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LgpdModal;

