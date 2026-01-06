"use client";

import { Box, Typography, Button, Modal } from "@mui/material";
import { useParams } from "next/navigation";
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
  const params = useParams();
  const eventId = Number(params.eventId);
  const [prize, setPrize] = useState<{
    name: string;
    image?: string;
  } | null>(null);

  const spinToPosition = (position: number | string) => {
    const pos = Number(position);

    if (Number.isNaN(pos)) {
      console.error("Position inválida:", position);
      return;
    }

    const spins = 6; // voltas completas
    const finalAngle =
      spins * 360 + (360 - pos * SLICE_ANGLE - SLICE_ANGLE / 2);

    setRotation(finalAngle); // ✅ SEM prev
  };

  console.log("Rotação atual:", rotation);

  const handleSpin = async () => {
    if (spinning || !roulette) return;

    setSpinning(true);
    setRotation(0);

    try {
      const result = await spinRoulette(eventId);

      spinToPosition(result.prize.position);

      setTimeout(() => {
        setPrize({
          name: result.prize.name,
          image: result.prize.image_url,
        });
        setSpinning(false);
      }, 4000);
    } catch (err) {
      console.error("Erro ao girar roleta", err);
      setSpinning(false);
    }
  };
  useEffect(() => {
    if (!eventId) return;

    const loadRoulette = async () => {
      try {
        const data = await getRouletteByEvent(eventId);
        setRoulette(data);
      } catch (err) {
        console.error("Erro ao carregar roleta", err);
      }
    };

    loadRoulette();
  }, [eventId]);

  if (!roulette) {
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
          borderRadius: "20px",
          px: 4,
          py: 1.5,
          fontWeight: 700,
          textTransform: "none",
        }}
      >
        {spinning ? "Girando..." : "Girar roleta"}
      </Button>

      {/* MODAL DO PRÊMIO */}
      <Modal open={!!prize} onClose={() => setPrize(null)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "#111",
            color: "#fff",
            p: 3,
            borderRadius: 2,
            textAlign: "center",
            width: 280,
          }}
        >
          <Typography variant="h6" mb={2}>
            🎉 Você ganhou!
          </Typography>

          {prize?.image && (
            <Box
              component="img"
              src={prize.image}
              sx={{ width: "100%", borderRadius: 2, mb: 2 }}
            />
          )}

          <Typography fontWeight={700}>{prize?.name}</Typography>
        </Box>
      </Modal>
    </Box>
  );
}
