"use client";

import { Box, Card, Typography, CardContent } from "@mui/material";
import { Article, PhotoLibrary, PendingActions } from "@mui/icons-material";
import { useAuth } from "@/app/context/AuthContext";

interface MenuOption {
  id: string;
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface MenuOptionsProps {
  onSelectOption: (option: string) => void;
}

export default function MenuOptions({ onSelectOption }: MenuOptionsProps) {
  const { isAdminMaster, isSubadmin, isColunista } = useAuth();

  const options: MenuOption[] = [
    {
      id: "posts",
      title: "Meus Posts",
      icon: <Article sx={{ fontSize: 32 }} />,
      onClick: () => onSelectOption("posts"),
    },
    {
      id: "photos",
      title: "Fotos Compradas",
      icon: <PhotoLibrary sx={{ fontSize: 32 }} />,
      onClick: () => onSelectOption("photos"),
    },
  ];

  // Adiciona opção de posts pendentes apenas para colunistas
  if (isColunista) {
    options.push({
      id: "pending",
      title: "Posts Pendentes",
      icon: <PendingActions sx={{ fontSize: 32 }} />,
      onClick: () => onSelectOption("pending"),
    });
  }

  return (
    <Box padding={2}>
      <Typography
        variant="h6"
        fontWeight={500}
        sx={{ color: "#fff", marginBottom: 2, fontSize: "1rem" }}
      >
        Minhas Publicações
      </Typography>

      <Box display="flex" flexDirection="column" gap={2}>
        {options.map((option) => (
          <Card
            key={option.id}
            onClick={option.onClick}
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 2,
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                transform: "translateY(-2px)",
                borderColor: "rgba(255, 214, 0, 0.5)",
              },
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                padding: 2,
                "&:last-child": {
                  paddingBottom: 2,
                },
              }}
            >
              <Box
                sx={{
                  color: "#FFD600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {option.icon}
              </Box>
              <Typography
                variant="body1"
                fontWeight={500}
                sx={{ color: "#fff", flex: 1, fontSize: "0.9375rem" }}
              >
                {option.title}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

