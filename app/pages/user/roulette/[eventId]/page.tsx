"use client";

import { Box, Typography, Button } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getRouletteByEvent,
  spinRoulette,
  RouletteResponse,
} from "@/app/services/roulette/rouletteService";

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
          minHeight: "100vh",
          backgroundImage: "url(/background/dashboard.png)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="white">Carregando roleta...</Typography>
      </Box>
    );
  }

  if (error || !roulette) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundImage: "url(/background/dashboard.png)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
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
    );
  }
  if (!eventId) {
    return <div>Evento inválido</div>;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url(/background/dashboard.png)",
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
          paddingLeft: "55px",
          paddingRight: "55px",
          paddingTop: "40px",
        }}
      >
        Você desbloqueou um girou na roleta!
      </Typography>

      <Typography
        sx={{
          paddingLeft: "72px",
          paddingRight: "72px",
          fontSize: "12px",
        }}
        mb={4}
      >
        Cada compra aumenta suas chances de conquistar prêmios ainda melhores.
      </Typography>

      {/* ROLETA */}
      <Box
        sx={{
          position: "relative",
          width: 380,
          height: 380,
          mb: 3,
          mt: 8,
        }}
      >
        {/* PONTEIRO */}
        <Box
          component="img"
          src={roulette.pointer_image_url}
          alt="Ponteiro"
          sx={{
            position: "absolute",
            top: -30,
            left: "50%",
            transform: "translateX(-50%)",
            width: 90,
            zIndex: 2,
            transition: pointerFalling
              ? "top 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)"
              : "none",
            ...(pointerFalling && {
              top: 20,
              animation: "pointerBounce 1.5s ease-in-out",
              "@keyframes pointerBounce": {
                "0%": {
                  top: -30,
                  transform: "translateX(-50%) rotate(0deg)",
                },
                "50%": {
                  top: 25,
                  transform: "translateX(-50%) rotate(-5deg)",
                },
                "70%": {
                  top: 20,
                  transform: "translateX(-50%) rotate(2deg)",
                },
                "100%": {
                  top: 20,
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
          backgroundColor: "#ffcc01",
          color: "#000",
          fontWeight: 600,
          marginTop: "10px",
          borderRadius: "14px",
          textTransform: "none",
          px: 4,
          py: 0.5,
          "&:hover": {
            backgroundColor: "#e6b800",
          },
        }}
      >
        {spinning ? "Girando..." : "Girar roleta"}
      </Button>
    </Box>
  );
}
