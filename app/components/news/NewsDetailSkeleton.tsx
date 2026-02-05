"use client";

import React from "react";
import { Box, Skeleton, Divider } from "@mui/material";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

export default function NewsDetailSkeleton() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        ...dashboardBackgroundSx,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Skeleton para NewsActions */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
        <Skeleton
          variant="circular"
          width={40}
          height={40}
          sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
        />
      </Box>

      {/* Skeleton para NewsDetailHeader */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, pb: 2 }}>
        <Skeleton
          variant="circular"
          width={48}
          height={48}
          sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
        />
        <Box sx={{ flex: 1 }}>
          <Skeleton
            variant="text"
            width="40%"
            height={20}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 0.5 }}
          />
          <Skeleton
            variant="text"
            width="30%"
            height={16}
            sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
          />
        </Box>
      </Box>

      <Box sx={{ pb: 2, flex: 1, overflowY: "auto" }}>
        {/* Skeleton para imagem/carrossel */}
        <Box sx={{ mb: 2 }}>
          <Skeleton
            variant="rectangular"
            width="100%"
            height={400}
            sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
          />
        </Box>

        {/* Skeleton para conteúdo */}
        <Box sx={{ px: 2, maxWidth: { xs: "100%", sm: "600px", md: "700px" }, margin: "0 auto", width: "100%" }}>
          <Skeleton
            variant="text"
            width="90%"
            height={32}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 2 }}
          />
          <Skeleton
            variant="text"
            width="100%"
            height={20}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 1 }}
          />
          <Skeleton
            variant="text"
            width="100%"
            height={20}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 1 }}
          />
          <Skeleton
            variant="text"
            width="85%"
            height={20}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 2 }}
          />

          {/* Skeleton para seção de likes */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <Skeleton
              variant="circular"
              width={24}
              height={24}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
            <Skeleton
              variant="text"
              width={80}
              height={20}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
          </Box>

          {/* Skeleton para comentários */}
          <Box mt={2}>
            <Skeleton
              variant="text"
              width={150}
              height={20}
              sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 1.5 }}
            />
            <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 1.5 }} />

            {/* Skeleton para lista de comentários */}
            {[1, 2, 3].map((index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Skeleton
                    variant="circular"
                    width={32}
                    height={32}
                    sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
                  />
                  <Box flex={1}>
                    <Box
                      sx={{
                        backgroundColor: "rgba(255,255,255,0.05)",
                        p: 1.5,
                        borderRadius: 2,
                      }}
                    >
                      <Skeleton
                        variant="text"
                        width="30%"
                        height={16}
                        sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 0.5 }}
                      />
                      <Skeleton
                        variant="text"
                        width="100%"
                        height={14}
                        sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 0.5 }}
                      />
                      <Skeleton
                        variant="text"
                        width="80%"
                        height={14}
                        sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
                      />
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, ml: 1 }}>
                      <Skeleton
                        variant="text"
                        width={60}
                        height={12}
                        sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
                      />
                      <Skeleton
                        variant="circular"
                        width={20}
                        height={20}
                        sx={{ bgcolor: "rgba(255,255,255,0.1)", ml: 1 }}
                      />
                      <Skeleton
                        variant="circular"
                        width={20}
                        height={20}
                        sx={{ bgcolor: "rgba(255,255,255,0.1)", ml: 0.5 }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))}

            {/* Skeleton para campo de comentário */}
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 2 }}>
              <Skeleton
                variant="circular"
                width={32}
                height={32}
                sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
              />
              <Skeleton
                variant="rectangular"
                width="100%"
                height={40}
                sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}
              />
              <Skeleton
                variant="circular"
                width={32}
                height={32}
                sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

