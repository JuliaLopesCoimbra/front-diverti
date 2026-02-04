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
         {lineupItems.map((item) => (
  <Paper
    key={item.id}
    elevation={0}
    sx={{
      backgroundColor: "rgba(255,255,255,0.05)",
      borderRadius: 3,
      display: "flex",
      alignItems: "stretch", // Faz os itens internos terem a mesma altura se necessário
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
    {/* Container da Foto - Padronizado */}
  {/* Container da Foto - Ultra Padronizado */}
<Box
  sx={{
    // Definimos o mesmo valor para os três para "travar" o tamanho
    width: { xs: 150, sm: 180, md: 200 },
    minWidth: { xs: 150, sm: 180, md: 200 },
    maxWidth: { xs: 150, sm: 180, md: 200 },
    
    height: { xs: 150, sm: 180, md: 200 },
    
    // Essencial para o Flexbox não tentar expandir a largura
    flexShrink: 0,
    
    aspectRatio: "1 / 1",
    overflow: "hidden",
    borderRadius: 2,
    backgroundColor: "rgba(255, 201, 31, 0.1)",
    position: "relative", // Garante posicionamento correto da img interna
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
        // A imagem ocupa 100% do container travado acima
        width: "100%",
        height: "100% !important", // Força o height para sobrescrever CSS global
        maxHeight: "100% !important",
        // O cover corta as sobras (largura ou altura) para caber no quadrado
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
        justifyContent: "space-between", // Distribui nome em cima e horário embaixo
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

        {item.description && (
          <Typography
            sx={{
              color: "rgba(255,255,255,0.6)",
              fontSize: { xs: "0.85rem", md: "0.95rem" },
              display: "-webkit-box",
              WebkitLineClamp: 3, // Limita a 3 linhas para não quebrar o layout
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.4,
            }}
          >
            {item.description}
          </Typography>
        )}
      </Box>

      <Typography
        sx={{
          color: "#fff",
          fontSize: { xs: "1.8rem", md: "1.9rem" },
          fontWeight: 700,
          mt: 1,
          fontFamily: "monospace", // Estilo relógio para o horário
        }}
      >
        {formatTime(item.performance_time)}
      </Typography>
    </Box>
  </Paper>
))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

