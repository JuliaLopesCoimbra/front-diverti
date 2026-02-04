"use client";

import React, { useState } from "react";
import { Box, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ZoomableImage from "./ZoomableImage";

interface ZoomableImageCarouselProps {
  images: string[];
  maxHeight?: number | string;
  borderRadius?: number;
}

export default function ZoomableImageCarousel({
  images,
  maxHeight = 400,
  borderRadius = 2,
}: ZoomableImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        borderRadius: borderRadius,
        overflow: "hidden",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Imagem atual com zoom */}
      <ZoomableImage
        src={images[currentIndex]}
        alt={`Mapa ${currentIndex + 1}`}
        maxHeight={maxHeight}
        borderRadius={0}
      />

      {/* Botões de navegação */}
      {images.length > 1 && (
        <>
          <IconButton
            onClick={handlePrevious}
            sx={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              color: "#fff",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
              },
              zIndex: 10,
            }}
            size="small"
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            onClick={handleNext}
            sx={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              color: "#fff",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
              },
              zIndex: 10,
            }}
            size="small"
          >
            <ChevronRightIcon />
          </IconButton>
        </>
      )}

      {/* Indicadores de página */}
      {images.length > 1 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 1,
            p: 1.5,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          }}
        >
          {images.map((_, index) => (
            <Box
              key={index}
              onClick={() => setCurrentIndex(index)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor:
                  index === currentIndex
                    ? "#ffc91f"
                    : "rgba(255, 255, 255, 0.3)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor:
                    index === currentIndex
                      ? "#ffd54f"
                      : "rgba(255, 255, 255, 0.5)",
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

