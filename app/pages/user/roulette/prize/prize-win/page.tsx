"use client";

import { Box, Typography, Button, Skeleton } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

const pageBackgroundSx = {
  minHeight: "100vh",
  backgroundImage: "url(/background/fundopftbrinde.png)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  overflow: "hidden",
};

const particleSx = [
  {
    width: 140,
    height: 140,
    top: "10%",
    left: "8%",
    animation: "floatParticleOne 7s ease-in-out infinite",
    background: "radial-gradient(circle, rgba(255,31,33,0.38) 0%, rgba(255,31,33,0) 70%)",
  },
  {
    width: 180,
    height: 180,
    top: "15%",
    right: "5%",
    animation: "floatParticleTwo 8s ease-in-out infinite",
    background: "radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 70%)",
  },
  {
    width: 110,
    height: 110,
    bottom: "18%",
    left: "12%",
    animation: "floatParticleThree 6.5s ease-in-out infinite",
    background: "radial-gradient(circle, rgba(255,31,33,0.28) 0%, rgba(255,31,33,0) 70%)",
  },
  {
    width: 150,
    height: 150,
    bottom: "8%",
    right: "10%",
    animation: "floatParticleOne 9s ease-in-out infinite",
    background: "radial-gradient(circle, rgba(255,31,33,0.24) 0%, rgba(255,31,33,0) 70%)",
  },
];

function PrizeWinContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [prize, setPrize] = useState<{
    id: string | null;
    name: string | null;
    image_url?: string | null;
    position: string | null;
  } | null>(null);

  useEffect(() => {
    const prizeId = params.get("prize_id");
    const prizeName = params.get("prize_name");
    const prizeImage = params.get("prize_image");
    const prizePosition = params.get("prize_position");

    if (!prizeName) {
      router.replace("/pages/user/home");
      return;
    }

    setPrize({
      id: prizeId,
      name: prizeName,
      image_url: prizeImage,
      position: prizePosition,
    });
  }, [params, router]);

  const normalizedPrizeName = prize?.name?.trim().toLowerCase() || "";
  const isNoPrizeResult =
    normalizedPrizeName === "não foi dessa vez" ||
    normalizedPrizeName === "nao foi dessa vez";

  if (!prize) {
    return (
      <Box
        sx={{
          ...pageBackgroundSx,
        }}
      >
        {particleSx.map((particle, index) => (
          <Box
            key={index}
            sx={{
              position: "absolute",
              borderRadius: "50%",
              filter: "blur(12px)",
              ...particle,
            }}
          />
        ))}
        <Box
          sx={{
            width: "100%",
            maxWidth: "460px",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            px: 3,
            py: 5,
          }}
        >
          <Box
            sx={{
              width: "100%",
              borderRadius: 6,
              p: { xs: 3, md: 4 },
              background: "linear-gradient(180deg, rgba(22,22,22,0.72) 0%, rgba(0,0,0,0.62) 100%)",
              border: "1px solid rgba(255,255,255,0.16)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 18px 48px rgba(0,0,0,0.38)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Skeleton
              variant="text"
              sx={{
                width: 130,
                height: 36,
                mb: 1,
                bgcolor: "rgba(255,255,255,0.16)",
              }}
            />
            <Skeleton
              variant="text"
              sx={{
                width: 220,
                height: 48,
                mb: 1,
                bgcolor: "rgba(255,255,255,0.16)",
              }}
            />
            <Skeleton
              variant="text"
              sx={{
                width: "80%",
                height: 28,
                mb: 3,
                bgcolor: "rgba(255,255,255,0.12)",
              }}
            />
            <Skeleton
              variant="rounded"
              sx={{
                width: 180,
                height: 180,
                borderRadius: 5,
                mb: 3,
                bgcolor: "rgba(255,255,255,0.16)",
              }}
            />
            <Skeleton
              variant="rounded"
              sx={{
                width: "100%",
                height: 54,
                borderRadius: "16px",
                bgcolor: "rgba(255,31,33,0.28)",
              }}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        ...pageBackgroundSx,
        "@keyframes floatParticleOne": {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "50%": { transform: "translateY(-18px) translateX(12px)" },
        },
        "@keyframes floatParticleTwo": {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "50%": { transform: "translateY(14px) translateX(-12px)" },
        },
        "@keyframes floatParticleThree": {
          "0%, 100%": { transform: "scale(1) translateY(0px)" },
          "50%": { transform: "scale(1.08) translateY(-10px)" },
        },
        "@keyframes cardEntrance": {
          "0%": { opacity: 0, transform: "translateY(36px) scale(0.96)" },
          "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        "@keyframes prizeFloat": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "@keyframes glowPulse": {
          "0%, 100%": { boxShadow: "0 0 0 rgba(255,31,33,0.0), 0 16px 36px rgba(0,0,0,0.32)" },
          "50%": { boxShadow: "0 0 28px rgba(255,31,33,0.28), 0 16px 36px rgba(0,0,0,0.42)" },
        },
      }}
    >
      {particleSx.map((particle, index) => (
        <Box
          key={index}
          sx={{
            position: "absolute",
            borderRadius: "50%",
            filter: "blur(12px)",
            ...particle,
          }}
        />
      ))}

      <Box
        sx={{
          width: "100%",
          maxWidth: "460px",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: 3,
          py: 5,
        }}
      >
        <Box
          sx={{
            width: "100%",
            borderRadius: 6,
            p: { xs: 3, md: 4 },
            background: "linear-gradient(180deg, rgba(28,28,28,0.76) 0%, rgba(0,0,0,0.62) 100%)",
            border: "1px solid rgba(255,255,255,0.16)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 20px 56px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            animation: "cardEntrance 0.6s ease-out",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(255,31,33,0.16) 0%, rgba(255,255,255,0.04) 36%, rgba(255,31,33,0.08) 100%)",
              pointerEvents: "none",
            }}
          />

          <Box
            sx={{
              px: 2,
              py: 0.8,
              borderRadius: "999px",
              backgroundColor: isNoPrizeResult
                ? "rgba(255,255,255,0.1)"
                : "rgba(255,31,33,0.14)",
              border: "1px solid rgba(255,31,33,0.35)",
              color: isNoPrizeResult ? "#fff" : "rgb(255, 31, 33)",
              fontWeight: 700,
              fontSize: "0.82rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              mb: 2,
            }}
          >
            {isNoPrizeResult ? "Tente novamente" : "Premio desbloqueado"}
          </Box>

          <Typography
            sx={{
              color: "#fff",
              fontSize: { xs: "2rem", md: "2.4rem" },
              fontWeight: 900,
              lineHeight: 1,
              mb: 1,
              textShadow: "0 4px 20px rgba(0,0,0,0.45)",
            }}
          >
            {isNoPrizeResult ? "Não foi dessa vez" : "Você ganhou!"}
          </Typography>

          <Typography
            sx={{
              color: "rgba(255,255,255,0.84)",
              fontSize: { xs: "0.95rem", md: "1rem" },
              mb: 3,
              maxWidth: 280,
            }}
          >
            {isNoPrizeResult
              ? "Mas sua sorte pode mudar no proximo giro. Continue tentando para ganhar um brinde."
              : "Você ganhou esse cupom. Resgate agora e aproveite seu brinde."}
          </Typography>

          <Box
            sx={{
              width: "100%",
              maxWidth: 220,
              aspectRatio: "1 / 1",
              borderRadius: 5,
              mb: 3,
              p: 2,
              background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.08) 100%)",
              border: "1px solid rgba(255,255,255,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "prizeFloat 3.2s ease-in-out infinite, glowPulse 2.8s ease-in-out infinite",
            }}
          >
            {prize.image_url ? (
              <Box
                component="img"
                src={prize.image_url}
                alt={prize.name || "Prêmio"}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  filter: "drop-shadow(0 12px 20px rgba(0,0,0,0.35))",
                }}
              />
            ) : (
              <Typography sx={{ color: "#fff", fontWeight: 700 }}>
                Seu brinde
              </Typography>
            )}
          </Box>

          <Typography
            sx={{
              color: "#fff",
              fontSize: { xs: "1.35rem", md: "1.6rem" },
              fontWeight: 800,
              mb: 1,
            }}
          >
            {prize.name}
          </Typography>

        

          <Button
            variant="contained"
            size="large"
            onClick={() => router.push("/pages/user/home")}
            sx={{
              width: "100%",
              minHeight: 54,
              borderRadius: "16px",
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: 800,
              color: "#fff",
              background: "linear-gradient(180deg, rgb(255, 46, 48) 0%, rgb(255, 31, 33) 100%)",
              boxShadow: "0 10px 24px rgba(255, 31, 33, 0.28)",
              "&:hover": {
                background: "linear-gradient(180deg, rgb(255, 61, 63) 0%, rgb(220, 20, 22) 100%)",
                boxShadow: "0 14px 30px rgba(255, 31, 33, 0.38)",
              },
            }}
          >
            {isNoPrizeResult ? "Voltar para home" : "Resgatar cupom"}
          </Button>

          <Button
            onClick={() => router.push("/pages/user/home")}
            sx={{
              mt: 1.5,
              color: "rgba(255,255,255,0.82)",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Voltar
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default function PrizeWinPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            ...pageBackgroundSx,
          }}
        >
          <Typography color="white">Carregando...</Typography>
        </Box>
      }
    >
      <PrizeWinContent />
    </Suspense>
  );
}


