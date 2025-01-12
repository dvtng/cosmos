import type { Duration } from "../duration";
import type { NotSuspended } from "./suspended";

export type State<T> = {
  value: T;
  error: Error | undefined;
  updatedAt: number;
};

export type InternalState<T> = State<T> & {
  internal: {
    alive: boolean;
    spec: Spec<T>;
    promise: Promise<State<NotSuspended<T>>> | undefined;
    subscribers: Set<number>;
    stop: (() => void) | undefined;
    clearStopTimer: (() => void) | undefined;
    clearForgetTimer: (() => void) | undefined;
  };
};

export type Model<Args extends any[], T> = (...args: Args) => Spec<T>;

export type Spec<T> = {
  key: string;
  args: unknown[];
  value: T;
  error?: Error;
  start?: (state: State<T>) => (() => void) | void;
  forget?: Duration | true;
};

export type Snapshot<T> = {
  value: NotSuspended<T>;
  maybeValue: T;
  error: Error | undefined;
};
