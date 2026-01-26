"use client";

import * as React from "react";
import { TextField } from "@mui/material";

type AppInputProps = {
  inputPadding?: string;
  width?: number | string;
  height?: number | string;
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

  // ID for testing
  testId?: string;

  fullWidth?: boolean;
} & Omit<React.ComponentProps<typeof TextField>, "onChange" | "value">;

export default function AppInput({
  label,
  value,
  onChange,
  name,
  width,
  height,
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
  testId,
  fullWidth = true,
  inputPadding,
  ...rest
}: AppInputProps) {
  return (
    <TextField
      {...rest}
      fullWidth={fullWidth}
      label={label}
      margin="dense"
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
          ...(testId && { 'data-testid': testId }),
      }}
      sx={{
        // Label colors
        "& .MuiInputLabel-root": { color: "white" },
        "& .MuiInputLabel-root.Mui-focused": { color: "white" },
        "& .MuiInputLabel-root.Mui-disabled": { color: "#9ca3af" }, // gray-400
        width: fullWidth ? undefined : width,
        height: height,

        // Input background + text
        "& .MuiOutlinedInput-root": {
          backgroundColor: "#262626",
          color: "white",

          "& input::placeholder": {
            color: "#9ca3af", // gray-400
            opacity: 1,
          },

          "& .MuiOutlinedInput-input": {
            padding: inputPadding ?? "10.5px 14px",
          },
          
          //chrome browser autofill overide
          "& input:-webkit-autofill": {
            WebkitBoxShadow: "0 0 0 1000px #262626 inset",
            WebkitTextFillColor: "white",
            caretColor: "white",
            borderRadius: "inherit",
          },

          "& input:-webkit-autofill:hover": {
            WebkitBoxShadow: "0 0 0 1000px #262626 inset",
            WebkitTextFillColor: "white",
          },

          "& input:-webkit-autofill:focus": {
            WebkitBoxShadow: "0 0 0 1000px #262626 inset",
            WebkitTextFillColor: "white",
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
