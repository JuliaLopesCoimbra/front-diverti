"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import Image from "next/image";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import SoupKitchenRoundedIcon from "@mui/icons-material/SoupKitchenRounded";
import DeliveryDiningRoundedIcon from "@mui/icons-material/DeliveryDiningRounded";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import axios from "axios";
import {
  getOperationRestaurants,
  getOperationRestaurantDetails,
  MenuItem,
  Restaurant,
  RestaurantWithMenu,
} from "@/app/services/food/foodService";
import { getApiUrl } from "@/app/utils/apiUrlHelper";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

const API_URL = getApiUrl();
const ALLOWED_ROLES = ["operador", "admin", "admin_master"];

interface JwtPayload {
  role?: string;
  name?: string;
  sub?: string;
  restaurant_id?: number;
}

function decodeToken(token: string): JwtPayload {
  try {
    const b64 = token.split(".")[1];
    return JSON.parse(atob(b64.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

type Phase = "checking" | "login" | "dashboard";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "#fff",
    borderRadius: "14px",
    transition: "all 0.25s ease",
    "& fieldset": { borderColor: "rgba(255,255,255,0.18)", borderWidth: "1.5px" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.38)" },
    "&.Mui-focused fieldset": { borderColor: "#ffffff", borderWidth: "2px" },
    "&.Mui-focused": { backgroundColor: "rgba(255,255,255,0.09)" },
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 1000px rgba(15,15,15,0.95) inset",
      WebkitTextFillColor: "#fff",
      transition: "background-color 9999s ease-in-out 0s",
    },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)", fontSize: 14 },
  "& .MuiInputLabel-root.Mui-focused": { color: "rgba(255,255,255,0.85)" },
};

function groupByCategory(items: MenuItem[]): Record<string, MenuItem[]> {
  return items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const cat = item.category || "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
}

export default function OperationPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  // Admin view: all restaurants
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);

  // Operador view: single restaurant
  const [myRestaurant, setMyRestaurant] = useState<RestaurantWithMenu | null>(null);
  const [loadingMyRestaurant, setLoadingMyRestaurant] = useState(false);
  const [noRestaurantLinked, setNoRestaurantLinked] = useState(false);

  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const loadAllRestaurants = useCallback(() => {
    setLoadingRestaurants(true);
    getOperationRestaurants()
      .then(setRestaurants)
      .catch(() => {})
      .finally(() => setLoadingRestaurants(false));
  }, []);

  const loadMyRestaurant = useCallback((restaurantId: number) => {
    setLoadingMyRestaurant(true);
    getOperationRestaurantDetails(restaurantId)
      .then(setMyRestaurant)
      .catch(() => {})
      .finally(() => setLoadingMyRestaurant(false));
  }, []);

  const enterDashboard = useCallback(
    (payload: JwtPayload) => {
      setUserName(payload.name || "Operador");
      setUserRole(payload.role || "");
      setPhase("dashboard");

      if (payload.role === "operador") {
        if (payload.restaurant_id) {
          loadMyRestaurant(payload.restaurant_id);
        } else {
          setNoRestaurantLinked(true);
        }
      } else {
        loadAllRestaurants();
      }
    },
    [loadAllRestaurants, loadMyRestaurant]
  );

  useEffect(() => {
    const token = localStorage.getItem("circuito_access_token");
    if (!token) { setPhase("login"); return; }
    const payload = decodeToken(token);
    if (payload.role && ALLOWED_ROLES.includes(payload.role)) {
      enterDashboard(payload);
    } else {
      setPhase("login");
    }
  }, [enterDashboard]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await axios.post<{ access_token: string; refresh_token: string }>(
        `${API_URL}/auth/operation-login`,
        { email, password }
      );
      const { access_token, refresh_token } = res.data;
      const payload = decodeToken(access_token);
      localStorage.setItem("circuito_access_token", access_token);
      document.cookie = `refresh_token=${refresh_token}; path=/; secure`;
      enterDashboard(payload);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setLoginError(e.response?.data?.detail || "Credenciais inválidas.");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("circuito_access_token");
    document.cookie = "refresh_token=; path=/; secure; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setPhase("login");
    setEmail("");
    setPassword("");
    setRestaurants([]);
    setMyRestaurant(null);
    setNoRestaurantLinked(false);
    setUserRole("");
  }

  // ── Checking ─────────────────────────────────────────────────────────────────
  if (phase === "checking") {
    return (
      <Box sx={{ ...dashboardBackgroundSx, minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#fff" }} />
      </Box>
    );
  }

  // ── Login ─────────────────────────────────────────────────────────────────────
  if (phase === "login") {
    return (
      <Box
        sx={{
          ...dashboardBackgroundSx,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          "&::before": {
            content: '""',
            position: "fixed",
            inset: 0,
            background: "linear-gradient(170deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.75) 100%)",
            zIndex: 0,
            pointerEvents: "none",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 420,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
            <Image src="/logo/logo-circuito.png" alt="Diverti" width={160} height={56} style={{ objectFit: "contain" }} priority />
          </Box>

          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{
              backgroundColor: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "24px",
              p: { xs: 3, sm: 4 },
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <Box
                sx={{
                  width: 44, height: 44, borderRadius: "12px",
                  backgroundColor: "rgba(255,204,1,0.12)",
                  border: "1px solid rgba(255,204,1,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                <SoupKitchenRoundedIcon sx={{ fontSize: 24, color: "#ffcc01" }} />
              </Box>
              <Box>
                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem", lineHeight: 1.2 }}>
                  Operação
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
                  Acesso para cozinha e garçons
                </Typography>
              </Box>
            </Box>

            <TextField
              fullWidth label="E-mail" type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email"
              sx={inputSx}
            />
            <TextField
              fullWidth label="Senha"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass((p) => !p)} edge="end" sx={{ color: "rgba(255,255,255,0.45)", "&:hover": { color: "#fff" } }}>
                      {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />

            {loginError && (
              <Box sx={{ backgroundColor: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "10px", px: 1.5, py: 1 }}>
                <Typography sx={{ color: "#f87171", fontSize: "0.82rem" }}>{loginError}</Typography>
              </Box>
            )}

            <Button
              type="submit"
              fullWidth
              disabled={loginLoading}
              sx={{
                mt: 0.5,
                backgroundColor: "#ffcc01",
                color: "#111",
                borderRadius: "14px",
                py: 1.4,
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.97rem",
                letterSpacing: "-0.2px",
                "&:hover": { backgroundColor: "#f5c000" },
                "&.Mui-disabled": { backgroundColor: "rgba(255,204,1,0.25)", color: "rgba(0,0,0,0.35)" },
              }}
            >
              {loginLoading ? <CircularProgress size={20} sx={{ color: "#111" }} /> : "Entrar"}
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────────
  const isAdmin = userRole === "admin" || userRole === "admin_master";

  return (
    <Box
      sx={{
        ...dashboardBackgroundSx,
        minHeight: "100svh",
        "&::before": {
          content: '""',
          position: "fixed",
          inset: 0,
          background: "linear-gradient(170deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.72) 100%)",
          zIndex: 0,
          pointerEvents: "none",
        },
      }}
    >
      <Box sx={{ position: "relative", zIndex: 1, maxWidth: 640, mx: "auto", px: { xs: 2, md: 3 }, pt: { xs: 3, md: 4 }, pb: 6 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            backgroundColor: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            px: 2, py: 1.5,
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Image src="/logo/logo-circuito.png" alt="Diverti" width={100} height={36} style={{ objectFit: "contain" }} />
            <Box sx={{ height: 24, width: "1px", backgroundColor: "rgba(255,255,255,0.12)", display: { xs: "none", sm: "block" } }} />
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem" }}>
                Olá, <Box component="span" sx={{ color: "#fff", fontWeight: 600 }}>{userName}</Box>
              </Typography>
            </Box>
          </Box>
          <Button
            onClick={handleLogout}
            startIcon={<LogoutRoundedIcon sx={{ fontSize: "1rem !important" }} />}
            size="small"
            sx={{
              color: "rgba(255,255,255,0.45)", textTransform: "none",
              fontSize: "0.8rem", borderRadius: "8px",
              "&:hover": { color: "#fff", backgroundColor: "rgba(255,255,255,0.06)" },
            }}
          >
            Sair
          </Button>
        </Box>

        {/* ── Operador view: single restaurant ── */}
        {!isAdmin && (
          <>
            {noRestaurantLinked && (
              <Box sx={{ textAlign: "center", py: 10 }}>
                <RestaurantRoundedIcon sx={{ fontSize: 48, color: "rgba(255,255,255,0.12)", mb: 1 }} />
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.95rem", fontWeight: 600, mb: 0.5 }}>
                  Conta sem restaurante vinculado
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.82rem" }}>
                  Solicite ao administrador vincular sua conta a um restaurante.
                </Typography>
              </Box>
            )}

            {loadingMyRestaurant && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <CircularProgress sx={{ color: "rgba(255,255,255,0.5)" }} />
              </Box>
            )}

            {!loadingMyRestaurant && myRestaurant && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Restaurant card */}
                <Box
                  sx={{
                    backgroundColor: "rgba(0,0,0,0.35)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: "20px",
                    overflow: "hidden",
                  }}
                >
                  {myRestaurant.image_url && (
                    <Box
                      component="img"
                      src={myRestaurant.image_url}
                      alt={myRestaurant.name}
                      sx={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
                    />
                  )}
                  <Box sx={{ p: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                      {!myRestaurant.image_url && (
                        <Box
                          sx={{
                            width: 52, height: 52, borderRadius: "14px", flexShrink: 0,
                            backgroundColor: "rgba(255,204,1,0.1)", border: "1px solid rgba(255,204,1,0.18)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <RestaurantRoundedIcon sx={{ color: "#ffcc01", fontSize: 26 }} />
                        </Box>
                      )}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.2rem", lineHeight: 1.3 }}>
                          {myRestaurant.name}
                        </Typography>
                        {myRestaurant.description && (
                          <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.82rem" }}>
                            {myRestaurant.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Action buttons: Cozinha + Garçom */}
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                      <Button
                        fullWidth
                        onClick={() => router.push(`/pages/kitchen/${myRestaurant.id}`)}
                        startIcon={<SoupKitchenRoundedIcon />}
                        sx={{
                          backgroundColor: "rgba(245,158,11,0.1)",
                          color: "#f59e0b",
                          border: "1px solid rgba(245,158,11,0.25)",
                          borderRadius: "12px",
                          textTransform: "none",
                          fontWeight: 700,
                          py: 1.4,
                          fontSize: "0.88rem",
                          "&:hover": { backgroundColor: "rgba(245,158,11,0.18)", borderColor: "rgba(245,158,11,0.4)" },
                        }}
                      >
                        Cozinha
                      </Button>
                      <Button
                        fullWidth
                        onClick={() => router.push(`/pages/waiter/${myRestaurant.id}?eventId=${myRestaurant.event_id}`)}
                        startIcon={<DeliveryDiningRoundedIcon />}
                        sx={{
                          backgroundColor: "rgba(34,197,94,0.08)",
                          color: "#22c55e",
                          border: "1px solid rgba(34,197,94,0.25)",
                          borderRadius: "12px",
                          textTransform: "none",
                          fontWeight: 700,
                          py: 1.4,
                          fontSize: "0.88rem",
                          "&:hover": { backgroundColor: "rgba(34,197,94,0.16)", borderColor: "rgba(34,197,94,0.4)" },
                        }}
                      >
                        Garçom
                      </Button>
                    </Box>
                  </Box>
                </Box>

                {/* Inline menu */}
                <Box
                  sx={{
                    backgroundColor: "rgba(0,0,0,0.35)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: "20px",
                    p: 2.5,
                  }}
                >
                  <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", mb: 2 }}>
                    Cardápio
                  </Typography>

                  {myRestaurant.menu_items.length === 0 ? (
                    <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem", textAlign: "center", py: 3 }}>
                      Nenhum item no cardápio
                    </Typography>
                  ) : (
                    Object.entries(groupByCategory(myRestaurant.menu_items)).map(([category, items]) => (
                      <Box key={category} sx={{ mb: 2.5 }}>
                        <Typography
                          sx={{
                            color: "rgba(255,255,255,0.3)",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            mb: 1,
                          }}
                        >
                          {category}
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          {items.map((item) => (
                            <Box
                              key={item.id}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                backgroundColor: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: "12px",
                                p: 1.5,
                              }}
                            >
                              {item.image_url && (
                                <Box
                                  component="img"
                                  src={item.image_url}
                                  alt={item.name}
                                  sx={{ width: 44, height: 44, borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                                />
                              )}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>
                                  {item.name}
                                </Typography>
                                {item.description && (
                                  <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }} noWrap>
                                    {item.description}
                                  </Typography>
                                )}
                              </Box>
                              <Typography sx={{ color: "#ffcc01", fontWeight: 700, fontSize: "0.88rem", flexShrink: 0 }}>
                                R$ {item.price.toFixed(2).replace(".", ",")}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </Box>
            )}
          </>
        )}

        {/* ── Admin view: all restaurants ── */}
        {isAdmin && (
          <>
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", mb: 2, px: 0.5 }}>
              Escolha o restaurante
            </Typography>

            {loadingRestaurants ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <CircularProgress sx={{ color: "rgba(255,255,255,0.5)" }} />
              </Box>
            ) : restaurants.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 10 }}>
                <RestaurantRoundedIcon sx={{ fontSize: 48, color: "rgba(255,255,255,0.12)", mb: 1 }} />
                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>
                  Nenhum restaurante ativo no momento
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {restaurants.map((r) => (
                  <Box
                    key={r.id}
                    sx={{
                      backgroundColor: "rgba(0,0,0,0.35)",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      borderRadius: "20px",
                      p: 2.5,
                      transition: "border-color 0.2s",
                      "&:hover": { borderColor: "rgba(255,255,255,0.18)" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                      {r.image_url ? (
                        <Box
                          component="img"
                          src={r.image_url}
                          alt={r.name}
                          sx={{ width: 52, height: 52, borderRadius: "14px", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 52, height: 52, borderRadius: "14px", flexShrink: 0,
                            backgroundColor: "rgba(255,204,1,0.1)", border: "1px solid rgba(255,204,1,0.18)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <RestaurantRoundedIcon sx={{ color: "#ffcc01", fontSize: 26 }} />
                        </Box>
                      )}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem", lineHeight: 1.3 }}>
                          {r.name}
                        </Typography>
                        {r.description && (
                          <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", lineHeight: 1.4 }} noWrap>
                            {r.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                      <Button
                        fullWidth
                        onClick={() => router.push(`/pages/kitchen/${r.id}`)}
                        startIcon={<SoupKitchenRoundedIcon />}
                        sx={{
                          backgroundColor: "rgba(245,158,11,0.1)",
                          color: "#f59e0b",
                          border: "1px solid rgba(245,158,11,0.25)",
                          borderRadius: "12px",
                          textTransform: "none",
                          fontWeight: 700,
                          py: 1.3,
                          fontSize: "0.88rem",
                          "&:hover": { backgroundColor: "rgba(245,158,11,0.18)", borderColor: "rgba(245,158,11,0.4)" },
                        }}
                      >
                        Cozinha
                      </Button>
                      <Button
                        fullWidth
                        onClick={() => router.push(`/pages/waiter/${r.id}?eventId=${r.event_id}`)}
                        startIcon={<DeliveryDiningRoundedIcon />}
                        sx={{
                          backgroundColor: "rgba(34,197,94,0.08)",
                          color: "#22c55e",
                          border: "1px solid rgba(34,197,94,0.25)",
                          borderRadius: "12px",
                          textTransform: "none",
                          fontWeight: 700,
                          py: 1.3,
                          fontSize: "0.88rem",
                          "&:hover": { backgroundColor: "rgba(34,197,94,0.16)", borderColor: "rgba(34,197,94,0.4)" },
                        }}
                      >
                        Garçom
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}
      </Box>

    </Box>
  );
}
