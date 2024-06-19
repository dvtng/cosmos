/**
 * A model describes how data is retrieved and updated over time.
 *
 * Models can have params. Each unique set of params initializes a new
 * model instance.
 */
export type Model<T, P extends object | void> = {
  // Globally unique type name for this model.
  type: string;
  // All logic for how this model's data is retrieved and updated over time
  // is contained in this init function.
  // It's called once for each unique set of params.
  init: (args: { params: P; atom: Atom<T> }) => void | (() => void);
};

/**
 * An atom contains the state needed to manage a single model instance.
 */
export type Atom<T = unknown> = {
  value: T | undefined;
  initialized: boolean;
  subscribers: Set<number>;
  cleanup?: () => void;
  promise?: Promise<T>;
};

/**
 * A query for a model instance.
 */
export type Query<T, P extends object | void> = {
  $key: string; // Serialized model type and params.
  model: Model<T, P>;
  params: P;
};

/**
 * useModel enables synchronous access to a model instance's current value.
 */
export type UseModel = {
  // When wait: true, we can assume that the value is available.
  <T, P extends object | void = void>(
    query: Query<T, P>,
    options: { wait: true }
  ): T;

  // Otherwise, value can be undefined.
  <T, P extends object | void = void>(
    query: Query<T, P> | null | undefined,
    options?: { wait?: boolean }
  ): T | undefined;
};
