import type { Model, Spec } from "./core";

let nextModelId = 0;

/**
 * Creates a new model.
 */
export function model<TArgs extends any[], TValue>(
  resolve: (...args: TArgs) => Spec<TValue>
): Model<TArgs, TValue> {
  const key = `MODEL-${nextModelId++}`;
  return (...args) => {
    return { key, args, resolve: resolve as any };
  };
}
