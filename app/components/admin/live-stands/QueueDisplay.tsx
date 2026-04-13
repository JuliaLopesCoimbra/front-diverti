"use client";

import { useEffect, useRef, useState } from "react";
import { Box, IconButton, LinearProgress, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PeopleIcon from "@mui/icons-material/People";
import { LiveStandSessionResponse } from "@/app/services/liveStands/liveStandSessionService";

// ─── Config ──────────────────────────────────────────────────────────────────

const INTERVAL_SECONDS = 300; // 5 minutes

// Mock queue — replace with real bookings (sorted by queue_position) when API is ready
const MOCK_QUEUE = [
  "Ana Clara Souza",
  "Bruno Ferreira",
  "Carlos Eduardo Lima",
  "Daniela Santos",
  "Eduardo Oliveira",
  "Fernanda Costa",
  "Gabriel Mendes",
  "Helena Rodrigues",
  "Igor Nascimento",
  "Julia Alves",
  "Kevin Barbosa",
  "Laura Pereira",
  "Marcos Vinicius",
  "Natalia Gomes",
  "Otavio Carvalho",
  "Patricia Moreira",
  "Rafael Andrade",
  "Sabrina Castro",
  "Thiago Ribeiro",
  "Valentina Dias",
].map((name, i) => ({ position: i + 1, name }));

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  session: LiveStandSessionResponse | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QueueDisplay({ open, onClose, session }: Props) {
  const [currentBatch, setCurrentBatch] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INTERVAL_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalBatches = Math.ceil(MOCK_QUEUE.length / 3);
  const currentGroup = MOCK_QUEUE.slice(currentBatch * 3, currentBatch * 3 + 3);
  const nextBatch = (currentBatch + 1) % totalBatches;
  const nextGroup = MOCK_QUEUE.slice(nextBatch * 3, nextBatch * 3 + 3);

  // Timer
  useEffect(() => {
    if (!open) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCurrentBatch(0);
      setTimeLeft(INTERVAL_SECONDS);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCurrentBatch((b) => (b + 1) % totalBatches);
          return INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, totalBatches]);

  if (!open || !session) return null;

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const progress = ((INTERVAL_SECONDS - timeLeft) / INTERVAL_SECONDS) * 100;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        backgroundColor: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.5,
          pt: { xs: 3, md: 2.5 },
          pb: 2,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src="/logo/rockinrio.png"
          alt="Rock in Rio"
          sx={{ height: { xs: 34, md: 42 }, objectFit: "contain" }}
        />
        <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: { xs: "0.95rem", md: "1.1rem" } }}>
          Controle de Fila
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#fff" } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* ── Body ── */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: { xs: 2, md: 0 },
          py: 3,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          maxWidth: 560,
          mx: "auto",
          width: "100%",
        }}
      >
        {/* Session info pill */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            backgroundColor: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 2,
            px: 2,
            py: 1.25,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em" }}
            >
              Sessão ativa
            </Typography>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>
              {session.start_time.substring(0, 5)}
              {session.end_time ? ` – ${session.end_time.substring(0, 5)}` : ""}
              {" · "}
              {new Date(`${session.session_date}T00:00:00`).toLocaleDateString("pt-BR")}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: "rgba(255,193,7,0.12)",
              border: "1px solid rgba(255,193,7,0.3)",
              borderRadius: 1.5,
              px: 1.25,
              py: 0.5,
            }}
          >
            <Typography sx={{ color: "#ffc91f", fontWeight: 700, fontSize: "0.78rem", whiteSpace: "nowrap" }}>
              Grupo {currentBatch + 1} / {totalBatches}
            </Typography>
          </Box>
        </Box>

        {/* ── Timer ── */}
        <Box
          sx={{
            backgroundColor: "rgba(255,193,7,0.05)",
            border: "1px solid rgba(255,193,7,0.18)",
            borderRadius: 3,
            px: 3,
            py: 3,
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.68rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              mb: 1,
            }}
          >
            Próxima chamada em
          </Typography>
          <Typography
            sx={{
              color: "#ffc91f",
              fontWeight: 900,
              fontSize: { xs: "4.5rem", md: "5.5rem" },
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.06em",
            }}
          >
            {mm}:{ss}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              mt: 2.5,
              height: 6,
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.07)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: "#ffc91f",
                borderRadius: 3,
                transition: "transform 0.9s linear",
              },
            }}
          />
        </Box>

        {/* ── Current group ── */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <PeopleIcon sx={{ color: "#ff1f21", fontSize: 20 }} />
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.92rem" }}>
              Entrar agora
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {currentGroup.map((person, idx) => (
              <Box
                key={`${currentBatch}-${person.position}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  backgroundColor: idx === 0 ? "rgba(255,31,33,0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${idx === 0 ? "rgba(255,31,33,0.28)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 2.5,
                  px: 2,
                  py: 1.75,
                  animation: "fadeSlideIn 0.3s ease",
                  "@keyframes fadeSlideIn": {
                    "0%":   { opacity: 0, transform: "translateY(-10px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                  },
                }}
              >
                {/* Position badge */}
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: idx === 0 ? "#ff1f21" : "rgba(255,255,255,0.07)",
                    border: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "0.82rem" }}>
                    #{person.position}
                  </Typography>
                </Box>

                {/* Name */}
                <Typography
                  sx={{
                    color: "#fff",
                    fontWeight: idx === 0 ? 700 : 400,
                    fontSize: { xs: "0.95rem", md: "1rem" },
                    flex: 1,
                  }}
                >
                  {person.name}
                </Typography>

                {idx === 0 && (
                  <Typography
                    sx={{
                      color: "#ff1f21",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    próximo
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Next group preview ── */}
        <Box>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "0.72rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              mb: 1.25,
            }}
          >
            Aguardando — próximo grupo
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {nextGroup.map((person) => (
              <Box
                key={person.position}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 2,
                  px: 2,
                  py: 1.1,
                  opacity: 0.45,
                }}
              >
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.55)",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    width: 36,
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  #{person.position}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem" }}>
                  {person.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ height: 20, flexShrink: 0 }} />
      </Box>
    </Box>
  );
}
