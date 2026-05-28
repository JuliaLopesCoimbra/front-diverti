"use client";

import { Box, Button, Skeleton, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getPrizesByEvent,
  spinRoulette,
} from "@/app/services/roulette/rouletteService";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

// ── Constants ─────────────────────────────────────────────────────────────────

const CX = 250;
const CY = 275;
const RADIUS = 215;
const SPIN_MS = 4000;
const IMG_HALF = 42; // half-size of logo square in each segment

// alternating white / off-white for visual separation between slices
const SEG_FILLS = ["#ffffff", "#f2f2f2"];

const PRIZE_IMAGES: { keys: string[]; image: string }[] = [
  { keys: ["coca"],                       image: "https://marcasmais.com.br/wp-content/uploads/2026/03/Banco-e-Samba-assinam-experiencias-da-Coca-Cola-Tic-Tac-Sprite-e-Schweppes-no-Lollapalooza-2026-3.jpg" },
  { keys: ["fiat"],                       image: "https://portalg.com.br/wp-content/uploads/2026/03/Fiat-transforma-fas-em-estrelas-com-experiencias-tecnologicas-no-Lollapalooza-2026-1068x588.webp" },
  { keys: ["sprite"],                     image: "https://gkpb.com.br/wp-content/uploads/2026/03/sprite-lollapalooza-gkpb-banner.jpg" },
  { keys: ["balatines", "ballantines"],   image: "https://creativosbr.com.br/wp-content/uploads/2024/09/3D-do-estande-de-Johnnie-Walker-durante-o-Rock-in-Rio-Brasil-2024.png" },
  { keys: ["vivo"],                       image: "https://uploads.promoview.com.br/2025/09/Estande-Skyline_1.jpg" },
  { keys: ["samsung"],                    image: "https://t2.tudocdn.net/507931?w=1920" },
  { keys: ["volkswagen", "volks", "vw"],  image: "https://marcasmais.com.br/wp-content/uploads/2025/09/Volkswagen-Tera-e-esportivos-VW-Legends-%E2%80%98dao-show-no-The-Town.jpg" },
];

function getPrizeImage(name: string, backendImage?: string | null): string | null {
  if (backendImage) return backendImage;
  const lower = name.toLowerCase();
  for (const { keys, image } of PRIZE_IMAGES) {
    if (keys.some((k) => lower.includes(k))) return image;
  }
  return null;
}

// ── SVG helpers ───────────────────────────────────────────────────────────────

