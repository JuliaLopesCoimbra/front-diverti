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
            backgroundColor: "rgba(255, 201, 31, 0.1)",
          }}
        >
          <NotificationsIcon sx={{ color: "#ffc91f", fontSize: 28 }} />
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
            borderLeft: "3px solid #ffc91f",
            mb: 2,
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={shouldNotify}
                onChange={(e) => setShouldNotify(e.target.checked)}
                sx={{
                  color: "#ffc91f",
                  "&.Mui-checked": {
                    color: "#ffc91f",
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
          sx={{
            color: "rgba(255,255,255,0.7)",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.05)",
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
            backgroundColor: "#ffc91f",
            color: "#000",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: "#e6b800",
            },
            "&:disabled": {
              backgroundColor: "rgba(255, 201, 31, 0.3)",
              color: "rgba(0,0,0,0.3)",
            },
          }}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: "#000" }} />
          ) : (
            "Confirmar"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

