"use client";

import { Box } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { canCreatePost } = useAuth();
  const LAST_PATH_KEY = "bottomNavLastPath";

  const [shrunk, setShrunk] = useState(false);
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
        if (currentY < 60) setShrunk(false);
        else if (delta > 6) setShrunk(true);
        else if (delta < -6) setShrunk(false);
        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const items = [
    { path: "/pages/user/home", icon: <HomeIcon fontSize="inherit" /> },
    { path: "/pages/user/liked", icon: <FavoriteIcon fontSize="inherit" /> },
    { path: "/pages/user/store", icon: <ShoppingBagIcon fontSize="inherit" /> },
    { path: "/pages/user/my-photos", icon: <PhotoLibraryIcon fontSize="inherit" /> },
  ];

  const handleAddPost = () => {
    const eventId = typeof window !== "undefined" ? localStorage.getItem("circuito_selectedEventId") : null;
    router.push(eventId ? `/pages/news/create?eventId=${eventId}` : "/pages/news/create");
  };

  return (
    <Box
      data-fixed-bottom="true"
      sx={{
        position: "fixed",
        bottom: "calc(24px + env(safe-area-inset-bottom))",
        left: "16px",
        right: "16px",
        display: "flex",
        justifyContent: "center",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: shrunk ? "2px" : "4px",
          pointerEvents: "auto",
          backgroundColor: "rgba(255, 255, 255, 0.07)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "999px",
          padding: shrunk ? "6px 10px" : "8px 12px",
          boxShadow: `
            0 8px 32px rgba(0,0,0,0.55),
            0 20px 60px rgba(0,0,0,0.35),
            0 2px 8px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.1),
            inset 0 -1px 0 rgba(0,0,0,0.2)
          `,
          animation: "floatNav 3s ease-in-out infinite",
          "@keyframes floatNav": {
            "0%":   { transform: "translateY(0px)" },
            "50%":  { transform: "translateY(-5px)" },
            "100%": { transform: "translateY(0px)" },
          },
          transition: "padding 0.3s cubic-bezier(0.4, 0, 0.2, 1), gap 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Home e Liked */}
        {items.slice(0, 2).map((item) => {
          const isActive = pathname === item.path;
          return (
            <Box
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
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                cursor: "pointer",
                padding: shrunk ? "5px 10px" : "7px 14px",
                borderRadius: "999px",
                color: isActive ? "#ff2e30" : "rgba(255,255,255,0.45)",
                fontSize: shrunk ? "18px" : "22px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                WebkitTapHighlightColor: "transparent",
                "&:active": { transform: "scale(0.9)" },
              }}
            >
              {item.icon}
              <Box
                sx={{
                  width: isActive ? (shrunk ? 14 : 18) : 0,
                  height: 2.5,
                  borderRadius: "999px",
                  backgroundColor: "#ff2e30",
                  boxShadow: isActive ? "0 0 6px rgba(255,46,48,0.8)" : "none",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  opacity: isActive ? 1 : 0,
                }}
              />
            </Box>
          );
        })}

        {/* Botão + (adicionar post) — só para admin/patrocinador */}
        {canCreatePost && <Box
          onClick={handleAddPost}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: shrunk ? 34 : 40,
            height: shrunk ? 34 : 40,
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            color: "#111111",
            fontSize: shrunk ? "20px" : "24px",
            cursor: "pointer",
            flexShrink: 0,
            boxShadow: "0 2px 12px rgba(255,255,255,0.2)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            WebkitTapHighlightColor: "transparent",
            "&:active": { transform: "scale(0.88)" },
            "&:hover": { backgroundColor: "#e8e8e8" },
          }}
        >
          <AddRoundedIcon fontSize="inherit" />
        </Box>}

        {/* Store e My Photos */}
        {items.slice(2).map((item) => {
          const isActive = pathname === item.path;
          return (
            <Box
              key={item.path}
              onClick={() => router.push(item.path)}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                cursor: "pointer",
                padding: shrunk ? "5px 10px" : "7px 14px",
                borderRadius: "999px",
                color: isActive ? "#ff2e30" : "rgba(255,255,255,0.45)",
                fontSize: shrunk ? "18px" : "22px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                WebkitTapHighlightColor: "transparent",
                "&:active": { transform: "scale(0.9)" },
              }}
            >
              {item.icon}
              <Box
                sx={{
                  width: isActive ? (shrunk ? 14 : 18) : 0,
                  height: 2.5,
                  borderRadius: "999px",
                  backgroundColor: "#ff2e30",
                  boxShadow: isActive ? "0 0 6px rgba(255,46,48,0.8)" : "none",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  opacity: isActive ? 1 : 0,
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
