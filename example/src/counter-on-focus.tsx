import { model, request, useModel } from "@dvtng/cosmos/src/v2";
import NumberFlow from "@number-flow/react";

let count = 0;

export const CounterOnFocus = model("CounterOnFocus", () => {
  return request(() => count++, {
    refreshOnFocus: true,
  });
});

export function CounterOnFocusView() {
  const counter = useModel(CounterOnFocus());

  return <NumberFlow value={counter.value} />;
}
