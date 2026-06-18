"use client";

import { useState } from "react";
import { Box, Typography, Paper, Chip, Button, Collapse, TextField, Divider, IconButton } from "@mui/material";
import {
  Receipt as ReceiptIcon, TrendingUp as TrendingIcon, CreditCard as CardIcon,
  ExpandMore as ExpandIcon, ExpandLess as CollapseIcon,
  Add as AddIcon, CheckCircle as DefaultIcon, RadioButtonUnchecked as UncheckedIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import PatrocinadorShell from "@/app/components/PatrocinadorShell";
import { BRAND_MOCKS, MOCK_PERFORMANCE, detectBrand } from "@/app/services/campaigns/mockData";
import { useAuth } from "@/app/context/AuthContext";

/* ── Mock card data per brand ─────────────────────────────────────────────── */
interface MockCard {
  number: string;
  holder: string;
  expiry: string;
  network: "visa" | "mastercard";
  gradient: string;
}

const BRAND_CARD: Record<string, MockCard> = {
  brahma: {
    number: "**** **** **** 4242",
    holder: "BRAHMA PATROCINIO",
    expiry: "09/28",
    network: "visa",
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  },
  sicoob: {
    number: "**** **** **** 5578",
    holder: "SICOOB COOPERATIVA",
    expiry: "04/27",
    network: "mastercard",
    gradient: "linear-gradient(135deg, #134e4a 0%, #065f46 50%, #064e3b 100%)",
  },
  volkswagen: {
    number: "**** **** **** 4111",
    holder: "VOLKSWAGEN DO BRASIL",
    expiry: "12/29",
    network: "visa",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)",
  },
  ballantines: {
    number: "**** **** **** 5100",
    holder: "BALLANTINES SPIRITS",
    expiry: "07/27",
    network: "mastercard",
    gradient: "linear-gradient(135deg, #422006 0%, #7c2d12 50%, #9a3412 100%)",
  },
  globo: {
    number: "**** **** **** 4000",
    holder: "GLOBO COMUNICACOES",
    expiry: "03/28",
    network: "visa",
    gradient: "linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)",
  },
};

/* ── Card chip SVG (decorative) ─────────────────────────────────────────── */
function ChipIcon() {
  return (
    <svg width="42" height="32" viewBox="0 0 42 32" fill="none">
      <rect width="42" height="32" rx="5" fill="#d4a017" opacity="0.9" />
      <rect x="14" y="0" width="14" height="32" rx="0" fill="#c8960f" opacity="0.5" />
      <rect x="0" y="10" width="42" height="12" rx="0" fill="#c8960f" opacity="0.5" />
      <rect x="14" y="10" width="14" height="12" rx="2" fill="#b8860b" opacity="0.8" />
    </svg>
  );
}

