"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PersonIcon from "@mui/icons-material/Person";
import {
  AdminStandSessionBooking,
  checkInAdminStandBooking,
  checkInAdminStandBookingByToken,
  getAdminStandSessionBookings,
} from "@/app/services/liveStands/liveStandAdminBookingService";
import { LiveStandSessionResponse } from "@/app/services/liveStands/liveStandSessionService";

// ── Types ──────────────────────────────────────────────────────────────────────

interface BookingWithSession extends AdminStandSessionBooking {
  session: LiveStandSessionResponse;
}

interface ScanResult {
  success: boolean;
  message: string;
  userName?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  sessions: LiveStandSessionResponse[];
  onCheckedIn?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function CheckInScanner({ open, onClose, sessions, onCheckedIn }: Props) {
  // camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const scanningRef = useRef(false);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "loading" | "active" | "unsupported" | "denied">("idle");
  const [processingQR, setProcessingQR] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // phone search
  const [allBookings, setAllBookings] = useState<BookingWithSession[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [phoneQuery, setPhoneQuery] = useState("");
  const [checkingInId, setCheckingInId] = useState<number | null>(null);
  const [phoneResult, setPhoneResult] = useState<ScanResult | null>(null);

  // ── Load all session bookings ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !sessions.length) return;
    let active = true;
    setLoadingBookings(true);

    Promise.all(
      sessions.map((s) =>
        getAdminStandSessionBookings(s.id)
          .then((bookings) => bookings.map((b) => ({ ...b, session: s })))
          .catch(() => [] as BookingWithSession[])
      )
    ).then((results) => {
      if (!active) return;
      setAllBookings(results.flat());
    }).finally(() => {
      if (active) setLoadingBookings(false);
    });

    return () => { active = false; };
  }, [open, sessions]);

