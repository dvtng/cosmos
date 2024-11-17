import { expect, test } from "bun:test";
import { model } from "../model";
import { getModel } from "../get-model";
import { delay } from "./util/delay";
import { waitFor } from "../wait-for";

const Echo = model({
  type: "Echo",
  async get({ value }: { value: string }) {
    await delay(100);
    return value;
  },
});

const UppercaseEcho = model({
  derive(useModel, { value }: { value: string }) {
    const [_value] = waitFor(useModel(Echo({ value })));
    return _value.toUpperCase();
  },
});

test("derive", async () => {
  const [value] = await getModel(UppercaseEcho({ value: "test" }));
  expect(value).toBe("TEST");
});
