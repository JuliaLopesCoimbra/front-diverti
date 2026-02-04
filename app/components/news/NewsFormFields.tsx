"use client";

import React from "react";
import { Box, TextField, Typography } from "@mui/material";
import { Title as TitleIcon, Description } from "@mui/icons-material";

interface NewsFormFieldsProps {
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  loading?: boolean;
}

export default function NewsFormFields({
  title,
  content,
  onTitleChange,
  onContentChange,
  loading = false,
}: NewsFormFieldsProps) {
  return (
    <>
      {/* Seção de Título */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <TitleIcon sx={{ color: "#ffcc01", fontSize: 20 }} />
          <Typography
            variant="subtitle1"
            sx={{
              color: "#fff",
              fontWeight: 600,
              fontSize: "1rem",
            }}
          >
            Título
          </Typography>
        </Box>
        <TextField
          placeholder="Dê um título à sua publicação..."
          value={title}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue.length <= 100) {
              onTitleChange(newValue);
            }
          }}
          required
          fullWidth
          multiline
          minRows={1}
          maxRows={3}
          disabled={loading}
          inputProps={{
            maxLength: 100,
          }}
          helperText={`${title.length}/100 caracteres`}
          FormHelperTextProps={{
            sx: {
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.875rem",
              mt: 1,
            },
          }}
          sx={{
            "& .MuiInputBase-root": {
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              borderRadius: "12px",
              padding: "12px 16px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              transition: "all 0.3s ease",
              "&:hover": {
                borderColor: "rgba(255, 255, 255, 0.2)",
              },
              "&.Mui-focused": {
                borderColor: "#ffcc01",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
              },
            },
            "& .MuiInputBase-input": {
              color: "#fff",
              fontSize: "1.125rem",
              fontWeight: 500,
              wordBreak: "break-word",
              overflowWrap: "break-word",
              whiteSpace: "pre-wrap",
              overflow: "hidden",
              resize: "none",
              "&::placeholder": {
                color: "rgba(255,255,255,0.4)",
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

      {/* Seção de Conteúdo */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Description sx={{ color: "#ffcc01", fontSize: 20 }} />
          <Typography
            variant="subtitle1"
            sx={{
              color: "#fff",
              fontWeight: 600,
              fontSize: "1rem",
            }}
          >
            Legenda
          </Typography>
        </Box>
        <TextField
          placeholder="Conte sua história, compartilhe seus momentos..."
          value={content}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue.length <= 2000) {
              onContentChange(newValue);
            }
          }}
          required
          fullWidth
          multiline
          minRows={5}
          maxRows={12}
          disabled={loading}
          inputProps={{
            maxLength: 2000,
          }}
          helperText={`${content.length}/2000 caracteres`}
          FormHelperTextProps={{
            sx: {
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.875rem",
              mt: 1,
            },
          }}
          sx={{
            "& .MuiInputBase-root": {
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              borderRadius: "12px",
              padding: "12px 16px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              transition: "all 0.3s ease",
              "&:hover": {
                borderColor: "rgba(255, 255, 255, 0.2)",
              },
              "&.Mui-focused": {
                borderColor: "#ffcc01",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
              },
            },
            "& .MuiInputBase-input": {
              color: "#fff",
              fontSize: "1rem",
              lineHeight: 1.6,
              wordBreak: "break-word",
              overflowWrap: "break-word",
              whiteSpace: "pre-wrap",
              overflow: "hidden",
              resize: "none",
              "&::placeholder": {
                color: "rgba(255,255,255,0.4)",
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
    </>
  );
}




