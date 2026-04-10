import { produce } from "immer";
import {
  type Space,
  type Meta,
  type Spec,
  type State,
  type SetState,
} from "./core";
import { serializeArgs } from "./serialize-args";
import { getNextSubscriberId } from "./get-next-subscriber-id";
import { toMs } from "./duration";
import { type Ready } from "./later";
import { createMapper } from "./later-map";
import { setSmartTimeout } from "./set-smart-timeout";

const KEEP_ALIVE_MS = 1000;

const NOT_IMPLEMENTED = () => {
  throw new Error("Not implemented");
};

export type Cosmos = {
  spaces: Record<string, Record<string, Space<any>>>;
};

export const cosmos: Cosmos = {
  spaces: {},
};

export function notifyListeners<T>(space: Space<T>) {
  for (const listener of space.internal.listeners) {
    listener();
  }
}

export function createSetState<T>(space: Space<T>): SetState<T> {
  return (recipe) => {
    space.state = produce(space.state, recipe);
    notifyListeners(space);
  };
}

export function subscribeToSpace<T>(
  space: Space<T>,
  listener: () => void,
): () => void {
  space.internal.listeners.add(listener);
  return () => {
    space.internal.listeners.delete(listener);
  };
}

export function initSpace<T>(spec: Spec<T>): Space<T> {
  const { spaces } = cosmos;

  if (!spaces[spec.name]) {
    spaces[spec.name] = {};
  }

  let serializedArgs = serializeArgs(spec.args);

  if (!cosmos.spaces[spec.name][serializedArgs]) {
    const behavior = spec.resolve();
    const space: Space<T> = {
      state: {
        value: behavior.value,
        updatedAt: 0,
      },
      internal: {
        alive: false,
        behavior,
        promise: undefined,
        subscribers: new Set<number>(),
        listeners: new Set<() => void>(),
        stop: undefined,
        clearStopTimer: undefined,
        clearForgetTimer: undefined,
        onDeleteHandlers: [],
      },
    };

    const meta: Meta = {
      name: spec.name,
      args: spec.args,
    };

    const setState = createSetState(space);

    behavior.onLoad?.(space.state, setState, meta);

    const onWrite = behavior.onWrite;
    if (onWrite) {
      const listener = () => {
        onWrite(space.state, meta);
      };
      space.internal.listeners.add(listener);
      space.internal.onDeleteHandlers.push(() => {
        space.internal.listeners.delete(listener);
      });
    }

    const onDelete = behavior.onDelete;
    if (onDelete) {
      space.internal.onDeleteHandlers.push(() => onDelete(space.state, meta));
    }

    spaces[spec.name][serializedArgs] = space;
  }

  return spaces[spec.name][serializedArgs];
}

export function addSubscriber<T>(spec: Spec<T>, subscriberId: number) {
  const space = initSpace(spec);
  const { internal } = space;
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
    const meta: Meta = {
      name: spec.name,
      args: spec.args,
    };
    const setState = createSetState(space);
    const stop = behavior.onStart?.(space.state, setState, meta);
    internal.stop = () => {
      internal.stop = undefined;
      internal.alive = false;
      stop?.();

      const forgetMs = toMs(behavior.forget, null);
      if (forgetMs != null) {
        internal.clearForgetTimer = setSmartTimeout(() => {
          const serializedArgs = serializeArgs(spec.args);
          if (cosmos.spaces[spec.name]?.[serializedArgs] === space) {
            delete cosmos.spaces[spec.name][serializedArgs];
          }
        }, forgetMs);
      }
    };
  }
}

export function removeSubscriber<T>(spec: Spec<T>, subscriberId: number) {
  const space = initSpace(spec);
  const { internal } = space;
  internal.subscribers.delete(subscriberId);

  if (internal.subscribers.size === 0 && internal.alive) {
    internal.clearStopTimer = setSmartTimeout(() => {
      internal.stop?.();
    }, KEEP_ALIVE_MS);
  }
}

export function getPromise<T>(spec: Spec<T>) {
  const space = initSpace(spec);

  if (!space.internal.promise) {
    const map = createMapper(() => space.state.value, {
      value: NOT_IMPLEMENTED,
      loading: NOT_IMPLEMENTED,
      error: NOT_IMPLEMENTED,
    });

    space.internal.promise = new Promise<State<Ready<T>>>((resolve, reject) => {
      map({
        value: () => resolve(space.state as State<Ready<T>>),
        error: (error) => reject(error),
        loading: () => {
          const subscriberId = getNextSubscriberId();
          const unsubscribe = subscribeToSpace(space, () => {
            map({
              value: () => {
                unsubscribe();
                removeSubscriber(spec, subscriberId);
                resolve(space.state as State<Ready<T>>);
              },
              error: (error) => {
                unsubscribe();
                removeSubscriber(spec, subscriberId);
                reject(error);
              },
              loading: () => {},
            });
          });
          addSubscriber(spec, subscriberId);
        },
      });
    });
  }

  return space.internal.promise;
}
