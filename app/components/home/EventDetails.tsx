"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Box, Button, Typography } from "@mui/material";
import { EventResponse } from "@/app/services/events/eventAppService";
import { useFeedCache } from "@/app/context/FeedCacheContext";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventIcon from "@mui/icons-material/Event";
import FestivalIcon from "@mui/icons-material/Festival";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import { formatEventDates } from "@/app/utils/eventDateFormatter";

interface Props {
  event: EventResponse;
}

export default function EventDetails({ event }: Props) {
  // ===== SCROLL RESTORATION (Instagram/TikTok style) =====
  const { getCache, setCache } = useFeedCache();
  const cacheKey = `event-details-${event.id}`;
  const lastScrollPositionRef = useRef(0);
  const searchParams = useSearchParams();
  const scrollExecutedRef = useRef(false);
  const router = useRouter();
  
  // Restaura scroll ao montar
  useEffect(() => {
   
    const cached = getCache(cacheKey);
    
    if (cached && cached.scrollPosition > 0) {
      console.log('âœ… [EventDetails] Cache encontrado! Scroll:', cached.scrollPosition);
      const targetPosition = cached.scrollPosition;
      
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      
      let attempts = 0;
      const maxAttempts = 20;
      
      const attemptRestore = () => {
        attempts++;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'instant' as ScrollBehavior
        });
        
        const currentScroll = window.scrollY;
        const diff = Math.abs(currentScroll - targetPosition);
        
        if (diff < 10) {
          console.log(`âœ… [EventDetails] SUCESSO! Scroll restaurado em ${attempts} tentativas: ${currentScroll}px`);
        } else if (attempts < maxAttempts) {
          console.log(`⏳ [EventDetails] Tentativa ${attempts}: atual=${currentScroll}, target=${targetPosition}, diff=${diff}`);
          requestAnimationFrame(attemptRestore);
        } else {
          console.log(`âš ï¸ [EventDetails] Máximo de tentativas. Posição final: ${currentScroll}px`);
        }
      };
      
      requestAnimationFrame(attemptRestore);
      
      [50, 100, 200, 400, 800, 1600].forEach(delay => {
        setTimeout(() => {
          window.scrollTo({
            top: targetPosition,
            behavior: 'instant' as ScrollBehavior
          });
        }, delay);
      });
    } else {
      console.log('âŒ [EventDetails] Sem cache ou scroll = 0');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);
  
  // Salva scroll ao rolar/sair
  useEffect(() => {
    console.log('ðŸ“Œ [EventDetails] Iniciando listeners de scroll para:', cacheKey);
    let throttleTimeout: NodeJS.Timeout | null = null;
    const THROTTLE_MS = 400; // Otimizado para performance
    
    const updateScrollPosition = () => {
      const windowScroll = window.scrollY || window.pageYOffset;
      const docScroll = document.documentElement.scrollTop;
      const bodyScroll = document.body.scrollTop;
      
      console.log(`ðŸ“Š [EventDetails] SCROLL DETECTADO:`, {
        windowScrollY: window.scrollY,
        windowPageYOffset: window.pageYOffset,
        docScroll,
        bodyScroll,
        maxScroll: document.documentElement.scrollHeight - window.innerHeight
      });
      
      const currentScroll = windowScroll || docScroll || bodyScroll;
      lastScrollPositionRef.current = currentScroll;
      
      if (throttleTimeout) clearTimeout(throttleTimeout);
      
      throttleTimeout = setTimeout(() => {
        setCache(cacheKey, [], currentScroll);
        console.log(`ðŸ’¾ [EventDetails] Cache atualizado (scroll): ${currentScroll}px`);
      }, THROTTLE_MS);
    };
    
    const handleScroll = () => {
      console.log('ðŸ”” [EventDetails] Evento de scroll disparado!');
      updateScrollPosition();
    };
    
    const handlePageHide = () => {
      const finalScroll = lastScrollPositionRef.current;
      setCache(cacheKey, [], finalScroll);
      console.log(`ðŸ’¾ [EventDetails] Cache salvo (pagehide): ${finalScroll}px`);
    };
    
    const handleBeforeUnload = () => {
      const finalScroll = lastScrollPositionRef.current;
      setCache(cacheKey, [], finalScroll);
      console.log(`ðŸ’¾ [EventDetails] Cache salvo (beforeunload): ${finalScroll}px`);
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, [], finalScroll);
        console.log(`ðŸ’¾ [EventDetails] Cache salvo (visibilitychange): ${finalScroll}px`);
      }
    };
    
    const handleBlur = () => {
      const finalScroll = lastScrollPositionRef.current;
      setCache(cacheKey, [], finalScroll);
      console.log(`ðŸ’¾ [EventDetails] Cache salvo (blur): ${finalScroll}px`);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      if (throttleTimeout) clearTimeout(throttleTimeout);
      
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      
      const finalScroll = lastScrollPositionRef.current;
      setCache(cacheKey, [], finalScroll);
      console.log(`ðŸ’¾ [EventDetails] Cache salvo (cleanup final): ${finalScroll}px`);
    };
  }, [cacheKey, setCache]);
  // ======================================================

  // Scroll para o line up quando houver o parâmetro scrollToLineup na URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const scrollToLineup = urlParams.get("scrollToLineup");
    const eventIdParam = urlParams.get("eventId");
    
    // Verifica se é o evento correto e se deve fazer scroll
    if (!scrollToLineup || !event.line_up || scrollExecutedRef.current) {
      return;
    }
    
    // Se houver eventId na URL, verifica se corresponde ao evento atual
    if (eventIdParam && parseInt(eventIdParam) !== event.id) {
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
      
      // Procura pelo elemento scrollável mais próximo
      let parent = lineupElement.parentElement;
      while (parent && parent !== document.body) {
        const hasScroll = parent.scrollHeight > parent.clientHeight;
        if (hasScroll || getComputedStyle(parent).overflowY !== "visible") {
          scrollContainer = parent;
          break;
        }
        parent = parent.parentElement;
      }

      // Se não encontrou, usa window
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
          url.searchParams.delete("eventId");
          window.history.replaceState({}, "", url.toString());
          scrollExecutedRef.current = false; // Permite scroll novamente se necessário
        }, 4500);
      };

      // Aguarda um pouco para garantir que o layout está estável
      setTimeout(highlightAndScroll, 100);
    };

    // Aguarda um pouco antes de tentar fazer scroll
    setTimeout(tryScrollToLineup, 300);
  }, [event.id, event.line_up]);

  // ======================================================
    const startDate = new Date(event.starts_at);
