import { expect, test, beforeEach } from "bun:test";
import { model } from "../model";
import { getModel } from "../get-model";
import { reset } from "../state";

let count = 0;

const Counter = model({
  type: "Counter",
  async get() {
    return ++count;
  },
});

beforeEach(() => {
  count = 0;
  reset(Counter());
});

test("getModel", async () => {
  const count = await getModel(Counter());
  expect(count).toBe(1);
});

test("getModel uses cached value", async () => {
  await getModel(Counter());
  const count = await getModel(Counter());
  expect(count).toBe(1);
});

test("force model to update", async () => {
  await getModel(Counter());
  reset(Counter());
  const count = await getModel(Counter());
  expect(count).toBe(2);
});
