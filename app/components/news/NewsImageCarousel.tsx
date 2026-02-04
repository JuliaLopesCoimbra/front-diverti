"use client";

import React, { useState } from "react";
import { Box, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { NewsImage } from "@/app/services/news/newsService";

interface NewsImageCarouselProps {
  images: NewsImage[];
  alt?: string;
}

export default function NewsImageCarousel({
  images,
  alt = "Imagem",
}: NewsImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  // Ordena as imagens por image_order
  const sortedImages = [...images].sort((a, b) => a.image_order - b.image_order);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        mb: 2,
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
          src={sortedImages[currentIndex]?.image_url}
          alt={`${alt} - Imagem ${currentIndex + 1}`}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Botões de navegação */}
        {sortedImages.length > 1 && (
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
      </Box>

      {/* Indicadores de página */}
      {sortedImages.length > 1 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 1,
            p: 1.5,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          }}
        >
          {sortedImages.map((_, index) => (
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
