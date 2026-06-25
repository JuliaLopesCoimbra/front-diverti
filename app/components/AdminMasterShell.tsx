"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Box, Typography, IconButton, Drawer, useMediaQuery, useTheme,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Person as PerfilIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Event as EventosIcon,
  Group as UsuariosIcon,
  AccountBalance as FinanceiroIcon,
  Settings as ConfigIcon,
} from "@mui/icons-material";
import NightShelterRoundedIcon from "@mui/icons-material/NightShelterRounded";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

const SIDEBAR_W = 220;

const NAV_ITEMS = [
  { label: "Dashboard",      icon: <DashboardIcon />,            path: "/pages/admin-master/home"          },
  { label: "Eventos",        icon: <EventosIcon />,              path: "/pages/admin-master/eventos"       },
  { label: "Patrocinadores", icon: <UsuariosIcon />,             path: "/pages/admin-master/usuarios"      },
  { label: "Camping",        icon: <NightShelterRoundedIcon />,  path: "/pages/admin/camping"              },
  { label: "Extrato",        icon: <FinanceiroIcon />,           path: "/pages/admin-master/financeiro"    },
  { label: "Configurações",  icon: <ConfigIcon />,               path: "/pages/admin-master/configuracoes" },
  { label: "Perfil",         icon: <PerfilIcon />,               path: "/pages/admin-master/perfil"        },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { userName, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function navigate(path: string) {
    router.push(path);
    onClose?.();
  }

  function handleLogout() {
    logout();
    router.replace("/");
  }

  return (
    <Box
      sx={{
        width: SIDEBAR_W,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundImage: "url(/background/fundo.png)",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 2.5, pt: 3, pb: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Image src="/logo/logo-circuito.png" alt="Circuito Sertanejo" width={110} height={38} style={{ objectFit: "contain" }} priority />
        {onClose && (
          <IconButton onClick={onClose} size="small" sx={{ color: "rgba(255,255,255,0.4)" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Box sx={{ px: 1.5, mb: 1 }}>
        <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", px: 1 }}>
          Menu
        </Typography>
      </Box>

      {/* Nav items */}
      <Box sx={{ flex: 1, px: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path;
          return (
            <Box
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{
                display: "flex", alignItems: "center", gap: 1.5,
                px: 1.5, py: 1.2, borderRadius: 2, cursor: "pointer",
                backgroundColor: active ? "rgba(255,204,1,0.12)" : "transparent",
                color: active ? "#ffcc01" : "rgba(255,255,255,0.55)",
                transition: "all 0.15s ease",
                borderLeft: active ? "3px solid #ffcc01" : "3px solid transparent",
                "&:hover": {
                  backgroundColor: active ? "rgba(255,204,1,0.15)" : "rgba(255,255,255,0.05)",
                  color: active ? "#ffcc01" : "rgba(255,255,255,0.85)",
                },
              }}
            >
              <Box sx={{ display: "flex", fontSize: 20 }}>{item.icon}</Box>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: active ? 700 : 500 }}>
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* User + Sair */}
      <Box sx={{ px: 1.5, pb: 3, pt: 2, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Box
          onClick={() => navigate("/pages/admin-master/perfil")}
          sx={{
            display: "flex", alignItems: "center", gap: 1.5,
            px: 1.5, py: 1, borderRadius: 2, cursor: "pointer", mb: 1,
            "&:hover": { backgroundColor: "rgba(255,255,255,0.04)" },
          }}
        >
          <Box
            sx={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              border: "2px solid rgba(255,204,1,0.4)",
              backgroundColor: "rgba(255,204,1,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Typography sx={{ color: "#ffcc01", fontWeight: 800, fontSize: "0.8rem" }}>
              {mounted ? (userName ?? "A").charAt(0).toUpperCase() : ""}
            </Typography>
          </Box>
          <Box sx={{ overflow: "hidden" }}>
            <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.8rem", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {mounted ? (userName ?? "Admin Master") : ""}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.65rem" }}>Admin Master</Typography>
          </Box>
        </Box>

        <Box
          onClick={handleLogout}
          sx={{
            display: "flex", alignItems: "center", gap: 1.5,
            px: 1.5, py: 1, borderRadius: 2, cursor: "pointer",
            color: "rgba(239,68,68,0.7)",
            transition: "all 0.15s ease",
            "&:hover": { backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" },
          }}
        >
          <LogoutIcon sx={{ fontSize: 20 }} />
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 500 }}>Sair</Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function AdminMasterShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden", ...dashboardBackgroundSx }}>

      {/* Desktop sidebar — fixed, never scrolls */}
      {!isMobile && (
        <Box sx={{ width: SIDEBAR_W, flexShrink: 0, height: "100vh", overflowY: "auto" }}>
          <SidebarContent />
        </Box>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { backgroundColor: "transparent", boxShadow: "none" } }}
        >
          <SidebarContent onClose={() => setDrawerOpen(false)} />
        </Drawer>
      )}

      {/* Main content — scrolls independently */}
      <Box sx={{ flex: 1, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column", minWidth: 0 }}>
        {isMobile && (
          <Box
            sx={{
              position: "sticky", top: 0, zIndex: 50,
              backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 2,
            }}
          >
            <IconButton onClick={() => setDrawerOpen(true)} size="small" sx={{ color: "rgba(255,255,255,0.7)" }}>
              <MenuIcon />
            </IconButton>
            <Image src="/logo/logo-circuito.png" alt="Circuito Sertanejo" width={90} height={32} style={{ objectFit: "contain" }} />
          </Box>
        )}
        {children}
      </Box>
    </Box>
  );
}
