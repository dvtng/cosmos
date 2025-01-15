/**
 * A better setTimeout:
 * - pauses when the page is backgrounded.
 * - avoids setTimeout overflow.
 * - returns a cancel function.
 */

const hasDoc = typeof window !== "undefined" && "document" in window;

export const setSmartTimeout = (
  fn: () => void,
  timeout: number
): (() => void) => {
  const _timeout = Math.max(0, timeout);
  const startTime = Date.now();
  let hasRun = false;
  let timerId: Timer | number | undefined;

  const pause = () => {
    if (timerId != null) {
      clearTimeout(timerId);
    }
    timerId = undefined;
  };

  const resume = () => {
    if (timerId !== undefined) return;

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= _timeout) {
      timerId = setSafeTimeout(run, 0);
    } else {
      timerId = setSafeTimeout(run, _timeout - elapsedTime);
    }
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      pause();
    } else {
      resume();
    }
  };

  const cancel = () => {
    if (hasDoc) {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("freeze", pause);
      document.removeEventListener("resume", resume);
    }
    pause();
  };

  const run = () => {
    cancel();
    if (!hasRun) {
      hasRun = true;
      fn();
    }
  };

  if (!hasDoc || !document.hidden) {
    timerId = setSafeTimeout(run, _timeout);
  }

  if (hasDoc) {
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("freeze", pause);
    document.addEventListener("resume", resume);
  }

  return cancel;
};

const MAX_INT32 = 2 ** 31 - 1; // 24.8 days

function setSafeTimeout(fn: () => void, timeout: number) {
  if (timeout > MAX_INT32) {
    // Don't schedule, as it's unlikely to be in the lifetime of the app
    return 0;
  }

  return setTimeout(fn, timeout);
}
