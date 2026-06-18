"use client";

import { Box, Dialog, DialogContent, Divider, IconButton, Typography } from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import CardGiftcardRoundedIcon from "@mui/icons-material/CardGiftcardRounded";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import CloseIcon from "@mui/icons-material/Close";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { getTodayWonCoupons, todayDateKey, type WonCoupon } from "@/app/utils/rouletteHistory";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

interface SponsorCoupon {
  brand: string;
  name: string;
  image: string;
  color: string;
  benefit: string;
  code: string;
}

type SpinEntry =
  | { type: "coupon"; coupon: SponsorCoupon; time: string }
  | { type: "missed"; time: string };

const SPONSOR_COUPONS: SponsorCoupon[] = [
  { brand: "brahma",      name: "Brahma",      image: "/ads/2.png", color: "#f59e0b", benefit: "1 Brahma gelada grátis no estande",    code: "BRAHMA2026" },
  { brand: "sicoob",      name: "Sicoob",      image: "/ads/3.png", color: "#10b981", benefit: "Isenção de anuidade no 1º ano",        code: "SICOOB2026" },
  { brand: "volkswagen",  name: "Volkswagen",  image: "/ads/4.png", color: "#6366f1", benefit: "Test drive agendado + brinde especial", code: "VW2026"     },
  { brand: "ballantines", name: "Ballantines", image: "/ads/5.png", color: "#ec4899", benefit: "Dose exclusiva no estande Ballantines", code: "BALL2026"   },
  { brand: "globo",       name: "Globo",       image: "/ads/1.png", color: "#3b82f6", benefit: "1 mês grátis de Globoplay Premium",    code: "GLOBO2026"  },
];

