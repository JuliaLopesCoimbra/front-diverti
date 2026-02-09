import React from "react";
import { TextField, TextFieldProps, Box } from "@mui/material";

interface FormTextFieldProps extends Omit<TextFieldProps, 'sx'> {
  shouldAnimate?: boolean;
}

const FormTextField: React.FC<FormTextFieldProps> = ({ shouldAnimate = false, sx, ...props }) => {
  const baseSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      color: "#fff",
      borderRadius: "14px",
      transition: "all 0.3s ease",
      "& fieldset": {
        borderColor: "rgba(255, 255, 255, 0.3)",
        borderWidth: "1.5px",
      },
      "&:hover fieldset": {
        borderColor: "rgba(255, 255, 255, 0.5)",
      },
      "&.Mui-focused": {
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        "& fieldset": {
          borderColor: "#fff",
          borderWidth: "2px",
        },
      },
      "& input:-webkit-autofill": {
        WebkitBoxShadow: "0 0 0 1000px rgba(255, 255, 255, 0.1) inset",
        WebkitTextFillColor: "#fff",
        transition: "background-color 9999s ease-in-out 0s",
      },
      "& input:-webkit-autofill:hover": {
        WebkitBoxShadow: "0 0 0 1000px rgba(255, 255, 255, 0.15) inset",
        WebkitTextFillColor: "#fff",
      },
      "& input:-webkit-autofill:focus": {
        WebkitBoxShadow: "0 0 0 1000px rgba(255, 255, 255, 0.15) inset",
        WebkitTextFillColor: "#fff",
      },
    },
    ...sx,
  };

  return (
    <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
      <TextField
        {...props}
        InputLabelProps={{
          shrink: true,
          sx: {
            color: "#fff",
            fontSize: 13,
            transform: "translate(14px, -9px) scale(1)",
            "&.Mui-focused": { color: "#fff" },
          },
        }}
        sx={baseSx}
      />
    </Box>
  );
};

export default FormTextField;

