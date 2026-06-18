"use client";

import { Box, Button, Skeleton, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { spinRoulette } from "@/app/services/roulette/rouletteService";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

// ── Constants ─────────────────────────────────────────────────────────────────

const CX = 250;
const CY = 275;
const RADIUS = 215;
const SPIN_MS = 4000;
const LOGO_R = 28;

// 7 fatias fixas: 5 patrocinadores + 2 "Tente novamente"
const WHEEL_SEGMENTS: Segment[] = [
  { id: -1, name: "Brahma",           image_url: "/ads/2.png" },
  { id: -6, name: "Tente novamente",  image_url: null },
  { id: -2, name: "Sicoob",           image_url: "/ads/3.png" },
  { id: -3, name: "Volkswagen",       image_url: "/ads/4.png" },
  { id: -7, name: "Tente novamente",  image_url: null },
  { id: -4, name: "Ballantines",      image_url: "/ads/5.png" },
  { id: -5, name: "Globo",            image_url: "/ads/1.png" },
];

const SEG_COLORS = [
  "#f59e0b", // Brahma
  "#374151", // Tente novamente
  "#10b981", // Sicoob
  "#6366f1", // Volkswagen
  "#1f2937", // Tente novamente
  "#ec4899", // Ballantines
  "#3b82f6", // Globo
];

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
    setSegments(WHEEL_SEGMENTS);
    setLoading(false);
  }, []);

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

      const prizeName = result.prize.name.trim().toLowerCase();
      const isTryAgain =
        prizeName.includes("não foi") ||
        prizeName.includes("nao foi") ||
        prizeName.includes("tente novamente");

      // "Tente novamente" slices are at indices 1 and 4 in WHEEL_SEGMENTS
      const TRY_AGAIN_INDICES = [1, 4];
      // Sponsor slices are at indices 0, 2, 3, 5, 6
      const SPONSOR_MAP: Record<string, number> = {
        brahma: 0, sicoob: 2, volkswagen: 3, volks: 3, vw: 3,
        ballantines: 5, globo: 6,
      };

      let segIndex: number;
      if (isTryAgain) {
        segIndex = TRY_AGAIN_INDICES[result.prize.id % 2 === 0 ? 0 : 1];
      } else {
        const matchedKey = Object.keys(SPONSOR_MAP).find((k) => prizeName.includes(k));
        segIndex = matchedKey !== undefined ? SPONSOR_MAP[matchedKey] : 0;
      }

      const SEG_ANGLE = 360 / segments.length;
      const segCenterAngle = segIndex * SEG_ANGLE + SEG_ANGLE / 2;
      const targetAngle = (360 - segCenterAngle) % 360;
      const currentAngle = rotation % 360;
      const delta = ((targetAngle - currentAngle) + 360) % 360;
      const newRotation = rotation + 5 * 360 + (delta === 0 ? 360 : delta);

      setTransitioning(true);
      setRotation(newRotation);

      const landedSegment = WHEEL_SEGMENTS[segIndex];
      setTimeout(() => {
        setTransitioning(false);
        setSpinning(false);
        const p = new URLSearchParams({
          prize_id: landedSegment.id.toString(),
          prize_name: landedSegment.name,
          prize_position: segIndex.toString(),
          event_id: eventId.toString(),
        });
        if (landedSegment.image_url) p.append("prize_image", landedSegment.image_url);
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
      <Box sx={{ ...dashboardBackgroundSx, minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <Skeleton variant="circular" width={300} height={300} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
          <Skeleton variant="rectangular" width={200} height={52} sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: "999px" }} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ ...dashboardBackgroundSx, minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", px: 2 }}>
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
        overflow: "hidden",
        "@keyframes btnPulse": {
          "0%, 100%": {
            transform: "scale(1)",
            boxShadow: "0 8px 28px rgba(0,0,0,0.45), 0 0 0 3px rgba(255,215,0,0.25)",
          },
          "50%": {
            transform: "scale(1.04)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.55), 0 0 0 5px rgba(255,215,0,0.45)",
          },
        },
      }}
    >
      {/* Ambient red glow behind wheel */}
      <Box
        sx={{
          position: "absolute",
          width: { xs: "75vw", md: "520px" },
          height: { xs: "75vw", md: "520px" },
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,31,33,0.13) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <Typography
        sx={{
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)",
          mb: 1,
          zIndex: 1,
        }}
      >
        ✦ &nbsp; Boa sorte &nbsp; ✦
      </Typography>

      <Typography
        sx={{
          color: "#fff",
          fontWeight: 900,
          fontSize: { xs: "1.55rem", md: "2rem" },
          lineHeight: 1.2,
          textAlign: "center",
          mb: { xs: 3, md: 4 },
          textShadow: "0 2px 24px rgba(0,0,0,0.6)",
          zIndex: 1,
        }}
      >
        Gire e ganhe um{" "}
        <Box component="span" sx={{ color: "#FFD700" }}>
          brinde exclusivo!
        </Box>
      </Typography>

      {/* Wheel */}
      <Box
        sx={{
          position: "relative",
          width: { xs: "min(88vw, 360px)", md: "460px" },
          mb: { xs: 4, md: 5 },
          flexShrink: 0,
          zIndex: 1,
          filter: "drop-shadow(0 20px 48px rgba(0,0,0,0.7))",
        }}
      >
        <svg
          viewBox="0 0 500 550"
          width="100%"
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            {/* Single shared circular clip — applied via translate groups, so it resolves in local space */}
            <clipPath id={`logo-round-${eventId}`}>
              <circle cx="0" cy="0" r={LOGO_R} />
            </clipPath>

            <filter id="ptr-glow" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="hub-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── Static outer decorative ring + lights (do not rotate) ── */}
          <circle cx={CX} cy={CY} r={RADIUS + 16} fill="none" stroke="#c9a227" strokeWidth="5" />
          <circle cx={CX} cy={CY} r={RADIUS + 21} fill="none" stroke="rgba(255,215,0,0.18)" strokeWidth="2" />

          {Array.from({ length: 20 }).map((_, li) => {
            const ang = (li * 360) / 20;
            const { x: lx, y: ly } = toCart(ang, RADIUS + 28);
            const isBig = li % 2 === 0;
            return (
              <circle
                key={`light-${li}`}
                cx={lx.toFixed(2)}
                cy={ly.toFixed(2)}
                r={isBig ? 5.5 : 3.8}
                fill={isBig ? "#FFD700" : "#ffffff"}
                opacity={isBig ? 0.95 : 0.75}
              />
            );
          })}

          {/* ── Red pointer triangle ── */}
          <polygon
            points={`${CX},${CY - RADIUS + 2} ${CX - 19},${CY - RADIUS - 40} ${CX + 19},${CY - RADIUS - 40}`}
            fill="#FF1F21"
            filter="url(#ptr-glow)"
          />
          <polygon
            points={`${CX},${CY - RADIUS + 2} ${CX - 19},${CY - RADIUS - 40} ${CX + 19},${CY - RADIUS - 40}`}
            fill="none"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* ── Rotating wheel group ── */}
          <g
            style={{
              transformOrigin: `${CX}px ${CY}px`,
              transform: `rotate(${rotation}deg)`,
              transition: transitioning
                ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.8, 0.15, 1.0)`
                : "none",
            }}
          >
            {segments.map((seg, i) => {
              const start = i * SEG_ANGLE;
              const end = (i + 1) * SEG_ANGLE;
              const mid = start + SEG_ANGLE / 2;
              const isTryAgain = !seg.image_url;
              const { x: tx, y: ty } = toCart(mid, RADIUS * 0.61);
              const textRot = mid > 90 && mid < 270 ? mid - 180 : mid;
              const segColor = SEG_COLORS[i % SEG_COLORS.length];

              return (
                <g key={i}>
                  {/* Colored segment slice */}
                  <path
                    d={slicePath(start, end)}
                    fill={segColor}
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth="1.5"
                  />
                  {/* Subtle highlight overlay on each slice */}
                  <path
                    d={slicePath(start, end)}
                    fill="rgba(255,255,255,0.055)"
                    style={{ pointerEvents: "none" }}
                  />

                  {!isTryAgain && seg.image_url ? (
                    /* Round logo — translate group so clip path resolves in local space */
                    (() => {
                      const isWide = seg.name.trim().toLowerCase().includes("samsung");
                      return (
                        <g transform={`translate(${tx.toFixed(2)},${ty.toFixed(2)})`}>
                          <circle cx="0" cy="0" r={LOGO_R + 7} fill="rgba(255,255,255,0.1)" />
                          <circle cx="0" cy="0" r={LOGO_R + 3} fill="white" />
                          <image
                            href={seg.image_url}
                            x={-LOGO_R}
                            y={-LOGO_R}
                            width={LOGO_R * 2}
                            height={LOGO_R * 2}
                            clipPath={`url(#logo-round-${eventId})`}
                            preserveAspectRatio={isWide ? "xMidYMid meet" : "xMidYMid slice"}
                          />
                        </g>
                      );
                    })()
                  ) : (
                    <g transform={`translate(${tx.toFixed(2)},${ty.toFixed(2)}) rotate(${textRot})`}>
                      {isTryAgain ? (
                        <>
                          <text x="0" y="-8" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="11" fontWeight="700" fontFamily="system-ui,sans-serif">
                            Tente
                          </text>
                          <text x="0" y="7" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="11" fontWeight="700" fontFamily="system-ui,sans-serif">
                            novamente
                          </text>
                        </>
                      ) : (
                        <text
                          x="0"
                          y="0"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize="12"
                          fontWeight="700"
                          fontFamily="system-ui,sans-serif"
                        >
                          {seg.name.length > 14 ? seg.name.slice(0, 13) + "…" : seg.name}
                        </text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Inner wheel border */}
            <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

            {/* Center hub */}
            <circle cx={CX} cy={CY} r="46" fill="#0d0d0d" stroke="#c9a227" strokeWidth="4" filter="url(#hub-glow)" />
            <circle cx={CX} cy={CY} r="36" fill="#161616" stroke="rgba(255,215,0,0.35)" strokeWidth="2" />
            <circle cx={CX} cy={CY} r="23" fill="#0d0d0d" />
            <text
              x={CX}
              y={CY + 8}
              textAnchor="middle"
              fill="#FFD700"
              fontSize="24"
              fontWeight="900"
              fontFamily="system-ui,sans-serif"
            >
              ★
            </text>
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
          px: { xs: 7, md: 9 },
          py: { xs: 1.8, md: 2 },
          fontSize: { xs: "1.05rem", md: "1.15rem" },
          letterSpacing: "0.04em",
          animation: !spinning ? "btnPulse 2.5s ease-in-out infinite" : "none",
          zIndex: 1,
          "&:hover": {
            backgroundColor: "#e8e8e8",
            animation: "none",
            transform: "scale(1.06)",
          },
          "&:disabled": {
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.3)",
            animation: "none",
            boxShadow: "none",
          },
        }}
      >
        {spinning ? "Girando..." : "Girar roleta"}
      </Button>

      {spinning && (
        <Typography
          sx={{
            mt: 2,
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.8rem",
            letterSpacing: "0.1em",
            zIndex: 1,
          }}
        >
          ✦ Aguarde o resultado... ✦
        </Typography>
      )}
    </Box>
  );
}
