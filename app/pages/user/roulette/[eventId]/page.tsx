"use client";

import { Box, Typography, Button, Skeleton } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getRouletteByEvent,
  spinRoulette,
  RouletteResponse,
} from "@/app/services/roulette/rouletteService";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

const SLICE_COUNT = 12;
const SLICE_ANGLE = 360 / SLICE_COUNT;

export default function Roulette() {
  const [roulette, setRoulette] = useState<RouletteResponse | null>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [pointerFalling, setPointerFalling] = useState(false);
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.eventId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const spinToPosition = (position: number | string) => {
    const pos = Number(position);
    if (Number.isNaN(pos)) return;
    const alignmentOffset = SLICE_ANGLE / 2;
    const finalAngle =
      6 * 360 + (360 - pos * SLICE_ANGLE - SLICE_ANGLE / 2) + alignmentOffset;
    setRotation(finalAngle);
  };

  const handleSpin = async () => {
    if (spinning || !roulette) return;

    setSpinning(true);
    setRotation(0);
    setPointerFalling(false);

    try {
      const result = await spinRoulette(eventId);

      const countKey = `roulette-spin-count-${eventId}`;
      const current = Number(sessionStorage.getItem(countKey) ?? "0");
      sessionStorage.setItem(countKey, String(current + 1));

      spinToPosition(result.prize.position);

      setTimeout(() => {
        setPointerFalling(true);

        setTimeout(() => {
          const p = new URLSearchParams({
            prize_id: result.prize.id.toString(),
            prize_name: result.prize.name,
            prize_position: result.prize.position.toString(),
          });
          if (result.prize.image_url) p.append("prize_image", result.prize.image_url);
          router.push(`/pages/user/roulette/prize/prize-win?${p.toString()}`);
        }, 1500);
      }, 4000);
    } catch (err) {
      console.error("Erro ao girar roleta", err);
      setSpinning(false);
      setPointerFalling(false);
    }
  };

  useEffect(() => {
    if (!eventId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getRouletteByEvent(eventId);
        setRoulette(data);
      } catch (err: any) {
        setError(
          err?.response?.status === 404
            ? "Roleta não encontrada ou inativa para este evento."
            : "Erro ao carregar roleta. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

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
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            px: 2,
          }}
        >
          <Skeleton variant="text" width={220} height={28} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
          <Box sx={{ position: "relative", width: { xs: 300, md: 480 }, height: { xs: 300, md: 480 } }}>
            <Skeleton
              variant="rectangular"
              sx={{
                width: { xs: 80, md: 120 },
                height: { xs: 52, md: 80 },
                position: "absolute",
                top: { xs: -26, md: -40 },
                left: "50%",
                transform: "translateX(-50%)",
                bgcolor: "rgba(255,255,255,0.1)",
                borderRadius: 2,
              }}
            />
            <Skeleton
              variant="circular"
              sx={{ width: "100%", height: "100%", bgcolor: "rgba(255,255,255,0.1)" }}
            />
          </Box>
          <Skeleton variant="rectangular" width={200} height={56} sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: "999px" }} />
        </Box>
      </Box>
    );
  }

  if (error || !roulette) {
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
          <Typography variant="h6" color="white" sx={{ mb: 3 }}>
            {error || "Roleta não encontrada"}
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.history.back()}
            sx={{
              background: "linear-gradient(180deg, #ff2e30, #ff1f21)",
              color: "#fff",
              fontWeight: 700,
              borderRadius: "999px",
              textTransform: "none",
              px: 4,
              py: 1.4,
            }}
          >
            Voltar
          </Button>
        </Box>
      </Box>
    );
  }

  if (!eventId) return <div>Evento inválido</div>;

  const wheelSize = { xs: "min(82vw, 340px)", md: "480px" };
  const pointerWidth = { xs: "min(22vw, 88px)", md: "120px" };

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
      {/* Label topo */}
      <Typography
        sx={{
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(255, 80, 82, 0.9)",
          mb: 2,
        }}
      >
        Boa sorte!
      </Typography>

      {/* Título */}
      <Typography
        sx={{
          color: "#fff",
          fontWeight: 900,
          fontSize: { xs: "1.5rem", md: "2rem" },
          lineHeight: 1.15,
          textAlign: "center",
          mb: { xs: 4, md: 5 },
          px: { xs: 3, md: 0 },
        }}
      >
        Gire e ganhe um<br />brinde exclusivo!
      </Typography>

      {/* Roleta + ponteiro */}
      <Box
        sx={{
          position: "relative",
          width: wheelSize,
          height: wheelSize,
          mb: { xs: 5, md: 6 },
          flexShrink: 0,
        }}
      >
        {/* Glow ambiente */}
        <Box
          sx={{
            position: "absolute",
            inset: "-25%",
            background: spinning
              ? "radial-gradient(circle, rgba(255,46,48,0.25) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(255,46,48,0.12) 0%, transparent 70%)",
            transition: "background 0.6s ease",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Ponteiro */}
        <Box
          component="img"
          src={roulette.pointer_image_url}
          alt="Ponteiro"
          sx={{
            position: "absolute",
            top: { xs: "-8%", md: "-9%" },
            left: "50%",
            transform: "translateX(-50%)",
            width: pointerWidth,
            zIndex: 2,
            transition: pointerFalling
              ? "top 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)"
              : "none",
            ...(pointerFalling && {
              top: "5%",
              animation: "pointerBounce 1.5s ease-in-out",
              "@keyframes pointerBounce": {
                "0%":   { transform: "translateX(-50%) rotate(0deg)" },
                "50%":  { transform: "translateX(-50%) rotate(-5deg)" },
                "70%":  { transform: "translateX(-50%) rotate(2deg)" },
                "100%": { transform: "translateX(-50%) rotate(0deg)" },
              },
            }),
          }}
        />

        {/* Roda */}
        <Box
          component="img"
          src={roulette.roulette_image_url}
          alt="Roleta"
          sx={{
            width: "100%",
            height: "100%",
            transformOrigin: "50% 50%",
            transition: "transform 4s cubic-bezier(0.17, 0.67, 0.83, 0.67)",
            transform: `rotate(${rotation}deg)`,
            position: "relative",
            zIndex: 1,
          }}
        />
      </Box>

      {/* Botão */}
      <Button
        variant="contained"
        size="large"
        onClick={handleSpin}
        disabled={spinning}
        sx={{
          background: "linear-gradient(135deg, #ff2e30 0%, #ff6162 50%, #ff1f21 100%)",
          backgroundSize: "200% 200%",
          animation: spinning ? "none" : "shimmer 2.5s ease-in-out infinite",
          "@keyframes shimmer": {
            "0%":   { backgroundPosition: "0% 50%" },
            "50%":  { backgroundPosition: "100% 50%" },
            "100%": { backgroundPosition: "0% 50%" },
          },
          color: "#fff",
          fontWeight: 800,
          borderRadius: "999px",
          textTransform: "none",
          px: { xs: 6, md: 8 },
          py: { xs: 1.6, md: 1.8 },
          fontSize: { xs: "1.05rem", md: "1.15rem" },
          letterSpacing: "0.05em",
          boxShadow: "0 0 36px rgba(255,46,48,0.55), 0 8px 28px rgba(0,0,0,0.45)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            background: "linear-gradient(135deg, #ff4547 0%, #ff7476 50%, #ff3436 100%)",
            transform: "scale(1.05)",
            boxShadow: "0 0 52px rgba(255,46,48,0.75), 0 12px 32px rgba(0,0,0,0.5)",
          },
          "&:disabled": {
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.35)",
            boxShadow: "none",
            animation: "none",
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
            letterSpacing: "0.06em",
          }}
        >
          Aguarde o resultado...
        </Typography>
      )}
    </Box>
  );
}
