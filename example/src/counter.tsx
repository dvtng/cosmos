import { model, useModel } from "@dvtng/cosmos/src/v2";
import NumberFlow from "@number-flow/react";

export const Counter = model((id: number) => {
  return {
    value: 0,
    forget: true,
    start: (state) => {
      const interval = setInterval(() => {
        state.value++;
      }, 1000);

      return () => clearInterval(interval);
    },
  };
});

export function CounterView({ id }: { id: number }) {
  const counter = useModel(Counter(id));
  return <NumberFlow value={counter.value} />;
}
