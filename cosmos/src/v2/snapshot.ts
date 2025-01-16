import type { Snapshot } from "./core";

export function isReady<T>(snapshot: Snapshot<T>): boolean {
  return snapshot.match({
    loading: () => false,
    error: () => false,
    value: () => true,
  });
}
