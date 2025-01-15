import type { Model } from "../core-types";
import { toMs, type Duration } from "../duration";
import { setSmartTimeout } from "../set-smart-timeout";

/**
 * A GetterModel is an asynchronous request/response style model.
 * A get() function returns a promise with the value.
 */
export type GetterModel<T, P extends object | void> = {
  type: string;
  get: (params: P, tools: Tools) => Promise<T>;
  refresh?: RefreshInterval;
};

export type RefreshInterval = Duration & {
  onFocus?: boolean;
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

        model
          .get(params, { refreshIn })
          .then(
            (value) => {
              atom.value = value;
            },
            (e) => {
              // TODO handle errors
              throw e;
            }
          )
          .finally(() => {
            if (model.refresh) {
              refreshIn(model.refresh);
            }
          });
      }

      function refreshIn(duration: Duration) {
        if (cleanedUp) {
          return;
        }

        const ms = toMs(duration);
        if (!ms) {
          return;
        }

        const expiry = Date.now() + ms;
        atom.expiry = expiry;
        if (scheduledRefreshTime == null || expiry < scheduledRefreshTime) {
          clearTimer?.();
          scheduledRefreshTime = expiry;
          clearTimer = setSmartTimeout(get, ms);
        }
      }

      if (model.refresh?.onFocus) {
        window.addEventListener("focus", get);
      }

      get();

      return function cleanup() {
        cleanedUp = true;
        clearTimer?.();
        if (model.refresh?.onFocus) {
          window.removeEventListener("focus", get);
        }
      };
    },
  };
}
