export function getError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}
