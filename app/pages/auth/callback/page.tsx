"use client";

import { useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
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

    login(access, refresh);
    router.replace("/pages/user/home");
  }, [params, login, router]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      gap={2}
    >
      <CircularProgress size={48} />
      <Typography variant="body1" color="text.secondary">
        Finalizando autenticação...
      </Typography>
    </Box>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="100vh"
          gap={2}
        >
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary">
            Carregando...
          </Typography>
        </Box>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
