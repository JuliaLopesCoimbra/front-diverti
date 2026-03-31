"use client";
import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import { broadcastNotification } from "@/app/services/notifications/notificationService";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CampaignIcon from "@mui/icons-material/Campaign";
import SendIcon from "@mui/icons-material/Send";
import PreviewIcon from "@mui/icons-material/Preview";
import CloseIcon from "@mui/icons-material/Close";

export default function BroadcastNotificationPage() {
  const { isAdminMaster, isSubadmin, authReady } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Hooks devem ser chamados antes de qualquer return condicional
  useEffect(() => {
    if (!isAdminMaster && !isSubadmin) {
      router.push("/pages/user/home");
      return;
    }
  }, [isAdminMaster, isSubadmin, router]);

  // Aguardar o contexto estar pronto antes de renderizar
  if (!authReady) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          ...dashboardBackgroundSx,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#ffcc01" }} />
      </Box>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      showToast("Preencha todos os campos", "error");
      return;
    }

    setConfirmModalOpen(true);
  };

  const handleConfirmSend = async () => {
    setLoading(true);
    try {
      const response = await broadcastNotification({
        title: title.trim(),
        message: message.trim(),
      });
      showToast(response.message, "success");
      setTitle("");
      setMessage("");
      setConfirmModalOpen(false);
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || "Erro ao enviar notificação",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        ...dashboardBackgroundSx,
        py: { xs: 2, md: 4 },
        px: { xs: 2, md: 0 },
      }}
    >
      <Container maxWidth="md">
        <Paper
          sx={{
            p: { xs: 3, md: 5 },
            backgroundColor: "rgba(26, 26, 26, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 4,
            }}
          >
            <IconButton
              onClick={() => router.back()}
              sx={{
                color: "#fff",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "rgba(255, 201, 31, 0.15)",
                mr: 1,
              }}
            >
              <CampaignIcon sx={{ color: "#ffc91f", fontSize: 32 }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: { xs: "1.5rem", md: "2rem" },
                }}
              >
                Enviar Notificação
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255,255,255,0.6)",
                  mt: 0.5,
                }}
              >
                Notifique todos os usuários ativos do sistema
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              backgroundColor: "rgba(255, 201, 31, 0.1)",
              border: "1px solid rgba(255, 201, 31, 0.3)",
              borderRadius: 2,
              p: 2,
              mb: 4,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <CampaignIcon sx={{ color: "#ffc91f", fontSize: 20 }} />
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "0.875rem",
              }}
            >
              Esta notificação será enviada para <strong>todos os usuários ativos</strong> do sistema. 
              Certifique-se de que o conteúdo está correto antes de enviar.
            </Typography>
          </Box>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "rgba(255,255,255,0.9)",
                    mb: 1,
                    fontWeight: 600,
                  }}
                >
                  Título da Notificação
                </Typography>
                <TextField
                  placeholder="Ex: Manutenção programada"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                  required
                  disabled={loading}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#fff",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      "& fieldset": {
                        borderColor: "rgba(255,255,255,0.2)",
                        borderWidth: 2,
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(255,255,255,0.4)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#ffc91f",
                        borderWidth: 2,
                      },
                    },
                    "& .MuiInputBase-input::placeholder": {
                      color: "rgba(255,255,255,0.4)",
                      opacity: 1,
                    },
                  }}
                  inputProps={{
                    maxLength: 255,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255,255,255,0.5)",
                    mt: 0.5,
                    display: "block",
                  }}
                >
                  {title.length}/255 caracteres
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "rgba(255,255,255,0.9)",
                    mb: 1,
                    fontWeight: 600,
                  }}
                >
                  Mensagem
                </Typography>
                <TextField
                  placeholder="Digite a mensagem que será enviada para todos os usuários..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  fullWidth
                  required
                  multiline
                  rows={8}
                  disabled={loading}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#fff",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      "& fieldset": {
                        borderColor: "rgba(255,255,255,0.2)",
                        borderWidth: 2,
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(255,255,255,0.4)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#ffc91f",
                        borderWidth: 2,
                      },
                    },
                    "& .MuiInputBase-input::placeholder": {
                      color: "rgba(255,255,255,0.4)",
                      opacity: 1,
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255,255,255,0.5)",
                    mt: 0.5,
                    display: "block",
                  }}
                >
                  {message.length} caracteres
                </Typography>
              </Box>

              {/* Preview Card */}
              {title.trim() || message.trim() ? (
                <Card
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 2,
                    mt: 1,
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <PreviewIcon sx={{ color: "#ffc91f", fontSize: 20 }} />
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: "rgba(255,255,255,0.9)",
                          fontWeight: 600,
                        }}
                      >
                        Preview da Notificação
                      </Typography>
                    </Box>
                    {title.trim() && (
                      <Typography
                        variant="h6"
                        sx={{
                          color: "#fff",
                          fontWeight: 700,
                          mb: 1.5,
                        }}
                      >
                        {title}
                      </Typography>
                    )}
                    {message.trim() && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(255,255,255,0.8)",
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.6,
                        }}
                      >
                        {message}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-end",
                  mt: 3,
                  pt: 3,
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  disabled={loading}
                  sx={{
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.3)",
                    px: 3,
                    "&:hover": {
                      borderColor: "rgba(255,255,255,0.5)",
                      backgroundColor: "rgba(255,255,255,0.05)",
                    },
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !title.trim() || !message.trim()}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} sx={{ color: "#fff" }} />
                    ) : (
                      <SendIcon />
                    )
                  }
                  sx={{
                    backgroundColor: "rgb(255, 31, 33)",
                    color: "#fff",
                    fontWeight: 600,
                    px: 4,
                    "&:hover": {
                      backgroundColor: "rgb(220, 20, 22)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(255, 201, 31, 0.4)",
                    },
                    "&:disabled": {
                      backgroundColor: "rgba(255,201,31,0.3)",
                      color: "rgba(255,255,255,0.5)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  {loading ? "Enviando..." : "Enviar Notificação"}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>
      </Container>

      {/* Confirmation Modal */}
      <Dialog
        open={confirmModalOpen}
        onClose={loading ? undefined : () => setConfirmModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "rgba(26, 26, 26, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: 3,
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: "rgba(255, 201, 31, 0.15)",
              }}
            >
              <CampaignIcon sx={{ color: "#ffc91f", fontSize: 28 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#fff" }}>
                Confirmar Envio
              </Typography>
              <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Esta ação enviará a notificação para todos os usuários
                </Typography>
            </Box>
            <IconButton
              onClick={() => setConfirmModalOpen(false)}
              disabled={loading}
              sx={{
                color: "rgba(255,255,255,0.7)",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", mx: 3 }} />
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText
            sx={{
              color: "rgba(255,255,255,0.9)",
              mb: 3,
            }}
          >
            Você está prestes a enviar uma notificação para <strong>todos os usuários ativos</strong> do sistema.
            Deseja continuar?
          </DialogContentText>

          <Card
            sx={{
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 2,
              p: 2,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "rgba(255,255,255,0.7)",
                mb: 1,
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Título
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "#fff",
                fontWeight: 700,
                mb: 2,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{
                color: "rgba(255,255,255,0.7)",
                mb: 1,
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Mensagem
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.9)",
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
              }}
            >
              {message}
            </Typography>
          </Card>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setConfirmModalOpen(false)}
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
            onClick={handleConfirmSend}
            disabled={loading}
            variant="contained"
            startIcon={
              loading ? (
                <CircularProgress size={16} sx={{ color: "#fff" }} />
              ) : (
                <SendIcon />
              )
            }
            sx={{
              backgroundColor: "rgb(255, 31, 33)",
              color: "#fff",
              fontWeight: 600,
              textTransform: "none",
              px: 3,
              "&:hover": {
                backgroundColor: "rgb(220, 20, 22)",
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(255, 201, 31, 0.4)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {loading ? "Enviando..." : "Confirmar e Enviar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


