"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box, CircularProgress, Typography, Paper, Chip,
  Button, Divider, Skeleton,
} from "@mui/material";
import {
  Campaign as CampaignIcon, Add as AddIcon,
  CheckCircle as CheckCircleIcon, AccessTime as PendingIcon,
  Cancel as CancelIcon, TouchApp as ClickIcon, Visibility as ViewIcon,
  CalendarToday as CalendarIcon, Image as ImageIcon, Movie as VideoIcon,
  AttachMoney as MoneyIcon, TrendingUp as TrendingIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import { listMyCampaigns, type Campaign } from "@/app/services/campaigns/campaignService";
import { BRAND_MOCKS, MOCK_PERFORMANCE, detectBrand } from "@/app/services/campaigns/mockData";
import PatrocinadorShell from "@/app/components/PatrocinadorShell";
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartTooltip, ResponsiveContainer, Legend,
} from "recharts";


function statusChip(status: string) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    active:    { label: "Ativo",      color: "#10b981", icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
    pending:   { label: "Pendente",   color: "#f59e0b", icon: <PendingIcon    sx={{ fontSize: 14 }} /> },
    paused:    { label: "Pausado",    color: "#6b7280", icon: <PendingIcon    sx={{ fontSize: 14 }} /> },
    finished:  { label: "Finalizado", color: "#3b82f6", icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
    cancelled: { label: "Cancelado",  color: "#ef4444", icon: <CancelIcon    sx={{ fontSize: 14 }} /> },
  };
  const s = map[status] ?? { label: status, color: "#9ca3af", icon: null };
  return (
    <Chip
      icon={s.icon as React.ReactElement}
      label={s.label}
      size="small"
      sx={{ backgroundColor: `${s.color}22`, border: `1px solid ${s.color}55`, color: s.color, fontWeight: 600, fontSize: "0.7rem", height: 24 }}
    />
  );
}

