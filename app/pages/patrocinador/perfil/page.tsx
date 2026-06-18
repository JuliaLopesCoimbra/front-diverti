"use client";

import { useRef, useState } from "react";
import {
  Box, Paper, Typography, Button, Chip, CircularProgress, IconButton, Divider,
} from "@mui/material";
import {
  CameraAlt as CameraIcon, Delete as DeleteIcon,
  CheckCircle as CheckIcon, Campaign as CampaignIcon,
  AttachMoney as MoneyIcon, TouchApp as ClickIcon,
  Edit as EditIcon, VerifiedUser as VerifiedIcon,
} from "@mui/icons-material";
import { useAuth } from "@/app/context/AuthContext";
import { useProfilePhoto } from "@/app/hooks/useProfilePhoto";
import { detectBrand, BRAND_DEFAULT_PHOTO, BRAND_MOCKS, MOCK_PERFORMANCE } from "@/app/services/campaigns/mockData";
import PatrocinadorShell from "@/app/components/PatrocinadorShell";

export default function PerfilPage() {
  const { userName, role } = useAuth();
  const brand = detectBrand(userName);
  const defaultPhoto = BRAND_DEFAULT_PHOTO[brand];
  const { photoUrl, savePhoto, removePhoto } = useProfilePhoto(defaultPhoto);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const displayPhoto = preview ?? photoUrl;

  const roleLabel: Record<string, string> = {
    patrocinador: "Patrocinador",
    admin: "Administrador",
    admin_master: "Admin Master",
    user: "Usuário",
  };

  // Stats from mock data
  const campaigns = BRAND_MOCKS[brand] ?? [];
  const totalInvested = campaigns.reduce((sum, c) => {
    const perf = MOCK_PERFORMANCE[c.id] ?? [];
    return sum + perf.reduce((s, d) => s + d.gasto, 0);
  }, 0);
  const totalUnits = campaigns.reduce((sum, c) => {
    const perf = MOCK_PERFORMANCE[c.id] ?? [];
    return sum + perf.reduce((s, d) => s + d.units, 0);
  }, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setPreview(reader.result as string); setSaved(false); };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!preview) return;
    setSaving(true);
    setTimeout(() => {
      savePhoto(preview);
      setPreview(null);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 700);
  }

  function handleCancel() {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemove() {
    removePhoto(defaultPhoto);
    setPreview(null);
    setSaved(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <PatrocinadorShell>
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 3, sm: 4 }, pb: 8, maxWidth: 900, width: "100%" }}>

        {/* ── Hero banner ──────────────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            borderRadius: 4,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.04)",
            mb: 3,
          }}
        >
          {/* Banner */}
          <Box
            sx={{
              height: 180,
              background: "linear-gradient(135deg, rgba(255,204,1,0.18) 0%, rgba(99,102,241,0.22) 50%, rgba(16,185,129,0.15) 100%)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative circles */}
            <Box sx={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", backgroundColor: "rgba(255,204,1,0.06)" }} />
            <Box sx={{ position: "absolute", bottom: -60, left: "30%", width: 280, height: 280, borderRadius: "50%", backgroundColor: "rgba(99,102,241,0.07)" }} />
            <Box sx={{ position: "absolute", top: 20, left: 20, width: 100, height: 100, borderRadius: "50%", backgroundColor: "rgba(16,185,129,0.06)" }} />

            {/* Edit banner hint */}
            <Box sx={{ position: "absolute", top: 12, right: 12 }}>
              <Chip
                icon={<VerifiedIcon sx={{ fontSize: 13 }} />}
                label="Conta verificada"
                size="small"
                sx={{ backgroundColor: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", color: "#10b981", fontSize: "0.68rem", fontWeight: 700 }}
              />
            </Box>
          </Box>

          {/* Avatar + info row */}
          <Box sx={{ px: { xs: 2.5, sm: 4 }, pb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 3, mt: "-52px", flexWrap: "wrap" }}>

              {/* Avatar */}
              <Box sx={{ position: "relative", flexShrink: 0 }}>
                <Box
                  sx={{
                    width: 104, height: 104, borderRadius: "50%",
                    border: "4px solid rgba(15,15,25,1)",
                    overflow: "hidden",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 0 3px rgba(255,204,1,0.35)",
                  }}
                >
                  {displayPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayPhoto} alt="Foto de perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Typography sx={{ color: "#ffcc01", fontWeight: 800, fontSize: "2.4rem", lineHeight: 1 }}>
                      {(userName ?? "P").charAt(0).toUpperCase()}
                    </Typography>
                  )}
                </Box>
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  size="small"
                  sx={{
                    position: "absolute", bottom: 2, right: 2,
                    backgroundColor: "#ffcc01", color: "#111", width: 28, height: 28,
                    "&:hover": { backgroundColor: "#e6b800" },
                    boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                  }}
                >
                  <CameraIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>

              {/* Name + role */}
              <Box sx={{ pt: { xs: 0, sm: "52px" }, pb: 0.5, flex: 1, minWidth: 180 }}>
                <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.35rem", lineHeight: 1.2, mb: 0.8 }}>
                  {userName ?? "Patrocinador"}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    label={roleLabel[role ?? ""] ?? "Patrocinador"}
                    size="small"
                    sx={{ backgroundColor: "rgba(255,204,1,0.15)", border: "1px solid rgba(255,204,1,0.3)", color: "#ffcc01", fontWeight: 700, fontSize: "0.7rem" }}
                  />
                  {brand && (
                    <Chip
                      label={brand.charAt(0).toUpperCase() + brand.slice(1)}
                      size="small"
                      sx={{ backgroundColor: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontWeight: 700, fontSize: "0.7rem", textTransform: "capitalize" }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* ── Stats row ────────────────────────────────────────────────────────── */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 3 }}>
          {[
            { icon: <CampaignIcon sx={{ fontSize: 22 }} />, label: "Campanhas", value: campaigns.length, sub: `${activeCampaigns} ativas`, color: "#6366f1" },
            { icon: <MoneyIcon sx={{ fontSize: 22 }} />, label: "Investido", value: `R$ ${totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "total gasto", color: "#ffcc01" },
            { icon: <ClickIcon sx={{ fontSize: 22 }} />, label: "Interações", value: totalUnits.toLocaleString("pt-BR"), sub: "cliques e views", color: "#10b981" },
          ].map((s) => (
            <Paper
              key={s.label}
              elevation={0}
              sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5, textAlign: "center" }}
            >
              <Box sx={{ color: s.color, mb: 1, display: "flex", justifyContent: "center" }}>{s.icon}</Box>
              <Typography sx={{ color: s.color, fontWeight: 800, fontSize: "1.2rem", lineHeight: 1.1 }}>{s.value}</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", mt: 0.4 }}>{s.sub}</Typography>
            </Paper>
          ))}
        </Box>

        {/* ── Main grid ────────────────────────────────────────────────────────── */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>

          {/* Foto de perfil */}
          <Paper
            elevation={0}
            sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 3 }}
          >
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", mb: 0.4 }}>Foto de perfil</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", mb: 3 }}>
              Sua foto aparece no menu lateral e nas campanhas
            </Typography>

            {/* Current / preview side by side */}
            <Box sx={{ display: "flex", gap: 2, mb: 3, justifyContent: "center" }}>
              <Box sx={{ textAlign: "center" }}>
                <Box
                  sx={{
                    width: 100, height: 100, borderRadius: "50%", margin: "0 auto",
                    border: "3px solid rgba(255,255,255,0.1)",
                    overflow: "hidden", backgroundColor: "rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center", mb: 1,
                  }}
                >
                  {(preview ? photoUrl : displayPhoto) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={(preview ? photoUrl : displayPhoto) ?? ""} alt="Atual" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Typography sx={{ color: "rgba(255,255,255,0.2)", fontWeight: 800, fontSize: "2rem" }}>
                      {(userName ?? "P").charAt(0).toUpperCase()}
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem" }}>Atual</Typography>
              </Box>

              {preview && (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", color: "rgba(255,255,255,0.2)", fontSize: "1.2rem" }}>→</Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Box
                      sx={{
                        width: 100, height: 100, borderRadius: "50%", margin: "0 auto",
                        border: "3px solid rgba(255,204,1,0.5)",
                        overflow: "hidden", backgroundColor: "rgba(255,255,255,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "center", mb: 1,
                        boxShadow: "0 0 0 4px rgba(255,204,1,0.1)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="Nova" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </Box>
                    <Typography sx={{ color: "#ffcc01", fontSize: "0.65rem", fontWeight: 600 }}>Nova foto</Typography>
                  </Box>
                </>
              )}
            </Box>

            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={handleFileChange} />

            {/* Success message */}
            {saved && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#10b981", mb: 2, justifyContent: "center" }}>
                <CheckIcon sx={{ fontSize: 18 }} />
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>Foto atualizada com sucesso!</Typography>
              </Box>
            )}

            {/* Action buttons */}
            {preview ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  fullWidth
                  startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
                  sx={{ backgroundColor: "#ffcc01", color: "#111", fontWeight: 700, borderRadius: "12px", textTransform: "none", py: 1.2, "&:hover": { backgroundColor: "#e6b800" }, "&:disabled": { backgroundColor: "rgba(255,204,1,0.4)" } }}
                >
                  {saving ? "Salvando..." : "Confirmar nova foto"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  fullWidth
                  sx={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", borderRadius: "12px", textTransform: "none", "&:hover": { borderColor: "rgba(255,255,255,0.3)" } }}
                >
                  Cancelar
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  fullWidth
                  sx={{ borderColor: "rgba(255,204,1,0.3)", color: "#ffcc01", borderRadius: "12px", textTransform: "none", fontWeight: 600, py: 1.2, "&:hover": { backgroundColor: "rgba(255,204,1,0.06)", borderColor: "rgba(255,204,1,0.5)" } }}
                >
                  {displayPhoto ? "Trocar foto" : "Adicionar foto"}
                </Button>
                {displayPhoto && !defaultPhoto?.includes(displayPhoto.replace("/", "").split("/")[0]) && (
                  <Button
                    variant="text"
                    startIcon={<DeleteIcon />}
                    onClick={handleRemove}
                    fullWidth
                    sx={{ color: "rgba(239,68,68,0.6)", textTransform: "none", borderRadius: "12px", "&:hover": { color: "#ef4444", backgroundColor: "rgba(239,68,68,0.06)" } }}
                  >
                    Remover foto personalizada
                  </Button>
                )}
              </Box>
            )}
          </Paper>

          {/* Informações da conta */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Paper
              elevation={0}
              sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 3 }}
            >
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", mb: 2.5 }}>Informações da conta</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { label: "Nome", value: userName ?? "—" },
                  { label: "Tipo de conta", value: roleLabel[role ?? ""] ?? "—" },
                  { label: "Marca", value: brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : "—" },
                  { label: "Status", value: "Ativo" },
                ].map((item, i, arr) => (
                  <Box key={item.label}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.8 }}>
                      <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>{item.label}</Typography>
                      <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.82rem" }}>{item.value}</Typography>
                    </Box>
                    {i < arr.length - 1 && <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />}
                  </Box>
                ))}
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 3 }}
            >
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", mb: 2 }}>Resumo de campanhas</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                {[
                  { label: "Total de campanhas", value: campaigns.length },
                  { label: "Ativas",    value: campaigns.filter(c => c.status === "active").length,   color: "#10b981" },
                  { label: "Pendentes", value: campaigns.filter(c => c.status === "pending").length,  color: "#f59e0b" },
                  { label: "Finalizadas", value: campaigns.filter(c => c.status === "finished").length, color: "#3b82f6" },
                ].map((item) => (
                  <Box key={item.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>{item.label}</Typography>
                    <Typography sx={{ color: item.color ?? "#fff", fontWeight: 700, fontSize: "0.85rem" }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </PatrocinadorShell>
  );
}
