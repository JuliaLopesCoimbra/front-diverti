"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Card, CardContent, Skeleton, Typography } from "@mui/material";
import AdBanner from "@/app/components/ads/AdBanner";
import { getPrizesByEvent, PrizeResponse } from "@/app/services/roulette/rouletteService";
import VideoModal from "@/app/components/home/VideoModal";

interface Props {
  eventId: number;
}

const MAX_SPINS = 3;

const DashboardRoulette: React.FC<Props> = ({ eventId }) => {
  const router = useRouter();
  const [spinCount, setSpinCount] = useState<number | null>(null);
  const [prizes, setPrizes] = useState<PrizeResponse[]>([]);
  const [loadingPrizes, setLoadingPrizes] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const key = `roulette-spin-count-${eventId}`;
    const stored = typeof window !== "undefined" ? Number(sessionStorage.getItem(key) ?? "0") : 0;
    setSpinCount(Number.isFinite(stored) ? stored : 0);
  }, [eventId]);

  useEffect(() => {
    let isMounted = true;

    const loadPrizes = async () => {
      setLoadingPrizes(true);
      try {
        const data = await getPrizesByEvent(eventId);
        if (!isMounted) return;

        const filtered = data
          .filter(
            (prize) =>
              prize.is_active &&
              prize.name.trim().toLowerCase() !== "não foi dessa vez" &&
              prize.name.trim().toLowerCase() !== "nao foi dessa vez"
          )
          .sort((a, b) => a.position - b.position);

        // Deduplica por image_url (cada marca tem 2 prêmios com a mesma imagem)
        const seen = new Set<string>();
        const unique = filtered.filter((prize) => {
          const key = prize.image_url ?? `name:${prize.name}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setPrizes(unique);
      } catch (error) {
        console.error("Erro ao carregar brindes da roleta:", error);
        if (isMounted) setPrizes([]);
      } finally {
        if (isMounted) setLoadingPrizes(false);
      }
    };

    loadPrizes();

    return () => { isMounted = false; };
  }, [eventId]);

  const spinsUsed = spinCount ?? 0;

  const handleVideoComplete = useCallback(() => {
    router.push(`/pages/user/roulette/${eventId}`);
  }, [router, eventId]);

  const midnightLabel = useMemo(() => {
    const midnight = new Date();
    midnight.setHours(23, 59, 0, 0);
    return midnight.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }, []);

  return (
    <>
    <Box
      sx={{
        width: "100%",
        maxWidth: 800,
        mx: "auto",
        px: { xs: 2, md: 3 },
        pb: { xs: 4, md: 5 },
      }}
    >
      <Card
        sx={{
          background: "rgba(0, 0, 0, 0.45)",
          border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: 4,
          boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
          backdropFilter: "blur(10px)",
        }}
      >
        <CardContent
          sx={{
            p: { xs: 3, md: 4 },
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Box
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <AdBanner isFirst={true} eventId={eventId} />
          </Box>

          <Box sx={{ textAlign: "center", py: 1 }}>
            <Typography
              sx={{
                fontSize: { xs: "0.7rem", md: "0.75rem" },
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255, 80, 82, 0.9)",
                mb: 0.75,
              }}
            >
              Exclusivo para voce
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: "1.75rem", md: "2.1rem" },
                fontWeight: 900,
                lineHeight: 1.1,
                background: "linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.75) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                mb: 1,
              }}
            >
              Ganhe cupons e<br />brindes das marcas!
            </Typography>

            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                background: "rgba(255, 31, 33, 0.15)",
                border: "1px solid rgba(255, 31, 33, 0.35)",
                borderRadius: "999px",
                px: 2,
                py: 0.6,
              }}
            >
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#ff2e30",
                  boxShadow: "0 0 6px #ff2e30",
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                }}
              >
                {MAX_SPINS} giros disponiveis hoje
              </Typography>
            </Box>
          </Box>

          {/* Contador de tentativas */}
          <Box
            sx={{
              borderRadius: 3,
              p: 2.5,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box>
              <Typography sx={{ color: "rgba(255,255,255,0.7)", mb: 0.5, fontSize: "0.9rem" }}>
                Tentativas usadas
              </Typography>
              <Typography
                sx={{
                  color: "#fff",
                  fontSize: { xs: "2.6rem", md: "3rem" },
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                {spinCount === null ? (
                  <Skeleton sx={{ bgcolor: "rgba(255,255,255,0.12)", width: 80, height: 48 }} />
                ) : (
                  `${spinsUsed}/${MAX_SPINS}`
                )}
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem", mt: -1.5 }}>
            Voce tem ate as {midnightLabel} para girar suas {MAX_SPINS} tentativas.
          </Typography>

          {/* Botão girar - acima dos brindes para ficar visível sem scroll */}
          <Button
            variant="contained"
            onClick={() => setShowVideo(true)}
            sx={{
              alignSelf: "stretch",
              background: "linear-gradient(180deg, rgb(255, 46, 48) 0%, rgb(255, 31, 33) 100%)",
              color: "#fff",
              fontWeight: 700,
              borderRadius: "14px",
              textTransform: "none",
              px: 4,
              py: 1.6,
              fontSize: { xs: "1.05rem", md: "1.1rem" },
              "&:hover": {
                background: "linear-gradient(180deg, rgb(255, 61, 63) 0%, rgb(220, 20, 22) 100%)",
              },
            }}
          >
            Ganhar brinde
          </Button>

          {/* Brindes disponíveis */}
          <Box
            sx={{
              borderRadius: 3,
              p: { xs: 2, md: 2.5 },
              background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.04) 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Typography
              sx={{
                color: "#fff",
                fontSize: { xs: "1.05rem", md: "1.15rem" },
                fontWeight: 800,
                mb: 0.75,
              }}
            >
              Brindes que podem sair na sua roleta
            </Typography>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.68)",
                fontSize: "0.92rem",
                mb: 2,
              }}
            >
              Veja alguns premios disponiveis e gire agora para tentar a sorte.
            </Typography>

            {loadingPrizes ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                  gap: 1.5,
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <Box
                    key={item}
                    sx={{
                      borderRadius: 3,
                      p: 1.5,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Skeleton
                      variant="rounded"
                      sx={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        borderRadius: 2.5,
                        bgcolor: "rgba(255,255,255,0.12)",
                        mb: 1,
                      }}
                    />
                    <Skeleton
                      variant="text"
                      sx={{ width: "85%", height: 24, bgcolor: "rgba(255,255,255,0.12)" }}
                    />
                  </Box>
                ))}
              </Box>
            ) : prizes.length > 0 ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                  gap: 1.5,
                }}
              >
                {prizes.map((prize) => (
                  <Box
                    key={prize.id}
                    sx={{
                      borderRadius: 3,
                      p: 1.5,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        borderColor: "rgba(255, 31, 33, 0.45)",
                        boxShadow: "0 12px 24px rgba(0,0,0,0.25)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        borderRadius: 2.5,
                        background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1,
                        overflow: "hidden",
                      }}
                    >
                      {prize.image_url ? (
                        <Box
                          component="img"
                          src={prize.image_url}
                          alt={prize.name}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            p: 1.25,
                          }}
                        />
                      ) : (
                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>
                          Brinde
                        </Typography>
                      )}
                    </Box>

                    <Typography
                      sx={{
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "0.92rem",
                        lineHeight: 1.3,
                      }}
                    >
                      {prize.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography sx={{ color: "rgba(255,255,255,0.68)" }}>
                Os brindes da roleta ainda nao foram cadastrados para este evento.
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>

      {showVideo && (
        <VideoModal
          src="/video/coca.mp4"
          onComplete={handleVideoComplete}
        />
      )}
    </>
  );
};

export default DashboardRoulette;
