import type { Spec, State } from "./core";
import { createSetState, initSpace } from "./cosmos";

export function setModel<T>(spec: Spec<T>, recipe: (state: State<T>) => void) {
  const space = initSpace(spec);
  createSetState(space)(recipe);
}
