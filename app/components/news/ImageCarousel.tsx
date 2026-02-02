"use client";

import React, { useState, useEffect } from "react";
import { Box, IconButton, Fade } from "@mui/material";
import { NavigateBefore, NavigateNext, Close } from "@mui/icons-material";

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (images.length > 0) {
      setCurrentImageIndex(0);
    }
  }, [images.length]);

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const minSwipeDistance = 50;

  const onTouchStartHandler = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMoveHandler = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && images.length > 1) {
      handleNextImage();
    }
    if (isRightSwipe && images.length > 1) {
      handlePreviousImage();
    }
  };

  if (images.length === 0) return null;

  return (
    <Box
      onTouchStart={onTouchStartHandler}
      onTouchMove={onTouchMoveHandler}
      onTouchEnd={onTouchEndHandler}
      sx={{
        position: "relative",
        width: "100%",
        borderRadius: "16px",
        overflow: "hidden",
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        touchAction: "pan-y",
        userSelect: "none",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
      }}
    >
      <Fade in key={currentImageIndex} timeout={300}>
        <Box
          component="img"
          src={images[currentImageIndex]}
          alt={`Preview ${currentImageIndex + 1}`}
          sx={{
            width: "100%",
            aspectRatio: "1 / 1",
            objectFit: "cover",
            display: "block",
          }}
        />
      </Fade>

      {showRemoveButton && onRemove && (
        <IconButton
          onClick={() => onRemove(currentImageIndex)}
          disabled={disabled}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            color: "#fff",
            width: 40,
            height: 40,
            border: "1px solid rgba(255, 255, 255, 0.2)",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "rgba(220, 38, 38, 0.8)",
              transform: "scale(1.1)",
            },
            zIndex: 2,
          }}
        >
          <Close sx={{ fontSize: 20 }} />
        </IconButton>
      )}

      {images.length > 1 && (
        <>
          <IconButton
            onClick={handlePreviousImage}
            disabled={disabled}
            sx={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(10px)",
              color: "#fff",
              width: 44,
              height: 44,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                transform: "translateY(-50%) scale(1.1)",
              },
              zIndex: 2,
            }}
          >
            <NavigateBefore sx={{ fontSize: 24 }} />
          </IconButton>
          <IconButton
            onClick={handleNextImage}
            disabled={disabled}
            sx={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(10px)",
              color: "#fff",
              width: 44,
              height: 44,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                transform: "translateY(-50%) scale(1.1)",
              },
              zIndex: 2,
            }}
          >
            <NavigateNext sx={{ fontSize: 24 }} />
          </IconButton>
        </>
      )}

      {images.length > 1 && (
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 1,
            zIndex: 2,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            padding: "6px 12px",
            borderRadius: "20px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          {images.map((_, index) => (
            <Box
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              sx={{
                width: index === currentImageIndex ? 24 : 8,
                height: 8,
                borderRadius: "4px",
                backgroundColor:
                  index === currentImageIndex
                    ? "#ffcc01"
                    : "rgba(255, 255, 255, 0.4)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor:
                    index === currentImageIndex
                      ? "#ffcc01"
                      : "rgba(255, 255, 255, 0.6)",
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}





