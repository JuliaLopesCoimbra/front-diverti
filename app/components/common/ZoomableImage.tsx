"use client";

import React, { useState, useRef, useEffect } from "react";
import { Box, IconButton } from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

interface ZoomableImageProps {
  src: string;
  alt?: string;
  maxHeight?: number | string;
  borderRadius?: number;
}

export default function ZoomableImage({
  src,
  alt = "Imagem",
  maxHeight = 400,
  borderRadius = 2,
}: ZoomableImageProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const lastTouchDistanceRef = useRef<number | null>(null);
  const lastTouchCenterRef = useRef<{ x: number; y: number } | null>(null);

  const minScale = 1;
  const maxScale = 5;

  // Reset zoom
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom in/out
  const handleZoom = (delta: number) => {
    setScale((prev) => {
      const newScale = Math.max(minScale, Math.min(maxScale, prev + delta));
      return newScale;
    });
  };

  // Mouse wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.2 : 0.2;
      handleZoom(delta);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // Touch events for pinch zoom
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touch1: React.Touch, touch2: React.Touch): { x: number; y: number } => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      lastTouchDistanceRef.current = distance;
      lastTouchCenterRef.current = getTouchCenter(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1 && scale > 1) {
      // Single touch drag when zoomed
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      // Pinch zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      const scaleChange = distance / lastTouchDistanceRef.current;
      
      setScale((prev) => {
        const newScale = Math.max(minScale, Math.min(maxScale, prev * scaleChange));
        return newScale;
      });

      lastTouchDistanceRef.current = distance;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Single touch drag
      e.preventDefault();
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      
      // Constrain position
      const container = containerRef.current;
      const image = imageRef.current;
      if (container && image && image.complete) {
        const containerRect = container.getBoundingClientRect();
        const naturalWidth = image.naturalWidth;
        const naturalHeight = image.naturalHeight;
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
        const imageAspect = naturalWidth / naturalHeight;
        const containerAspect = containerWidth / containerHeight;
        
        let displayedWidth: number;
        let displayedHeight: number;
        
        if (imageAspect > containerAspect) {
          displayedWidth = containerWidth;
          displayedHeight = containerWidth / imageAspect;
        } else {
          displayedHeight = containerHeight;
          displayedWidth = containerHeight * imageAspect;
        }
        
        const scaledWidth = displayedWidth * scale;
        const scaledHeight = displayedHeight * scale;
        
        const maxX = Math.max(0, (scaledWidth - containerWidth) / 2);
        const maxY = Math.max(0, (scaledHeight - containerHeight) / 2);
        
        setPosition({
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY)),
        });
      } else {
        setPosition({ x: newX, y: newY });
      }
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistanceRef.current = null;
    lastTouchCenterRef.current = null;
    setIsDragging(false);
  };

  // Mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      e.preventDefault();
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Constrain position
      const container = containerRef.current;
      const image = imageRef.current;
      if (container && image && image.complete) {
        const containerRect = container.getBoundingClientRect();
        const naturalWidth = image.naturalWidth;
        const naturalHeight = image.naturalHeight;
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
        const imageAspect = naturalWidth / naturalHeight;
        const containerAspect = containerWidth / containerHeight;
        
        let displayedWidth: number;
        let displayedHeight: number;
        
        if (imageAspect > containerAspect) {
          displayedWidth = containerWidth;
          displayedHeight = containerWidth / imageAspect;
        } else {
          displayedHeight = containerHeight;
          displayedWidth = containerHeight * imageAspect;
        }
        
        const scaledWidth = displayedWidth * scale;
        const scaledHeight = displayedHeight * scale;
        
        const maxX = Math.max(0, (scaledWidth - containerWidth) / 2);
        const maxY = Math.max(0, (scaledHeight - containerHeight) / 2);
        
        setPosition({
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY)),
        });
      } else {
        setPosition({ x: newX, y: newY });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Constrain position when zoomed
  useEffect(() => {
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 });
    } else {
      const container = containerRef.current;
      const image = imageRef.current;
      if (container && image) {
        // Wait for image to load to get actual dimensions
        const updateConstraints = () => {
          const containerRect = container.getBoundingClientRect();
          const naturalWidth = image.naturalWidth;
          const naturalHeight = image.naturalHeight;
          const containerWidth = containerRect.width;
          const containerHeight = containerRect.height;
          
          // Calculate displayed size (maintaining aspect ratio)
          const imageAspect = naturalWidth / naturalHeight;
          const containerAspect = containerWidth / containerHeight;
          
          let displayedWidth: number;
          let displayedHeight: number;
          
          if (imageAspect > containerAspect) {
            // Image is wider
            displayedWidth = containerWidth;
            displayedHeight = containerWidth / imageAspect;
          } else {
            // Image is taller
            displayedHeight = containerHeight;
            displayedWidth = containerHeight * imageAspect;
          }
          
          const scaledWidth = displayedWidth * scale;
          const scaledHeight = displayedHeight * scale;
          
          const maxX = Math.max(0, (scaledWidth - containerWidth) / 2);
          const maxY = Math.max(0, (scaledHeight - containerHeight) / 2);
          
          setPosition((prev) => ({
            x: Math.max(-maxX, Math.min(maxX, prev.x)),
            y: Math.max(-maxY, Math.min(maxY, prev.y)),
          }));
        };
        
        if (image.complete) {
          updateConstraints();
        } else {
          image.onload = updateConstraints;
        }
      }
    }
  }, [scale]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: "100%",
        maxHeight,
        overflow: "hidden",
        borderRadius,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        touchAction: "none",
        cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          component="img"
          ref={imageRef}
          src={src}
          alt={alt}
          onLoad={() => {
            // Trigger position constraint update when image loads
            if (scale > 1) {
              const container = containerRef.current;
              const image = imageRef.current;
              if (container && image) {
                const containerRect = container.getBoundingClientRect();
                const naturalWidth = image.naturalWidth;
                const naturalHeight = image.naturalHeight;
                const containerWidth = containerRect.width;
                const containerHeight = containerRect.height;
                
                const imageAspect = naturalWidth / naturalHeight;
                const containerAspect = containerWidth / containerHeight;
                
                let displayedWidth: number;
                let displayedHeight: number;
                
                if (imageAspect > containerAspect) {
                  displayedWidth = containerWidth;
                  displayedHeight = containerWidth / imageAspect;
                } else {
                  displayedHeight = containerHeight;
                  displayedWidth = containerHeight * imageAspect;
                }
                
                const scaledWidth = displayedWidth * scale;
                const scaledHeight = displayedHeight * scale;
                
                const maxX = Math.max(0, (scaledWidth - containerWidth) / 2);
                const maxY = Math.max(0, (scaledHeight - containerHeight) / 2);
                
                setPosition((prev) => ({
                  x: Math.max(-maxX, Math.min(maxX, prev.x)),
                  y: Math.max(-maxY, Math.min(maxY, prev.y)),
                }));
              }
            }
          }}
          sx={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
            userSelect: "none",
            WebkitUserSelect: "none",
            pointerEvents: "none",
          }}
        />
      </Box>

      {/* Zoom controls */}
      <Box
        sx={{
          position: "absolute",
          bottom: 8,
          right: 8,
          display: "flex",
          gap: 1,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          borderRadius: 2,
          padding: 0.5,
          zIndex: 10,
        }}
      >
        <IconButton
          onClick={() => handleZoom(-0.5)}
          disabled={scale <= minScale}
          size="small"
          sx={{
            color: "#fff",
            "&:disabled": {
              color: "rgba(255, 255, 255, 0.3)",
            },
          }}
        >
          <ZoomOutIcon fontSize="small" />
        </IconButton>
        <IconButton
          onClick={handleReset}
          disabled={scale === 1}
          size="small"
          sx={{
            color: "#fff",
            "&:disabled": {
              color: "rgba(255, 255, 255, 0.3)",
            },
          }}
        >
          <RestartAltIcon fontSize="small" />
        </IconButton>
        <IconButton
          onClick={() => handleZoom(0.5)}
          disabled={scale >= maxScale}
          size="small"
          sx={{
            color: "#fff",
            "&:disabled": {
              color: "rgba(255, 255, 255, 0.3)",
            },
          }}
        >
          <ZoomInIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}

