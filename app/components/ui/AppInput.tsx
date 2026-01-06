"use client";

import * as React from "react";
import { TextField } from "@mui/material";

type AppInputProps = {
  label: string;
  value: string | number;
  onChange: (value: string) => void;

  name?: string;
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
  placeholder?: string;
  size?: "small" | "medium";

  required?: boolean;
  disabled?: boolean;

  // For validation feedback
  error?: boolean;
  helperText?: string;

  // For number inputs
  min?: number;
  max?: number;
  step?: number;

  fullWidth?: boolean;
};

export default function AppInput({
  label,
  value,
  onChange,
  name,
  type = "text",
  placeholder,
  size = "medium",
  required = false,
  disabled = false,
  error = false,
  helperText,
  min,
  max,
  step,
  fullWidth = true,
}: AppInputProps) {
  return (
    <TextField
      fullWidth={fullWidth}
      label={label}
      name={name}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      size={size}
      required={required}
      disabled={disabled}
      error={error}
      helperText={helperText}
      variant="outlined"
      InputLabelProps={{
        sx: { color: "white" },
      }}
      inputProps={{
        min,
        max,
        step,
      }}
      sx={{
        // Label colors
        "& .MuiInputLabel-root": { color: "white" },
        "& .MuiInputLabel-root.Mui-focused": { color: "white" },

        // Input background + text
        "& .MuiOutlinedInput-root": {
          backgroundColor: "#262626",
          color: "white",

          "& input::placeholder": {
            color: "#9ca3af", // gray-400
            opacity: 1,
          },

          // Border
          "& fieldset": { borderColor: "#333" },
          "&:hover fieldset": { borderColor: "#555" },
          "&.Mui-focused fieldset": { borderColor: "#777" },

          // Disabled styles
          "&.Mui-disabled": {
            backgroundColor: "#1f1f1f",
            color: "#9ca3af",
          },
        },

        // Helper text
        "& .MuiFormHelperText-root": {
          color: error ? "#fca5a5" : "#9ca3af", // red-300 if error else gray
        },
      }}
    />
  );
}
