"use client";

import React from "react";
import { Box, Typography, IconButton, Fade } from "@mui/material";
import { ArrowBackIos } from "@mui/icons-material";
import { useRouter } from "next/navigation";

interface NewsHeaderProps {
  title: string;
  subtitle?: string;
}

export default function NewsHeader({ title, subtitle }: NewsHeaderProps) {
  const router = useRouter();

  return (
    <Fade in timeout={400}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 4,
          position: "relative",
        }}
      >
        <IconButton
          onClick={() => router.back()}
          sx={{
            color: "#fff",
            padding: 1.5,
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              transform: "translateX(-4px)",
            },
          }}
        >
          <ArrowBackIos sx={{ fontSize: 18 }} />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h5"
            sx={{
              color: "#fff",
              fontWeight: 700,
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.875rem",
                mt: 0.5,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </Fade>
  );
}











