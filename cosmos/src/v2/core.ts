import type { INTERNAL_Snapshot } from "valtio/vanilla";
import { ref } from "valtio";
import type { Duration } from "../duration";

export type Model<TArgs extends any[], TValue> = (
  ...args: TArgs
) => Query<TArgs, TValue>;

export type Query<TArgs extends any[], TValue> = {
  key: string;
  args: TArgs;
  resolve: (...args: TArgs) => Spec<TValue>;
};

export type CompleteSpec<TValue> = {
  key: string;
  args?: unknown[];
  value: TValue;
  error: Error | string | undefined;
  start: (state: State<TValue>) => (() => void) | void;
  forget: Duration | undefined;
};

export type Spec<TValue> = {
  value: TValue;
  forget?: Duration | true | undefined;
} & Partial<Omit<CompleteSpec<TValue>, "forget">>;

export type State<T> = {
  value: T;
  error: Error | undefined;
};

export type QueryState<TValue> = {
  value: TValue;
  error: Error | undefined;
  internal: {
    alive: boolean;
    spec: CompleteSpec<TValue>;
    promise: Promise<TValue> | undefined;
    subscribers: Set<number>;
    stop: (() => void) | undefined;
    keepAliveTimer: number | undefined;
    keepStaleTimer: number | undefined;
  };
};

export type Suspend = { __type: "SUSPEND" };

export const SUSPEND: Suspend = ref({ __type: "SUSPEND" });

export type Suspended<T> = T | Suspend;

export type NonSuspended<T> = T extends Suspend ? never : T;

export function suspended<T>(): Suspended<T> {
  return SUSPEND;
}

export function isReady<T>(value: T): value is NonSuspended<T> {
  return value !== SUSPEND;
}

export type QueryResult<TArgs extends any[], TValue> = {
  args: TArgs;
  value: NonSuspended<TValue>;
  maybeValue: TValue;
  error: Error | undefined;
};

export type Snapshot<T> = INTERNAL_Snapshot<T>;
