"use client";

import { useRef, useState } from "react";
import {
  Box, Paper, Typography, Button, Chip, Divider, IconButton,
} from "@mui/material";
import {
  CameraAlt as CameraIcon, Delete as DeleteIcon,
  CheckCircle as CheckIcon, Edit as EditIcon,
  VerifiedUser as VerifiedIcon, AdminPanelSettings as AdminIcon,
  Shield as ShieldIcon, Campaign as CampaignIcon,
  PeopleAlt as PeopleIcon,
} from "@mui/icons-material";
import { useAuth } from "@/app/context/AuthContext";
import { useProfilePhoto } from "@/app/hooks/useProfilePhoto";
import { BRAND_MOCKS, MOCK_PERFORMANCE } from "@/app/services/campaigns/mockData";
import AdminMasterShell from "@/app/components/AdminMasterShell";

const totalSponsors  = Object.keys(BRAND_MOCKS).length;
const totalCampaigns = Object.values(BRAND_MOCKS).reduce((s, cs) => s + cs.length, 0);
const totalInvested  = Object.values(BRAND_MOCKS).reduce((s, cs) =>
  s + cs.reduce((a, c) => a + (MOCK_PERFORMANCE[c.id] ?? []).reduce((x, d) => x + d.gasto, 0), 0), 0);

const ADMIN_DEFAULT_PHOTO = "/logo/logo-circuito.png";

