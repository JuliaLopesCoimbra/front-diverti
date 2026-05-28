"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Box } from "@mui/material";
import api from "@/app/services/auth/axiosConfig";

interface AdItem {
  image_url: string;
  redirect_url: string;
  alt_text: string;
}

const MOCK_ADS: AdItem[] = [
  { image_url: "/ads/1.png", redirect_url: "https://www.globoplay.globo.com", alt_text: "Globoplay" },
  { image_url: "/ads/2.png", redirect_url: "https://www.brahma.com.br", alt_text: "Brahma" },
  { image_url: "/ads/3.png", redirect_url: "https://www.sicoob.com.br", alt_text: "Sicoob" },
  { image_url: "/ads/4.png", redirect_url: "https://www.vw.com.br", alt_text: "Volkswagen" },
  { image_url: "/ads/5.png", redirect_url: "https://www.ballantines.com", alt_text: "Ballantines" },
];

interface Props {
  eventId?: number;
}

export default function AdCarousel({ eventId }: Props) {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const total = MOCK_ADS.length;

  const resetInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 4000);
  }, [total]);

  useEffect(() => {
    resetInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resetInterval]);

  const goTo = (idx: number) => {
    setCurrent(idx);
    resetInterval();
  };

  const handleClick = async () => {
    const ad = MOCK_ADS[current];
    if (eventId) {
      try {
        await api
          .post("/ads/clicks", {
            event_id: eventId,
            ad_identifier: ad.image_url.split("/").pop()?.replace(/\.[^/.]+$/, "") ?? "",
            ad_url: ad.image_url,
            redirect_url: ad.redirect_url,
          })
          .catch(() => {});
      } catch {}
    }
    window.open(ad.redirect_url, "_blank");
  };

  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        pt: 1.5,
        maxWidth: { xs: "100%", md: "600px" },
        margin: "0 auto",
        width: "100%",
      }}
    >
      <Box
        sx={{
          position: "relative",
          borderRadius: "16px",
          overflow: "hidden",
          cursor: "pointer",
          height: { xs: 120, sm: 180 },
          boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
          backgroundColor: "rgba(255,255,255,0.04)",
        }}
        onClick={handleClick}
      >
        {MOCK_ADS.map((ad, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              inset: 0,
              opacity: i === current ? 1 : 0,
              transition: "opacity 0.6s ease",
              zIndex: i === current ? 1 : 0,
            }}
          >
            <img
              src={ad.image_url}
              alt={ad.alt_text}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </Box>
        ))}

        {/* Dot indicators */}
        <Box
          sx={{
            position: "absolute",
            bottom: 10,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            zIndex: 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {MOCK_ADS.map((_, i) => (
            <Box
              key={i}
              onClick={() => goTo(i)}
              sx={{
                width: i === current ? 22 : 6,
                height: 6,
                borderRadius: "999px",
                backgroundColor: i === current ? "#fff" : "rgba(255,255,255,0.4)",
                transition: "all 0.35s ease",
                cursor: "pointer",
                boxShadow: i === current ? "0 0 8px rgba(255,255,255,0.5)" : "none",
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
