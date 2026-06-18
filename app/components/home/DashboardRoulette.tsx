"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Card, CardContent, Chip, Dialog, DialogContent, IconButton, Skeleton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AdBanner from "@/app/components/ads/AdBanner";
import { getPrizesByEvent } from "@/app/services/roulette/rouletteService";
import VideoModal from "@/app/components/home/VideoModal";

interface SponsorCoupon {
  id: number;
  brand: string;
  name: string;
  image: string;
  color: string;
  benefit: string;
  code: string;
  tag: string;
  expiry: string;
}

const SPONSOR_COUPONS: SponsorCoupon[] = [
  { id: -1, brand: "brahma",      name: "Brahma",      image: "/ads/2.png", color: "#f59e0b", benefit: "1 Brahma gelada grátis no estande",    code: "BRAHMA2026",  tag: "Brinde",    expiry: "Válido até 17/08/2026" },
  { id: -2, brand: "sicoob",      name: "Sicoob",      image: "/ads/3.png", color: "#10b981", benefit: "Isenção de anuidade no 1º ano",        code: "SICOOB2026",  tag: "Exclusivo", expiry: "Válido até 31/12/2026" },
  { id: -3, brand: "volkswagen",  name: "Volkswagen",  image: "/ads/4.png", color: "#6366f1", benefit: "Test drive agendado + brinde especial", code: "VW2026",      tag: "Brinde",    expiry: "Válido até 30/09/2026" },
  { id: -4, brand: "ballantines", name: "Ballantines", image: "/ads/5.png", color: "#ec4899", benefit: "Dose exclusiva no estande Ballantines", code: "BALL2026",    tag: "Brinde",    expiry: "Válido até 17/08/2026" },
  { id: -5, brand: "globo",       name: "Globo",       image: "/ads/1.png", color: "#3b82f6", benefit: "1 mês grátis de Globoplay Premium",    code: "GLOBO2026",   tag: "30 dias",   expiry: "Válido até 31/10/2026" },
];

interface Props {
  eventId: number;
}

const MAX_SPINS = 3;

