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
      data-testid="confirm-dialog"
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
        <AppButton 
        intent="ghost" 
        onClick={onCancel}
        data-testid="confirm-cancel"
      >
          {cancelText}
        </AppButton>
        <AppButton 
          intent="primary" 
          onClick={onConfirm}
          data-testid="confirm-submit"
        >
          {confirmText}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}
