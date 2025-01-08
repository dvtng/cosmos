import { ref } from "valtio";

type Suspend = { __type: "SUSPEND" };

const SUSPEND: Suspend = ref({ __type: "SUSPEND" });

export type Suspended<T> = T | Suspend;

export type NotSuspended<T> = T extends Suspend ? never : T;

export function suspended<T>(): Suspended<T> {
  return SUSPEND;
}

export function isNotSuspended<T>(value: T): value is NotSuspended<T> {
  return value !== SUSPEND;
}
