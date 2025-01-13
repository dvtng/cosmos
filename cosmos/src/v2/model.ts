import type { Model, Spec } from "./core";

let nextModelId = 0;

export type MinSpec<T> = { value: Spec<T>["value"] } & Partial<Spec<T>>;

/**
 * Creates a new model.
 */
export function model<TArgs extends any[], TValue>(
  resolve: (...args: TArgs) => MinSpec<TValue>
): Model<TArgs, TValue> {
  const defaultKey = `MODEL-${nextModelId++}`;

  return (...args) => {
    return {
      key: defaultKey,
      args,
      ...resolve(...args),
    };
  };
}
