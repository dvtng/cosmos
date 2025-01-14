import { proxy, subscribe, ref } from "valtio";
import { type InternalState, type Spec, type State } from "./core";
import { serializeArgs } from "./serialize-args";
import { getNextSubscriberId } from "./get-next-subscriber-id";
import { toMs } from "../duration";
import { match, type Ready } from "./later";
import { setSmartTimer } from "../smart-timer";

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
    const state: InternalState<T> = proxy({
      value:
        typeof spec.value === "function"
          ? (spec.value as () => T)()
          : spec.value,
      updatedAt: 0,
      internal: ref({
        alive: false,
        spec,
        promise: undefined,
        subscribers: new Set<number>(),
        stop: undefined,
        clearStopTimer: undefined,
        clearForgetTimer: undefined,
        onDeleteHandlers: [],
      }),
    });

    spec.onLoad?.(state);

    const onSet = spec.onSet;
    if (onSet) {
      const unsubscribe = subscribe(state, () => {
        onSet(state);
      });
      state.internal.onDeleteHandlers.push(unsubscribe);
    }

    const onDelete = spec.onDelete;
    if (onDelete) {
      state.internal.onDeleteHandlers.push(onDelete);
    }

    states[spec.key][serializedArgs] = state;
  }

  return states[spec.key][serializedArgs];
}

export function addSubscriber<T>(spec: Spec<T>, subscriberId: number) {
  const state = initState(spec);
  const { internal } = state;
  internal.subscribers.add(subscriberId);

  if (internal.clearStopTimer) {
    internal.clearStopTimer();
    internal.clearStopTimer = undefined;
  }
  if (internal.clearForgetTimer) {
    internal.clearForgetTimer();
    internal.clearForgetTimer = undefined;
  }

  if (!internal.alive) {
    internal.alive = true;
    // TODO do we need to store and use an internal spec here?
    const { spec } = internal;
    const stop = spec.onStart?.(state);
    internal.stop = () => {
      internal.stop = undefined;
      internal.alive = false;
      stop?.();

      const forgetMs = toMs(spec.forget, null);
      if (forgetMs != null) {
        internal.clearForgetTimer = setSmartTimer(() => {
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
    internal.clearStopTimer = setSmartTimer(() => {
      internal.stop?.();
    }, KEEP_ALIVE_MS);
  }
}

export function getPromise<T>(spec: Spec<T>) {
  const state = initState(spec);

  if (!state.internal.promise) {
    state.internal.promise = new Promise<State<Ready<T>>>((resolve, reject) => {
      match(state.value, {
        value: () => resolve(state as State<Ready<T>>),
        error: (error) => reject(error),
        loading: () => {
          const subscriberId = getNextSubscriberId();
          const unsubscribe = subscribe(state, () => {
            match(state.value, {
              value: () => {
                unsubscribe();
                removeSubscriber(spec, subscriberId);
                resolve(state as State<Ready<T>>);
              },
              error: (error) => {
                unsubscribe();
                removeSubscriber(spec, subscriberId);
                reject(error);
              },
              loading: () => {},
            });
          });
          // Add subscriber after watching the state,
          // because the model may synchronously emit a value
          addSubscriber(spec, subscriberId);
        },
      });
    });
  }

  return state.internal.promise;
}
