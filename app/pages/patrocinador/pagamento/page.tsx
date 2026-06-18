"use client";

import { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Button, CircularProgress, IconButton,
} from "@mui/material";
import {
  ArrowBack as BackIcon, CheckCircle as CheckIcon, Lock as LockIcon,
  TouchApp as ClickIcon, Visibility as ViewIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createCampaign, type CampaignPayload } from "@/app/services/campaigns/campaignService";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import { useToast } from "@/app/context/ToastContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PaymentData {
  payload: CampaignPayload;
  computed_units: number;
  ad_type: "CPC" | "CPV";
  budget_amount: number;
  budget_type: "diario" | "total";
  duration_days: number;
  campaign_name: string;
}

const STORAGE_KEY = "diverti_payment_payload";

const MOCK_CARD = {
  id: "card_1",
  last4: "4242",
  holder: "BRAHMA FINANCEIRO",
  expiry: "08/28",
};

// ─── Componente do cartão ─────────────────────────────────────────────────────

function MastercardBadge() {
  return (
    <Box sx={{ position: "relative", width: 44, height: 28, flexShrink: 0 }}>
      <Box sx={{ position: "absolute", left: 0, width: 28, height: 28, borderRadius: "50%", backgroundColor: "#eb001b" }} />
      <Box sx={{ position: "absolute", right: 0, width: 28, height: 28, borderRadius: "50%", backgroundColor: "#f79e1b", opacity: 0.92 }} />
    </Box>
  );
}

