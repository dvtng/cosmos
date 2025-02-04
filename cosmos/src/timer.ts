import { toMs, type Duration } from "./duration";
import { setSmartTimeout } from "./set-smart-timeout";

type ScheduledEvent = {
  time: number;
  cancel: () => void;
};

/**
 * Timer that only allows one scheduled event at a time.
 */
export class Timer {
  private scheduled: ScheduledEvent | undefined = undefined;
  private onIdleHandlers: (() => void)[] = [];

  schedule({
    run,
    duration,
    since,
  }: {
    run: () => unknown;
    duration?: Duration;
    since?: number;
  }): boolean {
    const now = Date.now();
    const proposedTime = Math.max(now, (since ?? now) + toMs(duration, 0));

    if (this.scheduled) {
      if (proposedTime >= this.scheduled.time) {
        return false;
      }
    }

    this.cancel();

    const delayMs = proposedTime - now;
    this.scheduled = {
      time: proposedTime,
      cancel: setSmartTimeout(async () => {
        try {
          await run();
        } finally {
          this.scheduled = undefined;
          this.onIdleHandlers.forEach((handler) => handler());
        }
      }, delayMs),
    };
    return true;
  }

  onIdle(handler: () => void) {
    const _handler = () => handler();
    this.onIdleHandlers.push(_handler);
    return () => {
      this.onIdleHandlers = this.onIdleHandlers.filter((h) => h !== _handler);
    };
  }

  destroy() {
    this.cancel();
    this.onIdleHandlers = [];
  }

  private cancel() {
    if (this.scheduled) {
      this.scheduled.cancel();
      this.scheduled = undefined;
    }
  }
}
