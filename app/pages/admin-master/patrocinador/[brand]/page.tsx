"use client";

import { use, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Typography, Paper, Chip, Divider, IconButton,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Campaign as CampaignIcon,
  TouchApp as ClickIcon,
  Visibility as ViewIcon,
  CheckCircle as ActiveIcon,
  AccessTime as PendingIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import AdminMasterShell from "@/app/components/AdminMasterShell";
import {
  BRAND_MOCKS, BRAND_DEFAULT_PHOTO, MOCK_PERFORMANCE,
} from "@/app/services/campaigns/mockData";
import { type Campaign } from "@/app/services/campaigns/campaignService";

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active:    { label: "Ativo",      color: "#10b981", icon: <ActiveIcon  sx={{ fontSize: 13 }} /> },
  pending:   { label: "Pendente",   color: "#f59e0b", icon: <PendingIcon sx={{ fontSize: 13 }} /> },
  paused:    { label: "Pausado",    color: "#6b7280", icon: <PendingIcon sx={{ fontSize: 13 }} /> },
  finished:  { label: "Finalizado", color: "#3b82f6", icon: <ActiveIcon  sx={{ fontSize: 13 }} /> },
  cancelled: { label: "Cancelado",  color: "#ef4444", icon: <CancelIcon  sx={{ fontSize: 13 }} /> },
};

function StatusChip({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: "#9ca3af", icon: null };
  return (
    <Chip
      icon={s.icon as React.ReactElement}
      label={s.label}
      size="small"
      sx={{ backgroundColor: `${s.color}22`, border: `1px solid ${s.color}55`, color: s.color, fontWeight: 700, fontSize: "0.68rem", height: 22 }}
    />
  );
}

