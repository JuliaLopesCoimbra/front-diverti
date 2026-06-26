"use client";

import { useEffect, useState } from "react";
import {
  Box, Button, Chip, CircularProgress, Divider,
  IconButton, TextField, Typography,
} from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";

import {
  FoodOrder as FoodOrderType,
  MenuItem,
  Restaurant,
  createFoodOrder,
  getMenuItems,
  getMyFoodOrders,
  getUserRestaurants,
} from "@/app/services/food/foodService";

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

type Stage = "restaurants" | "menu" | "cart" | "payment" | "success" | "myorders";

interface Props {
  eventId: number;
  deliverySpot?: string;
  hasCampingBooking?: boolean;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "Aguardando cozinha", color: "#f59e0b" },
  preparing: { label: "Preparando", color: "#3b82f6" },
  ready: { label: "Pronto para entrega", color: "#22c55e" },
  delivered: { label: "Entregue", color: "rgba(255,255,255,0.35)" },
  cancelled: { label: "Cancelado", color: "#ef4444" },
};

export default function FoodOrder({ eventId, deliverySpot = "", hasCampingBooking = false }: Props) {
  const [stage, setStage] = useState<Stage>("restaurants");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [spot, setSpot] = useState(deliverySpot);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card" | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [lastOrder, setLastOrder] = useState<FoodOrderType | null>(null);
  const [myOrders, setMyOrders] = useState<FoodOrderType[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeOrders, setActiveOrders] = useState<FoodOrderType[]>([]);

  const ACTIVE_STATUSES = ["pending", "preparing", "ready"];

  useEffect(() => {
    setLoading(true);
    getUserRestaurants(eventId)
      .then((data) => { setRestaurants(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [eventId]);

  useEffect(() => {
    getMyFoodOrders()
      .then((orders) => setActiveOrders(orders.filter((o) => ACTIVE_STATUSES.includes(o.status))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSpot(deliverySpot);
  }, [deliverySpot]);

  function openRestaurant(r: Restaurant) {
    setSelectedRestaurant(r);
    setCart([]);
    setMenuLoading(true);
    setStage("menu");
    getMenuItems(r.id)
      .then((data) => { setMenuItems(data); setMenuLoading(false); })
      .catch(() => { setMenuLoading(false); });
  }

  function changeQty(item: MenuItem, delta: number) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (!existing) {
        if (delta > 0) return [...prev, { menuItem: item, quantity: 1 }];
        return prev;
      }
      const next = existing.quantity + delta;
      if (next <= 0) return prev.filter((c) => c.menuItem.id !== item.id);
      return prev.map((c) => c.menuItem.id === item.id ? { ...c, quantity: next } : c);
    });
  }

  function cartCount(itemId: number) {
    return cart.find((c) => c.menuItem.id === itemId)?.quantity ?? 0;
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);
  const cartItems = cart.reduce((sum, c) => sum + c.quantity, 0);

  async function handleCheckout() {
    if (!selectedRestaurant || cart.length === 0) return;
    setLoading(true);
    try {
      const order = await createFoodOrder({
        restaurant_id: selectedRestaurant.id,
        event_id: eventId,
        delivery_spot: spot || undefined,
        notes: notes || undefined,
        items: cart.map((c) => ({ menu_item_id: c.menuItem.id, quantity: c.quantity })),
      });
      setLastOrder(order);
      setCart([]);
      setNotes("");
      setStage("success");
    } catch {
      // keep on cart, user sees error via toast (not implemented here)
    } finally {
      setLoading(false);
    }
  }

  function openMyOrders() {
    setStage("myorders");
    setOrdersLoading(true);
    getMyFoodOrders()
      .then((data) => { setMyOrders([...data].sort((a, b) => b.created_at.localeCompare(a.created_at))); setOrdersLoading(false); })
      .catch(() => { setOrdersLoading(false); });
  }

  // ── Grouped menu by category ──────────────────────────────────────────────
  const grouped = menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const cat = item.category ?? "Geral";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  // ── Gate: sem reserva de camping ─────────────────────────────────────────

  if (!hasCampingBooking) {
    return (
      <Box sx={{ px: 2, py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5, textAlign: "center" }}>
        <Box sx={{
          width: 72, height: 72, borderRadius: "50%",
          backgroundColor: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <RestaurantRoundedIcon sx={{ fontSize: 34, color: "rgba(255,255,255,0.25)" }} />
        </Box>
        <Box>
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem", mb: 0.8 }}>
            Acesso restrito
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", lineHeight: 1.6, maxWidth: 300 }}>
            O serviço de delivery é exclusivo para quem possui uma reserva de camping ativa.
            As entregas são feitas diretamente na sua vaga.
          </Typography>
        </Box>
        <Box sx={{
          mt: 1, px: 2.5, py: 1.5,
          backgroundColor: "rgba(255,204,1,0.07)",
          border: "1px solid rgba(255,204,1,0.18)",
          borderRadius: "14px", maxWidth: 300,
        }}>
          <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", lineHeight: 1.55 }}>
            Reserve seu passaporte de camping na aba{" "}
            <Box component="span" sx={{ color: "#ffcc01", fontWeight: 700 }}>Camping</Box>{" "}
            para ter acesso ao cardápio.
          </Typography>
        </Box>
      </Box>
    );
  }

  // ── Stages ────────────────────────────────────────────────────────────────

  if (stage === "restaurants") {
    return (
      <Box sx={{ pb: 10 }}>
        <Box sx={{ px: 2, pt: 2, pb: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>Restaurantes</Typography>
          <Button onClick={openMyOrders} size="small" sx={{
            color: "rgba(255,255,255,0.55)", textTransform: "none", fontSize: "0.8rem",
            "&:hover": { color: "#fff" },
          }}>
            Meus pedidos
          </Button>
        </Box>

        {spot && (
          <Box sx={{
            mx: 2, mb: 2,
            px: 2, py: 1.2,
            backgroundColor: "rgba(255,204,1,0.07)",
            border: "1px solid rgba(255,204,1,0.22)",
            borderRadius: "12px",
            display: "flex", alignItems: "center", gap: 1.2,
          }}>
            <Typography sx={{ fontSize: "1rem", lineHeight: 1 }}>🏕️</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", lineHeight: 1.4 }}>
              Pedido será entregue na sua vaga{" "}
              <Box component="span" sx={{ color: "#ffcc01", fontWeight: 800 }}>{spot}</Box>
            </Typography>
          </Box>
        )}

        {/* Active orders banner */}
        {activeOrders.length > 0 && (
          <Box sx={{ px: 2, mb: 2.5 }}>
            {activeOrders.map((order) => {
              const s = STATUS_LABEL[order.status] ?? { label: order.status, color: "#fff" };
              const isPulsing = order.status === "ready";
              return (
                <Box
                  key={order.id}
                  onClick={openMyOrders}
                  sx={{
                    cursor: "pointer",
                    borderRadius: "18px",
                    border: `1.5px solid ${s.color}55`,
                    backgroundColor: `${s.color}12`,
                    p: 2,
                    mb: 1.5,
                    transition: "border-color 0.2s",
                    "&:hover": { borderColor: `${s.color}99` },
                  }}
                >
                  {/* Status row */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{
                        width: 8, height: 8, borderRadius: "50%",
                        backgroundColor: s.color,
                        ...(isPulsing && {
                          "@keyframes pulse": {
                            "0%, 100%": { opacity: 1, transform: "scale(1)" },
                            "50%": { opacity: 0.5, transform: "scale(1.4)" },
                          },
                          animation: "pulse 1.2s ease-in-out infinite",
                        }),
                      }} />
                      <Typography sx={{ color: s.color, fontWeight: 700, fontSize: "0.82rem" }}>
                        {s.label}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <AccessTimeRoundedIcon sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }} />
                      <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem" }}>
                        Pedido #{order.id}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Restaurant + items */}
                  <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", mb: 0.5 }}>
                    {order.restaurant_name}
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.78rem" }} noWrap>
                    {order.items.map((i) => `${i.quantity}× ${i.item_name}`).join("  ·  ")}
                  </Typography>

                  {/* Total + CTA */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1.5 }}>
                    <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1rem" }}>
                      {fmt(Number(order.total))}
                    </Typography>
                    <Typography sx={{ color: s.color, fontSize: "0.78rem", fontWeight: 600 }}>
                      Ver detalhes →
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#fff" }} />
          </Box>
        ) : restaurants.length === 0 ? (
          <Box sx={{ px: 2, py: 6, textAlign: "center" }}>
            <RestaurantRoundedIcon sx={{ fontSize: 48, color: "rgba(255,255,255,0.15)", mb: 1.5 }} />
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.9rem" }}>
              Nenhum restaurante disponível no momento
            </Typography>
          </Box>
        ) : (
          <Box sx={{ px: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {restaurants.map((r) => (
              <Box key={r.id} onClick={() => openRestaurant(r)} sx={{
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.04)",
                overflow: "hidden",
                cursor: "pointer",
                transition: "border-color 0.15s",
                "&:hover": { borderColor: "rgba(255,255,255,0.25)" },
              }}>
                {r.image_url && (
                  <Box component="img" src={r.image_url} alt={r.name}
                    sx={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
                )}
                <Box sx={{ p: 1.8 }}>
                  <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>{r.name}</Typography>
                  {r.description && (
                    <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", mt: 0.4 }}>
                      {r.description}
                    </Typography>
                  )}
                  <Box sx={{ mt: 1.2 }}>
                    <Chip label="Ver cardápio →" size="small" sx={{
                      backgroundColor: "rgba(255,204,1,0.15)", color: "#ffcc01",
                      fontWeight: 700, fontSize: "0.72rem", border: "1px solid rgba(255,204,1,0.25)",
                    }} />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  if (stage === "menu") {
    return (
      <Box sx={{ pb: 10 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <Box onClick={() => setStage("restaurants")} sx={{ cursor: "pointer", color: "rgba(255,255,255,0.55)", display: "flex" }}>
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem", flex: 1 }}>
            {selectedRestaurant?.name}
          </Typography>
          {spot && (
            <Box sx={{
              display: "flex", alignItems: "center", gap: 0.6,
              backgroundColor: "rgba(255,204,1,0.1)",
              border: "1px solid rgba(255,204,1,0.2)",
              borderRadius: "20px", px: 1.2, py: 0.4,
            }}>
              <Typography sx={{ fontSize: "0.72rem", lineHeight: 1 }}>🏕️</Typography>
              <Typography sx={{ color: "#ffcc01", fontWeight: 700, fontSize: "0.72rem" }}>
                Vaga {spot}
              </Typography>
            </Box>
          )}
        </Box>

        {cartItems > 0 && (
          <Box sx={{
            position: "sticky", top: 0, zIndex: 100,
            px: 2, py: 1.2,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            backgroundColor: "rgba(0,0,0,0.35)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}>
            <Button fullWidth onClick={() => setStage("cart")} sx={{
              backgroundColor: "#fff", color: "#111", borderRadius: "12px",
              textTransform: "none", fontWeight: 700, fontSize: "0.9rem", py: 1.1,
              display: "flex", justifyContent: "space-between", px: 2,
              "&:hover": { backgroundColor: "#efefef" },
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ShoppingCartRoundedIcon sx={{ fontSize: 17 }} />
                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                  {cartItems} {cartItems === 1 ? "item" : "itens"}
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Continuar →</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: "0.9rem" }}>{fmt(cartTotal)}</Typography>
            </Button>
          </Box>
        )}

        {menuLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#fff" }} />
          </Box>
        ) : (
          <Box sx={{ px: 2 }}>
            {Object.entries(grouped).map(([cat, items]) => (
              <Box key={cat} sx={{ mt: 2.5 }}>
                <Typography sx={{
                  color: "rgba(255,255,255,0.35)", fontSize: "0.65rem", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.1em", mb: 1.2,
                }}>
                  {cat}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {items.map((item) => {
                    const qty = cartCount(item.id);
                    return (
                      <Box key={item.id} sx={{
                        display: "flex", alignItems: "center", gap: 1.5,
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: qty > 0 ? "1px solid rgba(255,204,1,0.35)" : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "14px", p: 1.4,
                        transition: "border-color 0.15s",
                      }}>
                        {item.image_url && (
                          <Box component="img" src={item.image_url} alt={item.name}
                            sx={{ width: 60, height: 60, borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>{item.name}</Typography>
                          {item.description && (
                            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.73rem", mt: 0.3 }} noWrap>
                              {item.description}
                            </Typography>
                          )}
                          <Typography sx={{ color: "#ffcc01", fontWeight: 800, fontSize: "0.9rem", mt: 0.5 }}>
                            {fmt(item.price)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexShrink: 0 }}>
                          {qty > 0 && (
                            <>
                              <IconButton onClick={() => changeQty(item, -1)} size="small" sx={{
                                width: 28, height: 28, backgroundColor: "rgba(255,255,255,0.1)",
                                color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.18)" },
                              }}>
                                <RemoveRoundedIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                              <Typography sx={{ color: "#fff", fontWeight: 800, minWidth: 16, textAlign: "center", fontSize: "0.9rem" }}>
                                {qty}
                              </Typography>
                            </>
                          )}
                          <IconButton onClick={() => changeQty(item, 1)} size="small" sx={{
                            width: 28, height: 28,
                            backgroundColor: qty > 0 ? "#ffcc01" : "rgba(255,255,255,0.1)",
                            color: qty > 0 ? "#111" : "#fff",
                            "&:hover": { backgroundColor: qty > 0 ? "#e6b800" : "rgba(255,255,255,0.18)" },
                          }}>
                            <AddRoundedIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Box>
        )}

      </Box>
    );
  }

  if (stage === "cart") {
    return (
      <Box sx={{ pb: 12 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <Box onClick={() => setStage("menu")} sx={{ cursor: "pointer", color: "rgba(255,255,255,0.55)", display: "flex" }}>
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Seu pedido</Typography>
        </Box>

        <Box sx={{ px: 2, pt: 2 }}>
          <Box sx={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", p: 2.5, mb: 2 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", mb: 2 }}>
              Itens
            </Typography>
            {cart.map((c) => (
              <Box key={c.menuItem.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                    <IconButton onClick={() => changeQty(c.menuItem, -1)} size="small" sx={{ width: 24, height: 24, backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" }}>
                      <RemoveRoundedIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                    <Typography sx={{ color: "#fff", fontWeight: 700, minWidth: 18, textAlign: "center", fontSize: "0.85rem" }}>
                      {c.quantity}
                    </Typography>
                    <IconButton onClick={() => changeQty(c.menuItem, 1)} size="small" sx={{ width: 24, height: 24, backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" }}>
                      <AddRoundedIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Box>
                  <Typography sx={{ color: "#fff", fontSize: "0.85rem", fontWeight: 600 }}>{c.menuItem.name}</Typography>
                </Box>
                <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", fontWeight: 600 }}>
                  {fmt(c.menuItem.price * c.quantity)}
                </Typography>
              </Box>
            ))}
            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 1.5 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Total</Typography>
              <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.2rem" }}>{fmt(cartTotal)}</Typography>
            </Box>
          </Box>

          <Box sx={{
            mb: 1.5, px: 2, py: 1.4,
            backgroundColor: "rgba(255,204,1,0.07)",
            border: "1px solid rgba(255,204,1,0.22)",
            borderRadius: "12px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1,
          }}>
            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.78rem" }}>Entrega na vaga</Typography>
            <Typography sx={{ color: "#ffcc01", fontWeight: 800, fontSize: "0.9rem" }}>{spot || "—"}</Typography>
          </Box>
          <TextField
            fullWidth
            label="Observações (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline rows={2}
            placeholder="Sem cebola, sem molho..."
            sx={{
              mb: 2.5,
              "& .MuiOutlinedInput-root": { borderRadius: "12px", color: "#fff", "& fieldset": { borderColor: "rgba(255,255,255,0.15)" }, "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" }, "&.Mui-focused fieldset": { borderColor: "#ffcc01" } },
              "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.45)" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#ffcc01" },
            }}
          />

          <Button fullWidth onClick={() => { setPaymentMethod(null); setStage("payment"); }} sx={{
            backgroundColor: "#fff", color: "#111", borderRadius: "14px",
            textTransform: "none", fontWeight: 700, fontSize: "0.95rem", py: 1.4,
            "&:hover": { backgroundColor: "#efefef" },
          }}>
            Ir para pagamento →
          </Button>
        </Box>
      </Box>
    );
  }

  // ── Payment stage ─────────────────────────────────────────────────────────

  const MOCK_PIX_KEY = "pagamento@diverti.com.br";
  const MOCK_PIX_CODE = `00020126580014BR.GOV.BCB.PIX0136a1f2c3d4-e5f6-7890-abcd-ef12345678905204000053039865406${String(Math.round(cartTotal * 100)).padStart(6, "0")}5802BR5925DIVERTI EVENTOS LTDA6009SAO PAULO62070503***6304CAFE`;

  if (stage === "payment" && paymentMethod === "pix") {
    return (
      <Box sx={{ px: 2, pb: 12, pt: 2.5, maxWidth: 560, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Box onClick={() => setPaymentMethod(null)} sx={{ cursor: "pointer", color: "rgba(255,255,255,0.55)", display: "flex" }}>
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>Pagar via PIX</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>Escaneie ou copie o código</Typography>
          </Box>
        </Box>

        <Box sx={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", p: 3, mb: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Box sx={{ backgroundColor: "#fff", borderRadius: "16px", p: 2 }}>
            <Box component="canvas" ref={(el: HTMLCanvasElement | null) => {
              if (!el) return;
              const size = 180;
              el.width = size; el.height = size;
              const ctx = el.getContext("2d");
              if (!ctx) return;
              ctx.fillStyle = "#fff";
              ctx.fillRect(0, 0, size, size);
              ctx.fillStyle = "#111";
              const cells = 21;
              const cell = size / cells;
              const seed = MOCK_PIX_CODE.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
              for (let r = 0; r < cells; r++) {
                for (let c2 = 0; c2 < cells; c2++) {
                  const edge = r < 2 || r > cells - 3 || c2 < 2 || c2 > cells - 3;
                  const corner = (r < 7 && c2 < 7) || (r < 7 && c2 > cells - 8) || (r > cells - 8 && c2 < 7);
                  if (corner || (!edge && ((seed * (r + 1) * (c2 + 1) * 2654435761) >>> 0) % 2 === 0)) {
                    ctx.fillRect(Math.round(c2 * cell), Math.round(r * cell), Math.round(cell), Math.round(cell));
                  }
                }
              }
            }} sx={{ display: "block", width: 180, height: 180 }} />
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", mb: 0.3 }}>Chave PIX</Typography>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{MOCK_PIX_KEY}</Typography>
          </Box>

          <Box sx={{ width: "100%" }}>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", mb: 1, textAlign: "center" }}>Código copia e cola</Typography>
            <Box sx={{ backgroundColor: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", p: 1.5, wordBreak: "break-all" }}>
              <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.62rem", fontFamily: "monospace", lineHeight: 1.6 }}>
                {MOCK_PIX_CODE}
              </Typography>
            </Box>
            <Button fullWidth onClick={() => {
              navigator.clipboard?.writeText(MOCK_PIX_CODE).catch(() => {});
              setPixCopied(true);
              setTimeout(() => setPixCopied(false), 2500);
            }} sx={{
              mt: 1.5,
              backgroundColor: pixCopied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.08)",
              border: `1px solid ${pixCopied ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.15)"}`,
              color: pixCopied ? "#22c55e" : "#fff",
              borderRadius: "12px", textTransform: "none", fontWeight: 700, py: 1.1,
              "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
            }}>
              {pixCopied ? "✓ Código copiado!" : "Copiar código PIX"}
            </Button>
          </Box>

          <Box sx={{ backgroundColor: "rgba(255,204,1,0.07)", border: "1px solid rgba(255,204,1,0.15)", borderRadius: "10px", px: 2, py: 1, width: "100%" }}>
            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.73rem", textAlign: "center" }}>
              Válido por <Box component="span" sx={{ color: "#ffcc01", fontWeight: 700 }}>30 minutos</Box> · aprovação automática após pagamento
            </Typography>
          </Box>
        </Box>

        <Button fullWidth onClick={handleCheckout} disabled={loading} sx={{
          backgroundColor: "#32BCAD", color: "#fff", borderRadius: "14px",
          textTransform: "none", fontWeight: 700, fontSize: "0.95rem", py: 1.4,
          "&:hover": { backgroundColor: "#28a89a" },
          "&.Mui-disabled": { backgroundColor: "rgba(50,188,173,0.3)", color: "rgba(255,255,255,0.5)" },
        }}>
          {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Já paguei — confirmar pedido"}
        </Button>
      </Box>
    );
  }

  if (stage === "payment" && paymentMethod === "credit_card") {
    return (
      <Box sx={{ px: 2, pb: 12, pt: 2.5, maxWidth: 560, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Box onClick={() => setPaymentMethod(null)} sx={{ cursor: "pointer", color: "rgba(255,255,255,0.55)", display: "flex" }}>
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>Cartão de crédito</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>Cartão salvo na conta</Typography>
          </Box>
        </Box>

        <Box sx={{
          position: "relative", borderRadius: "20px", p: 3, mb: 2.5,
          background: "linear-gradient(135deg, #1a1a3e 0%, #2d2d6b 50%, #1a1a3e 100%)",
          border: "1px solid rgba(255,255,255,0.15)", overflow: "hidden", minHeight: 180,
        }}>
          <Box sx={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.04)" }} />
          <Box sx={{ position: "absolute", bottom: -50, left: -20, width: 160, height: 160, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.03)" }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, position: "relative" }}>
            <Box sx={{ width: 36, height: 28, borderRadius: "5px", backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography sx={{ color: "#fff", fontSize: "0.55rem", fontWeight: 900, letterSpacing: "0.05em" }}>CHIP</Typography>
            </Box>
            <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.4rem", fontStyle: "italic", letterSpacing: "-0.03em", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>VISA</Typography>
          </Box>
          <Typography sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: "1.1rem", letterSpacing: "0.22em", mb: 2.5, fontFamily: "monospace", position: "relative" }}>
            ••••  ••••  ••••  4242
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative" }}>
            <Box>
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.1em", mb: 0.2 }}>Titular</Typography>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.08em" }}>NOME DO TITULAR</Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.1em", mb: 0.2 }}>Validade</Typography>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.82rem" }}>12/28</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", textDecoration: "underline", cursor: "not-allowed" }}>Trocar cartão</Typography>
        </Box>

        <Box sx={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", p: 2.5, mb: 2.5 }}>
          {cart.map((c) => (
            <Box key={c.menuItem.id} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.83rem" }}>{c.quantity}× {c.menuItem.name}</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.83rem" }}>{fmt(c.menuItem.price * c.quantity)}</Typography>
            </Box>
          ))}
          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 1.5 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography sx={{ color: "#fff", fontWeight: 700 }}>Total</Typography>
            <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.2rem" }}>{fmt(cartTotal)}</Typography>
          </Box>
        </Box>

        <Button fullWidth onClick={handleCheckout} disabled={loading} sx={{
          backgroundColor: "#fff", color: "#111", borderRadius: "14px",
          textTransform: "none", fontWeight: 700, fontSize: "0.95rem", py: 1.4,
          "&:hover": { backgroundColor: "#efefef" },
          "&.Mui-disabled": { backgroundColor: "rgba(255,255,255,0.2)", color: "rgba(0,0,0,0.3)" },
        }}>
          {loading ? <CircularProgress size={20} sx={{ color: "#111" }} /> : `Pagar ${fmt(cartTotal)}`}
        </Button>
      </Box>
    );
  }

  if (stage === "payment") {
    return (
      <Box sx={{ px: 2, pb: 12, pt: 2.5, maxWidth: 560, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Box onClick={() => setStage("cart")} sx={{ cursor: "pointer", color: "rgba(255,255,255,0.55)", display: "flex" }}>
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>Forma de pagamento</Typography>
        </Box>

        <Box sx={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", p: 2.5, mb: 2.5 }}>
          {cart.map((c) => (
            <Box key={c.menuItem.id} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.83rem" }}>{c.quantity}× {c.menuItem.name}</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.83rem" }}>{fmt(c.menuItem.price * c.quantity)}</Typography>
            </Box>
          ))}
          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 1.5 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography sx={{ color: "#fff", fontWeight: 700 }}>Total</Typography>
            <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.2rem" }}>{fmt(cartTotal)}</Typography>
          </Box>
        </Box>

        <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", mb: 1.5 }}>
          Escolha como pagar
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box onClick={() => setPaymentMethod("credit_card")} sx={{
            backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px", p: 2, cursor: "pointer", display: "flex", alignItems: "center", gap: 2,
            transition: "all 0.2s ease",
            "&:active": { transform: "scale(0.98)" },
            "&:hover": { backgroundColor: "rgba(255,255,255,0.09)", borderColor: "rgba(255,255,255,0.2)" },
          }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: "12px", flexShrink: 0,
              background: "linear-gradient(135deg, #1a1a3e, #2d2d6b)",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Typography sx={{ color: "#fff", fontSize: "1.4rem", lineHeight: 1 }}>💳</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.92rem" }}>Cartão de crédito</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>Visa ••••4242 · Cartão salvo</Typography>
            </Box>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22c55e", flexShrink: 0 }} />
          </Box>

          <Box onClick={() => setPaymentMethod("pix")} sx={{
            backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px", p: 2, cursor: "pointer", display: "flex", alignItems: "center", gap: 2,
            transition: "all 0.2s ease",
            "&:active": { transform: "scale(0.98)" },
            "&:hover": { backgroundColor: "rgba(255,255,255,0.09)", borderColor: "rgba(255,255,255,0.2)" },
          }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: "12px", flexShrink: 0,
              backgroundColor: "rgba(50,188,173,0.12)", border: "1px solid rgba(50,188,173,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Box component="svg" viewBox="0 0 512 512" sx={{ width: 26, height: 26 }}>
                <path d="M112.57 391.19a73 73 0 0 0 51.82 21.46h.14a73 73 0 0 0 51.75-21.46l84.91-84.92a11.08 11.08 0 0 1 15.63 0l85.25 85.25a73 73 0 0 0 51.82 21.46h.14A73 73 0 0 0 505 391.52l-119.74-120a11.08 11.08 0 0 1 0-15.63L505 135.86a73.27 73.27 0 0 0-51.82-21.47h-.14a73.27 73.27 0 0 0-51.75 21.47L316 221.14a11.08 11.08 0 0 1-15.63 0l-84.91-84.92a73.27 73.27 0 0 0-51.82-21.47h-.14a73.27 73.27 0 0 0-51.82 21.47L7 255.88l-.15.15 105.72 135.16z" fill="#32BCAD"/>
                <path d="M112.43 135.86a73.27 73.27 0 0 1 51.82-21.47h.14a73.27 73.27 0 0 1 51.82 21.47l84.91 84.92a11.08 11.08 0 0 0 15.63 0l85.11-85.25a73.27 73.27 0 0 1 51.75-21.47h.14a73.27 73.27 0 0 1 51.82 21.47L391 255.88l-.15.15L505 391.52a73 73 0 0 1-51.82 21.46h-.14a73 73 0 0 1-51.82-21.46l-85.11-85.25a11.08 11.08 0 0 0-15.63 0l-84.91 84.92a73 73 0 0 1-51.75 21.46h-.14a73 73 0 0 1-51.82-21.46L7 255.88z" fill="#32BCAD" opacity=".5"/>
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.92rem" }}>PIX</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>Pagamento instantâneo · aprovação imediata</Typography>
            </Box>
            <Box sx={{ backgroundColor: "rgba(50,188,173,0.15)", border: "1px solid rgba(50,188,173,0.3)", borderRadius: "8px", px: 1, py: 0.3 }}>
              <Typography sx={{ color: "#32BCAD", fontSize: "0.62rem", fontWeight: 700 }}>Instantâneo</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  if (stage === "success") {
    return (
      <Box sx={{ px: 2, pb: 12, pt: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <Box sx={{
          width: 80, height: 80, borderRadius: "50%", backgroundColor: "#22c55e",
          display: "flex", alignItems: "center", justifyContent: "center",
          "@keyframes popIn": { "0%": { transform: "scale(0)", opacity: 0 }, "70%": { transform: "scale(1.18)" }, "100%": { transform: "scale(1)", opacity: 1 } },
          animation: "popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards",
          boxShadow: "0 0 0 16px rgba(34,197,94,0.12), 0 0 0 32px rgba(34,197,94,0.06)",
        }}>
          <CheckCircleRoundedIcon sx={{ color: "#fff", fontSize: 40 }} />
        </Box>

        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.4rem", mb: 0.5 }}>Pedido confirmado!</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
            Pedido #{lastOrder?.id} · {lastOrder?.restaurant_name}
          </Typography>
        </Box>

        {lastOrder && (
          <Box sx={{ width: "100%", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", p: 2.5 }}>
            {lastOrder.items.map((item) => (
              <Box key={item.id} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.83rem" }}>
                  {item.quantity}× {item.item_name}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.83rem" }}>{fmt(Number(item.subtotal))}</Typography>
              </Box>
            ))}
            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 1.5 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ color: "#fff", fontWeight: 700 }}>Total</Typography>
              <Typography sx={{ color: "#22c55e", fontWeight: 900, fontSize: "1.1rem" }}>{fmt(Number(lastOrder.total))}</Typography>
            </Box>
            {lastOrder.delivery_spot && (
              <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", mt: 1.5 }}>
                Entrega em: <Box component="span" sx={{ color: "#fff", fontWeight: 600 }}>{lastOrder.delivery_spot}</Box>
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ width: "100%", display: "flex", gap: 1.5 }}>
          <Button fullWidth onClick={openMyOrders} sx={{
            border: "1px solid rgba(255,255,255,0.15)", color: "#fff",
            borderRadius: "12px", textTransform: "none", fontWeight: 600, py: 1.2,
          }}>
            Meus pedidos
          </Button>
          <Button fullWidth onClick={() => setStage("restaurants")} sx={{
            backgroundColor: "rgba(255,255,255,0.08)", color: "#fff",
            borderRadius: "12px", textTransform: "none", fontWeight: 600, py: 1.2,
          }}>
            Fazer novo pedido
          </Button>
        </Box>
      </Box>
    );
  }

  if (stage === "myorders") {
    return (
      <Box sx={{ pb: 10 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <Box onClick={() => setStage("restaurants")} sx={{ cursor: "pointer", color: "rgba(255,255,255,0.55)", display: "flex" }}>
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Meus pedidos</Typography>
        </Box>

        {ordersLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#fff" }} />
          </Box>
        ) : myOrders.length === 0 ? (
          <Box sx={{ px: 2, py: 6, textAlign: "center" }}>
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.9rem" }}>Nenhum pedido ainda</Typography>
          </Box>
        ) : (
          <Box sx={{ px: 2, pt: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {myOrders.map((order) => {
              const statusInfo = STATUS_LABEL[order.status] ?? { label: order.status, color: "#fff" };
              return (
                <Box key={order.id} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "16px", p: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem" }}>
                      #{order.id} · {order.restaurant_name}
                    </Typography>
                    <Chip label={statusInfo.label} size="small" sx={{
                      backgroundColor: `${statusInfo.color}22`, color: statusInfo.color,
                      fontWeight: 700, fontSize: "0.68rem", border: `1px solid ${statusInfo.color}44`,
                    }} />
                  </Box>
                  {order.items.map((item) => (
                    <Typography key={item.id} sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem" }}>
                      {item.quantity}× {item.item_name}
                    </Typography>
                  ))}
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.2 }}>
                    {order.delivery_spot && (
                      <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.73rem" }}>
                        Vaga: {order.delivery_spot}
                      </Typography>
                    )}
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem", ml: "auto" }}>
                      {fmt(Number(order.total))}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    );
  }

  return null;
}
