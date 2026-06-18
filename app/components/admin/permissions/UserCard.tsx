"use client";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Stack,
  Divider,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Block,
  CheckCircle,
  Email,
  Person,
  CalendarToday,
  AdminPanelSettings,
  EditNote,
  People,
  Warning,
  Info,
} from "@mui/icons-material";
import { UserResponse } from "@/app/services/auth/authAdminService";
import { formatDate } from "./utils";

interface UserCardProps {
  user: UserResponse;
  userType: "admin" | "patrocinador" | "user";
  onRevoke: (userType: "admin" | "patrocinador" | "user", userId: number, userName: string) => void;
  onReactivate: (userType: "admin" | "patrocinador" | "user", userId: number, userName: string) => void;
}

export default function UserCard({ user, userType, onRevoke, onReactivate }: UserCardProps) {
  const isActive = user.status === "active";
  const isEmailVerified = user.is_email_verified;

  // Determinar status e cor do chip
  let statusLabel = "Inativo";
  let statusColor: "success" | "error" | "warning" = "error";

  if (isActive) {
    if (isEmailVerified) {
      statusLabel = "Ativo";
      statusColor = "success";
    } else {
      statusLabel = "Aguardando confirmação de email";
      statusColor = "warning";
    }
  }

  // Ícone baseado no tipo de usuário
  const getRoleIcon = () => {
    switch (userType) {
      case "admin":
        return <AdminPanelSettings sx={{ fontSize: 20, color: "#7c3aed" }} />;
      case "patrocinador":
        return <EditNote sx={{ fontSize: 20, color: "#7c3aed" }} />;
      default:
        return <People sx={{ fontSize: 20, color: "#7c3aed" }} />;
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        borderRadius: 3,
        transition: "all 0.3s ease",
        "&:hover": {
          backgroundColor: "rgba(255, 255, 255, 0.12)",
          borderColor: "rgba(124, 58, 237, 0.4)",
          transform: "translateY(-2px)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Header com nome e status */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
              {getRoleIcon()}
              <Typography
                variant="h6"
                sx={{
                  color: "white",
                  fontWeight: 600,
                  flex: 1,
                  minWidth: 0,
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {user.name || "Sem nome"}
              </Typography>
              <Chip
                label={statusLabel}
                color={statusColor}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  flexShrink: 0,
                }}
              />
            </Box>

            <Divider sx={{ mb: 2, borderColor: "rgba(255, 255, 255, 0.1)" }} />

            {/* Informações do usuário */}
            <Stack spacing={1.5}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Email sx={{ fontSize: 18, color: "#7c3aed", opacity: 0.9 }} />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
                  {user.email}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <CalendarToday sx={{ fontSize: 18, color: "#7c3aed", opacity: 0.9 }} />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
                  Entrou em {formatDate(user.created_at)}
                </Typography>
              </Box>

              {userType === "patrocinador" && user.invited_by && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: "rgba(124, 58, 237, 0.1)",
                    border: "1px solid rgba(124, 58, 237, 0.2)",
                  }}
                >
                  <Person sx={{ fontSize: 18, color: "#7c3aed" }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", display: "block" }}>
                      Convidado por
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#7c3aed", fontWeight: 600 }}>
                      {user.invited_by.name || user.invited_by.email}
                    </Typography>
                  </Box>
                </Box>
              )}

              {user.deactivated_at && (
                <Alert
                  severity="warning"
                  icon={<Warning />}
                  sx={{
                    mt: 1,
                    backgroundColor: "rgba(255, 152, 0, 0.15)",
                    border: "1px solid rgba(255, 152, 0, 0.3)",
                    "& .MuiAlert-icon": {
                      color: "#ff9800",
                    },
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: "white" }}>
                      Desativado em {formatDate(user.deactivated_at)}
                    </Typography>
                    {user.deactivated_by && (
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                        Por: {user.deactivated_by.name || user.deactivated_by.email}
                      </Typography>
                    )}
                  </Box>
                </Alert>
              )}

              {user.reactivated_at && (
                <Alert
                  severity="info"
                  icon={<Info />}
                  sx={{
                    mt: 1,
                    backgroundColor: "rgba(33, 150, 243, 0.15)",
                    border: "1px solid rgba(33, 150, 243, 0.3)",
                    "& .MuiAlert-icon": {
                      color: "#2196f3",
                    },
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: "white" }}>
                      Reativado em {formatDate(user.reactivated_at)}
                    </Typography>
                    {user.reactivated_by && (
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                        Por: {user.reactivated_by.name || user.reactivated_by.email}
                      </Typography>
                    )}
                  </Box>
                </Alert>
              )}
            </Stack>
          </Box>

          {/* Botões de ação */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
            {isActive ? (
              <Tooltip title="Desativar acesso" arrow>
                <IconButton
                  onClick={() => onRevoke(userType, user.id, user.name || user.email)}
                  sx={{
                    color: "#ff4444",
                    backgroundColor: "rgba(255, 68, 68, 0.1)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 68, 68, 0.2)",
                      transform: "scale(1.1)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  <Block />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Reativar acesso" arrow>
                <IconButton
                  onClick={() => onReactivate(userType, user.id, user.name || user.email)}
                  sx={{
                    color: "#4caf50",
                    backgroundColor: "rgba(76, 175, 80, 0.1)",
                    "&:hover": {
                      backgroundColor: "rgba(76, 175, 80, 0.2)",
                      transform: "scale(1.1)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  <CheckCircle />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}




