import { model } from "./model";

export const Null = model({
  type: "$NULL",
  async get() {
    return null;
  },
});
