import type { Meta, State, Trait } from "./core";
import { isError } from "./later";
import { serializeArgs } from "./serialize-args";

export interface PersistOptions<T> {
  /**
   * Custom function to serialize state before storing
   * @default JSON.stringify
   */
  serialize?: (state: State<T>) => string;

  /**
   * Custom function to parse serialized state
   * @default JSON.parse
   */
  parse?: (serialized: string) => State<T>;

  /**
   * Storage to use for persistence
   * @default localStorage
   */
  storage?: Storage;
}

export function persist<T>(key: string, options?: PersistOptions<T>): Trait<T> {
  const storage = options?.storage || localStorage;

  // Default serialization function
  const serialize =
    options?.serialize || ((state: State<T>) => JSON.stringify({ state }));

  // Default parse function
  const parse =
    options?.parse ||
    ((serialized: string) => {
      const parsed = JSON.parse(serialized);
      return parsed.state;
    });

  function getStorageKey(meta: Meta) {
    return `cosmos:${key}:${serializeArgs(meta.args)}`;
  }

  return {
    onLoad: (state, meta) => {
      const storageKey = getStorageKey(meta);
      const serialized = storage.getItem(storageKey);
      if (serialized) {
        try {
          const parsedState = parse(serialized);
          state.value = parsedState.value;
          state.updatedAt = parsedState.updatedAt;
        } catch (error) {
          console.error(`Failed to parse persisted state for ${storageKey}`);
          console.error(error);
        }
      }
    },

    onWrite: (state: State<T>, meta: Meta) => {
      // Don't persist errors
      if (isError(state.value)) {
        return;
      }

      const storageKey = getStorageKey(meta);
      try {
        storage.setItem(storageKey, serialize(state as State<T>));
      } catch (error) {
        console.error(`Failed to persist state for ${storageKey}`);
        console.error(error);
      }
    },

    onDelete: (_state, meta) => {
      const storageKey = getStorageKey(meta);
      try {
        storage.removeItem(storageKey);
      } catch (error) {
        console.error(`Failed to delete persisted state for ${storageKey}`);
        console.error(error);
      }
    },
  };
}
