"use client";
import { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Divider,
  Box,
  Typography,
  Collapse,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import EventIcon from "@mui/icons-material/Event";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CampaignIcon from "@mui/icons-material/Campaign";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { EventResponse } from "@/app/services/events/eventAppService";
import { activateEvent } from "@/app/services/events/eventAppService";
import { deactivateEvent } from "@/app/services/events/eventAppService";
import ActivateEventModal from "@/app/components/admin/events/ActivateEventModal";
import DeactivateEventModal from "@/app/components/admin/events/DeactivateEventModal";

interface Props {
  events: EventResponse[];
  currentEvent: EventResponse | null;
  onSelectEvent: (event: EventResponse) => void;
}

export default function HamburgerMenu({
  events,
  currentEvent,
  onSelectEvent,
}: Props) {
  const { isAdmin, isAdminMaster, isSubadmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [openEvents, setOpenEvents] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(
    null
  );
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuEvent, setMenuEvent] = useState<EventResponse | null>(null);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const openMenu = Boolean(menuAnchorEl);

  const router = useRouter();

  const handleEventClick = (event: EventResponse) => {
    if (event.is_active) {
      onSelectEvent(event);
      setOpen(false);
      return;
    }

    // Evento inativo - admin e subadmin podem entrar
    if (isAdmin) {
      onSelectEvent(event);
      setOpen(false);
    }
  };
  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    event: EventResponse
  ) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
    setMenuEvent(event);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setMenuEvent(null);
  };

  const handleActivate = async () => {
    if (!selectedEvent) return;
    setActivating(true);
    try {
      await activateEvent(selectedEvent.id);
      setActivateModalOpen(false);
      setSelectedEvent(null);
      router.refresh(); // evita reload completo
    } catch (error) {
      console.error("Erro ao ativar evento:", error);
    } finally {
      setActivating(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedEvent) return;
    setDeactivating(true);
    try {
      await deactivateEvent(selectedEvent.id);
      setDeactivateModalOpen(false);
      setSelectedEvent(null);
      router.refresh(); // evita reload completo
    } catch (error) {
      console.error("Erro ao desativar evento:", error);
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <>
      <IconButton onClick={() => setOpen(true)}>
        <MenuIcon sx={{ color: "white" }} />
      </IconButton>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        sx={{ zIndex: 1400 }}
        PaperProps={{
          sx: {
            minHeight: "100vh",
            backgroundImage: "url(/background/settings.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundColor: "#000",
          },
        }}
      >
        <List sx={{ width: 320, color: "#fff" }}>
          {/* ───────── HEADER DO DRAWER ───────── */}
          <Box display="flex" alignItems="center" px={2} py={1.5}>
            <IconButton onClick={() => setOpen(false)}>
              <MenuIcon sx={{ color: "white" }} />
            </IconButton>

            <IconButton>
              <Typography fontSize={22} sx={{ color: "#fff" }}>
                Configurações
              </Typography>
            </IconButton>
          </Box>

          {/* ───────── AMBIENTE ATIVO ───────── */}
          <ListItem sx={{ px: 2 }}>
            <Box
              sx={{
                width: "100%",
                backgroundColor: "#ff1f21",
                borderRadius: 2,
                padding: 2,
                display: "flex",
                flexDirection: "column",
                gap: 0.8,
              }}
            >
              {/* TÍTULO */}
              <Typography fontWeight={600} sx={{ color: "#fff", fontSize: 14 }}>
                {currentEvent?.title ?? "Nenhum evento"}
              </Typography>

              {/* STATUS */}
              <Box display="flex" alignItems="center" gap={0.6}>
                <Typography fontSize={12} sx={{ color: "#fff", opacity: 0.9 }}>
                  Ambiente ativo
                </Typography>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#2ecc71",
                    boxShadow: "0 0 6px rgba(46, 204, 113, 0.8)",
                  }}
                />
              </Box>
            </Box>
          </ListItem>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 1 }} />

          {/* ───────── EVENTOS / MUDAR AMBIENTE ───────── */}
          <ListItem disablePadding sx={{ px: 1 }}>
            <Box
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* BOTÃO DE ABRIR LISTA */}
              <ListItemButton
                onClick={() => setOpenEvents(!openEvents)}
                sx={{ flex: 1 }}
              >
                <EventIcon sx={{ mr: 2, color: "white" }} />

                <ListItemText
                  primary="Eventos"
                  secondary="Mude de ambiente"
                  primaryTypographyProps={{ fontWeight: 600 }}
                  secondaryTypographyProps={{
                    sx: { color: "rgba(255,255,255,0.6)" },
                  }}
                />

                {openEvents ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>

              {/* BOTÃO + (ADMIN) */}
              {isAdmin && (
                <IconButton
                  onClick={() => {
                    router.push("/pages/admin/events/create");
                    setOpen(false);
                  }}
                  sx={{
                    mr: 1,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.15)",
                    },
                  }}
                >
                  <AddIcon sx={{ color: "primary.main" }} />
                </IconButton>
              )}
            </Box>
          </ListItem>
          {/* ───────── LISTA DE EVENTOS ───────── */}
          <Collapse in={openEvents} timeout="auto" unmountOnExit>
            <ListItemText
              primary="Tudo que você precisa saber"
              secondary="Fique por dentro das notícias de cada evento"
              sx={{
                px: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
              primaryTypographyProps={{
                fontWeight: 600,
                sx: { color: "#fff", lineHeight: 1.2, margin: 1 },
              }}
              secondaryTypographyProps={{
                sx: {
                  color: "rgba(255,255,255,0.6)",
                  margin: 1, // REMOVE margin automático
                  lineHeight: 1.3,
                },
              }}
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 1.5,
                px: 2,
                pb: 2,
                margin: 1,
              }}
            >
              {events.map((event) => {
                const isInactive = !event.is_active;
                const isSelected = currentEvent?.id === event.id;

                return (
                  <Box
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    sx={{
                      position: "relative",
                      cursor: "pointer",
                      border: isSelected ? "3px solid rgb(255, 31, 33)" : "none",
                      borderRadius: 2,
                      padding: isSelected ? "3px" : 0,
                      transition: "all 0.2s",
                    }}
                  >
                    {/* IMAGEM */}
                    <Box
                      sx={{
                        width: "100%",
                        height: 110,
                        borderRadius: 2,
                        backgroundColor: "#222",
                        opacity: isInactive ? 0.4 : 1,
                        transition: "opacity 0.3s",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        component="img"
                        src={event.banner_image}
                        alt={event.title}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Box>
                    {/* MENU ADMIN (3 PONTINHOS) */}
                    {isAdmin && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenMenu(e, event)}
                        sx={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          zIndex: 10,
                          backgroundColor: "rgba(0,0,0,0.45)",
                          "&:hover": {
                            backgroundColor: "rgba(0,0,0,0.65)",
                          },
                        }}
                      >
                        <MoreVertIcon fontSize="small" sx={{ color: "#fff" }} />
                      </IconButton>
                    )}

                    {/* STATUS BOLINHA */}
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 6,
                        right: 6,
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: event.is_active
                          ? "#2ecc71"
                          : "#e74c3c",
                        border: "2px solid rgba(0,0,0,0.6)",
                        zIndex: 10,
                      }}
                    />

                    {/* OVERLAY ADMIN */}
                    {isInactive && isAdmin && (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 2,
                          backgroundColor: "rgba(0,0,0,0.45)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 13,
                          textTransform: "uppercase",
                          pointerEvents: "none",
                        }}
                      >
                        Ativar evento
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Collapse>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 1 }} />
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                router.push("/pages/user/profile");
                setOpen(false);
              }}
            >
              <PersonIcon sx={{ mr: 2, color: "white" }} />

              <ListItemText
                primary="Perfil"
                secondary=" Ver e editar perfil"
                primaryTypographyProps={{ fontWeight: 600 }}
                secondaryTypographyProps={{
                  sx: { color: "rgba(255,255,255,0.6)" },
                }}
              />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 1 }} />
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                router.push("/pages/user/notifications");
                setOpen(false);
              }}
            >
              <NotificationsIcon sx={{ mr: 2, color: "white" }} />

              <ListItemText
                primary="Notificações"
                secondary="Definir suas notificações"
                primaryTypographyProps={{ fontWeight: 600 }}
                secondaryTypographyProps={{
                  sx: { color: "rgba(255,255,255,0.6)" },
                }}
              />
            </ListItemButton>
          </ListItem>
         
  
          {/* <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 1 }} />
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                console.log("Ir para histórico de prêmios");
                // router.push("/rewards/history")
              }}
            >
              <EmojiEventsIcon sx={{ mr: 2, color: "white" }} />

              <ListItemText
                primary="Histórico de prêmios"
                secondary="Prêmios conquistados"
                primaryTypographyProps={{ fontWeight: 600 }}
                secondaryTypographyProps={{
                  sx: { color: "rgba(255,255,255,0.6)" },
                }}
              />
            </ListItemButton>
          </ListItem> */}
        
                {/* ───────── PERMISSÕES (ADMIN MASTER E SUBADMIN) ───────── */}
                {(isAdminMaster || isSubadmin) && (
             <>
               <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 1 }} />
               <ListItem disablePadding>
                 <ListItemButton
                   onClick={() => {
                     router.push("/pages/admin/permissions");
                     setOpen(false);
                   }}
                 >
                   <AdminPanelSettingsIcon sx={{ mr: 2, color: "white" }} />

                   <ListItemText
                     primary="Permissões"
                     secondary="Gerenciar usuários e permissões"
                     primaryTypographyProps={{ fontWeight: 600 }}
                     secondaryTypographyProps={{
                       sx: { color: "rgba(255,255,255,0.6)" },
                     }}
                   />
                 </ListItemButton>
               </ListItem>
               <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 1 }} />
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    router.push("/pages/admin/anuncios");
                    setOpen(false);
                  }}
                >
                  <CampaignIcon sx={{ mr: 2, color: "white" }} />

                  <ListItemText
                    primary="Anúncios"
                    secondary="Inserir anúncios e ver analytics"
                    primaryTypographyProps={{ fontWeight: 600 }}
                    secondaryTypographyProps={{
                      sx: { color: "rgba(255,255,255,0.6)" },
                    }}
                  />
                </ListItemButton>
              </ListItem>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 1 }} />
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    router.push("/pages/admin/brindes");
                    setOpen(false);
                  }}
                >
                  <CardGiftcardIcon sx={{ mr: 2, color: "white" }} />
                  <ListItemText
                    primary="Brindes"
                    secondary="Analytics de brindes por estande"
                    primaryTypographyProps={{ fontWeight: 600 }}
                    secondaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
                  />
                </ListItemButton>
              </ListItem>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 1 }} />
               <ListItem disablePadding>
                 <ListItemButton
                   onClick={() => {
                     router.push("/pages/admin/broadcast-notification");
                     setOpen(false);
                   }}
                 >
                   <CampaignIcon sx={{ mr: 2, color: "white" }} />

                   <ListItemText
                     primary="Enviar Notificação"
                     secondary="Notificar todos os usuários"
                     primaryTypographyProps={{ fontWeight: 600 }}
                     secondaryTypographyProps={{
                       sx: { color: "rgba(255,255,255,0.6)" },
                     }}
                   />
                 </ListItemButton>
               </ListItem>
             
             </>
           )}
      

          {/* <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 1 }} />

          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                console.log("Ir para ajuda");
                // router.push("/help")
              }}
            >
              <HelpOutlineIcon sx={{ mr: 2, color: "white" }} />

              <ListItemText
                primary="Ajuda"
                secondary="Suporte e dúvidas"
                primaryTypographyProps={{ fontWeight: 600 }}
                secondaryTypographyProps={{
                  sx: { color: "rgba(255,255,255,0.6)" },
                }}
              />
            </ListItemButton>
          </ListItem> */}

          <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

     

          {/* ───────── SAIR ───────── */}
          <Box display="flex" justifyContent="center" py={2}>
            <ListItemButton
              onClick={() => {
                logout();
                router.replace("/pages/auth/login");
              }}
              sx={{
                justifyContent: "center",
                gap: 1,
                color: "primary.main",
              }}
            >
              <LogoutIcon fontSize="small" />
              <Typography fontSize={14}>Sair</Typography>
            </ListItemButton>
          </Box>
        </List>
      </Drawer>
      {selectedEvent && (
        <>
          <ActivateEventModal
            open={activateModalOpen}
            eventTitle={selectedEvent.title}
            onClose={() => setActivateModalOpen(false)}
            onConfirm={handleActivate}
            loading={activating}
          />
          <DeactivateEventModal
            open={deactivateModalOpen}
            eventTitle={selectedEvent.title}
            onClose={() => setDeactivateModalOpen(false)}
            onConfirm={handleDeactivate}
            loading={deactivating}
          />
        </>
      )}

      <Menu
        anchorEl={menuAnchorEl}
        open={openMenu}
        onClose={handleCloseMenu}
        slotProps={{
          root: {
            sx: {
              zIndex: 1501,
            },
          },
          paper: {
            sx: {
              zIndex: 1501,
              minWidth: 180,
              backgroundColor: "rgba(26, 26, 26, 0.95)",
              backdropFilter: "blur(20px)",
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
            },
          },
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem
          onClick={() => {
            if (!menuEvent) return;
            handleCloseMenu();
            router.push(`/pages/admin/events/${menuEvent.id}`);
          }}
          sx={{
            color: "#fff",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.08)",
            },
          }}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" sx={{ color: "#fff" }} />
          </ListItemIcon>
          <ListItemText 
            primary="Detalhes"
            primaryTypographyProps={{
              sx: { color: "#fff", fontSize: "0.875rem" }
            }}
          />
        </MenuItem>
        <Divider
          sx={{
            my: 0.3,
            mx: 1.5,
            borderBottomWidth: "0.5px",
            borderColor: "rgba(255,255,255,0.1)",
          }}
        />

        {menuEvent && menuEvent.is_active === true ? (
          <MenuItem
            onClick={() => {
              if (!menuEvent) return;
              setSelectedEvent(menuEvent);
              setDeactivateModalOpen(true);
              handleCloseMenu();
            }}
            sx={{
              color: "#fff",
              "&:hover": {
                backgroundColor: "rgba(255, 68, 68, 0.1)",
              },
            }}
          >
            <ListItemIcon>
              <BlockIcon fontSize="small" sx={{ color: "#ff3040" }} />
            </ListItemIcon>
            <ListItemText 
              primary="Desativar evento"
              primaryTypographyProps={{
                sx: { color: "#fff", fontSize: "0.875rem" }
              }}
            />
          </MenuItem>
        ) : menuEvent && menuEvent.is_active === false ? (
          <MenuItem
            onClick={() => {
              if (!menuEvent) return;
              setSelectedEvent(menuEvent);
              setActivateModalOpen(true);
              handleCloseMenu();
            }}
            sx={{
              color: "#fff",
              "&:hover": {
                backgroundColor: "rgba(76, 175, 80, 0.1)",
              },
            }}
          >
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
            </ListItemIcon>
            <ListItemText 
              primary="Ativar evento"
              primaryTypographyProps={{
                sx: { color: "#fff", fontSize: "0.875rem" }
              }}
            />
          </MenuItem>
        ) : null}
      </Menu>
    </>
  );
}
