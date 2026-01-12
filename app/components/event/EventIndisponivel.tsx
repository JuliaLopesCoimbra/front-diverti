"use client";

import { Button } from "@mui/material";
import { useRouter } from "next/navigation";

export default function EventIndisponivel() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
      <h1>Evento Indisponível</h1>
      <p>O evento que você procurou não está mais disponível ou não está ativo no momento.</p>
      <Button
        onClick={() => router.push("/")}
        sx={{
          marginTop: 3,
          backgroundColor: "#FFD600",
          color: "#000",
          fontWeight: 700,
          padding: "12px 32px",
          borderRadius: "30px",
          textTransform: "none",
          fontSize: 16,
          "&:hover": {
            backgroundColor: "#FFC400",
          },
        }}
      >
        Voltar para a página inicial
      </Button>
    </div>
  );
}