function CreditCard({
  card, selected, onClick,
}: {
  card: typeof MOCK_CARD; selected: boolean; onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        position: "relative",
        width: "100%", maxWidth: 380, height: 210,
        borderRadius: "20px",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%)",
        border: `2.5px solid ${selected ? "#ffcc01" : "rgba(255,255,255,0.1)"}`,
        boxShadow: selected
          ? "0 0 0 4px rgba(255,204,1,0.18), 0 24px 64px rgba(0,0,0,0.55)"
          : "0 12px 48px rgba(0,0,0,0.45)",
        cursor: "pointer",
        transition: "all 0.25s ease",
        p: "28px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        overflow: "hidden",
        "&:hover": {
          borderColor: selected ? "#ffcc01" : "rgba(255,255,255,0.25)",
          transform: "translateY(-3px)",
        },
        "&::before": {
          content: '""', position: "absolute",
          top: -80, right: -80, width: 220, height: 220,
          borderRadius: "50%", background: "rgba(255,255,255,0.025)",
        },
        "&::after": {
          content: '""', position: "absolute",
          bottom: -60, left: -40, width: 160, height: 160,
          borderRadius: "50%", background: "rgba(255,255,255,0.02)",
        },
      }}
    >
      {/* Linha 1: chip + bandeira */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{
          width: 46, height: 34, borderRadius: "7px",
          background: "linear-gradient(135deg, #c8922a 0%, #f0d060 45%, #b8821a 100%)",
          border: "1px solid rgba(255,255,255,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Box sx={{
            width: 34, height: 24, borderRadius: "4px",
            border: "1px solid rgba(0,0,0,0.15)",
            background: "linear-gradient(135deg, #b8821a 0%, #e0c050 50%, #b8821a 100%)",
          }} />
        </Box>
        <MastercardBadge />
      </Box>

      {/* Número */}
      <Typography sx={{
        color: "rgba(255,255,255,0.88)",
        fontFamily: "'Courier New', monospace",
        fontSize: "1.15rem", letterSpacing: "0.24em", fontWeight: 600,
      }}>
        •••• •••• •••• {card.last4}
      </Typography>

      {/* Linha 3: titular + validade */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Box>
          <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", mb: 0.3 }}>Titular</Typography>
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem", letterSpacing: "0.06em" }}>{card.holder}</Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", mb: 0.3 }}>Validade</Typography>
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem" }}>{card.expiry}</Typography>
        </Box>
      </Box>

      {/* Indicador de selecionado */}
      {selected && (
        <Box sx={{
          position: "absolute", top: 14, right: 14,
          width: 24, height: 24, borderRadius: "50%",
          backgroundColor: "#ffcc01",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(255,204,1,0.5)",
        }}>
          <CheckIcon sx={{ fontSize: 15, color: "#111" }} />
        </Box>
      )}
    </Box>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function PagamentoPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [data, setData] = useState<PaymentData | null>(null);
  const [selectedCard, setSelectedCard] = useState<string>(MOCK_CARD.id);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) { router.replace("/pages/patrocinador/nova-campanha"); return; }
    try { setData(JSON.parse(raw)); }
    catch { router.replace("/pages/patrocinador/nova-campanha"); }
  }, [router]);

  const handlePay = async () => {
    if (!data || !selectedCard) return;
    setPaying(true);
    try {
      await createCampaign({ ...data.payload, status: "pending" });
      sessionStorage.removeItem(STORAGE_KEY);
      setDone(true);
      setTimeout(() => router.push("/pages/patrocinador/home"), 1800);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao processar pagamento", "error");
      setPaying(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (!data) {
    return (
      <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#ffcc01" }} />
      </Box>
    );
  }

  // ── Totais ───────────────────────────────────────────────────────────────────

  const isDaily = data.budget_type === "diario" && data.duration_days > 0;
  const totalValue = isDaily ? data.budget_amount * data.duration_days : data.budget_amount;
  const totalUnits = isDaily ? data.computed_units * data.duration_days : data.computed_units;

  // ── Sucesso ──────────────────────────────────────────────────────────────────

  if (done) {
    return (
      <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ textAlign: "center", maxWidth: 440, px: 3 }}>
          {/* Círculo animado com check */}
          <Box sx={{
            width: 110, height: 110, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 70%)",
            border: "3px solid #10b981",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto", mb: 3,
            boxShadow: "0 0 48px rgba(16,185,129,0.35)",
            animation: "pulse 1.5s ease-in-out infinite",
            "@keyframes pulse": {
              "0%, 100%": { boxShadow: "0 0 32px rgba(16,185,129,0.3)" },
              "50%": { boxShadow: "0 0 64px rgba(16,185,129,0.55)" },
            },
          }}>
            <CheckIcon sx={{ fontSize: 58, color: "#10b981" }} />
          </Box>

          <Typography sx={{ color: "#10b981", fontWeight: 800, fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", mb: 1 }}>
            Pago
          </Typography>
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 800, mb: 1.5 }}>
            Campanha ativada!
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem" }}>
            <strong style={{ color: "#fff" }}>{data.campaign_name}</strong> está no ar.
          </Typography>

          <Box sx={{ mt: 3, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <CircularProgress size={14} sx={{ color: "rgba(255,255,255,0.2)" }} />
            <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.78rem" }}>
              Indo para suas campanhas...
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // ── Layout principal ─────────────────────────────────────────────────────────

  return (
    <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, pb: 8 }}>

      {/* Header */}
      <Paper elevation={0} sx={{
        position: "sticky", top: 0, zIndex: 100,
        backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        px: { xs: 2, sm: 4 }, py: 1.5,
      }}>
        <Box sx={{ maxWidth: 760, margin: "0 auto", display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => router.back()}
            sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#fff", backgroundColor: "rgba(255,255,255,0.07)" } }}>
            <BackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: "#fff", fontWeight: 700 }}>Pagamento</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.38)", fontSize: "0.75rem" }}>Finalize sua campanha</Typography>
          </Box>
          <Image src="/logo/logo-circuito.png" alt="Diverti" width={84} height={30} style={{ objectFit: "contain" }} priority />
        </Box>
      </Paper>

      <Box sx={{ maxWidth: 760, margin: "0 auto", px: { xs: 2, sm: 3 }, pt: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", gap: 3 }}>

        {/* ── Resumo do pedido ── */}
        <Paper elevation={0} sx={{
          backgroundColor: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 3, p: 3,
        }}>
          <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", mb: 2 }}>
            Resumo do pedido
          </Typography>

          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem", mb: 2.5 }}>
            {data.campaign_name}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            {/* Cliques/views */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {data.ad_type === "CPC"
                  ? <ClickIcon sx={{ fontSize: 16, color: "#a5b4fc" }} />
                  : <ViewIcon  sx={{ fontSize: 16, color: "#a5b4fc" }} />}
                <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem" }}>
                  {data.ad_type === "CPC" ? "Cliques estimados" : "Views estimadas"}
                </Typography>
              </Box>
              <Typography sx={{ color: "#fff", fontWeight: 700 }}>
                {totalUnits.toLocaleString("pt-BR")}
              </Typography>
            </Box>

            {/* Breakdown diário */}
            {isDaily && (
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.82rem" }}>
                  Orçamento diário × {data.duration_days} dias
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem" }}>
                  R$ {data.budget_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} × {data.duration_days}
                </Typography>
              </Box>
            )}

            {/* Total */}
            <Box sx={{
              mt: 1, pt: 1.5,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Total</Typography>
              <Typography sx={{ color: "#ffcc01", fontWeight: 800, fontSize: "1.75rem", lineHeight: 1 }}>
                R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* ── Forma de pagamento ── */}
        <Box>
          <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", mb: 2 }}>
            Forma de pagamento
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <CreditCard
              card={MOCK_CARD}
              selected={selectedCard === MOCK_CARD.id}
              onClick={() => setSelectedCard(MOCK_CARD.id)}
            />

            {/* Botão adicionar cartão (cosmético) */}
            <Box sx={{
              width: "100%", maxWidth: 380, height: 58,
              borderRadius: 2.5, border: "2px dashed rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "not-allowed", opacity: 0.38,
            }}>
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
                + Adicionar novo cartão
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ── Botão pagar ── */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, mt: 1 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handlePay}
            disabled={paying || !selectedCard}
            startIcon={
              paying
                ? <CircularProgress size={18} sx={{ color: "#111" }} />
                : <LockIcon sx={{ fontSize: 18 }} />
            }
            sx={{
              maxWidth: 380,
              backgroundColor: "#ffcc01", color: "#111",
              fontWeight: 800, borderRadius: "14px",
              textTransform: "none", fontSize: "1.05rem",
              py: 2, letterSpacing: "0.01em",
              boxShadow: "0 4px 28px rgba(255,204,1,0.3)",
              "&:hover": { backgroundColor: "#e6b800", boxShadow: "0 6px 36px rgba(255,204,1,0.45)" },
              "&.Mui-disabled": { backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.22)" },
              transition: "all 0.2s ease",
            }}
          >
            {paying
              ? "Processando..."
              : `Pagar R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          </Button>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <LockIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }} />
            <Typography sx={{ color: "rgba(255,255,255,0.22)", fontSize: "0.7rem" }}>
              Pagamento 100% seguro e criptografado
            </Typography>
          </Box>
        </Box>

      </Box>
    </Box>
  );
}
