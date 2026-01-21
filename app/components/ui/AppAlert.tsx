"use client";

import { Snackbar, Alert } from "@mui/material";

type AppAlertProps = {
  open: boolean;
  message: string;
  severity?: "success" | "error" | "info" | "warning";
  variant?: "outlined" | "filled" | "standard";
  onClose: () => void;
  autoHideDuration?: number;
};

export default function AppAlert({
  open,
  message,
  severity = "success",
  variant = "standard",
  onClose,
  autoHideDuration = 3000,
}: AppAlertProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      sx={{
        mt: 8,
      }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant={variant}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
