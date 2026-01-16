"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { Button, Box } from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MapIcon from "@mui/icons-material/Map";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { getEvents, EventResponse } from "../../services/events/eventAppService";
import EventIndisponivel from "../../components/event/EventIndisponivel";
import { formatEventDates } from "../../utils/eventDateFormatter";
import { useAuth } from "../../context/AuthContext";

export default function EventPage() {
  const router = useRouter();
  const params = useParams();
  const { isAdmin } = useAuth();
  const title = params?.title_event as string; // Recebe o título da URL
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!title) return; // Se não tiver o título, não faz nada ainda

    // Função para normalizar strings para comparação (remove acentos e converte para minúsculas)
    const normalizeString = (str: string): string => {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .trim();
    };

    // Função para converter título para formato URL
    const titleToUrl = (str: string): string => {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/ /g, "-")
        .trim();
    };

    // Função para buscar evento
    const fetchEvent = async () => {
      try {
        const events = await getEvents(); // Consumindo a função do service
        
        // Decodifica a URL caso tenha caracteres codificados
        const decodedTitle = decodeURIComponent(title);
        
        // Normaliza o título da URL para comparação
        const normalizedUrlTitle = normalizeString(decodedTitle.replace(/-/g, " "));
        
        // Busca o evento comparando os títulos
        const foundEvent = events.find((event) => {
          // Compara o título normalizado do evento com o título normalizado da URL
          const normalizedEventTitle = normalizeString(event.title);
          const eventTitleAsUrl = titleToUrl(event.title);
          
          // Múltiplas formas de comparação para garantir que encontre o evento
          return (
            normalizedEventTitle === normalizedUrlTitle ||
            eventTitleAsUrl === normalizeString(decodedTitle) ||
            normalizedEventTitle === normalizeString(decodedTitle.replace(/-/g, " "))
          );
        });

        if (!foundEvent) {
          // Caso o evento não seja encontrado, renderiza o componente de evento indisponível
          console.log("Evento não encontrado:", {
            urlTitle: decodedTitle,
            normalizedUrlTitle,
            availableEvents: events.map((e) => ({
              title: e.title,
              normalized: normalizeString(e.title),
              urlFormat: titleToUrl(e.title),
              is_active: e.is_active,
            })),
          });
          setEvent(null);
        } else if (!foundEvent.is_active && !isAdmin) {
          // Se o evento estiver inativo e o usuário não for admin/subadmin, renderiza o componente de evento indisponível
          setEvent(null);
        } else {
          // Admin/subadmin podem ver eventos desativados, usuários normais só veem ativos
          setEvent(foundEvent);
        }
      } catch (error) {
        console.error("Erro ao buscar evento:", error);
        setEvent(null); // Em caso de erro, considera o evento como indisponível
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [title]);

  if (loading) return <div>Carregando evento...</div>;

  if (!event) return <EventIndisponivel />; // Se não houver evento ou se não for ativo, exibe o componente de evento indisponível

  // Formatação do horário
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
            src="/logo/logo-n1.png"
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
          textAlign: "center",
        }}
      >
        <Image
          src={event.banner_image || "/components/dashboard-component.png"}
          alt={event.title}
          width={900}
          height={400}
          style={{ borderRadius: 12 }}
        />

        {event.description && (
          <p
            style={{
              maxWidth: 700,
              marginTop: 16,
              fontSize: 13,
              padding: "30px",
              color: "white",
              textAlign: "left",
            }}
          >
            {event.description}
          </p>
        )}

        <p
          style={{
            maxWidth: 700,
            marginTop: 2,
            fontSize: 16,
            padding: "30px",
            color: "#000",
            textAlign: "left",
            lineHeight: 1.6,
          }}
        >
          <span
            style={{
              backgroundColor: "#ffffff",
              padding: "6px 10px",
              fontWeight: 600,
              display: "inline",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}
          >
            Prepare-se para sapucar como nunca antes. Te esperamos na Avenida!
          </span>
        </p>

        <Box
          sx={{
            maxWidth: 700,
            padding: "30px",
            alignSelf: "flex-start",
            color: "white",
          }}
        >
          {/* DATA */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EventIcon style={{ color: "yellow" }} />
            <p style={{ margin: 0, fontSize: 15 }}>
              {formatEventDates(event)}
            </p>
          </Box>

          {/* HORÁRIO */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AccessTimeIcon style={{ color: "yellow" }} />
            <p style={{ margin: 0, fontSize: 15 }}>
              {formatTime(event.starts_at)}
            </p>
          </Box>

          {/* LOCAL */}
          {event.location && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LocationOnIcon style={{ color: "yellow" }} />
              <p style={{ margin: 0, fontSize: 15 }}>{event.location}</p>
            </Box>
          )}
        </Box>

        {/* MAPA DO EVENTO */}
        {event.image_map && (
          <Box
            sx={{
              maxWidth: 700,
              width: "100%",
             
              padding: "20px",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginBottom: 2 }}>
              <MapIcon style={{ color: "yellow" }} />
              <h3 style={{ margin: 0, color: "white", fontSize: 18, fontWeight: 600 }}>
                Mapa do Evento
              </h3>
            </Box>
            <Image
              src={event.image_map}
              alt="Mapa do Evento"
              width={700}
              height={400}
              style={{
                borderRadius: 12,
                width: "100%",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </Box>
        )}

        {/* LINE UP / PROGRAMAÇÃO */}
        {event.line_up && (
          <Box
            sx={{
              maxWidth: 700,
              width: "100%",
             
              padding: "20px",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginBottom: 2 }}>
              <MusicNoteIcon style={{ color: "yellow" }} />
              <h3 style={{ margin: 0, color: "white", fontSize: 18, fontWeight: 600 }}>
                Programação (Line Up)
              </h3>
            </Box>
            <Box
              sx={{
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 2,
                padding: 3,
                color: "white",
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                }}
              >
                {event.line_up}
              </pre>
            </Box>
          </Box>
        )}

        <Button
          onClick={() => router.push("/comprar")}
          sx={{
            marginTop: 3,
            backgroundColor: "#FFD600",
            color: "#000",
            fontWeight: 700,
            padding: "12px 32px",
            borderRadius: "30px",
            textTransform: "none",
            fontSize: 16,
            marginBottom: 3,
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            "&:hover": {
              backgroundColor: "#FFC400",
            },
          }}
        >
          Comprar ingressos
        </Button>
      </main>
    </div>
  );
}
