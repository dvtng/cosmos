export type Immutable<T> = T extends ImmutableIgnore
  ? T
  : T extends Promise<unknown>
  ? Awaited<T>
  : T extends object
  ? { readonly [K in keyof T]: Immutable<T[K]> }
  : T;

type AnyFunction = (...args: any[]) => any;

type Primitive = string | number | boolean | null | undefined | symbol | bigint;

type ImmutableIgnore =
  | Date
  | Map<any, any>
  | Set<any>
  | WeakMap<any, any>
  | WeakSet<any>
  | Error
  | RegExp
  | AnyFunction
  | Primitive;
