"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import {
  getAdminRestaurants,
  getAdminMenuItems,
  updateRestaurant,
  updateMenuItem,
  uploadRestaurantImage,
  uploadMenuItemImage,
  Restaurant,
  MenuItem,
} from "@/app/services/food/foodService";

// ─── types ────────────────────────────────────────────────────────────────────

interface EditMenuItemState {
  name: string;
  description: string;
  price: string;
  category: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function groupByCategory(items: MenuItem[]): Record<string, MenuItem[]> {
  return items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const cat = item.category || "Sem categoria";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
}

// ─── component ───────────────────────────────────────────────────────────────

export default function AdminRestaurantesPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.id);
  const { role, authReady } = useAuth();
  const { showToast } = useToast();

  const canAccess = role === "admin_master" || role === "admin";

  // list view
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // detail view
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // restaurant edit inline
  const [editingRestaurant, setEditingRestaurant] = useState(false);
  const [restName, setRestName] = useState("");
  const [restDesc, setRestDesc] = useState("");
  const [savingRest, setSavingRest] = useState(false);
  const [uploadingRestImg, setUploadingRestImg] = useState(false);
  const restImgRef = useRef<HTMLInputElement>(null);

  // menu item edit dialog
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState<EditMenuItemState>({ name: "", description: "", price: "", category: "" });
  const [savingItem, setSavingItem] = useState(false);
  const [uploadingItemImg, setUploadingItemImg] = useState<number | null>(null);
  const itemImgRef = useRef<HTMLInputElement>(null);
  const itemImgTargetRef = useRef<number | null>(null);

  useEffect(() => {
    if (authReady && !canAccess) router.replace("/pages/user/home");
  }, [authReady, canAccess, router]);

  useEffect(() => {
    if (!authReady || !canAccess) return;
    getAdminRestaurants(eventId)
      .then((data) => { setRestaurants(data); setLoadingList(false); })
      .catch(() => { showToast("Erro ao carregar restaurantes", "error"); setLoadingList(false); });
  }, [authReady, canAccess, eventId, showToast]);

  const openRestaurant = async (rest: Restaurant) => {
    setSelected(rest);
    setRestName(rest.name);
    setRestDesc(rest.description ?? "");
    setEditingRestaurant(false);
    setLoadingDetail(true);
    try {
      const items = await getAdminMenuItems(rest.id);
      setMenuItems(items);
    } catch {
      showToast("Erro ao carregar cardápio", "error");
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── restaurant save ──────────────────────────────────────────────────────────
  const saveRestaurant = async () => {
    if (!selected) return;
    setSavingRest(true);
    try {
      const updated = await updateRestaurant(selected.id, { name: restName, description: restDesc });
      setSelected(updated);
      setRestaurants((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditingRestaurant(false);
      showToast("Restaurante atualizado", "success");
    } catch {
      showToast("Erro ao salvar restaurante", "error");
    } finally {
      setSavingRest(false);
    }
  };

  // ── restaurant image upload ──────────────────────────────────────────────────
  const handleRestImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    setUploadingRestImg(true);
    try {
      const updated = await uploadRestaurantImage(selected.id, file);
      setSelected(updated);
      setRestaurants((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast("Foto atualizada", "success");
    } catch {
      showToast("Erro ao enviar foto", "error");
    } finally {
      setUploadingRestImg(false);
      if (restImgRef.current) restImgRef.current.value = "";
    }
  };

  // ── menu item dialog ──────────────────────────────────────────────────────────
  const openItemEdit = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      category: item.category ?? "",
    });
  };

  const saveItem = async () => {
    if (!editingItem) return;
    const price = parseFloat(itemForm.price.replace(",", "."));
    if (isNaN(price) || price < 0) {
      showToast("Preço inválido", "error");
      return;
    }
    setSavingItem(true);
    try {
      const updated = await updateMenuItem(editingItem.id, {
        name: itemForm.name,
        description: itemForm.description,
        price,
        category: itemForm.category,
      });
      setMenuItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setEditingItem(null);
      showToast("Item atualizado", "success");
    } catch {
      showToast("Erro ao salvar item", "error");
    } finally {
      setSavingItem(false);
    }
  };

  // ── menu item image upload ────────────────────────────────────────────────────
  const triggerItemImageUpload = (itemId: number) => {
    itemImgTargetRef.current = itemId;
    itemImgRef.current?.click();
  };

  const handleItemImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const itemId = itemImgTargetRef.current;
    if (!file || !itemId) return;
    setUploadingItemImg(itemId);
    try {
      const updated = await uploadMenuItemImage(itemId, file);
      setMenuItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      if (editingItem?.id === itemId) setEditingItem(updated);
      showToast("Foto atualizada", "success");
    } catch {
      showToast("Erro ao enviar foto", "error");
    } finally {
      setUploadingItemImg(null);
      if (itemImgRef.current) itemImgRef.current.value = "";
      itemImgTargetRef.current = null;
    }
  };

  // ─── loading ──────────────────────────────────────────────────────────────────
  if (!authReady || loadingList) {
    return (
      <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#fff" }} />
      </Box>
    );
  }

  if (!canAccess) return null;

  // ─── detail view ──────────────────────────────────────────────────────────────
  if (selected) {
    const grouped = groupByCategory(menuItems);

    return (
      <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, pb: 6 }}>
        {/* hidden inputs */}
        <input ref={restImgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleRestImageChange} />
        <input ref={itemImgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleItemImageChange} />

        {/* header */}
        <Box sx={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)", px: { xs: 2, sm: 3 }, py: 1.5 }}>
          <Box sx={{ maxWidth: 700, margin: "0 auto", display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton onClick={() => setSelected(null)} sx={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.06)", "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selected.name}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 700, margin: "0 auto", px: { xs: 2, sm: 3 }, pt: 3 }}>
          {/* restaurant card */}
          <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, p: 2.5, mb: 3 }}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
              {/* photo */}
              <Box sx={{ position: "relative", flexShrink: 0 }}>
                <Avatar
                  src={selected.image_url ?? undefined}
                  variant="rounded"
                  sx={{ width: 80, height: 80, backgroundColor: "rgba(255,255,255,0.08)", fontSize: 32 }}
                >
                  {selected.name[0]}
                </Avatar>
                <IconButton
                  onClick={() => restImgRef.current?.click()}
                  disabled={uploadingRestImg}
                  size="small"
                  sx={{ position: "absolute", bottom: -6, right: -6, backgroundColor: "#ffcc01", color: "#000", width: 26, height: 26, "&:hover": { backgroundColor: "#e6b800" } }}
                >
                  {uploadingRestImg ? <CircularProgress size={12} sx={{ color: "#000" }} /> : <PhotoCameraIcon sx={{ fontSize: 14 }} />}
                </IconButton>
              </Box>

              {/* name / desc */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {editingRestaurant ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <TextField
                      value={restName}
                      onChange={(e) => setRestName(e.target.value)}
                      size="small"
                      placeholder="Nome"
                      fullWidth
                      sx={inputSx}
                    />
                    <TextField
                      value={restDesc}
                      onChange={(e) => setRestDesc(e.target.value)}
                      size="small"
                      placeholder="Descrição"
                      fullWidth
                      multiline
                      maxRows={3}
                      sx={inputSx}
                    />
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={savingRest ? <CircularProgress size={14} sx={{ color: "#000" }} /> : <SaveIcon />}
                        disabled={savingRest}
                        onClick={saveRestaurant}
                        sx={{ backgroundColor: "#ffcc01", color: "#000", fontWeight: 700, "&:hover": { backgroundColor: "#e6b800" }, textTransform: "none" }}
                      >
                        Salvar
                      </Button>
                      <Button size="small" onClick={() => setEditingRestaurant(false)} sx={{ color: "rgba(255,255,255,0.5)", textTransform: "none" }}>
                        Cancelar
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>{selected.name}</Typography>
                      <IconButton size="small" onClick={() => setEditingRestaurant(true)} sx={{ color: "rgba(255,255,255,0.4)", p: 0.3, "&:hover": { color: "#ffcc01" } }}>
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                    {selected.description && (
                      <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem", mt: 0.3 }}>{selected.description}</Typography>
                    )}
                    <Chip
                      label={selected.is_active ? "Ativo" : "Inativo"}
                      size="small"
                      sx={{ mt: 0.8, backgroundColor: selected.is_active ? "rgba(46,204,113,0.15)" : "rgba(255,255,255,0.06)", color: selected.is_active ? "#2ecc71" : "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "0.6rem", height: 18 }}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>

          {/* cardápio */}
          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", mb: 1.5 }}>
            Cardápio — {menuItems.length} {menuItems.length === 1 ? "item" : "itens"}
          </Typography>

          {loadingDetail ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress sx={{ color: "#fff" }} />
            </Box>
          ) : menuItems.length === 0 ? (
            <Typography sx={{ color: "rgba(255,255,255,0.3)", textAlign: "center", py: 4 }}>Nenhum item no cardápio</Typography>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Typography sx={{ color: "#ffcc01", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", mb: 1 }}>
                  {category}
                </Typography>
                <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                  {items.map((item, idx) => (
                    <Box key={item.id}>
                      {idx > 0 && <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5 }}>
                        {/* item photo */}
                        <Box sx={{ position: "relative", flexShrink: 0 }}>
                          <Avatar
                            src={item.image_url ?? undefined}
                            variant="rounded"
                            sx={{ width: 52, height: 52, backgroundColor: "rgba(255,255,255,0.08)", fontSize: 20 }}
                          >
                            {item.name[0]}
                          </Avatar>
                          <IconButton
                            onClick={() => triggerItemImageUpload(item.id)}
                            disabled={uploadingItemImg === item.id}
                            size="small"
                            sx={{ position: "absolute", bottom: -5, right: -5, backgroundColor: "#ffcc01", color: "#000", width: 20, height: 20, "&:hover": { backgroundColor: "#e6b800" } }}
                          >
                            {uploadingItemImg === item.id ? <CircularProgress size={10} sx={{ color: "#000" }} /> : <PhotoCameraIcon sx={{ fontSize: 11 }} />}
                          </IconButton>
                        </Box>

                        {/* info */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.name}
                          </Typography>
                          {item.description && (
                            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.description}
                            </Typography>
                          )}
                          <Typography sx={{ color: "#ffcc01", fontWeight: 700, fontSize: "0.82rem", mt: 0.2 }}>
                            R$ {Number(item.price).toFixed(2).replace(".", ",")}
                          </Typography>
                        </Box>

                        {/* edit button */}
                        <IconButton size="small" onClick={() => openItemEdit(item)} sx={{ color: "rgba(255,255,255,0.35)", flexShrink: 0, "&:hover": { color: "#fff" } }}>
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Box>
            ))
          )}
        </Box>

        {/* edit item dialog */}
        <Dialog
          open={!!editingItem}
          onClose={() => !savingItem && setEditingItem(null)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 3 } }}
        >
          <DialogTitle sx={{ color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            Editar item
            <IconButton onClick={() => setEditingItem(null)} sx={{ color: "rgba(255,255,255,0.5)" }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 0 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <TextField label="Nome" value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} fullWidth size="small" sx={inputSx} />
              <TextField label="Categoria" value={itemForm.category} onChange={(e) => setItemForm((f) => ({ ...f, category: e.target.value }))} fullWidth size="small" sx={inputSx} />
              <TextField
                label="Preço (R$)"
                value={itemForm.price}
                onChange={(e) => setItemForm((f) => ({ ...f, price: e.target.value }))}
                fullWidth
                size="small"
                sx={inputSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>R$</Typography></InputAdornment> }}
              />
              <TextField label="Descrição" value={itemForm.description} onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))} fullWidth size="small" multiline rows={2} sx={inputSx} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setEditingItem(null)} sx={{ color: "rgba(255,255,255,0.5)", textTransform: "none" }}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={saveItem}
              disabled={savingItem}
              startIcon={savingItem ? <CircularProgress size={14} sx={{ color: "#000" }} /> : <SaveIcon />}
              sx={{ backgroundColor: "#ffcc01", color: "#000", fontWeight: 700, textTransform: "none", "&:hover": { backgroundColor: "#e6b800" } }}
            >
              Salvar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ─── list view ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, pb: 6 }}>
      {/* header */}
      <Box sx={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)", px: { xs: 2, sm: 3 }, py: 1.5 }}>
        <Box sx={{ maxWidth: 700, margin: "0 auto", display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton
            onClick={() => router.push(`/pages/admin/events/${eventId}`)}
            sx={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.06)", "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Restaurantes</Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 700, margin: "0 auto", px: { xs: 2, sm: 3 }, pt: 3 }}>
        {restaurants.length === 0 ? (
          <Typography sx={{ color: "rgba(255,255,255,0.3)", textAlign: "center", py: 6 }}>Nenhum restaurante cadastrado neste evento</Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {restaurants.map((rest) => (
              <Paper
                key={rest.id}
                elevation={0}
                onClick={() => openRestaurant(rest)}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 2.5,
                  px: 2, py: 1.5,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 2,
                  transition: "all 0.2s",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,204,1,0.3)" },
                }}
              >
                <Avatar
                  src={rest.image_url ?? undefined}
                  variant="rounded"
                  sx={{ width: 52, height: 52, backgroundColor: "rgba(255,255,255,0.1)", fontSize: 22, flexShrink: 0 }}
                >
                  {rest.name[0]}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {rest.name}
                  </Typography>
                  {rest.description && (
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {rest.description}
                    </Typography>
                  )}
                </Box>
                <Chip
                  label={rest.is_active ? "Ativo" : "Inativo"}
                  size="small"
                  sx={{ backgroundColor: rest.is_active ? "rgba(46,204,113,0.15)" : "rgba(255,255,255,0.06)", color: rest.is_active ? "#2ecc71" : "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "0.62rem", height: 20, flexShrink: 0 }}
                />
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── shared input styles ──────────────────────────────────────────────────────

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
    "&.Mui-focused fieldset": { borderColor: "#ffcc01" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#ffcc01" },
  "& .MuiInputAdornment-root p": { color: "rgba(255,255,255,0.4)" },
};
