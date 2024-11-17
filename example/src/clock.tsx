import { model, useModel } from "@dvtng/cosmos";

export const Time = model({
  type: "Time",
  refresh: { seconds: 1 },
  async get() {
    console.log("get time");
    await new Promise((resolve) => setTimeout(resolve, 100));
    return new Date();
  },
});

export function Clock() {
  const [time] = useModel(Time());

  return <div>{time?.toLocaleTimeString()}</div>;
}
