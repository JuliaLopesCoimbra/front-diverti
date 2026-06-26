"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Skeleton, IconButton } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import { useAuth } from "@/app/context/AuthContext";
import BottomNav from "@/app/components/layout/BottomNav";
import HomeHeader from "@/app/components/home/HeaderHome";
import { EventResponse, getEvents } from "@/app/services/events/eventAppService";
import MyPosts from "@/app/components/my-posts/MyPosts";
import MyPhotos from "@/app/components/my-photos/MyPhotos";
import MenuOptions from "@/app/components/my-photos/MenuOptions";
import RejectedPosts from "@/app/components/my-posts/RejectedPosts";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

type ViewMode = "menu" | "posts" | "rejected" | "photos";
const STORAGE_KEY = "circuito_selectedEventId";

export default function MyPhotosPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isAdminMaster, isPatrocinador } = useAuth();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("menu");
  const [shouldAnimate, setShouldAnimate] = useState(true);
  
  // Para usuários comuns, sempre mostrar fotos diretamente
  const isRegularUser = !isAdminMaster && !isAdmin && !isPatrocinador;

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
    // Se não encontrou evento salvo, usa o primeiro disponível (preferencialmente ativo)
    const activeEvent = eventsList.find((event) => event.is_active);
    const selectedEvent = activeEvent || (eventsList.length > 0 ? eventsList[0] : null);
    if (selectedEvent) {
      setCurrentEvent(selectedEvent);
      localStorage.setItem(STORAGE_KEY, selectedEvent.id.toString());
    }
  }, []);

  // Função para verificar e atualizar eventos (similar à página home)
  const checkAndUpdateEvents = useCallback(async () => {
    try {
      const data = await getEvents();
      setEvents(data);
      
      if (currentEvent?.id) {
        const updatedEvent = data.find((event) => event.id === currentEvent.id);
        
        // Se o evento não foi encontrado (foi deletado), troca para um ativo
        if (!updatedEvent) {
          const activeEvent = data.find((event) => event.is_active);
          if (activeEvent) {
            setCurrentEvent(activeEvent);
            localStorage.setItem(STORAGE_KEY, activeEvent.id.toString());
          } else if (data.length > 0) {
            // Se não há eventos ativos, usa o primeiro disponível
            setCurrentEvent(data[0]);
            localStorage.setItem(STORAGE_KEY, data[0].id.toString());
          } else {
            // Não há eventos disponíveis
            setCurrentEvent(null);
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        // Se o evento atual foi desativado e o usuário NÃO é admin, troca para um ativo
        else if (!updatedEvent.is_active && !isAdmin) {
          const activeEvent = data.find((event) => event.is_active);
          if (activeEvent) {
            setCurrentEvent(activeEvent);
            localStorage.setItem(STORAGE_KEY, activeEvent.id.toString());
          }
        } else if (updatedEvent && updatedEvent.id !== currentEvent.id) {
          // Atualiza o evento atual com os dados mais recentes
          setCurrentEvent(updatedEvent);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar eventos:", error);
    }
  }, [currentEvent, isAdmin]);

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
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao carregar eventos", error);
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

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [isAuthenticated, events, currentEvent?.id, handleSelectEvent]);

  const handleSelectOption = (option: string) => {
    setViewMode(option as ViewMode);
  };

  const handleBackToMenu = () => {
    setViewMode("menu");
  };

  // Controla animações quando a página carrega ou viewMode muda
  useEffect(() => {
    setShouldAnimate(true);
    const timer = setTimeout(() => {
      setShouldAnimate(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [viewMode]);

  const renderContent = () => {
    if (isRegularUser) {
      // Usuários comuns veem apenas fotos baixadas
      return (
        <Box className={shouldAnimate ? "slide-up-delay-1" : ""}>
          <MyPhotos />
        </Box>
      );
    }

    // Admin e patrocinadores veem menu ou conteúdo específico
    switch (viewMode) {
      case "menu":
        return (
          <Box className={shouldAnimate ? "slide-up-delay-1" : ""}>
            <MenuOptions onSelectOption={handleSelectOption} />
          </Box>
        );
      case "posts":
        return (
          <Box
            className={shouldAnimate ? "slide-up-delay-1" : ""}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Box 
              display="flex" 
              alignItems="center" 
              gap={1} 
              padding={2} 
              paddingBottom={0}
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", md: "800px" },
              }}
            >
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
            <MyPosts hideTitle currentEvent={currentEvent} />
          </Box>
        );
      case "rejected":
        return (
          <Box
            className={shouldAnimate ? "slide-up-delay-1" : ""}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Box 
              display="flex" 
              alignItems="center" 
              gap={1} 
              padding={2} 
              paddingBottom={0}
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", md: "800px" },
              }}
            >
              <IconButton
                onClick={handleBackToMenu}
                sx={{ color: "#fff" }}
              >
                <ArrowBackIosIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <Typography variant="h6" fontWeight={500} sx={{ color: "#fff", fontSize: "1rem" }}>
                Posts Rejeitados por Mim
              </Typography>
            </Box>
            <RejectedPosts hideTitle currentEvent={currentEvent} />
          </Box>
        );
      case "photos":
        return (
          <Box
            className={shouldAnimate ? "slide-up-delay-1" : ""}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Box 
              display="flex" 
              alignItems="center" 
              gap={1} 
              padding={2} 
              paddingBottom={0}
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", md: "800px" },
              }}
            >
              <IconButton
                onClick={handleBackToMenu}
                sx={{ color: "#fff" }}
              >
                <ArrowBackIosIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <Typography variant="h6" fontWeight={500} sx={{ color: "#fff", fontSize: "1rem" }}>
                Fotos Baixadas
              </Typography>
            </Box>
            <MyPhotos hideTitle />
          </Box>
        );
      default:
        return (
          <Box className={shouldAnimate ? "slide-up-delay-1" : ""}>
            <MenuOptions onSelectOption={handleSelectOption} />
          </Box>
        );
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          ...dashboardBackgroundSx,
          paddingBottom: "88px",
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
        sx={{
          minHeight: "100vh",
          ...dashboardBackgroundSx,
          paddingBottom: "88px",
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
        sx={{
          minHeight: "100vh",
          ...dashboardBackgroundSx,
          paddingBottom: "88px",
        }}
      >
        {/* Header com nome, foto e data */}
        <Box className={shouldAnimate ? "slide-up-animation" : ""}>
          <HomeHeader
            event={currentEvent}
            events={events}
            currentEvent={currentEvent}
            onSelectEvent={handleSelectEvent}
          />
        </Box>

        {/* Conteúdo baseado no tipo de usuário */}
        {renderContent()}
      </Box>
      <BottomNav />
    </>
  );
}

