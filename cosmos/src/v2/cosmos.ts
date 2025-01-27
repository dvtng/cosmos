import { proxy, subscribe, ref } from "valtio";
import { type Space, type Meta, type Spec, type State } from "./core";
import { serializeArgs } from "./serialize-args";
import { getNextSubscriberId } from "./get-next-subscriber-id";
import { toMs } from "../duration";
import { type Ready } from "./later";
import { createMapper } from "./later-map";
import { setSmartTimeout } from "../set-smart-timeout";

const KEEP_ALIVE_MS = 1000;

const NOT_IMPLEMENTED = () => {
  throw new Error("Not implemented");
};

export type Cosmos = {
  spaces: Record<string, Record<string, Space<any>>>;
};

export const cosmos = proxy<Cosmos>({
  spaces: {},
});

export function initSpace<T>(spec: Spec<T>): Space<T> {
  const { spaces } = cosmos;

  if (!spaces[spec.name]) {
    spaces[spec.name] = {};
  }

  let serializedArgs = serializeArgs(spec.args);

  if (!cosmos.spaces[spec.name][serializedArgs]) {
    const behavior = spec.resolve();
    const space: Space<T> = proxy({
      state: {
        value: behavior.value,
        updatedAt: 0,
      },
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

    const meta: Meta = {
      name: spec.name,
      args: spec.args,
    };

    behavior.onLoad?.(space.state, meta);

    const onWrite = behavior.onWrite;
    if (onWrite) {
      const unsubscribe = subscribe(space, () => {
        onWrite(space.state, meta);
      });
      space.internal.onDeleteHandlers.push(unsubscribe);
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
    const stop = behavior.onStart?.(space.state, meta);
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
          const unsubscribe = subscribe(space.state, () => {
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
          // Add subscriber after watching the state,
          // because the model may synchronously emit a value
          addSubscriber(spec, subscriberId);
        },
      });
    });
  }

  return space.internal.promise;
}
