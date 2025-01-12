import { toMs, type Duration } from "../duration";
import { setSmartTimer } from "../smart-timer";

export type SmartIntervalOptions = {
  initial?: Duration;
  interval?: Duration;
  onFocus?: boolean;
};

export class SmartInterval {
  cleanupTimer: (() => void) | undefined;
  cleanupFocus: (() => void) | undefined;

  constructor(
    private fn: () => unknown,
    private options: SmartIntervalOptions
  ) {
    this.watchFocus();
    const scheduled = this.schedule(this.options.initial);
    if (!scheduled) {
      this.schedule(this.options.interval);
    }
  }

  clear() {
    this.cleanupTimer?.();
    this.cleanupFocus?.();
  }

  schedule(duration: Duration | undefined) {
    const durationMs = toMs(duration, null);
    if (durationMs == null) {
      return false;
    }

    this.cleanupTimer?.();
    this.cleanupTimer = setSmartTimer(() => {
      this.run();
    }, durationMs);
    return true;
  }

  private async run() {
    try {
      await this.fn();
    } catch (error) {
      console.error(error);
    }

    this.schedule(this.options.interval);
  }

  private watchFocus() {
    if (!this.options.onFocus) {
      return;
    }

    const onFocus = () => {
      this.schedule({ ms: 0 });
    };

    window.addEventListener("focus", onFocus);

    this.cleanupFocus = () => {
      window.removeEventListener("focus", onFocus);
    };
  }
}
