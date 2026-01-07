"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";
import AppButton from "./AppButton";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        sx: {
          backgroundColor: "#262626",
          color: "white",
          border: "1px solid #333",
        },
      }}
    >
      <DialogTitle>{title}</DialogTitle>

      {description && (
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#9ca3af" }}>
            {description}
          </Typography>
        </DialogContent>
      )}

      <DialogActions sx={{ p: 2 }}>
        <AppButton variant="ghost" onClick={onCancel}>
          {cancelText}
        </AppButton>
        <AppButton variant="primary" onClick={onConfirm}>
          {confirmText}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}
