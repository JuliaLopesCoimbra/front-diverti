"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
} from "@mui/material";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { getLineupItemsByEvent, LineupItemResponse } from "@/app/services/lineup/lineupService";

interface LineupViewProps {
  eventId: number;
}

export default function LineupView({ eventId }: LineupViewProps) {
  const [lineupItems, setLineupItems] = useState<LineupItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchLineup = async () => {
      try {
        setLoading(true);
        const items = await getLineupItemsByEvent(eventId).catch(() => []); // Retorna lista vazia se der erro
        setLineupItems(items || []);
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
      fetchLineup();
    }
  }, [eventId]);

  const formatTime = (timeString: string): string => {
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  // Agrupa itens por data e cria lista de datas únicas
  const { dates, filteredItems } = useMemo(() => {
    const datesSet = new Set<string>();
    lineupItems.forEach((item) => {
      if (item.event_date) {
        datesSet.add(item.event_date);
      }
    });
    const datesArray = Array.from(datesSet).sort();
    
    // Filtra itens baseado na data selecionada
    let filtered = lineupItems;
    if (selectedDate) {
      filtered = lineupItems.filter((item) => item.event_date === selectedDate);
    } else if (datesArray.length > 0) {
      // Se há datas mas nenhuma selecionada, mostra apenas itens sem data
      filtered = lineupItems.filter((item) => !item.event_date);
    }
    
    return { dates: datesArray, filteredItems: filtered };
  }, [lineupItems, selectedDate]);

  // Define a primeira data como selecionada por padrão se houver datas
  useEffect(() => {
    if (dates.length > 0 && selectedDate === null) {
      setSelectedDate(dates[0]);
    }
  }, [dates]);

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
        pt: 3,
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
            px: { xs: 1, sm: 2 },
          }}
        >
          {/* Tabs de Data */}
          {dates.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(10px)",
                borderRadius: 2,
                border: "1px solid rgba(255, 255, 255, 0.1)",
                overflow: "hidden",
                width: "100%",
              }}
            >
              <Tabs
                value={selectedDate || dates[0] || false}
                onChange={(_, newValue) => setSelectedDate(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  "& .MuiTab-root": {
                    color: "rgba(255,255,255,0.7)",
                    textTransform: "none",
                    fontSize: { xs: "0.875rem", md: "1rem" },
                    fontWeight: 500,
                    minHeight: 48,
                    "&.Mui-selected": {
                      color: "#ffc91f",
                      fontWeight: 600,
                    },
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: "#ffc91f",
                    height: 3,
                  },
                }}
              >
                {dates.map((date) => (
                  <Tab
                    key={date}
                    label={new Date(date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                    value={date}
                  />
                ))}
              </Tabs>
            </Paper>
          )}

          {/* Lista de Itens Filtrados */}
          {filteredItems.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                p: 4,
                textAlign: "center",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                Nenhum artista cadastrado para esta data.
              </Typography>
            </Paper>
          ) : (
            filteredItems.map((item) => (
            <Paper
              key={item.id}
              elevation={0}
              sx={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 3,
                display: "flex",
                alignItems: "stretch",
                gap: { xs: 2, md: 3 },
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.3s ease",
                width: "100%",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 24px rgba(0,0,0,0.4)",
                },
              }}
            >
              {/* Container da Foto - Ultra Padronizado */}
              <Box
                sx={{
                  width: { xs: 150, sm: 180, md: 200 },
                  minWidth: { xs: 150, sm: 180, md: 200 },
                  maxWidth: { xs: 150, sm: 180, md: 200 },
                  height: { xs: 150, sm: 180, md: 200 },
                  flexShrink: 0,
                  aspectRatio: "1 / 1",
                  overflow: "hidden",
                  borderRadius: 2,
                  backgroundColor: "rgba(255, 201, 31, 0.1)",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.artist_image_url ? (
                  <Box
                    component="img"
                    src={item.artist_image_url}
                    alt={item.artist_name}
                    sx={{
                      width: "100%",
                      height: "100% !important",
                      maxHeight: "100% !important",
                      objectFit: "cover",
                      objectPosition: "center",
                      display: "block",
                    }}
                  />
                ) : (
                  <MusicNoteIcon
                    sx={{
                      fontSize: { xs: "2rem", md: "3rem" },
                      color: "rgba(255, 201, 31, 0.3)",
                    }}
                  />
                )}
              </Box>

              {/* Informações - Alinhadas à direita da foto */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flex: 1,
                  py: 0.5,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: "#fff",
                      pt: 2,
                      fontSize: { xs: "1.1rem", md: "1.4rem" },
                      fontWeight: 800,
                      textTransform: "uppercase",
                      lineHeight: 1.2,
                      mb: 1,
                    }}
                  >
                    {item.artist_name}
                  </Typography>

                  {item.stage && (
                    <Typography
                      sx={{
                        color: "#ffc91f",
                        fontSize: { xs: "0.9rem", md: "1rem" },
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      {item.stage}
                    </Typography>
                  )}

                  {item.event_date && (
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.8)",
                        fontSize: { xs: "0.85rem", md: "0.95rem" },
                        fontWeight: 500,
                        mb: 1,
                      }}
                    >
                      {new Date(item.event_date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    sx={{
                      color: "#fff",
                      fontSize: { xs: "1.8rem", md: "1.9rem" },
                      fontWeight: 700,
                      fontFamily: "monospace",
                    }}
                  >
                    {formatTime(item.performance_time)}
                  </Typography>
                  {item.performance_end_time && (
                    <>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.7)",
                          fontSize: { xs: "1.2rem", md: "1.3rem" },
                          fontWeight: 500,
                          fontFamily: "monospace",
                        }}
                      >
                        -
                      </Typography>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.7)",
                          fontSize: { xs: "1.2rem", md: "1.3rem" },
                          fontWeight: 500,
                          fontFamily: "monospace",
                        }}
                      >
                        {formatTime(item.performance_end_time)}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </Paper>
            ))
          )}
        </Box>
      )}
    </Box>
  );
}

