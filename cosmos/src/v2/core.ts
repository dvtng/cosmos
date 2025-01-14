import type { Duration } from "../duration";
import type { Cases, Ready } from "./later";

export type State<T> = {
  value: T;
  updatedAt: number;
};

export type InternalState<T> = State<T> & {
  internal: {
    alive: boolean;
    behavior: Behavior<T>;
    promise: Promise<State<Ready<T>>> | undefined;
    subscribers: Set<number>;
    stop: (() => void) | undefined;
    clearStopTimer: (() => void) | undefined;
    clearForgetTimer: (() => void) | undefined;
    onDeleteHandlers: (() => void)[];
  };
};

export type Model<A extends any[], T> = (...args: A) => Spec<T>;

export type Spec<T> = {
  name: string;
  args: unknown[];
  resolve: () => Behavior<T>;
};

export type Behavior<T> = {
  value: T;
  forget?: Duration | true;
  onLoad?: (state: State<T>) => void;
  onStart?: (state: State<T>) => (() => void) | void;
  onWrite?: (state: State<T>) => void;
  onDelete?: () => void;
};

export type Trait<T> = Partial<Behavior<T>>;

export type Snapshot<T> = {
  match: <V>(cases: Cases<T, V>) => V;
  value: Ready<T>;
};
