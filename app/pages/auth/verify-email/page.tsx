"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmail } from "@/app/services/auth/authService";
import { useToast } from "@/app/context/ToastContext";
import { Box, Typography, Button } from "@mui/material";

type Status = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const { showToast } = useToast();

  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail(token);
        setStatus("success");
        showToast("E-mail confirmado com sucesso!", "success");
      } catch {
        setStatus("error");
        showToast("Token inválido ou expirado", "error");
      }
    };

    verify();
  }, [token]);

  return (
    <Box
      sx={{
        height: "100vh",
        backgroundImage: "url(/background/dashboard.png)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Box
        sx={{
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          color: "#fff",
          padding: "30px",
        }}
      >
        {/* LOADING */}
        {status === "loading" && (
          <>
            <Typography variant="h6" mb={2}>
              Confirmando seu e-mail...
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Aguarde alguns instantes
            </Typography>
          </>
        )}

        {/* SUCCESS */}
        {status === "success" && (
          <>
            <Typography variant="h5" fontWeight={600} mb={2}>
              E-mail confirmado 
            </Typography>

            <Typography variant="body2" sx={{ opacity: 0.85 }} mb={4}>
              Sua conta foi ativada com sucesso.
              <br />
              Agora você já pode acessar a plataforma.
            </Typography>

            <Button
              fullWidth
              variant="contained"
              sx={{
                backgroundColor: "#ffcc01",
                color: "#000",
                fontWeight: 600,
                borderRadius: "14px",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#e6b800",
                },
              }}
              onClick={() => router.push("/pages/auth/login")}
            >
              Ir para o login
            </Button>
          </>
        )}

        {/* ERROR */}
        {status === "error" && (
          <>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Erro na verificação ❌
            </Typography>

            <Typography variant="body2" sx={{ opacity: 0.85 }} mb={4}>
              O link de verificação é inválido ou expirou.
            </Typography>

            <Button
              fullWidth
              variant="outlined"
              sx={{
                color: "#fff",
                borderColor: "#fff",
                borderRadius: "14px",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.08)",
                },
              }}
              onClick={() => router.push("/pages/auth/login")}
            >
              Voltar para o login
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            height: "100vh",
            backgroundImage: "url(/background/dashboard.png)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <Box
            sx={{
              maxWidth: 420,
              width: "100%",
              textAlign: "center",
              color: "#fff",
              padding: "30px",
            }}
          >
            <Typography variant="h6" mb={2}>
              Carregando...
            </Typography>
          </Box>
        </Box>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
