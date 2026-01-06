"use client";

import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  OutlinedInput,
} from "@mui/material";
import { SelectOption } from "./types";

type AppSelectProps<T> = {
  label: string;
  options: SelectOption<T>[];
  value: T | T[];
  onChange: (value: T | T[]) => void;

  multiple?: boolean;
  checkbox?: boolean;
  defaultValue?: T;

  disabled?: boolean;
  fullWidth?: boolean;
};

export function AppSelect<T>({
  label,
  options,
  value,
  onChange,
  multiple = false,
  checkbox = false,
  defaultValue,
  disabled = false,
  fullWidth = true,
}: AppSelectProps<T>) {
  return (
    <FormControl fullWidth={fullWidth}>
      <InputLabel sx={{ color: "white" }}>
        {label}
      </InputLabel>

      <Select
        multiple={multiple}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as T | T[])}
        input={
          <OutlinedInput
            label={label}
            sx={{
              backgroundColor: "#262626",
              color: "white",
            }}
          />
        }
        renderValue={(selected) => {
          if (Array.isArray(selected)) {
            return options
              .filter((o) => selected.includes(o.value))
              .map((o) => o.label)
              .join(", ");
          }
          return options.find((o) => o.value === selected)?.label ?? "";
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              backgroundColor: "#262626",
              color: "white",
              border: "1px solid #333",
            },
          },
        }}
        sx={{
          "& .MuiSelect-select": {
            color: "white",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#444",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#666",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#888",
          },
        }}
      >
        {options.map((opt) => (
          <MenuItem
            key={opt.value}
            value={opt.value}
            sx={{
              color: "white",
              "&.Mui-selected": {
                backgroundColor: "#333",
              },
              "&.Mui-selected:hover": {
                backgroundColor: "#444",
              },
              "&:hover": {
                backgroundColor: "#333",
              },
            }}
          >
            {checkbox && multiple && (
              <Checkbox
                checked={
                  Array.isArray(value) &&
                  value.includes(opt.value)
                }
              />
            )}
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}