export type Duration = Partial<{
  ms: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
}>;

export function toMs(duration: Duration | true, fallback?: number): number;

export function toMs<T>(
  duration: Duration | true | undefined,
  fallback: T
): number | T;

export function toMs<T>(
  duration: Duration | true | undefined,
  fallback = 0
): number | T {
  if (!duration) {
    return fallback;
  }

  if (duration === true) {
    return 0;
  }

  let isSet = false;
  let ms = 0;

  for (const [unit, value] of Object.entries(duration)) {
    switch (unit) {
      case "ms":
        isSet = true;
        ms += value;
        break;
      case "seconds":
        isSet = true;
        ms += value * 1000;
        break;
      case "minutes":
        isSet = true;
        ms += value * 1000 * 60;
        break;
      case "hours":
        isSet = true;
        ms += value * 1000 * 60 * 60;
        break;
      case "days":
        isSet = true;
        ms += value * 1000 * 60 * 60 * 24;
        break;
    }
  }

  return isSet ? ms : fallback;
}
