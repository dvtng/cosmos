import type { Duration } from "./duration";
import type { Ready } from "./later";
import type { Mapper } from "./later-map";

export type State<T> = {
  value: T;
  updatedAt: number;
};

export type Space<T> = {
  state: State<T>;
  internal: {
    alive: boolean;
    behavior: Behavior<T>;
    promise: Promise<State<Ready<T>>> | undefined;
    subscribers: Set<number>;
    listeners: Set<() => void>;
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

export type SetState<T> = (recipe: (state: State<T>) => void) => void;

export type HookContext<T> = {
  get: () => State<T>;
  set: SetState<T>;
  meta: Meta;
};

export type Behavior<T> = {
  value: T;
  forget?: Duration | true;
  onLoad?: (context: HookContext<T>) => void;
  onStart?: (context: HookContext<T>) => (() => void) | void;
  onWrite?: (context: HookContext<T>) => void;
  onDelete?: (context: HookContext<T>) => void;
};

export type Trait<T> = Omit<Behavior<T>, "value">;

export type Meta = {
  name: string;
  args: unknown[];
};

export type Snapshot<T> = {
  map: Mapper<T, Ready<T>, never, never>;
  value: Ready<T>;
};
