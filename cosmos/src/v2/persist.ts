import type { Meta, State, Trait } from "./core";
import { serializeArgs } from "./serialize-args";

export function persist(key: string): Trait {
  function getStorageKey(meta: Meta) {
    return `cosmos:${key}:${serializeArgs(meta.args)}`;
  }

  function write(state: State<unknown>, meta: Meta) {
    const storageKey = getStorageKey(meta);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ state }));
    } catch (error) {
      console.error(`Failed to persist state for ${storageKey}`);
      console.error(error);
    }
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
      } else {
        write(state, meta);
      }
    },
    onWrite: write,
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
