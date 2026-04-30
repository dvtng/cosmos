import { type Snapshot, type Spec, type Behavior, type State } from "./core";
import { combineBehavior } from "./combine-behavior";
import { forget } from "./forget";
import { getNextSubscriberId } from "./get-next-subscriber-id";
import { addSubscriber, initSpace, removeSubscriber, subscribeToSpace } from "./cosmos";
import { serializeArgs } from "./serialize-args";
import { type Later, asError, isLoading, loading } from "./later";
import { createMapper } from "./later-map";

export type GetSnapshot = <T>(spec: Spec<T>) => Snapshot<T>;

export function compute<TValue>(
  fn: (get: GetSnapshot) => Later<TValue>,
  options: {
    defaultValue: TValue;
  }
): Behavior<TValue>;

export function compute<TValue>(
  fn: (get: GetSnapshot) => Later<TValue>,
  options?: {
    defaultValue?: TValue;
  }
): Behavior<Later<TValue>>;

export function compute<TValue>(
  fn: (get: GetSnapshot) => Later<TValue>,
  options?: {
    defaultValue?: TValue;
  }
): Behavior<Later<TValue>> {
  return combineBehavior([
    {
      value: (() => {
        try {
          return fn((spec) => {
            const { state } = initSpace(spec);
            return toSnapshot(spec, state);
          });
        } catch (error) {
          if (options?.defaultValue !== undefined) {
            return options.defaultValue;
          } else if (isLoading(error)) {
            return error;
          } else {
            return asError(error);
          }
        }
      })(),
      onStart({ set }) {
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
              const unsubscribe = subscribeToSpace(space, run);
              unsubscribes[key] = unsubscribe;
            }

            return toSnapshot(spec, space.state);
          };

          let newValue: Later<TValue>;
          try {
            newValue = fn(getSnapshot);
          } catch (error) {
            if (options?.defaultValue !== undefined) {
              newValue = options.defaultValue;
            } else if (isLoading(error)) {
              newValue = error;
            } else {
              newValue = asError(error) as Later<TValue>;
            }
          }

          set((draft) => {
            draft.value = newValue as any;
          });

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
    },
    forget(),
  ]);
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
