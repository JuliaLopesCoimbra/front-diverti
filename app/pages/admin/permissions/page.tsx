"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  PersonAdd,
  Block,
  CheckCircle,
  ArrowBack,
  Email,
  Person,
  CalendarToday,
  AdminPanelSettings,
  EditNote,
  People,
  VerifiedUser,
  Warning,
  Info,
  ArrowBackIos
} from "@mui/icons-material";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import {
  inviteSubadmin,
  inviteColunista,
  revokeSubadminAccess,
  revokeColunistaAccess,
  revokeUserAccess,
  reactivateSubadminAccess,
  reactivateColunistaAccess,
  reactivateUserAccess,
  listSubadmins,
  listColunistas,
  listUsers,
  UserResponse,
} from "@/app/services/auth/authAdminService";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`permissions-tabpanel-${index}`}
      aria-labelledby={`permissions-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function PermissionsPage() {
  const { isAdminMaster, isSubadmin } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [subadmins, setSubadmins] = useState<UserResponse[]>([]);
  const [colunistas, setColunistas] = useState<UserResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);

  // Modais
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteType, setInviteType] = useState<"subadmin" | "colunista">("colunista");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "revoke" | "reactivate";
    userType: "subadmin" | "colunista" | "user";
    userId: number;
    userName: string;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (!isAdminMaster && !isSubadmin) {
      router.push("/pages/user/home");
      return;
    }
    loadUsers();
  }, [isAdminMaster, isSubadmin, router]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      if (isAdminMaster) {
        const [subadminsData, colunistasData, usersData] = await Promise.all([
          listSubadmins(),
          listColunistas(),
          listUsers(),
        ]);
        setSubadmins(subadminsData);
        setColunistas(colunistasData);
        setUsers(usersData);
      } else if (isSubadmin) {
        const [colunistasData, usersData] = await Promise.all([
          listColunistas(),
          listUsers(),
        ]);
        setColunistas(colunistasData);
        setUsers(usersData);
      }
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showToast("Preencha todos os campos", "error");
      return;
    }

    setInviteLoading(true);
    try {
      if (inviteType === "subadmin") {
        await inviteSubadmin({ name: inviteName.trim(), email: inviteEmail.trim() });
        showToast("Subadmin convidado com sucesso!", "success");
      } else {
        await inviteColunista({ name: inviteName.trim(), email: inviteEmail.trim() });
        showToast("Colunista convidado com sucesso!", "success");
      }
      setInviteModalOpen(false);
      setInviteName("");
      setInviteEmail("");
      loadUsers();
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, "error");
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevoke = (userType: "subadmin" | "colunista" | "user", userId: number, userName: string) => {
    setConfirmAction({ type: "revoke", userType, userId, userName });
    setConfirmModalOpen(true);
  };

  const handleReactivate = (userType: "subadmin" | "colunista" | "user", userId: number, userName: string) => {
    setConfirmAction({ type: "reactivate", userType, userId, userName });
    setConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setConfirmLoading(true);
    try {
      if (confirmAction.type === "revoke") {
        if (confirmAction.userType === "subadmin") {
          await revokeSubadminAccess(confirmAction.userId);
          showToast("Acesso do subadmin revogado com sucesso!", "success");
        } else if (confirmAction.userType === "colunista") {
          await revokeColunistaAccess(confirmAction.userId);
          showToast("Acesso do colunista revogado com sucesso!", "success");
        } else {
          await revokeUserAccess(confirmAction.userId);
          showToast("Acesso do usuário revogado com sucesso!", "success");
        }
      } else {
        if (confirmAction.userType === "subadmin") {
          await reactivateSubadminAccess(confirmAction.userId);
          showToast("Acesso do subadmin reativado com sucesso!", "success");
        } else if (confirmAction.userType === "colunista") {
          await reactivateColunistaAccess(confirmAction.userId);
          showToast("Acesso do colunista reativado com sucesso!", "success");
        } else {
          await reactivateUserAccess(confirmAction.userId);
          showToast("Acesso do usuário reativado com sucesso!", "success");
        }
      }
      setConfirmModalOpen(false);
      setConfirmAction(null);
      loadUsers();
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, "error");
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const UserCard = ({
    user,
    userType,
  }: {
    user: UserResponse;
    userType: "subadmin" | "colunista" | "user";
  }) => {
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
        case "subadmin":
          return <AdminPanelSettings sx={{ fontSize: 20, color: "#ffcc01" }} />;
        case "colunista":
          return <EditNote sx={{ fontSize: 20, color: "#ffcc01" }} />;
        default:
          return <People sx={{ fontSize: 20, color: "#ffcc01" }} />;
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
            borderColor: "rgba(255, 204, 1, 0.4)",
            transform: "translateY(-2px)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              {/* Header com nome e status */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                {getRoleIcon()}
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: "white",
                    fontWeight: 600,
                    flex: 1,
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
                  }}
                />
              </Box>

              <Divider sx={{ mb: 2, borderColor: "rgba(255, 255, 255, 0.1)" }} />

              {/* Informações do usuário */}
              <Stack spacing={1.5}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Email sx={{ fontSize: 18, color: "#ffcc01", opacity: 0.9 }} />
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
                    {user.email}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <CalendarToday sx={{ fontSize: 18, color: "#ffcc01", opacity: 0.9 }} />
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
                    Criado em {formatDate(user.created_at)}
                  </Typography>
                </Box>

                {userType === "colunista" && user.invited_by && (
                  <Box 
                    sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: "rgba(255, 204, 1, 0.1)",
                      border: "1px solid rgba(255, 204, 1, 0.2)",
                    }}
                  >
                    <Person sx={{ fontSize: 18, color: "#ffcc01" }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", display: "block" }}>
                        Convidado por
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#ffcc01", fontWeight: 600 }}>
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {isActive ? (
                <Tooltip title="Desativar acesso" arrow>
                  <IconButton
                    onClick={() => handleRevoke(userType, user.id, user.name || user.email)}
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
                    onClick={() => handleReactivate(userType, user.id, user.name || user.email)}
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
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundImage: "url(/background/dashboard.png)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#ffc91f" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url(/background/dashboard.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        padding: { xs: 2, sm: 3, md: 4 },
        position: "relative",
      }}
    >
      {/* Botão de voltar */}
      <Button
        onClick={() => router.back()}
        sx={{
          position: "fixed",
          top: 40,
          left: 20,
          minWidth: "auto",
          padding: "10px",
          color: "#fff",
        
          backdropFilter: "blur(10px)",
         
          zIndex: 1000,
          "&:hover": {
            backgroundColor: "rgba(255, 204, 1, 0.2)",
            transform: "scale(1.1)",
          },
          transition: "all 0.2s ease",
          
        }}
      >
        <ArrowBackIos />
      </Button>

      <Box sx={{ maxWidth: "1400px", margin: "0 auto", mt: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(20px)",
            borderRadius: 4,
            p: 4,
            mb: 4,
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <VerifiedUser sx={{ fontSize: 40, color: "#ffcc01" }} />
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  color: "white", 
                  fontWeight: 700,
                  mb: 0.5,
                  fontSize: 20,
                }}
              >
                Gerenciamento de Permissões
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                Gerencie usuários, permissões e acessos do sistema
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(20px)",
            borderRadius: 3,
            mb: 3,
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{
              "& .MuiTab-root": {
                color: "rgba(255,255,255,0.7)",
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 500,
                minHeight: 64,
                "&.Mui-selected": {
                  color: "#ffcc01",
                  fontWeight: 600,
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#ffcc01",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            {isAdminMaster && (
              <Tab 
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AdminPanelSettings sx={{ fontSize: 20 }} />
                    <span>Subadmins</span>
                  </Box>
                } 
              />
            )}
            <Tab 
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EditNote sx={{ fontSize: 20 }} />
                  <span>Colunistas</span>
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <People sx={{ fontSize: 20 }} />
                  <span>Usuários</span>
                </Box>
              } 
            />
          </Tabs>
        </Paper>

        {/* Subadmins Tab - Apenas Master */}
        {isAdminMaster && (
          <TabPanel value={tabValue} index={0}>
            <Paper
              elevation={0}
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                p: 3,
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ color: "white", fontWeight: 600, mb: 0.5 }}>
                    Subadmins
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                    {subadmins.length} {subadmins.length === 1 ? "subadmin cadastrado" : "subadmins cadastrados"}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => {
                    setInviteType("subadmin");
                    setInviteModalOpen(true);
                  }}
                  sx={{
                    backgroundColor: "#ffcc01",
                    color: "#000",
                    fontWeight: 600,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "#e6b800",
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(255, 204, 1, 0.4)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  Adicionar Subadmin
                </Button>
              </Box>

              {subadmins.length === 0 ? (
                <Alert 
                  severity="info" 
                  icon={<Info />}
                  sx={{ 
                    backgroundColor: "rgba(33, 150, 243, 0.15)",
                    border: "1px solid rgba(33, 150, 243, 0.3)",
                    color: "white",
                    borderRadius: 2,
                  }}
                >
                  Nenhum subadmin cadastrado. Clique em "Adicionar Subadmin" para começar.
                </Alert>
              ) : (
                subadmins.map((subadmin) => (
                  <UserCard key={subadmin.id} user={subadmin} userType="subadmin" />
                ))
              )}
            </Paper>
          </TabPanel>
        )}

        {/* Colunistas Tab */}
        <TabPanel value={tabValue} index={isAdminMaster ? 1 : 0}>
          <Paper
            elevation={0}
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              backdropFilter: "blur(10px)",
              borderRadius: 3,
              p: 3,
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
              <Box>
                <Typography variant="h5" sx={{ color: "white", fontWeight: 600, mb: 0.5 }}>
                  Colunistas
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                  {colunistas.length} {colunistas.length === 1 ? "colunista cadastrado" : "colunistas cadastrados"}
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => {
                  setInviteType("colunista");
                  setInviteModalOpen(true);
                }}
                sx={{
                  backgroundColor: "#ffcc01",
                  color: "#000",
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#e6b800",
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 12px rgba(255, 204, 1, 0.4)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                Adicionar Colunista
              </Button>
            </Box>

            {colunistas.length === 0 ? (
              <Alert 
                severity="info" 
                icon={<Info />}
                sx={{ 
                  backgroundColor: "rgba(33, 150, 243, 0.15)",
                  border: "1px solid rgba(33, 150, 243, 0.3)",
                  color: "white",
                  borderRadius: 2,
                }}
              >
                Nenhum colunista cadastrado. Clique em "Adicionar Colunista" para começar.
              </Alert>
            ) : (
              colunistas.map((colunista) => (
                <UserCard key={colunista.id} user={colunista} userType="colunista" />
              ))
            )}
          </Paper>
        </TabPanel>

        {/* Users Tab */}
        <TabPanel value={tabValue} index={isAdminMaster ? 2 : 1}>
          <Paper
            elevation={0}
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              backdropFilter: "blur(10px)",
              borderRadius: 3,
              p: 3,
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
              <Box>
                <Typography variant="h5" sx={{ color: "white", fontWeight: 600, mb: 0.5 }}>
                  Usuários
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                  {users.length} {users.length === 1 ? "usuário cadastrado" : "usuários cadastrados"}
                </Typography>
              </Box>
            </Box>

            {users.length === 0 ? (
              <Alert 
                severity="info" 
                icon={<Info />}
                sx={{ 
                  backgroundColor: "rgba(33, 150, 243, 0.15)",
                  border: "1px solid rgba(33, 150, 243, 0.3)",
                  color: "white",
                  borderRadius: 2,
                }}
              >
                Nenhum usuário cadastrado.
              </Alert>
            ) : (
              users.map((user) => (
                <UserCard key={user.id} user={user} userType="user" />
              ))
            )}
          </Paper>
        </TabPanel>
      </Box>

      {/* Modal de Convite */}
      <Dialog
        open={inviteModalOpen}
        onClose={() => {
          setInviteModalOpen(false);
          setInviteName("");
          setInviteEmail("");
        }}
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
              onChange={(e) => setInviteName(e.target.value)}
              disabled={inviteLoading}
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
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={inviteLoading}
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
            onClick={() => {
              setInviteModalOpen(false);
              setInviteName("");
              setInviteEmail("");
            }}
            disabled={inviteLoading}
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
            onClick={handleInvite}
            disabled={inviteLoading}
            variant="contained"
            startIcon={inviteLoading ? <CircularProgress size={16} sx={{ color: "#000" }} /> : <PersonAdd />}
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
            {inviteLoading ? "Enviando..." : "Enviar Convite"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmação */}
      <Dialog
        open={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setConfirmAction(null);
        }}
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
            {confirmAction?.type === "revoke" ? (
              <Block sx={{ fontSize: 28, color: "#ff4444" }} />
            ) : (
              <CheckCircle sx={{ fontSize: 28, color: "#4caf50" }} />
            )}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {confirmAction?.type === "revoke" ? "Desativar Acesso" : "Reativar Acesso"}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
                {confirmAction?.type === "revoke" 
                  ? "Esta ação pode ser revertida posteriormente" 
                  : "O usuário poderá acessar o sistema novamente"}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", mx: 3 }} />
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.9)", fontSize: "1rem", lineHeight: 1.6 }}>
            {confirmAction?.type === "revoke" ? (
              <>
                Tem certeza que deseja <strong style={{ color: "#ff4444" }}>desativar</strong> o acesso de{" "}
                <strong style={{ color: "#ffcc01" }}>{confirmAction?.userName}</strong>?
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
                <strong style={{ color: "#ffcc01" }}>{confirmAction?.userName}</strong>?
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
            onClick={() => {
              setConfirmModalOpen(false);
              setConfirmAction(null);
            }}
            disabled={confirmLoading}
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
            onClick={handleConfirmAction}
            disabled={confirmLoading}
            variant="contained"
            startIcon={confirmLoading ? (
              <CircularProgress 
                size={16} 
                sx={{ 
                  color: confirmAction?.type === "revoke" ? "#fff" : "#fff" 
                }} 
              />
            ) : confirmAction?.type === "revoke" ? (
              <Block />
            ) : (
              <CheckCircle />
            )}
            sx={{
              backgroundColor: confirmAction?.type === "revoke" ? "#ff4444" : "#4caf50",
              color: "white",
              fontWeight: 600,
              textTransform: "none",
              px: 3,
              "&:hover": {
                backgroundColor: confirmAction?.type === "revoke" ? "#cc0000" : "#45a049",
                transform: "translateY(-2px)",
                boxShadow: `0 4px 12px ${confirmAction?.type === "revoke" ? "rgba(255, 68, 68, 0.4)" : "rgba(76, 175, 80, 0.4)"}`,
              },
              transition: "all 0.2s ease",
            }}
          >
            {confirmLoading ? "Processando..." : confirmAction?.type === "revoke" ? "Desativar" : "Reativar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

