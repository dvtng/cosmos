import type { Behavior, Model } from "./core";

let nextModelId = 0;

export function model<A extends any[], V>(resolve: Resolve<A, V>): Model<A, V>;

export function model<A extends any[], V>(
  identity: string | Identity<A>,
  resolve: Resolve<A, V>
): Model<A, V>;

export function model<A extends any[], V>(
  identity: string | Identity<A> | Resolve<A, V>,
  resolve?: Resolve<A, V>
): Model<A, V> {
  // Create a default identity if one is not provided
  if (typeof identity === "function") {
    return model(toIdentity({}), identity);
  }

  const _identity = toIdentity(identity);
  const _resolve = resolve!;

  return (...args) => {
    return {
      name: _identity.name,
      args: _identity.args(...args),
      resolve: () => _resolve(...args),
    };
  };
}

type Identity<A extends any[]> = {
  name: string;
  args: (...args: A) => unknown[];
};

type Resolve<A extends any[], V> = (...args: A) => Behavior<V>;

function toIdentity<A extends any[]>(
  identity: string | Partial<Identity<A>>
): Identity<A> {
  if (typeof identity === "string") {
    return {
      name: identity,
      args: (...args) => args,
    };
  }
  return {
    name: identity.name ?? `MODEL-${nextModelId++}`,
    args: identity.args ?? ((...args) => args),
  };
}
