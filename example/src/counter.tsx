import { model, useModel } from "@dvtng/cosmos";
import NumberFlow from "@number-flow/react";

export const Counter = model(
  { name: "Counter", args: (id: number) => [{ id }] },
  () => {
    return {
      value: 0,
      forget: true,
      onStart: (state) => {
        const interval = setInterval(() => {
          state.value++;
        }, 1000);

        return () => clearInterval(interval);
      },
    };
  }
);

export function CounterView({ id }: { id: number }) {
  const counter = useModel(Counter(id));
  return <NumberFlow value={counter.value} />;
}
