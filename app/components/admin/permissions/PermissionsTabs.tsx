"use client";

import { Box, Paper, Tabs, Tab, Typography } from "@mui/material";
import { AdminPanelSettings, EditNote, People } from "@mui/icons-material";

interface PermissionsTabsProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
  isAdminMaster: boolean;
}

export default function PermissionsTabs({ value, onChange, isAdminMaster }: PermissionsTabsProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(20px)",
        borderRadius: 3,
        mb: 3,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Tabs
        value={value}
        onChange={onChange}
        sx={{
          width: "100%",
          "& .MuiTab-root": {
            color: "rgba(255,255,255,0.7)",
            textTransform: "none",
            fontSize: "1rem",
            fontWeight: 500,
            minHeight: 64,
            flex: { xs: 1, sm: "none" },
            "&.Mui-selected": {
              color: "#ffcc01",
              fontWeight: 600,
            },
          },
          "& .MuiTabs-indicator": {
            backgroundColor: "#ffcc01",
            height: 3,
            borderRadius: "3px 3px 0 0",
          },
        }}
      >
        {isAdminMaster && (
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, whiteSpace: "nowrap" }}>
                <AdminPanelSettings sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                <Typography
                  component="span"
                  sx={{
                    fontSize: { xs: "0.7rem", sm: "0.85rem", md: "0.95rem" },
                    fontWeight: "inherit",
                  }}
                >
                  Administradores
                </Typography>
              </Box>
            }
          />
        )}
        <Tab
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <EditNote sx={{ fontSize: 20 }} />
              <Typography
                component="span"
                sx={{
                  fontSize: { xs: "0.7rem", sm: "0.85rem", md: "0.95rem" },
                  fontWeight: "inherit",
                }}
              >
                Colunistas
              </Typography>
            </Box>
          }
        />
        <Tab
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <People sx={{ fontSize: 20 }} />
              <Typography
                component="span"
                sx={{
                  fontSize: { xs: "0.7rem", sm: "0.85rem", md: "0.95rem" },
                  fontWeight: "inherit",
                }}
              >
                Usuários
              </Typography>
            </Box>
          }
        />
      </Tabs>
    </Paper>
  );
}



















