"use client";

import { Box} from "@mui/material";

interface CTVAdProps {
  title?: string;
  description?: string;
  backgroundImage?: string;
}

export default function CTVAd({
  backgroundImage = "https://assets.b9.com.br/wp-content/uploads/2023/04/KV-ccsa-1280x720.png"
}: CTVAdProps) {
  return (
      <Box
        sx={{
          mt: 0.3,
          height: 120,
          borderRadius: 1,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          opacity: 0.9,
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            zIndex: 1,
          },
        }}
      >
       
      </Box>
  
  );
}
