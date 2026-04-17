"use client";

import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  type DialogProps,
  type SxProps,
  type Theme,
} from "@mui/material";

type AppDialogProps = {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: DialogProps["maxWidth"];
  fullWidth?: boolean;
  contentSx?: SxProps<Theme>;
  paperSx?: SxProps<Theme>;
  testId?: string;
};

export default function AppDialog({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = "sm",
  fullWidth = true,
  contentSx = {},
  paperSx = {},
  testId = "app-dialog",
}: AppDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      data-testid={testId}
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "#262626",
            color: "white",
            border: "1px solid #333",
            ...paperSx,
          },
        },
      }}
    >
      {title && <DialogTitle>{title}</DialogTitle>}

      <DialogContent
        sx={{
          pt: 2,
          overflowY: "visible",
          ...contentSx,
        }}
      >
        {children}
      </DialogContent>
      {actions && (
        <DialogActions sx={{ p: 2, borderTop: "1px solid #333"}}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}
