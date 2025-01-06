import { toMs, type Duration } from "../duration";
import { setSmartTimer } from "../smart-timer";

export type Interval = Duration & {
  onFocus?: boolean;
};

export class SmartInterval {
  cleanupTimer: (() => void) | undefined;
  cleanupFocus: (() => void) | undefined;

  constructor(private fn: () => unknown, private interval?: Interval) {
    this.watchFocus();
    this.run();
  }

  clear() {
    this.cleanupTimer?.();
    this.cleanupFocus?.();
  }

  schedule(duration: Duration) {
    const durationMs = toMs(duration, null);
    if (durationMs == null) {
      return;
    }

    this.cleanupTimer?.();
    this.cleanupTimer = setSmartTimer(() => {
      this.run();
    }, durationMs);
  }

  private async run() {
    try {
      await this.fn();
    } catch (error) {
      console.error(error);
    }

    if (this.interval) {
      this.schedule(this.interval);
    }
  }

  private watchFocus() {
    if (!this.interval?.onFocus) {
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
