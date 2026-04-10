# Cosmos

A reactive state management library for React, built on [valtio](https://github.com/pmndrs/valtio).

Cosmos organizes state into **models** — named, parameterized units of state with composable behaviors like async data fetching, computed derivations, lifecycle hooks, and persistence.

```
npm install @dvtng/cosmos
```

## Core concepts

### Models

A **model** is a named, reusable definition for a unit of reactive state. Models are defined with `model()` and instantiated by calling the resulting function, which produces a **spec** — a description of a particular model instance identified by its name and arguments.

```ts
import { model } from "@dvtng/cosmos";

// A simple model with no arguments
const Time = model("Time", () => ({
  value: new Date(),
  onStart(_state, setState) {
    const interval = setInterval(() => {
      setState((draft) => {
        draft.value = new Date();
      });
    }, 1000);
    return () => clearInterval(interval);
  },
}));

// A parameterized model
const Counter = model(
  { name: "Counter", args: (id: number) => [{ id }] },
  () => ({
    value: 0,
    forget: true,
    onStart(_state, setState) {
      const interval = setInterval(() => {
        setState((draft) => {
          draft.value++;
        });
      }, 1000);
      return () => clearInterval(interval);
    },
  })
);
```

Models are **lazy** — their state is only created when first accessed (via `useModel`, `getModel`, or `compute`). When all subscribers are removed, the model's `onStart` cleanup runs after a short keep-alive period, and if `forget` is set, the state is eventually deleted entirely.

### Behaviors and Traits

A model's resolve function returns a **behavior** — an object describing the model's initial value and lifecycle hooks:

```ts
type State<T> = { value: T; updatedAt: number };
type SetState<T> = (recipe: (draft: State<T>) => void) => void;

type Behavior<T> = {
  value: T;                // Initial value (required)
  forget?: Duration | true;  // How long to retain state after all subscribers leave
  onLoad?: (state, setState, meta) => void;          // Called once when state is first created
  onStart?: (state, setState, meta) => (() => void) | void;  // Called when first subscriber arrives
  onWrite?: (state, meta) => void;         // Called on every state change
  onDelete?: (state, meta) => void;        // Called when state is deleted
};
```

`setState` applies an [Immer](https://immerjs.github.io/immer/) recipe to the model's `State<T>` (`value` and `updatedAt`), then notifies subscribers — the same mechanism as `setModel`.

A **trait** is a behavior without a `value` — it adds lifecycle hooks without defining the initial value. Traits are used by helpers like `persist()`.

The resolve function can return either a single behavior object, or an **array** containing one behavior and any number of traits. When an array is returned, the behaviors and traits are merged: lifecycle hooks are composed (all run), the `value` is taken from the behavior, and `forget` uses the first defined value.

```ts
const AppState = model("AppState", () => {
  return [
    value({ nextCounterId: 0, counters: [] as number[] }),
    persist("AppState"),
  ];
});
```

### Snapshots and the `Later` type

Models that use `request()` or `compute()` with async sources produce values of type `Later<T>`, which is `T | Loading | Error`. When you access a model via `useModel` or `compute`, you get a **snapshot** with two ways to read it:

- **`snapshot.value`** — Returns the resolved value directly. If the model is still loading, it throws a promise (for React Suspense). If it errored, it throws the error.
- **`snapshot.map({ value, loading, error })`** — Pattern-matches on the state, letting you handle each case explicitly:

```tsx
coinPrice.map({
  loading: () => <div>Loading...</div>,
  error: (error) => <div>{error.message}</div>,
  value: (price) => <span>${price}</span>,
});
```

### Lifecycle

1. **Creation** — When a model is first accessed, `resolve()` runs to produce the behavior. The state is initialized with `behavior.value`. `onLoad` is called.
2. **Start** — When the first subscriber arrives, `onStart` is called with `setState` for Immer-style updates. It may return a cleanup function.
3. **Active** — While there are subscribers, the model is alive. `onWrite` fires on every state mutation.
4. **Stop** — When the last subscriber leaves, after a 1-second keep-alive delay, the cleanup from `onStart` runs.
5. **Forget** — If `forget` is set, after the stop cleanup runs, the state is deleted after the specified duration. `onDelete` is called.

If a new subscriber arrives during the keep-alive or forget window, the timers are cancelled and the model stays alive.

## API reference

### `model(name, resolve)` / `model(identity, resolve)`

Defines a model. Returns a function that produces a spec when called.

**Signatures:**

```ts
function model<A extends any[], V>(
  resolve: (...args: A) => Behavior<V> | Traits<V>
): Model<A, V>;

function model<A extends any[], V>(
  identity: string | { name: string; args: (...args: A) => unknown[] },
  resolve: (...args: A) => Behavior<V> | Traits<V>
): Model<A, V>;
```

**Parameters:**

- `identity` — A string name, or an object with `name` and an `args` function that maps arguments to a serializable identity array. If omitted, an auto-generated name is used.
- `resolve` — A function that receives the model's arguments and returns a behavior (or array of behavior + traits).

The `args` function controls how model instances are identified. Two calls that produce the same serialized args share the same state:

```ts
const Counter = model(
  { name: "Counter", args: (id: number) => [{ id }] },
  () => ({ value: 0 })
);
Counter(1); // same instance as another Counter(1)
```

---

### `useModel(spec)`

React hook that subscribes a component to a model instance. Returns a snapshot.

```ts
function useModel<T>(spec: Spec<T>): Snapshot<T>;
```

The component re-renders when the model's state changes. If the model's value is `Later<T>` and is in a loading state, accessing `snapshot.value` throws a promise (triggering React Suspense). If it errored, accessing `snapshot.value` throws the error.

```tsx
function Clock() {
  const time = useModel(Time());
  return <div>{time.value.toLocaleTimeString()}</div>;
}
```

---

### `getModel(spec)`

Accesses a model's state outside of React. Returns the state object with `.value` and `.updatedAt`, plus `.then`/`.catch`/`.finally` methods for awaiting async models.

```ts
function getModel<T>(spec: Spec<T>): GetModelResult<T>;
```

Useful when you need the current state or async resolution outside React. To update state from event handlers or other imperative code, use `setModel`:

```ts
setModel(AppState(), (draft) => {
  draft.value.counters.push(draft.value.nextCounterId++);
});
```

For async models, you can await the result:

```ts
const { value } = await getModel(CoinPrice("btc-bitcoin"));
```

---

### `setModel(spec, recipe)`

Sets a model's state from outside React using an Immer recipe (same shape as `setState` in `onStart` / `onLoad`).

```ts
function setModel<T>(spec: Spec<T>, recipe: (draft: State<T>) => void): void;
```

```ts
setModel(Counter(1), (draft) => {
  draft.value = 42;
});
```

---

### `value(initialValue)`

Creates a simple behavior with just an initial value and no lifecycle hooks.

```ts
function value<T>(value: T): Behavior<T>;
```

```ts
const Settings = model("Settings", () => value({ theme: "dark" }));
```

---

### `compute(fn, options?)`

Creates a behavior whose value is derived from other models. The value automatically updates when any dependency changes.

```ts
function compute<T>(
  fn: (get: GetSnapshot) => Later<T>,
  options?: { defaultValue?: T }
): Behavior<Later<T>>;
```

**Parameters:**

- `fn` — A function that receives a `get` helper. Call `get(spec)` to read another model's snapshot and subscribe to its changes.
- `options.defaultValue` — If provided, loading and error states from dependencies are replaced with this value, and the return type narrows to `Behavior<T>`.

Dependencies are tracked dynamically — if the set of models you `get()` changes between runs, subscriptions are updated accordingly.

```ts
const CounterTotal = model("CounterTotal", () => {
  return compute((get) => {
    return get(AppState()).value.counters.reduce((acc, id) => {
      return acc + get(Counter(id)).value;
    }, 0);
  });
});
```

---

### `request(fn, options?)`

Creates a behavior for async data fetching. The value is `Later<T>` — initially loading, then either the resolved value or an error.

```ts
function request<T>(
  fn: () => Promise<T> | T,
  options?: RequestOptions
): Behavior<Later<T>>;
```

**`RequestOptions`:**

| Option | Type | Description |
|---|---|---|
| `refresh` | `Duration` | Automatically re-fetch on an interval after the last update. |
| `refreshOnFocus` | `boolean` | Re-fetch when the window regains focus. |

```ts
const CoinPrice = model("CoinPrice", (coinId: string) => {
  return [
    request(() => fetchCoinPrice(coinId), { refresh: { seconds: 10 } }),
    persist("CoinPrice"),
  ];
});
```

When used with `useModel`, accessing `snapshot.value` integrates with React Suspense (throws a promise while loading). Use `snapshot.map()` for explicit handling of all states:

```tsx
function CoinPriceView({ coinId }: { coinId: string }) {
  const coinPrice = useModel(CoinPrice(coinId));

  return coinPrice.map({
    loading: () => <div>Loading...</div>,
    error: (error) => <div>{error.message}</div>,
    value: (price) => <span>${price.toFixed(2)}</span>,
  });
}
```

---

### `persist(key, options?)`

Creates a trait that persists a model's state to storage. Restores state on load and saves on every change. Errors are not persisted.

```ts
function persist<T>(key: string, options?: PersistOptions<T>): Trait<T>;
```

**`PersistOptions`:**

| Option | Type | Default | Description |
|---|---|---|---|
| `serialize` | `(state: State<T>) => string` | `JSON.stringify` | Custom serialization. |
| `parse` | `(serialized: string) => State<T>` | `JSON.parse` | Custom deserialization. |
| `storage` | `Storage` | `localStorage` | Storage backend (must implement the `Storage` interface). |

The storage key format is `cosmos:{key}:{serializedArgs}`.

```ts
const AppState = model("AppState", () => [
  value({ count: 0 }),
  persist("AppState"),
]);
```

---

### `ref(value)`

Re-exported from valtio. Wraps a value so that valtio does not proxy it. Use this for values that should not be deeply reactive (e.g., DOM elements, class instances).

```ts
import { ref } from "@dvtng/cosmos";
```

---

### `isReady(snapshot)`

Returns `true` if the snapshot has a resolved value (not loading or errored).

```ts
function isReady<T>(snapshot: Snapshot<T>): boolean;
```

---

### `Duration`

An object specifying a time duration, used by `request({ refresh })` and `Behavior.forget`:

```ts
type Duration = Partial<{
  ms: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
}>;
```

Multiple fields are additive: `{ minutes: 1, seconds: 30 }` = 90 seconds.

Setting `forget: true` is equivalent to `forget: { ms: 0 }` — state is deleted immediately after the stop timer.

---

### `ModelArgs<T>` / `ModelValue<T>`

Utility types for extracting the argument tuple and value type from a model type.

```ts
type ModelArgs<T extends Model<any, any>>  // => argument tuple
type ModelValue<T extends Model<any, any>> // => value type
```
