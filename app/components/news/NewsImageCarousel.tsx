"use client";

import React, { useState, useEffect } from "react";
import { Box, IconButton } from "@mui/material";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

interface NewsImage {
  image_url: string;
  image_order: number;
}

interface NewsImageCarouselProps {
  images: NewsImage[];
  alt?: string;
}

export default function NewsImageCarousel({
  images,
  alt = "Imagem",
}: NewsImageCarouselProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const sortedImages = [...images].sort((a, b) => a.image_order - b.image_order);

  useEffect(() => {
    if (sortedImages.length > 0) {
      setCurrentImageIndex(0);
    }
  }, [sortedImages.length]);

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
  };

  const onTouchStartHandler = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMoveHandler = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && sortedImages.length > 1) {
      handleNextImage();
    }
    if (isRightSwipe && sortedImages.length > 1) {
      handlePreviousImage();
    }
  };

  if (sortedImages.length === 0) return null;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        px: { xs: 0, sm: 2, md: 4 },
      }}
    >
      <Box
        onTouchStart={onTouchStartHandler}
        onTouchMove={onTouchMoveHandler}
        onTouchEnd={onTouchEndHandler}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: { xs: "100%", sm: "600px", md: "700px" },
          margin: "0 auto",
          borderRadius: 0,
          overflow: "hidden",
          backgroundColor: "transparent",
          touchAction: "pan-y",
          userSelect: "none",
        }}
      >
        <Box
          component="img"
          src={sortedImages[currentImageIndex]?.image_url}
          alt={alt}
          sx={{
            width: "100%",
            aspectRatio: "1 / 1",
            objectFit: "cover",
            display: "block",
          }}
        />

        {sortedImages.length > 1 && (
          <>
            <IconButton
              onClick={handlePreviousImage}
              sx={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                color: "#fff",
                width: 32,
                height: 32,
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                },
                zIndex: 2,
              }}
            >
              <NavigateBeforeIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton
              onClick={handleNextImage}
              sx={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                color: "#fff",
                width: 32,
                height: 32,
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                },
                zIndex: 2,
              }}
            >
              <NavigateNextIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </>
        )}

        {sortedImages.length > 1 && (
          <Box
            sx={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 0.75,
              zIndex: 2,
            }}
          >
            {sortedImages.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor:
                    index === currentImageIndex
                      ? "#fff"
                      : "rgba(255, 255, 255, 0.4)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}





