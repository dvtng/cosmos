import { useSnapshot } from "valtio";
import { type Snapshot, type Spec } from "./core";
import {
  removeSubscriber,
  addSubscriber,
  getPromise,
  initSpace,
} from "./cosmos";
import { serializeArgs } from "./serialize-args";
import { useLayoutEffect } from "react";
import { getNextSubscriberId } from "./get-next-subscriber-id";
import { createMapper } from "./later-map";

export function useModel<T>(spec: Spec<T>): Snapshot<T> {
  const $state = useSnapshot(initSpace(spec).state);

  useLayoutEffect(() => {
    const subscriberId = getNextSubscriberId();
    addSubscriber(spec, subscriberId);

    return () => {
      removeSubscriber(spec, subscriberId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.name, serializeArgs(spec.args)]);

  const map = createMapper(() => $state.value as T, {
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
}