function toCart(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function slicePath(startDeg: number, endDeg: number): string {
  const s = toCart(startDeg, RADIUS);
  const e = toCart(endDeg, RADIUS);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
}

interface Segment {
  id: number;
  name: string;
  image_url?: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Roulette() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.eventId);

  useEffect(() => {
    if (!eventId) return;
    const load = async () => {
      try {
        const data = await getPrizesByEvent(eventId);
        const filtered = data
          .filter(
            (p) =>
              p.is_active &&
              !p.name.trim().toLowerCase().includes("não foi") &&
              !p.name.trim().toLowerCase().includes("nao foi") &&
              !p.name.trim().toLowerCase().includes("tente novamente"),
          )
          .sort((a, b) => a.position - b.position);

        // Mantém apenas prêmios que batem com uma marca conhecida, 1 por marca
        const seenBrand = new Set<string>();
        const unique = filtered.filter((p) => {
          const lower = p.name.toLowerCase();
          const brand = PRIZE_IMAGES.find(({ keys }) => keys.some((k) => lower.includes(k)));
          if (!brand) return false; // descarta qualquer prêmio sem marca conhecida
          if (seenBrand.has(brand.keys[0])) return false;
          seenBrand.add(brand.keys[0]);
          return true;
        });

        // Swap Fiat ↔ Samsung
        const fiatIdx = unique.findIndex((p) => p.name.trim().toLowerCase().includes("fiat"));
        const samsungIdx = unique.findIndex((p) => p.name.trim().toLowerCase().includes("samsung"));
        if (fiatIdx >= 0 && samsungIdx >= 0) {
          [unique[fiatIdx], unique[samsungIdx]] = [unique[samsungIdx], unique[fiatIdx]];
        }

        // Swap Vivo ↔ Volkswagen
        const vivoIdx = unique.findIndex((p) => p.name.trim().toLowerCase().includes("vivo"));
        const volksIdx = unique.findIndex((p) => {
          const n = p.name.trim().toLowerCase();
          return n.includes("volkswagen") || n.includes("volks") || n.includes("vw");
        });
        if (vivoIdx >= 0 && volksIdx >= 0) {
          [unique[vivoIdx], unique[volksIdx]] = [unique[volksIdx], unique[vivoIdx]];
        }

        setSegments([
          ...unique.slice(0, 7).map((p) => ({ id: p.id, name: p.name, image_url: getPrizeImage(p.name, p.image_url) })),
          { id: -1, name: "Tente novamente", image_url: null },
        ]);
      } catch {
        setError("Erro ao carregar roleta. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  const handleSpin = async () => {
    if (spinning || segments.length === 0) return;
    setSpinning(true);

    try {
      const result = await spinRoulette(eventId);

      const countKey = `roulette-spin-count-${eventId}`;
      sessionStorage.setItem(
        countKey,
        String(Number(sessionStorage.getItem(countKey) ?? "0") + 1),
      );

      const isTryAgain =
        result.prize.name.trim().toLowerCase().includes("não foi") ||
        result.prize.name.trim().toLowerCase().includes("nao foi") ||
        result.prize.name.trim().toLowerCase().includes("tente novamente");

      const foundIdx = segments.findIndex((s) => s.id === result.prize.id);
      const segIndex = isTryAgain
        ? segments.length - 1
        : foundIdx >= 0
        ? foundIdx
        : 0;

      const SEG_ANGLE = 360 / segments.length;
      // Para o ponteiro (mundo 0°) apontar pro segmento i, R = 360 - segCenterAngle
      const segCenterAngle = segIndex * SEG_ANGLE + SEG_ANGLE / 2;
      const targetAngle = (360 - segCenterAngle) % 360;
      const currentAngle = rotation % 360;
      const delta = ((targetAngle - currentAngle) + 360) % 360;
      const newRotation = rotation + 5 * 360 + (delta === 0 ? 360 : delta);


      setTransitioning(true);
      setRotation(newRotation);

      setTimeout(() => {
        setTransitioning(false);
        setSpinning(false);
        const p = new URLSearchParams({
          prize_id: result.prize.id.toString(),
          prize_name: result.prize.name,
          prize_position: result.prize.position.toString(),
          event_id: eventId.toString(),
        });
        if (result.prize.image_url) p.append("prize_image", result.prize.image_url);
        router.push(`/pages/user/roulette/prize/prize-win?${p.toString()}`);
      }, SPIN_MS + 1200);
    } catch {
      setSpinning(false);
      setTransitioning(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box
        sx={{
          ...dashboardBackgroundSx,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <Skeleton variant="circular" width={300} height={300} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
          <Skeleton variant="rectangular" width={200} height={52} sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: "999px" }} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          ...dashboardBackgroundSx,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography color="white" sx={{ mb: 3 }}>{error}</Typography>
          <Button
            onClick={() => window.history.back()}
            sx={{ backgroundColor: "#ffffff", color: "#111111", fontWeight: 700, borderRadius: "999px", textTransform: "none", px: 4, py: 1.4 }}
          >
            Voltar
          </Button>
        </Box>
      </Box>
    );
  }

  // ── Wheel ─────────────────────────────────────────────────────────────────

  const SEG_ANGLE = 360 / segments.length;
  const wheelSize = { xs: "min(88vw, 360px)", md: "460px" };

  return (
    <Box
      sx={{
        ...dashboardBackgroundSx,
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
      }}
    >
      <Typography
        sx={{
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          mb: 2,
        }}
      >
        Boa sorte!
      </Typography>

      <Typography
        sx={{
          color: "#fff",
          fontWeight: 900,
          fontSize: { xs: "1.5rem", md: "2rem" },
          lineHeight: 1.15,
          textAlign: "center",
          mb: { xs: 3, md: 4 },
        }}
      >
        Gire e ganhe um<br />brinde exclusivo!
      </Typography>

      {/* Wheel container */}
      <Box
        sx={{
          position: "relative",
          width: wheelSize,
          mb: { xs: 5, md: 6 },
          flexShrink: 0,
          filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.6))",
        }}
      >
        <svg viewBox="0 0 500 545" width="100%" style={{ display: "block" }}>
          <defs>
            <filter id="ptr-shadow" x="-100%" y="-100%" width="300%" height="300%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.8)" />
            </filter>
          </defs>

          {/* Static pointer — downward triangle above wheel */}
          <polygon
            points={`${CX},${CY - RADIUS + 2} ${CX - 17},${CY - RADIUS - 30} ${CX + 17},${CY - RADIUS - 30}`}
            fill="#ffffff"
            filter="url(#ptr-shadow)"
          />

          {/* Rotating wheel */}
          <g
            style={{
              transformOrigin: `${CX}px ${CY}px`,
              transform: `rotate(${rotation}deg)`,
              transition: transitioning
                ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.8, 0.15, 1.0)`
                : "none",
            }}
          >
            {/* Slices */}
            {segments.map((seg, i) => {
              const start = i * SEG_ANGLE;
              const end = (i + 1) * SEG_ANGLE;
              const mid = start + SEG_ANGLE / 2;
              const isTryAgain = seg.id === -1;
              const { x: tx, y: ty } = toCart(mid, RADIUS * 0.60);

              // Text rotation (only used for "Tente novamente")
              const textRot = mid > 90 && mid < 270 ? mid - 180 : mid;

              return (
                <g key={i}>
                  <path
                    d={slicePath(start, end)}
                    fill={SEG_FILLS[i % 2]}
                    stroke="rgba(0,0,0,0.1)"
                    strokeWidth="1.5"
                  />

                  {!isTryAgain && seg.image_url ? (
                    /* Logo image — square, centered in segment, transparent bg shows cleanly on white */
                    (() => {
                      const name = seg.name.trim().toLowerCase();
                      const half = name.includes("fiat") || name.includes("coca") || name.includes("vivo") ? 28 : IMG_HALF;
                      return (
                        <image
                          href={seg.image_url}
                          x={(tx - half).toFixed(2)}
                          y={(ty - half).toFixed(2)}
                          width={half * 2}
                          height={half * 2}
                          preserveAspectRatio="xMidYMid meet"
                        />
                      );
                    })()
                  ) : (
                    /* Text for "Tente novamente" or prize without image */
                    <g transform={`translate(${tx.toFixed(2)},${ty.toFixed(2)}) rotate(${textRot})`}>
                      {isTryAgain ? (
                        <>
                          <text x="0" y="-7" textAnchor="middle" fill="rgba(0,0,0,0.45)" fontSize="11" fontWeight="700" fontFamily="system-ui,sans-serif">
                            Tente
                          </text>
                          <text x="0" y="8" textAnchor="middle" fill="rgba(0,0,0,0.45)" fontSize="11" fontWeight="700" fontFamily="system-ui,sans-serif">
                            novamente
                          </text>
                        </>
                      ) : (
                        <text x="0" y="0" textAnchor="middle" dominantBaseline="middle" fill="rgba(0,0,0,0.7)" fontSize="12" fontWeight="700" fontFamily="system-ui,sans-serif">
                          {seg.name.length > 14 ? seg.name.slice(0, 13) + "…" : seg.name}
                        </text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Outer border ring */}
            <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#2a2a2a" strokeWidth="7" />
            <circle cx={CX} cy={CY} r={RADIUS - 5} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

            {/* Center hub */}
            <circle cx={CX} cy={CY} r="30" fill="#1a1a1a" stroke="#444" strokeWidth="2" />
            <circle cx={CX} cy={CY} r="16" fill="#111" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          </g>
        </svg>
      </Box>

      {/* Spin button */}
      <Button
        variant="contained"
        size="large"
        onClick={handleSpin}
        disabled={spinning}
        sx={{
          backgroundColor: "#ffffff",
          color: "#111111",
          fontWeight: 800,
          borderRadius: "999px",
          textTransform: "none",
          px: { xs: 6, md: 8 },
          py: { xs: 1.6, md: 1.8 },
          fontSize: { xs: "1.05rem", md: "1.15rem" },
          letterSpacing: "0.05em",
          boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
          transition: "transform 0.2s ease",
          "&:hover": {
            backgroundColor: "#e8e8e8",
            transform: "scale(1.05)",
          },
          "&:disabled": {
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.35)",
            boxShadow: "none",
          },
        }}
      >
        {spinning ? "Girando..." : "Girar"}
      </Button>

      {spinning && (
        <Typography
          sx={{
            mt: 2,
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.8rem",
            letterSpacing: "0.06em",
          }}
        >
          Aguarde o resultado...
        </Typography>
      )}
    </Box>
  );
}
