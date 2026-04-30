import type { Spec, Space } from "./core";
import { cosmos, removeSubscriber } from "./cosmos";
import { serializeArgs } from "./serialize-args";

function deleteSpace<T>(spec: Spec<T>, space: Space<T>) {
  for (const handler of space.internal.onDeleteHandlers) {
    handler();
  }

  const serializedArgs = serializeArgs(spec.args);
  if (cosmos.spaces[spec.name]?.[serializedArgs] === space) {
    delete cosmos.spaces[spec.name][serializedArgs];
  }
}

export function deleteModel<T>(spec: Spec<T>) {
  const serializedArgs = serializeArgs(spec.args);
  const space = cosmos.spaces[spec.name]?.[serializedArgs];
  if (!space) {
    return;
  }

  const { internal } = space;

  // Remove all subscribers
  for (const subscriberId of internal.subscribers) {
    removeSubscriber(spec, subscriberId);
  }

  if (internal.clearStopTimer) {
    internal.clearStopTimer();
    internal.clearStopTimer = undefined;
  }
  internal.stop?.();
  deleteSpace(spec, space);
}
