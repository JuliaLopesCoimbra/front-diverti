"use client";

import { useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Skeleton } from "@mui/material";
import { useAuth } from "@/app/context/AuthContext";

function AuthCallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const access = params.get("access_token");
    const refresh = params.get("refresh_token");

    if (!access || !refresh) {
      router.replace("/");
      return;
    }

    // Força o login e aguarda um pouco para garantir que o contexto seja atualizado
    login(access, refresh);
    
    // Pequeno delay para garantir que o token seja processado
    setTimeout(() => {
      router.replace("/pages/user/home");
    }, 100);
  }, [params, login, router]);

  return (
    <Box
      className="dashboard-page-background"
      style={{
        minHeight: "100vh",
        paddingBottom: "88px",
      }}
    >
      {/* Header Skeleton */}
      <Box
        sx={{
          padding: 2,
          borderBottom: "solid 1px rgba(255,255,255,0.2)",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Skeleton
              variant="rectangular"
              width={40}
              height={40}
              sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1 }}
            />
            <Skeleton
              variant="text"
              width={150}
              height={32}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
          </Box>
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.4,
          }}
        >
          <Skeleton
            variant="text"
            width={200}
            height={24}
            sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
          />
          <Skeleton
            variant="text"
            width={120}
            height={20}
            sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
          />
        </Box>
      </Box>

      {/* Tabs Skeleton */}
      <Box sx={{ display: "flex", gap: 1, padding: 2 }}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width={100}
            height={36}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: "999px" }}
          />
        ))}
      </Box>

      {/* Content Skeleton */}
      <Box padding={2}>
        <Skeleton
          variant="rectangular"
          width="100%"
          height={200}
          sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2, mb: 2 }}
        />
        <Skeleton
          variant="rectangular"
          width="100%"
          height={150}
          sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}
        />
      </Box>
    </Box>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <Box
          className="dashboard-page-background"
          style={{
            minHeight: "100vh",
            paddingBottom: "88px",
          }}
        >
          {/* Header Skeleton */}
          <Box
            sx={{
              padding: 2,
              borderBottom: "solid 1px rgba(255,255,255,0.2)",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Skeleton
                  variant="rectangular"
                  width={40}
                  height={40}
                  sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1 }}
                />
                <Skeleton
                  variant="text"
                  width={150}
                  height={32}
                  sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
                />
              </Box>
              <Skeleton
                variant="circular"
                width={40}
                height={40}
                sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.4,
              }}
            >
              <Skeleton
                variant="text"
                width={200}
                height={24}
                sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
              />
              <Skeleton
                variant="text"
                width={120}
                height={20}
                sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
              />
            </Box>
          </Box>

          {/* Tabs Skeleton */}
          <Box sx={{ display: "flex", gap: 1, padding: 2 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width={100}
                height={36}
                sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: "999px" }}
              />
            ))}
          </Box>

          {/* Content Skeleton */}
          <Box padding={2}>
            <Skeleton
              variant="rectangular"
              width="100%"
              height={200}
              sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2, mb: 2 }}
            />
            <Skeleton
              variant="rectangular"
              width="100%"
              height={150}
              sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}
            />
          </Box>
        </Box>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
