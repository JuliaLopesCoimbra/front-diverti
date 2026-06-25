"use client";

import { useParams, useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BadgeIcon from "@mui/icons-material/Badge";
import CampaignIcon from "@mui/icons-material/Campaign";
import { VerifiedUser as VerifiedIcon } from "@mui/icons-material";
import AdminMasterShell from "@/app/components/AdminMasterShell";
import { BRAND_MOCKS } from "@/app/services/campaigns/mockData";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

const BRAND_NAMES: Record<string, string> = {
  brahma: "Brahma",
  sicoob: "Sicoob",
  volkswagen: "Volkswagen",
  ballantines: "Ballantine's",
  globo: "Globo",
};

const BRAND_PHOTOS: Record<string, string> = {
  brahma: "/ads/2.png",
  sicoob: "/ads/3.png",
  volkswagen: "/ads/4.png",
  ballantines: "/ads/5.png",
  globo: "/ads/1.png",
};

const BRAND_SINCE: Record<string, string> = {
  brahma: "2025-01-15",
  sicoob: "2025-02-20",
  volkswagen: "2025-03-10",
  ballantines: "2025-01-28",
  globo: "2026-01-05",
};

const BRAND_DETAILS: Record<string, {
  phone: string;
  cnpj: string;
  contact: string;
  city: string;
  segment: string;
}> = {
  brahma:      { phone: "(11) 3456-7890", cnpj: "62.015.139/0001-58", contact: "Carlos Mendes",  city: "São Paulo, SP",                segment: "Bebidas"               },
  sicoob:      { phone: "(34) 3234-5678", cnpj: "44.478.031/0001-33", contact: "Ana Souza",      city: "Uberlândia, MG",              segment: "Financeiro"            },
  volkswagen:  { phone: "(11) 4321-8765", cnpj: "49.504.267/0001-30", contact: "Roberto Lima",   city: "São Bernardo do Campo, SP",   segment: "Automotivo"            },
  ballantines: { phone: "(21) 3789-1234", cnpj: "93.036.167/0001-51", contact: "Fernanda Costa", city: "Rio de Janeiro, RJ",          segment: "Bebidas Premium"       },
  globo:       { phone: "(21) 2112-8000", cnpj: "27.865.757/0001-02", contact: "Paulo Vieira",   city: "Rio de Janeiro, RJ",          segment: "Mídia & Entretenimento" },
};

const CAMPAIGN_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: "Ativo",     color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
  finished: { label: "Encerrado", color: "#64748b", bg: "rgba(100,116,139,0.12)" },
  pending:  { label: "Pendente",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
};

function formatBudget(value: number, type: string, days: number) {
  if (type === "diario") {
    const total = value * days;
    return `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (R$ ${value}/dia)`;
  }
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function totalBudget(value: number, type: string, days: number) {
  return type === "diario" ? value * days : value;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, py: 1, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <Box sx={{ color: "rgba(255,255,255,0.3)", mt: 0.1, flexShrink: 0 }}>{icon}</Box>
      <Box>
        <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.2 }}>{label}</Typography>
        <Typography sx={{ color: "#fff", fontSize: "0.85rem", fontWeight: 500 }}>{value}</Typography>
      </Box>
    </Box>
  );
}

