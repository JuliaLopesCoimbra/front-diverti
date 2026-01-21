"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Skeleton, IconButton, Tabs, Tab } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import { useAuth } from "@/app/context/AuthContext";
import BottomNav from "@/app/components/layout/BottomNav";
import HomeHeader from "@/app/components/home/HeaderHome";
import { EventResponse, getEvents } from "@/app/services/events/eventAppService";
import MyPosts from "@/app/components/my-posts/MyPosts";
import MyPhotos from "@/app/components/my-photos/MyPhotos";
import MyPendingPosts from "@/app/components/my-posts/MyPendingPosts";
import MenuOptions from "@/app/components/my-photos/MenuOptions";

type ViewMode = "menu" | "posts" | "photos" | "pending";
const STORAGE_KEY = "selectedEventId";

export default function MyPhotosPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isAdminMaster, isSubadmin, isColunista } = useAuth();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("menu");
  const [postStatusFilter, setPostStatusFilter] = useState<"approved" | "pending" | "rejected">("approved");
  
  // Para usuários comuns, sempre mostrar fotos diretamente
  const isRegularUser = !isAdminMaster && !isSubadmin && !isColunista;

  // Função para atualizar o evento atual baseado no localStorage
  const updateCurrentEventFromStorage = useCallback((eventsList: EventResponse[]) => {
    const savedEventId = localStorage.getItem(STORAGE_KEY);
    if (savedEventId) {
      const savedId = parseInt(savedEventId, 10);
      const savedEvent = eventsList.find((event) => event.id === savedId);
      if (savedEvent) {
        setCurrentEvent(savedEvent);
        return;
      }
    }
    // Se não encontrou evento salvo, usa o primeiro disponível
    if (eventsList.length > 0) {
      setCurrentEvent(eventsList[0]);
      localStorage.setItem(STORAGE_KEY, eventsList[0].id.toString());
    }
  }, []);

  // Função para lidar com seleção de evento
  const handleSelectEvent = useCallback((event: EventResponse) => {
    localStorage.setItem(STORAGE_KEY, event.id.toString());
    setCurrentEvent(event);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/pages/auth/login");
      return;
    }

    // Para usuários comuns, definir viewMode como "photos" diretamente
    if (isRegularUser) {
      setViewMode("photos");
    }

    // Carrega eventos para o header
    getEvents()
      .then((data) => {
        setEvents(data);
        updateCurrentEventFromStorage(data);
      })
      .catch((error) => {
        console.error("Erro ao carregar eventos", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isAuthenticated, router, isRegularUser, updateCurrentEventFromStorage]);

  // Escuta mudanças no localStorage (quando o evento é alterado em outra aba/componente)
  useEffect(() => {
    if (!isAuthenticated || events.length === 0) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newEventId = parseInt(e.newValue, 10);
        const newEvent = events.find((event) => event.id === newEventId);
        if (newEvent && newEvent.id !== currentEvent?.id) {
          handleSelectEvent(newEvent);
        }
      }
    };

    // Escuta mudanças no localStorage de outras abas/janelas
    window.addEventListener("storage", handleStorageChange);

    // Também verifica mudanças na mesma aba (polling mais eficiente)
    const checkInterval = setInterval(() => {
      const savedEventId = localStorage.getItem(STORAGE_KEY);
      if (savedEventId) {
        const savedId = parseInt(savedEventId, 10);
        if (currentEvent?.id !== savedId) {
          const savedEvent = events.find((event) => event.id === savedId);
          if (savedEvent) {
            handleSelectEvent(savedEvent);
          }
        }
      }
    }, 1000); // Verifica a cada 1 segundo (mais eficiente)

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(checkInterval);
    };
  }, [isAuthenticated, events, currentEvent?.id, handleSelectEvent]);

  const handleSelectOption = (option: string) => {
    setViewMode(option as ViewMode);
  };

  const handleBackToMenu = () => {
    setViewMode("menu");
  };

  const renderContent = () => {
    // Container centralizado para desktop
    const CenteredContainer = ({ children }: { children: ReactNode }) => (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: { xs: "100%", sm: "100%", md: "600px", lg: "700px" },
          }}
        >
          {children}
        </Box>
      </Box>
    );

    if (isRegularUser) {
      // Usuários comuns veem apenas fotos compradas
      return (
        <CenteredContainer>
          <MyPhotos />
        </CenteredContainer>
      );
    }

    // Admin, subadmin e colunistas veem menu ou conteúdo específico
    switch (viewMode) {
      case "menu":
        return (
          <CenteredContainer>
            <MenuOptions onSelectOption={handleSelectOption} />
          </CenteredContainer>
        );
      case "posts":
        return (
          <CenteredContainer>
            <Box>
              <Box display="flex" alignItems="center" gap={1} padding={2} paddingBottom={0}>
                <IconButton
                  onClick={handleBackToMenu}
                  sx={{ color: "#fff" }}
                >
                  <ArrowBackIosIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Typography variant="h6" fontWeight={500} sx={{ color: "#fff", fontSize: "1rem" }}>
                  Meus Posts
                </Typography>
              </Box>
              <Box sx={{ borderBottom: 1, borderColor: "rgba(255,255,255,0.2)", px: 2 }}>
                <Tabs
                  value={postStatusFilter}
                  onChange={(_, newValue) => setPostStatusFilter(newValue)}
                  sx={{
                    "& .MuiTab-root": {
                      color: "rgba(255,255,255,0.6)",
                      textTransform: "none",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      minHeight: 48,
                      "&.Mui-selected": {
                        color: "#ffc91f",
                      },
                    },
                    "& .MuiTabs-indicator": {
                      backgroundColor: "#ffc91f",
                    },
                  }}
                >
                  <Tab label="Aprovados" value="approved" />
                  <Tab label="Pendentes" value="pending" />
                  <Tab label="Rejeitados" value="rejected" />
                </Tabs>
              </Box>
              <MyPosts hideTitle currentEvent={currentEvent} statusFilter={postStatusFilter} />
            </Box>
          </CenteredContainer>
        );
      case "photos":
        return (
          <CenteredContainer>
            <Box>
              <Box display="flex" alignItems="center" gap={1} padding={2} paddingBottom={0}>
                <IconButton
                  onClick={handleBackToMenu}
                  sx={{ color: "#fff" }}
                >
                  <ArrowBackIosIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Typography variant="h6" fontWeight={500} sx={{ color: "#fff", fontSize: "1rem" }}>
                  Fotos Compradas
                </Typography>
              </Box>
              <MyPhotos hideTitle />
            </Box>
          </CenteredContainer>
        );
      case "pending":
        return (
          <CenteredContainer>
            <Box>
              <Box display="flex" alignItems="center" gap={1} padding={2} paddingBottom={0}>
                <IconButton
                  onClick={handleBackToMenu}
                  sx={{ color: "#fff" }}
                >
                  <ArrowBackIosIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Typography variant="h6" fontWeight={500} sx={{ color: "#fff", fontSize: "1rem" }}>
                  Posts Pendentes
                </Typography>
              </Box>
              <MyPendingPosts hideTitle />
            </Box>
          </CenteredContainer>
        );
      default:
        return (
          <CenteredContainer>
            <MenuOptions onSelectOption={handleSelectOption} />
          </CenteredContainer>
        );
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <Box
        style={{
          minHeight: "100vh",
          paddingBottom: "72px",
          backgroundColor: "#f4f7fc",
          backgroundImage: "url(/background/dashboard.png)",
        }}
      >
        {/* Header Skeleton */}
        <Box
          sx={{
            padding: 2,
            borderBottom: "solid 1px rgba(255,255,255,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Skeleton
                variant="rectangular"
                width={40}
                height={40}
                sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1 }}
              />
              <Skeleton
                variant="text"
                width={150}
                height={32}
                sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
              />
            </Box>
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.4,
            }}
          >
            <Skeleton
              variant="text"
              width={200}
              height={24}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
            <Skeleton
              variant="text"
              width={120}
              height={20}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
          </Box>
        </Box>

        {/* Content Skeleton */}
        <Box padding={2}>
          <Skeleton
            variant="text"
            width={200}
            height={32}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 2 }}
          />
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(1, 1fr)", gap: 2 }}>
            {[1, 2, 3, 4].map((item) => (
              <Skeleton
                key={item}
                variant="rectangular"
                width="100%"
                height={200}
                sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  if (!currentEvent) {
    return (
      <Box
        style={{
          minHeight: "100vh",
          paddingBottom: "72px",
          backgroundColor: "#f4f7fc",
          backgroundImage: "url(/background/dashboard.png)",
        }}
      >
        {/* Header Skeleton */}
        <Box
          sx={{
            padding: 2,
            borderBottom: "solid 1px rgba(255,255,255,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Skeleton
                variant="rectangular"
                width={40}
                height={40}
                sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1 }}
              />
              <Skeleton
                variant="text"
                width={150}
                height={32}
                sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
              />
            </Box>
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.4,
            }}
          >
            <Skeleton
              variant="text"
              width={200}
              height={24}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
            <Skeleton
              variant="text"
              width={120}
              height={20}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
          </Box>
        </Box>

        {/* Content Skeleton */}
        <Box padding={2}>
          <Skeleton
            variant="text"
            width={200}
            height={32}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 2 }}
          />
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
            {[1, 2, 3, 4].map((item) => (
              <Skeleton
                key={item}
                variant="rectangular"
                width="100%"
                height={200}
                sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Box
        style={{
          minHeight: "100vh",
          paddingBottom: "72px",
          backgroundColor: "#f4f7fc",
          backgroundImage: "url(/background/dashboard.png)",
        }}
      >
        {/* Header com nome, foto e data */}
        <HomeHeader
          event={currentEvent}
          events={events}
          currentEvent={currentEvent}
          onSelectEvent={handleSelectEvent}
        />

        {/* Conteúdo baseado no tipo de usuário */}
        {renderContent()}
      </Box>
      <BottomNav />
    </>
  );
}

