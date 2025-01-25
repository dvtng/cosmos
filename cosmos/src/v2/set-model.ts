import type { Spec, State } from "./core";
import { initSpace } from "./cosmos";

export function setModel<T>(spec: Spec<T>, setter: (state: State<T>) => void) {
  const { state } = initSpace(spec);
  setter(state);
}
