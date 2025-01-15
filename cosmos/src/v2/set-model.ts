import type { Spec, State } from "./core";
import { getModel } from "./get-model";

export function setModel<T>(spec: Spec<T>, setter: (state: State<T>) => void) {
  const state = getModel(spec);
  setter(state);
}