export default function PatrocinadorDetailPage() {
  const { brand } = useParams<{ brand: string }>();
  const router = useRouter();

  const campaigns = BRAND_MOCKS[brand] ?? [];
  const details = BRAND_DETAILS[brand];
  const name = BRAND_NAMES[brand] ?? brand;
  const photo = BRAND_PHOTOS[brand];
  const since = BRAND_SINCE[brand];

  if (!details) {
    return (
      <AdminMasterShell>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <Typography sx={{ color: "rgba(255,255,255,0.4)" }}>Patrocinador não encontrado</Typography>
        </Box>
      </AdminMasterShell>
    );
  }

  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const finishedCampaigns = campaigns.filter((c) => c.status === "finished").length;
  const totalInvested = campaigns
    .filter((c) => c.status !== "pending")
    .reduce((sum, c) => sum + totalBudget(c.budget_value, c.budget_type, c.duration_days), 0);

  return (
    <AdminMasterShell>
      <Box sx={{ pb: 8 }}>
        {/* ── Sticky header ── */}
        <Box
          sx={{
            position: "sticky", top: 0, zIndex: 10,
            backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            px: { xs: 2, sm: 3 }, py: 1.5,
            display: "flex", alignItems: "center", gap: 2,
          }}
        >
          <IconButton
            onClick={() => router.push("/pages/admin-master/usuarios")}
            sx={{ color: "#fff", width: 40, height: 40, backgroundColor: "rgba(255,255,255,0.06)", "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Avatar src={photo} sx={{ width: 36, height: 36, border: "2px solid rgba(255,255,255,0.12)" }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>{name}</Typography>
              <VerifiedIcon sx={{ fontSize: 14, color: "#10b981" }} />
            </Box>
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>
              Patrocinador · desde {new Date(since).toLocaleDateString("pt-BR")}
            </Typography>
          </Box>
          <Chip label="Ativo" size="small" sx={{ backgroundColor: "rgba(16,185,129,0.12)", color: "#10b981", fontWeight: 700, fontSize: "0.7rem" }} />
        </Box>

        <Box sx={{ maxWidth: 960, mx: "auto", px: { xs: 2, sm: 3 }, pt: 3 }}>
          {/* ── Top row: profile card + stats ── */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "320px 1fr" }, gap: 2.5, mb: 3 }}>

            {/* Profile card */}
            <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 3 }}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
                <Avatar
                  src={photo}
                  sx={{ width: 80, height: 80, border: "3px solid rgba(255,255,255,0.12)", mb: 1.5 }}
                />
                <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>{name}</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem" }}>{details.segment}</Typography>
                <Chip label="Ativo" size="small" sx={{ mt: 1, backgroundColor: "rgba(16,185,129,0.12)", color: "#10b981", fontWeight: 700, fontSize: "0.68rem" }} />
              </Box>

              <Box>
                <InfoRow icon={<EmailIcon sx={{ fontSize: 18 }} />} label="E-mail" value={`contato@${brand}.com.br`} />
                <InfoRow icon={<PhoneIcon sx={{ fontSize: 18 }} />} label="Telefone" value={details.phone} />
                <InfoRow icon={<BadgeIcon sx={{ fontSize: 18 }} />} label="Contato" value={details.contact} />
                <InfoRow icon={<LocationOnIcon sx={{ fontSize: 18 }} />} label="Cidade" value={details.city} />
                <InfoRow icon={<BusinessIcon sx={{ fontSize: 18 }} />} label="CNPJ" value={details.cnpj} />
              </Box>
            </Paper>

            {/* Stats + mini summary */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Stat cards */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
                {[
                  { label: "Campanhas",  value: campaigns.length,  color: "#fff"     },
                  { label: "Ativas",     value: activeCampaigns,   color: "#10b981"  },
                  { label: "Encerradas", value: finishedCampaigns, color: "#64748b"  },
                ].map((s) => (
                  <Paper key={s.label} elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2, textAlign: "center" }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem", mb: 0.5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</Typography>
                    <Typography sx={{ color: s.color, fontWeight: 800, fontSize: "1.4rem" }}>{s.value}</Typography>
                  </Paper>
                ))}
              </Box>

              {/* Total invested */}
              <Paper elevation={0} sx={{ backgroundColor: "rgba(255,204,1,0.06)", border: "1px solid rgba(255,204,1,0.15)", borderRadius: 3, p: 2.5 }}>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", mb: 0.5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total investido</Typography>
                <Typography sx={{ color: "#ffcc01", fontWeight: 800, fontSize: "1.6rem" }}>
                  R$ {totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", mt: 0.5 }}>
                  em {campaigns.filter((c) => c.status !== "pending").length} campanhas realizadas ou em andamento
                </Typography>
              </Paper>

              {/* Member since */}
              <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5 }}>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", mb: 0.5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Parceiro desde</Typography>
                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
                  {new Date(since).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </Typography>
              </Paper>
            </Box>
          </Box>

          {/* ── Campaigns list ── */}
          <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
            <CampaignIcon sx={{ color: "rgba(255,255,255,0.35)", fontSize: 20 }} />
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Campanhas</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>{campaigns.length} no total</Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {campaigns.map((c) => {
              const st = CAMPAIGN_STATUS[c.status] ?? CAMPAIGN_STATUS.pending;
              const budgetTotal = totalBudget(c.budget_value, c.budget_type, c.duration_days);
              return (
                <Paper
                  key={c.id}
                  elevation={0}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 3, p: 2.5,
                  }}
                >
                  {/* Campaign header */}
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 1.5, flexWrap: "wrap" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", mb: 0.3 }}>{c.campaign_name}</Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>{c.creative_name}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                      <Chip
                        label={c.ad_type}
                        size="small"
                        sx={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.65rem", height: 20 }}
                      />
                      <Chip
                        label={st.label}
                        size="small"
                        sx={{ backgroundColor: st.bg, color: st.color, fontWeight: 700, fontSize: "0.65rem", height: 20 }}
                      />
                    </Box>
                  </Box>

                  {/* Campaign details grid */}
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 1.5 }}>
                    <Box>
                      <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.3 }}>Orçamento</Typography>
                      <Typography sx={{ color: "#ffcc01", fontWeight: 700, fontSize: "0.82rem" }}>
                        R$ {budgetTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </Typography>
                      {c.budget_type === "diario" && (
                        <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem" }}>R$ {c.budget_value}/dia</Typography>
                      )}
                    </Box>
                    <Box>
                      <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.3 }}>Meta</Typography>
                      <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.82rem" }}>
                        {c.target_units.toLocaleString("pt-BR")} {c.ad_type === "CPC" ? "cliques" : "views"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.3 }}>Período</Typography>
                      <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.82rem" }}>
                        {new Date(c.start_at).toLocaleDateString("pt-BR")}
                      </Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem" }}>{c.duration_days} dias</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.3 }}>Segmentação</Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {(c.hobbies ?? []).slice(0, 2).map((h) => (
                          <Chip key={h} label={h} size="small" sx={{ backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", fontSize: "0.6rem", height: 18 }} />
                        ))}
                        {(c.hobbies ?? []).length > 2 && (
                          <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", alignSelf: "center" }}>
                            +{(c.hobbies ?? []).length - 2}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        </Box>
      </Box>
    </AdminMasterShell>
  );
}
