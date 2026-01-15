"use client";

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Divider,
  Stack,
  CircularProgress,
} from "@mui/material";
import { PersonAdd } from "@mui/icons-material";

interface InviteModalProps {
  open: boolean;
  inviteType: "subadmin" | "colunista";
  inviteName: string;
  inviteEmail: string;
  loading: boolean;
  onClose: () => void;
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onInvite: () => void;
}

export default function InviteModal({
  open,
  inviteType,
  inviteName,
  inviteEmail,
  loading,
  onClose,
  onNameChange,
  onEmailChange,
  onInvite,
}: InviteModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: "rgba(26, 26, 26, 0.95)",
          backdropFilter: "blur(20px)",
          color: "white",
          borderRadius: 3,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          minWidth: { xs: "90%", sm: "500px" },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <PersonAdd sx={{ fontSize: 28, color: "#ffcc01" }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Convidar {inviteType === "subadmin" ? "Subadmin" : "Colunista"}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
              Envie um convite por e-mail para adicionar um novo {inviteType === "subadmin" ? "subadmin" : "colunista"}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", mx: 3 }} />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <TextField
            autoFocus
            label="Nome completo"
            fullWidth
            variant="outlined"
            value={inviteName}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={loading}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "white",
                "& fieldset": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255, 204, 1, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#ffcc01",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255,255,255,0.7)",
                "&.Mui-focused": {
                  color: "#ffcc01",
                },
              },
            }}
          />
          <TextField
            label="E-mail"
            type="email"
            fullWidth
            variant="outlined"
            value={inviteEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={loading}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "white",
                "& fieldset": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255, 204, 1, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#ffcc01",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255,255,255,0.7)",
                "&.Mui-focused": {
                  color: "#ffcc01",
                },
              },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            color: "rgba(255,255,255,0.7)",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.1)",
            },
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={onInvite}
          disabled={loading}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} sx={{ color: "#000" }} /> : <PersonAdd />}
          sx={{
            backgroundColor: "#ffcc01",
            color: "#000",
            fontWeight: 600,
            textTransform: "none",
            px: 3,
            "&:hover": {
              backgroundColor: "#e6b800",
            },
            "&:disabled": {
              backgroundColor: "rgba(255, 204, 1, 0.5)",
            },
          }}
        >
          {loading ? "Enviando..." : "Enviar Convite"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}



