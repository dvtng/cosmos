import { watch } from "valtio/utils";
import {
  type QueryResult,
  type Query,
  type QueryState,
  type Spec,
  isReady,
  suspended,
  SUSPEND,
  type Suspended,
} from "./core";
import { getNextSubscriberId } from "./get-next-subscriber-id";
import { addSubscriber, initQueryState, removeSubscriber } from "./state";
import { serializeQuery } from "./serialize-query";
import { getError } from "./get-error";

export type GetModel = <TArgs extends any[], TValue>(
  query: Query<TArgs, TValue>
) => QueryResult<TArgs, TValue>;

export function compute<TValue>(
  fn: (getModel: GetModel) => TValue
): Spec<Suspended<TValue>> {
  let value = suspended<TValue>();
  let error: Error | undefined;

  // Try to compute a synchronous value
  try {
    value = fn((query) => {
      const queryState = initQueryState(query);
      return toQueryResult(query, queryState);
    });
  } catch (error) {
    if (error !== SUSPEND) {
      error = getError(error);
    }
  }

  return {
    value,
    error,
    forget: true,
    start(state) {
      const subscriberId = getNextSubscriberId();
      let queries: Record<string, Query<any, any>> = {};

      const unwatch = watch((get) => {
        const nextQueries: Record<string, Query<any, any>> = {};

        const getModel: GetModel = function (query) {
          const queryState = initQueryState(query);
          addSubscriber(query, subscriberId);
          nextQueries[serializeQuery(query)] = query;

          // Tell valtio to track the dependency
          get(queryState);

          return toQueryResult(query, queryState);
        };

        try {
          state.value = fn(getModel);
        } catch (error) {
          if (error !== SUSPEND) {
            state.error = getError(error);
          }
        }

        // Unsubscribe from old queries
        for (const key in queries) {
          if (!nextQueries[key]) {
            removeSubscriber(queries[key], subscriberId);
          }
        }
        queries = nextQueries;
      });

      return function cleanup() {
        unwatch();
        for (const key in queries) {
          removeSubscriber(queries[key], subscriberId);
        }
      };
    },
  };
}

function toQueryResult<TArgs extends any[], TValue>(
  query: Query<TArgs, TValue>,
  queryState: QueryState<TValue>
): QueryResult<TArgs, TValue> {
  return {
    args: query.args,
    maybeValue: queryState.value,
    error: queryState.error,
    get value() {
      if (isReady(queryState.value)) {
        return queryState.value;
      }
      throw SUSPEND;
    },
  };
}
