import { type Duration } from "./duration";
import { asError, loading, type Later } from "./later";
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
    onStart: (state) => {
      let alive = true;

      const timer = new Timer();

      async function run() {
        try {
          const value = await fn();
          if (alive) {
            state.value = value;
            state.updatedAt = Date.now();
          }
        } catch (error) {
          if (alive) {
            state.value = asError(error);
            state.updatedAt = Date.now();
          }
        }
      }

      if (options.refresh) {
        timer.onIdle(() => {
          timer.schedule({
            run,
            duration: options.refresh,
            since: state.updatedAt,
          });
        });
      }

      const removeFocusListener = options.refreshOnFocus
        ? addWindowListener("focus", () => {
            timer.schedule({ run, since: state.updatedAt });
          })
        : undefined;

      timer.schedule({
        run,
        duration: options.refresh,
        since: state.updatedAt,
      });

      return () => {
        alive = false;
        removeFocusListener?.();
        timer.destroy();
      };
    },
  };
}
