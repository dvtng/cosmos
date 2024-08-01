import type { ModelResult, Query, QueryType } from "./core-types";
import { getAtom, getPromise } from "./state";

/**
 * Resolve a model query as a promise.
 */
export function getModel<Q extends Query>(query: Q) {
  return getPromise(query).then((value) => {
    const atom = getAtom(query);
    return [value, atom, query] as ModelResult<QueryType<Q>>;
  });
}
