"use client";
import { Box, Typography, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

interface RegisterSuccessProps {
  email: string;
}

const RegisterSuccess: React.FC<RegisterSuccessProps> = ({ email }) => {
  const router = useRouter();

  return (
    <Box
      sx={{
        height: "100vh",
        ...dashboardBackgroundSx,
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
          color: "#fff",
          textAlign: "center",
          padding: "30px",
        }}
      >
        <Typography variant="h5" fontWeight={600} mb={2}>
          Confirme seu e-mail 
        </Typography>

        <Typography variant="body2" sx={{ opacity: 0.85 }} mb={3}>
          Enviamos um link de confirmação para
          <br />
          <strong>{email}</strong>
        </Typography>

        <Typography
          variant="body2"
          sx={{ opacity: 0.7, fontSize: 14 }}
          mb={4}
        >
          Acesse seu e-mail e clique no link para ativar sua conta.
        </Typography>

        <Button
          fullWidth
          variant="contained"
          sx={{
            backgroundColor: "#ffffff",
            color: "#111111",
            fontWeight: 600,
            borderRadius: "14px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#e8e8e8",
            },
          }}
          onClick={() => router.push("/pages/auth/login")}
        >
          Ir para o login
        </Button>
      </Box>
    </Box>
  );
};

export default RegisterSuccess;

