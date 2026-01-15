"use client";

import { Box, IconButton, Paper, Typography } from "@mui/material";
import { ArrowBackIos } from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function PermissionsHeader() {
  const router = useRouter();

  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        borderRadius: 0,
      }}
    >
      <Box
        sx={{
          maxWidth: "1400px",
          margin: "0 auto",
          px: { xs: 2, sm: 3, md: 4 },
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
          <IconButton
            onClick={() => router.back()}
            sx={{
              color: "#fff",
              transition: "all 0.2s ease",
            }}
          >
            <ArrowBackIos sx={{ fontSize: 18 }} />
          </IconButton>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: "white",
                  fontWeight: 600,
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                }}
              >
                Gerenciamento de Permissões
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.6)",
                  display: { xs: "none", sm: "block" },
                }}
              >
                Gerencie usuários, permissões e acessos
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}



