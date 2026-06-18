"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Typography, Paper, Chip, IconButton, Divider, Tooltip,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  TouchApp as ClickIcon, Visibility as ViewIcon,
  CalendarToday as CalendarIcon, CheckCircle as CheckCircleIcon,
  AccessTime as PendingIcon, Cancel as CancelIcon,
  Link as LinkIcon, Image as ImageIcon, Movie as VideoIcon,
  Group as AudienceIcon, Place as LocationIcon, Loyalty as TagIcon,
  Work as WorkIcon, AttachMoney as MoneyIcon, BarChart as ChartIcon,
  EmojiEvents as TrophyIcon, Schedule as ScheduleIcon, TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import AdminMasterShell from "@/app/components/AdminMasterShell";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, AreaChart, Area, RadialBarChart, RadialBar, Legend,
  BarChart, Bar, Cell,
} from "recharts";
import { BRAND_MOCKS, BRAND_DEFAULT_PHOTO, MOCK_PERFORMANCE } from "@/app/services/campaigns/mockData";
import type { Campaign } from "@/app/services/campaigns/campaignService";

const CPC_PRICE = 0.14;
const CPV_PRICE = 0.1;
const CHART_GRID_COLOR = "rgba(255,255,255,0.06)";
const CHART_AXIS_COLOR = "rgba(255,255,255,0.25)";

function statusConfig(status: string) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    active:    { label: "Ativo",      color: "#10b981", icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
    pending:   { label: "Pendente",   color: "#f59e0b", icon: <PendingIcon     sx={{ fontSize: 14 }} /> },
    paused:    { label: "Pausado",    color: "#6b7280", icon: <PendingIcon     sx={{ fontSize: 14 }} /> },
    finished:  { label: "Finalizado", color: "#3b82f6", icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
    cancelled: { label: "Cancelado",  color: "#ef4444", icon: <CancelIcon      sx={{ fontSize: 14 }} /> },
  };
  return map[status] ?? { label: status, color: "#9ca3af", icon: null };
}

function StatCard({ label, value, sub, color = "#fff" }: { label: string; value: React.ReactNode; sub?: string; color?: string }) {
  return (
    <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2.5, p: 2.5, textAlign: "center" }}>
      <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.8 }}>
        {label}
      </Typography>
      <Typography sx={{ color, fontWeight: 800, fontSize: "1.6rem", lineHeight: 1 }}>{value}</Typography>
      {sub && <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem", mt: 0.5 }}>{sub}</Typography>}
    </Paper>
  );
}

function InfoCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2.5, p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Box sx={{ color: "rgba(255,204,1,0.8)", display: "flex" }}>{icon}</Box>
        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
}

function EmptyChartOverlay({ label = "Sem dados ainda" }: { label?: string }) {
  return (
    <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5, zIndex: 2, pointerEvents: "none" }}>
      <ChartIcon sx={{ fontSize: 36, color: "rgba(255,255,255,0.1)" }} />
      <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem", fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ color: "rgba(255,255,255,0.15)", fontSize: "0.7rem" }}>Os dados aparecerão quando a campanha estiver ativa</Typography>
    </Box>
  );
}

function buildEmptyDays(n = 7) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return { date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), units: 0, gasto: 0 };
  });
}

