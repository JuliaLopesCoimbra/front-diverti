"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Paper,
  Avatar,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { getLineupItemsByEvent, LineupItemResponse } from "@/app/services/lineup/lineupService";
import { getPublicEventById } from "@/app/services/events/eventAppService";

export default function LineupPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.id);
  
  const [lineupItems, setLineupItems] = useState<LineupItemResponse[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Busca lineup e evento em paralelo, mas não falha se o evento não for encontrado
        const [items, eventData] = await Promise.all([
          getLineupItemsByEvent(eventId).catch(() => []), // Retorna lista vazia se der erro
          getPublicEventById(eventId).catch(() => {
            // Silenciosamente ignora erro ao buscar evento (não é crítico para exibir o lineup)
            return null;
          }),
        ]);
        setLineupItems(items || []);
        setEvent(eventData);
        setError(null);
      } catch (err: any) {
        console.error("Erro ao buscar lineup:", err);
        if (err?.response?.status === 404) {
          setLineupItems([]);
          setError(null);
        } else {
          setError("Erro ao carregar programação");
        }
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  const formatTime = (timeString: string): string => {
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#ffc91f" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#000",
        backgroundImage: "url(/background/dashboard.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        color: "#fff",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          p: { xs: 2, md: 3 },
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          position: "sticky",
          top: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(20px)",
          zIndex: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <IconButton
          onClick={() => router.back()}
          sx={{ 
            color: "#fff",
            position: "absolute",
            left: { xs: 12, md: 24 },
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.1)",
              transform: "translateX(-4px)",
            },
          }}
        >
          <ArrowBackIosIcon />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography 
            variant="h5" 
            fontWeight={700}
            sx={{
              fontFamily: "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              letterSpacing: "2px",
              fontSize: { xs: "1.25rem", md: "1.5rem" },
              background: "linear-gradient(135deg, #ffc91f 0%, #ffd54f 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            LINE UP
          </Typography>
          {event && (
            <Typography 
              sx={{ 
                color: "rgba(255,255,255,0.8)",
                fontSize: { xs: "0.875rem", md: "1rem" },
                fontWeight: 400,
                fontFamily: "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              - {event.title}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Conteúdo */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 800,
          mx: "auto",
        }}
      >
        {error ? (
          <Paper
            elevation={0}
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(10px)",
              borderRadius: 3,
              p: 4,
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              width: "100%",
            }}
          >
            <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
              {error}
            </Typography>
          </Paper>
        ) : lineupItems.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(10px)",
              borderRadius: 3,
              p: 4,
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              width: "100%",
            }}
          >
            <MusicNoteIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.3)", mb: 2 }} />
            <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
              Nenhum artista cadastrado no lineup ainda.
            </Typography>
          </Paper>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              width: "100%",
            }}
          >
            {lineupItems.map((item) => (
              <Paper
                key={item.id}
                elevation={0}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 3,
                  border: "1px solid rgba(255,255,255,0.1)",
                  transition: "all 0.3s",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.15)",
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
                  },
                }}
              >
                {/* Foto do Artista - Esquerda */}
                {item.artist_image_url ? (
                  <Box
                    component="img"
                    src={item.artist_image_url}
                    alt={item.artist_name}
                    sx={{
                      width: 180,
                      height: 180,
                      objectFit: "cover",
                      borderRadius: 1,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 180,
                      height: 180,
                      backgroundColor: "rgba(255, 201, 31, 0.2)",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MusicNoteIcon sx={{ fontSize: "4rem", color: "rgba(255, 201, 31, 0.5)" }} />
                  </Box>
                )}

                {/* Informações - Direita */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    flex: 1,
                    justifyContent: "center",
                  }}
                >
                  {/* Nome do Artista */}
                  <Typography
                    sx={{
                      color: "white",
                      fontSize: "1.35rem",
                      fontWeight: 600,
                      paddingTop: 2,
                      textTransform: "uppercase",
                      fontFamily: "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {item.artist_name}
                  </Typography>

                  {/* Horário */}
                  <Typography
                    sx={{
                      color: "white",
                      fontSize: "1.5rem",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      fontFamily: "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {formatTime(item.performance_time)}
                  </Typography>

                  {/* Descrição */}
                  {item.description && (
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: "1rem",
                        fontWeight: 400,
                        fontFamily: "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                        lineHeight: 1.5,
                      }}
                    >
                      {item.description}
                    </Typography>
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

