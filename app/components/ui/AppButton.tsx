"use client";

import { Button, ButtonProps } from "@mui/material";
import { SxProps, Theme } from "@mui/system";

type AppButtonIntent = "primary" | "secondary" | "danger" | "ghost";

const intentStyles: Record<AppButtonIntent, SxProps<Theme>> = {
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

export type AppButtonProps = ButtonProps & {
  intent?: AppButtonIntent;
};

export default function AppButton({
  intent = "primary",
  sx,
  ...props
}: AppButtonProps) {
  const composedSx: SxProps<Theme> = [
    { textTransform: "none", borderRadius: 1 },
    intentStyles[intent],
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  return <Button {...props} sx={composedSx} />;
}
