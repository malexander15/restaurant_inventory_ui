export type SelectOption<T = string> = {
  value: T;
  label: string;
  secondary?: string;
};