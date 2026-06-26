"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Button, Chip, CircularProgress, Divider, IconButton, Typography } from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

import { FoodOrder, getKitchenOrders, kitchenUpdateStatus } from "@/app/services/food/foodService";

const ALLOWED_ROLES = ["operador", "admin", "admin_master"];
function decodeRole(token: string) {
  try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role as string; }
  catch { return ""; }
}

const STATUS_CONFIG = {
  pending: { label: "Novo", bg: "#f59e0b22", border: "#f59e0b55", color: "#f59e0b", actionLabel: "Iniciar preparo", nextStatus: "preparing" },
  preparing: { label: "Preparando", bg: "#3b82f622", border: "#3b82f655", color: "#3b82f6", actionLabel: "Pronto", nextStatus: "ready" },
};

function elapsed(created_at: string): string {
  const diff = Math.floor((Date.now() - new Date(created_at).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}min`;
  return `${Math.floor(m / 60)}h${m % 60}min`;
}

export default function KitchenPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const router = useRouter();
  const id = Number(restaurantId);

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("circuito_access_token");
    const role = token ? decodeRole(token) : "";
    if (!token || !ALLOWED_ROLES.includes(role)) {
      router.replace("/pages/operation");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  const load = useCallback(() => {
    getKitchenOrders(id)
      .then((data) => { setOrders(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  // Re-render every 10s to update elapsed times
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 10_000);
    return () => clearInterval(t);
  }, []);

  async function advance(order: FoodOrder) {
    const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
    if (!cfg) return;
    setUpdatingId(order.id);
    try {
      const updated = await kitchenUpdateStatus(order.id, cfg.nextStatus);
      if (updated.status === "ready") {
        // saiu da cozinha, remove da lista
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
      } else {
        // atualiza o status na lista (pending → preparing)
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      }
    } catch {
    } finally {
      setUpdatingId(null);
    }
  }

  const pending = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");

  if (authorized === null) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#0a0a14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#fff" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#0a0a14", p: { xs: 1.5, md: 3 } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={() => router.push("/pages/operation")} sx={{ color: "rgba(255,255,255,0.5)", p: 0.5 }}>
            <ArrowBackRoundedIcon />
          </IconButton>
          <Box>
            <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.4rem" }}>Cozinha</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem" }}>
              Atualiza automaticamente a cada 30s
            </Typography>
          </Box>
        </Box>
        <Button onClick={load} startIcon={<RefreshRoundedIcon />} sx={{
          color: "rgba(255,255,255,0.55)", textTransform: "none", fontSize: "0.82rem",
          "&:hover": { color: "#fff" },
        }}>
          Atualizar
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#fff" }} />
        </Box>
      ) : orders.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "1rem" }}>Nenhum pedido pendente</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, alignItems: "start" }}>
          {/* Novos */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#f59e0b" }} />
              <Typography sx={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.9rem" }}>
                Novos ({pending.length})
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {pending.map((o) => <OrderCard key={o.id} order={o} onAction={() => advance(o)} updating={updatingId === o.id} />)}
              {pending.length === 0 && <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.83rem", px: 1 }}>Nenhum</Typography>}
            </Box>
          </Box>

          {/* Preparando */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#3b82f6" }} />
              <Typography sx={{ color: "#3b82f6", fontWeight: 700, fontSize: "0.9rem" }}>
                Preparando ({preparing.length})
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {preparing.map((o) => <OrderCard key={o.id} order={o} onAction={() => advance(o)} updating={updatingId === o.id} />)}
              {preparing.length === 0 && <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.83rem", px: 1 }}>Nenhum</Typography>}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

function OrderCard({ order, onAction, updating }: { order: FoodOrder; onAction: () => void; updating: boolean }) {
  const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
  if (!cfg) return null;
  return (
    <Box sx={{
      backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: "16px", p: 2,
    }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
        <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1rem" }}>Pedido #{order.id}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "rgba(255,255,255,0.45)" }}>
          <AccessTimeRoundedIcon sx={{ fontSize: 14 }} />
          <Typography sx={{ fontSize: "0.75rem" }}>{elapsed(order.created_at)}</Typography>
        </Box>
      </Box>

      {(order.user_name || order.user_cpf) && (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.7, mb: 1.2, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "8px", px: 1, py: 0.7 }}>
          <PersonRoundedIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.4)", mt: "1px", flexShrink: 0 }} />
          <Box>
            {order.user_name && (
              <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.78rem", fontWeight: 600, lineHeight: 1.3 }}>
                {order.user_name}
              </Typography>
            )}
            {order.user_cpf && (
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", lineHeight: 1.3 }}>
                CPF: {order.user_cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {order.delivery_spot && (
        <Chip label={`Vaga: ${order.delivery_spot}`} size="small" sx={{
          backgroundColor: "rgba(255,255,255,0.1)", color: "#fff",
          fontWeight: 600, fontSize: "0.7rem", mb: 1.2,
        }} />
      )}

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 1.2 }} />

      {order.items.map((item) => (
        <Box key={item.id} sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
          <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>
            {item.quantity}× {item.item_name}
          </Typography>
        </Box>
      ))}

      {order.notes && (
        <Typography sx={{ color: "#f59e0b", fontSize: "0.78rem", mt: 1, fontStyle: "italic" }}>
          Obs: {order.notes}
        </Typography>
      )}

      <Button fullWidth onClick={onAction} disabled={updating} sx={{
        mt: 1.5, backgroundColor: cfg.color, color: "#000",
        borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: "0.88rem", py: 1,
        "&:hover": { filter: "brightness(1.1)" },
        "&.Mui-disabled": { backgroundColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.3)" },
      }}>
        {updating ? <CircularProgress size={16} sx={{ color: "#000" }} /> : cfg.actionLabel}
      </Button>
    </Box>
  );
}
