"use client";

import React from "react";
import { Box, Avatar, TextField, IconButton, CircularProgress } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

interface CommentInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  submitting?: boolean;
  userPhoto?: string;
  userName?: string;
  userEmail?: string;
}

export default function CommentInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Adicione um comentário...",
  disabled = false,
  submitting = false,
  userPhoto,
  userName,
  userEmail,
}: CommentInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
      <Avatar
        src={userPhoto || undefined}
        sx={{ width: 32, height: 32 }}
      >
        {userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || "U"}
      </Avatar>
      <Box sx={{ flex: 1 }}>
      <TextField
        fullWidth
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const newValue = e.target.value;
          if (newValue.length <= 500) {
            onChange(newValue);
          }
        }}
        onKeyPress={handleKeyPress}
        multiline
        minRows={1}
        maxRows={4}
        disabled={disabled || submitting}
        inputProps={{
          maxLength: 500,
        }}
        helperText={`${value.length}/500 caracteres`}
        FormHelperTextProps={{
          sx: {
            color: "rgba(255,255,255,0.5)",
            fontSize: "0.75rem",
            mt: 0.5,
          },
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "rgba(255,255,255,0.05)",
            color: "#fff",
            borderRadius: 2,
            "& fieldset": {
              borderColor: "rgba(255,255,255,0.1)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(255,255,255,0.2)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#ffc91f",
            },
          },
          "& .MuiInputBase-input": {
            color: "#fff",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "pre-wrap",
            overflow: "hidden",
            resize: "none",
            "&::placeholder": {
              color: "rgba(255,255,255,0.5)",
              opacity: 1,
            },
          },
          "& .MuiInputBase-inputMultiline": {
            overflow: "hidden !important",
            resize: "none",
          },
        }}
      />
      </Box>
      <IconButton
        onClick={onSubmit}
        disabled={!value.trim() || submitting || disabled}
        sx={{
          color: value.trim()
            ? "#ffc91f"
            : "rgba(255,255,255,0.3)",
        }}
      >
        {submitting ? (
          <CircularProgress size={20} sx={{ color: "#ffc91f" }} />
        ) : (
          <SendIcon />
        )}
      </IconButton>
    </Box>
  );
}
