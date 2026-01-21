import { Box, Button } from "@mui/material";

type Tab = "home" | "eventos" | "foto" | "enredo";

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function HomeTabs({ active, onChange }: Props) {
  const tabs: { label: string; value: Tab }[] = [
    { label: "Home", value: "home" },
    { label: "Eventos", value: "eventos" },
    { label: "Foto IA", value: "foto" },
    { label: "Enredo", value: "enredo" },
  ];

  return (
    <Box 
      sx={{ 
        display: "flex", 
        gap: { xs: 1, md: 1.5, lg: 2 },
        padding: { xs: 2, md: 3, lg: 4 },
        justifyContent: { xs: "flex-start", md: "center" },
        maxWidth: { md: "1200px", lg: "1400px" },
        margin: { md: "0 auto" },
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.value;

        return (
          <Button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            sx={{
              borderRadius: "999px",
              textTransform: "none",
              fontWeight: 600,
              px: { xs: 1.5, md: 2, lg: 2.5 },
              minHeight: { xs: 36, md: 44, lg: 48 },
              width: { xs: 100, md: 120, lg: 140 },
              fontSize: { xs: "0.875rem", md: "1rem", lg: "1.125rem" },
              // Ativo
              backgroundColor: isActive ? "#ffc91f" : "transparent",
              color: isActive ? "#000" : "#fff",
              border: `1px solid ${
                isActive ? "#ffc91f" : "#fff"
              }`,

              "&:hover": {
                backgroundColor: isActive
                  ? "#f5bf12"
                  : "rgba(255,255,255,0.1)",
                borderColor: isActive ? "#f5bf12" : "#fff",
                fontWeight: 900,
              },
            }}
          >
            {tab.label}
          </Button>
        );
      })}
    </Box>
  );
}
