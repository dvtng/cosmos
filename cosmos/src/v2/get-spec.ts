import type { Query, CompleteSpec } from "./core";

/**
 * Get the spec for a query.
 */
export function getSpec<TArgs extends any[], TValue>(
  query: Query<TArgs, TValue>
): CompleteSpec<TValue> {
  const { forget, ...spec } = query.resolve(...query.args);
  return {
    key: query.key,
    args: undefined,
    error: undefined,
    start: () => {},
    forget: forget === true ? { ms: 0 } : forget,
    ...spec,
  };
}
