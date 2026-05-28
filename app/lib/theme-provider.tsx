"use client";

import { ThemeProvider as MUIThemeProvider, createTheme } from "@mui/material/styles";
import { ReactNode } from "react";

const theme = createTheme({
  palette: {
    primary: {
      main: "#ffffff",
      dark: "#e8e8e8",
      contrastText: "#111111",
    },
  },
  typography: {
    fontFamily: 'var(--font-montserrat), "Montserrat", sans-serif',
    h1: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "1.75rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "0.9375rem",
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: 1.6,
    },
    button: {
      fontSize: "0.875rem",
      fontWeight: 500,
      textTransform: "none",
    },
    caption: {
      fontSize: "0.75rem",
      fontWeight: 400,
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        color: "primary",
      },
      styleOverrides: {
        contained: {
          color: "#fff",
        },
      },
    },
  },
});

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>;
}

