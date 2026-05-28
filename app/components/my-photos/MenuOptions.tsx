"use client";

import { Box, Card, Typography, CardContent } from "@mui/material";
import { Article, PhotoLibrary, Block } from "@mui/icons-material";
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
  const { isAdminMaster, isSubadmin } = useAuth();
  
  const allOptions: MenuOption[] = [
    {
      id: "posts",
      title: "Meus Posts",
      icon: <Article sx={{ fontSize: 32 }} />,
      onClick: () => onSelectOption("posts"),
    },
    {
      id: "rejected",
      title: "Posts Rejeitados por Mim",
      icon: <Block sx={{ fontSize: 32 }} />,
      onClick: () => onSelectOption("rejected"),
    },
    {
      id: "photos",
      title: "Fotos Baixadas",
      icon: <PhotoLibrary sx={{ fontSize: 32 }} />,
      onClick: () => onSelectOption("photos"),
    },
  ];

  // Filtra opções: "Posts Rejeitados por Mim" só aparece para subadmin e admin master
  const options = allOptions.filter((option) => {
    if (option.id === "rejected") {
      return isAdminMaster || isSubadmin;
    }
    return true;
  });

  return (
    <Box 
      padding={2}
      sx={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Box 
        display="flex" 
        flexDirection="column" 
        gap={2}
        sx={{
          width: "100%",
          maxWidth: { xs: "100%", md: "600px" },
        }}
      >
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
                borderColor: "rgba(255, 31, 33, 0.5)",
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
                  color: "#ffffff",
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

