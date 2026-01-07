"use client";

import { Snackbar, Alert } from "@mui/material";

type AppAlertProps = {
  open: boolean;
  message: string;
  severity?: "success" | "error" | "info" | "warning";
  onClose: () => void;
  autoHideDuration?: number;
};

export default function AppAlert({
  open,
  message,
  severity = "success",
  onClose,
  autoHideDuration = 3000,
}: AppAlertProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        sx={{
          backgroundColor: "#262626",
          color: "white",
          border: "1px solid #333",
          "& .MuiAlert-icon": {
            color: "white",
          },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
