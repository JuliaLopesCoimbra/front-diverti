"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";
import HomeHeader from "@/app/components/home/HeaderHome";
import HomeTabs from "@/app/components/home/HomeTabs";
import BottomNav from "@/app/components/layout/BottomNav";
import { EventResponse, getEvents } from "@/app/services/events/eventAppService";
import { Skeleton } from "@mui/material";
import NewsFeed from "@/app/components/home/NewsFeed";
import AdBanner from "@/app/components/ads/AdBanner";
import EventDetails from "@/app/components/home/EventDetails";
import { useAuth } from "@/app/context/AuthContext";
import PhotoAI from "@/app/components/home/PhotoAI";
import Enredo from "@/app/components/home/Enredo";
import EventIndisponivel from "@/app/components/event/EventIndisponivel";
import { getProfile, ProfileResponse } from "@/app/services/profile/profileService";

const STORAGE_KEY = "selectedEventId";
const SCROLL_KEY = "homeScrollY";
const TAB_KEY = "homeActiveTab";

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "home" | "eventos" | "foto" | "enredo"
  >(() => {
    if (typeof window === "undefined") return "home";
    const saved = sessionStorage.getItem(TAB_KEY);
    if (saved === "home" || saved === "eventos" || saved === "foto" || saved === "enredo") {
      return saved;
    }
    return "home";
  });
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventResponse | null>(null);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const currentEventIdRef = useRef<number | null>(null);
  const isCheckingRef = useRef(false); // Previne múltiplas verificações simultâneas
  const router = useRouter();
  const { isAdmin, authReady } = useAuth();

  // Persist tab selection
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(TAB_KEY, activeTab);
    }
  }, [activeTab]);

  // Função para verificar e atualizar eventos
  const checkAndUpdateEvents = useCallback(async () => {
    // Previne múltiplas chamadas simultâneas
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      const data = await getEvents();
      setEvents(data);
      
      const currentId = currentEventIdRef.current;
      if (currentId) {
        const updatedEvent = data.find((event) => event.id === currentId);
          
        // Se o evento não foi encontrado (foi deletado), troca para um ativo
        if (!updatedEvent) {
          const activeEvent = data.find((event) => event.is_active);
          if (activeEvent) {
            setCurrentEvent(activeEvent);
            currentEventIdRef.current = activeEvent.id;
            localStorage.setItem(STORAGE_KEY, activeEvent.id.toString());
          } else {
            // Não há eventos disponíveis
            setCurrentEvent(null);
            currentEventIdRef.current = null;
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        // Se o evento atual foi desativado e o usuário NÃO é admin/subadmin, troca para um ativo
        else if (!updatedEvent.is_active && !isAdmin) {
          const activeEvent = data.find((event) => event.is_active);
          if (activeEvent) {
            setCurrentEvent(activeEvent);
            currentEventIdRef.current = activeEvent.id;
            localStorage.setItem(STORAGE_KEY, activeEvent.id.toString());
          } else {
            // Não há eventos ativos disponíveis para usuário não-admin
            setCurrentEvent(null);
            currentEventIdRef.current = null;
          }
        } else if (updatedEvent) {
          // Atualiza o evento atual com os dados mais recentes
          setCurrentEvent(updatedEvent);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar eventos:", error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [isAdmin]);

  // Função para salvar evento selecionado no localStorage
  const handleSelectEvent = (event: EventResponse) => {
    localStorage.setItem(STORAGE_KEY, event.id.toString());
    setCurrentEvent(event);
    currentEventIdRef.current = event.id;
    // Verifica eventos quando o usuário troca manualmente
    checkAndUpdateEvents();
  };

  useEffect(() => {
    // restaura scroll salvo
    const savedScroll = sessionStorage.getItem(SCROLL_KEY);
    if (savedScroll) {
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(savedScroll, 10) || 0);
      });
    }
    const onScroll = () => sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    window.addEventListener("scroll", onScroll);

    // Se BottomNav marcou para restaurar home (volta da my-photos/liked), não mudar aba
    // Caso contrário, deixar aba conforme saved/default
    const forceRestore = sessionStorage.getItem("forceHomeRestore");
    if (forceRestore) {
      sessionStorage.removeItem("forceHomeRestore");
    }

    // Aguarda o contexto de autenticação estar pronto
    if (!authReady) {
      return () => window.removeEventListener("scroll", onScroll);
    }

    // Carrega o perfil do usuário
    const fetchProfile = async () => {
      try {
        const profileData = await getProfile();
        setProfile(profileData);
        setProfileLoaded(true);
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        setProfileLoaded(true); // Marca como carregado mesmo em caso de erro para não travar a tela
      }
    };

    const fetchEvents = async () => {
      try {
        const data = await getEvents();
        setEvents(data);
        setEventsLoaded(true);
        
        if (data.length > 0) {
          // Tenta carregar o evento salvo do localStorage
          const savedEventId = localStorage.getItem(STORAGE_KEY);
          if (savedEventId) {
            const savedId = parseInt(savedEventId, 10);
            const savedEvent = data.find((event) => event.id === savedId);
            if (savedEvent) {
              // Se o evento salvo foi desativado e o usuário NÃO é admin/subadmin, troca para um ativo
              if (!savedEvent.is_active && !isAdmin) {
                const activeEvent = data.find((event) => event.is_active);
                if (activeEvent) {
                  setCurrentEvent(activeEvent);
                  currentEventIdRef.current = activeEvent.id;
                  localStorage.setItem(STORAGE_KEY, activeEvent.id.toString());
                } else {
                  // Não há eventos ativos, mas mantém o evento salvo para admin
                  setCurrentEvent(savedEvent);
                  currentEventIdRef.current = savedEvent.id;
                }
              } else {
                // Admin/subadmin podem permanecer em eventos desativados
                setCurrentEvent(savedEvent);
                currentEventIdRef.current = savedEvent.id;
              }
              return;
            }
          }
          // Se não encontrou evento salvo ou não existe mais, usa o primeiro ativo ou o primeiro disponível
          const activeEvent = data.find((event) => event.is_active);
          const selectedEvent = activeEvent || (isAdmin ? data[0] : null);
          if (selectedEvent) {
            setCurrentEvent(selectedEvent);
            currentEventIdRef.current = selectedEvent.id;
          }
        } else {
          // Não há eventos disponíveis
          setEventsLoaded(true);
        }
      } catch {
        setEventsLoaded(true);
        router.push("/");
      }
    };

    // Carrega eventos e perfil em paralelo
    Promise.all([fetchEvents(), fetchProfile()]);

    // Verifica quando a página/aba fica visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndUpdateEvents();
      }
    };

    // Verifica quando a janela ganha foco
    const handleFocus = () => {
      checkAndUpdateEvents();
    };

    // Adiciona listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener("scroll", onScroll);
    };
  }, [router, isAdmin, authReady, checkAndUpdateEvents]);

  // Se não há eventos ativos disponíveis para usuário não-admin, mostra Evento Indisponível
  if (eventsLoaded && !currentEvent) {
    const hasActiveEvents = events.some((event) => event.is_active);
    if (!isAdmin && !hasActiveEvents) {
      return <EventIndisponivel />;
    }
  }

  // Mostra skeleton até que tanto o evento quanto o perfil estejam carregados
  if (!currentEvent || !profileLoaded) {
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

        {/* Tabs Skeleton */}
        <Box sx={{ display: "flex", gap: 1, padding: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width={100}
              height={36}
              sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: "999px" }}
            />
          ))}
        </Box>

        {/* Content Skeleton */}
        <Box padding={2}>
          <Skeleton
            variant="rectangular"
            width="100%"
            height={200}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2, mb: 2 }}
          />
          <Skeleton
            variant="rectangular"
            width="100%"
            height={150}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Box
        style={{
          minHeight: "100vh",
          paddingBottom: "72px", // espaço pro rodapé
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
          profile={profile}
        />

        {/* Tabs */}
        <HomeTabs active={activeTab} onChange={setActiveTab} />

        {/* Conteúdo baseado na aba selecionada */}
        {activeTab === "home" && currentEvent && (
          <>
            <AdBanner />
            <NewsFeed eventId={currentEvent.id} event={currentEvent} />
          </>
        )}
        {activeTab === "eventos" && <EventDetails event={currentEvent} />}

        {activeTab === "foto" && currentEvent && (
          <PhotoAI eventId={currentEvent.id} />
        )}

        {activeTab === "enredo" && currentEvent && (
          <Enredo eventId={currentEvent.id} spotifyPlaylistUrl={currentEvent.spotify_playlist_url} />
        )}
      </Box>
      <BottomNav />
    </>
  );
};

export default Home;
