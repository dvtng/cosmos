import { ref } from "valtio";

export type Later<T> = T | Loading | Error;

export function loading<T>(): Later<T> {
  return LOADING;
}

export type Ready<T> = T extends Loading | Error ? never : T;

type Loading = { __type: "LOADING" };

const LOADING: Loading = ref({ __type: "LOADING" });

export function isLoading(value: unknown): value is Loading {
  return value === LOADING;
}

export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
