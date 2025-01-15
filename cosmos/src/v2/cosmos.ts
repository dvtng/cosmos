import { proxy, subscribe, ref } from "valtio";
import { type InternalState, type Spec, type State } from "./core";
import { serializeArgs } from "./serialize-args";
import { getNextSubscriberId } from "./get-next-subscriber-id";
import { toMs } from "../duration";
import { match, type Ready } from "./later";
import { setSmartTimeout } from "../set-smart-timeout";

const KEEP_ALIVE_MS = 1000;

export type Cosmos = {
  states: Record<string, Record<string, InternalState<any>>>;
};

export const cosmos = proxy<Cosmos>({
  states: {},
});

export function initState<T>(spec: Spec<T>): InternalState<T> {
  const { states } = cosmos;

  if (!states[spec.name]) {
    states[spec.name] = {};
  }

  let serializedArgs = serializeArgs(spec.args);

  if (!cosmos.states[spec.name][serializedArgs]) {
    const behavior = spec.resolve();
    const state: InternalState<T> = proxy({
      value: behavior.value,
      updatedAt: 0,
      internal: ref({
        alive: false,
        behavior,
        promise: undefined,
        subscribers: new Set<number>(),
        stop: undefined,
        clearStopTimer: undefined,
        clearForgetTimer: undefined,
        onDeleteHandlers: [],
      }),
    });

    behavior.onLoad?.(state);

    const onWrite = behavior.onWrite;
    if (onWrite) {
      const unsubscribe = subscribe(state, () => {
        onWrite(state);
      });
      state.internal.onDeleteHandlers.push(unsubscribe);
    }

    const onDelete = behavior.onDelete;
    if (onDelete) {
      state.internal.onDeleteHandlers.push(onDelete);
    }

    states[spec.name][serializedArgs] = state;
  }

  return states[spec.name][serializedArgs];
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
    const { behavior } = internal;
    const stop = behavior.onStart?.(state);
    internal.stop = () => {
      internal.stop = undefined;
      internal.alive = false;
      stop?.();

      const forgetMs = toMs(behavior.forget, null);
      if (forgetMs != null) {
        internal.clearForgetTimer = setSmartTimeout(() => {
          const serializedArgs = serializeArgs(spec.args);
          if (cosmos.states[spec.name]?.[serializedArgs] === state) {
            delete cosmos.states[spec.name][serializedArgs];
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
    internal.clearStopTimer = setSmartTimeout(() => {
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
