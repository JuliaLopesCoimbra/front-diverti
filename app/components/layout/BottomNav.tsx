"use client";

import { Box, IconButton } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import FavoriteIcon from "@mui/icons-material/Favorite";
import StoreIcon from "@mui/icons-material/Store";
import { usePathname, useRouter } from "next/navigation";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    { path: "/pages/user/home", icon: <HomeIcon /> },
    { path: "/pages/user/liked", icon: <FavoriteIcon /> },
  
    { path: "/pages/user/my-photos", icon: <StoreIcon /> },
  ];

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        backgroundColor: "rgba(0,0,0,0.85)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(6px)",
        zIndex: 1300,
      }}
    >
      {items.map((item) => {
        const isActive = pathname === item.path;

        return (
          <IconButton
            key={item.path}
            onClick={() => router.push(item.path)}
            sx={{
              color: isActive ? "#ffc91f" : "#fff",
              "& svg": {
                fontSize: isActive ? 28 : 24,
              },
              transition: "all 0.2s ease",
            }}
          >
            {item.icon}
          </IconButton>
        );
      })}
    </Box>
  );
}
