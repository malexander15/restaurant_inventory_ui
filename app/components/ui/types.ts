export type SelectOption<T extends string | number = string> = {
  value: T;
  label: string;
  secondary?: string;
};

export type GroupedSelectOption<T extends string | number = string> = {
  group: string;
  options: SelectOption<T>[];
};
