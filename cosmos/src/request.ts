import { asError, isError, isLoading, loading, type Later } from "./later";
import type { Behavior } from "./core";
import type { Duration } from "./duration";
import { combineBehavior } from "./combine-behavior";
import { refresh } from "./refresh";

export type RequestOptions = {
  refreshInterval?: Duration;
  refreshOnFocus?: boolean;
};

export function request<T>(
  fn: () => Promise<T> | T,
  options: RequestOptions = {},
): Behavior<Later<T>> {
  return combineBehavior([
    { value: loading<T>() },
    refresh({
      interval: options.refreshInterval,
      onFocus: options.refreshOnFocus,
      immediate: true,
      run: async (ctx) => {
        try {
          const value = await fn();
          ctx.set((state) => {
            state.value = value;
          });
        } catch (error) {
          ctx.set((draft) => {
            if (isLoading(draft.value) || isError(draft.value)) {
              draft.value = asError(error);
            }
          });
        }
      },
    }),
  ]);
}
