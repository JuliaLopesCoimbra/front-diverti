"use client";

import { TextField, InputAdornment, Paper, IconButton } from "@mui/material";
import { Search, Clear } from "@mui/icons-material";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = "Pesquisar por nome ou email..." }: SearchBarProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(20px)",
        borderRadius: 2,
        mb: 3,
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <TextField
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        variant="outlined"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: "rgba(255,255,255,0.7)" }} />
            </InputAdornment>
          ),
          endAdornment: value && (
            <InputAdornment position="end">
              <IconButton
                onClick={() => onChange("")}
                size="small"
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  "&:hover": {
                    color: "#7c3aed",
                  },
                }}
              >
                <Clear sx={{ fontSize: 20 }} />
              </IconButton>
            </InputAdornment>
          ),
          sx: {
            color: "white",
            backgroundColor: "transparent",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.2)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(124, 58, 237, 0.5)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#7c3aed",
            },
          },
        }}
        sx={{
          "& .MuiInputBase-input": {
            color: "white",
            "&::placeholder": {
              color: "rgba(255,255,255,0.5)",
              opacity: 1,
            },
          },
        }}
      />
    </Paper>
  );
}

