import { expect, test } from "bun:test";
import { model, getModel, request, compute } from "../index";
import { delay } from "./util/delay";

const Echo = model((value: string) => {
  return request(async () => {
    await delay(100);
    return value;
  });
});

const UppercaseEcho = model((value: string) => {
  return compute((get) => {
    return get(Echo(value)).value.toUpperCase();
  });
});

test("getModel", async () => {
  const uppercaseEcho = await getModel(UppercaseEcho("test"));
  expect(uppercaseEcho.value).toBe("TEST");
});
