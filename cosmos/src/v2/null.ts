import { model } from "./model";

export const Null = model("$NULL", () => {
  return {
    value: null,
  };
});
