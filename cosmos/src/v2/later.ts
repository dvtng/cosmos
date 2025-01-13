import { ref } from "valtio";

export type Later<T> = T | Loading | Error;

export function later<T>(): Later<T> {
  return LOADING;
}

export type Ready<T> = T extends Loading | Error ? never : T;

export type Cases<T, V> = {
  loading: () => V;
  value: (value: Ready<T>) => V;
  error?: (error: Error) => V;
};

export function match<T, V>(value: T, cases: Cases<T, V>): V {
  if (isError(value)) {
    if (!cases.error) {
      throw value;
    }
    return cases.error(value);
  }

  if (isLoading(value)) {
    return cases.loading();
  }

  return cases.value(value as Ready<T>);
}

type Loading = { __type: "LOADING" };

const LOADING: Loading = ref({ __type: "LOADING" });

export function isLoading(value: unknown): value is Loading {
  return value === LOADING;
}

export function isError(value: unknown): value is Error {
  return value instanceof Error;
}
