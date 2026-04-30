import type { Spec, Space } from "./core";
import { cosmos } from "./cosmos";
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

  if (internal.subscribers.size > 0) {
    throw new Error(
      `Cannot delete model ${spec.name} while it has active subscribers.`,
    );
  }

  if (internal.clearStopTimer) {
    internal.clearStopTimer();
    internal.clearStopTimer = undefined;
  }
  internal.stop?.();
  deleteSpace(spec, space);
}
