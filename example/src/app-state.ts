import { model, persist, value } from "@dvtng/cosmos/src/v2";

export const AppState = model("AppState", () => {
  return [
    value({
      nextCounterId: 0,
      counters: [] as number[],
    }),
    persist("AppState"),
  ];
});
