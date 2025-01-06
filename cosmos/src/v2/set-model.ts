import type { Query, State } from "./core";
import { initQueryState } from "./state";

export function setModel<TArgs extends any[], TValue>(
  query: Query<TArgs, TValue>,
  setter: (state: State<TValue>) => void
) {
  const queryState = initQueryState(query);
  setter(queryState);
}
