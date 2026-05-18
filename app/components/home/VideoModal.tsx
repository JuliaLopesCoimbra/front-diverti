"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";

interface Props {
  src: string;
  onComplete: () => void;
}

const VideoModal: React.FC<Props> = ({ src, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTimeRef = useRef(0);
  const videoEndedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const playStartedRef = useRef(false); // true após o vídeo realmente começar a tocar
  const [paused, setPaused] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [progress, setProgress] = useState(0);

  // Mantém a ref do onComplete sempre atualizada sem re-executar o useEffect
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Trava scroll do body e esconde BottomNav enquanto o modal de video estiver aberto
  useEffect(() => {
    const bottomNav = document.querySelector("[data-fixed-bottom='true']") as HTMLElement | null;
    if (bottomNav) bottomNav.style.display = "none";

    // Salva posição atual do scroll e trava o body (fix para iOS Safari)
    const scrollY = window.scrollY;
    const body = document.body;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";
    body.style.touchAction = "none";

    return () => {
      if (bottomNav) bottomNav.style.display = "";

      // Restaura scroll do body na posição exata que estava
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.overflow = "";
      body.style.touchAction = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Controles do vídeo — roda apenas na montagem
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      playStartedRef.current = true;
      setPaused(false);
      setAutoplayBlocked(false);
    };

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
      // Guard: só chama onComplete se o vídeo realmente tocou por pelo menos 1 segundo
      // Previne navegação prematura por ended disparado antes do vídeo carregar
      if (!playStartedRef.current || video.currentTime < 1) return;
      videoEndedRef.current = true;
      setProgress(100);
      onCompleteRef.current();
    };

    const onError = () => {
      // Vídeo falhou ao carregar — mostra opção de tocar manualmente
      setAutoplayBlocked(true);
      setPaused(true);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);

    // Tenta iniciar o vídeo (único ponto de play — sem autoPlay no atributo)
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        setAutoplayBlocked(true);
        setPaused(true);
      });
    }

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPaused(false);
      setAutoplayBlocked(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  return (
    <Box
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

        {/* Overlay de play quando pausado ou autoplay bloqueado */}
        {(paused || autoplayBlocked) && (
          <Box
            sx={{
              position: "absolute",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
              pointerEvents: "none",
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
            {autoplayBlocked && (
              <Typography
                sx={{
                  color: "#fff",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  background: "rgba(0,0,0,0.55)",
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                }}
              >
                Toque para iniciar o vídeo
              </Typography>
            )}
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
