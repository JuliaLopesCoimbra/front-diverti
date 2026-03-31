"use client";

import { Box, Typography, Button } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface CTAProps {
  imageUrl?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  onClick?: () => void;
}

export default function CTA({
  imageUrl = "https://www.b9.com.br/161531/a-melhor-coca-cola-de-todas-marca-lanca-campanha-global-e-aposta-tudo-na-versao-sem-acucar/", // Imagem mockada padrão
  title = "Aproveite ofertas exclusivas!",
  description = "Não perca as melhores promoções do momento",
  buttonText = "Saiba mais",
  onClick
}: CTAProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Ação mockada - pode ser substituída por uma URL real ou ação específica
      console.log("CTA clicked - Propaganda mockada");
    }
  };

  return (
    <Box
      sx={{
        mt: 2,
        mb: 2,
        mx: 2,
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
        position: "relative",
        cursor: "pointer",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
        },
      }}
      onClick={handleClick}
    >
      {/* Imagem da propaganda */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: { xs: 200, sm: 250, md: 300 },
          backgroundColor: "#000",
        }}
      >
        <Image
          src={imageUrl}
          alt={title || "Propaganda"}
          fill
          style={{
            objectFit: "cover",
          }}
          sizes="(max-width: 600px) 100vw, (max-width: 960px) 90vw, 800px"
        />
        
        {/* Overlay com gradiente para melhor legibilidade do texto */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
            p: 2,
            pt: 4,
          }}
        >
          {/* Conteúdo sobreposto na imagem */}
          <Box sx={{ position: "relative", zIndex: 1 }}>
            {title && (
              <Typography
                variant="h6"
                sx={{
                  color: "#fff",
                  fontWeight: 700,
                  mb: 0.5,
                  fontSize: { xs: 16, sm: 18 },
                  textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                }}
              >
                {title}
              </Typography>
            )}

            {description && (
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255, 255, 255, 0.95)",
                  mb: 2,
                  fontSize: { xs: 12, sm: 13 },
                  textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                }}
              >
                {description}
              </Typography>
            )}

            <Button
              variant="contained"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              sx={{
                backgroundColor: "rgb(255, 31, 33)",
                color: "#fff",
                fontWeight: 600,
                borderRadius: "20px",
                textTransform: "none",
                px: 3,
                py: 1,
                fontSize: 13,
                "&:hover": {
                  backgroundColor: "rgb(220, 20, 22)",
                  transform: "scale(1.05)",
                },
                transition: "all 0.3s ease",
              }}
            >
              {buttonText}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}


