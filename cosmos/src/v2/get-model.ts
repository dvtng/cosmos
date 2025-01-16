import type { Spec, State } from "./core";
import { initSpace } from "./cosmos";

export function getModel<T>(spec: Spec<T>): State<T> {
  return initSpace(spec).state;
}
