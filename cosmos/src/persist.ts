import type { Meta, State, Trait } from "./core";
import { isError } from "./later";
import { serializeArgs } from "./serialize-args";

export function persist<T>(key: string): Trait<T> {
  function getStorageKey(meta: Meta) {
    return `cosmos:${key}:${serializeArgs(meta.args)}`;
  }

  return {
    onLoad: (state, meta) => {
      const storageKey = getStorageKey(meta);
      const serialized = localStorage.getItem(storageKey);
      if (serialized) {
        try {
          const parsed = JSON.parse(serialized);
          state.value = parsed.state.value;
          state.updatedAt = parsed.state.updatedAt;
        } catch (error) {
          console.error(`Failed to parse persisted state for ${storageKey}`);
          console.error(error);
        }
      }
    },

    onWrite: (state: State<unknown>, meta: Meta) => {
      // Don't persist errors
      if (isError(state.value)) {
        return;
      }

      const storageKey = getStorageKey(meta);
      try {
        localStorage.setItem(storageKey, JSON.stringify({ state }));
      } catch (error) {
        console.error(`Failed to persist state for ${storageKey}`);
        console.error(error);
      }
    },

    onDelete: (_state, meta) => {
      const storageKey = getStorageKey(meta);
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error(`Failed to delete persisted state for ${storageKey}`);
        console.error(error);
      }
    },
  };
}
