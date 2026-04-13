import { type Duration } from "./duration";
import { asError, isError, isLoading, loading, type Later } from "./later";
import type { Behavior } from "./core";
import { Timer } from "./timer";
import { addWindowListener } from "./dom";

export type RequestOptions = {
  refresh?: Duration;
  refreshOnFocus?: boolean;
};

export function request<T>(
  fn: () => Promise<T> | T,
  options: RequestOptions = {}
): Behavior<Later<T>> {
  return {
    value: loading<T>(),
    onStart: ({ get, set }) => {
      let alive = true;

      const timer = new Timer();

      async function run() {
        try {
          const value = await fn();
          if (alive) {
            set((draft) => {
              draft.value = value;
              draft.updatedAt = Date.now();
            });
          }
        } catch (error) {
          if (alive) {
            set((draft) => {
              if (isLoading(draft.value) || isError(draft.value)) {
                draft.value = asError(error);
              }
              draft.updatedAt = Date.now();
            });
          }
        }
      }

      if (options.refresh) {
        timer.onIdle(() => {
          timer.schedule({
            run,
            duration: options.refresh,
            since: get().updatedAt,
          });
        });
      }

      const removeFocusListener = options.refreshOnFocus
        ? addWindowListener("focus", () => {
            timer.schedule({ run, since: get().updatedAt });
          })
        : undefined;

      timer.schedule({
        run,
        duration: options.refresh,
        since: get().updatedAt,
      });

      return () => {
        alive = false;
        removeFocusListener?.();
        timer.destroy();
      };
    },
  };
}
