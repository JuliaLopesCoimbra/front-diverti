"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import NightShelterRoundedIcon from "@mui/icons-material/NightShelterRounded";

import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import {
  CampingAreaResponse,
  CampingBookingInfo,
  CampingSessionResponse,
  createCampingSession,
  deleteCampingSession,
  getCampingAreaById,
  getCampingSessionsByArea,
  getCampingSessionBookings,
  updateCampingSession,
} from "@/app/services/camping/campingAdminService";

// ─── helpers ────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

const EMPTY_FORM = { label: "", check_in_date: "", check_out_date: "", status: "active" };

const inputSx = {
  "& .MuiInputBase-root": { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "10px", color: "#fff", fontSize: "0.88rem" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.15)" },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.45)", fontSize: "0.85rem" },
  "& .MuiInputLabel-root.Mui-focused": { color: "rgba(255,255,255,0.8)" },
  "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.5)" },
};
const cellSx = { color: "rgba(255,255,255,0.85)", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.85rem" };
const headSx = { color: "rgba(255,255,255,0.45)", borderBottom: "1px solid rgba(255,255,255,0.1)", fontWeight: 700, fontSize: "0.73rem", textTransform: "uppercase" as const, letterSpacing: "0.06em" };

// ─── Page ────────────────────────────────────────────────────────────────────
export default function CampingSessionsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const areaId = Number(params.areaId);
  const eventId = Number(searchParams.get("eventId"));
  const { role, authReady, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [area, setArea] = useState<CampingAreaResponse | null>(null);
  const [sessions, setSessions] = useState<CampingSessionResponse[]>([]);
  const [bookings, setBookings] = useState<Record<number, CampingBookingInfo>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // inline form
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);

  // inline delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canAccess = role === "admin_master" || role === "admin";

  const loadData = useCallback(async () => {
    if (!canAccess || !areaId) return;
    setLoading(true);
    try {
      const [areaData, sessionsData] = await Promise.all([
        getCampingAreaById(areaId),
        getCampingSessionsByArea(areaId),
      ]);
      setArea(areaData);
      setSessions(sessionsData);

      // load bookings for reserved sessions in parallel
      const reserved = sessionsData.filter((s) => s.quantity_bookings > 0);
      if (reserved.length > 0) {
        const results = await Promise.allSettled(
          reserved.map((s) => getCampingSessionBookings(s.id))
        );
        const bookingMap: Record<number, CampingBookingInfo> = {};
        results.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value.length > 0) {
            bookingMap[reserved[i].id] = r.value[0];
          }
        });
        setBookings(bookingMap);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Erro ao carregar dados", "error");
    } finally {
      setLoading(false);
    }
  }, [canAccess, areaId, showToast]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) { router.replace("/"); return; }
    if (!canAccess) router.replace("/pages/user/home");
  }, [authReady, isAuthenticated, canAccess, router]);
  useEffect(() => { if (authReady && canAccess) loadData(); }, [authReady, canAccess, loadData]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormVisible(true);
    setDeletingId(null);
  };

  const openEdit = (s: CampingSessionResponse) => {
    setForm({
      label: s.label,
      check_in_date: s.check_in_date?.split("T")[0] ?? "",
      check_out_date: s.check_out_date?.split("T")[0] ?? "",
      status: s.status,
    });
    setEditingId(s.id);
    setFormVisible(true);
    setDeletingId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelForm = () => { setFormVisible(false); setEditingId(null); };

  const isValid = form.label.trim() && form.check_in_date && form.check_out_date && form.check_in_date <= form.check_out_date;

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const payload = {
        label: form.label.trim(),
        check_in_date: form.check_in_date,
        check_out_date: form.check_out_date,
        capacity: 1,
        status: form.status,
      };
      if (editingId) {
        await updateCampingSession(editingId, payload);
        showToast("Período atualizado", "success");
      } else {
        await createCampingSession(areaId, payload);
        showToast("Período criado", "success");
      }
      setFormVisible(false);
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Erro ao salvar período", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setSaving(true);
    try {
      await deleteCampingSession(id);
      showToast("Período removido", "success");
      setDeletingId(null);
      await loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Erro ao remover período", "error");
    } finally {
      setSaving(false);
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
    <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
      <Container maxWidth="lg">

        {/* ── Header ── */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton
              onClick={() => router.push(`/pages/admin/camping?eventId=${eventId}`)}
              sx={{ color: "#fff", width: 44, height: 44, backgroundColor: "rgba(255,255,255,0.06)", "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: "1rem", md: "1.2rem" } }}>
                {area?.name ?? "Área de Camping"}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem" }}>
                {sessions.length} período(s) cadastrado(s)
              </Typography>
            </Box>
          </Box>
          {!formVisible && (
            <Button
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{ backgroundColor: "#fff", color: "#111", textTransform: "none", fontWeight: 700, borderRadius: "12px", px: 2.5, flexShrink: 0, "&:hover": { backgroundColor: "#e8e8e8" } }}
            >
              Novo período
            </Button>
          )}
        </Box>

        {/* ── Inline form ── */}
        {formVisible && (
          <Paper
            elevation={0}
            sx={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 3, p: { xs: 2.5, md: 3 }, mb: 3 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
                {editingId ? "Editar período" : "Novo período"}
              </Typography>
              <IconButton size="small" onClick={cancelForm} sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#fff" } }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                label="Label *"
                placeholder='Ex: "Sexta a Domingo"'
                value={form.label}
                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                disabled={saving}
                sx={{ ...inputSx, gridColumn: { sm: "1 / -1" } }}
              />
              <TextField
                label="Check-in *"
                type="date"
                value={form.check_in_date}
                onChange={(e) => setForm((p) => ({ ...p, check_in_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                disabled={saving}
                sx={inputSx}
              />
              <TextField
                label="Check-out *"
                type="date"
                value={form.check_out_date}
                onChange={(e) => setForm((p) => ({ ...p, check_out_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                disabled={saving}
                sx={inputSx}
              />
              <TextField
                select
                label="Status"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                disabled={saving}
                sx={inputSx}
              >
                <MenuItem value="active">Ativo</MenuItem>
                <MenuItem value="inactive">Inativo</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3 }}>
              <Button onClick={cancelForm} disabled={saving} sx={{ color: "rgba(255,255,255,0.5)", textTransform: "none" }}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !isValid}
                sx={{ backgroundColor: "#fff", color: "#111", textTransform: "none", fontWeight: 700, borderRadius: "10px", px: 3, "&:hover": { backgroundColor: "#e8e8e8" }, "&:disabled": { backgroundColor: "rgba(255,255,255,0.2)" } }}
              >
                {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar período"}
              </Button>
            </Box>
          </Paper>
        )}

        {/* ── Sessions ── */}
        {sessions.length === 0 && !formVisible ? (
          <Paper sx={{ p: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
            <NightShelterRoundedIcon sx={{ color: "rgba(255,255,255,0.12)", fontSize: 52, mb: 1.5 }} />
            <Typography sx={{ color: "#fff", fontWeight: 600, mb: 0.5 }}>Nenhum período cadastrado</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", mb: 2.5 }}>
              Crie períodos para liberar vagas de camping para reserva.
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{ backgroundColor: "#fff", color: "#111", textTransform: "none", fontWeight: 700, borderRadius: "12px", px: 3, "&:hover": { backgroundColor: "#e8e8e8" } }}
            >
              Novo período
            </Button>
          </Paper>
        ) : sessions.length > 0 && (
          <>
            {/* Mobile cards */}
            <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 1.5 }}>
              {sessions.map((s) => (
                <Paper key={s.id} sx={{ borderRadius: 3, backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  {deletingId === s.id ? (
                    <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                      <Typography sx={{ color: "#fff", fontSize: "0.88rem" }}>
                        Remover <strong>{s.label}</strong>?
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                        <Button size="small" onClick={() => setDeletingId(null)} disabled={saving} sx={{ color: "rgba(255,255,255,0.5)", textTransform: "none", fontSize: "0.8rem" }}>
                          Cancelar
                        </Button>
                        <Button
                          size="small"
                          onClick={() => handleDelete(s.id)}
                          disabled={saving}
                          sx={{ backgroundColor: "rgba(220,50,50,0.85)", color: "#fff", textTransform: "none", fontWeight: 700, borderRadius: "8px", px: 1.5, fontSize: "0.8rem", "&:hover": { backgroundColor: "#e53935" } }}
                        >
                          {saving ? "..." : "Remover"}
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
                        <Box>
                          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>{s.label}</Typography>
                          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem" }}>
                            {formatDate(s.check_in_date)} → {formatDate(s.check_out_date)}
                          </Typography>
                        </Box>
                        <Chip
                          label={s.status === "active" ? "Ativo" : "Inativo"}
                          size="small"
                          sx={{ backgroundColor: s.status === "active" ? "rgba(46,204,113,0.15)" : "rgba(255,255,255,0.08)", color: s.status === "active" ? "#2ecc71" : "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "0.7rem" }}
                        />
                      </Box>
                      <Box sx={{ display: "flex", gap: 2, mb: bookings[s.id] ? 1 : 1.5, flexWrap: "wrap" }}>
                        <Chip
                          label={s.quantity_bookings > 0 ? "Reservada" : "Disponível"}
                          size="small"
                          sx={{ backgroundColor: s.quantity_bookings > 0 ? "rgba(245,158,11,0.15)" : "rgba(46,204,113,0.15)", color: s.quantity_bookings > 0 ? "#f59e0b" : "#2ecc71", fontWeight: 700, fontSize: "0.7rem" }}
                        />
                        {s.quantity_entries > 0 && (
                          <Chip label="Check-in feito" size="small" sx={{ backgroundColor: "rgba(46,204,113,0.15)", color: "#2ecc71", fontWeight: 700, fontSize: "0.7rem" }} />
                        )}
                      </Box>
                      {bookings[s.id] && (
                        <Box sx={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 2, p: 1.5, mb: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
                          <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>{bookings[s.id].user_name}</Typography>
                          {bookings[s.id].user_cpf && (
                            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", fontFamily: "monospace" }}>
                              {bookings[s.id].user_cpf!.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                            </Typography>
                          )}
                          <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem" }}>{bookings[s.id].user_email}</Typography>
                        </Box>
                      )}
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton size="small" onClick={() => openEdit(s)} sx={{ color: "rgba(255,255,255,0.45)", "&:hover": { color: "#fff" } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setDeletingId(s.id)} sx={{ color: "rgba(255,100,100,0.45)", "&:hover": { color: "#ff6464" } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>

            {/* Desktop table */}
            <TableContainer component={Paper} sx={{ display: { xs: "none", md: "block" }, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headSx}>Período</TableCell>
                    <TableCell sx={headSx}>Check-in</TableCell>
                    <TableCell sx={headSx}>Check-out</TableCell>
                    <TableCell sx={headSx}>Nome</TableCell>
                    <TableCell sx={headSx}>CPF</TableCell>
                    <TableCell sx={headSx}>E-mail</TableCell>
                    <TableCell sx={headSx} align="center">Check-in feito</TableCell>
                    <TableCell sx={headSx} align="center">Status</TableCell>
                    <TableCell sx={headSx} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.id} sx={{ "&:hover": { backgroundColor: "rgba(255,255,255,0.025)" } }}>
                      {deletingId === s.id ? (
                        <TableCell colSpan={8} sx={{ ...cellSx, py: 1.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Typography sx={{ color: "#fff", fontSize: "0.88rem", flex: 1 }}>
                              Remover <strong>{s.label}</strong>?
                            </Typography>
                            <Button size="small" onClick={() => setDeletingId(null)} disabled={saving} sx={{ color: "rgba(255,255,255,0.5)", textTransform: "none" }}>
                              Cancelar
                            </Button>
                            <Button
                              size="small"
                              onClick={() => handleDelete(s.id)}
                              disabled={saving}
                              sx={{ backgroundColor: "rgba(220,50,50,0.85)", color: "#fff", textTransform: "none", fontWeight: 700, borderRadius: "8px", px: 2, "&:hover": { backgroundColor: "#e53935" } }}
                            >
                              {saving ? "Removendo..." : "Confirmar remoção"}
                            </Button>
                          </Box>
                        </TableCell>
                      ) : (
                        <>
                          <TableCell sx={cellSx}><Typography sx={{ fontWeight: 600, color: "#fff" }}>{s.label}</Typography></TableCell>
                          <TableCell sx={cellSx}>{formatDate(s.check_in_date)}</TableCell>
                          <TableCell sx={cellSx}>{formatDate(s.check_out_date)}</TableCell>
                          <TableCell sx={cellSx}>
                            {bookings[s.id]
                              ? <Typography sx={{ color: "#fff", fontSize: "0.85rem" }}>{bookings[s.id].user_name}</Typography>
                              : <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.82rem" }}>—</Typography>}
                          </TableCell>
                          <TableCell sx={cellSx}>
                            {bookings[s.id]?.user_cpf
                              ? <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.82rem", fontFamily: "monospace" }}>
                                  {bookings[s.id].user_cpf!.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                                </Typography>
                              : <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.82rem" }}>—</Typography>}
                          </TableCell>
                          <TableCell sx={cellSx}>
                            {bookings[s.id]
                              ? <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.82rem" }}>{bookings[s.id].user_email}</Typography>
                              : <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.82rem" }}>—</Typography>}
                          </TableCell>
                          <TableCell sx={cellSx} align="center">
                            <Typography sx={{ color: s.quantity_entries > 0 ? "#2ecc71" : "rgba(255,255,255,0.35)" }}>
                              {s.quantity_entries > 0 ? "Sim" : "Não"}
                            </Typography>
                          </TableCell>
                          <TableCell sx={cellSx} align="center">
                            <Chip
                              label={s.status === "active" ? "Ativo" : "Inativo"}
                              size="small"
                              sx={{ backgroundColor: s.status === "active" ? "rgba(46,204,113,0.15)" : "rgba(255,255,255,0.08)", color: s.status === "active" ? "#2ecc71" : "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "0.7rem" }}
                            />
                          </TableCell>
                          <TableCell sx={cellSx} align="right">
                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                              <IconButton size="small" onClick={() => openEdit(s)} sx={{ color: "rgba(255,255,255,0.35)", "&:hover": { color: "#fff" } }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => setDeletingId(s.id)} sx={{ color: "rgba(255,100,100,0.35)", "&:hover": { color: "#ff6464" } }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Container>
    </Box>
  );
}
