"use client";

import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { EventResponse } from "@/app/services/events/eventAppService";
import { useFeedCache } from "@/app/context/FeedCacheContext";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventIcon from "@mui/icons-material/Event";
import MapIcon from "@mui/icons-material/Map";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { formatEventDates } from "@/app/utils/eventDateFormatter";

interface Props {
  event: EventResponse;
}

export default function EventDetails({ event }: Props) {
  // ===== SCROLL RESTORATION (Instagram/TikTok style) =====
  const { getCache, setCache } = useFeedCache();
  const cacheKey = `event-details-${event.id}`;
  const lastScrollPositionRef = useRef(0);
  
  // Restaura scroll ao montar
  useEffect(() => {
    console.log('🔍 [EventDetails] Verificando cache para:', cacheKey);
    const cached = getCache(cacheKey);
    
    if (cached && cached.scrollPosition > 0) {
      console.log('✅ [EventDetails] Cache encontrado! Scroll:', cached.scrollPosition);
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
          console.log(`✅ [EventDetails] SUCESSO! Scroll restaurado em ${attempts} tentativas: ${currentScroll}px`);
        } else if (attempts < maxAttempts) {
          console.log(`⏳ [EventDetails] Tentativa ${attempts}: atual=${currentScroll}, target=${targetPosition}, diff=${diff}`);
          requestAnimationFrame(attemptRestore);
        } else {
          console.log(`⚠️ [EventDetails] Máximo de tentativas. Posição final: ${currentScroll}px`);
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
      console.log('❌ [EventDetails] Sem cache ou scroll = 0');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);
  
  // Salva scroll ao rolar/sair
  useEffect(() => {
    console.log('📌 [EventDetails] Iniciando listeners de scroll para:', cacheKey);
    let throttleTimeout: NodeJS.Timeout | null = null;
    const THROTTLE_MS = 400; // Otimizado para performance
    
    const updateScrollPosition = () => {
      const windowScroll = window.scrollY || window.pageYOffset;
      const docScroll = document.documentElement.scrollTop;
      const bodyScroll = document.body.scrollTop;
      
      console.log(`📊 [EventDetails] SCROLL DETECTADO:`, {
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
        console.log(`💾 [EventDetails] Cache atualizado (scroll): ${currentScroll}px`);
      }, THROTTLE_MS);
    };
    
    const handleScroll = () => {
      console.log('🔔 [EventDetails] Evento de scroll disparado!');
      updateScrollPosition();
    };
    
    const handlePageHide = () => {
      const finalScroll = lastScrollPositionRef.current;
      setCache(cacheKey, [], finalScroll);
      console.log(`💾 [EventDetails] Cache salvo (pagehide): ${finalScroll}px`);
    };
    
    const handleBeforeUnload = () => {
      const finalScroll = lastScrollPositionRef.current;
      setCache(cacheKey, [], finalScroll);
      console.log(`💾 [EventDetails] Cache salvo (beforeunload): ${finalScroll}px`);
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, [], finalScroll);
        console.log(`💾 [EventDetails] Cache salvo (visibilitychange): ${finalScroll}px`);
      }
    };
    
    const handleBlur = () => {
      const finalScroll = lastScrollPositionRef.current;
      setCache(cacheKey, [], finalScroll);
      console.log(`💾 [EventDetails] Cache salvo (blur): ${finalScroll}px`);
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
      console.log(`💾 [EventDetails] Cache salvo (cleanup final): ${finalScroll}px`);
    };
  }, [cacheKey, setCache]);
  // ======================================================
    const startDate = new Date(event.starts_at);
const endDate = new Date(event.ends_at);

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});
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
           

              <strong style={{ fontSize: 22, color: "white" }}>Informações do Evento</strong>
            </div>
    
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
            maxHeight: 280,
            objectFit: "cover",
            borderRadius: 2,
          }}
        />
      )}
    
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
                  color: "white",
                  padding: "6px 10px",
                  fontWeight: 600,
                  display: "inline",
                
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
              // className="border border-amber-600"
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
  {timeFormatter.format(startDate)} às {timeFormatter.format(endDate)}
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
                <Box
                  component="img"
                  src={event.image_map}
                  alt="Mapa do Evento"
                  sx={{
                    width: "100%",
                    maxHeight: 400,
                    objectFit: "contain",
                    borderRadius: 2,
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
          
          </main>
        </div>


  
  );
}
