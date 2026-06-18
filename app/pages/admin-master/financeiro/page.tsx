"use client";

import { Box, Typography, Paper, Chip } from "@mui/material";
import { AccountBalance as FinanceiroIcon, TrendingUp as TrendingIcon, AttachMoney as MoneyIcon } from "@mui/icons-material";
import AdminMasterShell from "@/app/components/AdminMasterShell";
import { BRAND_MOCKS, MOCK_PERFORMANCE } from "@/app/services/campaigns/mockData";

const BRAND_NAMES: Record<string, string> = {
  brahma: "Brahma", sicoob: "Sicoob", volkswagen: "Volkswagen", ballantines: "Ballantines", globo: "Globo",
};

const MOCK_TRANSACTIONS = Object.entries(BRAND_MOCKS).flatMap(([brand, campaigns]) =>
  campaigns.slice(0, 2).map((c, i) => {
    const gasto = (MOCK_PERFORMANCE[c.id] ?? []).reduce((s, d) => s + d.gasto, 0);
    return {
      id: `${brand}-${i}`,
      brand,
      brandName: BRAND_NAMES[brand] ?? brand,
      campaign: c.campaign_name,
      amount: parseFloat(gasto.toFixed(2)),
      date: `2026-0${(i + 4) % 6 + 1}-${10 + i * 3}`,
      status: gasto > 0 ? "paid" : "pending",
    };
  })
).sort((a, b) => b.date.localeCompare(a.date));

const totalRevenue = MOCK_TRANSACTIONS.filter(t => t.status === "paid").reduce((s, t) => s + t.amount, 0);
const totalPending = MOCK_TRANSACTIONS.filter(t => t.status === "pending").reduce((s, t) => s + t.amount, 0);

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  paid:    { label: "Pago",     color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  pending: { label: "Pendente", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
};

export default function FinanceiroPage() {
  return (
    <AdminMasterShell>
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 3, sm: 4 }, pb: 6 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mb: 0.3 }}>Extrato</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Receita consolidada de todos os patrocinadores</Typography>
        </Box>

        {/* Summary */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 4 }}>
          {[
            { icon: <MoneyIcon sx={{ fontSize: 20 }} />,   label: "Receita total",    value: `R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "#ffcc01" },
            { icon: <TrendingIcon sx={{ fontSize: 20 }} />, label: "A receber",        value: `R$ ${totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "#f59e0b" },
            { icon: <FinanceiroIcon sx={{ fontSize: 20 }} />,label: "Transações",     value: MOCK_TRANSACTIONS.length, color: "#a5b4fc" },
          ].map((s) => (
            <Paper key={s.label} elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8 }}>
                <Box sx={{ color: s.color, opacity: 0.8 }}>{s.icon}</Box>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>{s.label}</Typography>
              </Box>
              <Typography sx={{ color: s.color, fontWeight: 800, fontSize: "1.2rem" }}>{s.value}</Typography>
            </Paper>
          ))}
        </Box>

        {/* Transactions */}
        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", mb: 2 }}>
          Transações recentes
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {MOCK_TRANSACTIONS.map((t) => {
            const st = STATUS[t.status];
            return (
              <Paper key={t.id} elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.campaign}</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>{t.brandName} · {new Date(t.date).toLocaleDateString("pt-BR")}</Typography>
                </Box>
                <Typography sx={{ color: "#ffcc01", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 }}>
                  R$ {t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
