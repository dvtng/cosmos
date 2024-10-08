import type { Model } from "../core-types";
import { toMs, type Duration } from "../duration";
import { setSmartTimer } from "../smart-timer";

/**
 * A GetterModel is an asynchronous request/response style model.
 * A get() function returns a promise with the value.
 */
export type GetterModel<T, P extends object | void> = {
  type: string;
  get: (params: P, tools: Tools) => Promise<T>;
  refresh?: Duration;
};

type Tools = {
  refreshIn: (duration: Duration) => void;
};

export function isGetterModel<T, P extends object | void>(
  model: any
): model is GetterModel<T, P> {
  return "get" in model;
}

export function fromGetterModel<T, P extends object | void>(
  model: GetterModel<T, P>
): Model<T, P> {
  return {
    type: model.type,
    init({ params, atom }) {
      let cleanedUp = false;
      let scheduledRefreshTime: number | null = null;
      let clearTimer: (() => void) | undefined;

      function get() {
        if (cleanedUp) {
          return;
        }

        scheduledRefreshTime = null;

        model.get(params, { refreshIn }).then(
          (value) => {
            atom.value = value;
          },
          (e) => {
            // TODO handle errors
            throw e;
          }
        );
      }

      function refreshIn(duration: Duration) {
        if (cleanedUp) {
          return;
        }

        const ms = toMs(duration);
        const expiry = Date.now() + ms;
        atom.expiry = expiry;
        if (scheduledRefreshTime == null || expiry < scheduledRefreshTime) {
          clearTimer?.();
          scheduledRefreshTime = expiry;
          clearTimer = setSmartTimer(get, ms);
        }
      }

      get();

      if (model.refresh) {
        refreshIn(model.refresh);
      }

      return function cleanup() {
        cleanedUp = true;
        clearTimer?.();
      };
    },
  };
}
