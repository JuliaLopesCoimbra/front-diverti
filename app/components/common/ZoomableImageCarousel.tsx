"use client";

import React, { useState, useRef } from "react";
import { Box } from "@mui/material";
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
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && images.length > 1) {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
    if (isRightSwipe && images.length > 1) {
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
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
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Imagem atual com zoom */}
      <ZoomableImage
        src={images[currentIndex]}
        alt={`Mapa ${currentIndex + 1}`}
        maxHeight={maxHeight}
        borderRadius={0}
      />

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



