/**
 * Timer that pauses when the page is backgrounded.
 */

const hasDoc = typeof window !== "undefined" && "document" in window;

export const setSmartTimer = (
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
      timerId = setTimeout(run, 0);
    } else {
      timerId = setTimeout(run, _timeout - elapsedTime);
    }
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      pause();
    } else {
      resume();
    }
  };

  const cleanup = () => {
    if (hasDoc) {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("freeze", pause);
      document.removeEventListener("resume", resume);
    }
    pause();
  };

  const run = () => {
    cleanup();
    if (!hasRun) {
      hasRun = true;
      fn();
    }
  };

  if (!hasDoc || !document.hidden) {
    timerId = setTimeout(run, _timeout);
  }

  if (hasDoc) {
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("freeze", pause);
    document.addEventListener("resume", resume);
  }

  return cleanup;
};
