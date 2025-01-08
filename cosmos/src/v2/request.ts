import { getError } from "./get-error";
import type { MinSpec } from "./model";
import { SmartInterval, type Interval } from "./smart-interval";
import { type Suspended, suspended } from "./suspended";

export type RequestOptions = {
  refresh?: Interval;
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
          }
        } catch (error) {
          if (alive) {
            state.error = getError(error);
          }
        }
      }

      const interval = new SmartInterval(run, options.refresh);

      return () => {
        alive = false;
        interval.clear();
      };
    },
  };
}
