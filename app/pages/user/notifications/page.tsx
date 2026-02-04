"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Container,
  Paper,
  Checkbox,
  FormControlLabel,
  Button,
  CircularProgress,
  IconButton,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemButton,
  Avatar,
  Chip,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  ArrowBackIos as ArrowBackIosIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  Event as EventIcon,
  Article as ArticleIcon,
  MusicNote as MusicNoteIcon,
  Comment as CommentIcon,
  Favorite as FavoriteIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { useToast } from "@/app/context/ToastContext";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  NotificationPreferences,
} from "@/app/services/notifications/notificationPreferenceService";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  Notification,
} from "@/app/services/notifications/notificationService";

const NotificationsPage: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [tabValue, setTabValue] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [localPreferences, setLocalPreferences] = useState({
    lineup_updated: true,
    news_feed: true,
    interactions: true,
    new_events: true,
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const data = await getNotificationPreferences();
        setPreferences(data);
        setLocalPreferences({
          lineup_updated: data.lineup_updated,
          news_feed: data.news_feed,
          interactions: data.interactions,
          new_events: data.new_events,
        });
      } catch (error) {
        console.error("Erro ao buscar preferências:", error);
        showToast("Erro ao carregar preferências", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [showToast]);

  useEffect(() => {
    if (tabValue === 0) {
      fetchNotifications();
    }
  }, [tabValue]);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const response = await getNotifications(50, 0, false);
      setNotifications(response.notifications);
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      showToast("Erro ao carregar notificações", "error");
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
      }
    }

    // Navegar para o post se houver related_news_id (prioridade para notificações de post)
    if (notification.related_news_id) {
      // Navega diretamente para a página de detalhes do post
      // A página de detalhes tratará se o post não existir
      if (notification.related_comment_id) {
        router.push(`/pages/news/${notification.related_news_id}?commentId=${notification.related_comment_id}`);
      } else {
        router.push(`/pages/news/${notification.related_news_id}`);
      }
    } else if (notification.related_event_id) {
      // Verifica se o evento está disponível antes de navegar
      try {
        const { getEventById } = await import("@/app/services/events/eventAppService");
        const event = await getEventById(notification.related_event_id);
        
        // Verifica se o evento está ativo e não foi deletado
        if (!event.is_active || event.deleted_at) {
          showToast("Este evento não está disponível no momento", "error");
          // Remove a notificação da lista local se o evento não estiver disponível
          setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
          return;
        }
        
        // Navega para a aba "eventos" (event details) quando vem de notificação de novo evento
        router.push(`/pages/user/home?event=${notification.related_event_id}&tab=eventos`);
      } catch (error: any) {
        // Se o evento não foi encontrado (404) ou está inacessível
        if (error?.response?.status === 404) {
          showToast("Este evento não está disponível ou foi removido", "error");
        } else {
          showToast("Erro ao verificar evento. Tente novamente.", "error");
        }
        // Remove a notificação da lista local se o evento não estiver disponível
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      showToast("Todas as notificações foram marcadas como lidas", "success");
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      showToast("Erro ao marcar notificações como lidas", "error");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Agora";
    if (minutes < 60) return `${minutes} min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  const handleToggle = (key: keyof typeof localPreferences) => {
    setLocalPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateNotificationPreferences(localPreferences);
      setPreferences(updated);
      showToast("Preferências salvas com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao salvar preferências:", error);
      showToast("Erro ao salvar preferências", "error");
    } finally {
      setSaving(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconStyle = {
      fontSize: 24,
      color: "#ffcc01",
    };

    switch (type) {
      case "new_event":
        return <EventIcon sx={iconStyle} />;
      case "new_post":
        return <ArticleIcon sx={iconStyle} />;
      case "lineup_updated":
        return <MusicNoteIcon sx={iconStyle} />;
      case "comment_reply":
      case "post_comment":
        return <CommentIcon sx={iconStyle} />;
      case "comment_like":
      case "post_like":
        return <FavoriteIcon sx={iconStyle} />;
      case "post_approved":
      case "post_approved_admin":
        return <CheckCircleIcon sx={{ ...iconStyle, color: "#4caf50" }} />;
      case "post_rejected":
        return <CancelIcon sx={{ ...iconStyle, color: "#f44336" }} />;
      case "post_deactivated":
        return <BlockIcon sx={{ ...iconStyle, color: "#ff9800" }} />;
      default:
        return <NotificationsIcon sx={iconStyle} />;
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f4f7fc",
          backgroundImage: "url(/background/dashboard.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <CircularProgress sx={{ color: "#ffcc01" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        paddingBottom: "72px",
        backgroundColor: "#f4f7fc",
        backgroundImage: "url(/background/dashboard.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Container maxWidth="md" sx={{ paddingTop: 2, paddingBottom: 4 }}>
        {/* Header com botão voltar */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, pl: 1 }}>
          <IconButton
            onClick={() => router.back()}
            sx={{
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            <ArrowBackIosIcon />
          </IconButton>
        </Box>

        <Paper
          sx={{
            padding: 4,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              marginBottom: 4,
            }}
          >
            <NotificationsIcon
              sx={{
                fontSize: 64,
                color: "#ffcc01",
              }}
            />
            <Typography
              variant="h4"
              sx={{
                color: "#fff",
                fontWeight: 700,
              }}
            >
              Notificações
            </Typography>
          </Box>

          <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.2)", mb: 3 }} />

          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{
              mb: 3,
              "& .MuiTab-root": {
                color: "rgba(255, 255, 255, 0.7)",
                "&.Mui-selected": {
                  color: "#ffcc01",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#ffcc01",
              },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <NotificationsIcon />
                  <span>Notificações</span>
                  {unreadCount > 0 && (
                    <Chip
                      label={unreadCount}
                      size="small"
                      sx={{
                        backgroundColor: "#ffcc01",
                        color: "#000",
                        fontWeight: 700,
                        height: 20,
                        minWidth: 20,
                        fontSize: "0.7rem",
                      }}
                    />
                  )}
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SettingsIcon />
                  <span>Preferências</span>
                </Box>
              }
            />
          </Tabs>

          {tabValue === 0 ? (
            <Box>
              {unreadCount > 0 && (
                <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleMarkAllAsRead}
                    sx={{
                      color: "#ffcc01",
                      borderColor: "#ffcc01",
                      "&:hover": {
                        borderColor: "#ffd633",
                        backgroundColor: "rgba(255, 204, 1, 0.1)",
                      },
                    }}
                  >
                    Marcar todas como lidas
                  </Button>
                </Box>
              )}

              {loadingNotifications ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    py: 4,
                  }}
                >
                  <CircularProgress sx={{ color: "#ffcc01" }} />
                </Box>
              ) : notifications.length === 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 4,
                    px: 2,
                  }}
                >
                  <NotificationsIcon
                    sx={{ fontSize: 48, color: "rgba(255, 255, 255, 0.3)", mb: 2 }}
                  />
                  <Typography
                    sx={{
                      color: "rgba(255, 255, 255, 0.7)",
                      textAlign: "center",
                    }}
                  >
                    Ainda não há notificações.
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {notifications.map((notification, index) => (
                    <Box key={notification.id}>
                      <ListItem
                        disablePadding
                        sx={{
                          backgroundColor: notification.is_read
                            ? "transparent"
                            : "rgba(255, 204, 1, 0.1)",
                        }}
                      >
                        <ListItemButton
                          onClick={() => handleNotificationClick(notification)}
                          sx={{
                            py: 1.5,
                            px: 2,
                            "&:hover": {
                              backgroundColor: "rgba(255, 255, 255, 0.05)",
                            },
                          }}
                        >
                          <Box sx={{ width: "100%", display: "flex", gap: 1.5 }}>
                            {/* Ícone do tipo de notificação */}
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: "rgba(255, 204, 1, 0.15)",
                                borderRadius: "50%",
                                flexShrink: 0,
                              }}
                            >
                              {getNotificationIcon(notification.type)}
                            </Box>

                            {/* Avatar do usuário relacionado (se houver) */}
                            {notification.related_user && (
                              <Avatar
                                src={notification.related_user.profile_photo || undefined}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  bgcolor: "rgba(255, 204, 1, 0.2)",
                                  flexShrink: 0,
                                }}
                              >
                                {!notification.related_user.profile_photo &&
                                  (notification.related_user.name?.[0] || "U").toUpperCase()}
                              </Avatar>
                            )}

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  mb: 0.5,
                                }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    color: "white",
                                    fontWeight: notification.is_read ? 400 : 700,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  {notification.title}
                                </Typography>
                                {!notification.is_read && (
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: "50%",
                                      backgroundColor: "#ffcc01",
                                      ml: 1,
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                              </Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "rgba(255, 255, 255, 0.7)",
                                  fontSize: "0.85rem",
                                  mb: 0.5,
                                }}
                              >
                                {notification.message}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "rgba(255, 255, 255, 0.5)",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {formatDate(notification.created_at)}
                              </Typography>
                            </Box>
                          </Box>
                        </ListItemButton>
                      </ListItem>
                      {index < notifications.length - 1 && (
                        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />
                      )}
                    </Box>
                  ))}
                </List>
              )}
            </Box>
          ) : (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255, 255, 255, 0.7)",
                  textAlign: "center",
                  mb: 3,
                }}
              >
                Escolha quais tipos de notificações você deseja receber
              </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              marginBottom: 4,
            }}
          >
            <Paper
              sx={{
                padding: 3,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 2,
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localPreferences.lineup_updated}
                    onChange={() => handleToggle("lineup_updated")}
                    sx={{
                      color: "#ffcc01",
                      "&.Mui-checked": {
                        color: "#ffcc01",
                      },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography
                      sx={{
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "1.1rem",
                        mb: 0.5,
                      }}
                    >
                      Atualização de Line Up
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.9rem",
                      }}
                    >
                      Receba notificações quando o line up de um evento for atualizado
                    </Typography>
                  </Box>
                }
              />
            </Paper>

            <Paper
              sx={{
                padding: 3,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 2,
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localPreferences.news_feed}
                    onChange={() => handleToggle("news_feed")}
                    sx={{
                      color: "#ffcc01",
                      "&.Mui-checked": {
                        color: "#ffcc01",
                      },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography
                      sx={{
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "1.1rem",
                        mb: 0.5,
                      }}
                    >
                      Feed de Notícias
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.9rem",
                      }}
                    >
                      Receba notificações quando novos posts forem publicados
                    </Typography>
                  </Box>
                }
              />
            </Paper>

            <Paper
              sx={{
                padding: 3,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 2,
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localPreferences.interactions}
                    onChange={() => handleToggle("interactions")}
                    sx={{
                      color: "#ffcc01",
                      "&.Mui-checked": {
                        color: "#ffcc01",
                      },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography
                      sx={{
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "1.1rem",
                        mb: 0.5,
                      }}
                    >
                      Interações
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.9rem",
                      }}
                    >
                      Receba notificações quando alguém curtir ou comentar seu comentário
                    </Typography>
                  </Box>
                }
              />
            </Paper>

            <Paper
              sx={{
                padding: 3,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 2,
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localPreferences.new_events}
                    onChange={() => handleToggle("new_events")}
                    sx={{
                      color: "#ffcc01",
                      "&.Mui-checked": {
                        color: "#ffcc01",
                      },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography
                      sx={{
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "1.1rem",
                        mb: 0.5,
                      }}
                    >
                      Novos Eventos
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.9rem",
                      }}
                    >
                      Receba notificações quando novos eventos forem criados
                    </Typography>
                  </Box>
                }
              />
            </Paper>
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={handleSave}
            disabled={saving}
            sx={{
              borderRadius: "999px",
              backgroundColor: "#ffc91f",
              color: "#000",
              fontWeight: 700,
              fontSize: { xs: "0.875rem", sm: "1.1rem" },
              py: { xs: 1, sm: 1.5 },
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#ffd54f",
              },
              "&:disabled": {
                backgroundColor: "rgba(255, 201, 31, 0.5)",
                color: "rgba(0, 0, 0, 0.3)",
              },
            }}
          >
            {saving ? <CircularProgress size={24} sx={{ color: "#000" }} /> : "Salvar Preferências"}
          </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default NotificationsPage;
