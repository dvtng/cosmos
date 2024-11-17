import { model, useModel } from "@dvtng/cosmos/src/index";

let count = 0;

export const Counter = model({
  type: "Counter",
  refresh: { seconds: 1 },
  async get() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return ++count;
  },
});

export function CounterView() {
  const [counter] = useModel(Counter());

  return <div>{counter}</div>;
}
