import { model, useModel } from "@dvtng/cosmos/src/index";

let count = 0;

export const CounterOnFocus = model({
  type: "CounterOnFocus",
  refresh: { onFocus: true },
  async get() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return ++count;
  },
});

export function CounterOnFocusView() {
  const [counter] = useModel(CounterOnFocus());

  return <div>{counter}</div>;
}
