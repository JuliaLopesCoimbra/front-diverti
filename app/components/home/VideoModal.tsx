"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";

interface Props {
  src: string;
  onComplete: () => void;
}

const VideoModal: React.FC<Props> = ({ src, onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTimeRef = useRef(0);
  const videoEndedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fullscreen + esconde BottomNav
  useEffect(() => {
    const container = containerRef.current;

    // Esconde a barra de navegação inferior
    const bottomNav = document.querySelector("[data-fixed-bottom='true']") as HTMLElement | null;
    if (bottomNav) bottomNav.style.display = "none";

    // Fullscreen (desktop / Android)
    container?.requestFullscreen?.().catch(() => {});

    const onFullscreenChange = () => {
      if (!document.fullscreenElement && !videoEndedRef.current) {
        container?.requestFullscreen?.().catch(() => {});
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      // Restaura a barra de navegação
      if (bottomNav) bottomNav.style.display = "";
    };
  }, []);

  // Controles do vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => {});

    const onTimeUpdate = () => {
      if (video.currentTime > lastTimeRef.current) {
        lastTimeRef.current = video.currentTime;
      }
      const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
      setProgress(pct);
    };

    const onSeeking = () => {
      if (Math.abs(video.currentTime - lastTimeRef.current) > 0.5) {
        video.currentTime = lastTimeRef.current;
      }
    };

    const onEnded = () => {
      videoEndedRef.current = true;
      setProgress(100);
      onComplete();
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("ended", onEnded);
    };
  }, [onComplete]);

  const handleClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Barra de progresso vermelha */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: "rgba(255,255,255,0.1)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #ff2e30, #ff6162)",
            transition: "width 0.25s linear",
            boxShadow: "0 0 8px rgba(255,46,48,0.7)",
          }}
        />
      </Box>

      {/* Área clicável + vídeo */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        onClick={handleClick}
      >
        <video
          ref={videoRef}
          src={src}
          playsInline
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* Ícone de play quando pausado */}
        {paused && (
          <Box
            sx={{
              position: "absolute",
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <Box
              sx={{
                width: 0,
                height: 0,
                borderStyle: "solid",
                borderWidth: "13px 0 13px 24px",
                borderColor: "transparent transparent transparent #fff",
                ml: "5px",
              }}
            />
          </Box>
        )}
      </Box>

      {/* Legenda no rodapé */}
      <Box
        sx={{
          position: "absolute",
          bottom: 24,
          left: 0,
          right: 0,
          textAlign: "center",
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", letterSpacing: "0.04em" }}>
          Assista ao video para girar a roleta
        </Typography>
      </Box>
    </Box>
  );
};

export default VideoModal;
