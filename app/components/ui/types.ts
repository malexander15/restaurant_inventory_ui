export type SelectOption<T extends string | number = string> = {
  value: T;
  label: string;
  secondary?: string;
};