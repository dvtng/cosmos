export type Duration = Partial<{
  ms: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
}>;

export function toMs(duration: Duration): number {
  let ms = 0;

  for (const [unit, value] of Object.entries(duration)) {
    switch (unit) {
      case "ms":
        ms += value;
        break;
      case "seconds":
        ms += value * 1000;
        break;
      case "minutes":
        ms += value * 1000 * 60;
        break;
      case "hours":
        ms += value * 1000 * 60 * 60;
        break;
      case "days":
        ms += value * 1000 * 60 * 60 * 24;
        break;
    }
  }

  return ms;
}
