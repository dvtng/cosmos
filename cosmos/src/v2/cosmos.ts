import { proxy, subscribe, ref } from "valtio";
import { type InternalState, type Spec, type State } from "./core";
import { serializeArgs } from "./serialize-args";
import { getNextSubscriberId } from "./get-next-subscriber-id";
import { toMs } from "../duration";
import { isNotSuspended, type NotSuspended } from "./suspended";

const KEEP_ALIVE_MS = 1000;

export type Cosmos = {
  states: Record<string, Record<string, InternalState<any>>>;
};

export const cosmos = proxy<Cosmos>({
  states: {},
});

export function initState<T>(spec: Spec<T>): InternalState<T> {
  const { states } = cosmos;

  if (!states[spec.key]) {
    states[spec.key] = {};
  }

  let serializedArgs = serializeArgs(spec.args);

  if (!cosmos.states[spec.key][serializedArgs]) {
    const state: InternalState<T> = {
      value: spec.value,
      error: spec.error,
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

    states[spec.key][serializedArgs] = state;
  }

  return states[spec.key][serializedArgs];
}

export function addSubscriber<T>(spec: Spec<T>, subscriberId: number) {
  const state = initState(spec);
  const { internal } = state;
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
    // TODO do we need to store and use an internal spec here?
    const { spec } = internal;
    const stop = spec.start?.(state);
    internal.stop = () => {
      internal.stop = undefined;
      internal.alive = false;
      stop?.();

      const forgetMs = toMs(spec.forget, null);
      if (forgetMs != null) {
        internal.keepStaleTimer = window.setTimeout(() => {
          const serializedArgs = serializeArgs(spec.args);
          if (cosmos.states[spec.key]?.[serializedArgs] === state) {
            delete cosmos.states[spec.key][serializedArgs];
          }
        }, forgetMs);
      }
    };
  }
}

export function removeSubscriber<T>(spec: Spec<T>, subscriberId: number) {
  const state = initState(spec);
  const { internal } = state;
  internal.subscribers.delete(subscriberId);

  if (internal.subscribers.size === 0 && internal.alive) {
    internal.keepAliveTimer = window.setTimeout(() => {
      internal.stop?.();
    }, KEEP_ALIVE_MS);
  }
}

export function getPromise<T>(spec: Spec<T>) {
  const state = initState(spec);

  if (!state.internal.promise) {
    state.internal.promise = new Promise<State<NotSuspended<T>>>(
      (resolve, reject) => {
        if (isNotSuspended(state.value)) {
          resolve(state as State<NotSuspended<T>>);
          return;
        }

        if (state.error) {
          reject(state.error);
          return;
        }

        const subscriberId = getNextSubscriberId();
        const unsubscribe = subscribe(state, () => {
          if (isNotSuspended(state.value) || state.error) {
            unsubscribe();
            removeSubscriber(spec, subscriberId);
            if (isNotSuspended(state.value)) {
              resolve(state as State<NotSuspended<T>>);
            } else {
              reject(state.error);
            }
          }
        });
        // Add subscriber after watching the state,
        // because the model may synchronously emit a value
        addSubscriber(spec, subscriberId);
      }
    );
  }

  return state.internal.promise;
}
