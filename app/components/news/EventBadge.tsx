"use client";

import React from "react";
import { Box, Chip, Typography, Slide } from "@mui/material";
import { Event } from "@mui/icons-material";

interface EventBadgeProps {
  eventTitle: string;
}

export default function EventBadge({ eventTitle }: EventBadgeProps) {
  return (
    <Slide direction="down" in timeout={500}>
      <Box sx={{ mb: 3 }}>
        <Chip
          icon={<Event sx={{ fontSize: 16, color: "#fff !important" }} />}
          label={
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>
              {eventTitle}
            </Typography>
          }
          sx={{
            backgroundColor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            fontWeight: 600,
            padding: "8px 4px",
            height: "auto",
            "& .MuiChip-icon": {
              color: "#fff",
            },
          }}
        />
      </Box>
    </Slide>
  );
}