  // ── Camera ───────────────────────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleQRDetected = useCallback(async (token: string) => {
    setProcessingQR(true);
    try {
      await checkInAdminStandBookingByToken(token);
      setScanResult({ success: true, message: "Entrada registrada com sucesso!" });
      onCheckedIn?.();
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      setScanResult({ success: false, message: detail || "QR Code invalido ou ja utilizado." });
    } finally {
      setProcessingQR(false);
    }
  }, [onCheckedIn]);

  const startCamera = useCallback(async () => {
    setCameraStatus("loading");
    scanningRef.current = true;
    setScanResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStatus("active");

      if (!("BarcodeDetector" in window)) {
        // Camera is active but QR scanning is not supported; phone lookup still works.
        return;
      }

      type Detector = { detect(src: HTMLVideoElement): Promise<{ rawValue: string }[]> };
      const detector = new (window as unknown as {
        BarcodeDetector: new (opts: object) => Detector;
      }).BarcodeDetector({ formats: ["qr_code"] });

      const loop = async () => {
        if (!scanningRef.current) return;
        try {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0 && scanningRef.current) {
              scanningRef.current = false;
              cancelAnimationFrame(animFrameRef.current);
              await handleQRDetected(codes[0].rawValue);
              return;
            }
          }
        } catch { /* keep looping on frame errors */ }
        if (scanningRef.current) animFrameRef.current = requestAnimationFrame(loop);
      };

      animFrameRef.current = requestAnimationFrame(loop);
    } catch {
      setCameraStatus("denied");
    }
  }, [handleQRDetected]);

  useEffect(() => {
    if (open) {
      void startCamera();
    } else {
      stopCamera();
      setCameraStatus("idle");
      setScanResult(null);
      setPhoneQuery("");
      setPhoneResult(null);
    }
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  // ── Phone check-in ────────────────────────────────────────────────────────────

  const matchedBooking: BookingWithSession | null = phoneQuery.trim().length >= 3
    ? allBookings.find((b) => {
        const q = phoneQuery.trim().toLowerCase();
        const digits = q.replace(/\D/g, "");
        return (
          (digits && (b.user_phone ?? "").replace(/\D/g, "").includes(digits)) ||
          (b.user_name ?? "").toLowerCase().includes(q) ||
          (b.user_email ?? "").toLowerCase().includes(q)
        );
      }) ?? null
    : null;

  const handlePhoneCheckIn = async (booking: BookingWithSession) => {
    setCheckingInId(booking.id);
    setPhoneResult(null);
    try {
      await checkInAdminStandBooking(booking.id);
      setAllBookings((prev) =>
        prev.map((b) => b.id === booking.id ? { ...b, checked_in_at: new Date().toISOString() } : b)
      );
      setPhoneResult({ success: true, message: "Entrada registrada!", userName: booking.user_name });
      setPhoneQuery("");
      onCheckedIn?.();
      setTimeout(() => setPhoneResult(null), 4000);
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      setPhoneResult({ success: false, message: detail || "Erro ao registrar entrada." });
      setTimeout(() => setPhoneResult(null), 4000);
    } finally {
      setCheckingInId(null);
    }
  };

  const resetScan = () => {
    setScanResult(null);
    void startCamera();
  };

  if (!open) return null;

  const sessionLabel = (s: LiveStandSessionResponse) =>
    `${new Date(`${s.session_date}T00:00:00`).toLocaleDateString("pt-BR")} — ${s.start_time.substring(0, 5)}${s.end_time ? ` às ${s.end_time.substring(0, 5)}` : ""}`;

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      color: "#fff",
      backgroundColor: "rgba(255,255,255,0.06)",
      borderRadius: 2,
      "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
      "&.Mui-focused fieldset": { borderColor: "#ff1f21" },
    },
    "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.3)" },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.55)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#fff" },
  };

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
      {/* ── QR success/error full overlay ── */}
      {scanResult && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            backgroundColor: scanResult.success ? "rgba(0,150,60,0.97)" : "rgba(170,0,0,0.97)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2.5,
            px: 3,
          }}
        >
          {scanResult.success
            ? <CheckCircleIcon sx={{ fontSize: { xs: 96, md: 120 }, color: "#fff" }} />
            : <ErrorOutlineIcon sx={{ fontSize: { xs: 96, md: 120 }, color: "#fff" }} />
          }
          <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: { xs: "1.8rem", md: "2.2rem" }, textAlign: "center" }}>
            {scanResult.success ? "Entrada validada!" : "Nao foi possivel"}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.85)", textAlign: "center", fontSize: "1rem" }}>
            {scanResult.message}
          </Typography>
          <Button
            onClick={resetScan}
            sx={{
              mt: 1,
              color: "#fff",
              border: "2px solid rgba(255,255,255,0.5)",
              borderRadius: "999px",
              textTransform: "none",
              fontWeight: 700,
              px: 5,
              py: 1.2,
              fontSize: "1rem",
              "&:hover": { border: "2px solid #fff", backgroundColor: "rgba(255,255,255,0.1)" },
            }}
          >
            Escanear novamente
          </Button>
          <Button onClick={onClose} sx={{ color: "rgba(255,255,255,0.6)", textTransform: "none", fontSize: "0.88rem" }}>
            Fechar
          </Button>
        </Box>
      )}

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
        <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: { xs: "1rem", md: "1.1rem" } }}>
          Validar Entrada
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#fff" } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* ── Scrollable body ── */}
      <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", px: 2, py: 3, gap: 3 }}>

        {/* Camera */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: 400,
            aspectRatio: "1 / 1",
            borderRadius: 3,
            overflow: "hidden",
            backgroundColor: "#111",
            flexShrink: 0,
          }}
        >
          <Box
            component="video"
            ref={videoRef}
            muted
            playsInline
            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />

          {/* Scan overlay */}
          {cameraStatus === "active" && !processingQR && (
            <Box sx={{ position: "absolute", inset: 0 }}>
              <Box sx={{ position: "absolute", top: 0,    left: 0,   right: 0,  height: "14%", backgroundColor: "rgba(0,0,0,0.5)" }} />
              <Box sx={{ position: "absolute", bottom: 0, left: 0,   right: 0,  height: "14%", backgroundColor: "rgba(0,0,0,0.5)" }} />
              <Box sx={{ position: "absolute", top: "14%", bottom: "14%", left: 0,   width: "12%", backgroundColor: "rgba(0,0,0,0.5)" }} />
              <Box sx={{ position: "absolute", top: "14%", bottom: "14%", right: 0,  width: "12%", backgroundColor: "rgba(0,0,0,0.5)" }} />
              {[
                { top: "14%",    left: "12%",  borderTop:    "3px solid #ff1f21", borderLeft:   "3px solid #ff1f21" },
                { top: "14%",    right: "12%", borderTop:    "3px solid #ff1f21", borderRight:  "3px solid #ff1f21" },
                { bottom: "14%", left: "12%",  borderBottom: "3px solid #ff1f21", borderLeft:   "3px solid #ff1f21" },
                { bottom: "14%", right: "12%", borderBottom: "3px solid #ff1f21", borderRight:  "3px solid #ff1f21" },
              ].map((s, i) => <Box key={i} sx={{ position: "absolute", width: 28, height: 28, ...s }} />)}
              <Box
                sx={{
                  position: "absolute", left: "12%", right: "12%", height: 2,
                  background: "linear-gradient(90deg, transparent, #ff1f21 30%, #ff6162 50%, #ff1f21 70%, transparent)",
                  boxShadow: "0 0 8px rgba(255,31,33,0.8)",
                  animation: "scanLine 1.8s ease-in-out infinite",
                  "@keyframes scanLine": { "0%": { top: "17%" }, "50%": { top: "80%" }, "100%": { top: "17%" } },
                }}
              />
            </Box>
          )}

          {cameraStatus === "loading" && (
            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.65)" }}>
              <CircularProgress sx={{ color: "#ff1f21" }} />
            </Box>
          )}

          {processingQR && (
            <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5, backgroundColor: "rgba(0,0,0,0.8)" }}>
              <CircularProgress sx={{ color: "#ff1f21" }} />
              <Typography sx={{ color: "#fff", fontSize: "0.9rem" }}>Validando...</Typography>
            </Box>
          )}
        </Box>

        {/* Camera status label */}
        <Box sx={{ textAlign: "center", mt: -1 }}>
          {cameraStatus === "active" && !processingQR && (
            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.85rem" }}>
              Aponte a camera para o QR Code do participante
            </Typography>
          )}
          {cameraStatus === "denied" && (
            <Typography sx={{ color: "#ff6b6b", fontSize: "0.85rem" }}>
              Permissao de camera negada. Valide pelo telefone abaixo.
            </Typography>
          )}
        </Box>

        {/* Divider */}
        <Box sx={{ width: "100%", maxWidth: 400, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Divider sx={{ flex: 1, borderColor: "rgba(255,255,255,0.1)" }} />
          <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
            ou validar por telefone
          </Typography>
          <Divider sx={{ flex: 1, borderColor: "rgba(255,255,255,0.1)" }} />
        </Box>

        {/* Phone input */}
        <Box sx={{ width: "100%", maxWidth: 400 }}>
          <TextField
            fullWidth
            label="Telefone, nome ou email"
            placeholder="Ex: (21) 99999-8888"
            value={phoneQuery}
            onChange={(e) => { setPhoneQuery(e.target.value); setPhoneResult(null); }}
            InputProps={{
              endAdornment: loadingBookings
                ? <CircularProgress size={18} sx={{ color: "#ff1f21", mr: 1 }} />
                : null,
            }}
            sx={inputSx}
          />
          {phoneQuery.trim().length > 0 && phoneQuery.trim().length < 3 && (
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", mt: 0.75 }}>
              Digite pelo menos 3 caracteres para buscar
            </Typography>
          )}
        </Box>

        {/* Phone check-in feedback banner */}
        {phoneResult && (
          <Box
            sx={{
              width: "100%", maxWidth: 400,
              display: "flex", alignItems: "center", gap: 1.5,
              p: 2, borderRadius: 2.5,
              backgroundColor: phoneResult.success ? "rgba(0,150,60,0.15)" : "rgba(200,0,0,0.15)",
              border: `1px solid ${phoneResult.success ? "rgba(0,150,60,0.4)" : "rgba(200,0,0,0.4)"}`,
            }}
          >
            {phoneResult.success
              ? <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 22, flexShrink: 0 }} />
              : <ErrorOutlineIcon sx={{ color: "#ff6b6b", fontSize: 22, flexShrink: 0 }} />
            }
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem" }}>
                {phoneResult.success ? "Entrada validada!" : "Erro ao registrar"}
              </Typography>
              {phoneResult.userName && (
                <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.78rem" }}>{phoneResult.userName}</Typography>
              )}
              <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem" }}>{phoneResult.message}</Typography>
            </Box>
          </Box>
        )}

        {/* Result card */}
        {phoneQuery.trim().length >= 3 && !phoneResult && (
          <Box sx={{ width: "100%", maxWidth: 400 }}>
            {matchedBooking ? (
              <Box
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  border: matchedBooking.checked_in_at
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid rgba(255,31,33,0.45)",
                  backgroundColor: "rgba(255,255,255,0.04)",
                }}
              >
                <Box sx={{ height: 4, backgroundColor: matchedBooking.checked_in_at ? "rgba(255,255,255,0.12)" : "#ff1f21" }} />

                <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* Avatar + name */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                      backgroundColor: "rgba(255,31,33,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <PersonIcon sx={{ color: "#ff1f21", fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.2 }}>
                        {matchedBooking.user_name || "Participante"}
                      </Typography>
                      {matchedBooking.checked_in_at ? (
                        <Typography sx={{ color: "#4caf50", fontSize: "0.76rem", fontWeight: 600, mt: 0.25 }}>
                          Entrada ja realizada — {new Date(matchedBooking.checked_in_at).toLocaleString("pt-BR")}
                        </Typography>
                      ) : (
                        <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.76rem", mt: 0.25 }}>
                          Aguardando entrada
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                  {/* Details grid */}
                  <Box sx={{ display: "grid", gap: 1.25 }}>
                    {[
                      { label: "Sessao",    value: sessionLabel(matchedBooking.session) },
                      { label: "Email",     value: matchedBooking.user_email || "—" },
                      { label: "Telefone",  value: matchedBooking.user_phone || "—" },
                    ].map(({ label, value }) => (
                      <Box key={label} sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
                        <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", flexShrink: 0 }}>
                          {label}
                        </Typography>
                        <Typography sx={{ color: "#fff", fontSize: "0.82rem", fontWeight: 600, textAlign: "right" }}>
                          {value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Action */}
                  {!matchedBooking.checked_in_at && (
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={checkingInId === matchedBooking.id}
                      onClick={() => handlePhoneCheckIn(matchedBooking)}
                      sx={{
                        background: "linear-gradient(180deg, #ff2e30 0%, #ff1f21 100%)",
                        color: "#fff",
                        fontWeight: 700,
                        borderRadius: 2,
                        textTransform: "none",
                        py: 1.5,
                        fontSize: "1rem",
                        "&:disabled": { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.25)" },
                      }}
                    >
                      {checkingInId === matchedBooking.id ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CircularProgress size={18} sx={{ color: "#fff" }} />
                          Confirmando...
                        </Box>
                      ) : (
                        "Confirmar entrada"
                      )}
                    </Button>
                  )}
                </Box>
              </Box>
            ) : (
              <Box sx={{ p: 3, borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.88rem" }}>
                  Nenhum participante encontrado
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Bottom spacing */}
        <Box sx={{ height: 24, flexShrink: 0 }} />
      </Box>
    </Box>
  );
}
