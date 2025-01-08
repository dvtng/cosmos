import { watch } from "valtio/utils";
import { type Snapshot, type InternalState, type Spec } from "./core";
import { getNextSubscriberId } from "./get-next-subscriber-id";
import { addSubscriber, initState, removeSubscriber } from "./cosmos";
import { serializeArgs } from "./serialize-args";
import { getError } from "./get-error";
import type { MinSpec } from "./model";
import { type Suspended, isNotSuspended, suspended } from "./suspended";
import type { Immutable } from "./immutable";

export type GetSnapshot = <T>(spec: Spec<T>) => Snapshot<T>;

export function compute<TValue>(
  fn: (get: GetSnapshot) => Suspended<TValue>
): MinSpec<Suspended<TValue>> {
  let value = suspended<TValue>();
  let error: Error | undefined;

  // Try to compute a synchronous value
  try {
    value = fn((query) => {
      const queryState = initState(query);
      return toSnapshot(query, queryState);
    });
  } catch (error) {
    if (isNotSuspended(error)) {
      error = getError(error);
    }
  }

  return {
    value,
    error,
    forget: true,
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
          if (isNotSuspended(error)) {
            state.error = getError(error);
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
  const v = state.value as Immutable<T>;
  return {
    maybeValue: v,
    error: state.error,
    get value() {
      if (isNotSuspended(v)) {
        return v;
      }
      throw suspended();
    },
  };
}