const endDate = new Date(event.ends_at);

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

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
                justifyContent: "center",
                alignItems: "center",
                padding: "16px 32px",
              }}
            >
              {/* LOGO + TEXTO */}
             
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
                  color: "rgb(255, 31, 33)",
                  textShadow: "2px 2px 8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 31, 33, 0.3)",
                  letterSpacing: "0.5px",
                  lineHeight: 1.2,
                  textTransform: "uppercase",
                }}
              >
                {event.title}
              </h1>
            </Box>
    
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
               <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <FestivalIcon style={{ color: "rgb(255, 31, 33)", fontSize: 28 }} />
                <strong style={{ fontSize: 22, color: "rgb(255, 31, 33)" }}>Informações do Evento</strong>
              </div>
              {/* DIAS DO EVENTO */}
              {event.event_dates && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EventIcon style={{ color: "rgb(255, 31, 33)" }} />
                  <p style={{ margin: 0, fontSize: 15 }}>
                    {formatEventDates(event)}
                  </p>
                </Box>
              )}

              {/* DATA E HORÁRIO DE INÍCIO */}
              {event.starts_at && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AccessTimeIcon style={{ color: "rgb(255, 31, 33)" }} />
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

              {/* DATA E HORÁRIO DE TÃ‰RMINO */}
              {event.ends_at && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AccessTimeIcon style={{ color: "rgb(255, 31, 33)" }} />
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
                  <DirectionsBusIcon style={{ color: "rgb(255, 31, 33)" }} />
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
                  <DirectionsBusIcon style={{ color: "rgb(255, 31, 33)" }} />
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
                  <LocationOnIcon style={{ color: "rgb(255, 31, 33)" }} />
                  <p style={{ margin: 0, fontSize: 15 }}>{event.location}</p>
                </Box>
              )}
            </Box>

            {/* MEETING POINT */}
            {(event.meeting_point_location || (event.meeting_point_schedule && event.meeting_point_schedule.length > 0)) && (
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  marginTop: 2,
                }}
              >
                <Box
                  sx={{
                    maxWidth: 700,
                    width: "100%",
                    padding: "20px",
                    borderRadius: 2,
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: { xs: "flex-start", md: "center" }, gap: 1, marginBottom: 2 }}>
                  <MeetingRoomIcon style={{ color: "rgb(255, 31, 33)" }} />
                  <h3 style={{ margin: 0, color: "rgb(255, 31, 33)", fontSize: 18, fontWeight: 600 }}>
                    Meeting Point
                  </h3>
                </Box>

                {event.meeting_point_location && (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: { xs: "flex-start", md: "center" }, gap: 1, marginBottom: 2 }}>
                    <LocationOnIcon style={{ color: "rgb(255, 31, 33)" }} />
                    <Box component="p" sx={{ margin: 0, fontSize: 15, color: "white", textAlign: { xs: "left", md: "center" } }}>{event.meeting_point_location}</Box>
                  </Box>
                )}

                {event.meeting_point_schedule && event.meeting_point_schedule.length > 0 && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, alignItems: { xs: "flex-start", md: "center" } }}>
                    <Typography sx={{ color: "white", fontSize: 15, fontWeight: 600, textAlign: { xs: "left", md: "center" } }}>
                      Dias de Funcionamento:
                    </Typography>
                    {event.meeting_point_schedule.map((schedule, index) => (
                      <Box
                        key={index}
                        sx={{
                          padding: "12px",
                        
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: { xs: "flex-start", md: "center" }, gap: 1, mb: 1 }}>
                          <EventIcon style={{ color: "rgb(255, 31, 33)", fontSize: 18 }} />
                          <Typography sx={{ color: "white", fontSize: 14, fontWeight: 600, textAlign: { xs: "left", md: "center" } }}>
                            Dias {schedule.days.join(", ")} de fevereiro
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: { xs: "flex-start", md: "center" }, gap: 1 }}>
                          <AccessTimeIcon style={{ color: "rgb(255, 31, 33)", fontSize: 18 }} />
                          <Typography sx={{ color: "white", fontSize: 14, textAlign: { xs: "left", md: "center" } }}>
                            Das {schedule.start_time} às {schedule.end_time}
                          </Typography>
                        </Box>
                  </Box>
                ))}
              </Box>
            )}
              </Box>
            </Box>
          )}

            {/* BOTÃƒO COMPRAR INGRESSOS */}
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
                component="a"
                href="https://www.viagogo.com/br/Ingressos-Festivais/Festivais-Internacionais/Rock-in-Rio-Ingressos?=&PCID=PSBRADWHOME54696850618318&MetroRegionID=&psc=&ps=&ps_p=0&ps_c=21105464540&ps_ag=183451881594&ps_tg=kwd-328362149941&ps_ad=788000627894&ps_adp=&ps_fi=&ps_li=&ps_lp=9100596&ps_n=g&ps_d=c&ps_ex=&pscpag=&gad_source=1&gad_campaignid=21105464540&gclid=Cj0KCQjw4a3OBhCHARIsAChaqJOxkA-81eoO01M1ZrHN6bUME0yTyflmH6Ym7JzmiwcuR0oSKTIk6SkaAjAVEALw_wcB"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  backgroundColor: "rgb(255, 31, 33)",
                  color: "#fff",
                  fontWeight: 700,
                  padding: "12px 32px",
                  borderRadius: "30px",
                  textTransform: "none",
                  fontSize: 16,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                  "&:hover": {
                    backgroundColor: "rgb(220, 20, 22)",
                  },
                }}
              >
                Comprar ingressos
              </Button>
            </Box>
          
            </main>
          </div>
        </div>
  );
}

