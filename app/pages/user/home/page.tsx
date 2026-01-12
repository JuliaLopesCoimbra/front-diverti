"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";
import HomeHeader from "@/app/components/home/HeaderHome";
import HomeTabs from "@/app/components/home/HomeTabs";
import BottomNav from "@/app/components/layout/BottomNav";
import { EventResponse, getEvents } from "@/app/services/events/eventService";
import { CircularProgress, Typography } from "@mui/material";
import NewsFeed from "@/app/components/home/NewsFeed";
import CTVAd from "@/app/components/ads/CTVAd";
import EventDetails from "@/app/components/home/EventDetails";

import PhotoAI from "@/app/components/home/PhotoAI";
import Enredo from "@/app/components/home/Enredo";

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "home" | "eventos" | "foto" | "enredo"
  >("home");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventResponse | null>(null);
  const router = useRouter();

  useEffect(() => {
    getEvents()
      .then((data) => {
        setEvents(data);
        if (data.length > 0) {
          setCurrentEvent(data[0]);
        }
      })
      .catch(() => {
        router.push("/");
      });
  }, [router]);

  if (!currentEvent) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        gap={2}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Carregando evento...
        </Typography>
      </Box>
    );
  }

  if (!currentEvent) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        gap={2}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Carregando evento...
        </Typography>
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
          onSelectEvent={setCurrentEvent}
        />

        {/* Tabs */}
        <HomeTabs active={activeTab} onChange={setActiveTab} />

        {/* Conteúdo baseado na aba selecionada */}
        {activeTab === "home" && currentEvent && (
          <>
            <CTVAd />
            <NewsFeed eventId={currentEvent.id} />
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
