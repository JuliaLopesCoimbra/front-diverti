"use client";

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";
import { Block, CheckCircle } from "@mui/icons-material";

interface ConfirmAction {
  type: "revoke" | "reactivate";
  userType: "subadmin" | "colunista" | "user";
  userId: number;
  userName: string;
}

interface ConfirmModalProps {
  open: boolean;
  action: ConfirmAction | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({ open, action, loading, onClose, onConfirm }: ConfirmModalProps) {
  if (!action) return null;

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
          {action.type === "revoke" ? (
            <Block sx={{ fontSize: 28, color: "#ff4444" }} />
          ) : (
            <CheckCircle sx={{ fontSize: 28, color: "#4caf50" }} />
          )}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {action.type === "revoke" ? "Desativar Acesso" : "Reativar Acesso"}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
              {action.type === "revoke"
                ? "Esta ação pode ser revertida posteriormente"
                : "O usuário poderá acessar o sistema novamente"}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", mx: 3 }} />
      <DialogContent sx={{ pt: 3 }}>
        <DialogContentText sx={{ color: "rgba(255,255,255,0.9)", fontSize: "1rem", lineHeight: 1.6 }}>
          {action.type === "revoke" ? (
            <>
              Tem certeza que deseja <strong style={{ color: "#ff4444" }}>desativar</strong> o acesso de{" "}
              <strong style={{ color: "#ffcc01" }}>{action.userName}</strong>?
              <br />
              <br />
              <Box
                component="span"
                sx={{
                  display: "block",
                  p: 2,
                  mt: 2,
                  backgroundColor: "rgba(255, 68, 68, 0.1)",
                  borderRadius: 2,
                  border: "1px solid rgba(255, 68, 68, 0.2)",
                }}
              >
                O usuário não poderá mais fazer login no sistema e todos os tokens serão invalidados.
              </Box>
            </>
          ) : (
            <>
              Tem certeza que deseja <strong style={{ color: "#4caf50" }}>reativar</strong> o acesso de{" "}
              <strong style={{ color: "#ffcc01" }}>{action.userName}</strong>?
              <br />
              <br />
              <Box
                component="span"
                sx={{
                  display: "block",
                  p: 2,
                  mt: 2,
                  backgroundColor: "rgba(76, 175, 80, 0.1)",
                  borderRadius: 2,
                  border: "1px solid rgba(76, 175, 80, 0.2)",
                }}
              >
                O usuário poderá fazer login novamente no sistema.
              </Box>
            </>
          )}
        </DialogContentText>
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
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          startIcon={
            loading ? (
              <CircularProgress size={16} sx={{ color: "#fff" }} />
            ) : action.type === "revoke" ? (
              <Block />
            ) : (
              <CheckCircle />
            )
          }
          sx={{
            backgroundColor: action.type === "revoke" ? "#ff4444" : "#4caf50",
            color: "white",
            fontWeight: 600,
            textTransform: "none",
            px: 3,
            "&:hover": {
              backgroundColor: action.type === "revoke" ? "#cc0000" : "#45a049",
              transform: "translateY(-2px)",
              boxShadow: `0 4px 12px ${action.type === "revoke" ? "rgba(255, 68, 68, 0.4)" : "rgba(76, 175, 80, 0.4)"}`,
            },
            transition: "all 0.2s ease",
          }}
        >
          {loading ? "Processando..." : action.type === "revoke" ? "Desativar" : "Reativar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}








