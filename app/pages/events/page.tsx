"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button, Box, Skeleton } from "@mui/material";
import { useRouter } from "next/navigation";
import { getPublicEvents, EventResponse } from "@/app/services/events/eventAppService";
import EventIndisponivelPublic from "@/app/components/event/EventIndisponivelPublic";

export default function EventsPage() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const router = useRouter();

  // Função para normalizar título para URL
  const normalizeForUrl = (str: string): string => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/ /g, "-")
      .trim();
  };

  // Carrega os eventos ao montar o componente
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const events = await getPublicEvents(); // Chama o endpoint público para pegar os eventos
        const activeEvents = events.filter((event: EventResponse) => event.is_active); // Filtra eventos ativos
        setEvents(activeEvents);
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        setEvents([]); // Em caso de erro, define como array vazio
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Controla animações quando a página carrega
  useEffect(() => {
    if (!loading) {
      setShouldAnimate(true);
      const timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="dashboard-page-background" style={{ minHeight: "100vh" }}>
        {/* Header Skeleton */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Skeleton
              variant="rectangular"
              width={60}
              height={60}
              sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1 }}
            />
            <Skeleton
              variant="text"
              width={180}
              height={32}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
          </div>
          <Skeleton
            variant="rectangular"
            width={80}
            height={36}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1 }}
          />
        </div>

        {/* Main Content Skeleton */}
        <main
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px",
            minHeight: "calc(100vh - 100px)",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(auto-fit, minmax(320px, 1fr))",
                md: "repeat(auto-fit, minmax(380px, 1fr))",
              },
              gap: { xs: 24, md: 32 },
              width: "100%",
              maxWidth: { xs: "100%", md: 1200 },
              justifyContent: "center",
            }}
          >
            {/* Event Card Skeletons */}
            {[1, 2].map((index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: { xs: 2, md: 2.5 },
                  width: "100%",
                  maxWidth: { xs: "100%", md: 450 },
                }}
              >
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.1)",
                    borderRadius: 2,
                    height: { xs: 240, md: 280 },
                  }}
                />
                <Skeleton
                  variant="text"
                  width="60%"
                  height={28}
                  sx={{ bgcolor: "rgba(255,255,255,0.1)", mt: 2, mb: 1 }}
                />
                <Skeleton
                  variant="text"
                  width="90%"
                  height={18}
                  sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 0.5 }}
                />
                <Skeleton
                  variant="text"
                  width="75%"
                  height={18}
                  sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 2 }}
                />
                <Skeleton
                  variant="rectangular"
                  width={120}
                  height={40}
                  sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: "30px", mt: 1 }}
                />
              </Box>
            ))}
          </Box>
        </main>
      </div>
    );
  }

  // Se não houver eventos ou todos estiverem indisponíveis, mostra o componente EventIndisponivel
  if (events.length === 0) {
    return <EventIndisponivelPublic />;
  }

  return (
    <div className="dashboard-page-background" style={{ minHeight: "100vh" }}>
      <Box
        className={shouldAnimate ? "slide-up-animation" : ""}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 32px",
        }}
      >
        {/* LOGO + TEXTO */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image
            src="/logo/logo-n1.png"
            alt="Camarote N1"
            width={60}
            height={60}
          />
          <strong style={{ fontSize: 22, color: "white" }}>Camarote N1</strong>
        </div>
        <Button
          onClick={() => router.push("/")}
          sx={{
            color: "white",
            textTransform: "none",
            fontWeight: 500,
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.1)",
            },
          }}
        >
          Login
        </Button>
      </Box>

      <main
        className={shouldAnimate ? "slide-up-delay-1" : ""}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
          minHeight: "calc(100vh - 100px)",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: events.length === 1 
                ? "1fr" 
                : "repeat(auto-fit, minmax(320px, 1fr))",
              md: events.length === 1 
                ? "1fr" 
                : "repeat(auto-fit, minmax(380px, 1fr))",
            },
            gap: { xs: 6, md: 12 },
            width: "100%",
            maxWidth: { xs: "100%", md: 1200 },
            justifyContent: "center",
            justifyItems: events.length === 1 ? "center" : "stretch",
          }}
        >
          {events.map((event) => (
            <Box
              key={event.id}
              className={shouldAnimate ? "slide-up-delay-2" : ""}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: { xs: 2, md: 2.5 },
                width: "100%",
                maxWidth: { 
                  xs: "100%", 
                  md: events.length === 1 ? 450 : 450 
                },
                margin: events.length === 1 ? { xs: "0 auto", md: "0 auto" } : "0",
                cursor: "pointer",
                transition: "all 0.3s ease",
                borderRadius: 2,
            
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                "&:hover": {
                  transform: { xs: "translateY(-2px)", md: "translateY(-6px) scale(1.02)" },
                  boxShadow: "0 12px 24px rgba(0,0,0,0.3)",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  "& .event-image": {
                    transform: "scale(1.1)",
                  },
                },
              }}
              onClick={() => {
                router.push(`/pages/${normalizeForUrl(event.title)}`);
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: { xs: 240, md: 280 },
                  position: "relative",
                  borderRadius: 2,
                  overflow: "hidden",
                  
                }}
              >
                <Image
                  src={event.banner_image ? encodeURI(event.banner_image) : "/components/dashboard-component.png"}
                  alt={event.title}
                  fill
                  className="event-image"
                  unoptimized={true}
                  style={{
                    objectFit: "cover",
                    transition: "transform 0.3s ease",
                  }}
                />
              </Box>
              <h2
                style={{
                  marginTop: 16,
                  marginBottom: 8,
                  fontSize: 20,
                  fontWeight: 700,
                  color: "white",
                  textAlign: "center",
                }}
              >
                {event.title}
              </h2>
              {event.description && (
                <p
                  style={{
                    marginTop: 8,
                    marginBottom: 16,
                    fontSize: 13,
                    color: "rgba(255, 255, 255, 0.9)",
                    textAlign: "center",
                    maxWidth: "100%",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {event.description}
                </p>
              )}
              <Button
                sx={{
                  marginTop: 1,
                  backgroundColor: "#FFD600",
                  color: "#000",
                  fontWeight: 700,
                  padding: { xs: "10px 24px", md: "10px 28px" },
                  borderRadius: "30px",
                  textTransform: "none",
                  fontSize: { xs: 14, md: 15 },
                  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "#FFC400",
                    transform: "scale(1.05)",
                    boxShadow: "0 6px 16px rgba(255, 214, 0, 0.4)",
                  },
                }}
              >
                Ver Evento
              </Button>
            </Box>
          ))}
        </Box>
      </main>
    </div>
  );
}



