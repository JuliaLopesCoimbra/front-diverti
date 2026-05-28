"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (shouldNotify: boolean) => Promise<void>;
  loading?: boolean;
}

export default function NotifyLineupModal({
  open,
  onClose,
  onConfirm,
  loading = false,
}: Props) {
  const [shouldNotify, setShouldNotify] = useState(false);

  const handleConfirm = async () => {
    await onConfirm(shouldNotify);
    setShouldNotify(false); // Reset para próxima vez
  };

  const handleClose = () => {
    if (!loading) {
      setShouldNotify(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {},
        root: {
          sx: {
            zIndex: 1600,
          },
        },
      }}
      PaperProps={{
        sx: {
          backgroundColor: "#1a1a1a",
          color: "#fff",
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          pb: 2,
          fontWeight: 600,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: "rgba(255, 31, 33, 0.1)",
          }}
        >
          <NotificationsIcon sx={{ color: "primary.main", fontSize: 28 }} />
        </Box>
      Modificação de Line Up
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Typography
          variant="body1"
          sx={{ color: "rgba(255,255,255,0.9)", mb: 2, fontWeight: 600 }}
        >
          Tem certeza que deseja fazer a modificação no line up?
        </Typography>
        <Box
          sx={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 1,
            p: 2,
            borderLeft: "3px solid #ffffff",
            mb: 2,
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={shouldNotify}
                onChange={(e) => setShouldNotify(e.target.checked)}
                sx={{
                  color: "primary.main",
                  "&.Mui-checked": {
                    color: "primary.main",
                  },
                }}
              />
            }
            label={
              <Typography
                variant="body2"
                sx={{ 
                  color: "rgba(255,255,255,0.9)",
                  wordBreak: "break-word",
                  whiteSpace: "normal",
                }}
              >
                Sim, notificar todos os usuários sobre a atualização do lineup
              </Typography>
            }
            sx={{
              alignItems: "flex-start",
              "& .MuiFormControlLabel-label": {
                marginTop: "4px",
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: "rgba(255,255,255,0.6)", display: "block", mt: 1 }}
          >
            Todos os usuários que têm notificações de lineup habilitadas receberão uma notificação.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          p: 2,
          gap: 1,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          sx={{
            color: "primary.main",
            borderColor: "rgba(255, 31, 33, 0.5)",
            "&:hover": {
              borderColor: "primary.main",
              backgroundColor: "rgba(255, 31, 33, 0.08)",
            },
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          sx={{
            backgroundColor: "primary.main",
            color: "#fff",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: "primary.dark",
            },
            "&:disabled": {
              backgroundColor: "rgba(255, 31, 33, 0.35)",
              color: "rgba(255,255,255,0.6)",
            },
          }}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: "#fff" }} />
          ) : (
            "Confirmar"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


