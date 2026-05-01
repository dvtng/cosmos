import { model, refresh, useModel } from "@dvtng/cosmos";

export const Time = model("Time", () => {
  return [
    { value: new Date() },
    refresh({
      interval: { seconds: 1 },
      run: (ctx) => {
        ctx.set((state) => {
          state.value = new Date();
        });
      },
    }),
  ];
});

export function Clock() {
  const time = useModel(Time());
  return <div>{time.value.toLocaleTimeString()}</div>;
}
