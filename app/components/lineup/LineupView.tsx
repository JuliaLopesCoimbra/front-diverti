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
import { Button } from "@mui/material";
import { getLineupItemsByEvent, LineupItemResponse } from "@/app/services/lineup/lineupService";
import { getParadeLineupItemsByEvent, ParadeLineupItemResponse } from "@/app/services/paradeLineup/paradeLineupService";

interface LineupViewProps {
  eventId: number;
}

export default function LineupView({ eventId }: LineupViewProps) {
  const [lineupType, setLineupType] = useState<'shows' | 'parade'>('shows');
  const [lineupItems, setLineupItems] = useState<LineupItemResponse[]>([]);
  const [paradeLineupItems, setParadeLineupItems] = useState<ParadeLineupItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchLineup = async () => {
      try {
        setLoading(true);
        if (lineupType === 'shows') {
          const items = await getLineupItemsByEvent(eventId).catch(() => []); // Retorna lista vazia se der erro
          setLineupItems(items || []);
        } else {
          const items = await getParadeLineupItemsByEvent(eventId).catch(() => []); // Retorna lista vazia se der erro
          setParadeLineupItems(items || []);
        }
        setError(null);
      } catch (err: any) {
        console.error("Erro ao buscar lineup:", err);
        if (err?.response?.status === 404) {
          if (lineupType === 'shows') {
            setLineupItems([]);
          } else {
            setParadeLineupItems([]);
          }
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
  }, [eventId, lineupType]);

  const formatTime = (timeString: string): string => {
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  // Formata YYYY-MM-DD como data local sem virada de dia por timezone (evita new Date("YYYY-MM-DD") em UTC)
  const formatDateOnly = (dateStr: string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }) => {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", options);
  };

  // Agrupa itens por data e cria lista de datas únicas
  const { dates, filteredItems, filteredParadeItems } = useMemo(() => {
    const itemsToProcess = lineupType === 'shows' ? lineupItems : paradeLineupItems;
    const datesSet = new Set<string>();
    itemsToProcess.forEach((item) => {
      if (item.event_date) {
        datesSet.add(item.event_date);
      }
    });
    const datesArray = Array.from(datesSet).sort();
    
    // Filtra itens baseado na data selecionada
    let filtered: LineupItemResponse[] = [];
    let filteredParade: ParadeLineupItemResponse[] = [];
    
    if (lineupType === 'shows') {
      if (selectedDate) {
        filtered = lineupItems.filter((item) => item.event_date === selectedDate);
      } else if (datesArray.length > 0) {
        // Se há datas mas nenhuma selecionada, mostra apenas itens sem data
        filtered = lineupItems.filter((item) => !item.event_date);
      } else {
        filtered = lineupItems;
      }
    } else {
      if (selectedDate) {
        filteredParade = paradeLineupItems.filter((item) => item.event_date === selectedDate);
      } else if (datesArray.length > 0) {
        // Se há datas mas nenhuma selecionada, mostra apenas itens sem data
        filteredParade = paradeLineupItems.filter((item) => !item.event_date);
      } else {
        filteredParade = paradeLineupItems;
      }
    }
    
    return { dates: datesArray, filteredItems: filtered, filteredParadeItems: filteredParade };
  }, [lineupItems, paradeLineupItems, selectedDate, lineupType]);

  // Reset selectedDate quando mudar o tipo de lineup
  useEffect(() => {
    setSelectedDate(null);
  }, [lineupType]);

  // Define a primeira data como selecionada por padrão se houver datas
  useEffect(() => {
    if (dates.length > 0) {
      // Se não há data selecionada ou a data selecionada não existe nas datas disponíveis
      if (selectedDate === null || !dates.includes(selectedDate)) {
        setSelectedDate(dates[0]);
      }
    } else {
      // Se não há datas, limpa a seleção
      setSelectedDate(null);
    }
  }, [dates, selectedDate]);

  const currentItems = lineupType === 'shows' ? filteredItems : filteredParadeItems;
  const isEmpty = lineupType === 'shows' 
    ? lineupItems.length === 0 
    : paradeLineupItems.length === 0;

  return (
    <Box
      sx={{
        pt: 3,
        pb: { xs: 4, sm: 2 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        maxWidth: 800,
        mx: "auto",
        width: "100%",
        minHeight: loading ? "200px" : "auto",
      }}
    >
      {/* Botões de Alternância */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 1, md: 1.5, lg: 2 },
          mb: 3,
          px: { xs: 1, sm: 2 },
          width: "100%",
        }}
      >
        <Button
          onClick={() => setLineupType('shows')}
          sx={{
            borderRadius: "999px",
            textTransform: "none",
            fontWeight: 600,
            lineHeight: 1.2,
            px: { xs: 1.5, md: 2, lg: 2.5 },
            minHeight: { xs: 40, md: 44, lg: 48 },
            height: { xs: 40, md: 44, lg: 48 },
            flex: 1,
            maxWidth: { xs: 200, md: 250 },
            fontSize: { xs: "0.875rem", md: "1rem", lg: "1.125rem" },
            // Ativo
            backgroundColor: lineupType === 'shows' ? "primary.main" : "transparent",
            color: "#fff",
            border: `1px solid ${
              lineupType === 'shows' ? "primary.main" : "#fff"
            }`,
            "&:hover": {
              backgroundColor: lineupType === 'shows'
                ? "primary.dark"
                : "rgba(255,255,255,0.1)",
              borderColor: lineupType === 'shows' ? "primary.dark" : "#fff",
              fontWeight: 900,
            },
          }}
        >
          Line Up de Shows
        </Button>
        {/* <Button
          onClick={() => setLineupType('parade')}
          sx={{
            borderRadius: "999px",
            textTransform: "none",
            fontWeight: 600,
            lineHeight: 1.2,
            px: { xs: 1.5, md: 2, lg: 2.5 },
            minHeight: { xs: 40, md: 44, lg: 48 },
            height: { xs: 40, md: 44, lg: 48 },
            flex: 1,
            maxWidth: { xs: 200, md: 250 },
            fontSize: { xs: "0.875rem", md: "1rem", lg: "1.125rem" },
            // Ativo
            backgroundColor: lineupType === 'parade' ? "primary.main" : "transparent",
            color: "#fff",
            border: `1px solid ${
              lineupType === 'parade' ? "primary.main" : "#fff"
            }`,
            "&:hover": {
              backgroundColor: lineupType === 'parade'
                ? "primary.dark"
                : "rgba(255,255,255,0.1)",
              borderColor: lineupType === 'parade' ? "primary.dark" : "#fff",
              fontWeight: 900,
            },
          }}
        >
          Line Up de Desfile
        </Button> */}
      </Box>

      {loading ? (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 4,
          }}
        >
          <CircularProgress sx={{ color: "primary.main" }} />
        </Box>
      ) : error ? (
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
      ) : isEmpty ? (
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
            {lineupType === 'shows' 
              ? 'Nenhum artista cadastrado no lineup ainda.'
              : 'Nenhuma escola de samba cadastrada no lineup de desfile ainda.'}
          </Typography>
        </Paper>
      ) : loading ? (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 4,
            minHeight: "200px",
          }}
        >
          <CircularProgress sx={{ color: "primary.main" }} />
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2, sm: 3 },
            width: "100%",
            px: { xs: 1, sm: 2 },
            opacity: loading ? 0 : 1,
            visibility: loading ? "hidden" : "visible",
            transition: "opacity 0.2s ease, visibility 0.2s ease",
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
                value={selectedDate && dates.includes(selectedDate) ? selectedDate : (dates[0] || false)}
                onChange={(_, newValue) => setSelectedDate(newValue)}
                variant={dates.length <= 5 ? "fullWidth" : "scrollable"}
                scrollButtons={dates.length > 5 ? "auto" : false}
                sx={{
                  "& .MuiTab-root": {
                    color: "rgba(255,255,255,0.7)",
                    textTransform: "none",
                    fontSize: { xs: "0.875rem", md: "1rem" },
                    fontWeight: 500,
                    minHeight: 48,
                    flex: dates.length <= 5 ? "1 1 0" : undefined,
                    minWidth: dates.length <= 5 ? 0 : undefined,
                    "&.Mui-selected": {
                      color: "primary.main",
                      fontWeight: 600,
                    },
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: "rgb(255, 31, 33)",
                    height: 3,
                  },
                }}
              >
                {dates.map((date) => (
                  <Tab
                    key={date}
                    label={formatDateOnly(date, {
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
          {currentItems.length === 0 ? (
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
                {lineupType === 'shows' 
                  ? 'Nenhum artista cadastrado para esta data.'
                  : 'Nenhuma escola de samba cadastrada para esta data.'}
              </Typography>
            </Paper>
          ) : (
            (lineupType === 'shows' ? filteredItems : filteredParadeItems).map((item) => {
              // Para lineup de shows
              if (lineupType === 'shows') {
                const showItem = item as LineupItemResponse;
                return (
            <Paper
              key={showItem.id}
              elevation={0}
              sx={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: { xs: 2, sm: 3 },
                display: "flex",
                alignItems: "stretch",
                gap: { xs: 1.5, md: 3 },
                p: { xs: 1.5, sm: 0 },
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
              {/* Container da Foto */}
              <Box
                sx={{
                  width: { xs: 100, sm: 180, md: 200 },
                  minWidth: { xs: 100, sm: 180, md: 200 },
                  maxWidth: { xs: 100, sm: 180, md: 200 },
                  height: { xs: 100, sm: 180, md: 200 },
                  flexShrink: 0,
                  aspectRatio: "1 / 1",
                  overflow: "hidden",
                  borderRadius: 2,
                  backgroundColor: "rgba(255, 31, 33, 0.1)",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showItem.artist_image_url ? (
                  <Box
                    component="img"
                    src={showItem.artist_image_url}
                    alt={showItem.artist_name}
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
                      color: "rgba(255, 31, 33, 0.3)",
                    }}
                  />
                )}
              </Box>

              {/* Informações */}
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
                      pt: { xs: 0.5, sm: 2 },
                      fontSize: { xs: "0.95rem", md: "1.4rem" },
                      fontWeight: 800,
                      textTransform: "uppercase",
                      lineHeight: 1.2,
                      mb: 0.5,
                    }}
                  >
                    {showItem.artist_name}
                  </Typography>

                  {showItem.stage && (
                    <Typography
                      sx={{
                        color: "primary.main",
                        fontSize: { xs: "0.9rem", md: "1rem" },
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      {showItem.stage}
                    </Typography>
                  )}

            
                </Box>

                <Box sx={{ mt: { xs: 0.5, sm: 1 }, display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    sx={{
                      color: "#fff",
                      fontSize: { xs: "1.25rem", md: "1.9rem" },
                      fontWeight: 700,
                      fontFamily: "monospace",
                    }}
                  >
                    {formatTime(showItem.performance_time)}
                  </Typography>
                  {showItem.performance_end_time && (
                    <>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.7)",
                          fontSize: { xs: "0.95rem", md: "1.3rem" },
                          fontWeight: 500,
                          fontFamily: "monospace",
                        }}
                      >
                        -
                      </Typography>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.7)",
                          fontSize: { xs: "0.95rem", md: "1.3rem" },
                          fontWeight: 500,
                          fontFamily: "monospace",
                        }}
                      >
                        {formatTime(showItem.performance_end_time)}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </Paper>
              );
            } else {
              // Para lineup de desfile
              const paradeItem = item as ParadeLineupItemResponse;
              return (
            <Paper
              key={paradeItem.id}
              elevation={0}
              sx={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: { xs: 2, sm: 3 },
                display: "flex",
                alignItems: "stretch",
                gap: { xs: 1.5, md: 3 },
                p: { xs: 1.5, sm: 0 },
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
              {/* Container da Foto */}
              <Box
                sx={{
                  width: { xs: 100, sm: 180, md: 200 },
                  minWidth: { xs: 100, sm: 180, md: 200 },
                  maxWidth: { xs: 100, sm: 180, md: 200 },
                  height: { xs: 100, sm: 180, md: 200 },
                  flexShrink: 0,
                  aspectRatio: "1 / 1",
                  overflow: "hidden",
                  borderRadius: 2,
                  backgroundColor: "rgba(255, 31, 33, 0.1)",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {paradeItem.samba_school_image_url ? (
                  <Box
                    component="img"
                    src={paradeItem.samba_school_image_url}
                    alt={paradeItem.samba_school_name}
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
                      color: "rgba(255, 31, 33, 0.3)",
                    }}
                  />
                )}
              </Box>

              {/* Informações */}
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
                      pt: { xs: 0.5, sm: 2 },
                      fontSize: { xs: "0.95rem", md: "1.4rem" },
                      fontWeight: 800,
                      textTransform: "uppercase",
                      lineHeight: 1.2,
                      mb: 0.5,
                    }}
                  >
                    {paradeItem.samba_school_name || 'Escola de Samba'}
                  </Typography>

                  {paradeItem.event_date && (
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.8)",
                        fontSize: { xs: "0.85rem", md: "0.95rem" },
                        fontWeight: 500,
                        mb: 1,
                      }}
                    >
                      {formatDateOnly(paradeItem.event_date)}
                    </Typography>
                  )}
                </Box>

                {paradeItem.event_date !== "2026-02-21" && (
                  <Box sx={{ mt: { xs: 0.5, sm: 1 }, display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      sx={{
                        color: "#fff",
                        fontSize: { xs: "1.25rem", md: "1.9rem" },
                        fontWeight: 700,
                        fontFamily: "monospace",
                      }}
                    >
                      {formatTime(paradeItem.performance_time)}
                    </Typography>
                    {paradeItem.performance_end_time && (
                      <>
                        <Typography
                          sx={{
                            color: "rgba(255,255,255,0.7)",
                            fontSize: { xs: "0.95rem", md: "1.3rem" },
                            fontWeight: 500,
                            fontFamily: "monospace",
                          }}
                        >
                          -
                        </Typography>
                        <Typography
                          sx={{
                            color: "rgba(255,255,255,0.7)",
                            fontSize: { xs: "0.95rem", md: "1.3rem" },
                            fontWeight: 500,
                            fontFamily: "monospace",
                          }}
                        >
                          {formatTime(paradeItem.performance_end_time)}
                        </Typography>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
              );
            }
            })
          )}
        </Box>
      )}
    </Box>
  );
}