const DashboardRoulette: React.FC<Props> = ({ eventId }) => {
  const router = useRouter();
  const [spinCount, setSpinCount] = useState<number | null>(null);
  const [loadingPrizes, setLoadingPrizes] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<SponsorCoupon | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const key = `roulette-spin-count-${eventId}`;
    const stored = typeof window !== "undefined" ? Number(sessionStorage.getItem(key) ?? "0") : 0;
    setSpinCount(Number.isFinite(stored) ? stored : 0);
  }, [eventId]);

  useEffect(() => {
    let isMounted = true;

    const loadPrizes = async () => {
      setLoadingPrizes(true);
      try { await getPrizesByEvent(eventId); } catch { /* ignora — usando cupons dos patrocinadores */ }
      if (isMounted) setLoadingPrizes(false);
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
              background: "#ffffff",
              color: "#111111",
              fontWeight: 700,
              borderRadius: "14px",
              textTransform: "none",
              px: 4,
              py: 1.6,
              fontSize: { xs: "1.05rem", md: "1.1rem" },
              "&:hover": {
                background: "#e8e8e8",
              },
            }}
          >
            Ganhar brinde
          </Button>

          {/* Cupons dos patrocinadores */}
          <Box
            sx={{
              borderRadius: 3,
              p: { xs: 2, md: 2.5 },
              background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.04) 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Typography sx={{ color: "#fff", fontSize: { xs: "1.05rem", md: "1.15rem" }, fontWeight: 800, mb: 0.75 }}>
              Cupons dos patrocinadores
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.68)", fontSize: "0.92rem", mb: 2 }}>
              Gire a roleta para ganhar um desses cupons exclusivos das marcas parceiras.
            </Typography>

            {loadingPrizes ? (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1.5 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} variant="rounded" height={88} sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: 3 }} />
                ))}
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {SPONSOR_COUPONS.map((coupon) => (
                  <Box
                    key={coupon.id}
                    onClick={() => setSelectedCoupon(coupon)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      borderRadius: 3,
                      p: 1.5,
                      background: `linear-gradient(135deg, ${coupon.color}14, ${coupon.color}08)`,
                      border: `1px solid ${coupon.color}44`,
                      cursor: "pointer",
                      transition: "transform 0.18s, box-shadow 0.18s",
                      "&:hover": { transform: "translateY(-2px)", boxShadow: `0 8px 24px ${coupon.color}33` },
                    }}
                  >
                    <Box
                      component="img"
                      src={coupon.image}
                      alt={coupon.name}
                      sx={{ width: 52, height: 52, objectFit: "cover", borderRadius: 2, flexShrink: 0, border: `1px solid ${coupon.color}44` }}
                    />
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>
                      {coupon.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
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

      <Dialog
        open={Boolean(selectedCoupon)}
        onClose={() => { setSelectedCoupon(null); setCopiedCode(false); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(15,15,20,0.97)",
            backdropFilter: "blur(20px)",
            border: selectedCoupon ? `1px solid ${selectedCoupon.color}44` : "1px solid rgba(255,255,255,0.12)",
            borderRadius: 4,
            overflow: "hidden",
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <IconButton
            onClick={() => { setSelectedCoupon(null); setCopiedCode(false); }}
            sx={{ position: "absolute", top: 10, right: 10, zIndex: 10, color: "#fff", backgroundColor: "rgba(0,0,0,0.45)", "&:hover": { backgroundColor: "rgba(0,0,0,0.65)" } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {selectedCoupon && (
            <>
              {/* Header com imagem */}
              <Box sx={{ width: "100%", height: 160, background: `linear-gradient(135deg, ${selectedCoupon.color}22, ${selectedCoupon.color}08)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <Box component="img" src={selectedCoupon.image} alt={selectedCoupon.name} sx={{ width: 110, height: 110, objectFit: "cover", borderRadius: 3, border: `2px solid ${selectedCoupon.color}66`, boxShadow: `0 0 32px ${selectedCoupon.color}44` }} />
              </Box>

              <Box sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.2rem" }}>{selectedCoupon.name}</Typography>
                  <Chip label={selectedCoupon.tag} size="small" sx={{ backgroundColor: `${selectedCoupon.color}22`, color: selectedCoupon.color, fontWeight: 700, fontSize: "0.65rem", border: `1px solid ${selectedCoupon.color}44` }} />
                </Box>
                <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem", mb: 2.5, lineHeight: 1.5 }}>{selectedCoupon.benefit}</Typography>

                {/* Código do cupom */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 2,
                    borderRadius: 2.5,
                    border: `2px dashed ${selectedCoupon.color}66`,
                    background: `${selectedCoupon.color}0d`,
                    mb: 1.5,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(selectedCoupon.code).catch(() => {});
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                >
                  <Box>
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.3 }}>Código do cupom</Typography>
                    <Typography sx={{ color: selectedCoupon.color, fontWeight: 900, fontSize: "1.3rem", letterSpacing: "0.1em" }}>{selectedCoupon.code}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: copiedCode ? "#10b981" : "rgba(255,255,255,0.4)" }}>
                    <ContentCopyIcon sx={{ fontSize: 18 }} />
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 600 }}>{copiedCode ? "Copiado!" : "Copiar"}</Typography>
                  </Box>
                </Box>

                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", mb: 2.5, textAlign: "center" }}>{selectedCoupon.expiry}</Typography>

                <Button
                  fullWidth
                  onClick={() => { setSelectedCoupon(null); setCopiedCode(false); }}
                  sx={{ backgroundColor: "#ffffff", color: "#111111", fontWeight: 700, borderRadius: "12px", textTransform: "none", py: 1.4, "&:hover": { backgroundColor: "#e8e8e8" } }}
                >
                  Fechar
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardRoulette;
