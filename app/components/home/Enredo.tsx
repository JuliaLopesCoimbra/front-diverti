"use client";
import { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Button,
  Skeleton,
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
  spotifyPlaylistUrl?: string;
}

const Enredo: React.FC<Props> = ({ eventId, spotifyPlaylistUrl }) => {
  const { getCache, setCache } = useFeedCache();
  const cacheKey = `enredo-event-${eventId}`;
  const [initialized, setInitialized] = useState(false);
  const isRestoringScrollRef = useRef(false);
  const userInteractedRef = useRef(false);
  const scrollRestoreTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  
  const [schools, setSchools] = useState<SambaSchoolResponse[]>([]);
  const [musics, setMusics] = useState<MusicLyricsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [playlistOpened, setPlaylistOpened] = useState(false);
  const enredoSectionRef = useRef<HTMLDivElement>(null);

  // Função para converter URL da playlist para formato embed
  const convertToEmbedUrl = (url: string): string => {
    if (!url) return "";
    
    // Se já estiver no formato embed, retorna como está
    if (url.includes("/embed/")) {
      return url;
    }
    
    // Extrai o ID da playlist da URL
    // Formato: https://open.spotify.com/playlist/ID?si=...
    const playlistMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (playlistMatch && playlistMatch[1]) {
      const playlistId = playlistMatch[1];
      return `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator`;
    }
    
    return url;
  };

  const embedUrl = spotifyPlaylistUrl ? convertToEmbedUrl(spotifyPlaylistUrl) : "";

  useEffect(() => {
    if (initialized) {
      setSchools([]);
      setMusics([]);
      setLoading(true);
      setInitialized(false);
      return;
    }

    const cached = getCache(cacheKey);
    
    if (cached && cached.data.length > 0) {
      const [cachedSchools, cachedMusics] = cached.data;
      setSchools(cachedSchools || []);
      setMusics(cachedMusics || []);
      setLoading(false);
      setInitialized(true);
      
      // Restaura posição do scroll de forma mais suave e respeitando interação do usuário
      const targetPosition = cached.scrollPosition;
      
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      
      // Limpa timeouts anteriores se existirem
      scrollRestoreTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      scrollRestoreTimeoutsRef.current = [];
      isRestoringScrollRef.current = true;
      userInteractedRef.current = false;
      
      // Função para parar a restauração se o usuário interagir
      const stopRestoreIfUserInteracted = () => {
        if (userInteractedRef.current) {
          isRestoringScrollRef.current = false;
          scrollRestoreTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
          scrollRestoreTimeoutsRef.current = [];
        }
      };
      
      // Tenta restaurar apenas algumas vezes, de forma menos agressiva
      const attemptRestore = () => {
        if (!isRestoringScrollRef.current || userInteractedRef.current) {
          return;
        }
        
        if (!userInteractedRef.current) {
          window.scrollTo({
            top: targetPosition,
            behavior: 'instant' as ScrollBehavior
          });
        }
      };
      
      // Restauração mais suave - apenas alguns timeouts essenciais
      const timeouts = [100, 300, 600];
      timeouts.forEach(delay => {
        const timeout = setTimeout(() => {
          stopRestoreIfUserInteracted();
          if (isRestoringScrollRef.current && !userInteractedRef.current) {
            attemptRestore();
          }
        }, delay);
        scrollRestoreTimeoutsRef.current.push(timeout);
      });
      
      // Para a restauração após um tempo máximo
      const finalTimeout = setTimeout(() => {
        isRestoringScrollRef.current = false;
        scrollRestoreTimeoutsRef.current = [];
      }, 2000);
      scrollRestoreTimeoutsRef.current.push(finalTimeout);
      
      // Detecta se o usuário está rolando manualmente
      const handleUserScroll = () => {
        if (isRestoringScrollRef.current) {
          userInteractedRef.current = true;
          isRestoringScrollRef.current = false;
          scrollRestoreTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
          scrollRestoreTimeoutsRef.current = [];
        }
      };
      
      // Adiciona listener temporário para detectar scroll do usuário
      window.addEventListener('scroll', handleUserScroll, { passive: true });
      
      // Remove o listener após um tempo
      const cleanupTimeout = setTimeout(() => {
        window.removeEventListener('scroll', handleUserScroll);
      }, 2000);
      scrollRestoreTimeoutsRef.current.push(cleanupTimeout);
      
      (async () => {
        try {
          const [freshSchools, freshMusics] = await Promise.all([
            getSambaSchoolsByEvent(eventId),
            getMusicLyricsByEvent(eventId),
          ]);
          
          const cachedSchoolIds = cachedSchools.map((s: SambaSchoolResponse) => s.id).sort().join(',');
          const freshSchoolIds = freshSchools.map((s: SambaSchoolResponse) => s.id).sort().join(',');
          const cachedMusicIds = cachedMusics.map((m: MusicLyricsResponse) => m.id).sort().join(',');
          const freshMusicIds = freshMusics.map((m: MusicLyricsResponse) => m.id).sort().join(',');
          
          const schoolsChanged = cachedSchoolIds !== freshSchoolIds || cachedSchools.length !== freshSchools.length;
          const musicsChanged = cachedMusicIds !== freshMusicIds || cachedMusics.length !== freshMusics.length;
          
          if (schoolsChanged || musicsChanged) {
            setSchools([...freshSchools]);
            setMusics([...freshMusics]);
            
            const hasNewItems = freshSchools.length > cachedSchools.length || freshMusics.length > cachedMusics.length;
            const hasRemovedItems = freshSchools.length < cachedSchools.length || freshMusics.length < cachedMusics.length;
            
            if (hasNewItems) {
              setCache(cacheKey, [freshSchools, freshMusics], 0);
              setTimeout(() => {
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }, 500);
            } else if (hasRemovedItems) {
              const safeScrollPosition = Math.min(targetPosition, document.documentElement.scrollHeight - window.innerHeight);
              setCache(cacheKey, [freshSchools, freshMusics], safeScrollPosition);
            } else {
              setCache(cacheKey, [freshSchools, freshMusics], targetPosition);
            }
          } else {
            const schoolsContentChanged = JSON.stringify(cachedSchools) !== JSON.stringify(freshSchools);
            const musicsContentChanged = JSON.stringify(cachedMusics) !== JSON.stringify(freshMusics);
            
            if (schoolsContentChanged || musicsContentChanged) {
              setSchools([...freshSchools]);
              setMusics([...freshMusics]);
            }
            
            setCache(cacheKey, [freshSchools, freshMusics], targetPosition);
          }
        } catch (err) {
          console.error('Erro ao revalidar cache:', err);
        }
      })();
    } else {
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
    
    // Cleanup: limpa timeouts quando o componente é desmontado ou eventId muda
    return () => {
      scrollRestoreTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      scrollRestoreTimeoutsRef.current = [];
      isRestoringScrollRef.current = false;
      userInteractedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const lastScrollPositionRef = useRef(0);
  
  useEffect(() => {
    let throttleTimeout: NodeJS.Timeout | null = null;
    const THROTTLE_MS = 400;
    
    const updateScrollPosition = () => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      lastScrollPositionRef.current = currentScroll;
      
      if (throttleTimeout) clearTimeout(throttleTimeout);
      
      throttleTimeout = setTimeout(() => {
        if (schools.length > 0 || musics.length > 0) {
          setCache(cacheKey, [schools, musics], currentScroll);
        }
      }, THROTTLE_MS);
    };
    
    const handleScroll = () => {
      updateScrollPosition();
    };
    
    const handlePageHide = () => {
      if (schools.length > 0 || musics.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, [schools, musics], finalScroll);
      }
    };
    
    const handleBeforeUnload = () => {
      if (schools.length > 0 || musics.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, [schools, musics], finalScroll);
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden && (schools.length > 0 || musics.length > 0)) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, [schools, musics], finalScroll);
      }
    };
    
    const handleBlur = () => {
      if (schools.length > 0 || musics.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, [schools, musics], finalScroll);
      }
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
      
      if (schools.length > 0 || musics.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, [schools, musics], finalScroll);
      }
    };
  }, [schools, musics, cacheKey, setCache]);

  // Scroll automático para a seção do enredo quando uma escola é selecionada
  useEffect(() => {
    if (selectedSchoolId && enredoSectionRef.current) {
      setTimeout(() => {
        enredoSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [selectedSchoolId]);

  if (loading) {
    return <EnredoSkeleton />;
  }

  return (
    <Box px={2} pb={4} >
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
            gridTemplateColumns: { 
              xs: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)"
            },
            gap: 2,
            maxWidth: { md: "1200px" },
            mx: { md: "auto" },
          }}
        >
          {schools.map((school) => (
            <Box key={school.id}>
              <Card
                onClick={() => {
                  setSelectedSchoolId(selectedSchoolId === school.id ? null : school.id);
                }}
                sx={{
                  backgroundColor: "transparent",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "none",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: { xs: 3, md: 4 },
                    pb: { xs: 2, md: 3 },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 120, md: 160, lg: 180 },
                      height: { xs: 120, md: 160, lg: 180 },
                      borderRadius: "16px",
                      backgroundColor: "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2,
                      overflow: "hidden",
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
                          borderRadius: "16px",
                        }}
                      />
                    ) : (
                      <Typography
                        variant="h6"
                        sx={{
                          color: "#fff",
                          fontWeight: 700,
                          textAlign: "center",
                          fontSize: { xs: "0.9rem", md: "1.2rem", lg: "1.4rem" },
                        }}
                      >
                        {school.name.charAt(0)}
                      </Typography>
                    )}
                  </Box>

                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                      color: "#fff",
                      mb: 1,
                      textAlign: "center",
                      fontSize: { xs: "1rem", md: "1.2rem", lg: "1.3rem" },
                    }}
                  >
                    {school.name}
                  </Typography>

                  {school.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255,255,255,0.7)",
                        textAlign: "center",
                        fontSize: { xs: "0.85rem", md: "0.95rem", lg: "1rem" },
                        lineHeight: 1.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: { xs: 3, md: 4 },
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

      {/* Spotify Playlist */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          my: 4,
          px: 2,
        }}
      >
        {spotifyPlaylistUrl ? (
          playlistOpened ? (
            <Box
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", md: "600px", lg: "700px" },
              }}
            >
              <iframe
                data-testid="embed-iframe"
                style={{
                  borderRadius: "12px",
                  width: "100%",
                }}
                src={embedUrl}
                height="352"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </Box>
          ) : (
            <Card
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", md: "600px", lg: "700px" },
                backgroundColor: "rgba(30, 215, 96, 0.1)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                border: "2px solid rgba(30, 215, 96, 0.3)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "352px",
                py: 6,
                px: 3,
                transition: "all 0.3s ease",
                cursor: "pointer",
                "&:hover": {
                  borderColor: "rgba(30, 215, 96, 0.5)",
                  backgroundColor: "rgba(30, 215, 96, 0.15)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 24px rgba(30, 215, 96, 0.2)",
                },
              }}
              onClick={() => setPlaylistOpened(true)}
            >
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  textAlign: "center",
                }}
              >
                <Box
                  sx={{
                    width: { xs: 80, md: 100 },
                    height: { xs: 80, md: 100 },
                    borderRadius: "50%",
                    backgroundColor: "rgba(30, 215, 96, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                  }}
                >
                  <Box
                    component="svg"
                    sx={{
                      width: { xs: 50, md: 60 },
                      height: { xs: 50, md: 60 },
                      fill: "#1DB954",
                    }}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
                  </Box>
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: "#fff",
                    fontSize: { xs: "1.2rem", md: "1.4rem" },
                    fontWeight: 700,
                    mb: 0.5,
                  }}
                >
                  Playlist do Spotify
                </Typography>
                <Typography
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: { xs: "0.95rem", md: "1.05rem" },
                    mb: 2,
                  }}
                >
                  Clique para ouvir a playlist
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#1DB954",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: { xs: "0.95rem", md: "1.05rem" },
                    px: 4,
                    py: 1.5,
                    borderRadius: "50px",
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "#1ed760",
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  Reproduzir Playlist
                </Button>
              </CardContent>
            </Card>
          )
        ) : (
          <Card
            sx={{
              width: "100%",
              maxWidth: { xs: "100%", md: "600px", lg: "700px" },
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(10px)",
              borderRadius: 3,
              border: "2px dashed rgba(255, 255, 255, 0.2)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "352px",
              py: 6,
              px: 3,
              transition: "all 0.3s ease",
              "&:hover": {
                borderColor: "rgba(255, 201, 31, 0.4)",
                backgroundColor: "rgba(0, 0, 0, 0.4)",
              },
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  fontSize: { xs: "4rem", md: "5rem" },
                  lineHeight: 1,
                  mb: 1,
                  opacity: 0.7,
                }}
              >
                🎵
              </Box>
              <Typography
                variant="h6"
                sx={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: { xs: "1.1rem", md: "1.3rem" },
                  fontWeight: 600,
                  mb: 0.5,
                }}
              >
                Playlist não disponível
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: { xs: "0.9rem", md: "1rem" },
                  maxWidth: "400px",
                }}
              >
                Nenhuma playlist do Spotify foi cadastrada para este evento
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Seção de Enredo da Escola de Samba */}
      {selectedSchoolId && (() => {
        const selectedSchool = schools.find(s => s.id === selectedSchoolId);
        if (!selectedSchool) return null;
        
        return (
          <Box
            ref={enredoSectionRef}
            sx={{
              mt: 4,
              px: 2,
              maxWidth: { md: "800px", lg: "900px" },
              mx: "auto",
            }}
          >
            <Typography
              variant="h6"
              fontWeight={700}
              mb={3}
              sx={{
                color: "#fff",
                textAlign: "center",
                fontSize: "1.2rem",
              }}
            >
              Enredo da Escola de Samba
            </Typography>

            <Card
              sx={{
                backgroundColor: "transparent",
                boxShadow: "none",
                border: "none",
                borderRadius: 3,
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  p: { xs: 2, md: 4 },
                }}
              >
                {/* Foto da Escola */}
                {selectedSchool.image_url && (
                  <Box
                    sx={{
                      width: { xs: "100%", md: "400px", lg: "500px" },
                      height: { xs: "250px", md: "350px", lg: "400px" },
                      borderRadius: 3,
                      mb: 3,
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      component="img"
                      src={selectedSchool.image_url}
                      alt={selectedSchool.name}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                )}

                {/* Nome da Escola */}
                <Typography
                  variant="h5"
                  fontWeight={700}
                  mb={2}
                  sx={{
                    color: "#fff",
                    textAlign: "center",
                    fontSize: { xs: "1.3rem", md: "1.5rem", lg: "1.7rem" },
                  }}
                >
                  {selectedSchool.name}
                </Typography>

                {/* Descrição/Enredo */}
                {selectedSchool.description && (
                  <Typography
                    variant="body1"
                    sx={{
                      color: "rgba(255,255,255,0.9)",
                      textAlign: "justify",
                      fontSize: { xs: "0.95rem", md: "1.05rem", lg: "1.1rem" },
                      lineHeight: 1.8,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {selectedSchool.description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        );
      })()}

      {/* <Divider sx={{ my: 4 }} /> */}

      {/* <Typography 
        variant="h6" 
        fontWeight={700} 
        mb={2}
        sx={{
          color: "#fff",
          textAlign: "center",
        }}
      >
        🎵 Letras de Música
      </Typography> */}

      {/* {musics.length === 0 ? (
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
      )} */}
    </Box>
  );
};

function EnredoSkeleton() {
  return (
    <Box px={2} pb={4}>
      {/* Título Skeleton */}
      <Skeleton
        variant="text"
        width={280}
        height={32}
        sx={{
          bgcolor: "rgba(255,255,255,0.1)",
          mx: "auto",
          mt: 2,
          mb: 3,
        }}
      />

      {/* Grid de Escolas Skeleton */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
          maxWidth: { md: "1200px" },
          mx: { md: "auto" },
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Card
            key={i}
            sx={{
              backgroundColor: "transparent",
              boxShadow: "none",
              border: "none",
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                p: { xs: 3, md: 4 },
                pb: { xs: 2, md: 3 },
              }}
            >
              <Skeleton
                variant="rectangular"
                sx={{
                  width: { xs: 120, md: 160, lg: 180 },
                  height: { xs: 120, md: 160, lg: 180 },
                  bgcolor: "rgba(255,255,255,0.1)",
                  borderRadius: "16px",
                  mb: 2,
                }}
              />
              <Skeleton
                variant="text"
                width="80%"
                height={24}
                sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 1 }}
              />
              <Skeleton
                variant="text"
                width="90%"
                height={16}
                sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
              />
              <Skeleton
                variant="text"
                width="70%"
                height={16}
                sx={{ bgcolor: "rgba(255,255,255,0.1)", mt: 0.5 }}
              />
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Spotify Playlist Skeleton */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          my: 4,
          px: 2,
          width: "100%",
          maxWidth: { xs: "100%", md: "600px", lg: "700px" },
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height={352}
          sx={{
            bgcolor: "rgba(255,255,255,0.1)",
            borderRadius: 3,
          }}
        />
      </Box>
    </Box>
  );
}

export default Enredo;
