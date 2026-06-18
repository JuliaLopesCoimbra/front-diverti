"use client";

import { Box, Typography, Paper, Chip } from "@mui/material";
import { Event as EventIcon, LocationOn as LocationIcon, People as PeopleIcon } from "@mui/icons-material";
import AdminMasterShell from "@/app/components/AdminMasterShell";

const MOCK_EVENTS = [
  { id: 1, name: "Festa do Peão de Barretos",     city: "Barretos, SP",     date: "2026-08-15", attendees: 180000, status: "upcoming" },
  { id: 2, name: "Rodeio de Americana",            city: "Americana, SP",    date: "2026-07-04", attendees: 95000,  status: "upcoming" },
  { id: 3, name: "Expogran Serra Gaúcha",          city: "Caxias do Sul, RS",date: "2026-09-20", attendees: 60000,  status: "upcoming" },
  { id: 4, name: "Show Sertanejo Goiânia",         city: "Goiânia, GO",      date: "2026-05-10", attendees: 42000,  status: "finished" },
  { id: 5, name: "Circuito Sertanejo Ribeirão",    city: "Ribeirão Preto, SP",date: "2026-06-01",attendees: 75000,  status: "finished" },
];

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  upcoming: { label: "Próximo",     color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  active:   { label: "Em andamento",color: "#ffcc01", bg: "rgba(255,204,1,0.12)"  },
  finished: { label: "Encerrado",   color: "#6b7280", bg: "rgba(107,114,128,0.12)"},
};

export default function EventosPage() {
  return (
    <AdminMasterShell>
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 3, sm: 4 }, pb: 6 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mb: 0.3 }}>Eventos</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Todos os eventos cadastrados na plataforma</Typography>
        </Box>

        {/* Summary */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 4 }}>
          {[
            { label: "Total de eventos", value: MOCK_EVENTS.length },
            { label: "Próximos",         value: MOCK_EVENTS.filter(e => e.status === "upcoming").length },
            { label: "Público total",    value: MOCK_EVENTS.reduce((s, e) => s + e.attendees, 0).toLocaleString("pt-BR") },
          ].map((s) => (
            <Paper key={s.label} elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5 }}>
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", mb: 0.5 }}>{s.label}</Typography>
              <Typography sx={{ color: "#ffcc01", fontWeight: 800, fontSize: "1.3rem" }}>{s.value}</Typography>
            </Paper>
          ))}
        </Box>

        {/* List */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {MOCK_EVENTS.map((ev) => {
            const st = STATUS[ev.status];
            return (
              <Paper key={ev.id} elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5, display: "flex", alignItems: "center", gap: 2.5, cursor: "pointer", transition: "background 0.15s", "&:hover": { backgroundColor: "rgba(255,255,255,0.07)" } }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, backgroundColor: "rgba(255,204,1,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <EventIcon sx={{ color: "#ffcc01", fontSize: 22 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.name}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                      <LocationIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }} />
                      <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>{ev.city}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                      <PeopleIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }} />
                      <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>{ev.attendees.toLocaleString("pt-BR")} pessoas</Typography>
                    </Box>
                  </Box>
                </Box>
                <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem", flexShrink: 0 }}>
                  {new Date(ev.date).toLocaleDateString("pt-BR")}
                </Typography>
                <Chip label={st.label} size="small" sx={{ backgroundColor: st.bg, color: st.color, fontWeight: 700, fontSize: "0.68rem", flexShrink: 0 }} />
              </Paper>
            );
          })}
        </Box>
      </Box>
    </AdminMasterShell>
  );
}
