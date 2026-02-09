import React from "react";
import { Box, Container, Skeleton } from "@mui/material";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

const RegisterSkeleton: React.FC = () => {
  return (
    <Box
      sx={{
        ...dashboardBackgroundSx,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header Skeleton */}
      <Box
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
        <Skeleton
          variant="circular"
          width={40}
          height={40}
          sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
        />
        <Skeleton
          variant="text"
          width={150}
          height={32}
          sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
        />
      </Box>

      {/* Form Container Skeleton */}
      <Container
        maxWidth="sm"
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 450,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "40px 32px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Skeleton
            variant="text"
            width="80%"
            height={24}
            sx={{ mb: 4, bgcolor: "rgba(255, 255, 255, 0.1)" }}
          />

          {/* Input Skeletons */}
          {[1, 2, 3, 4, 5].map((index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              height={56}
              sx={{
                mt: index === 1 ? 0 : 3,
                borderRadius: "14px",
                bgcolor: "rgba(255, 255, 255, 0.1)",
              }}
            />
          ))}

          {/* Button Skeleton */}
          <Skeleton
            variant="rectangular"
            height={48}
            sx={{
              mt: 4,
              mb: 2,
              borderRadius: "14px",
              bgcolor: "rgba(255, 255, 255, 0.1)",
            }}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default RegisterSkeleton;

