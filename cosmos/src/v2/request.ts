import { toMs, type Duration } from "../duration";
import { getError } from "./get-error";
import type { MinSpec } from "./model";
import { SmartInterval } from "./smart-interval";
import { type Suspended, suspended } from "./suspended";

export type RequestOptions = {
  refresh?: Duration;
  refreshOnFocus?: boolean;
};

export function request<T>(
  fn: () => Promise<T> | T,
  options: RequestOptions = {}
): MinSpec<Suspended<T>> {
  return {
    value: suspended<T>(),
    forget: { minutes: 10 },
    start: (state) => {
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
            state.error = getError(error);
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
