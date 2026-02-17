// app/lib/errors.ts
export function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}