"use client";
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton onClick={() => setOpen(true)}>
        <MenuIcon />
      </IconButton>

      <Drawer open={open} onClose={() => setOpen(false)}>
      <List>
  <ListItem>
    <ListItemText
      primary="Ambiente atual"
      secondary="Evento N1 - Brasília"
    />
  </ListItem>

  <ListItem disablePadding>
    <ListItemButton>
      <ListItemText primary="Trocar ambiente" />
    </ListItemButton>
  </ListItem>

  <ListItem disablePadding>
    <ListItemButton>
      <ListItemText primary="Configurações" />
    </ListItemButton>
  </ListItem>
</List>

      </Drawer>
    </>
  );
}
