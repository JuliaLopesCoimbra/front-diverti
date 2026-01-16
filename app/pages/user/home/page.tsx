"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";
import HomeHeader from "@/app/components/home/HeaderHome";
import HomeTabs from "@/app/components/home/HomeTabs";
import BottomNav from "@/app/components/layout/BottomNav";
import { EventResponse, getEvents } from "@/app/services/events/eventAppService";
import { Skeleton } from "@mui/material";
import NewsFeed from "@/app/components/home/NewsFeed";
import CTVAd from "@/app/components/ads/CTVAd";
import EventDetails from "@/app/components/home/EventDetails";
import { useAuth } from "@/app/context/AuthContext";
import PhotoAI from "@/app/components/home/PhotoAI";
import Enredo from "@/app/components/home/Enredo";

const STORAGE_KEY = "selectedEventId";

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "home" | "eventos" | "foto" | "enredo"
  >("home");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventResponse | null>(null);
  const currentEventIdRef = useRef<number | null>(null);
  const router = useRouter();
  const { isAdmin, authReady } = useAuth();

  // Função para salvar evento selecionado no localStorage
  const handleSelectEvent = (event: EventResponse) => {
    localStorage.setItem(STORAGE_KEY, event.id.toString());
    setCurrentEvent(event);
    currentEventIdRef.current = event.id;
  };

  useEffect(() => {
    // Aguarda o contexto de autenticação estar pronto
    if (!authReady) return;

    const fetchEvents = async () => {
      try {
        const data = await getEvents();
        setEvents(data);
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
          const selectedEvent = activeEvent || data[0];
          setCurrentEvent(selectedEvent);
          currentEventIdRef.current = selectedEvent.id;
        }
      } catch {
        router.push("/");
      }
    };

    fetchEvents();

    // Verifica periodicamente se o evento atual foi desativado
    // Admin/subadmin podem permanecer em eventos desativados
    const interval = setInterval(async () => {
      try {
        const data = await getEvents();
        setEvents(data);
        
        const currentId = currentEventIdRef.current;
        if (currentId) {
          const updatedEvent = data.find((event) => event.id === currentId);
          // Se o evento atual foi desativado e o usuário NÃO é admin/subadmin, troca para um ativo
          if (updatedEvent && !updatedEvent.is_active && !isAdmin) {
            const activeEvent = data.find((event) => event.is_active);
            if (activeEvent) {
              setCurrentEvent(activeEvent);
              currentEventIdRef.current = activeEvent.id;
              localStorage.setItem(STORAGE_KEY, activeEvent.id.toString());
            }
          } else if (updatedEvent) {
            // Atualiza o evento atual com os dados mais recentes
            setCurrentEvent(updatedEvent);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar eventos:", error);
      }
    }, 5000); // Verifica a cada 5 segundos

    return () => clearInterval(interval);
  }, [router, isAdmin, authReady]);

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
        />

        {/* Tabs */}
        <HomeTabs active={activeTab} onChange={setActiveTab} />

        {/* Conteúdo baseado na aba selecionada */}
        {activeTab === "home" && currentEvent && (
          <>
            <CTVAd />
            <NewsFeed eventId={currentEvent.id} event={currentEvent} />
          </>
        )}
        {activeTab === "eventos" && <EventDetails event={currentEvent} />}

        {activeTab === "foto" && currentEvent && (
          <PhotoAI eventId={currentEvent.id} />
        )}

        {activeTab === "enredo" && currentEvent && (
          <Enredo eventId={currentEvent.id} />
        )}
      </Box>
      <BottomNav />
    </>
  );
};

export default Home;
