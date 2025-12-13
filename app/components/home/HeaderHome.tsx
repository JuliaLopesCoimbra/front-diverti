"use client";

import { Box, Typography, Avatar } from "@mui/material";
import { useEffect, useState } from "react";
import { getMe, MeResponse } from "@/app/services/auth/authService";

export default function HomeHeader() {
  const [user, setUser] = useState<MeResponse | null>(null);

  useEffect(() => {
    getMe().then(setUser).catch(console.error);
  }, []);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (!user) return null;

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h6" fontWeight={700}>
        {user.name}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        {today}
      </Typography>

      <Avatar
        src={user.photo_url}
        sx={{ width: 48, height: 48, marginTop: 1 }}
      />
    </Box>
  );
}
