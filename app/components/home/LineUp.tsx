"use client";

import { Box } from "@mui/material";
import LineupView from "@/app/components/lineup/LineupView";

interface LineUpProps {
  eventId: number;
}

export default function LineUp({ eventId }: LineUpProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        paddingY: 2,
      }}
    >
      <LineupView eventId={eventId} />
    </Box>
  );
}

