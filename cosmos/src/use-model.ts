import { useSyncExternalStore, useLayoutEffect, useMemo } from "react";
import { type Snapshot, type Spec } from "./core";
import {
  removeSubscriber,
  addSubscriber,
  getPromise,
  initSpace,
  subscribeToSpace,
} from "./cosmos";
import { serializeArgs } from "./serialize-args";
import { getNextSubscriberId } from "./get-next-subscriber-id";
import { createMapper } from "./later-map";

export function useModel<T>(spec: Spec<T>): Snapshot<T> {
  const space = initSpace(spec);

  const state = useSyncExternalStore(
    (onStoreChange) => subscribeToSpace(space, onStoreChange),
    () => space.state,
  );

  useLayoutEffect(() => {
    const subscriberId = getNextSubscriberId();
    addSubscriber(spec, subscriberId);

    return () => {
      removeSubscriber(spec, subscriberId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.name, serializeArgs(spec.args)]);

  return useMemo(() => {
    const map = createMapper(() => state.value as T, {
      value: (value) => {
        return value;
      },
      loading: () => {
        throw getPromise(spec);
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
  }, [state]);
}
