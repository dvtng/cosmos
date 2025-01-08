import type { Spec, State } from "./core";
import { initState } from "./cosmos";

export function getModel<T>(spec: Spec<T>): State<T> {
  return initState(spec);
}
