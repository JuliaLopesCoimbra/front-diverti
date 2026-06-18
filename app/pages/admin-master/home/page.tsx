"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography, Paper, Chip, Divider } from "@mui/material";
import {
  Campaign as CampaignIcon,
  PeopleAlt as PeopleIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import AdminMasterShell from "@/app/components/AdminMasterShell";
import { BRAND_MOCKS, BRAND_DEFAULT_PHOTO, MOCK_PERFORMANCE } from "@/app/services/campaigns/mockData";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";

/* ── Mock sponsor summaries ──────────────────────────────────────────────── */
interface SponsorCard {
  brand: string;
  displayName: string;
  photo: string;
  campaignCount: number;
  activeCampaigns: number;
  totalInvested: number;
  totalUnits: number;
}

const BRAND_COLORS: Record<string, string> = {
  brahma: "#f59e0b",
  sicoob: "#10b981",
  volkswagen: "#6366f1",
  ballantines: "#ec4899",
  globo: "#3b82f6",
};

const MOCK_SPONSORS: SponsorCard[] = Object.entries(BRAND_MOCKS).map(([brand, campaigns]) => {
  const photo = BRAND_DEFAULT_PHOTO[brand] ?? "";
  const totalInvested = campaigns.reduce((sum, c) => {
    const perf = MOCK_PERFORMANCE[c.id] ?? [];
    return sum + perf.reduce((s, d) => s + d.gasto, 0);
  }, 0);
  const totalUnits = campaigns.reduce((sum, c) => {
    const perf = MOCK_PERFORMANCE[c.id] ?? [];
    return sum + perf.reduce((s, d) => s + d.units, 0);
  }, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const displayName = brand.charAt(0).toUpperCase() + brand.slice(1);
  return { brand, displayName, photo, campaignCount: campaigns.length, activeCampaigns, totalInvested, totalUnits };
});

/* ── Dashboard data ─────────────────────────────────────────────────────── */

// Bar chart: invested + units per brand
const BAR_DATA = MOCK_SPONSORS.map((s) => ({
  name: s.displayName,
  investido: parseFloat(s.totalInvested.toFixed(2)),
  interacoes: s.totalUnits,
  brand: s.brand,
}));

// Line chart: collect all unique dates across all brands, then build per-brand values
const ALL_DATES: string[] = [];
Object.entries(BRAND_MOCKS).forEach(([, campaigns]) => {
  campaigns.forEach((c) => {
    const perf = MOCK_PERFORMANCE[c.id] ?? [];
    perf.forEach((d) => { if (!ALL_DATES.includes(d.date)) ALL_DATES.push(d.date); });
  });
});
ALL_DATES.sort();

const LINE_DATA = ALL_DATES.map((date) => {
  const row: Record<string, string | number> = { date };
  Object.entries(BRAND_MOCKS).forEach(([brand, campaigns]) => {
    const daily = campaigns.reduce((sum, c) => {
      const day = (MOCK_PERFORMANCE[c.id] ?? []).find((d) => d.date === date);
      return sum + (day?.units ?? 0);
    }, 0);
    row[brand] = daily;
  });
  return row;
});

const CHART_GRID = "rgba(255,255,255,0.06)";
const CHART_AXIS = "rgba(255,255,255,0.3)";

/* ── Sponsor card component ──────────────────────────────────────────────── */
function SponsorCardItem({ s, onClick }: { s: SponsorCard; onClick: () => void }) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 3,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          border: "1px solid rgba(255,255,255,0.18)",
          backgroundColor: "rgba(255,255,255,0.07)",
          transform: "translateY(-3px)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
        },
      }}
    >
      {/* Cover photo */}
      <Box sx={{ position: "relative", height: 120, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        {s.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.photo}
            alt={s.displayName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography sx={{ color: "rgba(255,255,255,0.1)", fontWeight: 900, fontSize: "3rem" }}>
              {s.displayName.charAt(0)}
            </Typography>
          </Box>
        )}
        {/* Active badge */}
        {s.activeCampaigns > 0 && (
          <Box sx={{ position: "absolute", top: 10, right: 10 }}>
            <Chip
              label={`${s.activeCampaigns} ativa${s.activeCampaigns > 1 ? "s" : ""}`}
              size="small"
              sx={{ backgroundColor: "rgba(16,185,129,0.85)", color: "#fff", fontWeight: 700, fontSize: "0.65rem", height: 20, backdropFilter: "blur(4px)" }}
            />
          </Box>
        )}
      </Box>

      {/* Info */}
      <Box sx={{ p: 2 }}>
        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", mb: 0.3 }}>
          {s.displayName}
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", mb: 1.5 }}>
          {s.campaignCount} {s.campaignCount === 1 ? "campanha" : "campanhas"}
        </Typography>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 1.5 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.04em", mb: 0.2 }}>
              Investido
            </Typography>
            <Typography sx={{ color: "#ffcc01", fontWeight: 700, fontSize: "0.82rem" }}>
              R$ {s.totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.04em", mb: 0.2 }}>
              Interações
            </Typography>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.82rem" }}>
              {s.totalUnits.toLocaleString("pt-BR")}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function AdminMasterHomePage() {
  const { isAdminMaster, authReady, role } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (role === null) return;
    if (!isAdminMaster) router.replace("/pages/admin/home");
  }, [authReady, role, isAdminMaster, router]);

  if (!authReady) {
    return (
      <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#ffcc01" }} />
      </Box>
    );
  }

  return (
    <AdminMasterShell>
      <Box
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 3, sm: 4 },
          pb: 8,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.45s ease, transform 0.45s ease",
        }}
      >
        {/* Title */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mb: 0.3 }}>Dashboard de Anúncios</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Visão consolidada de todos os patrocinadores e suas campanhas</Typography>
        </Box>

        {/* Summary stats */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 5 }}>
            {[
              { icon: <PeopleIcon sx={{ fontSize: 20 }} />, label: "Patrocinadores", value: MOCK_SPONSORS.length, color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.25)" },
              { icon: <CampaignIcon sx={{ fontSize: 20 }} />, label: "Campanhas", value: MOCK_SPONSORS.reduce((s, sp) => s + sp.campaignCount, 0), color: "#a5b4fc", bg: "rgba(79,70,229,0.15)", border: "rgba(79,70,229,0.25)" },
              { icon: <MoneyIcon sx={{ fontSize: 20 }} />, label: "Invest. total", value: `R$ ${MOCK_SPONSORS.reduce((s, sp) => s + sp.totalInvested, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#ffcc01", bg: "rgba(255,204,1,0.12)", border: "rgba(255,204,1,0.25)", gridColumn: { xs: "1 / -1", sm: "auto" } as Record<string,string> },
            ].map((s) => (
              <Paper key={s.label} elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 3, p: 2.5, gridColumn: s.gridColumn }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, backgroundColor: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                    {s.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>{s.label}</Typography>
                    <Typography sx={{ color: s.color, fontWeight: 700, fontSize: "1.2rem" }}>{s.value}</Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>

        {/* ── Sponsor cards ─────────────────────────────────────────────────── */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", mb: 2.5 }}>
            Patrocinadores
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" }, gap: 2, mb: 5 }}>
            {MOCK_SPONSORS.map((s) => <SponsorCardItem key={s.brand} s={s} onClick={() => router.push(`/pages/admin-master/patrocinador/${s.brand}`)} />)}
          </Box>
        </Box>

        {/* ── Dashboard ─────────────────────────────────────────────────────── */}
        <Divider sx={{ borderColor: "rgba(255,255,255,0.07)", mb: 4 }} />

        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", mb: 3 }}>
          Dashboard de performance
        </Typography>

        {/* Top row: invested + interactions side by side */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3, mb: 3 }}>

          {/* Investimento por patrocinador */}
          <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 3 }}>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem", mb: 0.4 }}>Investimento por patrocinador</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", mb: 2.5 }}>Total gasto em R$ por marca</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={BAR_DATA} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="name" tick={{ fill: CHART_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: CHART_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                <RechartTooltip
                  contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                  labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(v) => [`R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Investido"]}
                />
                <Bar dataKey="investido" radius={[6, 6, 0, 0]}>
                  {BAR_DATA.map((entry) => (
                    <Cell key={entry.brand} fill={BRAND_COLORS[entry.brand] ?? "#6366f1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Interações por patrocinador */}
          <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 3 }}>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem", mb: 0.4 }}>Interações por patrocinador</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", mb: 2.5 }}>Total de cliques e visualizações por marca</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={BAR_DATA} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="name" tick={{ fill: CHART_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: CHART_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toLocaleString("pt-BR")} />
                <RechartTooltip
                  contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                  labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(v) => [Number(v).toLocaleString("pt-BR"), "Interações"]}
                />
                <Bar dataKey="interacoes" radius={[6, 6, 0, 0]}>
                  {BAR_DATA.map((entry) => (
                    <Cell key={entry.brand} fill={BRAND_COLORS[entry.brand] ?? "#6366f1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Line chart: daily interactions per brand */}
        <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 3, mb: 3 }}>
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem", mb: 0.4 }}>Interações diárias por patrocinador</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", mb: 2.5 }}>Evolução de cliques e views ao longo dos dias</Typography>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={LINE_DATA} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis dataKey="date" tick={{ fill: CHART_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: CHART_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
              <RechartTooltip
                contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                formatter={(v, name) => [Number(v).toLocaleString("pt-BR"), String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
              />
              <Legend formatter={(v) => <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{v.charAt(0).toUpperCase() + v.slice(1)}</span>} />
              {Object.keys(BRAND_MOCKS).map((brand) => (
                <Line
                  key={brand}
                  type="monotone"
                  dataKey={brand}
                  stroke={BRAND_COLORS[brand] ?? "#fff"}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        {/* Mini ranking table */}
        <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ px: 3, py: 2, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "grid", gridTemplateColumns: "1fr 120px 120px 80px 80px", gap: 2 }}>
            {["Patrocinador", "Investido", "Interações", "Campanhas", "Ativas"].map((h) => (
              <Typography key={h} sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</Typography>
            ))}
          </Box>
          {[...MOCK_SPONSORS].sort((a, b) => b.totalInvested - a.totalInvested).map((s, i, arr) => (
            <Box
              key={s.brand}
              onClick={() => router.push(`/pages/admin-master/patrocinador/${s.brand}`)}
              sx={{
                px: 3, py: 2,
                borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                display: "grid", gridTemplateColumns: "1fr 120px 120px 80px 80px",
                gap: 2, alignItems: "center",
                cursor: "pointer",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.03)" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: BRAND_COLORS[s.brand] ?? "#fff", flexShrink: 0 }} />
                <Box sx={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                  {s.photo && <img src={s.photo} alt={s.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </Box>
                <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>{s.displayName}</Typography>
              </Box>
              <Typography sx={{ color: "#ffcc01", fontWeight: 700, fontSize: "0.85rem" }}>
                R$ {s.totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>
                {s.totalUnits.toLocaleString("pt-BR")}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>{s.campaignCount}</Typography>
              <Chip label={s.activeCampaigns} size="small" sx={{ backgroundColor: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontWeight: 700, fontSize: "0.72rem", height: 22, width: "fit-content" }} />
            </Box>
          ))}
        </Paper>

      </Box>
    </AdminMasterShell>
  );
}
