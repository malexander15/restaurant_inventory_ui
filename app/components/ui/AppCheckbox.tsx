"use client";

import * as React from "react";
import { Checkbox, FormControl, FormControlLabel, FormHelperText } from "@mui/material";

type AppCheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;

  name?: string;
  disabled?: boolean;

  // For validation feedback
  error?: boolean;
  helperText?: string;
};

export default function AppCheckbox({
  label,
  checked,
  onChange,
  name,
  disabled = false,
  error = false,
  helperText,
}: AppCheckboxProps) {
  return (
    <FormControl error={error} disabled={disabled}>
      <FormControlLabel
        control={
          <Checkbox
            name={name}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            sx={{
              color: "white",
              "&.Mui-checked": {
                color: error ? "#fca5a5" : "white",
              },
            }}
          />
        }
        label={label}
        sx={{
          color: "white",
        }}
      />

      {helperText && (
        <FormHelperText
          sx={{ color: error ? "#fca5a5" : "#9ca3af" }}
        >
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}
