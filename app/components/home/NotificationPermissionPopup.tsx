"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";

interface NotificationPermissionPopupProps {
  open: boolean;
  onClose: () => void;
  onAllow: () => Promise<void>;
  loading: boolean;
}

const NotificationPermissionPopup: React.FC<NotificationPermissionPopupProps> = ({
  open,
  onClose,
  onAllow,
  loading,
}) => {
  const handleAllow = async () => {
    await onAllow();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#fff",
        },
      }}
    >
      <DialogTitle component="div" sx={{ textAlign: "center", pt: 3, pb: 0 }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
          <NotificationsActiveIcon sx={{ fontSize: 48, color: "#ffcc01" }} />
        </Box>
        <Typography variant="h6" component="span" sx={{ fontWeight: 600, color: "#fff" }}>
          Ative as notificações push
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body1"
          sx={{
            color: "rgba(255, 255, 255, 0.9)",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          Receba avisos sobre interações nas suas publicações e atualizações dos
          eventos diretamente no navegador. É possível desativar a qualquer
          momento nas preferências de notificações.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ padding: "16px 24px", flexDirection: "column", gap: 1 }}>
        <Button
          onClick={handleAllow}
          disabled={loading}
          variant="contained"
          fullWidth
          sx={{
            backgroundColor: "rgb(255, 31, 33)",
            color: "#fff",
            fontWeight: 600,
            borderRadius: "14px",
            textTransform: "none",
            py: 1.25,
            "&:hover": {
              backgroundColor: "rgb(220, 20, 22)",
            },
            "&:disabled": {
              backgroundColor: "rgba(255, 204, 1, 0.5)",
              color: "rgba(0,0,0,0.5)",
            },
          }}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: "#fff" }} />
          ) : (
            "Ativar notificações"
          )}
        </Button>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="text"
          fullWidth
          sx={{
            color: "rgba(255, 255, 255, 0.7)",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.05)",
            },
          }}
        >
          Agora não
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationPermissionPopup;

