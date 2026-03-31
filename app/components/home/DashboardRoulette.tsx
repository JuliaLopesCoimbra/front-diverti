"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Card, CardContent, Skeleton, Typography } from "@mui/material";
import AdBanner from "@/app/components/ads/AdBanner";
import { getPrizesByEvent, PrizeResponse } from "@/app/services/roulette/rouletteService";

interface Props {
  eventId: number;
}

const RESET_INTERVAL_MS = 3 * 60 * 60 * 1000;

const formatTimeLeft = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

const getInitialResetAt = (storageKey: string) => {
  const now = Date.now();
  const storedValue = typeof window !== "undefined" ? Number(localStorage.getItem(storageKey)) : NaN;

  if (Number.isFinite(storedValue) && storedValue > now) {
    return storedValue;
  }

  const nextResetAt = now + RESET_INTERVAL_MS;

  if (typeof window !== "undefined") {
    localStorage.setItem(storageKey, String(nextResetAt));
  }

  return nextResetAt;
};

const DashboardRoulette: React.FC<Props> = ({ eventId }) => {
  const router = useRouter();
  const storageKey = `roulette-dashboard-reset-at-${eventId}`;
  const [resetAt, setResetAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [prizes, setPrizes] = useState<PrizeResponse[]>([]);
  const [loadingPrizes, setLoadingPrizes] = useState(true);

  useEffect(() => {
    setResetAt(getInitialResetAt(storageKey));
    setNow(Date.now());
  }, [storageKey]);

  useEffect(() => {
    if (!resetAt) return;

    const interval = window.setInterval(() => {
      const currentTime = Date.now();

      if (currentTime >= resetAt) {
        const nextResetAt = currentTime + RESET_INTERVAL_MS;
        localStorage.setItem(storageKey, String(nextResetAt));
        setResetAt(nextResetAt);
        setNow(currentTime);
        return;
      }

      setNow(currentTime);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [resetAt, storageKey]);

  useEffect(() => {
    let isMounted = true;

    const loadPrizes = async () => {
      setLoadingPrizes(true);
      try {
        const data = await getPrizesByEvent(eventId);
        if (!isMounted) return;
        setPrizes(
          data
            .filter(
              (prize) =>
                prize.is_active &&
                prize.name.trim().toLowerCase() !== "não foi dessa vez" &&
                prize.name.trim().toLowerCase() !== "nao foi dessa vez"
            )
            .sort((a, b) => a.position - b.position)
        );
      } catch (error) {
        console.error("Erro ao carregar brindes da roleta:", error);
        if (isMounted) {
          setPrizes([]);
        }
      } finally {
        if (isMounted) {
          setLoadingPrizes(false);
        }
      }
    };

    loadPrizes();

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const countdownLabel = useMemo(() => {
    if (!resetAt) return "03:00:00";
    return formatTimeLeft(resetAt - now);
  }, [now, resetAt]);

  return (
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

          <Box>
            <Typography
              variant="h5"
              sx={{
                color: "#fff",
                fontWeight: 700,
                mb: 1,
              }}
            >
              Roleta de brindes
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.82)", fontSize: { xs: "0.95rem", md: "1rem" } }}>
              Voce tem 3 tentativas de girar e ganhar brindes.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Box
              sx={{
                borderRadius: 3,
                p: 2.5,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Typography sx={{ color: "rgba(255,255,255,0.7)", mb: 1 }}>
                Tentativas por ciclo
              </Typography>
              <Typography sx={{ color: "#fff", fontSize: { xs: "2rem", md: "2.4rem" }, fontWeight: 800 }}>
                3
              </Typography>
            </Box>

            <Box
              sx={{
                borderRadius: 3,
                p: 2.5,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Typography sx={{ color: "rgba(255,255,255,0.7)", mb: 1 }}>
                Novo ciclo em
              </Typography>
              <Typography sx={{ color: "#fff", fontSize: { xs: "2rem", md: "2.4rem" }, fontWeight: 800 }}>
                {countdownLabel}
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
            A cada 3 horas suas tentativas sao renovadas para voce continuar concorrendo aos brindes.
          </Typography>

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

          <Button
            variant="contained"
            onClick={() => router.push(`/pages/user/roulette/${eventId}`)}
            sx={{
              alignSelf: { xs: "stretch", md: "flex-start" },
              background: "linear-gradient(180deg, rgb(255, 46, 48) 0%, rgb(255, 31, 33) 100%)",
              color: "#fff",
              fontWeight: 700,
              borderRadius: "14px",
              textTransform: "none",
              px: 4,
              py: 1.2,
              fontSize: { xs: "1rem", md: "1.05rem" },
              "&:hover": {
                background: "linear-gradient(180deg, rgb(255, 61, 63) 0%, rgb(220, 20, 22) 100%)",
              },
            }}
          >
            Girar agora
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardRoulette;
