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

    if (Number.isNaN(pos)) {
      console.error("Position inválida:", position);
      return;
    }

    const spins = 6; // voltas completas
    // Offset para corrigir o alinhamento quando o ponteiro cair no prêmio
    // Se a roleta começa na metade do primeiro prêmio, precisamos compensar
    const alignmentOffset = SLICE_ANGLE / 2;
    const finalAngle =
      spins * 360 + (360 - pos * SLICE_ANGLE - SLICE_ANGLE / 2) + alignmentOffset;

    setRotation(finalAngle);
  };

  console.log("Rotação atual:", rotation);

  const handleSpin = async () => {
    if (spinning || !roulette) return;

    setSpinning(true);
    setRotation(0);
    setPointerFalling(false);

    try {
      const result = await spinRoulette(eventId);

      spinToPosition(result.prize.position);

      // Após a roleta parar (4 segundos), ativar animação do ponteiro caindo
      setTimeout(() => {
        setPointerFalling(true);

        // Após a animação do ponteiro (1.5 segundos), navegar para a página de prêmio
        setTimeout(() => {
          const params = new URLSearchParams({
            prize_id: result.prize.id.toString(),
            prize_name: result.prize.name,
            prize_position: result.prize.position.toString(),
          });

          if (result.prize.image_url) {
            params.append("prize_image", result.prize.image_url);
          }

          router.push(`/pages/user/roulette/prize/prize-win?${params.toString()}`);
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

    const loadRoulette = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getRouletteByEvent(eventId);
        setRoulette(data);
      } catch (err: any) {
        console.error("Erro ao carregar roleta", err);
        if (err?.response?.status === 404) {
          setError("Roleta não encontrada ou inativa para este evento.");
        } else {
          setError("Erro ao carregar roleta. Tente novamente mais tarde.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadRoulette();
  }, [eventId]);

  if (loading) {
    return (
      <Box
        sx={{
          ...dashboardBackgroundSx,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Container centralizado para desktop */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "1200px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            px: 2,
          }}
        >
          {/* Title Skeleton */}
          <Skeleton
            variant="text"
            height={40}
            sx={{
              width: { xs: 300, md: 500 },
              bgcolor: "rgba(255,255,255,0.1)",
              mt: 5,
              mb: 1,
              borderRadius: 1,
            }}
          />

          {/* Subtitle Skeleton */}
          <Skeleton
            variant="text"
            height={20}
            sx={{
              width: { xs: 400, md: 600 },
              bgcolor: "rgba(255,255,255,0.1)",
              mb: 4,
              borderRadius: 1,
            }}
          />

          {/* Roulette Skeleton - Circular */}
          <Box
            sx={{
              position: "relative",
              width: { xs: 380, md: 600 },
              height: { xs: 380, md: 600 },
              mb: 3,
              mt: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Pointer Skeleton */}
            <Skeleton
              variant="rectangular"
              sx={{
                width: { xs: 90, md: 140 },
                height: { xs: 60, md: 90 },
                position: "absolute",
                top: { xs: -30, md: -45 },
                left: "50%",
                transform: "translateX(-50%)",
                bgcolor: "rgba(255,255,255,0.1)",
                borderRadius: 2,
                zIndex: 2,
              }}
            />

            {/* Circular Roulette Skeleton */}
            <Skeleton
              variant="circular"
              sx={{
                width: { xs: 380, md: 600 },
                height: { xs: 380, md: 600 },
                bgcolor: "rgba(255,255,255,0.1)",
              }}
            />
          </Box>

          {/* Button Skeleton */}
          <Skeleton
            variant="rectangular"
            width={180}
            height={48}
            sx={{
              bgcolor: "rgba(255,255,255,0.1)",
              borderRadius: "14px",
              mt: 1,
            }}
          />
        </Box>
      </Box>
    );
  }

  if (error || !roulette) {
    return (
      <Box
        sx={{
          ...dashboardBackgroundSx,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Container centralizado para desktop */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "1200px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            px: 2,
          }}
        >
          <Typography 
            variant="h6" 
            color="white" 
            sx={{ mb: 2, textAlign: "center" }}
          >
            {error || "Roleta não encontrada"}
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.history.back()}
            sx={{
              backgroundColor: "#ffcc01",
              color: "#000",
              fontWeight: 600,
              borderRadius: "14px",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#e6b800",
              },
            }}
          >
            Voltar
          </Button>
        </Box>
      </Box>
    );
  }
  if (!eventId) {
    return <div>Evento inválido</div>;
  }

  return (
    <Box
      sx={{
        ...dashboardBackgroundSx,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Container centralizado para desktop */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "1200px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          px: 2,
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          mb={1}
          sx={{
            color: "white",
            paddingTop: "40px",
            paddingX: { xs: "55px", md: "20px" },
            fontSize: { xs: "1.25rem", md: "1.75rem" },
            fontFamily: '"Operator Mono", "Operant Mono", monospace',
          }}
        >
          Você desbloqueou um girou na roleta!
        </Typography>

  
        {/* ROLETA */}
        <Box
          sx={{
            position: "relative",
            width: { xs: 380, md: 600 },
            height: { xs: 380, md: 600 },
            mb: 3,
            mt: { xs: 8, md: 4 },
          }}
        >
          {/* PONTEIRO */}
          <Box
            component="img"
            src={roulette.pointer_image_url}
            alt="Ponteiro"
            sx={{
              position: "absolute",
              top: { xs: -30, md: -45 },
              left: "50%",
              transform: "translateX(-50%)",
              width: { xs: 90, md: 140 },
              zIndex: 2,
              transition: pointerFalling
                ? "top 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)"
                : "none",
              ...(pointerFalling && {
                top: { xs: 20, md: 30 },
                animation: "pointerBounce 1.5s ease-in-out",
                "@keyframes pointerBounce": {
                  "0%": {
                    transform: "translateX(-50%) rotate(0deg)",
                  },
                  "50%": {
                    transform: "translateX(-50%) rotate(-5deg)",
                  },
                  "70%": {
                    transform: "translateX(-50%) rotate(2deg)",
                  },
                  "100%": {
                    transform: "translateX(-50%) rotate(0deg)",
                  },
                },
              }),
            }}
          />

          {/* IMAGEM DA ROLETA */}
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
            }}
          />
        </Box>

        {/* BOTÃO */}
        <Button
          variant="contained"
          size="large"
          onClick={handleSpin}
          disabled={spinning}
          sx={{
            background: "linear-gradient(180deg, rgb(255, 46, 48) 0%, rgb(255, 31, 33) 100%)",
            color: "#fff",
            fontWeight: 600,
            marginTop: "10px",
            borderRadius: "14px",
            textTransform: "none",
            px: { xs: 4, md: 6 },
            py: { xs: 0.5, md: 1 },
            fontSize: { xs: "1rem", md: "1.125rem" },
            "&:hover": {
              background: "linear-gradient(180deg, rgb(255, 61, 63) 0%, rgb(220, 20, 22) 100%)",
            },
          }}
        >
          {spinning ? "Girando..." : "Girar roleta"}
        </Button>
      </Box>
    </Box>
  );
}
