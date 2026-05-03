import type { Duration } from "./duration";
import type { ModelContext, Trait } from "./core";
import { Timer } from "./timer";
import { addWindowListener } from "./dom";

export type RefreshOptions<T> = {
  interval?: Duration;
  onFocus?: boolean;
  immediate?: boolean;
  run: (context: ModelContext<T>) => void | Promise<void>;
};

/**
 * Trait that refreshes the model's state at a regular interval, and/or
 * when the window regains focus.
 */
export function refresh<T>(options: RefreshOptions<T>): Trait<T> {
  const { run, interval, immediate, onFocus } = options;

  return {
    onStart: (ctx) => {
      const timer = new Timer();

      async function tick() {
        await run(ctx);
        ctx.set((draft) => {
          draft.updatedAt = Date.now();
        });
      }

      if (interval) {
        timer.onIdle(() => {
          timer.schedule({
            run: tick,
            duration: interval,
            since: ctx.get().updatedAt,
          });
        });
      }

      const removeFocusListener = onFocus
        ? addWindowListener("focus", () => {
            timer.schedule({ run: tick, since: ctx.get().updatedAt });
          })
        : undefined;

      if (immediate && ctx.get().updatedAt == null) {
        timer.schedule({ run: tick });
      } else {
        timer.schedule({
          run: tick,
          duration: interval,
          since: ctx.get().updatedAt,
        });
      }

      return () => {
        removeFocusListener?.();
        timer.destroy();
      };
    },
  };
}
