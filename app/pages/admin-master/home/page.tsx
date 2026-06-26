"use client";

import React, { useEffect, useState } from "react";
import {
  Box, CircularProgress, Typography, Paper, Chip, Divider,
  Drawer, Fab, Badge, IconButton,
} from "@mui/material";
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
import { listPendingCampaigns, updateCampaignStatus, type Campaign, type PatrocinadorWithCampaigns } from "@/app/services/campaigns/campaignService";
import { useToast } from "@/app/context/ToastContext";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

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

const BAR_DATA = MOCK_SPONSORS.map((s) => ({
  name: s.displayName,
  investido: parseFloat(s.totalInvested.toFixed(2)),
  interacoes: s.totalUnits,
  brand: s.brand,
}));

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

const GENDER_LABELS: Record<string, string> = {
  todos: "Todos",
  feminino: "Feminino",
  masculino: "Masculino",
  nao_binario: "Não-binário",
};

/* ── Helper sub-components ───────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", mb: 1.2 }}>
      {children}
    </Typography>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
      <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", flexShrink: 0 }}>{label}</Typography>
      <Typography component="span" sx={{ color: "#fff", fontSize: "0.78rem", fontWeight: 600, textAlign: "right" }}>{value}</Typography>
    </Box>
  );
}

function CampaignDetailPanel({ campaign: c, group }: { campaign: Campaign; group: PatrocinadorWithCampaigns }) {
  const isVideo = c.creative_url?.match(/\.(mp4|mov|webm)/i);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Creative preview */}
      {c.creative_url && (
        <Box sx={{ borderRadius: 2, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {isVideo ? (
            <video src={c.creative_url} controls style={{ width: "100%", maxHeight: 220, objectFit: "cover" }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.creative_url} alt={c.campaign_name} style={{ width: "100%", maxHeight: 220, objectFit: "cover" }} />
          )}
        </Box>
      )}

      {/* Informações */}
      <Box>
        <SectionLabel>Informações</SectionLabel>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <DetailRow label="Patrocinador" value={group.patrocinador_name ?? group.patrocinador_email} />
          <DetailRow label="Tipo" value={c.ad_type} />
          {c.redirect_url && (
            <DetailRow
              label="URL de destino"
              value={
                <a
                  href={c.redirect_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#60a5fa", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: 3 }}
                >
                  {c.redirect_url.length > 32 ? c.redirect_url.slice(0, 32) + "…" : c.redirect_url}
                  <OpenInNewIcon style={{ fontSize: 11 }} />
                </a>
              }
            />
          )}
        </Box>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

      {/* Orçamento */}
      <Box>
        <SectionLabel>Orçamento e pagamento</SectionLabel>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <DetailRow
            label="Valor pago"
            value={`R$ ${(c.budget_value ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}${c.budget_type === "diario" ? " / dia" : " total"}`}
          />
          {c.duration_days != null && (
            <DetailRow label="Duração" value={`${c.duration_days} dia${c.duration_days !== 1 ? "s" : ""}`} />
          )}
          {c.start_at && (
            <DetailRow
              label="Início da veiculação"
              value={new Date(c.start_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            />
          )}
          {c.target_units != null && (
            <DetailRow
              label="Meta"
              value={`${c.target_units.toLocaleString("pt-BR")} ${c.ad_type === "CPC" ? "cliques" : "visualizações"}`}
            />
          )}
          <Box sx={{ mt: 0.5, pt: 1, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <DetailRow
              label="Forma de pagamento"
              value={
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.8 }}>
                  <Box sx={{ position: "relative", width: 28, height: 18, flexShrink: 0 }}>
                    <Box sx={{ position: "absolute", left: 0, width: 18, height: 18, borderRadius: "50%", backgroundColor: "#eb001b", opacity: 0.9 }} />
                    <Box sx={{ position: "absolute", right: 0, width: 18, height: 18, borderRadius: "50%", backgroundColor: "#f79e1b", opacity: 0.85 }} />
                  </Box>
                  <Typography sx={{ color: "#fff", fontSize: "0.78rem", fontWeight: 600 }}>Cartão de crédito</Typography>
                </Box>
              }
            />
            {c.created_at && (
              <Box sx={{ mt: 1 }}>
                <DetailRow
                  label="Pago em"
                  value={new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

      {/* Público-alvo */}
      <Box>
        <SectionLabel>Público-alvo</SectionLabel>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {c.gender && (
            <DetailRow label="Gênero" value={GENDER_LABELS[c.gender] ?? c.gender} />
          )}
          {(c.age_min != null || c.age_max != null) && (
            <DetailRow label="Faixa etária" value={`${c.age_min ?? 18} – ${c.age_max ?? 100} anos`} />
          )}
          {c.hobbies && c.hobbies.length > 0 && (
            <Box>
              <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", mb: 0.8 }}>Hobbies</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {c.hobbies.map((h) => (
                  <Chip key={h} label={h} size="small" sx={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", fontSize: "0.68rem", height: 20, border: "1px solid rgba(255,255,255,0.1)" }} />
                ))}
              </Box>
            </Box>
          )}
          {c.professions && c.professions.length > 0 && (
            <Box>
              <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", mb: 0.8 }}>Profissões</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {c.professions.map((p) => (
                  <Chip key={p} label={p} size="small" sx={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", fontSize: "0.68rem", height: 20, border: "1px solid rgba(255,255,255,0.1)" }} />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Localização */}
      {(c.address || c.radius_km) && (
        <>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
          <Box>
            <SectionLabel>Localização</SectionLabel>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {c.address && <DetailRow label="Endereço" value={c.address} />}
              {c.radius_km != null && <DetailRow label="Raio" value={`${c.radius_km} km`} />}
            </Box>
          </Box>
        </>
      )}

      {/* Spacer so footer doesn't cover bottom content */}
      <Box sx={{ height: 16 }} />
    </Box>
  );
}

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
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [pendingGroups, setPendingGroups] = useState<PatrocinadorWithCampaigns[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<{ campaign: Campaign; group: PatrocinadorWithCampaigns } | null>(null);

  useEffect(() => {
    listPendingCampaigns().then(setPendingGroups).catch(() => {});
  }, []);

  const handleStatus = async (campaign: Campaign, status: "active" | "recusado") => {
    setUpdatingId(campaign.id);
    try {
      await updateCampaignStatus(campaign.id, status);
      setPendingGroups((prev) =>
        prev.map((g) => ({ ...g, campaigns: g.campaigns.filter((c) => c.id !== campaign.id) }))
            .filter((g) => g.campaigns.length > 0)
      );
      if (selectedCampaign?.campaign.id === campaign.id) setSelectedCampaign(null);
      showToast(status === "active" ? "Anúncio aprovado!" : "Anúncio recusado.", status === "active" ? "success" : "info");
    } catch {
      showToast("Erro ao atualizar status.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPending = pendingGroups.reduce((s, g) => s + g.campaigns.length, 0);

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

      {/* ── FAB: pendentes ────────────────────────────────────────────────── */}
      <Box sx={{ position: "fixed", bottom: 32, right: 32, zIndex: 1200 }}>
        <Badge
          badgeContent={totalPending}
          max={99}
          sx={{
            "& .MuiBadge-badge": {
              backgroundColor: "#ef4444",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.68rem",
              minWidth: 18,
              height: 18,
              padding: "0 4px",
            },
          }}
        >
          <Fab
            onClick={() => setDrawerOpen(true)}
            sx={{
              backgroundColor: "#f59e0b",
              "&:hover": { backgroundColor: "#d97706" },
              width: 56,
              height: 56,
              boxShadow: "0 4px 24px rgba(245,158,11,0.45)",
            }}
          >
            <AccessTimeIcon sx={{ color: "#fff", fontSize: 26 }} />
          </Fab>
        </Badge>
      </Box>

      {/* ── Drawer: lista e detalhe de pendentes ──────────────────────────── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedCampaign(null); }}
        PaperProps={{
          sx: {
            width: { xs: "100vw", sm: 460 },
            backgroundColor: "#0f0f1a",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
          {selectedCampaign && (
            <IconButton
              onClick={() => setSelectedCampaign(null)}
              size="small"
              sx={{ color: "rgba(255,255,255,0.5)", p: 0.5, mr: 0.5 }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}
          <AccessTimeIcon sx={{ color: "#f59e0b", fontSize: 20 }} />
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", flex: 1 }}>
            {selectedCampaign
              ? selectedCampaign.campaign.campaign_name
              : `Pendentes${totalPending > 0 ? ` (${totalPending})` : ""}`}
          </Typography>
          <IconButton
            onClick={() => { setDrawerOpen(false); setSelectedCampaign(null); }}
            size="small"
            sx={{ color: "rgba(255,255,255,0.35)", p: 0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2.5 }}>
          {selectedCampaign ? (
            <CampaignDetailPanel
              campaign={selectedCampaign.campaign}
              group={selectedCampaign.group}
            />
          ) : totalPending === 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 2, py: 8 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 52, color: "rgba(255,255,255,0.08)" }} />
              <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.88rem" }}>
                Nenhum anúncio pendente
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {pendingGroups.map((group) =>
                group.campaigns.map((c) => (
                  <Paper
                    key={c.id}
                    elevation={0}
                    onClick={() => setSelectedCampaign({ campaign: c, group })}
                    sx={{
                      backgroundColor: "rgba(245,158,11,0.04)",
                      border: "1px solid rgba(245,158,11,0.18)",
                      borderRadius: 3,
                      p: 2,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      transition: "all 0.15s ease",
                      "&:hover": {
                        backgroundColor: "rgba(245,158,11,0.09)",
                        borderColor: "rgba(245,158,11,0.38)",
                      },
                    }}
                  >
                    {/* Creative thumb */}
                    <Box sx={{ width: 46, height: 46, borderRadius: 1.5, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.06)", flexShrink: 0 }}>
                      {c.creative_url
                        ? <img src={c.creative_url} alt={c.campaign_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><CampaignIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.2)" }} /></Box>
                      }
                    </Box>

                    {/* Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.campaign_name}
                      </Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>
                        {group.patrocinador_name ?? group.patrocinador_email} · {c.ad_type} · R$ {(c.budget_value ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>

                    {/* Arrow */}
                    <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "1.2rem", lineHeight: 1, flexShrink: 0 }}>›</Typography>
                  </Paper>
                ))
              )}
            </Box>
          )}
        </Box>

        {/* Footer actions — only in detail view */}
        {selectedCampaign && (
          <Box sx={{ px: 2.5, py: 2.5, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 1.5, flexShrink: 0 }}>
            <Box
              onClick={() => !updatingId && handleStatus(selectedCampaign.campaign, "recusado")}
              sx={{
                flex: 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 0.8,
                cursor: updatingId ? "default" : "pointer",
                backgroundColor: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "12px",
                py: 1.5,
                opacity: updatingId ? 0.5 : 1,
                transition: "background-color 0.15s ease",
                "&:hover": { backgroundColor: "rgba(239,68,68,0.18)" },
              }}
            >
              <CancelOutlinedIcon sx={{ fontSize: 18, color: "#ef4444" }} />
              <Typography sx={{ color: "#ef4444", fontWeight: 700, fontSize: "0.85rem" }}>Recusar</Typography>
            </Box>
            <Box
              onClick={() => !updatingId && handleStatus(selectedCampaign.campaign, "active")}
              sx={{
                flex: 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 0.8,
                cursor: updatingId ? "default" : "pointer",
                backgroundColor: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.35)",
                borderRadius: "12px",
                py: 1.5,
                opacity: updatingId ? 0.5 : 1,
                transition: "background-color 0.15s ease",
                "&:hover": { backgroundColor: "rgba(16,185,129,0.22)" },
              }}
            >
              <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "#10b981" }} />
              <Typography sx={{ color: "#10b981", fontWeight: 700, fontSize: "0.85rem" }}>Aprovar</Typography>
            </Box>
          </Box>
        )}
      </Drawer>
    </AdminMasterShell>
  );
}
