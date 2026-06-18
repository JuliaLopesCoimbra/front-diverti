"use client";

import { Box, Typography, Paper, Divider, Switch, TextField, Button, InputAdornment, Snackbar, Alert } from "@mui/material";
import { Save as SaveIcon, RestartAlt as ResetIcon } from "@mui/icons-material";
import AdminMasterShell from "@/app/components/AdminMasterShell";
import { useState } from "react";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 2,
    "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
    "&.Mui-focused fieldset": { borderColor: "#ffcc01" },
    "& input": { color: "#fff" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#ffcc01" },
  "& .MuiInputAdornment-root p": { color: "rgba(255,255,255,0.35)", fontSize: "0.85rem" },
};

const DEFAULTS = {
  cpc: "0.14",
  cpv: "0.10",
  minRadius: "1",
  minDuration: "3",
  minUnits: "100",
  maxBudget: "50000",
};

function SettingRow({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: () => void }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5, gap: 2 }}>
      <Box>
        <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>{label}</Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>{description}</Typography>
      </Box>
      <Switch
        checked={value}
        onChange={onChange}
        sx={{
          flexShrink: 0,
          "& .MuiSwitch-switchBase.Mui-checked": { color: "#ffcc01" },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#ffcc01" },
        }}
      />
    </Box>
  );
}

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState({
    newSponsors: true,
    emailNotifications: true,
    autoApprove: false,
    maintenanceMode: false,
  });

  const [prices, setPrices] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  function toggle(key: keyof typeof settings) {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
    setDirty(true);
  }

  function setPrice(key: keyof typeof prices, val: string) {
    setPrices((p) => ({ ...p, [key]: val }));
    setDirty(true);
  }

  function handleSave() {
    setSaved(true);
    setDirty(false);
  }

  function handleReset() {
    setPrices(DEFAULTS);
    setDirty(true);
  }

  return (
    <AdminMasterShell>
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 3, sm: 4 }, pb: 6 }}>

        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mb: 0.3 }}>Configurações</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Regras de negócio e tabela de preços da plataforma</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<ResetIcon />}
              onClick={handleReset}
              sx={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", borderRadius: 2, textTransform: "none", fontWeight: 600, fontSize: "0.82rem", "&:hover": { borderColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.04)", color: "#fff" } }}
            >
              Restaurar padrões
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!dirty}
              sx={{ backgroundColor: "#ffcc01", color: "#111", borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: "0.82rem", "&:hover": { backgroundColor: "#e6b800" }, "&.Mui-disabled": { backgroundColor: "rgba(255,204,1,0.2)", color: "rgba(0,0,0,0.3)" } }}
            >
              Salvar alterações
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3 }}>

          {/* ── Preços ──────────────────────────────────────────────────────── */}
          <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 3 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", mb: 3 }}>
              Tabela de preços
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <TextField
                  label="CPC — por clique"
                  value={prices.cpc}
                  onChange={(e) => setPrice("cpc", e.target.value)}
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                  sx={fieldSx}
                  fullWidth
                />
                <TextField
                  label="CPV — por visualização"
                  value={prices.cpv}
                  onChange={(e) => setPrice("cpv", e.target.value)}
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                  sx={fieldSx}
                  fullWidth
                />
              </Box>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Limites de campanha
              </Typography>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <TextField
                  label="Raio mínimo"
                  value={prices.minRadius}
                  onChange={(e) => setPrice("minRadius", e.target.value)}
                  type="number"
                  inputProps={{ min: 1, step: 1 }}
                  InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }}
                  sx={fieldSx}
                  fullWidth
                />
                <TextField
                  label="Duração mínima"
                  value={prices.minDuration}
                  onChange={(e) => setPrice("minDuration", e.target.value)}
                  type="number"
                  inputProps={{ min: 1, step: 1 }}
                  InputProps={{ endAdornment: <InputAdornment position="end">dias</InputAdornment> }}
                  sx={fieldSx}
                  fullWidth
                />
                <TextField
                  label="Meta mínima de unidades"
                  value={prices.minUnits}
                  onChange={(e) => setPrice("minUnits", e.target.value)}
                  type="number"
                  inputProps={{ min: 1, step: 1 }}
                  InputProps={{ endAdornment: <InputAdornment position="end">un.</InputAdornment> }}
                  sx={fieldSx}
                  fullWidth
                />
                <TextField
                  label="Orçamento máximo"
                  value={prices.maxBudget}
                  onChange={(e) => setPrice("maxBudget", e.target.value)}
                  type="number"
                  inputProps={{ min: 1, step: 100 }}
                  InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                  sx={fieldSx}
                  fullWidth
                />
              </Box>

              {/* Preview calculado */}
              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "rgba(255,204,1,0.05)", border: "1px solid rgba(255,204,1,0.12)" }}>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", mb: 1, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                  Preview — campanha de 1.000 unidades
                </Typography>
                <Box sx={{ display: "flex", gap: 4 }}>
                  <Box>
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>Custo CPC</Typography>
                    <Typography sx={{ color: "#ffcc01", fontWeight: 800, fontSize: "1rem" }}>
                      R$ {(parseFloat(prices.cpc || "0") * 1000).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>Custo CPV</Typography>
                    <Typography sx={{ color: "#ffcc01", fontWeight: 800, fontSize: "1rem" }}>
                      R$ {(parseFloat(prices.cpv || "0") * 1000).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* ── Plataforma ──────────────────────────────────────────────────── */}
          <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 3 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", mb: 2 }}>
              Plataforma
            </Typography>
            <SettingRow label="Cadastro de novos patrocinadores" description="Permite que novos sponsors criem conta" value={settings.newSponsors} onChange={() => toggle("newSponsors")} />
            <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
            <SettingRow label="Notificações por e-mail" description="Envia alertas automáticos aos patrocinadores" value={settings.emailNotifications} onChange={() => toggle("emailNotifications")} />
            <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
            <SettingRow label="Aprovação automática de campanhas" description="Campanhas ficam ativas sem revisão manual" value={settings.autoApprove} onChange={() => toggle("autoApprove")} />
            <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
            <SettingRow label="Modo manutenção" description="Bloqueia acesso de patrocinadores temporariamente" value={settings.maintenanceMode} onChange={() => toggle("maintenanceMode")} />

            {settings.maintenanceMode && (
              <Box sx={{ mt: 2, p: 2, borderRadius: 2, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <Typography sx={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600 }}>
                  ⚠ Modo manutenção ativo — patrocinadores não conseguem acessar a plataforma.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Toast de confirmação */}
      <Snackbar open={saved} autoHideDuration={3000} onClose={() => setSaved(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="success" onClose={() => setSaved(false)} sx={{ backgroundColor: "#1a2a1a", color: "#fff", "& .MuiAlert-icon": { color: "#10b981" } }}>
          Configurações salvas com sucesso!
        </Alert>
      </Snackbar>
    </AdminMasterShell>
  );
}
