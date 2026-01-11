"use client";

import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  OutlinedInput,
  ListSubheader,
} from "@mui/material";
import { GroupedSelectOption, SelectOption } from "./types";
import React from "react";

type AppSelectProps<T extends string | number = string> = {
  label: string;
  options: SelectOption<T>[] | GroupedSelectOption<T>[];
  value: T | T[];
  onChange: (value: T | T[]) => void;

  multiple?: boolean;
  checkbox?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
};

export function AppSelect<T extends string | number = string>({
  label,
  options,
  value,
  onChange,
  multiple = false,
  checkbox = false,
  disabled = false,
  fullWidth = true,
}: AppSelectProps<T>) {
  // ✅ detect grouped options
  const isGrouped =
    options.length > 0 && "group" in options[0];

  // ✅ flatten options for renderValue
  const flatOptions: SelectOption<T>[] = isGrouped
    ? (options as GroupedSelectOption<T>[]).flatMap(
        (g) => g.options
      )
    : (options as SelectOption<T>[]);

  return (
    <FormControl fullWidth={fullWidth}>
      <InputLabel sx={{ color: "white" }}>
        {label}
      </InputLabel>

      <Select
        multiple={multiple}
        value={value}
        disabled={disabled}
        onChange={(e) =>
          onChange(e.target.value as T | T[])
        }
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
            return flatOptions
              .filter((o) => selected.includes(o.value))
              .map((o) => o.label)
              .join(", ");
          }

          return (
            flatOptions.find(
              (o) => o.value === selected
            )?.label ?? ""
          );
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
      {Array.isArray(options) &&
      options.length > 0 &&
      "group" in options[0]
        ? (options as GroupedSelectOption<T>[]).flatMap((group) => [
            <ListSubheader
              key={`subheader-${group.group}`}
              disableSticky
              sx={{
                backgroundColor: "#262626",
                color: "#aaa",
                fontSize: "0.75rem",
                fontWeight: 600,
                lineHeight: "32px",
              }}
            >
              {group.group}
            </ListSubheader>,

            ...group.options.map((child) => (
              <MenuItem
                key={child.value}
                value={child.value}
                sx={{
                  color: "white",
                  "&.Mui-selected": { backgroundColor: "#333" },
                  "&.Mui-selected:hover": { backgroundColor: "#444" },
                  "&:hover": { backgroundColor: "#333" },
                }}
              >
                {checkbox && multiple && (
                  <Checkbox
                    checked={
                      Array.isArray(value) && value.includes(child.value)
                    }
                  />
                )}
                {child.label}
              </MenuItem>
            )),
          ])
        : (options as SelectOption<T>[]).map((opt) => (
            <MenuItem
              key={opt.value}
              value={opt.value}
              sx={{
                color: "white",
                "&.Mui-selected": { backgroundColor: "#333" },
                "&.Mui-selected:hover": { backgroundColor: "#444" },
                "&:hover": { backgroundColor: "#333" },
              }}
            >
              {checkbox && multiple && (
                <Checkbox
                  checked={
                    Array.isArray(value) && value.includes(opt.value)
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