/* ── Network logo ────────────────────────────────────────────────────────── */
function NetworkLogo({ network }: { network: "visa" | "mastercard" }) {
  if (network === "visa") {
    return (
      <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.4rem", fontStyle: "italic", letterSpacing: "-0.04em", opacity: 0.95, fontFamily: "serif" }}>
        VISA
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "flex", gap: "-4px" }}>
      <Box sx={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#eb001b", opacity: 0.95 }} />
      <Box sx={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#f79e1b", opacity: 0.95, ml: "-10px" }} />
    </Box>
  );
}

const CPC_PRICE = 0.14;
const CPV_PRICE = 0.1;

export default function ExtratoPage() {
  const { userName } = useAuth();
  const MOCK_CAMPAIGNS = BRAND_MOCKS[detectBrand(userName)] ?? [];
  const [cardOpen, setCardOpen] = useState(false);

  const fieldSx = {
    "& .MuiInputBase-root": { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "10px", color: "#fff" },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.12)" },
    "& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" },
    "& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,204,1,0.5)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#ffcc01" },
    "& input::placeholder": { color: "rgba(255,255,255,0.2)" },
  };

  const brandCard = BRAND_CARD[detectBrand(userName)];
  const [cards, setCards] = useState<MockCard[]>(brandCard ? [brandCard] : []);
  const [defaultIdx, setDefaultIdx] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCard, setNewCard] = useState({ number: "", holder: "", expiry: "" });

  function handleAddCard() {
    if (!newCard.number || !newCard.holder || !newCard.expiry) return;
    const digits = newCard.number.replace(/\D/g, "").slice(-4);
    setCards((prev) => [
      ...prev,
      {
        number: `**** **** **** ${digits || "0000"}`,
        holder: newCard.holder.toUpperCase(),
        expiry: newCard.expiry,
        network: newCard.number.replace(/\D/g, "")[0] === "5" ? "mastercard" : "visa",
        gradient: "linear-gradient(135deg, #1f2937 0%, #374151 50%, #1f2937 100%)",
      },
    ]);
    setNewCard({ number: "", holder: "", expiry: "" });
    setShowAddForm(false);
  }

  const statusColor: Record<string, string> = {
    finished: "#3b82f6",
    active:   "#10b981",
    pending:  "#f59e0b",
    paused:   "#6b7280",
  };

  const statusLabel: Record<string, string> = {
    finished: "Finalizado",
    active:   "Ativo",
    pending:  "Pendente",
    paused:   "Pausado",
  };

  const rows = MOCK_CAMPAIGNS.map((c) => {
    const perf = MOCK_PERFORMANCE[c.id] ?? [];
    const spent = perf.reduce((s, d) => s + d.gasto, 0);
    const units = perf.reduce((s, d) => s + d.units, 0);
    const budget = c.budget_value ?? c.target_units * (c.ad_type === "CPC" ? CPC_PRICE : CPV_PRICE);
    return { c, spent, units, budget };
  });

  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const totalBudget = rows.reduce((s, r) => s + r.budget, 0);

  return (
    <PatrocinadorShell>
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 3, sm: 4 }, pb: 8 }}>

        {/* Title */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mb: 0.3 }}>Extrato</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Histórico de investimentos em campanhas</Typography>
        </Box>

        {/* Summary cards */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2, mb: 4 }}>
          <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5, textAlign: "center" }}>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>Total investido</Typography>
            <Typography sx={{ color: "#ffcc01", fontWeight: 800, fontSize: "1.5rem" }}>
              R$ {totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Paper>
          <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5, textAlign: "center" }}>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>Orçamento total</Typography>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.5rem" }}>
              R$ {totalBudget.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Paper>
          <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5, textAlign: "center" }}>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>Campanhas</Typography>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.5rem" }}>{MOCK_CAMPAIGNS.length}</Typography>
          </Paper>
        </Box>

        {/* ── Payment methods ───────────────────────────────────────────────── */}
        <Box sx={{ mb: 4 }}>
          <Button
            onClick={() => setCardOpen((v) => !v)}
            variant="outlined"
            startIcon={<CardIcon />}
            endIcon={cardOpen ? <CollapseIcon /> : <ExpandIcon />}
            sx={{
              borderColor: "rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.65)",
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              px: 2.5,
              py: 1,
              mb: 2.5,
              "&:hover": { borderColor: "rgba(255,255,255,0.25)", backgroundColor: "rgba(255,255,255,0.04)" },
            }}
          >
            Forma de pagamento
          </Button>

          <Collapse in={cardOpen} timeout={300}>
            <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden", maxWidth: 520 }}>

              {/* Card list */}
              {cards.map((card, idx) => (
                <Box key={idx}>
                  <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", gap: 2 }}>

                    {/* Mini card visual */}
                    <Box
                      sx={{
                        width: 64, height: 40, borderRadius: "8px",
                        background: card.gradient,
                        flexShrink: 0,
                        display: "flex", alignItems: "flex-end",
                        p: "6px 8px",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                      }}
                    >
                      <Box sx={{ position: "absolute", top: -10, right: -10, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                      <NetworkLogo network={card.network} />
                    </Box>

                    {/* Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3 }}>
                        <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem", fontFamily: "monospace" }}>
                          {card.number}
                        </Typography>
                        {idx === defaultIdx && (
                          <Chip label="Padrão" size="small" sx={{ backgroundColor: "rgba(255,204,1,0.15)", border: "1px solid rgba(255,204,1,0.3)", color: "#ffcc01", fontWeight: 700, fontSize: "0.6rem", height: 18 }} />
                        )}
                      </Box>
                      <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>
                        {card.holder} · Válido {card.expiry}
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                      {idx !== defaultIdx && (
                        <Button
                          size="small"
                          onClick={() => setDefaultIdx(idx)}
                          startIcon={<UncheckedIcon sx={{ fontSize: 14 }} />}
                          sx={{ color: "rgba(255,255,255,0.4)", textTransform: "none", fontSize: "0.72rem", px: 1.2, py: 0.5, borderRadius: "8px", "&:hover": { color: "#ffcc01", backgroundColor: "rgba(255,204,1,0.07)" } }}
                        >
                          Definir padrão
                        </Button>
                      )}
                      {idx === defaultIdx && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1 }}>
                          <DefaultIcon sx={{ fontSize: 14, color: "#ffcc01" }} />
                          <Typography sx={{ color: "#ffcc01", fontSize: "0.72rem", fontWeight: 600 }}>Padrão</Typography>
                        </Box>
                      )}
                      {idx !== 0 && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setCards((prev) => prev.filter((_, i) => i !== idx));
                            if (defaultIdx >= idx) setDefaultIdx((d) => Math.max(0, d - 1));
                          }}
                          sx={{ color: "rgba(239,68,68,0.4)", "&:hover": { color: "#ef4444", backgroundColor: "rgba(239,68,68,0.08)" } }}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  {idx < cards.length - 1 && <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />}
                </Box>
              ))}

              {/* Add card form */}
              <Collapse in={showAddForm} timeout={250}>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.07)" }} />
                <Box sx={{ px: 2.5, py: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Novo cartão
                  </Typography>
                  <TextField
                    label="Número do cartão"
                    placeholder="0000 0000 0000 0000"
                    value={newCard.number}
                    onChange={(e) => setNewCard((p) => ({ ...p, number: e.target.value }))}
                    size="small"
                    fullWidth
                    inputProps={{ maxLength: 19 }}
                    sx={fieldSx}
                  />
                  <TextField
                    label="Nome do titular"
                    placeholder="NOME COMO NO CARTÃO"
                    value={newCard.holder}
                    onChange={(e) => setNewCard((p) => ({ ...p, holder: e.target.value }))}
                    size="small"
                    fullWidth
                    sx={fieldSx}
                  />
                  <TextField
                    label="Validade"
                    placeholder="MM/AA"
                    value={newCard.expiry}
                    onChange={(e) => setNewCard((p) => ({ ...p, expiry: e.target.value }))}
                    size="small"
                    sx={{ ...fieldSx, width: 140 }}
                    inputProps={{ maxLength: 5 }}
                  />
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button
                      variant="contained"
                      onClick={handleAddCard}
                      disabled={!newCard.number || !newCard.holder || !newCard.expiry}
                      sx={{ backgroundColor: "#ffcc01", color: "#111", fontWeight: 700, borderRadius: "10px", textTransform: "none", px: 2.5, "&:hover": { backgroundColor: "#e6b800" }, "&:disabled": { backgroundColor: "rgba(255,204,1,0.3)" } }}
                    >
                      Adicionar
                    </Button>
                    <Button
                      variant="text"
                      onClick={() => { setShowAddForm(false); setNewCard({ number: "", holder: "", expiry: "" }); }}
                      sx={{ color: "rgba(255,255,255,0.4)", textTransform: "none", borderRadius: "10px", "&:hover": { color: "#fff" } }}
                    >
                      Cancelar
                    </Button>
                  </Box>
                </Box>
              </Collapse>

              {/* Add card button */}
              {!showAddForm && (
                <>
                  <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />
                  <Box sx={{ px: 2.5, py: 1.5 }}>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => setShowAddForm(true)}
                      sx={{ color: "rgba(255,255,255,0.45)", textTransform: "none", fontSize: "0.8rem", borderRadius: "10px", px: 1.5, "&:hover": { color: "#fff", backgroundColor: "rgba(255,255,255,0.04)" } }}
                    >
                      Adicionar cartão de crédito
                    </Button>
                  </Box>
                </>
              )}
            </Paper>
          </Collapse>
        </Box>

        {/* Transaction list */}
        <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
          {/* Header */}
          <Box sx={{ px: 3, py: 2, borderBottom: "1px solid rgba(255,255,255,0.06)", display: { xs: "none", md: "grid" }, gridTemplateColumns: "1fr 120px 100px 110px 110px 100px", gap: 2 }}>
            {["Campanha", "Período", "Tipo", "Investido", "Pago em", "Status"].map((h) => (
              <Typography key={h} sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {h}
              </Typography>
            ))}
          </Box>

          {rows.map(({ c, spent, units, budget }, i) => (
            <Box
              key={c.id}
              sx={{
                px: 3, py: 2.5,
                borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 120px 100px 110px 110px 100px" },
                gap: { xs: 1.5, md: 2 },
                alignItems: "center",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.02)" },
              }}
            >
              {/* Campaign name + icon */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 40, height: 40, borderRadius: 1.5, flexShrink: 0,
                    overflow: "hidden", backgroundColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  {c.creative_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.creative_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ReceiptIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.2)" }} />
                    </Box>
                  )}
                </Box>
                <Box>
                  <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>{c.campaign_name}</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>
                    {units.toLocaleString("pt-BR")} {c.ad_type === "CPC" ? "cliques" : "views"}
                  </Typography>
                </Box>
              </Box>

              {/* Período */}
              <Box>
                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", display: { md: "none" }, mb: 0.3 }}>Período</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>
                  {c.start_at ? new Date(c.start_at.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem" }}>
                  {c.duration_days ? `${c.duration_days} dias` : "—"}
                </Typography>
              </Box>

              {/* Tipo */}
              <Box>
                <Chip
                  label={c.ad_type}
                  size="small"
                  sx={{ backgroundColor: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: "0.65rem", fontWeight: 700, height: 22 }}
                />
              </Box>

              {/* Investido */}
              <Box>
                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", display: { md: "none" }, mb: 0.3 }}>Investido</Typography>
                <Typography sx={{ color: "#ffcc01", fontWeight: 700, fontSize: "0.88rem" }}>
                  R$ {spent.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem" }}>
                  de R$ {budget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </Typography>
              </Box>

              {/* Pago em */}
              <Box>
                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", display: { md: "none" }, mb: 0.3 }}>Pago em</Typography>
                {c.status === "pending" ? (
                  <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.72rem", fontStyle: "italic" }}>Aguardando</Typography>
                ) : (
                  <>
                    <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.78rem", fontWeight: 600 }}>
                      {c.start_at ? new Date(c.start_at.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem" }}>Cartão •••• {BRAND_CARD[detectBrand(userName)]?.number.slice(-4)}</Typography>
                  </>
                )}
              </Box>

              {/* Status */}
              <Box>
                <Chip
                  label={statusLabel[c.status] ?? c.status}
                  size="small"
                  sx={{
                    backgroundColor: `${statusColor[c.status] ?? "#9ca3af"}22`,
                    border: `1px solid ${statusColor[c.status] ?? "#9ca3af"}55`,
                    color: statusColor[c.status] ?? "#9ca3af",
                    fontSize: "0.65rem", fontWeight: 700, height: 22,
                  }}
                />
              </Box>
            </Box>
          ))}

          {rows.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <TrendingIcon sx={{ fontSize: 40, color: "rgba(255,255,255,0.1)", mb: 1.5 }} />
              <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>Nenhuma movimentação ainda</Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </PatrocinadorShell>
  );
}
