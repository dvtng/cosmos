import { model, useModel } from "@dvtng/cosmos";

export const Time = model("Time", () => {
  return [
    {
      value: new Date(),
      onStart({ set }) {
        const interval = setInterval(() => {
          set((state) => {
            state.value = new Date();
          });
        }, 1000);
        return () => clearInterval(interval);
      },
    },
  ];
});

export function Clock() {
  const time = useModel(Time());
  return <div>{time.value.toLocaleTimeString()}</div>;
}