export default function AdminMasterPerfilPage() {
  const { userName, role } = useAuth();
  const { photoUrl, savePhoto, removePhoto } = useProfilePhoto(ADMIN_DEFAULT_PHOTO);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const displayPhoto = preview ?? photoUrl;


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
    removePhoto(ADMIN_DEFAULT_PHOTO);
    setPreview(null);
    setSaved(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <AdminMasterShell>
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 3, sm: 4 }, pb: 8, maxWidth: 900, width: "100%" }}>

        {/* ── Hero banner ──────────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            position: "relative", borderRadius: 4, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.04)", mb: 3,
          }}
        >
          {/* Banner */}
          <Box
            sx={{
              height: 180,
              background: "linear-gradient(135deg, rgba(255,204,1,0.2) 0%, rgba(99,102,241,0.25) 50%, rgba(255,204,1,0.1) 100%)",
              position: "relative", overflow: "hidden",
            }}
          >
            <Box sx={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%", backgroundColor: "rgba(255,204,1,0.07)" }} />
            <Box sx={{ position: "absolute", bottom: -60, left: "25%", width: 300, height: 300, borderRadius: "50%", backgroundColor: "rgba(99,102,241,0.08)" }} />
            <Box sx={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 1 }}>
              <Chip
                icon={<VerifiedIcon sx={{ fontSize: 13 }} />}
                label="Conta verificada"
                size="small"
                sx={{ backgroundColor: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", color: "#10b981", fontSize: "0.68rem", fontWeight: 700 }}
              />
              <Chip
                icon={<ShieldIcon sx={{ fontSize: 13 }} />}
                label="Admin Master"
                size="small"
                sx={{ backgroundColor: "rgba(255,204,1,0.15)", border: "1px solid rgba(255,204,1,0.35)", color: "#ffcc01", fontSize: "0.68rem", fontWeight: 700 }}
              />
            </Box>
          </Box>

          {/* Avatar + info */}
          <Box sx={{ px: { xs: 2.5, sm: 4 }, pb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 3, mt: "-72px", flexWrap: "wrap" }}>
              <Box sx={{ position: "relative", flexShrink: 0 }}>
                <Box
                  sx={{
                    width: 144, height: 144, borderRadius: "50%",
                    border: "4px solid rgba(15,15,25,1)",
                    overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 0 3px rgba(255,204,1,0.35)",
                  }}
                >
                  {displayPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayPhoto} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <AdminIcon sx={{ fontSize: 52, color: "#ffcc01" }} />
                  )}
                </Box>
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  size="small"
                  sx={{ position: "absolute", bottom: 4, right: 4, backgroundColor: "#ffcc01", color: "#111", width: 32, height: 32, "&:hover": { backgroundColor: "#e6b800" }, boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
                >
                  <CameraIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>

              <Box sx={{ pt: { xs: 0, sm: "72px" }, pb: 0.5, flex: 1, minWidth: 180 }}>
                <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.35rem", lineHeight: 1.2, mb: 0.8 }}>
                  {userName ?? "Admin Master"}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    icon={<AdminIcon sx={{ fontSize: 13 }} />}
                    label="Admin Master"
                    size="small"
                    sx={{ backgroundColor: "rgba(255,204,1,0.15)", border: "1px solid rgba(255,204,1,0.3)", color: "#ffcc01", fontWeight: 700, fontSize: "0.7rem" }}
                  />
                  <Chip
                    label={role ?? "admin_master"}
                    size="small"
                    sx={{ backgroundColor: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontWeight: 700, fontSize: "0.7rem" }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 3 }}>
          {[
            { icon: <PeopleIcon sx={{ fontSize: 22 }} />,   label: "Patrocinadores", value: totalSponsors,  sub: "marcas ativas",     color: "#10b981" },
            { icon: <CampaignIcon sx={{ fontSize: 22 }} />, label: "Campanhas",      value: totalCampaigns, sub: "no total",          color: "#a5b4fc" },
            { icon: <Typography sx={{ fontWeight: 900, fontSize: "1rem" }}>R$</Typography>, label: "Investimento", value: `R$ ${totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "total gerenciado", color: "#ffcc01" },
          ].map((s) => (
            <Paper key={s.label} elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5, textAlign: "center" }}>
              <Box sx={{ color: s.color, mb: 1, display: "flex", justifyContent: "center" }}>{s.icon}</Box>
              <Typography sx={{ color: s.color, fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.1 }}>{s.value}</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", mt: 0.4 }}>{s.sub}</Typography>
            </Paper>
          ))}
        </Box>

        {/* ── Main grid ────────────────────────────────────────────────────── */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>

          {/* Foto de perfil */}
          <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 3 }}>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", mb: 0.4 }}>Foto de perfil</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", mb: 3 }}>
              Sua foto aparece no menu lateral
            </Typography>

            <Box sx={{ display: "flex", gap: 3, mb: 3, justifyContent: "center" }}>
              <Box sx={{ textAlign: "center" }}>
                <Box sx={{ width: 140, height: 140, borderRadius: "50%", margin: "0 auto", border: "3px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                  {(preview ? photoUrl : displayPhoto) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={(preview ? photoUrl : displayPhoto) ?? ""} alt="Atual" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <AdminIcon sx={{ fontSize: 48, color: "rgba(255,255,255,0.2)" }} />
                  )}
                </Box>
                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem" }}>Atual</Typography>
              </Box>

              {preview && (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", color: "rgba(255,255,255,0.2)", fontSize: "1.2rem" }}>→</Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Box sx={{ width: 140, height: 140, borderRadius: "50%", margin: "0 auto", border: "3px solid rgba(255,204,1,0.5)", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1, boxShadow: "0 0 0 4px rgba(255,204,1,0.1)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="Nova" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </Box>
                    <Typography sx={{ color: "#ffcc01", fontSize: "0.65rem", fontWeight: 600 }}>Nova foto</Typography>
                  </Box>
                </>
              )}
            </Box>

            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={handleFileChange} />

            {saved && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#10b981", mb: 2, justifyContent: "center" }}>
                <CheckIcon sx={{ fontSize: 18 }} />
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>Foto atualizada!</Typography>
              </Box>
            )}

            {preview ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  fullWidth
                  startIcon={saving ? undefined : <CheckIcon />}
                  sx={{ backgroundColor: "#ffcc01", color: "#111", fontWeight: 700, borderRadius: "12px", textTransform: "none", py: 1.2, "&:hover": { backgroundColor: "#e6b800" }, "&:disabled": { backgroundColor: "rgba(255,204,1,0.4)" } }}
                >
                  {saving ? "Salvando..." : "Confirmar nova foto"}
                </Button>
                <Button variant="outlined" onClick={handleCancel} fullWidth sx={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", borderRadius: "12px", textTransform: "none", "&:hover": { borderColor: "rgba(255,255,255,0.3)" } }}>
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
                  {photoUrl !== ADMIN_DEFAULT_PHOTO ? "Trocar foto" : "Adicionar foto"}
                </Button>
                {photoUrl !== ADMIN_DEFAULT_PHOTO && (
                  <Button variant="text" startIcon={<DeleteIcon />} onClick={handleRemove} fullWidth sx={{ color: "rgba(239,68,68,0.6)", textTransform: "none", borderRadius: "12px", "&:hover": { color: "#ef4444", backgroundColor: "rgba(239,68,68,0.06)" } }}>
                    Remover foto personalizada
                  </Button>
                )}
              </Box>
            )}
          </Paper>

          {/* Informações */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 3 }}>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", mb: 2.5 }}>Informações da conta</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { label: "Nome",         value: userName ?? "—" },
                  { label: "Tipo",         value: "Admin Master" },
                  { label: "Permissões",   value: "Total" },
                  { label: "Status",       value: "Ativo" },
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

            <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 3 }}>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", mb: 2 }}>Acesso ao sistema</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                {[
                  { label: "Dashboard geral",       allowed: true },
                  { label: "Gerenciar patrocinadores", allowed: true },
                  { label: "Ver campanhas",          allowed: true },
                  { label: "Configurações globais", allowed: true },
                ].map((item) => (
                  <Box key={item.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>{item.label}</Typography>
                    <Chip
                      label="Permitido"
                      size="small"
                      sx={{ backgroundColor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontWeight: 700, fontSize: "0.62rem", height: 20 }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </Box>

      </Box>
    </AdminMasterShell>
  );
}