function CampaignCard({ c }: { c: Campaign }) {
  const router = useRouter();
  const perf = MOCK_PERFORMANCE[c.id] ?? [];
  const totalUnits = perf.reduce((s, d) => s + d.units, 0);
  const totalGasto = perf.reduce((s, d) => s + d.gasto, 0);
  // Campanhas reais sem dados de performance ainda: exibir o orçamento contratado
  const displayGasto = totalGasto > 0 ? totalGasto : (c.budget_value ?? 0);
  const created = new Date(c.created_at).toLocaleDateString("pt-BR");
  const isVideo = c.creative_url ? /\.(mp4|mov|webm)$/i.test(c.creative_url) : false;

  return (
    <Paper
      elevation={0}
      onClick={() => router.push(`/pages/patrocinador/campanha/${c.id}`)}
      sx={{
        backgroundColor: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 3, overflow: "hidden",
        display: "flex", flexDirection: "column",
        transition: "all 0.2s ease", cursor: "pointer",
        "&:hover": { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.18)", transform: "translateY(-2px)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" },
      }}
    >
      <Box sx={{ position: "relative", width: "100%", height: 160, flexShrink: 0, backgroundColor: "rgba(0,0,0,0.35)" }}>
        {c.creative_url && !isVideo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.creative_url} alt={c.creative_name ?? c.campaign_name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : c.creative_url && isVideo ? (
          <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <VideoIcon sx={{ fontSize: 36, color: "rgba(255,255,255,0.25)" }} />
            <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem" }}>Vídeo</Typography>
          </Box>
        ) : (
          <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <ImageIcon sx={{ fontSize: 36, color: "rgba(255,255,255,0.15)" }} />
            <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.72rem" }}>Sem criativo</Typography>
          </Box>
        )}
        <Box sx={{ position: "absolute", top: 10, right: 10 }}>{statusChip(c.status)}</Box>
        <Box sx={{ position: "absolute", top: 10, left: 10 }}>
          <Chip
            icon={c.ad_type === "CPC" ? <ClickIcon sx={{ fontSize: 11 }} /> : <ViewIcon sx={{ fontSize: 11 }} />}
            label={c.ad_type}
            size="small"
            sx={{ backgroundColor: "rgba(79,70,229,0.75)", backdropFilter: "blur(8px)", border: "1px solid rgba(79,70,229,0.5)", color: "#c7d2fe", fontSize: "0.65rem", height: 20, fontWeight: 700 }}
          />
        </Box>
      </Box>

      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5, flex: 1 }}>
        <Box>
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.92rem", lineHeight: 1.3, mb: 0.3 }}>
            {c.campaign_name}
          </Typography>
          {c.creative_name && (
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>{c.creative_name}</Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
          <CalendarIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }} />
          <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>{created}</Typography>
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.07)" }} />
        <Box sx={{ display: "flex", gap: 3 }}>
          <Box>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem", mb: 0.2 }}>
              {c.ad_type === "CPC" ? "Cliques" : "Views"}
            </Typography>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem" }}>
              {totalUnits.toLocaleString("pt-BR")}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem", mb: 0.2 }}>Investido</Typography>
            <Typography sx={{ color: "#ffcc01", fontWeight: 700, fontSize: "0.88rem" }}>
              R$ {displayGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
          {c.duration_days && (
            <Box>
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem", mb: 0.2 }}>Duração</Typography>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem" }}>{c.duration_days}d</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

export default function PatrocinadorHomePage() {
  const { isPatrocinador, authReady, role, userName } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (!authReady) return;
    if (role === null) return;
    if (!isPatrocinador) router.replace("/pages/user/home");
  }, [authReady, role, isPatrocinador, router]);

  const fetchCampaigns = useCallback(async () => {
    const brand = detectBrand(userName);
    const mocks = BRAND_MOCKS[brand] ?? [];
    try {
      setLoading(true);
      let real: Campaign[] = [];
      try { real = await listMyCampaigns(); } catch { /* API offline */ }
      setCampaigns([...real, ...mocks]);
    } catch {
      setCampaigns(mocks);
    } finally {
      setLoading(false);
    }
  }, [userName]);

  useEffect(() => { if (authReady && isPatrocinador) fetchCampaigns(); }, [authReady, isPatrocinador, fetchCampaigns]);

  if (!authReady) {
    return (
      <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#ffcc01" }} />
      </Box>
    );
  }

  return (
    <PatrocinadorShell>
      <Box
        sx={{
          px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 3, sm: 4 }, pb: 6,
          opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.45s ease, transform 0.45s ease",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mb: 0.3 }}>Meus Anúncios</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Gerencie e acompanhe suas campanhas</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push("/pages/patrocinador/nova-campanha")}
            sx={{ backgroundColor: "#ffcc01", color: "#111", fontWeight: 700, borderRadius: "10px", textTransform: "none", px: 2.5, "&:hover": { backgroundColor: "#e6b800" } }}
          >
            Nova Campanha
          </Button>
        </Box>

        {/* ── Dashboard geral ───────────────────────────────────────────────── */}
        {!loading && campaigns.length > 0 && (() => {
          const GRID  = "rgba(255,255,255,0.06)";
          const AXIS  = "rgba(255,255,255,0.28)";
          const COLORS = ["#ffcc01","#10b981","#6366f1","#f59e0b","#ec4899"];

          // Aggregate daily data across all campaigns
          const dateMap: Record<string, { units: number; gasto: number }> = {};
          campaigns.forEach((c) => {
            (MOCK_PERFORMANCE[c.id] ?? []).forEach((d) => {
              if (!dateMap[d.date]) dateMap[d.date] = { units: 0, gasto: 0 };
              dateMap[d.date].units += d.units;
              dateMap[d.date].gasto += d.gasto;
            });
          });
          const lineData = Object.entries(dateMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, v]) => ({ date, interações: v.units, gasto: parseFloat(v.gasto.toFixed(2)) }));

          // Per-campaign bar data
          const barData = campaigns
            .map((c) => {
              const perf = MOCK_PERFORMANCE[c.id] ?? [];
              return {
                name: c.campaign_name.length > 14 ? c.campaign_name.slice(0, 12) + "…" : c.campaign_name,
                fullName: c.campaign_name,
                interações: perf.reduce((s, d) => s + d.units, 0),
                gasto: parseFloat(perf.reduce((s, d) => s + d.gasto, 0).toFixed(2)),
              };
            })
            .filter((r) => r.interações > 0);

          // Summary numbers
          const totalInvested = campaigns.reduce((s, c) => {
            const gasto = (MOCK_PERFORMANCE[c.id] ?? []).reduce((a, d) => a + d.gasto, 0);
            return s + (gasto > 0 ? gasto : (c.budget_value ?? 0));
          }, 0);
          const totalUnits    = campaigns.reduce((s, c) => s + (MOCK_PERFORMANCE[c.id] ?? []).reduce((a, d) => a + d.units, 0), 0);
          const activeCnt     = campaigns.filter((c) => c.status === "active").length;
          const avgProgress   = campaigns.length > 0
            ? Math.round(campaigns.reduce((s, c) => {
                const units = (MOCK_PERFORMANCE[c.id] ?? []).reduce((a, d) => a + d.units, 0);
                return s + Math.min(100, c.target_units > 0 ? (units / c.target_units) * 100 : 0);
              }, 0) / campaigns.length)
            : 0;

          return (
            <Box sx={{ mb: 4 }}>
              {/* Stats row */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
                {[
                  { icon: <MoneyIcon sx={{ fontSize: 20 }} />,   label: "Total investido",  value: `R$ ${totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#ffcc01" },
                  { icon: <ClickIcon sx={{ fontSize: 20 }} />,   label: "Interações",       value: totalUnits.toLocaleString("pt-BR"), color: "#10b981" },
                  { icon: <CampaignIcon sx={{ fontSize: 20 }} />,label: "Ativas",           value: activeCnt, color: "#a5b4fc" },
                  { icon: <TrendingIcon sx={{ fontSize: 20 }} />, label: "Progresso médio", value: `${avgProgress}%`, color: "#f59e0b" },
                ].map((s) => (
                  <Paper key={s.label} elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 0.8 }}>
                      <Box sx={{ color: s.color, opacity: 0.8 }}>{s.icon}</Box>
                      <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>{s.label}</Typography>
                    </Box>
                    <Typography sx={{ color: s.color, fontWeight: 800, fontSize: "1.2rem" }}>{s.value}</Typography>
                  </Paper>
                ))}
              </Box>

              {/* Charts */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3, mb: 3 }}>

                {/* Line — daily performance */}
                <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 3 }}>
                  <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem", mb: 0.3 }}>Performance diária</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", mb: 2.5 }}>Interações e gasto somados de todas as campanhas</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={lineData} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                      <XAxis dataKey="date" tick={{ fill: AXIS, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: AXIS, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <RechartTooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                      <Legend formatter={(v) => <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>{v}</span>} />
                      <Line type="monotone" dataKey="interações" stroke="#ffcc01" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      <Line type="monotone" dataKey="gasto" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>

                {/* Bar — per campaign */}
                <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 3 }}>
                  <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem", mb: 0.3 }}>Interações por campanha</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", mb: 2.5 }}>Total de cliques e views por anúncio</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barData} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                      <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: AXIS, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <RechartTooltip
                        contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                        labelStyle={{ color: "#fff", fontWeight: 600, marginBottom: 4 }}
                        itemStyle={{ color: "#fff" }}
                        labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullName ?? _label}
                        formatter={(v) => [Number(v).toLocaleString("pt-BR"), "Interações"]}
                      />
                      <Bar dataKey="interações" radius={[5, 5, 0, 0]}>
                        {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Box>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.07)", mb: 4 }} />

              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", mb: 2.5 }}>
                Meus Anúncios
              </Typography>
            </Box>
          );
        })()}

        {loading ? (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "repeat(3, 1fr)" }, gap: 2 }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={280} sx={{ bgcolor: "rgba(255,255,255,0.07)", borderRadius: 3 }} />)}
          </Box>
        ) : campaigns.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 4, border: "1px dashed rgba(255,255,255,0.12)" }}>
            <CampaignIcon sx={{ fontSize: 52, color: "rgba(255,255,255,0.18)", mb: 2 }} />
            <Typography sx={{ color: "rgba(255,255,255,0.5)", mb: 2 }}>Você ainda não tem campanhas</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => router.push("/pages/patrocinador/nova-campanha")}
              sx={{ color: "#ffcc01", borderColor: "rgba(255,204,1,0.4)", borderRadius: "10px", textTransform: "none", fontWeight: 600, "&:hover": { backgroundColor: "rgba(255,204,1,0.08)" } }}
            >
              Criar primeira campanha
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "repeat(3, 1fr)" }, gap: 2 }}>
            {campaigns.map((c) => <CampaignCard key={c.id} c={c} />)}
          </Box>
        )}
      </Box>
    </PatrocinadorShell>
  );
}
