import { proxy, subscribe, ref } from "valtio";
import {
  type QueryState,
  type Query,
  type CompleteSpec,
  isReady,
} from "./core";
import { serializeArgs } from "./serialize-query";
import { getError } from "./get-error";
import { getSpec } from "./get-spec";
import { getNextSubscriberId } from "./get-next-subscriber-id";
import { toMs } from "../duration";

const KEEP_ALIVE_MS = 1000;

export type State = {
  queries: Record<string, Record<string, QueryState<unknown>>>;
};

export const state = proxy<State>({
  queries: {},
});

export function initQueryState<TArgs extends any[], TValue>(
  query: Query<TArgs, TValue>
): QueryState<TValue> {
  if (!state.queries?.[query.key]) {
    state.queries[query.key] = {};
  }

  let serializedArgs = serializeArgs(query.args);

  if (!state.queries[query.key][serializedArgs]) {
    const spec = getSpec(query) as CompleteSpec<any>;

    // Check if spec overrides the args
    if (spec.args) {
      serializedArgs = serializeArgs(spec.args);
    }

    if (!state.queries[query.key][serializedArgs]) {
      state.queries[query.key][serializedArgs] = {
        value: spec.value,
        error: spec.error !== undefined ? getError(spec.error) : undefined,
        internal: ref({
          alive: false,
          spec,
          promise: undefined,
          subscribers: new Set<number>(),
          stop: undefined,
          keepAliveTimer: undefined,
          keepStaleTimer: undefined,
        }),
      };
    }
  }

  return state.queries[query.key][serializedArgs] as QueryState<TValue>;
}

export function getPromise<TArgs extends any[], TValue>(
  query: Query<TArgs, TValue>
) {
  const queryState = initQueryState(query);

  if (!queryState.internal.promise) {
    queryState.internal.promise = new Promise<TValue>((resolve, reject) => {
      if (isReady(queryState.value)) {
        resolve(queryState.value);
        return;
      }

      if (queryState.error) {
        reject(queryState.error);
        return;
      }

      const subscriberId = getNextSubscriberId();
      const unsubscribe = subscribe(queryState, () => {
        if (isReady(queryState.value) || queryState.error) {
          unsubscribe();
          removeSubscriber(query, subscriberId);
          if (isReady(queryState.value)) {
            resolve(queryState.value);
          } else {
            reject(queryState.error);
          }
        }
      });
      // Add subscriber after watching the state,
      // because the model may synchronously emit a value
      addSubscriber(query, subscriberId);
    });
  }

  return queryState.internal.promise;
}

export function addSubscriber<TArgs extends any[], TValue>(
  query: Query<TArgs, TValue>,
  subscriberId: number
) {
  const queryState = initQueryState(query);
  const { internal } = queryState;
  internal.subscribers.add(subscriberId);

  if (internal.keepAliveTimer) {
    window.clearTimeout(internal.keepAliveTimer);
    internal.keepAliveTimer = undefined;
  }
  if (internal.keepStaleTimer) {
    window.clearTimeout(internal.keepStaleTimer);
    internal.keepStaleTimer = undefined;
  }

  if (!internal.alive) {
    internal.alive = true;
    const stop = internal.spec.start(queryState);
    internal.stop = () => {
      internal.stop = undefined;
      internal.alive = false;
      stop?.();

      const forgetMs = toMs(internal.spec.forget, null);
      if (forgetMs != null) {
        internal.keepStaleTimer = window.setTimeout(() => {
          const serializedArgs = serializeArgs(query.args);
          if (state.queries[query.key]?.[serializedArgs] === queryState) {
            delete state.queries[query.key][serializedArgs];
          }
        }, forgetMs);
      }
    };
  }
}

export function removeSubscriber<TArgs extends any[], TValue>(
  query: Query<TArgs, TValue>,
  subscriberId: number
) {
  const queryState = initQueryState(query);
  const { internal } = queryState;
  internal.subscribers.delete(subscriberId);

  if (internal.subscribers.size === 0 && internal.alive) {
    internal.keepAliveTimer = window.setTimeout(() => {
      internal.stop?.();
    }, KEEP_ALIVE_MS);
  }
}
