"use client";
import { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Divider,
} from "@mui/material";

import { useFeedCache } from "@/app/context/FeedCacheContext";

import {
  SambaSchoolResponse,
    getSambaSchoolsByEvent,
} from "@/app/services/sambaSchools/sambaSchoolService";

import {
  MusicLyricsResponse,
  getMusicLyricsByEvent,
} from "@/app/services/musicLyrics/musicLyricsService";

interface Props {
  eventId: number;
}

const Enredo: React.FC<Props> = ({ eventId }) => {
  // ===== CACHE DO ENREDO (Instagram/TikTok style) =====
  const { getCache, setCache } = useFeedCache();
  const cacheKey = `enredo-event-${eventId}`;
  const [initialized, setInitialized] = useState(false);
  // ====================================================
  
  const [schools, setSchools] = useState<SambaSchoolResponse[]>([]);
  const [musics, setMusics] = useState<MusicLyricsResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // ===== CACHE: Carregar dados ao montar/trocar evento =====
  useEffect(() => {
    if (initialized) {
      // Se já inicializou, é uma troca de evento - limpa tudo
      setSchools([]);
      setMusics([]);
      setLoading(true);
      setInitialized(false);
      return;
    }

    // Tenta carregar do cache
    const cached = getCache(cacheKey);
    
    if (cached && cached.data.length > 0) {
      // ✅ Dados encontrados no cache!
      const [cachedSchools, cachedMusics] = cached.data;
      setSchools(cachedSchools || []);
      setMusics(cachedMusics || []);
      setLoading(false);
      setInitialized(true);
      
      // Restaura posição do scroll ULTRA AGRESSIVO (igual Instagram/TikTok)
      const targetPosition = cached.scrollPosition;
      
      // Desabilita scroll restoration do navegador
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      
      // MÚLTIPLAS tentativas até conseguir
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
        
        if (diff >= 10 && attempts < maxAttempts) {
          requestAnimationFrame(attemptRestore);
        }
      };
      
      // Inicia tentativas
      requestAnimationFrame(attemptRestore);
      
      // Backup com timeouts também
      [50, 100, 200, 400, 800, 1600].forEach(delay => {
        setTimeout(() => {
          window.scrollTo({
            top: targetPosition,
            behavior: 'instant' as ScrollBehavior
          });
        }, delay);
      });
    } else {
      // ❌ Sem cache - carrega da API
      setLoading(true);
      
      Promise.all([
        getSambaSchoolsByEvent(eventId),
        getMusicLyricsByEvent(eventId),
      ])
        .then(([schoolsData, musicsData]) => {
          setSchools(schoolsData);
          setMusics(musicsData);
          setInitialized(true);
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // ===== CACHE: Salvar scroll position ULTRA ROBUSTO =====
  // Usa ref para sempre ter o último valor do scroll (não depende de timing)
  const lastScrollPositionRef = useRef(0);
  
  useEffect(() => {
    // Throttle para não salvar em todo scroll (performance)
    let throttleTimeout: NodeJS.Timeout | null = null;
    const THROTTLE_MS = 400; // Otimizado para performance
    
    const updateScrollPosition = () => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      lastScrollPositionRef.current = currentScroll;
      
      // Salva imediatamente no cache (localStorage) - throttled
      if (throttleTimeout) clearTimeout(throttleTimeout);
      
      throttleTimeout = setTimeout(() => {
        if (schools.length > 0 || musics.length > 0) {
          setCache(cacheKey, [schools, musics], currentScroll);
        }
      }, THROTTLE_MS);
    };
    
    // === MULTIPLATAFORMA: Todos os eventos possíveis ===
    
    // 1. SCROLL - atualiza a posição continuamente
    const handleScroll = () => {
      updateScrollPosition();
    };
    
    // 2. PAGEHIDE - funciona melhor que beforeunload em mobile (iOS/Android)
    const handlePageHide = () => {
      if (schools.length > 0 || musics.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, [schools, musics], finalScroll);
      }
    };
    
    // 3. BEFOREUNLOAD - desktop browsers
    const handleBeforeUnload = () => {
      if (schools.length > 0 || musics.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, [schools, musics], finalScroll);
      }
    };
    
    // 4. VISIBILITYCHANGE - quando aba fica oculta (mobile/desktop)
    const handleVisibilityChange = () => {
      if (document.hidden && (schools.length > 0 || musics.length > 0)) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, [schools, musics], finalScroll);
      }
    };
    
    // 5. BLUR - quando window perde foco
    const handleBlur = () => {
      if (schools.length > 0 || musics.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, [schools, musics], finalScroll);
      }
    };
    
    // Registra todos os listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    
    // CLEANUP: Remove todos os listeners
    return () => {
      if (throttleTimeout) clearTimeout(throttleTimeout);
      
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      
      // ÚLTIMO salvamento antes de desmontar (usa o ref!)
      if (schools.length > 0 || musics.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, [schools, musics], finalScroll);
      }
    };
  }, [schools, musics, cacheKey, setCache]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box px={2} pb={4} >
      {/* ================= ESCOLAS ================= */}
      <Typography 
        fontWeight={700} 
        mt={2}
        mb={3}
        sx={{
          color: "#fff",
          textAlign: "center",
          fontSize: "1.05rem",
        }}
        
      >
        Escolas de Samba presentes no Camarote
      </Typography>

      {schools.length === 0 ? (
        <Typography 
          sx={{ 
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            mb: 3 
          }}
        >
          Nenhuma escola de samba cadastrada.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)" },
            gap: 2,
            
          }}
        >
          {schools.map((school) => (
            <Box key={school.id}>
              <Card
                sx={{
                  backgroundColor: "transparent",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "none",
                  border: "none",
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: 3,
                    pb: 2,
                  }}
                >
                  {/* Logo Quadrado */}
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: 2,
                      backgroundColor: "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2,
                   
                    }}
                  >
                    {school.image_url ? (
                      <Box
                        component="img"
                        src={school.image_url}
                        alt={school.name}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Typography
                        variant="h6"
                        sx={{
                          color: "#fff",
                          fontWeight: 700,
                          textAlign: "center",
                          fontSize: "0.9rem",
                        }}
                      >
                        {school.name.charAt(0)}
                      </Typography>
                    )}
                  </Box>

                  {/* Nome da Escola */}
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                      color: "#fff",
                      mb: 1,
                      textAlign: "center",
                      fontSize: "1rem",
                    }}
                  >
                    {school.name}
                  </Typography>

                  {/* Descrição */}
                  {school.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255,255,255,0.7)",
                        textAlign: "center",
                        fontSize: "0.85rem",
                        lineHeight: 1.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {school.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      <Divider sx={{ my: 4 }} />

      {/* ================= MÚSICAS ================= */}
      <Typography 
        variant="h6" 
        fontWeight={700} 
        mb={2}
        sx={{
          color: "#fff",
          textAlign: "center",
        }}
      >
        🎵 Letras de Música
      </Typography>

      {musics.length === 0 ? (
        <Typography 
          sx={{
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
          }}
        >
          Nenhuma música cadastrada.
        </Typography>
      ) : (
        musics.map((music) => {
          // Divide a letra por linhas (quebras de linha)
          const lyricsLines = music.lyrics
            ? music.lyrics.split('\n').filter(line => line.trim() !== '')
            : [];

          return (
            <Card 
              key={music.id} 
              sx={{ 
                mb: 3, 
                borderRadius: 3,
                backgroundColor: "transparent",
                boxShadow: "none",
                border: "none",
              }}
            >
              <CardContent>
                {/* Nome da música e cantor centralizados */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    mb: 3,
                  }}
                >
                  <Typography 
                    fontWeight={700}
                    sx={{
                      color: "#fff",
                      textAlign: "center",
                      fontSize: "1.1rem",
                      mb: 0.5,
                    }}
                  >
                    {music.song_name}
                  </Typography>

                  {music.singer && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255,255,255,0.7)",
                        textAlign: "center",
                      }}
                    >
                      {music.singer}
                    </Typography>
                  )}
                </Box>

                {/* Letra formatada linha por linha */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                  }}
                >
                  {lyricsLines.map((line, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      sx={{
                        color: "#fff",
                        textAlign: "left",
                        lineHeight: 1.8,
                        fontSize: "0.95rem",
                      }}
                    >
                      {line.trim()}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          );
        })
      )}
    </Box>
  );
};

export default Enredo;
