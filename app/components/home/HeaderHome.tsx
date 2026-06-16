"use client";

import { Box, Typography, Avatar, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Skeleton, Badge, List, ListItem, ListItemButton, Divider, Button, CircularProgress, Paper } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import BlockIcon from "@mui/icons-material/Block";
import EventIcon from "@mui/icons-material/Event";
import ArticleIcon from "@mui/icons-material/Article";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import CommentIcon from "@mui/icons-material/Comment";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EventResponse } from "@/app/services/events/eventAppService";
import { getProfile, ProfileResponse } from "@/app/services/profile/profileService";
import HamburgerMenu from "@/app/components/layout/HamburgerMenu";
import { useAuth } from "@/app/context/AuthContext";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, Notification } from "@/app/services/notifications/notificationService";
import { useToast } from "@/app/context/ToastContext";

interface Props {
  event: EventResponse | null;
  events: EventResponse[];
  onSelectEvent: (event: EventResponse) => void;
  currentEvent: EventResponse | null;
  profile?: ProfileResponse | null;
  activeTab?: string;
}

export default function HomeHeader({
  event,
  events,
  onSelectEvent,
  currentEvent,
  profile: profileProp,
  activeTab,
}: Props) {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ProfileResponse | null>(profileProp || null);
  const [loadingProfile, setLoadingProfile] = useState(!profileProp);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const notificationsOpen = Boolean(notificationsAnchorEl);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalNotifications, setTotalNotifications] = useState(0);

  useEffect(() => {
    // Se o perfil foi passado como prop, não precisa buscar
    if (profileProp) {
      setProfile(profileProp);
      setLoadingProfile(false);
      return;
    }
    
    // Caso contrário, busca o perfil (compatibilidade com outros usos)
    setLoadingProfile(true);
    getProfile()
      .then((data) => {
        setProfile(data);
        setLoadingProfile(false);
      })
      .catch((error) => {
        console.error("Erro ao buscar perfil:", error);
        setLoadingProfile(false);
      });
  }, [profileProp]);

  // Buscar contador de notificações não lidas (apenas se autenticado)
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Erro ao buscar contador de notificações:", error);
      }
    };

    fetchUnreadCount();
    // Sem polling periódico — busca apenas uma vez ao montar

    // Escuta evento de remoção de notificação
    const handleNotificationRemoved = (event: CustomEvent) => {
      const { commentId, type } = event.detail;
      
      if (type === 'comment_like') {
        // Remove a notificação de like da lista local
        setNotifications((prev) => {
          const filtered = prev.filter(
            (n) => !(n.type === 'comment_like' && n.related_comment_id === commentId)
          );
          // Atualiza o contador se a notificação removida não estava lida
          const removedNotification = prev.find(
            (n) => n.type === 'comment_like' && n.related_comment_id === commentId
          );
          if (removedNotification && !removedNotification.is_read) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return filtered;
        });
        // Atualiza o contador total
        setTotalNotifications((prev) => Math.max(0, prev - 1));
      } else if (type === 'comment_deleted') {
        // Remove todas as notificações relacionadas a este comentário (like, reply e post_comment)
        setNotifications((prev) => {
          const filtered = prev.filter(
            (n) => !(n.related_comment_id === commentId && 
                    (n.type === 'comment_like' || n.type === 'comment_reply' || n.type === 'post_comment'))
          );
          // Conta quantas notificações não lidas foram removidas
          const removedUnreadCount = prev.filter(
            (n) => n.related_comment_id === commentId && 
                   (n.type === 'comment_like' || n.type === 'comment_reply' || n.type === 'post_comment') &&
                   !n.is_read
          ).length;
          if (removedUnreadCount > 0) {
            setUnreadCount((count) => Math.max(0, count - removedUnreadCount));
          }
          // Atualiza o contador total
          const removedCount = prev.filter(
            (n) => n.related_comment_id === commentId && 
                   (n.type === 'comment_like' || n.type === 'comment_reply' || n.type === 'post_comment')
          ).length;
          setTotalNotifications((total) => Math.max(0, total - removedCount));
          return filtered;
        });
      } else if (type === 'post_deleted') {
        // Remove todas as notificações relacionadas a este post (new_post e post_approved)
        const { newsId } = event.detail;
        setNotifications((prev) => {
          const filtered = prev.filter(
            (n) => !(n.related_news_id === newsId && 
                    (n.type === 'new_post' || n.type === 'post_approved'))
          );
          // Conta quantas notificações não lidas foram removidas
          const removedUnreadCount = prev.filter(
            (n) => n.related_news_id === newsId && 
                   (n.type === 'new_post' || n.type === 'post_approved') &&
                   !n.is_read
          ).length;
          if (removedUnreadCount > 0) {
            setUnreadCount((count) => Math.max(0, count - removedUnreadCount));
          }
          // Atualiza o contador total
          const removedCount = prev.filter(
            (n) => n.related_news_id === newsId && 
                   (n.type === 'new_post' || n.type === 'post_approved')
          ).length;
          setTotalNotifications((total) => Math.max(0, total - removedCount));
          return filtered;
        });
      }
    };
    
    window.addEventListener('notificationRemoved', handleNotificationRemoved as EventListener);

    return () => {
      window.removeEventListener('notificationRemoved', handleNotificationRemoved as EventListener);
    };
  }, [isAuthenticated]);

  // Buscar notificações quando o menu abrir
  useEffect(() => {
    if (notificationsOpen) {
      const fetchNotifications = async () => {
        setLoadingNotifications(true);
        try {
          const response = await getNotifications(20, 0, false);
          setNotifications(response.notifications);
          setUnreadCount(response.unread_count);
          setTotalNotifications(response.total);
          setOffset(20);
          setHasMore(response.notifications.length < response.total);
        } catch (error) {
          console.error("Erro ao buscar notificações:", error);
          showToast("Erro ao carregar notificações", "error");
        } finally {
          setLoadingNotifications(false);
        }
      };
      fetchNotifications();
    } else {
      // Reset quando fechar o popup
      setOffset(0);
      setHasMore(true);
      setNotifications([]);
      setTotalNotifications(0);
    }
  }, [notificationsOpen, showToast]);

  const handleNotificationClick = (notification: Notification) => {
    // Fecha o menu imediatamente para melhor UX
    setNotificationsAnchorEl(null);

    // Marcar como lida em background (não bloqueia a navegação)
    if (!notification.is_read) {
      // Atualiza o estado local imediatamente (otimista)
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      
      // Faz a chamada da API em background (fire and forget)
      markAsRead(notification.id).catch((error) => {
        console.error("Erro ao marcar notificação como lida:", error);
        // Reverte o estado se falhar
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: false } : n
          )
        );
        setUnreadCount((prev) => prev + 1);
      });
    }

    // Navega imediatamente sem esperar nada
    if (notification.related_news_id) {
      // Navega diretamente para o post - a página de detalhes tratará se o post não existir
      if (notification.related_comment_id) {
        router.push(`/pages/news/${notification.related_news_id}?commentId=${notification.related_comment_id}`);
      } else {
        router.push(`/pages/news/${notification.related_news_id}`);
      }
    } else if (notification.related_event_id) {
      // Se for notificação de line up, navega diretamente para a página de lineup
      if (notification.type === 'lineup_updated') {
        router.push(`/pages/events/${notification.related_event_id}/lineup`);
      } else {
        router.push(`/pages/user/home?eventId=${notification.related_event_id}&tab=eventos`);
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
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString("pt-BR");
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

  // Função para carregar mais notificações
  const loadMoreNotifications = async () => {
    if (loadingNotifications || !hasMore) return;
    
    setLoadingNotifications(true);
    try {
      const response = await getNotifications(20, offset, false);
      setNotifications((prev) => {
        const newNotifications = [...prev, ...response.notifications];
        // Verifica se ainda há mais notificações para carregar
        setHasMore(newNotifications.length < totalNotifications);
        return newNotifications;
      });
      setOffset((prev) => prev + 20);
    } catch (error) {
      console.error("Erro ao carregar mais notificações:", error);
      showToast("Erro ao carregar mais notificações", "error");
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Handler para detectar quando chegou no final do scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    
    // Carrega mais quando está a 100px do final
    if (scrollBottom < 100 && hasMore && !loadingNotifications) {
      loadMoreNotifications();
    }
  };

  const activeEvent = event || currentEvent;
  const isLive = activeEvent?.is_active;
  const firstName = profile?.name?.split(" ")[0] || profile?.email || "";

  // Skeleton
  if (loadingProfile || !profile) {
    return (
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          px: { xs: 2, md: 3 },
          py: { xs: 1.5, md: 2 },
          backgroundColor: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Box display="flex" alignItems="center" gap={1.2}>
            <HamburgerMenu events={events} currentEvent={currentEvent || event} onSelectEvent={onSelectEvent} />
            <Box>
              <Skeleton variant="text" width={40} height={14} sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 0.3 }} />
              <Skeleton variant="text" width={100} height={18} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1.2}>
            <Skeleton variant="circular" width={36} height={36} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
            <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
          </Box>
        </Box>
        {(event || currentEvent) && (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Skeleton variant="rectangular" width={200} height={30} sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "999px" }} />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        px: { xs: 2, md: 3 },
        pt: { xs: 1.5, md: 2 },
        pb: { xs: 1.5, md: 2 },
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
    >
      {/* Linha principal: hamburger + saudação | sino + avatar */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {/* ESQUERDA */}
        <Box display="flex" alignItems="center" gap={1.2}>
          <HamburgerMenu
            events={events}
            currentEvent={currentEvent || event}
            onSelectEvent={onSelectEvent}
          />
          <Box>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500, lineHeight: 1, mb: "3px", letterSpacing: "0.3px" }}>
              Olá,
            </Typography>
            <Typography sx={{ color: "#fff", fontSize: { xs: 15, md: 17 }, fontWeight: 700, lineHeight: 1 }}>
              {firstName}
            </Typography>
          </Box>
        </Box>

        {/* DIREITA */}
        <Box display="flex" alignItems="center" gap={1.2}>
          <IconButton
            onClick={() => router.push("/pages/user/stand-bookings")}
            sx={{
              color: "rgba(255,255,255,0.75)",
              width: 38,
              height: 38,
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              transition: "all 0.2s",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" },
            }}
          >
            <StorefrontRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton
            onClick={(e) => setNotificationsAnchorEl(e.currentTarget)}
            sx={{
              color: "rgba(255,255,255,0.75)",
              width: 38,
              height: 38,
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              transition: "all 0.2s",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" },
            }}
          >
            <Badge
              badgeContent={unreadCount > 0 ? unreadCount : 0}
              max={99}
              sx={{
                "& .MuiBadge-badge": {
                  backgroundColor: "#fff",
                  color: "#111",
                  fontSize: 9,
                  fontWeight: 700,
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                },
              }}
            >
              <NotificationsIcon sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>

          <Avatar
            src={profile.profile_photo || undefined}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              width: { xs: 40, md: 44 },
              height: { xs: 40, md: 44 },
              border: "2px solid rgba(255,255,255,0.25)",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
              "&:hover": { transform: "scale(1.06)", border: "2px solid rgba(255,255,255,0.5)" },
            }}
          >
            {!profile.profile_photo && (profile.name?.[0] || profile.email[0]).toUpperCase()}
          </Avatar>
        </Box>
      </Box>


      {/* MENU DE NOTIFICAÇÕES */}
      <Menu
        anchorEl={notificationsAnchorEl}
        open={notificationsOpen}
        onClose={() => setNotificationsAnchorEl(null)}
        PaperProps={{
          sx: {
            backgroundColor: "#1a1a1a",
            color: "white",
            borderRadius: 2,
            width: { xs: "90vw", sm: 400 },
            maxWidth: 400,
            maxHeight: "80vh",
            mt: 1,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        MenuListProps={{
          sx: { p: 0 },
        }}
      >
        {/* HEADER DO MENU */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "white",
              fontWeight: 700,
              fontSize: "1.1rem",
            }}
          >
            Notificações
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllAsRead}
              sx={{
                color: "#ffcc01",
                fontSize: "0.75rem",
                textTransform: "none",
                minWidth: "auto",
                px: 1,
                "&:hover": {
                  backgroundColor: "rgba(255, 204, 1, 0.1)",
                },
              }}
            >
              Marcar todas como lidas
            </Button>
          )}
        </Box>

        {/* CONTEÃšDO */}
        <Box 
          sx={{ 
            maxHeight: "60vh", 
            overflowY: "auto",
            // Estilização do scrollbar para ficar mais bonito
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "rgba(255, 255, 255, 0.05)",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: "3px",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.3)",
              },
            },
          }}
          onScroll={handleScroll}
        >
          {loadingNotifications && notifications.length === 0 ? (
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
                        {/* Avatar do admin/subadmin que enviou o broadcast (se houver) */}
                        {notification.broadcast_sender && (
                          <Avatar
                            src={notification.broadcast_sender.profile_photo || undefined}
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: "rgba(255, 204, 1, 0.2)",
                              flexShrink: 0,
                            }}
                          >
                            {!notification.broadcast_sender.profile_photo && 
                              (notification.broadcast_sender.name?.[0] || "A").toUpperCase()}
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
                                  backgroundColor: "#ffffff",
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
          
          {/* Indicador de carregamento no final (quando está carregando mais) */}
          {loadingNotifications && notifications.length > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 2,
              }}
            >
              <CircularProgress size={20} sx={{ color: "#ffcc01" }} />
            </Box>
          )}
          
          {/* Mensagem quando não há mais notificações */}
          {!hasMore && notifications.length > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 2,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "0.75rem",
                }}
              >
                Todas as notificações foram carregadas
              </Typography>
            </Box>
          )}
        </Box>
      </Menu>

      {/* MENU DO PERFIL */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            backgroundColor: "#1a1a1a",
            color: "white",
            borderRadius: 2,
            minWidth: 200,
            mt: 1,
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            router.push("/pages/user/profile");
          }}
          sx={{
            color: "white",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          <ListItemIcon>
            <PersonIcon sx={{ color: "white" }} fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver Perfil</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            logout();
            router.replace("/pages/auth/login");
          }}
          sx={{
            color: "#ffc91f",
            "&:hover": {
              backgroundColor: "rgba(255, 201, 31, 0.1)",
            },
          }}
        >
          <ListItemIcon>
            <LogoutIcon sx={{ color: "#ffc91f" }} fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sair</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}

