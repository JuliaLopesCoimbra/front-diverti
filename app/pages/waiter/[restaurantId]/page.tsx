"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Chip, CircularProgress, Divider, IconButton, Typography } from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DeliveryDiningRoundedIcon from "@mui/icons-material/DeliveryDiningRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

import { FoodOrder, getWaiterOrders, waiterDeliver } from "@/app/services/food/foodService";
import { getUserCampingAreas, UserCampingArea } from "@/app/services/camping/campingUserService";
import { getPublicEventById } from "@/app/services/events/eventAppService";

const ALLOWED_ROLES = ["operador", "admin", "admin_master"];
function decodeRole(token: string) {
  try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role as string; }
  catch { return ""; }
}

function elapsed(created_at: string): string {
  const diff = Math.floor((Date.now() - new Date(created_at).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}min`;
  return `${Math.floor(m / 60)}h${m % 60}min`;
}

function fmtCpf(cpf: string | null | undefined) {
  if (!cpf) return null;
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// ── Camping map overlay ────────────────────────────────────────────────────────

function CampingMapOverlay({
  open,
  onClose,
  eventId,
  deliverySpots,
}: {
  open: boolean;
  onClose: () => void;
  eventId: number | null;
  deliverySpots: string[];
}) {
  const [areas, setAreas] = useState<UserCampingArea[]>([]);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(false);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const isDragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const lastTouchDist = useRef<number | null>(null);
  const lastTouchMid = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !eventId) return;
    setMapUrl(null);
    setMapLoading(true);
    getUserCampingAreas(eventId).then(setAreas).catch(() => {});
    getPublicEventById(eventId)
      .then((ev) => { setMapUrl(ev.camping_map_url ?? null); setMapLoading(false); })
      .catch(() => { setMapLoading(false); });
  }, [open, eventId]);

  // Reset zoom on open
  useEffect(() => {
    if (open) { setScale(1); setOffset({ x: 0, y: 0 }); }
  }, [open]);

  function clampOffset(x: number, y: number, s: number) {
    const el = containerRef.current;
    if (!el) return { x, y };
    const maxShift = ((s - 1) / s) * 50;
    return {
      x: Math.max(-maxShift, Math.min(maxShift, x)),
      y: Math.max(-maxShift, Math.min(maxShift, y)),
    };
  }

  function zoom(delta: number, cx = 0, cy = 0) {
    setScale((prev) => {
      const next = Math.min(5, Math.max(1, prev + delta));
      setOffset((o) => clampOffset(o.x + cx * (1 / prev - 1 / next), o.y + cy * (1 / prev - 1 / next), next));
      return next;
    });
  }

  // Mouse
  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = dragStart.current.ox + (e.clientX - dragStart.current.mx) / rect.width * 100 / scale;
    const ny = dragStart.current.oy + (e.clientY - dragStart.current.my) / rect.height * 100 / scale;
    setOffset(clampOffset(nx, ny, scale));
  }
  function onMouseUp() { isDragging.current = false; }

  // Touch
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      isDragging.current = false;
      lastTouchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      lastTouchMid.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    } else if (e.touches.length === 1) {
      isDragging.current = true;
      dragStart.current = { mx: e.touches[0].clientX, my: e.touches[0].clientY, ox: offset.x, oy: offset.y };
      lastTouchDist.current = null;
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const delta = (dist - lastTouchDist.current) * 0.015;
      lastTouchDist.current = dist;
      setScale((prev) => Math.min(5, Math.max(1, prev + delta)));
    } else if (e.touches.length === 1 && isDragging.current) {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nx = dragStart.current.ox + (e.touches[0].clientX - dragStart.current.mx) / rect.width * 100 / scale;
      const ny = dragStart.current.oy + (e.touches[0].clientY - dragStart.current.my) / rect.height * 100 / scale;
      setOffset(clampOffset(nx, ny, scale));
    }
  }
  function onTouchEnd() { isDragging.current = false; lastTouchDist.current = null; }

  // Wheel zoom
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width - 0.5) * 100;
    const cy = ((e.clientY - rect.top) / rect.height - 0.5) * 100;
    zoom(e.deltaY < 0 ? 0.3 : -0.3, cx, cy);
  }

  if (!open) return null;

  const pendingSpots = new Set(deliverySpots.map((s) => s.toLowerCase()));

  return (
    <Box
      sx={{
        position: "fixed", inset: 0, zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.92)",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MapRoundedIcon sx={{ color: "#ffcc01", fontSize: 20 }} />
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Mapa do Camping</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Zoom buttons */}
          <IconButton onClick={() => zoom(-0.5)} sx={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", p: 0.6 }}>
            <RemoveRoundedIcon fontSize="small" />
          </IconButton>
          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", minWidth: 36, textAlign: "center" }}>
            {Math.round(scale * 100)}%
          </Typography>
          <IconButton onClick={() => zoom(0.5)} sx={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", p: 0.6 }}>
            <AddRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.6)", ml: 0.5 }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Legend */}
      {pendingSpots.size > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1, borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: "3px", backgroundColor: "#22c55e", flexShrink: 0 }} />
          <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.75rem" }}>
            Vagas com entrega pendente: {[...pendingSpots].join(", ")}
          </Typography>
        </Box>
      )}

      {/* Map container */}
      <Box
        ref={containerRef}
        sx={{ flex: 1, overflow: "hidden", position: "relative", cursor: isDragging.current ? "grabbing" : "grab", userSelect: "none", touchAction: "none" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      >
        {/* Loading / no-map states */}
        {(mapLoading || !mapUrl) && (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
            {mapLoading
              ? <CircularProgress sx={{ color: "rgba(255,255,255,0.4)" }} />
              : <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>Mapa não disponível</Typography>
            }
          </Box>
        )}

        {mapUrl && (
        <Box
          sx={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "100%",
              maxWidth: "100%",
              transformOrigin: "center center",
              transform: `scale(${scale}) translate(${offset.x}%, ${offset.y}%)`,
              transition: isDragging.current ? "none" : "transform 0.15s ease",
            }}
          >
            {/* Map image */}
            <Box
              component="img"
              src={mapUrl}
              alt="Mapa de Camping"
              draggable={false}
              sx={{ width: "100%", display: "block", userSelect: "none", pointerEvents: "none" }}
            />

            {/* Area markers */}
            {areas.map((area) => {
              const x = (area.x_position ?? 0.08) * 100;
              const y = (area.y_position ?? 0.1) * 100;
              const hasPending = pendingSpots.has(area.name.toLowerCase());
              return (
                <Box
                  key={area.id}
                  sx={{
                    position: "absolute",
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: hasPending ? "rgba(34,197,94,0.9)" : "rgba(0,0,0,0.75)",
                    border: hasPending ? "2px solid #22c55e" : "1.5px solid rgba(255,255,255,0.4)",
                    borderRadius: "6px",
                    px: 0.7,
                    py: 0.3,
                    pointerEvents: "none",
                    boxShadow: hasPending ? "0 0 8px rgba(34,197,94,0.6)" : "none",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#fff",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      lineHeight: 1.2,
                    }}
                  >
                    {area.name}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
        )}
      </Box>
    </Box>
  );
}

// ── Waiter page ────────────────────────────────────────────────────────────────

export default function WaiterPage() {
  return (
    <Suspense fallback={<Box sx={{ minHeight: "100vh", backgroundColor: "#0a0a14", display: "flex", alignItems: "center", justifyContent: "center" }}><CircularProgress sx={{ color: "#fff" }} /></Box>}>
      <WaiterPageContent />
    </Suspense>
  );
}

function WaiterPageContent() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = Number(restaurantId);
  const eventId = searchParams.get("eventId") ? Number(searchParams.get("eventId")) : null;

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);

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
    getWaiterOrders(id)
      .then((data) => { setOrders(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 20_000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 10_000);
    return () => clearInterval(t);
  }, []);

  async function deliver(order: FoodOrder) {
    setUpdatingId(order.id);
    try {
      await waiterDeliver(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } catch {
    } finally {
      setUpdatingId(null);
    }
  }

  const deliverySpots = orders.map((o) => o.delivery_spot).filter(Boolean) as string[];

  if (authorized === null) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#0a0a14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#fff" }} />
      </Box>
    );
  }

  return (
    <>
      <CampingMapOverlay
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        eventId={eventId ?? (orders[0]?.event_id ?? null)}
        deliverySpots={deliverySpots}
      />

      <Box sx={{ minHeight: "100vh", backgroundColor: "#0a0a14", p: { xs: 1.5, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={() => router.push("/pages/operation")} sx={{ color: "rgba(255,255,255,0.5)", p: 0.5 }}>
              <ArrowBackRoundedIcon />
            </IconButton>
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.4rem", display: "flex", alignItems: "center", gap: 0.5 }}>
                <DeliveryDiningRoundedIcon sx={{ verticalAlign: "middle", fontSize: 28 }} />
                Garçom
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem" }}>
                Pedidos prontos · atualiza a cada 20s
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={() => setMapOpen(true)}
              startIcon={<MapRoundedIcon />}
              variant="outlined"
              size="small"
              sx={{
                color: "#ffcc01", borderColor: "rgba(255,204,1,0.35)", borderRadius: "10px",
                textTransform: "none", fontWeight: 700, fontSize: "0.8rem",
                "&:hover": { borderColor: "#ffcc01", backgroundColor: "rgba(255,204,1,0.08)" },
              }}
            >
              Mapa
            </Button>
            <Button onClick={load} startIcon={<RefreshRoundedIcon />} sx={{
              color: "rgba(255,255,255,0.55)", textTransform: "none", fontSize: "0.82rem",
              "&:hover": { color: "#fff" },
            }}>
              Atualizar
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#fff" }} />
          </Box>
        ) : orders.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "1rem" }}>
              Nenhum pedido pronto no momento
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3,1fr)" }, gap: 2 }}>
            {orders.map((order) => (
              <Box key={order.id} sx={{
                backgroundColor: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.35)",
                borderRadius: "16px", p: 2,
              }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                  <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1rem" }}>
                    Pedido #{order.id}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "rgba(255,255,255,0.45)" }}>
                    <AccessTimeRoundedIcon sx={{ fontSize: 14 }} />
                    <Typography sx={{ fontSize: "0.75rem" }}>{elapsed(order.created_at)}</Typography>
                  </Box>
                </Box>

                {/* Client info */}
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
                          CPF: {fmtCpf(order.user_cpf)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}

                {order.delivery_spot ? (
                  <Chip label={`Vaga: ${order.delivery_spot}`} size="small" sx={{
                    backgroundColor: "rgba(34,197,94,0.15)", color: "#22c55e",
                    fontWeight: 700, fontSize: "0.72rem", mb: 1.2,
                    border: "1px solid rgba(34,197,94,0.35)",
                  }} />
                ) : (
                  <Chip label="Sem vaga informada" size="small" sx={{
                    backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)",
                    fontSize: "0.7rem", mb: 1.2,
                  }} />
                )}

                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 1.2 }} />

                {order.items.map((item) => (
                  <Typography key={item.id} sx={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem", mb: 0.6 }}>
                    {item.quantity}× {item.item_name}
                  </Typography>
                ))}

                {order.notes && (
                  <Typography sx={{ color: "#f59e0b", fontSize: "0.78rem", mt: 0.8, fontStyle: "italic" }}>
                    Obs: {order.notes}
                  </Typography>
                )}

                <Button fullWidth onClick={() => deliver(order)} disabled={updatingId === order.id} sx={{
                  mt: 1.5, backgroundColor: "#22c55e", color: "#000",
                  borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: "0.88rem", py: 1,
                  "&:hover": { backgroundColor: "#16a34a" },
                  "&.Mui-disabled": { backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.3)" },
                }}>
                  {updatingId === order.id ? <CircularProgress size={16} sx={{ color: "#000" }} /> : "Marcar como entregue ✓"}
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </>
  );
}
