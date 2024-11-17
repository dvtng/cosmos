import type { ModelResult } from "./core-types";
import { getPromise } from "./state";

export function waitFor<T>(
  modelResult: ModelResult<T | undefined>
): ModelResult<T> {
  if (modelResult[0] === undefined) {
    throw getPromise(modelResult[2]);
  }

  return modelResult as ModelResult<T>;
}
