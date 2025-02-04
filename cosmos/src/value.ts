import type { Behavior } from "./core";

export function value<T>(value: T): Behavior<T> {
  return { value };
}
