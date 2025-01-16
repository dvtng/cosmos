import type { Behavior, Trait } from "./core";

export type Traits<T> = ArrayWithAtLeastOneOf<Behavior<T>, Trait>;

type ArrayWithAtLeastOneOf<TOne, TOther> =
  | (Array<TOne | TOther> & { 0: TOne })
  | [...Array<TOne | TOther>, TOne];

export function combineBehavior<T>(
  behavior: Behavior<T> | Traits<T>
): Behavior<T> {
  if (!Array.isArray(behavior)) {
    return behavior;
  }

  const value = (behavior.find((b) => "value" in b) as Behavior<T>).value;
  const forget = behavior.find((b) => b.forget !== undefined)?.forget;

  return {
    value,
    forget,
    onLoad: combineFunctions(behavior.flatMap((b) => b.onLoad ?? [])),
    onStart: combineFunctions(behavior.flatMap((b) => b.onStart ?? [])),
    onWrite: combineFunctions(behavior.flatMap((b) => b.onWrite ?? [])),
    onDelete: combineFunctions(behavior.flatMap((b) => b.onDelete ?? [])),
  };
}

type Cleanup = () => void;

function combineFunctions<T extends any[]>(
  funcs: ((...args: T) => Cleanup | void)[]
) {
  if (!funcs.length) {
    return;
  }

  return (...args: T) => {
    const cleanups: Cleanup[] = [];

    for (const func of funcs) {
      const result = func(...args);
      if (typeof result === "function") {
        cleanups.push(result);
      }
    }

    if (cleanups.length) {
      return () => {
        for (const cleanup of cleanups) {
          cleanup();
        }
      };
    }
  };
}
