"use client";

import { Box, Typography } from "@mui/material";
import { useRef, useEffect, useCallback } from "react";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import CardGiftcardRoundedIcon from "@mui/icons-material/CardGiftcardRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import MicExternalOnIcon from "@mui/icons-material/MicExternalOn";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import NightShelterRoundedIcon from "@mui/icons-material/NightShelterRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";

type Tab = "home" | "eventos" | "estandes" | "mapa" | "lineup" | "foto" | "roleta" | "camping" | "restaurante";

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { label: string; value: Tab; icon: React.ReactNode }[] = [
  { label: "Feed",     value: "home",     icon: <HomeRoundedIcon        sx={{ fontSize: 17 }} /> },
  { label: "Evento",   value: "eventos",  icon: <EventRoundedIcon       sx={{ fontSize: 17 }} /> },
  { label: "Estandes", value: "estandes", icon: <StorefrontRoundedIcon  sx={{ fontSize: 17 }} /> },
  { label: "Camping",  value: "camping",      icon: <NightShelterRoundedIcon sx={{ fontSize: 17 }} /> },
  { label: "Restaurante", value: "restaurante", icon: <RestaurantRoundedIcon  sx={{ fontSize: 17 }} /> },
];

const DRAG_THRESHOLD_PX = 5;

export default function HomeTabs({ active, onChange }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartScrollLeftRef = useRef<number>(0);
  const dragOccurredRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const pendingScrollLeftRef = useRef<number>(0);

  // Centraliza a tab ativa no scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const activeEl = container.querySelector<HTMLElement>("[data-active='true']");
    if (!activeEl) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = activeEl.getBoundingClientRect();
    const offset = elRect.left - containerRect.left - containerRect.width / 2 + elRect.width / 2;
    container.scrollBy({ left: offset, behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const handleMouseMove = (e: MouseEvent) => {
      if (dragStartXRef.current === null || !container) return;
      const dx = dragStartXRef.current - e.clientX;
      if (Math.abs(dx) > DRAG_THRESHOLD_PX) dragOccurredRef.current = true;
      const targetScroll = dragStartScrollLeftRef.current + dx;
      pendingScrollLeftRef.current = Math.max(0, Math.min(targetScroll, container.scrollWidth - container.clientWidth));
      e.preventDefault();
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = pendingScrollLeftRef.current;
      });
    };
    const handleMouseUp = () => {
      if (rafIdRef.current !== null) { cancelAnimationFrame(rafIdRef.current); rafIdRef.current = null; }
      if (scrollContainerRef.current) scrollContainerRef.current.style.scrollBehavior = "";
      dragStartXRef.current = null;
    };
    window.addEventListener("mousemove", handleMouseMove, { capture: true });
    window.addEventListener("mouseup", handleMouseUp, { capture: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove, { capture: true });
      window.removeEventListener("mouseup", handleMouseUp, { capture: true });
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    el.style.scrollBehavior = "auto";
    dragStartXRef.current = e.clientX;
    dragStartScrollLeftRef.current = el.scrollLeft;
    dragOccurredRef.current = false;
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (container.scrollWidth <= container.clientWidth) return;
      const rect = container.getBoundingClientRect();
      const over = e.clientX >= rect.left - 50 && e.clientX <= rect.right + 50 &&
                   e.clientY >= rect.top - 50 && e.clientY <= rect.bottom + 50;
      if (over) {
        e.preventDefault();
        e.stopPropagation();
        container.scrollLeft += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      }
    };
    container.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    return () => container.removeEventListener("wheel", handleWheel, { capture: true } as EventListenerOptions);
  }, []);

  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.2, md: 1.5 },
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Box
        ref={scrollContainerRef}
        onMouseDown={handleContainerMouseDown}
        sx={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          WebkitOverflowScrolling: "touch",
          scrollBehavior: "smooth",
          cursor: "grab",
          "&:active": { cursor: "grabbing" },
          userSelect: "none",
          pb: 0.3,
          justifyContent: { xs: "flex-start", md: "center" },
        }}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.value;
          return (
            <Box
              key={tab.value}
              data-active={isActive ? "true" : "false"}
              onClick={() => {
                if (dragOccurredRef.current) return;
                onChange(tab.value);
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                px: { xs: 1.4, md: 1.8 },
                py: 0.9,
                borderRadius: "999px",
                flexShrink: 0,
                cursor: "pointer",
                backgroundColor: isActive ? "#ffffff" : "rgba(255,255,255,0.05)",
                color: isActive ? "#111111" : "rgba(255,255,255,0.45)",
                border: `1px solid ${isActive ? "transparent" : "rgba(255,255,255,0.1)"}`,
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: isActive ? "#efefef" : "rgba(255,255,255,0.1)",
                  color: isActive ? "#111111" : "rgba(255,255,255,0.8)",
                },
                "&:active": { transform: "scale(0.95)" },
              }}
            >
              {tab.icon}
              <Typography
                sx={{
                  fontSize: { xs: "12px", md: "13px" },
                  fontWeight: isActive ? 700 : 500,
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                }}
              >
                {tab.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
