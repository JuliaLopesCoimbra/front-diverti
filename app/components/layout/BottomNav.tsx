"use client";

import { Box, IconButton } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const LAST_PATH_KEY = "bottomNavLastPath";

  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(LAST_PATH_KEY, pathname);
    }
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        if (currentY < 60) {
          // Perto do topo: sempre mostra
          setVisible(true);
        } else if (delta > 6) {
          // Rolando para baixo: esconde
          setVisible(false);
        } else if (delta < -6) {
          // Rolando para cima: mostra
          setVisible(true);
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const items = [
    { path: "/pages/user/home", icon: <HomeIcon /> },
    { path: "/pages/user/liked", icon: <FavoriteIcon /> },
    { path: "/pages/user/store", icon: <ShoppingBagIcon /> },
    { path: "/pages/user/my-photos", icon: <PhotoLibraryIcon /> },
  ];

  return (
    <Box
      data-fixed-bottom="true"
      sx={{
        position: "fixed",
        bottom: "calc(24px + env(safe-area-inset-bottom))",
        left: "50%",
        transform: visible
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(calc(100% + 40px))",
        opacity: visible ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
        zIndex: 9999,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: "rgba(8, 8, 8, 0.55)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "999px",
          padding: "8px 10px",
          boxShadow:
            "0 8px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {items.map((item) => {
          const isActive = pathname === item.path;

          return (
            <IconButton
              key={item.path}
              onClick={() => {
                if (item.path === "/pages/user/home" && typeof window !== "undefined") {
                  sessionStorage.setItem("forceHomeRestore", "1");
                  const lastPath = sessionStorage.getItem(LAST_PATH_KEY);
                  if (window.history.length > 1 && lastPath && lastPath !== pathname) {
                    router.back();
                    return;
                  }
                }
                router.push(item.path);
              }}
              sx={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: isActive
                  ? "linear-gradient(180deg, #ff2e30 0%, #cc1012 100%)"
                  : "rgba(255, 31, 33, 0.14)",
                color: isActive ? "#fff" : "rgba(255, 255, 255, 0.65)",
                border: isActive
                  ? "1px solid rgba(255,80,82,0.6)"
                  : "1px solid rgba(255, 31, 33, 0.25)",
                boxShadow: isActive
                  ? "0 0 18px rgba(255, 31, 33, 0.55), 0 4px 12px rgba(0,0,0,0.3)"
                  : "none",
                "& svg": {
                  fontSize: 22,
                  filter: isActive ? "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" : "none",
                },
                "&:hover": {
                  background: isActive
                    ? "linear-gradient(180deg, #ff4547 0%, #dc1416 100%)"
                    : "rgba(255, 31, 33, 0.28)",
                  color: "#fff",
                  boxShadow: "0 0 18px rgba(255, 31, 33, 0.45)",
                },
                transition: "all 0.22s ease",
                flexShrink: 0,
              }}
            >
              {item.icon}
            </IconButton>
          );
        })}
      </Box>
    </Box>
  );
}
