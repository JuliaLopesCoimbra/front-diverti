"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Button, Box } from "@mui/material";

export default function Home() {
  const router = useRouter();
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f7fc",
        backgroundImage: "url(/background/dashboard.png)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 32px",
        }}
      >
        {/* LOGO + TEXTO */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image
            src="/logo/logon1.png" // coloque sua logo em /public/logo.png
            alt="Camarote N1"
            width={60}
            height={60}
          />
          <strong style={{ fontSize: 22, color: "white" }}>Camarote N1</strong>
        </div>

        <Button
          onClick={() => router.push("/pages/auth/login")}
          sx={{
            color: "white",
            textTransform: "none",
            fontWeight: 500,
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.1)",
            },
          }}
        >
          Login
        </Button>
      </div>

      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",

          textAlign: "center",
        }}
      >
        <Image
          src="/components/dashboard-component.png"
          alt="Camarote N1"
          width={900}
          height={400}
          style={{ borderRadius: 12 }}
        />

        <p
          style={{
            maxWidth: 700,
            marginTop: 16,
            fontSize: 13,
            padding: "30px",
            color: "white",
            textAlign: "left",
          }}
        >
          Está chegando a hora de viver o inesquecível no Camarote Nº1 2026!
          Serão quatro dias para aproveitar cada alegoria, batida e momento do
          maior espetáculo da Terra. E pra você só se preocupar em #Sapucar,
          teremos nosso serviço de transfer exclusivo, oferecendo comodidade e
          segurança do início ao fim.
        </p>

        <p
          style={{
            maxWidth: 700,
            marginTop: 2,
            fontSize: 16,
            padding: "30px",
            color: "#000",
            textAlign: "left",
            lineHeight: 1.6,
          }}
        >
          <span
            style={{
              backgroundColor: "#ffffff",
              padding: "6px 10px",
              fontWeight: 600,
              display: "inline",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}
          >
            Prepare-se para sapucar como nunca antes. Te esperamos na Avenida!
          </span>
        </p>
        <Box
          sx={{
            maxWidth: 700,
            padding: "30px",
            alignSelf: "flex-start",
            color: "white",
          }}
          // className="border border-amber-600"
        >
          {/* DATA */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EventIcon style={{ color: "yellow" }} />
            <p style={{ margin: 0, fontSize: 15 }}>
              15, 16, 17 e 21 de fevereiro
            </p>
          </Box>

          {/* HORÁRIO */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AccessTimeIcon style={{ color: "yellow" }} />
            <p style={{ margin: 0, fontSize: 15 }}>19h</p>
          </Box>

          {/* LOCAL */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LocationOnIcon style={{ color: "yellow" }} />
            <p style={{ margin: 0, fontSize: 15 }}>
              Setor 2 - Marquês de Sapucaí
            </p>
          </Box>
        </Box>
        <Button
          onClick={() => router.push("/comprar")} // ajuste a rota se quiser
          sx={{
            marginTop: 3,
            backgroundColor: "#FFD600", // amarelo forte
            color: "#000", // texto preto
            fontWeight: 700,
            padding: "12px 32px",
            borderRadius: "30px",
            textTransform: "none",
            fontSize: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            "&:hover": {
              backgroundColor: "#FFC400", // hover um pouco mais escuro
            },
          }}
        >
          Comprar ingressos
        </Button>
      </main>
    </div>
  );
}