const WEEK_DAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTHS    = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mockTime(seed: number, spinIndex: number): string {
  const baseHour = 14 + (seed % 6);
  const minutes = [7, 34, 52][spinIndex] ?? 15;
  return `${String(baseHour + spinIndex).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function mockSpinsForDate(d: Date): SpinEntry[] {
  const seed = d.getDate() + d.getMonth() * 31;
  const pattern = seed % 10;
  const c = (offset: number) => SPONSOR_COUPONS[(seed + offset) % 5];
  const t = (i: number) => mockTime(seed, i);

  // pattern 0-6 → 3 ganhos; 7-8 → 2 ganhos + 1 miss; 9 → 1 ganho + 2 miss
  if (pattern <= 6) {
    return [
      { type: "coupon", coupon: c(0), time: t(0) },
      { type: "coupon", coupon: c(2), time: t(1) },
      { type: "coupon", coupon: c(4), time: t(2) },
    ];
  }
  if (pattern <= 8) {
    return [
      { type: "coupon", coupon: c(0), time: t(0) },
      { type: "coupon", coupon: c(3), time: t(1) },
      { type: "missed",               time: t(2) },
    ];
  }
  return [
    { type: "coupon", coupon: c(1), time: t(0) },
    { type: "missed",               time: t(1) },
    { type: "missed",               time: t(2) },
  ];
}

export default function CuponsPage() {
  const router = useRouter();
  const todayKey = todayDateKey();

  const calendarDays = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 10 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return d;
    });
  }, []);

  const [selectedKey, setSelectedKey] = useState<string>(todayKey);
  const [todayCoupons, setTodayCoupons] = useState<WonCoupon[]>([]);
  const [qrCoupon, setQrCoupon] = useState<SponsorCoupon | WonCoupon | null>(null);

  useEffect(() => {
    setTodayCoupons(getTodayWonCoupons());
  }, []);

  const selectedDate = useMemo(
    () => calendarDays.find((d) => dateKey(d) === selectedKey) ?? calendarDays[0],
    [selectedKey, calendarDays],
  );

  const selectedIndex = calendarDays.findIndex((d) => dateKey(d) === selectedKey);

  const spins: SpinEntry[] = useMemo(() => {
    if (selectedKey === todayKey) {
      return todayCoupons.map((c) => ({
        type: "coupon" as const,
        coupon: c as SponsorCoupon,
        time: new Date(c.wonAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      }));
    }
    return mockSpinsForDate(selectedDate);
  }, [selectedKey, todayKey, todayCoupons, selectedDate]);

  const wonCount = spins.filter((s) => s.type === "coupon").length;

  return (
    <Box sx={{ ...dashboardBackgroundSx, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <Box
        sx={{
          display: "flex", alignItems: "center", gap: 1.5,
          px: 2, py: 2,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          position: "sticky", top: 0, zIndex: 10,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(16px)",
        }}
      >
        <IconButton onClick={() => router.push("/pages/user/home?tab=roleta")} size="small" sx={{ color: "#fff", "&:hover": { background: "rgba(255,255,255,0.08)" } }}>
          <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <CardGiftcardRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
        <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>
          Histórico de cupons
        </Typography>
      </Box>

      {/* Mini calendário */}
      <Box sx={{ px: 2.5, pt: 3, pb: 0, maxWidth: 600, width: "100%", mx: "auto" }}>
        <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", mb: 1.5 }}>
          Selecione o dia
        </Typography>

        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
          {calendarDays.map((d) => {
            const key = dateKey(d);
            const isSelected = key === selectedKey;
            const isToday = key === todayKey;
            return (
              <Box
                key={key}
                onClick={() => setSelectedKey(key)}
                sx={{
                  flexShrink: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5,
                  width: 52, py: 1.25,
                  borderRadius: 2.5,
                  cursor: "pointer",
                  border: isSelected ? "1.5px solid rgba(255,255,255,0.7)" : "1.5px solid rgba(255,255,255,0.1)",
                  background: isSelected ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.3)",
                  transition: "all 0.15s",
                }}
              >
                <Typography sx={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.35)", fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase" }}>
                  {isToday ? "hoje" : WEEK_DAYS[d.getDay()]}
                </Typography>
                <Typography sx={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.65)", fontSize: "1.1rem", fontWeight: 900, lineHeight: 1 }}>
                  {d.getDate()}
                </Typography>
                <Typography sx={{ color: isSelected ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)", fontSize: "0.6rem" }}>
                  {MONTHS[d.getMonth()]}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Conteúdo do dia selecionado */}
      <Box sx={{ flex: 1, px: 2.5, pt: 2.5, pb: 4, maxWidth: 600, width: "100%", mx: "auto" }}>

        {/* Título do dia */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1rem" }}>
            {selectedIndex === 0 ? "Hoje" : selectedIndex === 1 ? "Ontem" : `${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]}`}
          </Typography>
          <Box sx={{ px: 1.25, py: 0.3, borderRadius: "999px", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", fontWeight: 700 }}>
              {wonCount} {wonCount === 1 ? "cupom ganho" : "cupons ganhos"}
            </Typography>
          </Box>
        </Box>

        {spins.length === 0 ? (
          /* Hoje sem giros */
          <Box
            sx={{
              borderRadius: 3,
              border: "1px dashed rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.3)",
              py: 5,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
            }}
          >
            <CardGiftcardOutlinedIcon sx={{ color: "rgba(255,255,255,0.18)", fontSize: 36 }} />
            <Typography sx={{ color: "rgba(255,255,255,0.28)", fontSize: "0.85rem", fontWeight: 600 }}>
              Nenhum cupom ainda
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.18)", fontSize: "0.76rem" }}>
              Gire a roleta para ganhar brindes hoje!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.09)", background: "rgba(0,0,0,0.35)", overflow: "hidden" }}>
            {spins.map((entry, ci) => (
              <Box key={ci}>
                {ci > 0 && <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />}

                {entry.type === "missed" ? (
                  /* Tentativa sem ganho */
                  <Box
                    sx={{
                      display: "flex", alignItems: "center", gap: 1.75,
                      px: 2, py: 1.75,
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 46, height: 46, borderRadius: 1.5, flexShrink: 0,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <ReplayRoundedIcon sx={{ color: "rgba(255,255,255,0.25)", fontSize: 22 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ color: "rgba(255,255,255,0.35)", fontWeight: 700, fontSize: "0.88rem" }}>
                        Tente novamente
                      </Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.72rem", mt: 0.2 }}>
                        Tentativa sem prêmio · {entry.time}
                      </Typography>
                    </Box>
                    <Box sx={{ px: 1.25, py: 0.4, borderRadius: 1.5, border: "1px dashed rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}>
                      <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7rem", fontWeight: 700 }}>
                        Sem cupom
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  /* Cupom ganho */
                  <Box
                    onClick={() => setQrCoupon(entry.coupon)}
                    sx={{
                      display: "flex", alignItems: "center", gap: 1.75,
                      px: 2, py: 1.75,
                      cursor: "pointer",
                      background: `linear-gradient(90deg, ${entry.coupon.color}0e 0%, transparent 60%)`,
                      "&:active": { background: `linear-gradient(90deg, ${entry.coupon.color}22 0%, rgba(255,255,255,0.03) 60%)` },
                    }}
                  >
                    <Box
                      component="img"
                      src={entry.coupon.image}
                      alt={entry.coupon.name}
                      sx={{ width: 46, height: 46, objectFit: "cover", borderRadius: 1.5, flexShrink: 0, border: `1px solid ${entry.coupon.color}44` }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2 }}>
                        {entry.coupon.name}
                      </Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.42)", fontSize: "0.72rem", mt: 0.25 }}>
                        {entry.time}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                      <Box sx={{ px: 1.25, py: 0.5, borderRadius: 1.5, border: `1.5px dashed ${entry.coupon.color}66`, background: `${entry.coupon.color}12` }}>
                        <Typography sx={{ color: entry.coupon.color, fontWeight: 900, fontSize: "0.72rem", letterSpacing: "0.06em" }}>
                          {entry.coupon.code}
                        </Typography>
                      </Box>
                      <QrCode2Icon sx={{ color: "rgba(255,255,255,0.3)", fontSize: 20 }} />
                    </Box>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Modal QR Code */}
      <Dialog
        open={Boolean(qrCoupon)}
        onClose={() => setQrCoupon(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(12,12,18,0.98)",
            backdropFilter: "blur(24px)",
            border: qrCoupon ? `1px solid ${qrCoupon.color}44` : "1px solid rgba(255,255,255,0.1)",
            borderRadius: 4,
            overflow: "hidden",
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <IconButton
            onClick={() => setQrCoupon(null)}
            size="small"
            sx={{ position: "absolute", top: 10, right: 10, zIndex: 10, color: "#fff", background: "rgba(0,0,0,0.45)", "&:hover": { background: "rgba(0,0,0,0.65)" } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {qrCoupon && (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 3, gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, alignSelf: "stretch" }}>
                <Box
                  component="img"
                  src={qrCoupon.image}
                  alt={qrCoupon.name}
                  sx={{ width: 44, height: 44, objectFit: "cover", borderRadius: 1.5, border: `1px solid ${qrCoupon.color}44` }}
                />
                <Box>
                  <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1rem" }}>
                    {qrCoupon.name}
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.78rem" }}>
                    {qrCoupon.benefit}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  p: 2.5, borderRadius: 3,
                  background: "#fff",
                  border: `3px solid ${qrCoupon.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <QRCode
                  value={`DIVERTI:${qrCoupon.code}:${qrCoupon.brand.toUpperCase()}`}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#111111"
                  level="M"
                />
              </Box>

              <Box sx={{ px: 2, py: 1, borderRadius: 2, border: `1.5px dashed ${qrCoupon.color}66`, background: `${qrCoupon.color}12` }}>
                <Typography sx={{ color: qrCoupon.color, fontWeight: 900, fontSize: "1.1rem", letterSpacing: "0.1em", textAlign: "center" }}>
                  {qrCoupon.code}
                </Typography>
              </Box>

              <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.72rem", textAlign: "center" }}>
                Apresente este QR Code no estande da marca
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
