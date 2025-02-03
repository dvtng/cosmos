import { type Snapshot, type Spec, type Behavior, type State } from "./core";
import { getNextSubscriberId } from "./get-next-subscriber-id";
import { addSubscriber, initSpace, removeSubscriber } from "./cosmos";
import { serializeArgs } from "./serialize-args";
import { type Later, asError, isLoading, loading } from "./later";
import { createMapper } from "./later-map";
import { subscribe } from "valtio";

export type GetSnapshot = <T>(spec: Spec<T>) => Snapshot<T>;

export function compute<TValue>(
  fn: (get: GetSnapshot) => Later<TValue>
): Behavior<Later<TValue>> {
  return {
    forget: true,
    value: (() => {
      try {
        return fn((spec) => {
          const { state } = initSpace(spec);
          return toSnapshot(spec, state);
        });
      } catch (error) {
        if (isLoading(error)) {
          return error;
        } else {
          return asError(error);
        }
      }
    })(),
    onStart(state, meta) {
      const subscriberId = getNextSubscriberId();
      let specs: Record<string, Spec<any>> = {};
      const unsubscribes: Record<string, () => void> = {};

      function run() {
        const nextSpecs: Record<string, Spec<any>> = {};

        const getSnapshot: GetSnapshot = function (spec) {
          const space = initSpace(spec);
          addSubscriber(spec, subscriberId);
          const key = `${spec.name}:${serializeArgs(spec.args)}`;
          nextSpecs[key] = spec;

          if (!unsubscribes[key]) {
            const unsubscribe = subscribe(space.state, run);
            unsubscribes[key] = unsubscribe;
          }

          return toSnapshot(spec, space.state);
        };

        try {
          state.value = fn(getSnapshot);
        } catch (error) {
          if (isLoading(error)) {
            state.value = error;
          } else {
            state.value = asError(error);
          }
        }

        // Unsubscribe from old queries
        for (const key in specs) {
          if (!nextSpecs[key]) {
            removeSubscriber(specs[key], subscriberId);
            unsubscribes[key]();
            delete unsubscribes[key];
          }
        }

        specs = nextSpecs;
      }

      run();

      return function stop() {
        for (const key in specs) {
          removeSubscriber(specs[key], subscriberId);
        }
        for (const key in unsubscribes) {
          unsubscribes[key]();
        }
      };
    },
  };
}

function toSnapshot<T>(spec: Spec<T>, state: State<T>): Snapshot<T> {
  const v = state.value;
  const map = createMapper(() => v, {
    value: (value) => {
      return value;
    },
    loading: () => {
      throw loading();
    },
    error: (error) => {
      throw error;
    },
  });
  return {
    map,
    get value() {
      return map({});
    },
  };
}
