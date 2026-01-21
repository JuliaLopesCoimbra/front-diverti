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
  const { getCache, setCache } = useFeedCache();
  const cacheKey = `enredo-event-${eventId}`;
  const [initialized, setInitialized] = useState(false);
  
  const [schools, setSchools] = useState<SambaSchoolResponse[]>([]);
  const [musics, setMusics] = useState<MusicLyricsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const enredoSectionRef = useRef<HTMLDivElement>(null);

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
        
        if (diff >= 10 && attempts < maxAttempts) {
          requestAnimationFrame(attemptRestore);
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
            setSchools(freshSchools);
            setMusics(freshMusics);
            
            const hasNewItems = freshSchools.length > cachedSchools.length || freshMusics.length > cachedMusics.length;
            setCache(cacheKey, [freshSchools, freshMusics], hasNewItems ? 0 : targetPosition);
            
            if (hasNewItems) {
              setTimeout(() => {
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }, 500);
            }
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
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
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
                  cursor: "pointer",
                  transition: "transform 0.2s, opacity 0.2s",
                  "&:hover": {
                    transform: "scale(1.05)",
                    opacity: 0.9,
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
            src="https://open.spotify.com/embed/playlist/7yhX7bo1ytC94v3alLA5Tp?utm_source=generator"
            height="352"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </Box>
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

export default Enredo;
