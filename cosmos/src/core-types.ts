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
  promise?: Promise<Atom<T>>;
  expiry?: number;
};

/**
 * A query for a model instance.
 */
export type Query<T = any, P extends object | void = any> = {
  $key: string; // Serialized model type and params.
  model: Model<T, P>;
  params: P;
};

/**
 * Infer a query's model type
 */
export type QueryType<Q extends Query> = Q extends Query<infer T> ? T : never;

/**
 * useModel enables synchronous access to a model instance's current value.
 */
export type UseModel = <Q extends Query>(
  query: Q
) => ModelResult<QueryType<Q> | undefined>;

export type ModelResult<T> = [T, Atom<T>, Query<T>];
