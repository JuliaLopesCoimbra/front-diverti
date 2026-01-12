"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button, Box } from "@mui/material";
import { useRouter } from "next/navigation";
import { getEvents, EventResponse } from "./services/events/eventService";
import EventIndisponivel from "./components/event/EventIndisponivel";

export default function HomePage() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
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
        const events = await getEvents(); // Chama o serviço para pegar os eventos
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

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f4f7fc",
          backgroundImage: "url(/background/dashboard.png)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        Carregando eventos...
      </div>
    );
  }

  // Se não houver eventos ou todos estiverem indisponíveis, mostra o componente EventIndisponivel
  if (events.length === 0) {
    return <EventIndisponivel />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f7fc",
        backgroundImage: "url(/background/dashboard.png)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 32px",
        }}
      >
        {/* LOGO + TEXTO */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image
            src="/logo/logon1.png"
            alt="Camarote N1"
            width={60}
            height={60}
          />
          <strong style={{ fontSize: 22, color: "white" }}>Camarote N1</strong>
        </div>
        <Button
          onClick={() => router.push("/pages/auth/login")}
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
      </div>

      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "32px",
        }}
      >
    

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            width: "100%",
            maxWidth: 900,
          }}
        >
          {events.map((event) => (
            <Box
              key={event.id}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: 3,
                width: "100%",
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                },
              }}
              onClick={() => {
                router.push(`/pages/${normalizeForUrl(event.title)}`);
              }}
            >
              <Image
                src={event.banner_image || "/components/dashboard-component.png"}
                alt={event.title}
                width={900}
                height={400}
                style={{
                  borderRadius: 12,
                  objectFit: "cover",
                  width: "100%",
                  height: "auto",
                }}
              />
              <h2
                style={{
                  marginTop: 16,
                  marginBottom: 8,
                  fontSize: 24,
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
                    fontSize: 14,
                    color: "white",
                    textAlign: "center",
                    maxWidth: 700,
                    lineHeight: 1.6,
                  }}
                >
                  {event.description}
                </p>
              )}
              <Button
                sx={{
                  marginTop: 2,
                  backgroundColor: "#FFD600",
                  color: "#000",
                  fontWeight: 700,
                  padding: "12px 32px",
                  borderRadius: "30px",
                  textTransform: "none",
                  fontSize: 16,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                  "&:hover": {
                    backgroundColor: "#FFC400",
                  },
                }}
              >
                Ver Evento
              </Button>
            </Box>
          ))}
        </div>
      </main>
    </div>
  );
}
