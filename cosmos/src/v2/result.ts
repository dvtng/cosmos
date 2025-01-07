import { isNotSuspended, type NonSuspended, type QueryResult } from "./core";

export function isReady<TArgs extends any[], TValue>(
  result: QueryResult<TArgs, TValue>
): result is QueryResult<TArgs, NonSuspended<TValue>> {
  return isNotSuspended(result.maybeValue);
}
