import type { Spec, State } from "./core";
import { initState } from "./cosmos";

export function setModel<T>(spec: Spec<T>, setter: (state: State<T>) => void) {
  const state = initState(spec);
  setter(state);
}
