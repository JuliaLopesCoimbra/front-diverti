"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button, Box, Skeleton } from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MapIcon from "@mui/icons-material/Map";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import { getEvents, EventResponse } from "../../services/events/eventAppService";
import { formatEventDates } from "../../utils/eventDateFormatter";
import { useAuth } from "../../context/AuthContext";
import EventIndisponivelPublic from "@/app/components/event/EventIndisponivelPublic";
import ZoomableImageCarousel from "@/app/components/common/ZoomableImageCarousel";
import ZoomableImage from "@/app/components/common/ZoomableImage";

export default function EventPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { isAdmin } = useAuth();
  const title = params?.title_event as string; // Recebe o título da URL
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollExecutedRef = useRef(false);

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

  // Scroll para o line up quando houver o parâmetro scrollToLineup na URL
  useEffect(() => {
    const scrollToLineup = searchParams.get("scrollToLineup");
    
    if (!scrollToLineup || !event || loading || scrollExecutedRef.current) {
      return;
    }

    const tryScrollToLineup = () => {
      const lineupElement = document.getElementById("event-lineup-section");
      
      if (!lineupElement) {
        // Tenta novamente após um delay se o elemento ainda não estiver renderizado
        setTimeout(tryScrollToLineup, 200);
        return;
      }

      scrollExecutedRef.current = true;

      // Encontra o container scrollável
      let scrollContainer: HTMLElement | null = null;
      
      // Tenta encontrar por ID primeiro
      scrollContainer = document.getElementById("event-content-scroll-container");
      
      // Se não encontrar, procura pelo elemento scrollável mais próximo
      if (!scrollContainer) {
        let parent = lineupElement.parentElement;
        while (parent && parent !== document.body) {
          const hasScroll = parent.scrollHeight > parent.clientHeight;
          if (hasScroll || getComputedStyle(parent).overflowY !== "visible") {
            scrollContainer = parent;
            break;
          }
          parent = parent.parentElement;
        }
      }

      // Se ainda não encontrou, usa window
      if (!scrollContainer) {
        scrollContainer = document.documentElement;
      }

      // Função para fazer scroll e destacar
      const highlightAndScroll = () => {
        const rect = lineupElement.getBoundingClientRect();
        const containerRect = scrollContainer === document.documentElement 
          ? { top: 0, left: 0 } 
          : scrollContainer!.getBoundingClientRect();
        
        const scrollTop = scrollContainer === document.documentElement
          ? window.pageYOffset || document.documentElement.scrollTop
          : scrollContainer!.scrollTop;
        
        const targetScroll = scrollTop + rect.top - containerRect.top - 100; // 100px de margem

        // Aplica destaque visual
        lineupElement.style.borderLeft = "4px solid white";
        lineupElement.style.transition = "border-left 0.3s ease";

        // Faz scroll
        if (scrollContainer === document.documentElement) {
          window.scrollTo({
            top: targetScroll,
            behavior: "smooth",
          });
        } else {
          scrollContainer!.scrollTo({
            top: targetScroll,
            behavior: "smooth",
          });
        }

        // Remove o destaque após 3 segundos
        setTimeout(() => {
          lineupElement.style.borderLeft = "";
        }, 3000);

        // Remove o parâmetro da URL após 4.5 segundos
        setTimeout(() => {
          const url = new URL(window.location.href);
          url.searchParams.delete("scrollToLineup");
          window.history.replaceState({}, "", url.toString());
          scrollExecutedRef.current = false; // Permite scroll novamente se necessário
        }, 4500);
      };

      // Aguarda um pouco para garantir que o layout está estável
      setTimeout(highlightAndScroll, 100);
    };

    // Aguarda um pouco antes de tentar fazer scroll
    setTimeout(tryScrollToLineup, 300);
  }, [event, loading, searchParams]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f4f7fc",
          backgroundImage: "url(/background/dashboard.png)",
        }}
      >
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
            textAlign: "center",
          }}
        >
          {/* Banner Skeleton */}
          <Skeleton
            variant="rectangular"
            width={900}
            height={400}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2, maxWidth: "100%" }}
          />

          {/* Description Skeleton */}
          <Box sx={{ maxWidth: 700, width: "100%", padding: "30px" }}>
            <Skeleton
              variant="text"
              width="100%"
              height={20}
              sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 1 }}
            />
            <Skeleton
              variant="text"
              width="90%"
              height={20}
              sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 1 }}
            />
            <Skeleton
              variant="text"
              width="85%"
              height={20}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
          </Box>

          {/* Highlighted Text Skeleton */}
          <Box sx={{ maxWidth: 700, width: "100%", padding: "30px" }}>
            <Skeleton
              variant="rectangular"
              width="80%"
              height={40}
              sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1 }}
            />
          </Box>

          {/* Event Info Skeleton */}
          <Box
            sx={{
              maxWidth: 700,
              width: "100%",
              padding: "30px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {[1, 2, 3].map((index) => (
              <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Skeleton
                  variant="circular"
                  width={24}
                  height={24}
                  sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
                />
                <Skeleton
                  variant="text"
                  width={200}
                  height={20}
                  sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
                />
              </Box>
            ))}
          </Box>

          {/* Map Skeleton */}
          <Box sx={{ maxWidth: 700, width: "100%", padding: "20px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginBottom: 2 }}>
              <Skeleton
                variant="circular"
                width={24}
                height={24}
                sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
              />
              <Skeleton
                variant="text"
                width={150}
                height={24}
                sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
              />
            </Box>
            <Skeleton
              variant="rectangular"
              width="100%"
              height={400}
              sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}
            />
          </Box>

          {/* Line Up Skeleton */}
          <Box sx={{ maxWidth: 700, width: "100%", padding: "20px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginBottom: 2 }}>
              <Skeleton
                variant="circular"
                width={24}
                height={24}
                sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
              />
              <Skeleton
                variant="text"
                width={200}
                height={24}
                sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
              />
            </Box>
            <Skeleton
              variant="rectangular"
              width="100%"
              height={200}
              sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}
            />
          </Box>

          {/* Button Skeleton */}
          <Skeleton
            variant="rectangular"
            width={200}
            height={48}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: "30px", mt: 3, mb: 3 }}
          />
        </main>
      </div>
    );
  }

  if (!event) return <EventIndisponivelPublic />; // Se não houver evento ou se não for ativo, exibe o componente de evento indisponível

  // Formatação do horário
  const startDate = new Date(event.starts_at);
  const endDate = new Date(event.ends_at);

  // Formata horário para exibição (formato HH:mm)
  const formatTime = (timeStr: string | undefined): string => {
    if (!timeStr) return "";
    // Remove segundos se existirem (formato pode ser "HH:mm:ss" ou "HH:mm")
    return timeStr.substring(0, 5);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f7fc",
        backgroundImage: "url(/background/dashboard.png)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Container centralizado para desktop */}
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          display: "flex",
          flexDirection: "column",
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
          {event.banner_image && (
            <Box
              component="img"
              src={event.banner_image}
              alt={event.title}
              sx={{
                width: "100%",
                maxWidth: 700,
                maxHeight: 280,
                objectFit: "cover",
                borderRadius: 2,
              }}
            />
          )}

          {event.title && (
            <Box
              sx={{
                maxWidth: 700,
                width: "100%",
                marginTop: 3,
                padding: { xs: "20px", md: "30px" },
                textAlign: "center",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(24px, 5vw, 42px)",
                  fontWeight: 800,
                  color: "#FFD600",
                  textShadow: "2px 2px 8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 214, 0, 0.3)",
                  letterSpacing: "0.5px",
                  lineHeight: 1.2,
                  textTransform: "uppercase",
                }}
              >
                {event.title}
              </h1>
            </Box>
          )}

          <p
            style={{
              maxWidth: 700,
              marginTop: 2,
              fontSize: 16,
              padding: "30px",
              color: "#000",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            <span
              style={{
                color: "white",
                padding: "6px 10px",
                fontWeight: 600,
                display: "inline",
              }}
            >
              {event.description}
            </span>
          </p>

          <Box
            sx={{
              maxWidth: 700,
              width: "100%",
              padding: "30px",
              color: "white",
              display: "flex",
              flexDirection: "column",
              alignItems: { xs: "flex-start", md: "center" },
              gap: 1.5,
            }}
          >
            {/* DIAS DO EVENTO */}
            {event.event_dates && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EventIcon style={{ color: "yellow" }} />
                <p style={{ margin: 0, fontSize: 15 }}>
                  {formatEventDates(event)}
                </p>
              </Box>
            )}

            {/* DATA E HORÁRIO DE INÍCIO */}
            {event.starts_at && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AccessTimeIcon style={{ color: "yellow" }} />
                <p style={{ margin: 0, fontSize: 15 }}>
                  Início: {new Date(event.starts_at).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </Box>
            )}

            {/* DATA E HORÁRIO DE TÉRMINO */}
            {event.ends_at && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AccessTimeIcon style={{ color: "yellow" }} />
                <p style={{ margin: 0, fontSize: 15 }}>
                  Término: {new Date(event.ends_at).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </Box>
            )}

            {/* HORÁRIO DE IDA DAS VANS */}
            {(event.van_arrival_time_start || event.van_arrival_time_end) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <DirectionsBusIcon style={{ color: "yellow" }} />
                <p style={{ margin: 0, fontSize: 15 }}>
                  Ida das Vans: {event.van_arrival_time_start ? formatTime(event.van_arrival_time_start) : "?"} 
                  {event.van_arrival_time_start && event.van_arrival_time_end ? " às " : ""}
                  {event.van_arrival_time_end ? formatTime(event.van_arrival_time_end) : ""}
                </p>
              </Box>
            )}

            {/* HORÁRIO DE VOLTA DAS VANS */}
            {(event.van_departure_time_start || event.van_departure_time_end) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <DirectionsBusIcon style={{ color: "yellow" }} />
                <p style={{ margin: 0, fontSize: 15 }}>
                  Volta das Vans: {event.van_departure_time_start ? formatTime(event.van_departure_time_start) : "?"} 
                  {event.van_departure_time_start && event.van_departure_time_end ? " às " : ""}
                  {event.van_departure_time_end ? formatTime(event.van_departure_time_end) : ""}
                </p>
              </Box>
            )}

            {/* LOCAL */}
            {event.location && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocationOnIcon style={{ color: "yellow" }} />
                <p style={{ margin: 0, fontSize: 15 }}>{event.location}</p>
              </Box>
            )}
          </Box>

          {/* MEETING POINT */}
          {(event.meeting_point_location || (event.meeting_point_schedule && event.meeting_point_schedule.length > 0)) && (
            <Box
              sx={{
                maxWidth: 700,
                width: "100%",
                padding: "20px",
                marginTop: 2,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 2,
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginBottom: 2 }}>
                <MeetingRoomIcon style={{ color: "yellow" }} />
                <h3 style={{ margin: 0, color: "white", fontSize: 18, fontWeight: 600 }}>
                  Meeting Point
                </h3>
              </Box>

              {event.meeting_point_location && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginBottom: 2 }}>
                  <LocationOnIcon style={{ color: "yellow" }} />
                  <p style={{ margin: 0, fontSize: 15, color: "white" }}>{event.meeting_point_location}</p>
                </Box>
              )}

              {event.meeting_point_schedule && event.meeting_point_schedule.length > 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, alignItems: "flex-start" }}>
                  <p style={{ margin: 0, color: "white", fontSize: 15, fontWeight: 600, marginBottom: 8, textAlign: "left" }}>
                    Dias de Funcionamento:
                  </p>
                  {event.meeting_point_schedule.map((schedule, index) => (
                    <Box
                      key={index}
                      sx={{
                        padding: "12px",
                        backgroundColor: "rgba(0, 0, 0, 0.2)",
                        borderRadius: 1,
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginBottom: 1 }}>
                        <EventIcon style={{ color: "yellow", fontSize: 18 }} />
                        <p style={{ margin: 0, color: "white", fontSize: 14, fontWeight: 600 }}>
                          Dias {schedule.days.join(", ")} de fevereiro
                        </p>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <AccessTimeIcon style={{ color: "yellow", fontSize: 18 }} />
                        <p style={{ margin: 0, color: "white", fontSize: 14 }}>
                          Das {schedule.start_time} às {schedule.end_time}
                        </p>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* MAPA DO EVENTO */}
          {(event.map_images && event.map_images.length > 0) || event.image_map ? (
            <Box
              sx={{
                maxWidth: 700,
                width: "100%",
                padding: "20px",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, marginBottom: 2 }}>
                <MapIcon style={{ color: "yellow" }} />
                <h3 style={{ margin: 0, color: "white", fontSize: 18, fontWeight: 600 }}>
                  Mapa do Evento
                </h3>
              </Box>
              {event.map_images && event.map_images.length > 0 ? (
                <ZoomableImageCarousel
                  images={event.map_images.map(img => img.image_url)}
                  maxHeight={400}
                  borderRadius={2}
                />
              ) : event.image_map ? (
                <ZoomableImage
                  src={event.image_map}
                  alt="Mapa do Evento"
                  maxHeight={400}
                  borderRadius={2}
                />
              ) : null}
            </Box>
          ) : null}

          {/* BOTÃO VER LINE UP */}
          <Box
            sx={{
              maxWidth: 700,
              width: "100%",
              padding: "20px",
              display: "flex",
              justifyContent: "center",
            }}
          >
              <Button
                onClick={() => router.push(`/pages/events/${event.id}/lineup`)}
                startIcon={<MusicNoteIcon />}
                sx={{
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
                Ver Line Up
              </Button>
          </Box>

          {/* <Button
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
          </Button> */}
        </main>
      </div>
    </div>
  );
}
