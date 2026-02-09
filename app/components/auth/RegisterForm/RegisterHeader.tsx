import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useRouter } from "next/navigation";

interface RegisterHeaderProps {
  shouldAnimate?: boolean;
}

const RegisterHeader: React.FC<RegisterHeaderProps> = ({ shouldAnimate = false }) => {
  const router = useRouter();

  return (
    <Box
      className={shouldAnimate ? "slide-up-animation" : ""}
      sx={{
        width: "100%",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: 2,
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        backdropFilter: "blur(10px)",
      }}
    >
      <IconButton
        onClick={() => router.push("/pages/auth/login")}
        sx={{
          color: "#fff",
          padding: "8px",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        <ArrowBack sx={{ fontSize: 24 }} />
      </IconButton>
      <Typography
        variant="h5"
        sx={{
          color: "#fff",
          fontWeight: 600,
          fontSize: "1.5rem",
        }}
      >
        Criar conta
      </Typography>
    </Box>
  );
};

export default RegisterHeader;

