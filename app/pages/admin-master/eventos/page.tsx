"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AdminMasterShell from "@/app/components/AdminMasterShell";
import { useToast } from "@/app/context/ToastContext";
import { getEvents, EventResponse } from "@/app/services/events/eventAppService";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminMasterEventosPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents(100, 0)
      .then((data) =>
        setEvents([...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      )
      .catch(() => showToast("Erro ao carregar eventos", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const active   = events.filter((e) => e.is_active).length;
  const inactive = events.filter((e) => !e.is_active).length;

  return (
    <AdminMasterShell>
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 3, sm: 4 }, pb: 6 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 4, gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mb: 0.3 }}>Eventos</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
              Todos os eventos cadastrados na plataforma
            </Typography>
          </Box>
          <Button
            startIcon={<AddIcon />}
            onClick={() => router.push("/pages/admin/events/create")}
            sx={{ backgroundColor: "#fff", color: "#111", textTransform: "none", fontWeight: 700, borderRadius: "12px", px: 2.5, flexShrink: 0, "&:hover": { backgroundColor: "#e8e8e8" } }}
          >
            Criar evento
          </Button>
        </Box>

        {/* Summary cards */}
        {!loading && events.length > 0 && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, 1fr)" }, gap: 2, mb: 4 }}>
            {[
              { label: "Total",    value: events.length, color: "#ffcc01" },
              { label: "Ativos",   value: active,        color: "#2ecc71" },
              { label: "Inativos", value: inactive,      color: "rgba(255,255,255,0.4)" },
            ].map((s) => (
              <Paper key={s.label} elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5 }}>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", mb: 0.5 }}>{s.label}</Typography>
                <Typography sx={{ color: s.color, fontWeight: 800, fontSize: "1.4rem" }}>{s.value}</Typography>
              </Paper>
            ))}
          </Box>
        )}

        {/* Content */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: "#ffcc01" }} />
          </Box>
        ) : events.length === 0 ? (
          <Paper sx={{ p: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
            <EventIcon sx={{ color: "rgba(255,255,255,0.12)", fontSize: 52, mb: 1.5 }} />
            <Typography sx={{ color: "#fff", fontWeight: 600, mb: 0.5 }}>Nenhum evento cadastrado</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem" }}>
              Clique em "Criar evento" para começar.
            </Typography>
          </Paper>
        ) : (
          /* ALTERADO: Grid Layout para os Cards */
          <Box 
            sx={{ 
              display: "grid", 
              gridTemplateColumns: { 
                xs: "1fr", 
                sm: "repeat(2, 1fr)", 
                md: "repeat(3, 1fr)" 
              }, 
              gap: 3 
            }}
          >
            {events.map((ev) => (
              <Paper
                key={ev.id}
                elevation={0}
                onClick={() => router.push(`/pages/admin/events/${ev.id}`)}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 4,
                  overflow: "hidden", // Garante que a imagem respeite o border-radius do card
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": { 
                    backgroundColor: "rgba(255,255,255,0.07)", 
                    border: "1px solid rgba(255,255,255,0.2)",
                    transform: "translateY(-4px)" // Efeito visual de levante no hover
                  },
                }}
              >
                {/* ALTERADO: Container da Foto Maior */}
                <Box sx={{ width: "100%", height: 180, position: "relative", backgroundColor: "rgba(255,255,255,0.02)" }}>
                  {ev.banner_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ev.banner_image}
                      alt={ev.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <EventIcon sx={{ color: "rgba(255,204,1,0.3)", fontSize: 40 }} />
                    </Box>
                  )}

                  {/* Status posicionado em cima da imagem (Badge) */}
                  <Chip
                    label={ev.is_active ? "Ativo" : "Inativo"}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      backgroundColor: ev.is_active ? "rgba(46,204,113,0.9)" : "rgba(17,17,17,0.8)",
                      color: ev.is_active ? "#fff" : "rgba(255,255,255,0.6)",
                      fontWeight: 700,
                      fontSize: "0.68rem",
                      backdropFilter: "blur(4px)"
                    }}
                  />
                </Box>

                {/* ALTERADO: Informações do evento abaixo da foto */}
                <Box sx={{ p: 2, display: "flex", flexDirection: "column", flexGrow: 1 }}>
                  <Typography 
                    sx={{ 
                      color: "#fff", 
                      fontWeight: 700, 
                      fontSize: "1rem", 
                      mb: 1.5,
                      // Quebra linha se o título for grande, limitando a 2 linhas
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      minHeight: "2.8rem" 
                    }}
                  >
                    {ev.title}
                  </Typography>
                  
                  {/* Detalhes na parte inferior do card */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: "auto" }}>
                    {ev.starts_at && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CalendarTodayIcon sx={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }} />
                        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem" }}>
                          {formatDate(ev.starts_at)}
                        </Typography>
                      </Box>
                    )}
                    {ev.location && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LocationOnIcon sx={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }} />
                        <Typography 
                          sx={{ 
                            color: "rgba(255,255,255,0.5)", 
                            fontSize: "0.78rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {ev.location}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </AdminMasterShell>
  );
}