function CampaignCard({ c, brand }: { c: Campaign; brand: string }) {
  const router = useRouter();
  const handleClick = useCallback(() => {
    router.push(`/pages/admin-master/patrocinador/${brand}/campanha/${c.id}`);
  }, [router, brand, c.id]);
  const perf = MOCK_PERFORMANCE[c.id] ?? [];
  const totalUnits  = perf.reduce((s, d) => s + d.units, 0);
  const totalGasto  = perf.reduce((s, d) => s + d.gasto, 0);
  const hasData     = perf.some((d) => d.units > 0);
  const progressPct = c.target_units > 0 ? Math.min(100, Math.round(totalUnits / c.target_units * 100)) : 0;

  const startDate = c.start_at
    ? new Date(c.start_at.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <Paper
      elevation={0}
      onClick={handleClick}
      sx={{
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 3,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": { border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.07)", transform: "translateY(-2px)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)" },
      }}
    >
      {/* Creative thumbnail */}
      <Box sx={{ height: 140, backgroundColor: "rgba(255,255,255,0.04)", overflow: "hidden", position: "relative" }}>
        {c.creative_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.creative_url} alt={c.campaign_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CampaignIcon sx={{ fontSize: 36, color: "rgba(255,255,255,0.1)" }} />
          </Box>
        )}

        {/* Status badge */}
        <Box sx={{ position: "absolute", top: 10, left: 10 }}>
          <StatusChip status={c.status} />
        </Box>

        {/* Ad type badge */}
        <Box sx={{ position: "absolute", top: 10, right: 10 }}>
          <Chip
            label={c.ad_type}
            size="small"
            icon={c.ad_type === "CPC" ? <ClickIcon sx={{ fontSize: 11 }} /> : <ViewIcon sx={{ fontSize: 11 }} />}
            sx={{ backgroundColor: "rgba(0,0,0,0.6)", color: c.ad_type === "CPC" ? "#a5b4fc" : "#6ee7b7", fontWeight: 700, fontSize: "0.62rem", height: 20, backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2 }}>
        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", mb: 0.4, lineHeight: 1.3 }}>
          {c.campaign_name}
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", mb: 1.8 }}>
          {c.creative_name}
        </Typography>

        {/* Date + duration */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.7, mb: 2 }}>
          <CalendarIcon sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }} />
          <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>
            {startDate} · {c.duration_days ?? "—"} dias
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 2 }} />

        {/* Progress bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.7 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem" }}>
              {hasData ? `${totalUnits.toLocaleString("pt-BR")} de ${c.target_units.toLocaleString("pt-BR")} ${c.ad_type === "CPC" ? "cliques" : "views"}` : "Aguardando dados"}
            </Typography>
            <Typography sx={{ color: hasData ? "#ffcc01" : "rgba(255,255,255,0.2)", fontWeight: 700, fontSize: "0.72rem" }}>
              {progressPct}%
            </Typography>
          </Box>
          <Box sx={{ height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <Box sx={{ height: "100%", width: `${progressPct}%`, borderRadius: 2, background: progressPct > 0 ? "linear-gradient(90deg, #ffcc01, #f59e0b)" : "transparent", transition: "width 0.6s ease" }} />
          </Box>
        </Box>

        {/* Stats */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
          <Box sx={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 2, p: 1.2, textAlign: "center" }}>
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.04em", mb: 0.3 }}>
              {c.ad_type === "CPC" ? "Cliques" : "Views"}
            </Typography>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>
              {totalUnits.toLocaleString("pt-BR")}
            </Typography>
          </Box>
          <Box sx={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 2, p: 1.2, textAlign: "center" }}>
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.04em", mb: 0.3 }}>
              Investido
            </Typography>
            <Typography sx={{ color: "#ffcc01", fontWeight: 700, fontSize: "0.9rem" }}>
              R$ {totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

export default function PatrocinadorDetailPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand } = use(params);
  const router = useRouter();

  const campaigns = BRAND_MOCKS[brand] ?? [];
  const photo = BRAND_DEFAULT_PHOTO[brand];
  const displayName = brand.charAt(0).toUpperCase() + brand.slice(1);

  const totalUnits    = campaigns.reduce((s, c) => s + (MOCK_PERFORMANCE[c.id] ?? []).reduce((a, d) => a + d.units, 0), 0);
  const totalInvested = campaigns.reduce((s, c) => s + (MOCK_PERFORMANCE[c.id] ?? []).reduce((a, d) => a + d.gasto, 0), 0);
  const active        = campaigns.filter((c) => c.status === "active").length;
  const finished      = campaigns.filter((c) => c.status === "finished").length;
  const pending       = campaigns.filter((c) => c.status === "pending").length;

  if (campaigns.length === 0) {
    return (
      <AdminMasterShell>
        <Box sx={{ px: 4, pt: 4 }}>
          <Typography sx={{ color: "#fff" }}>Patrocinador não encontrado.</Typography>
        </Box>
      </AdminMasterShell>
    );
  }

  return (
    <AdminMasterShell>
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 3, sm: 4 }, pb: 8 }}>

        {/* Back + header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <IconButton
            onClick={() => router.back()}
            size="small"
            sx={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, "&:hover": { color: "#fff", borderColor: "rgba(255,255,255,0.3)" } }}
          >
            <BackIcon fontSize="small" />
          </IconButton>

          {/* Brand photo + name */}
          <Box sx={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,204,1,0.3)", flexShrink: 0, backgroundColor: "rgba(255,255,255,0.06)" }}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography sx={{ color: "#ffcc01", fontWeight: 800, fontSize: "1.4rem" }}>{displayName.charAt(0)}</Typography>
              </Box>
            )}
          </Box>

          <Box>
            <Typography variant="h5" sx={{ color: "#fff", fontWeight: 800, lineHeight: 1.2 }}>{displayName}</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>Patrocinador · {campaigns.length} campanhas</Typography>
          </Box>
        </Box>

        {/* Summary stats */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 2, mb: 5 }}>
          {[
            { icon: <CampaignIcon sx={{ fontSize: 18 }} />, label: "Total campanhas", value: campaigns.length, color: "#a5b4fc" },
            { icon: <ActiveIcon   sx={{ fontSize: 18 }} />, label: "Ativas / Finalizadas", value: `${active} / ${finished}`, color: "#10b981" },
            { icon: <ClickIcon    sx={{ fontSize: 18 }} />, label: "Interações", value: totalUnits.toLocaleString("pt-BR"), color: "#fff" },
            { icon: <MoneyIcon    sx={{ fontSize: 18 }} />, label: "Investido", value: `R$ ${totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#ffcc01", gridColumn: { xs: "1 / -1", sm: "auto" } as Record<string, string> },
          ].map((s) => (
            <Paper key={s.label} elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2, gridColumn: s.gridColumn }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 0.5 }}>
                <Box sx={{ color: s.color, opacity: 0.7 }}>{s.icon}</Box>
                <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>{s.label}</Typography>
              </Box>
              <Typography sx={{ color: s.color, fontWeight: 800, fontSize: "1.1rem", pl: 0.5 }}>{s.value}</Typography>
            </Paper>
          ))}
        </Box>

        {/* Status filter chips */}
        <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
          {[
            { label: `Todas (${campaigns.length})`,       color: "rgba(255,255,255,0.6)",  bg: "rgba(255,255,255,0.07)" },
            { label: `Ativas (${active})`,                color: "#10b981",                bg: "rgba(16,185,129,0.1)" },
            { label: `Pendentes (${pending})`,            color: "#f59e0b",                bg: "rgba(245,158,11,0.1)" },
            { label: `Finalizadas (${finished})`,         color: "#3b82f6",                bg: "rgba(59,130,246,0.1)" },
          ].map((f) => (
            <Chip
              key={f.label}
              label={f.label}
              size="small"
              sx={{ backgroundColor: f.bg, color: f.color, fontWeight: 600, fontSize: "0.72rem", border: `1px solid ${f.color}33`, cursor: "default" }}
            />
          ))}
        </Box>

        {/* Campaign grid */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 2.5 }}>
          {campaigns.map((c) => <CampaignCard key={c.id} c={c} brand={brand} />)}
        </Box>
      </Box>
    </AdminMasterShell>
  );
}
