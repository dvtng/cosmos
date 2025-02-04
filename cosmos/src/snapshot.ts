import type { Snapshot } from "./core";

export function isReady<T>(snapshot: Snapshot<T>): boolean {
  return snapshot.map({
    loading: () => false,
    error: () => false,
    value: () => true,
  });
}
