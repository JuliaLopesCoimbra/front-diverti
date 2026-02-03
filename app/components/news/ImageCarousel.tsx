"use client";

import React, { useState } from "react";
import { Box, IconButton, Paper } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";

interface ImageCarouselProps {
  images: string[];
  onRemove?: (index: number) => void;
  showRemoveButton?: boolean;
  disabled?: boolean;
}

export default function ImageCarousel({
  images,
  onRemove,
  showRemoveButton = false,
  disabled = false,
}: ImageCarouselProps) {
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

  const handleRemove = (index: number) => {
    if (disabled || !onRemove) return;
    
    onRemove(index);
    
    // Ajustar o índice atual se necessário
    if (currentIndex >= images.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (currentIndex >= images.length - 1) {
      setCurrentIndex(0);
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Imagem atual */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%", // 16:9 aspect ratio
          overflow: "hidden",
        }}
      >
        <Box
          component="img"
          src={images[currentIndex]}
          alt={`Imagem ${currentIndex + 1}`}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Botão de remover */}
        {showRemoveButton && onRemove && (
          <IconButton
            onClick={() => handleRemove(currentIndex)}
            disabled={disabled}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              color: "#fff",
              "&:hover": {
                backgroundColor: "rgba(255, 0, 0, 0.8)",
              },
              "&:disabled": {
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                color: "rgba(255, 255, 255, 0.3)",
              },
              zIndex: 2,
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}

        {/* Botões de navegação */}
        {images.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevious}
              disabled={disabled}
              sx={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                color: "#fff",
                pointerEvents: disabled ? "none" : "auto",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                },
                "&:disabled": {
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  color: "rgba(255, 255, 255, 0.3)",
                },
                zIndex: 10,
              }}
              size="small"
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={handleNext}
              disabled={disabled}
              sx={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                color: "#fff",
                pointerEvents: disabled ? "none" : "auto",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                },
                "&:disabled": {
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  color: "rgba(255, 255, 255, 0.3)",
                },
                zIndex: 10,
              }}
              size="small"
            >
              <ChevronRightIcon />
            </IconButton>
          </>
        )}
      </Box>

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
              onClick={() => !disabled && setCurrentIndex(index)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor:
                  index === currentIndex
                    ? "#ffc91f"
                    : "rgba(255, 255, 255, 0.3)",
                cursor: disabled ? "default" : "pointer",
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