export default function AdminCampaignDetailPage({
  params,
}: {
  params: Promise<{ brand: string; id: string }>;
}) {
  const { brand, id } = use(params);
  const router = useRouter();

  const campaigns = BRAND_MOCKS[brand] ?? [];
  const c = campaigns.find((x) => String(x.id) === String(id)) as Campaign | undefined;
  const brandPhoto = BRAND_DEFAULT_PHOTO[brand];
  const brandName = brand.charAt(0).toUpperCase() + brand.slice(1);

  if (!c) {
    return (
      <AdminMasterShell>
        <Box sx={{ px: 4, pt: 4 }}>
          <Typography sx={{ color: "#fff" }}>Campanha não encontrada.</Typography>
        </Box>
      </AdminMasterShell>
    );
  }

  const st = statusConfig(c.status);
  const rate = c.ad_type === "CPC" ? CPC_PRICE : CPV_PRICE;
  const totalInvestment = c.budget_value ?? c.target_units * rate;
  const isVideo = c.creative_url ? /\.(mp4|mov|webm)$/i.test(c.creative_url) : false;

  const startAt = c.start_at
    ? new Date(c.start_at.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
  const endDate = c.start_at && c.duration_days
    ? (() => {
        const d = new Date(c.start_at.slice(0, 10) + "T12:00:00");
        d.setDate(d.getDate() + c.duration_days);
        return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
      })()
    : null;

  const perfData = MOCK_PERFORMANCE[c.id] ?? buildEmptyDays(7);
  const hasData = perfData.some((d) => d.units > 0);
  const realizedUnits = perfData.reduce((s, d) => s + d.units, 0);
  const progressPct = c.target_units > 0 ? Math.min(100, Math.round(realizedUnits / c.target_units * 100)) : 0;
  const ctrData = perfData.map((d, i) => ({ date: d.date, ctr: d.units === 0 ? 0 : parseFloat((7 + Math.sin(i * 1.4) * 4).toFixed(1)) }));
  const radialData = [{ name: "Progresso", value: progressPct, fill: "#ffcc01" }];

  const seed = Number(id) || 1;
  const DOW_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const DOW_FULL   = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const dowData = DOW_LABELS.map((day, i) => ({
    day,
    units: Math.round(140 + Math.sin((i + seed) * 1.1) * 90 + (i === (seed % 7) ? 130 : 0) + (i === 5 ? 60 : 0)),
  }));
  const bestDow = dowData.reduce((b, d) => d.units > b.units ? d : b);
  const bestDowFull = DOW_FULL[DOW_LABELS.indexOf(bestDow.day)];

  const hourData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, "0")}h`,
    units: Math.round(
      15 +
      (h >= 7  && h <= 9  ? 55 : 0) +
      (h >= 12 && h <= 14 ? 45 : 0) +
      (h >= 18 && h <= 22 ? 90 : 0) +
      Math.abs(Math.sin(h * 0.6 + seed) * 20)
    ),
  }));
  const bestHour  = hourData.reduce((b, h) => h.units > b.units ? h : b);
  const worstHour = hourData.reduce((b, h) => h.units < b.units ? h : b);

  return (
    <AdminMasterShell>
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 3, sm: 4 }, pb: 8 }}>

        {/* ── Breadcrumb / back ──────────────────────────────────────────────── */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4, flexWrap: "wrap" }}>
          <IconButton
            onClick={() => router.back()}
            size="small"
            sx={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, "&:hover": { color: "#fff", borderColor: "rgba(255,255,255,0.3)" } }}
          >
            <BackIcon fontSize="small" />
          </IconButton>

          {/* Brand pill */}
          <Box
            onClick={() => router.push(`/pages/admin-master/patrocinador/${brand}`)}
            sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", "&:hover": { opacity: 0.8 } }}
          >
            <Box sx={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", border: "1.5px solid rgba(255,204,1,0.3)", flexShrink: 0 }}>
              {brandPhoto
                ? <img src={brandPhoto} alt={brandName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <Box sx={{ width: "100%", height: "100%", backgroundColor: "rgba(255,204,1,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}><Typography sx={{ color: "#ffcc01", fontWeight: 800, fontSize: "0.7rem" }}>{brandName[0]}</Typography></Box>
              }
            </Box>
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>{brandName}</Typography>
          </Box>

          <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.8rem" }}>/</Typography>
          <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>{c.campaign_name}</Typography>

          <Box sx={{ ml: "auto" }}>
            <Chip
              icon={st.icon as React.ReactElement}
              label={st.label}
              size="small"
              sx={{ backgroundColor: `${st.color}22`, border: `1px solid ${st.color}55`, color: st.color, fontWeight: 700, fontSize: "0.72rem" }}
            />
          </Box>
        </Box>

        {/* ── Creative + Summary ─────────────────────────────────────────────── */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "300px 1fr" }, gap: 3, mb: 3 }}>

          {/* Creative */}
          <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
            <Box sx={{ position: "relative", width: "100%", aspectRatio: "4/3", backgroundColor: "rgba(0,0,0,0.35)" }}>
              {c.creative_url && !isVideo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.creative_url} alt={c.creative_name ?? c.campaign_name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : c.creative_url && isVideo ? (
                <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                  <VideoIcon sx={{ fontSize: 48, color: "rgba(255,255,255,0.2)" }} />
                  <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>Vídeo</Typography>
                </Box>
              ) : (
                <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                  <ImageIcon sx={{ fontSize: 48, color: "rgba(255,255,255,0.1)" }} />
                  <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.8rem" }}>Sem criativo</Typography>
                </Box>
              )}
              <Box sx={{ position: "absolute", top: 10, left: 10 }}>
                <Chip
                  icon={c.ad_type === "CPC" ? <ClickIcon sx={{ fontSize: 11 }} /> : <ViewIcon sx={{ fontSize: 11 }} />}
                  label={c.ad_type === "CPC" ? "Custo por Clique" : "Custo por Visualização"}
                  size="small"
                  sx={{ backgroundColor: "rgba(79,70,229,0.8)", backdropFilter: "blur(8px)", border: "1px solid rgba(79,70,229,0.5)", color: "#c7d2fe", fontSize: "0.65rem", height: 22, fontWeight: 700 }}
                />
              </Box>
            </Box>
            <Box sx={{ p: 2 }}>
              {c.creative_name && <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", mb: 0.5 }}>{c.creative_name}</Typography>}
              {c.redirect_url && (
                <Tooltip title={c.redirect_url}>
                  <Box component="a" href={c.redirect_url} target="_blank" rel="noopener noreferrer" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#60a5fa", fontSize: "0.72rem", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                    <LinkIcon sx={{ fontSize: 13 }} />
                    <Typography component="span" sx={{ fontSize: "0.72rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{c.redirect_url}</Typography>
                  </Box>
                </Tooltip>
              )}
            </Box>
          </Paper>

          {/* Stats + progress */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
              <StatCard label={c.ad_type === "CPC" ? "Cliques alvo" : "Views alvo"} value={c.target_units.toLocaleString("pt-BR")} sub={`R$ ${rate.toFixed(2)} / ${c.ad_type === "CPC" ? "clique" : "view"}`} />
              <StatCard label="Investimento total" value={`R$ ${totalInvestment.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub={c.budget_type === "diario" ? "Orçamento diário" : "Orçamento total"} color="#ffcc01" />
              <StatCard label="Início" value={startAt} sub={endDate ? `Até ${endDate}` : undefined} />
              <StatCard label="Duração" value={c.duration_days ? `${c.duration_days} dias` : "—"} sub="Período de veiculação" />
            </Box>

            <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2.5, p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 600 }}>
                  {c.ad_type === "CPC" ? "CLIQUES REALIZADOS" : "VISUALIZAÇÕES REALIZADAS"}
                </Typography>
                <Typography sx={{ color: "#ffcc01", fontWeight: 700, fontSize: "0.8rem" }}>{progressPct}%</Typography>
              </Box>
              <Box sx={{ width: "100%", height: 8, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                <Box sx={{ width: `${progressPct}%`, height: "100%", backgroundColor: "#ffcc01", borderRadius: 4, transition: "width 0.8s ease" }} />
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.8 }}>
                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem" }}>{realizedUnits.toLocaleString("pt-BR")} realizados</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem" }}>{c.target_units.toLocaleString("pt-BR")} alvo</Typography>
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* ── Insights ──────────────────────────────────────────────────────── */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, mt: 1 }}>
          <TrendingUpIcon sx={{ color: "rgba(255,204,1,0.7)", fontSize: 18 }} />
          <Typography sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Insights de Desempenho
          </Typography>
        </Box>

        {!hasData && (
          <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 3, p: 4, mb: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
            <TrendingUpIcon sx={{ fontSize: 36, color: "rgba(255,255,255,0.1)" }} />
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontWeight: 600, fontSize: "0.85rem" }}>Sem dados ainda</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.75rem" }}>Os insights aparecerão quando a campanha estiver ativa e com dados de performance</Typography>
          </Paper>
        )}

        {hasData && (
          <>
          {/* Highlight cards */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
            <Paper elevation={0} sx={{ backgroundColor: "rgba(255,204,1,0.07)", border: "1px solid rgba(255,204,1,0.2)", borderRadius: 2.5, p: 2.5, display: "flex", flexDirection: "column", gap: 0.75 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TrophyIcon sx={{ color: "#ffcc01", fontSize: 18 }} />
                <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Melhor dia</Typography>
              </Box>
              <Typography sx={{ color: "#ffcc01", fontWeight: 900, fontSize: "1.4rem", lineHeight: 1 }}>{bestDow.day}</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>{bestDowFull} · {bestDow.units.toLocaleString("pt-BR")} {c.ad_type === "CPC" ? "cliques" : "views"}</Typography>
            </Paper>

            <Paper elevation={0} sx={{ backgroundColor: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 2.5, p: 2.5, display: "flex", flexDirection: "column", gap: 0.75 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ScheduleIcon sx={{ color: "#818cf8", fontSize: 18 }} />
                <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Melhor horário</Typography>
              </Box>
              <Typography sx={{ color: "#818cf8", fontWeight: 900, fontSize: "1.4rem", lineHeight: 1 }}>{bestHour.hour}</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>Pico de {bestHour.units.toLocaleString("pt-BR")} {c.ad_type === "CPC" ? "cliques" : "views"}</Typography>
            </Paper>

            <Paper elevation={0} sx={{ backgroundColor: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 2.5, p: 2.5, display: "flex", flexDirection: "column", gap: 0.75 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingUpIcon sx={{ color: "#10b981", fontSize: 18 }} />
                <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Média diária</Typography>
              </Box>
              <Typography sx={{ color: "#10b981", fontWeight: 900, fontSize: "1.4rem", lineHeight: 1 }}>
                {Math.round(dowData.reduce((s, d) => s + d.units, 0) / 7).toLocaleString("pt-BR")}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>{c.ad_type === "CPC" ? "cliques" : "views"} por dia</Typography>
            </Paper>

            <Paper elevation={0} sx={{ backgroundColor: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 2.5, p: 2.5, display: "flex", flexDirection: "column", gap: 0.75 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ScheduleIcon sx={{ color: "#f87171", fontSize: 18 }} />
                <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Horário fraco</Typography>
              </Box>
              <Typography sx={{ color: "#f87171", fontWeight: 900, fontSize: "1.4rem", lineHeight: 1 }}>
                {worstHour.hour}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>Menor engajamento</Typography>
            </Paper>
          </Box>

          {/* Gráficos dia da semana + horário */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3, mb: 3 }}>
            <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5 }}>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem", mb: 0.4 }}>Desempenho por dia da semana</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", mb: 2 }}>
                Melhor dia: <Box component="span" sx={{ color: "#ffcc01", fontWeight: 700 }}>{bestDowFull}</Box>
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dowData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
                    <XAxis dataKey="day" tick={{ fill: CHART_AXIS_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: CHART_AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <RechartTooltip
                      contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                      labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(v) => [Number(v).toLocaleString("pt-BR"), c.ad_type === "CPC" ? "Cliques" : "Views"]}
                    />
                    <Bar dataKey="units" radius={[5, 5, 0, 0]}>
                      {dowData.map((entry, i) => (
                        <Cell key={i} fill={entry.day === bestDow.day ? "#ffcc01" : "rgba(255,204,1,0.22)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5 }}>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem", mb: 0.4 }}>Desempenho por horário do dia</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", mb: 2 }}>
                Pico às <Box component="span" sx={{ color: "#818cf8", fontWeight: 700 }}>{bestHour.hour}</Box>
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
                    <XAxis dataKey="hour" tick={{ fill: CHART_AXIS_COLOR, fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fill: CHART_AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <RechartTooltip
                      contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                      labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(v) => [Number(v).toLocaleString("pt-BR"), c.ad_type === "CPC" ? "Cliques" : "Views"]}
                    />
                    <Bar dataKey="units" radius={[3, 3, 0, 0]}>
                      {hourData.map((entry, i) => (
                        <Cell key={i} fill={entry.hour === bestHour.hour ? "#818cf8" : "rgba(99,102,241,0.3)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Box>
          </>
        )}

        {/* ── Charts ────────────────────────────────────────────────────────── */}
        <Typography sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", mb: 2, mt: 1 }}>
          Performance da Campanha
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3, mb: 3 }}>

          <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem", mb: 0.4 }}>{c.ad_type === "CPC" ? "Cliques por dia" : "Visualizações por dia"}</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", mb: 2 }}>Total: {realizedUnits.toLocaleString("pt-BR")} {c.ad_type === "CPC" ? "cliques" : "views"}</Typography>
            <Box sx={{ position: "relative", height: 180 }}>
              {!hasData && <EmptyChartOverlay />}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={perfData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
                  <XAxis dataKey="date" tick={{ fill: CHART_AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: CHART_AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartTooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} formatter={(v) => [Number(v).toLocaleString("pt-BR"), c.ad_type === "CPC" ? "Cliques" : "Views"]} />
                  <Line type="monotone" dataKey="units" stroke="#ffcc01" strokeWidth={2} dot={{ fill: "#ffcc01", r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem", mb: 0.4 }}>Orçamento gasto por dia</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", mb: 2 }}>Total gasto: R$ {perfData.reduce((s, d) => s + d.gasto, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
            <Box sx={{ position: "relative", height: 180 }}>
              {!hasData && <EmptyChartOverlay />}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={perfData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
                  <XAxis dataKey="date" tick={{ fill: CHART_AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: CHART_AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                  <RechartTooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} formatter={(v) => [`R$ ${Number(v).toFixed(2)}`, "Gasto"]} />
                  <Area type="monotone" dataKey="gasto" stroke="#10b981" strokeWidth={2} fill="url(#spendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem", mb: 0.4 }}>CTR — Taxa de clique</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", mb: 2 }}>% de impressões que geraram cliques</Typography>
            <Box sx={{ position: "relative", height: 180 }}>
              {!hasData && <EmptyChartOverlay />}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ctrData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
                  <XAxis dataKey="date" tick={{ fill: CHART_AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: CHART_AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <RechartTooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} formatter={(v) => [`${Number(v)}%`, "CTR"]} />
                  <Bar dataKey="ctr" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {ctrData.map((_, i) => <Cell key={i} fill="#6366f1" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem", mb: 0.4 }}>Progresso do objetivo</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", mb: 2 }}>{c.ad_type === "CPC" ? "Cliques" : "Views"} realizados vs meta</Typography>
            <Box sx={{ position: "relative", height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!hasData && <EmptyChartOverlay label="Aguardando primeiros dados" />}
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" data={radialData} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "rgba(255,255,255,0.05)" }} />
                  <Legend iconSize={0} formatter={() => ""} />
                </RadialBarChart>
              </ResponsiveContainer>
              <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.4rem" }}>{progressPct}%</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.65rem" }}>atingido</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* ── Details ───────────────────────────────────────────────────────── */}
        <Typography sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", mb: 2 }}>
          Detalhes da Campanha
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 2.5 }}>
          <InfoCard icon={<CalendarIcon sx={{ fontSize: 18 }} />} label="Veiculação">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[["Início", startAt], ...(endDate ? [["Término", endDate]] : []), ...(c.duration_days ? [["Duração", `${c.duration_days} dias`]] : []), ["Orçamento", c.budget_type === "diario" ? "Diário" : "Total"]].map(([l, v]) => (
                <Box key={l} sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>{l}</Typography>
                  <Typography sx={{ color: l === "Duração" ? "#ffcc01" : "#fff", fontWeight: 600, fontSize: "0.8rem" }}>{v}</Typography>
                </Box>
              ))}
            </Box>
          </InfoCard>

          <InfoCard icon={<TagIcon sx={{ fontSize: 18 }} />} label="Interesses">
            {c.hobbies && c.hobbies.length > 0 ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.7 }}>
                {c.hobbies.map((h) => <Chip key={h} label={h} size="small" sx={{ backgroundColor: "rgba(255,204,1,0.12)", border: "1px solid rgba(255,204,1,0.25)", color: "#ffcc01", fontSize: "0.65rem", height: 22 }} />)}
              </Box>
            ) : <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.75rem" }}>Todos os públicos</Typography>}
          </InfoCard>

          <InfoCard icon={<WorkIcon sx={{ fontSize: 18 }} />} label="Profissões">
            {c.professions && c.professions.length > 0 ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.7 }}>
                {c.professions.map((p) => <Chip key={p} label={p} size="small" sx={{ backgroundColor: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: "0.65rem", height: 22 }} />)}
              </Box>
            ) : <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.75rem" }}>Todas as profissões</Typography>}
          </InfoCard>

          <InfoCard icon={<AudienceIcon sx={{ fontSize: 18 }} />} label="Público">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[["Gênero", c.gender === "M" ? "Masculino" : c.gender === "F" ? "Feminino" : "Todos"], ["Faixa etária", c.age_min && c.age_max ? `${c.age_min} – ${c.age_max} anos` : "Todas as idades"]].map(([l, v]) => (
                <Box key={l} sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>{l}</Typography>
                  <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.8rem" }}>{v}</Typography>
                </Box>
              ))}
            </Box>
          </InfoCard>

          <InfoCard icon={<LocationIcon sx={{ fontSize: 18 }} />} label="Localização">
            {c.address ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.8rem" }}>{c.address}</Typography>
                {c.radius_km && <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>Raio: {c.radius_km} km</Typography>}
              </Box>
            ) : <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.75rem" }}>Todo o Brasil</Typography>}
          </InfoCard>

          <InfoCard icon={<MoneyIcon sx={{ fontSize: 18 }} />} label="Investimento">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[["Valor total", `R$ ${totalInvestment.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`], ["Taxa base", `R$ ${rate.toFixed(2)} / ${c.ad_type}`], ["Meta", `${c.target_units.toLocaleString("pt-BR")} ${c.ad_type === "CPC" ? "cliques" : "views"}`]].map(([l, v]) => (
                <Box key={l} sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>{l}</Typography>
                  <Typography sx={{ color: l === "Valor total" ? "#ffcc01" : "#fff", fontWeight: 600, fontSize: "0.88rem" }}>{v}</Typography>
                </Box>
              ))}
            </Box>
          </InfoCard>
        </Box>

      </Box>
    </AdminMasterShell>
  );
}
