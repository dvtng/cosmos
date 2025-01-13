import { watch } from "valtio/utils";
import { type Snapshot, type InternalState, type Spec } from "./core";
import { getNextSubscriberId } from "./get-next-subscriber-id";
import { addSubscriber, initState, removeSubscriber } from "./cosmos";
import { serializeArgs } from "./serialize-args";
import { getError } from "./get-error";
import type { MinSpec } from "./model";
import { type Later, isLoading, later, match } from "./later";

export type GetSnapshot = <T>(spec: Spec<T>) => Snapshot<T>;

export function compute<TValue>(
  fn: (get: GetSnapshot) => Later<TValue>
): MinSpec<Later<TValue>> {
  return {
    forget: true,
    value: () => {
      try {
        return fn((spec) => {
          const queryState = initState(spec);
          return toSnapshot(spec, queryState);
        });
      } catch (error) {
        if (isLoading(error)) {
          return later();
        } else {
          return getError(error);
        }
      }
    },
    start(state) {
      const subscriberId = getNextSubscriberId();
      let specs: Record<string, Spec<any>> = {};

      const unwatch = watch((get) => {
        const nextSpecs: Record<string, Spec<any>> = {};

        const getModel: GetSnapshot = function (spec) {
          const state = initState(spec);
          addSubscriber(spec, subscriberId);
          nextSpecs[`${spec.key}:${serializeArgs(spec.args)}`] = spec;

          // Tell valtio to track the dependency
          get(state);

          return toSnapshot(spec, state);
        };

        try {
          state.value = fn(getModel);
        } catch (error) {
          if (!isLoading(error)) {
            state.value = getError(error);
          }
        }

        // Unsubscribe from old queries
        for (const key in specs) {
          if (!nextSpecs[key]) {
            removeSubscriber(specs[key], subscriberId);
          }
        }
        specs = nextSpecs;
      });

      return function cleanup() {
        unwatch();
        for (const key in specs) {
          removeSubscriber(specs[key], subscriberId);
        }
      };
    },
  };
}

function toSnapshot<T>(spec: Spec<T>, state: InternalState<T>): Snapshot<T> {
  const v = state.value;
  return {
    match: (cases) => {
      return match(v, cases);
    },
    get value() {
      return match(v, {
        value: (value) => value,
        loading: () => {
          throw later();
        },
      });
    },
  };
}
