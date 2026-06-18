"use client";

import { Box, Typography, Paper, Chip, Avatar } from "@mui/material";
import { VerifiedUser as VerifiedIcon } from "@mui/icons-material";
import AdminMasterShell from "@/app/components/AdminMasterShell";
import { BRAND_MOCKS } from "@/app/services/campaigns/mockData";

const BRAND_NAMES: Record<string, string> = {
  brahma: "Brahma", sicoob: "Sicoob", volkswagen: "Volkswagen", ballantines: "Ballantines", globo: "Globo",
};
const BRAND_PHOTOS: Record<string, string> = {
  brahma: "/ads/2.png", sicoob: "/ads/3.png", volkswagen: "/ads/4.png", ballantines: "/ads/5.png", globo: "/ads/1.png",
};
const MOCK_USERS = Object.keys(BRAND_MOCKS).map((brand, i) => ({
  id: i + 1,
  brand,
  name: BRAND_NAMES[brand] ?? brand,
  email: `contato@${brand}.com.br`,
  campaigns: BRAND_MOCKS[brand].length,
  status: brand === "ballantines" ? "pending" : "active",
  since: `202${5 + (i % 2)}-0${(i % 9) + 1}-15`,
}));

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  active:  { label: "Ativo",    color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
  pending: { label: "Pendente", color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  blocked: { label: "Bloqueado",color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
};

export default function UsuariosPage() {
  return (
    <AdminMasterShell>
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 3, sm: 4 }, pb: 6 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mb: 0.3 }}>Usuários</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Patrocinadores cadastrados na plataforma</Typography>
        </Box>

        {/* Summary */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 4 }}>
          {[
            { label: "Total",    value: MOCK_USERS.length },
            { label: "Ativos",   value: MOCK_USERS.filter(u => u.status === "active").length },
            { label: "Pendentes",value: MOCK_USERS.filter(u => u.status === "pending").length },
          ].map((s) => (
            <Paper key={s.label} elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5 }}>
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", mb: 0.5 }}>{s.label}</Typography>
              <Typography sx={{ color: "#ffcc01", fontWeight: 800, fontSize: "1.3rem" }}>{s.value}</Typography>
            </Paper>
          ))}
        </Box>

        {/* List */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {MOCK_USERS.map((u) => {
            const st = STATUS[u.status];
            return (
              <Paper key={u.id} elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2, display: "flex", alignItems: "center", gap: 2, cursor: "pointer", transition: "background 0.15s", "&:hover": { backgroundColor: "rgba(255,255,255,0.07)" } }}>
                <Avatar src={BRAND_PHOTOS[u.brand]} sx={{ width: 40, height: 40, border: "2px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem" }}>{u.name}</Typography>
                    <VerifiedIcon sx={{ fontSize: 14, color: "#10b981" }} />
                  </Box>
                  <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>{u.email}</Typography>
                </Box>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", flexShrink: 0 }}>
                  {u.campaigns} campanha{u.campaigns !== 1 ? "s" : ""}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", flexShrink: 0, display: { xs: "none", sm: "block" } }}>
                  desde {new Date(u.since).toLocaleDateString("pt-BR")}
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
