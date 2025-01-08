import { type Snapshot } from "./core";
import { isNotSuspended, type NotSuspended } from "./suspended";

export function isReady<T>(
  snapshot: Snapshot<T>
): snapshot is Snapshot<NotSuspended<T>> {
  return isNotSuspended(snapshot.maybeValue);
}
