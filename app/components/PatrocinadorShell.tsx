"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Box, Typography, IconButton, Drawer, useMediaQuery, useTheme, Tooltip,
} from "@mui/material";
import {
  Campaign as AdsIcon,
  Receipt as ExtratoIcon,
  Person as PerfilIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  AddCircleOutline as AddIcon,
  HeadsetMic as SuporteIcon,
  Description as DocumentosIcon,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import { useProfilePhoto } from "@/app/hooks/useProfilePhoto";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import { detectBrand, BRAND_DEFAULT_PHOTO } from "@/app/services/campaigns/mockData";

const SIDEBAR_W = 220;

const NAV_ITEMS = [
  { label: "Meus Anúncios", icon: <AdsIcon />,        path: "/pages/patrocinador/home",          disabled: false },
  { label: "Criar Anúncio", icon: <AddIcon />,         path: "/pages/patrocinador/nova-campanha", disabled: false },
  { label: "Extrato",        icon: <ExtratoIcon />,    path: "/pages/patrocinador/extrato",       disabled: false },
  { label: "Documentos",     icon: <DocumentosIcon />, path: "/pages/patrocinador/documentos",    disabled: false },
  { label: "Suporte",        icon: <SuporteIcon />,    path: "",                                  disabled: true  },
  { label: "Perfil",         icon: <PerfilIcon />,     path: "/pages/patrocinador/perfil",        disabled: false },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { userName, logout } = useAuth();
  const brand = detectBrand(userName);
  const { photoUrl } = useProfilePhoto(BRAND_DEFAULT_PHOTO[brand]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  function navigate(path: string) {
    router.push(path);
    onClose?.();
  }

  function handleLogout() {
    logout();
    router.replace("/pages/auth/login");
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
          const active = !item.disabled && pathname === item.path;
          return (
            <Box
              key={item.label}
              onClick={() => !item.disabled && navigate(item.path)}
              sx={{
                display: "flex", alignItems: "center", gap: 1.5,
                px: 1.5, py: 1.2, borderRadius: 2,
                cursor: item.disabled ? "default" : "pointer",
                backgroundColor: active ? "rgba(255,204,1,0.12)" : "transparent",
                color: item.disabled ? "rgba(255,255,255,0.22)" : active ? "#ffcc01" : "rgba(255,255,255,0.55)",
                transition: "all 0.15s ease",
                borderLeft: active ? "3px solid #ffcc01" : "3px solid transparent",
                ...(!item.disabled && {
                  "&:hover": {
                    backgroundColor: active ? "rgba(255,204,1,0.15)" : "rgba(255,255,255,0.05)",
                    color: active ? "#ffcc01" : "rgba(255,255,255,0.85)",
                  },
                }),
              }}
            >
              <Box sx={{ display: "flex", fontSize: 20 }}>{item.icon}</Box>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: active ? 700 : 500, flex: 1 }}>
                {item.label}
              </Typography>
              {item.disabled && (
                <Typography sx={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  em breve
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>

      {/* User + Sair */}
      <Box sx={{ px: 1.5, pb: 3, pt: 2, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Avatar + nome */}
        <Box
          onClick={() => navigate("/pages/patrocinador/perfil")}
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
              overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {mounted && photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Typography sx={{ color: "#ffcc01", fontWeight: 800, fontSize: "0.8rem" }}>
                {mounted ? (userName ?? "P").charAt(0).toUpperCase() : ""}
              </Typography>
            )}
          </Box>
          <Box sx={{ overflow: "hidden" }}>
            <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.8rem", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userName ?? "Patrocinador"}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.65rem" }}>Ver perfil</Typography>
          </Box>
        </Box>

        {/* Sair */}
        <Box
          onClick={handleLogout}
          sx={{
            display: "flex", alignItems: "center", gap: 1.5,
            px: 1.5, py: 1, borderRadius: 2, cursor: "pointer",
            color: "rgba(239,68,68,0.7)",
            "&:hover": { backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" },
            transition: "all 0.15s ease",
          }}
        >
          <LogoutIcon sx={{ fontSize: 20 }} />
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 500 }}>Sair</Typography>
        </Box>
      </Box>
    </Box>
  );
}

interface Props {
  children: React.ReactNode;
}

export default function PatrocinadorShell({ children }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", ...dashboardBackgroundSx }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <Box sx={{ width: SIDEBAR_W, flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
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

      {/* Main content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Mobile top bar */}
        {isMobile && (
          <Box
            sx={{
              position: "sticky", top: 0, zIndex: 50,
              backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              px: 2, py: 1.5,
              display: "flex", alignItems: "center", gap: 2,
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
