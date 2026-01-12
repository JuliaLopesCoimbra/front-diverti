"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Typography,
  Stack,
} from "@mui/material";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { searchFace } from "@/app/services/ai/searchFaceService";

type Stage = "intro" | "camera" | "results";

interface SearchResult {
  url: string;
  similarity?: number;
  label?: string;
}

export default function PhotoAIPage() {
  const [stage, setStage] = useState<Stage>("intro");
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Garantir que o stream seja atribuído quando mudar para câmera
  useEffect(() => {
    if (stage === "camera" && streamRef.current && videoRef.current) {
      console.log("Atribuindo stream ao vídeo no useEffect");
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.error("Erro ao reproduzir vídeo:", err);
      });
    }
  }, [stage]);

  const requestCamera = async () => {
    setIsRequestingCamera(true);
    setCameraError(null);
    try {
      console.log("Solicitando permissão da câmera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      console.log("Câmera permitida! Stream:", stream);
      streamRef.current = stream;
      setStage("camera");
      
      // Pequeno delay para garantir que o DOM atualizou
      setTimeout(() => {
        if (videoRef.current) {
          console.log("Atribuindo stream ao video element");
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => {
            console.error("Erro ao iniciar vídeo:", err);
            setCameraError("Não foi possível iniciar o vídeo da câmera.");
          });
        }
      }, 100);
    } catch (err: any) {
      console.error("Erro ao acessar câmera:", err);
      setCameraError(
        `Não foi possível acessar a câmera: ${err.message || "Verifique as permissões do dispositivo."}`
      );
    } finally {
      setIsRequestingCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise<File | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
          resolve(file);
        },
        "image/jpeg",
        0.9
      );
    });
  };

  const handleSearch = async () => {
    setIsUploading(true);
    setSearchMessage(null);
    try {
      const file = await capturePhoto();
      if (!file) {
        setSearchMessage("Não foi possível capturar a foto. Tente novamente.");
        return;
      }

      const response = await searchFace(file);
      console.log("Resposta completa da API:", response);
      console.log("Matches:", response.matches);

      const imagesFromApi: SearchResult[] =
        response.images?.map((url: string) => ({ url })) ||
        response.matches
          ?.map((m: any) => {
            console.log("Processando match:", m);
            return {
              url: m.image_url || m.url || m.image || "",
              similarity: m.similarity,
              label: m.name || m.external_image_id,
            };
          })
          .filter((r: SearchResult) => {
            console.log("Resultado após filtro:", r);
            return r.url;
          }) ||
        [];

      console.log("Imagens finais para exibir:", imagesFromApi);
      setResults(imagesFromApi);
      setSearchMessage(response.message || null);
      setStage("results");
    } catch (error: any) {
      setSearchMessage(
        error?.response?.data?.detail ||
          "Não foi possível realizar a busca. Tente novamente."
      );
    } finally {
      stopCamera();
      setIsUploading(false);
    }
  };

  const renderIntro = () => (
    <Box px={2} py={3} display="flex" flexDirection="column" gap={3}>
      <Box
        sx={{
          background: "#e9e8ed",
          borderRadius: 2,
          display: "flex",
          gap: 2,
          p: 2,
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            border: "2px solid #4c36e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#4c36e0",
            background: "#fff",
          }}
        >
          <ImageOutlinedIcon fontSize="medium" />
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
          Encontre suas fotos por reconhecimento facial.Tire uma selfie ou envie sua foto de rosto.
          </Typography>
        </Box>
      </Box>

      <Box display="flex" flexDirection="column" gap={1}>
        <Typography variant="h6" fontWeight={700}>
          Encontre suas fotos tiradas durante o evento
        </Typography>
        <Typography variant="body1">
        Utilizamos reconhecimento facial para localizar suas fotos com rapidez e segurança.
         Basta tirar uma selfie ou enviar uma foto do seu rosto, e o sistema encontrará automaticamente todas as imagens em que você aparece.
        </Typography>
      </Box>

      <Button
        variant="contained"
        size="large"
        fullWidth
        sx={{ background: "#5a3cf1", borderRadius: 2, py: 1.5 }}
        onClick={requestCamera}
        disabled={isRequestingCamera}
      >
        {isRequestingCamera ? (
          <CircularProgress size={22} color="inherit" />
        ) : (
          "Procurar agora"
        )}
      </Button>
    </Box>
  );

  const renderCamera = () => (
    <Box px={2} py={3} display="flex" flexDirection="column" gap={3}>
      <Box
        sx={{
          background: "#e9e8ed",
          borderRadius: 2,
          display: "flex",
          gap: 2,
          p: 2,
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            border: "2px solid #4c36e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#4c36e0",
            background: "#fff",
          }}
        >
          <CameraAltOutlinedIcon fontSize="medium" />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Encontre suas fotos por reconhecimento facial.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tire uma selfie ou envie sua foto de rosto.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          width: "100%",
          maxWidth: 320,
          margin: "0 auto",
          aspectRatio: "3 / 4",
          border: "3px solid #6c54ff",
          borderRadius: "50%",
          overflow: "hidden",
          background: "#d9d9d9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          onLoadedMetadata={() => {
            console.log("Metadata do vídeo carregado");
            if (videoRef.current) {
              videoRef.current.play().catch((err) => console.error("Erro no play:", err));
            }
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Box>

      {cameraError && (
        <Typography color="error" textAlign="center">
          {cameraError}
        </Typography>
      )}

      <Stack gap={1}>
        <Typography variant="body1" textAlign="center" fontWeight={600}>
          Primeiro, posicione seu rosto dentro da marcação.
        </Typography>
        <Typography variant="body2" textAlign="center" color="text.secondary">
          Clique em “Pronto” quando estiver enquadrado.
        </Typography>
      </Stack>

      <Button
        variant="contained"
        size="large"
        fullWidth
        sx={{ background: "#5a3cf1", borderRadius: 2, py: 1.5 }}
        onClick={handleSearch}
        disabled={isUploading}
      >
        {isUploading ? <CircularProgress size={22} color="inherit" /> : "Pronto"}
      </Button>
    </Box>
  );

  const renderResults = () => (
    <Box px={2} py={3} display="flex" flexDirection="column" gap={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h6" fontWeight={700}>
          Minhas fotos
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "#5a3cf1",
          }}
        >
          <ShoppingCartOutlinedIcon />
        </Box>
      </Box>

      {searchMessage && (
        <Typography variant="body2" >
          {searchMessage}
        </Typography>
      )}

      {results.length === 0 ? (
        <Typography textAlign="center">
          Nenhuma foto encontrada. Tente novamente com outra imagem.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {results.map((item, idx) => (
            <Grid item xs={6} key={idx}>
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  background: "#fff",
                }}
              >
                <img
                  src={item.url}
                  alt={item.label || `Foto ${idx + 1}`}
                  style={{
                    width: "100%",
                    display: "block",
                    aspectRatio: "3 / 4",
                    objectFit: "cover",
                  }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      <Button
        variant="contained"
        size="large"
        fullWidth
        sx={{ background: "#5a3cf1", borderRadius: 2, py: 1.5, mt: 1 }}
        onClick={() => {
          setResults([]);
          setSearchMessage(null);
          setStage("intro");
        }}
      >
        Procurar novamente
      </Button>
    </Box>
  );

  if (stage === "camera") return renderCamera();
  if (stage === "results") return renderResults();
  return renderIntro();
}
