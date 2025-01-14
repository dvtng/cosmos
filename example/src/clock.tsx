import { model, useModel } from "@dvtng/cosmos/src/v2";

export const Time = model(() => {
  return {
    value: () => new Date(),
    onStart(state) {
      const interval = setInterval(() => {
        state.value = new Date();
      }, 1000);
      return () => clearInterval(interval);
    },
  };
});

export function Clock() {
  const time = useModel(Time());
  return <div>{time.value.toLocaleTimeString()}</div>;
}
