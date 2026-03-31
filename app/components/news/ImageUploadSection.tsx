"use client";

import React from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
} from "@mui/material";
import {
  PhotoCamera,
  AddPhotoAlternate,
} from "@mui/icons-material";
import ImageCarousel from "./ImageCarousel";

interface ImageUploadSectionProps {
  images: File[];
  imagePreviews: string[];
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  loading?: boolean;
  maxImages?: number;
  existingImagesCount?: number; // Para diferenciar imagens existentes de novas no modo edit
}

export default function ImageUploadSection({
  images,
  imagePreviews,
  onImageChange,
  onRemoveImage,
  loading = false,
  maxImages = 5,
  existingImagesCount = 0,
}: ImageUploadSectionProps) {
  const inputId = "image-upload";
  const totalImagesCount = imagePreviews.length;

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <PhotoCamera sx={{ color: "rgb(255, 31, 33)", fontSize: 20 }} />
        <Typography
          variant="subtitle1"
          sx={{
            color: "#fff",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          Fotos
        </Typography>
        {totalImagesCount > 0 && (
          <Chip
            label={`${totalImagesCount}/${maxImages}`}
            size="small"
            sx={{
              backgroundColor: "rgba(255, 31, 33, 0.2)",
              color: "rgb(255, 31, 33)",
              fontWeight: 600,
              fontSize: "0.75rem",
              height: 20,
            }}
          />
        )}
      </Box>

      <input
        accept="image/*"
        style={{ display: "none" }}
        id={inputId}
        type="file"
        multiple
        onChange={onImageChange}
        disabled={loading || totalImagesCount >= maxImages}
      />

      {imagePreviews.length === 0 ? (
        <label htmlFor={inputId} style={{ display: "block", width: "100%" }}>
          <Box
            sx={{
              border: "2px dashed rgba(255, 255, 255, 0.3)",
              borderRadius: "16px",
              padding: { xs: 4, sm: 6 },
              textAlign: "center",
              cursor: loading || totalImagesCount >= maxImages ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box",
              "&:hover": {
                borderColor: "rgba(255, 31, 33, 0.5)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                transform: "translateY(-2px)",
              },
            }}
          >
            <PhotoCamera
              sx={{
                fontSize: 48,
                color: "rgba(255, 255, 255, 0.4)",
                mb: 2,
              }}
            />
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255, 255, 255, 0.8)",
                fontWeight: 600,
                mb: 1,
              }}
            >
              Adicione suas fotos
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "0.875rem",
              }}
            >
              Clique para selecionar ou arraste aqui
            </Typography>
            <Box
              sx={{
                mt: 1,
                px: 1,
                width: "100%",
                maxWidth: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                boxSizing: "border-box",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255, 255, 255, 0.4)",
                  fontSize: "0.75rem",
                  textAlign: "center",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  width: "100%",
                }}
              >
                Máximo {maxImages} imagens • 5MB por imagem
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255, 255, 255, 0.4)",
                  fontSize: "0.75rem",
                  textAlign: "center",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  width: "100%",
                }}
              >
                20MB total
              </Typography>
            </Box>
          </Box>
        </label>
      ) : (
        <Box sx={{ mt: 2 }}>
          <ImageCarousel
            images={imagePreviews}
            onRemove={onRemoveImage}
            showRemoveButton={true}
            disabled={loading}
          />

          {totalImagesCount < maxImages && (
            <label htmlFor={inputId} style={{ display: "block", marginTop: 16 }}>
              <Button
                component="span"
                disabled={loading}
                variant="outlined"
                startIcon={<AddPhotoAlternate />}
                fullWidth
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  borderColor: "rgba(255,255,255,0.3)",
                  textTransform: "none",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  padding: "10px 20px",
                  borderRadius: "12px",
                  transition: "all 0.3s ease",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(10px)",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderColor: "rgba(255, 31, 33, 0.5)",
                    color: "rgb(255, 31, 33)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                Adicionar mais fotos ({totalImagesCount}/{maxImages})
              </Button>
            </label>
          )}
        </Box>
      )}
    </Box>
  );
}

