import type { Duration } from "../duration";
import type { Cases, Ready } from "./later";

export type State<T> = {
  value: T;
  updatedAt: number;
};

export type InternalState<T> = State<T> & {
  internal: {
    alive: boolean;
    spec: Spec<T>;
    promise: Promise<State<Ready<T>>> | undefined;
    subscribers: Set<number>;
    stop: (() => void) | undefined;
    clearStopTimer: (() => void) | undefined;
    clearForgetTimer: (() => void) | undefined;
    onDeleteHandlers: (() => void)[];
  };
};

export type Model<Args extends any[], T> = (...args: Args) => Spec<T>;

export type Spec<T> = {
  key: string;
  args: unknown[];
  value: T | (() => T);
  forget?: Duration | true;
  onLoad?: (state: State<T>) => void;
  onStart?: (state: State<T>) => (() => void) | void;
  onSet?: (state: State<T>) => void;
  onDelete?: () => void;
};

export type Snapshot<T> = {
  match: <V>(cases: Cases<T, V>) => V;
  value: Ready<T>;
};
