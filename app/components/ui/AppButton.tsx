"use client";

import * as React from "react";
import { Button } from "@mui/material";

export type AppButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
};

const AppButton = React.forwardRef<
  HTMLButtonElement,
  AppButtonProps
>(function AppButton(
  {
    children,
    onClick,
    type = "button",
    variant = "primary",
    disabled = false,
    fullWidth = false,
    startIcon,
    endIcon,
  },
  ref
) {
  const variantStyles = {
    primary: {
      backgroundColor: "#262626",
      color: "white",
      border: "1px solid #444",
      "&:hover": { backgroundColor: "#333" },
    },
    secondary: {
      backgroundColor: "transparent",
      color: "white",
      border: "1px solid #444",
      "&:hover": { backgroundColor: "#262626" },
    },
    danger: {
      backgroundColor: "#7f1d1d",
      color: "white",
      border: "1px solid #991b1b",
      "&:hover": { backgroundColor: "#991b1b" },
    },
    ghost: {
      backgroundColor: "transparent",
      color: "#9ca3af",
      "&:hover": { backgroundColor: "#1f1f1f" },
    },
  };

  return (
    <Button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      fullWidth={fullWidth}
      startIcon={startIcon}
      endIcon={endIcon}
      sx={{
        textTransform: "none",
        borderRadius: 1,
        ...variantStyles[variant],
      }}
    >
      {children}
    </Button>
  );
});

export default AppButton;
