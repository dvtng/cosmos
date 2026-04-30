import { forget, model, useModel } from "@dvtng/cosmos";
import NumberFlow from "@number-flow/react";

export const Counter = model(
  { name: "Counter", args: (id: number) => [{ id }] },
  () => {
    return [
      {
        value: 0,
        onStart: ({ set }) => {
          const interval = setInterval(() => {
            set((state) => {
              state.value++;
            });
          }, 1000);

          return () => clearInterval(interval);
        },
      },
      forget(),
    ];
  },
);

export function CounterView({ id }: { id: number }) {
  const counter = useModel(Counter(id));
  return <NumberFlow value={counter.value} />;
}
