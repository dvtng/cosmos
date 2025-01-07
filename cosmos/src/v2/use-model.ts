import { useSnapshot } from "valtio";
import { type QueryResult, type Query, isNotSuspended } from "./core";
import {
  initQueryState,
  removeSubscriber,
  addSubscriber,
  getPromise,
} from "./state";
import { serializeArgs } from "./serialize-query";
import { useLayoutEffect } from "react";
import { getNextSubscriberId } from "./get-next-subscriber-id";

export function useModel<TArgs extends any[], TValue>(
  query: Query<TArgs, TValue>
): QueryResult<TArgs, TValue> {
  const $queryState = useSnapshot(initQueryState(query));

  useLayoutEffect(() => {
    const subscriberId = getNextSubscriberId();
    addSubscriber(query, subscriberId);

    return () => {
      removeSubscriber(query, subscriberId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.key, serializeArgs(query.args)]);

  return {
    args: query.args,
    maybeValue: $queryState.value as TValue,
    error: $queryState.error,
    get value() {
      const v = $queryState.value as TValue;
      if (isNotSuspended(v)) {
        return v;
      }
      if ($queryState.error) {
        throw $queryState.error;
      }
      throw getPromise(query);
    },
  };
}
