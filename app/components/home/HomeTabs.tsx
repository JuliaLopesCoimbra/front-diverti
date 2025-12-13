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
    <Box sx={{ display: "flex", gap: 1, padding: 2 }}>
      {tabs.map((tab) => (
        <Button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          variant={active === tab.value ? "contained" : "outlined"}
        >
          {tab.label}
        </Button>
      ))}
    </Box>
  );
}
