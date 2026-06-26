"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import SoupKitchenRoundedIcon from "@mui/icons-material/SoupKitchenRounded";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { createOperador, deleteOperador, listOperadores, OperadorResponse } from "@/app/services/auth/authAdminService";
import { getOperationRestaurants, Restaurant } from "@/app/services/food/foodService";

export default function OperadoresPage() {
  const [operadores, setOperadores] = useState<OperadorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", restaurant_id: "" });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);

  function load() {
    setLoading(true);
    listOperadores()
      .then(setOperadores)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    getOperationRestaurants().then(setRestaurants).catch(() => {});
  }, []);

  function openDialog() {
    setForm({ name: "", email: "", password: "", restaurant_id: "" });
    setFormError("");
    setDialogOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await createOperador({
        name: form.name,
        email: form.email,
        password: form.password,
        restaurant_id: form.restaurant_id ? Number(form.restaurant_id) : null,
      });
      setDialogOpen(false);
      load();
    } catch (err: unknown) {
      setFormError((err as Error).message || "Erro ao criar operador");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Desativar este operador?")) return;
    setDeletingId(id);
    try {
      await deleteOperador(id);
      setOperadores((prev) => prev.filter((o) => o.id !== id));
    } catch {
    } finally {
      setDeletingId(null);
    }
  }

  function restaurantName(id: number | null) {
    if (!id) return null;
    return restaurants.find((r) => r.id === id)?.name ?? `#${id}`;
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, pt: 4, pb: 6 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mb: 0.3, display: "flex", alignItems: "center", gap: 1 }}>
            <SoupKitchenRoundedIcon sx={{ color: "#ffcc01" }} />
            Operadores
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            Contas de acesso para cozinha e garçons
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openDialog}
          sx={{
            backgroundColor: "#ffcc01", color: "#111", fontWeight: 700,
            textTransform: "none", borderRadius: "10px",
            "&:hover": { backgroundColor: "#f5c000" },
          }}
        >
          Novo operador
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#fff" }} />
        </Box>
      ) : operadores.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <SoupKitchenRoundedIcon sx={{ fontSize: 48, color: "rgba(255,255,255,0.1)", mb: 1 }} />
          <Typography sx={{ color: "rgba(255,255,255,0.3)" }}>
            Nenhum operador cadastrado
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {operadores.map((o) => (
            <Box
              key={o.id}
              sx={{
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 40, height: 40, borderRadius: "10px", flexShrink: 0,
                  backgroundColor: "rgba(255,204,1,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <SoupKitchenRoundedIcon sx={{ color: "#ffcc01", fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>
                  {o.name || "—"}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }} noWrap>
                  {o.email}
                </Typography>
                {o.restaurant_id && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
                    <RestaurantRoundedIcon sx={{ fontSize: 12, color: "#ffcc01" }} />
                    <Typography sx={{ color: "#ffcc01", fontSize: "0.72rem", fontWeight: 600 }}>
                      {restaurantName(o.restaurant_id)}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", flexShrink: 0 }}>
                {new Date(o.created_at).toLocaleDateString("pt-BR")}
              </Typography>
              <IconButton
                onClick={() => handleDelete(o.id)}
                disabled={deletingId === o.id}
                sx={{ color: "rgba(255,255,255,0.3)", "&:hover": { color: "#f87171" } }}
              >
                {deletingId === o.id ? <CircularProgress size={16} sx={{ color: "#f87171" }} /> : <DeleteRoundedIcon fontSize="small" />}
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {/* Create dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px" } }}
      >
        <DialogTitle sx={{ color: "#fff", fontWeight: 700 }}>Novo operador</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleCreate} sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
            <TextField
              fullWidth label="Nome" required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              sx={inputSx}
            />
            <TextField
              fullWidth label="Email" type="email" required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              sx={inputSx}
            />
            <TextField
              fullWidth label="Senha" type={showPass ? "text" : "password"} required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass((p) => !p)} edge="end" sx={{ color: "rgba(255,255,255,0.4)" }}>
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />

            {/* Restaurant selector */}
            <FormControl fullWidth sx={selectSx}>
              <InputLabel>Restaurante (opcional)</InputLabel>
              <Select
                value={form.restaurant_id}
                label="Restaurante (opcional)"
                onChange={(e) => setForm((f) => ({ ...f, restaurant_id: e.target.value as string }))}
              >
                <MenuItem value=""><em>Sem vínculo</em></MenuItem>
                {restaurants.map((r) => (
                  <MenuItem key={r.id} value={String(r.id)}>{r.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {formError && (
              <Typography sx={{ color: "#f87171", fontSize: "0.82rem" }}>{formError}</Typography>
            )}
            <Box sx={{ display: "flex", gap: 1, pt: 0.5 }}>
              <Button
                fullWidth variant="outlined"
                onClick={() => setDialogOpen(false)}
                sx={{ color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.15)", textTransform: "none", borderRadius: "10px" }}
              >
                Cancelar
              </Button>
              <Button
                type="submit" fullWidth variant="contained" disabled={saving}
                sx={{ backgroundColor: "#ffcc01", color: "#111", fontWeight: 700, textTransform: "none", borderRadius: "10px", "&:hover": { backgroundColor: "#f5c000" } }}
              >
                {saving ? <CircularProgress size={18} sx={{ color: "#111" }} /> : "Criar"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
    "&.Mui-focused fieldset": { borderColor: "#ffcc01" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#ffcc01" },
};

const selectSx = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
    "&.Mui-focused fieldset": { borderColor: "#ffcc01" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#ffcc01" },
  "& .MuiSelect-icon": { color: "rgba(255,255,255,0.4)" },
  "& .MuiPaper-root": { backgroundColor: "#1a1a2e" },
};
