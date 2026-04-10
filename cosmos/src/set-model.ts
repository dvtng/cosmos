import { produce } from "immer";
import type { Spec, State } from "./core";
import { initSpace, notifyListeners } from "./cosmos";

export function setModel<T>(spec: Spec<T>, recipe: (draft: State<T>) => void) {
  const space = initSpace(spec);
  space.state = produce(space.state, recipe);
  notifyListeners(space);
}
