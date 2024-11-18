import type { ModelResult, Query, QueryType } from "./core-types";
import { getAtom, getPromise } from "./state";

/**
 * Resolve a model query as a promise.
 */
export function getModel<Q extends Query>(query: Q) {
  return getPromise(query).then((atom) => {
    return [atom.value, atom, query] as ModelResult<QueryType<Q>>;
  });
}
