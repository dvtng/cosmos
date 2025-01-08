import { useSnapshot } from "valtio";
import { type Snapshot, type Spec } from "./core";
import { removeSubscriber, addSubscriber, getPromise } from "./cosmos";
import { serializeArgs } from "./serialize-args";
import { useLayoutEffect } from "react";
import { getNextSubscriberId } from "./get-next-subscriber-id";
import { isNotSuspended } from "./suspended";
import { getModel } from "./get-model";

export function useModel<T>(spec: Spec<T>): Snapshot<T> {
  const $state = useSnapshot(getModel(spec));

  useLayoutEffect(() => {
    const subscriberId = getNextSubscriberId();
    addSubscriber(spec, subscriberId);

    return () => {
      removeSubscriber(spec, subscriberId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.key, serializeArgs(spec.args)]);

  return {
    get maybeValue() {
      return $state.value as T;
    },
    get error() {
      return $state.error;
    },
    get value() {
      const v = $state.value as T;
      if (isNotSuspended(v)) {
        return v;
      }
      if ($state.error) {
        throw $state.error;
      }
      throw getPromise(spec);
    },
  };
}
