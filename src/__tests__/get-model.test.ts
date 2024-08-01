import { expect, test, beforeEach } from "bun:test";
import { model } from "../model";
import { getModel } from "../get-model";
import { reset } from "../state";
import { Null } from "../null";

let count = 0;

const Counter = model({
  type: "Counter",
  refresh: { seconds: 60 },
  async get() {
    return ++count;
  },
});

beforeEach(() => {
  count = 0;
  reset(Counter());
});

test("getModel", async () => {
  const [count] = await getModel(Counter());
  expect(count).toBe(1);
});

test("getModel uses cached value", async () => {
  await getModel(Counter());
  const [count] = await getModel(Counter());
  expect(count).toBe(1);
});

test("force model to update", async () => {
  await getModel(Counter());
  reset(Counter());
  const [count] = await getModel(Counter());
  expect(count).toBe(2);
});

test("get null model", async () => {
  const enabled = false;
  const [value] = await getModel(enabled ? Counter() : Null());
  expect(value).toBe(null);
});

test("get expiry", async () => {
  const now = Date.now();
  const [_, { expiry }] = await getModel(Counter());
  expect(expiry).toBe(now + 60 * 1000);
});
