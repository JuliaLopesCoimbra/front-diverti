"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import {
  CampingPackage,
  CampingPackageCreate,
  createCampingPackage,
  deleteCampingPackage,
  formatPriceCents,
  getEventCampingPackages,
  parsePriceInput,
  updateCampingPackage,
} from "@/app/services/camping/campingPackageAdminService";

const DAY_OPTIONS = [
  "Qui 20/08", "Sex 21/08", "Sáb 22/08", "Dom 23/08",
  "Seg 24/08", "Ter 25/08", "Qua 26/08", "Qui 27/08",
  "Sex 28/08", "Sáb 29/08", "Dom 30/08",
];

const LOTE_OPTIONS = ["1° Lote", "2° Lote", "3° Lote", "Último Lote"];

const EMPTY_FORM = {
  label: "Passaporte Camping Individual + Tag acesso Veículo",
  badge: "1° Lote",
  badge_color: "rgba(255,204,1,0.18)",
  priceInput: "",
  price_label: "total",
  period: "",
  days: [] as string[],
  is_active: true,
  sort_order: 0,
  isDiaria: false,
};

export default function PassaportesAdminPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.id);
  const { role, authReady } = useAuth();
  const { showToast } = useToast();

  const canAccess = role === "admin_master" || role === "admin";

  const [packages, setPackages] = useState<CampingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CampingPackage | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  useEffect(() => { if (authReady && !canAccess) router.replace("/pages/user/home"); }, [authReady, canAccess, router]);

  useEffect(() => {
    if (!authReady || !canAccess) return;
    loadPackages();
  }, [authReady, canAccess, eventId]);

  const loadPackages = async () => {
    setLoading(true);
    try {
      setPackages(await getEventCampingPackages(eventId));
    } catch {
      showToast("Erro ao carregar passaportes", "error");
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setDrawerOpen(true);
  };

  const openEdit = (pkg: CampingPackage) => {
    setEditing(pkg);
    const isDiaria = !pkg.days || pkg.days.length === 0;
    setForm({
      label: pkg.label,
      badge: pkg.badge ?? "1° Lote",
      badge_color: pkg.badge_color ?? "rgba(255,204,1,0.18)",
      priceInput: (pkg.price_cents / 100).toFixed(2).replace(".", ","),
      price_label: pkg.price_label ?? "total",
      period: pkg.period ?? "",
      days: pkg.days ?? [],
      is_active: pkg.is_active,
      sort_order: pkg.sort_order,
      isDiaria,
    });
    setDrawerOpen(true);
  };

  const handleDayToggle = (day: string) => {
    setForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day],
    }));
  };

  const handleSave = async () => {
    if (!form.label.trim()) { showToast("Informe o nome do passaporte", "error"); return; }
    const price_cents = parsePriceInput(form.priceInput);
    if (price_cents <= 0) { showToast("Informe um preço válido", "error"); return; }

    const payload: Partial<CampingPackageCreate> = {
      label: form.label.trim(),
      badge: form.badge || undefined,
      badge_color: form.badge_color || undefined,
      price_cents,
      price_label: form.price_label || undefined,
      period: form.isDiaria ? "1 dia" : form.period || undefined,
      days: form.isDiaria ? [] : form.days,
      is_active: form.is_active,
      sort_order: form.sort_order,
    };

    setSaving(true);
    try {
      if (editing) {
        const updated = await updateCampingPackage(editing.id, payload);
        setPackages(ps => ps.map(p => p.id === updated.id ? updated : p));
        showToast("Passaporte atualizado!", "success");
      } else {
        const created = await createCampingPackage({ ...payload, event_id: eventId } as CampingPackageCreate);
        setPackages(ps => [...ps, created]);
        showToast("Passaporte criado!", "success");
      }
      setDrawerOpen(false);
    } catch {
      showToast("Erro ao salvar passaporte", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pkg: CampingPackage) => {
    setDeletingId(pkg.id);
    try {
      await deleteCampingPackage(pkg.id);
      setPackages(ps => ps.filter(p => p.id !== pkg.id));
      showToast("Passaporte removido!", "success");
    } catch {
      showToast("Erro ao remover passaporte", "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (!authReady || loading) {
    return (
      <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#fff" }} />
      </Box>
    );
  }

  if (!canAccess) return null;

  return (
    <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, pb: 6 }}>
      {/* Header */}
      <Box sx={{
        position: "sticky", top: 0, zIndex: 10,
        backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        px: { xs: 2, sm: 3 }, py: 1.5,
      }}>
        <Box sx={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton
              onClick={() => router.back()}
              sx={{ color: "#fff", width: 40, height: 40, backgroundColor: "rgba(255,255,255,0.06)", "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Passaportes Camping</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>Gerenciar pacotes e lotes</Typography>
            </Box>
          </Box>
          <Button
            onClick={openNew}
            startIcon={<AddIcon />}
            variant="contained"
            size="small"
            sx={{ backgroundColor: "#10b981", "&:hover": { backgroundColor: "#059669" }, fontWeight: 700, borderRadius: 2, textTransform: "none" }}
          >
            Novo pacote
          </Button>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ maxWidth: 860, margin: "0 auto", px: { xs: 2, sm: 3 }, pt: 3 }}>
        {packages.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <LocalOfferIcon sx={{ fontSize: 48, color: "rgba(255,255,255,0.1)", mb: 2 }} />
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.9rem" }}>
              Nenhum passaporte cadastrado. Clique em "Novo pacote" para começar.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {packages.map((pkg) => (
              <Paper
                key={pkg.id}
                elevation={0}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 3, p: 2.5,
                  display: "flex", alignItems: "center", gap: 2,
                  opacity: pkg.is_active ? 1 : 0.5,
                }}
              >
                {/* Badge */}
                <Box sx={{ flexShrink: 0 }}>
                  <Chip
                    label={pkg.badge ?? "Lote"}
                    size="small"
                    sx={{
                      backgroundColor: pkg.badge_color ?? "rgba(255,204,1,0.18)",
                      color: "#fff", fontWeight: 700, fontSize: "0.65rem",
                    }}
                  />
                </Box>

                {/* Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {pkg.label}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1.5, mt: 0.5, flexWrap: "wrap" }}>
                    <Typography sx={{ color: "#10b981", fontWeight: 700, fontSize: "0.85rem" }}>
                      {formatPriceCents(pkg.price_cents)}
                      {pkg.price_label && <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400, fontSize: "0.72rem", marginLeft: 4 }}>{pkg.price_label}</span>}
                    </Typography>
                    {pkg.period && (
                      <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
                        {pkg.period}
                      </Typography>
                    )}
                    {!pkg.is_active && (
                      <Chip label="Inativo" size="small" sx={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", fontSize: "0.62rem", height: 18 }} />
                    )}
                  </Box>
                  {pkg.days && pkg.days.length > 0 && (
                    <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem", mt: 0.5 }}>
                      {pkg.days.length} dia{pkg.days.length > 1 ? "s" : ""}: {pkg.days.join(", ")}
                    </Typography>
                  )}
                </Box>

                {/* Actions */}
                <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                  <IconButton
                    onClick={() => openEdit(pkg)}
                    sx={{ color: "rgba(255,255,255,0.5)", "&:hover": { color: "#fff", backgroundColor: "rgba(255,255,255,0.06)" } }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(pkg)}
                    disabled={deletingId === pkg.id}
                    sx={{ color: "rgba(255,100,100,0.5)", "&:hover": { color: "#ff6464", backgroundColor: "rgba(255,100,100,0.06)" } }}
                  >
                    {deletingId === pkg.id ? <CircularProgress size={16} sx={{ color: "#ff6464" }} /> : <DeleteOutlineIcon fontSize="small" />}
                  </IconButton>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      {/* Drawer form */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => !saving && setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 440 }, backgroundColor: "#111", borderLeft: "1px solid rgba(255,255,255,0.08)", p: 3 } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
            {editing ? "Editar passaporte" : "Novo passaporte"}
          </Typography>
          <IconButton onClick={() => !saving && setDrawerOpen(false)} sx={{ color: "rgba(255,255,255,0.5)" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Diária toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={form.isDiaria}
                onChange={e => setForm(f => ({ ...f, isDiaria: e.target.checked, days: [] }))}
                sx={{ "& .MuiSwitch-thumb": { backgroundColor: form.isDiaria ? "#10b981" : undefined } }}
              />
            }
            label={<Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>Diária (usuário escolhe o dia)</Typography>}
          />

          {/* Label */}
          <TextField
            label="Nome do passaporte"
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            fullWidth
            size="small"
            InputLabelProps={{ sx: { color: "rgba(255,255,255,0.4)" } }}
            InputProps={{ sx: { color: "#fff", backgroundColor: "rgba(255,255,255,0.05)" } }}
            sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.15)" } }}
          />

          {/* Lote */}
          <Box>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", mb: 1 }}>Lote</Typography>
            <Select
              value={form.badge}
              onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
              fullWidth
              size="small"
              sx={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.05)", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.15)" }, "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.4)" } }}
            >
              {LOTE_OPTIONS.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </Select>
          </Box>

          {/* Preço */}
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField
              label="Preço (R$)"
              value={form.priceInput}
              onChange={e => setForm(f => ({ ...f, priceInput: e.target.value }))}
              placeholder="ex: 754,60"
              size="small"
              sx={{ flex: 2, "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.15)" } }}
              InputLabelProps={{ sx: { color: "rgba(255,255,255,0.4)" } }}
              InputProps={{ sx: { color: "#fff", backgroundColor: "rgba(255,255,255,0.05)" } }}
            />
            <Select
              value={form.price_label}
              onChange={e => setForm(f => ({ ...f, price_label: e.target.value }))}
              size="small"
              sx={{ flex: 1, color: "#fff", backgroundColor: "rgba(255,255,255,0.05)", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.15)" }, "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.4)" } }}
            >
              <MenuItem value="total">total</MenuItem>
              <MenuItem value="por vaga">por vaga</MenuItem>
              <MenuItem value="por dia">por dia</MenuItem>
            </Select>
          </Box>

          {/* Período (só quando não é diária) */}
          {!form.isDiaria && (
            <TextField
              label="Período (ex: Qui 20/08 a Dom 30/08)"
              value={form.period}
              onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
              fullWidth
              size="small"
              InputLabelProps={{ sx: { color: "rgba(255,255,255,0.4)" } }}
              InputProps={{ sx: { color: "#fff", backgroundColor: "rgba(255,255,255,0.05)" } }}
              sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.15)" } }}
            />
          )}

          {/* Dias (só quando não é diária) */}
          {!form.isDiaria && (
            <Box>
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", mb: 1 }}>
                Dias incluídos no pacote
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {DAY_OPTIONS.map(day => (
                  <Chip
                    key={day}
                    label={day}
                    onClick={() => handleDayToggle(day)}
                    size="small"
                    sx={{
                      cursor: "pointer",
                      backgroundColor: form.days.includes(day) ? "#10b981" : "rgba(255,255,255,0.06)",
                      color: form.days.includes(day) ? "#fff" : "rgba(255,255,255,0.4)",
                      fontWeight: form.days.includes(day) ? 700 : 400,
                      fontSize: "0.72rem",
                      "&:hover": { backgroundColor: form.days.includes(day) ? "#059669" : "rgba(255,255,255,0.1)" },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

          {/* Ordem */}
          <TextField
            label="Ordem de exibição"
            type="number"
            value={form.sort_order}
            onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
            fullWidth
            size="small"
            InputLabelProps={{ sx: { color: "rgba(255,255,255,0.4)" } }}
            InputProps={{ sx: { color: "#fff", backgroundColor: "rgba(255,255,255,0.05)" } }}
            sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.15)" } }}
          />

          {/* Ativo */}
          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                sx={{ "& .MuiSwitch-thumb": { backgroundColor: form.is_active ? "#10b981" : undefined } }}
              />
            }
            label={<Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>Visível para usuários</Typography>}
          />

          <Button
            onClick={handleSave}
            disabled={saving}
            variant="contained"
            fullWidth
            sx={{ backgroundColor: "#10b981", "&:hover": { backgroundColor: "#059669" }, fontWeight: 700, borderRadius: 2, textTransform: "none", py: 1.4, mt: 1 }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : editing ? "Salvar alterações" : "Criar passaporte"}
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
}
