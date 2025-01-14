import { toMs, type Duration } from "../duration";
import type { MinSpec } from "./model";
import { SmartInterval } from "./smart-interval";
import { asError, later, type Later } from "./later";

export type RequestOptions = {
  refresh?: Duration;
  refreshOnFocus?: boolean;
};

export function request<T>(
  fn: () => Promise<T> | T,
  options: RequestOptions = {}
): MinSpec<Later<T>> {
  return {
    value: later<T>(),
    forget: { minutes: 10 },
    onStart: (state) => {
      let alive = true;

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
          }
        }
      }

      const refreshMs = options.refreshOnFocus ? 0 : toMs(options.refresh, 0);
      const initialMs = Math.max(0, refreshMs - (Date.now() - state.updatedAt));
      const interval = new SmartInterval(run, {
        initial: { ms: initialMs },
        interval: options.refresh,
        onFocus: options.refreshOnFocus,
      });

      return () => {
        alive = false;
        interval.clear();
      };
    },
  };
}
